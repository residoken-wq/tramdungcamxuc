/**
 * EB-09: Pure CSS sanitizer with block and page scoping.
 *
 * REVIEW-REQUIRED:
 * Server-side CSS filtering to prevent XSS, stylesheet breakouts, external resource
 * leaks, and unconstrained global style overrides.
 *
 * Rules:
 * 1. Hard character limits (block: 5,000 chars; page: 20,000 chars).
 * 2. Absolute rejection of dangerous tokens (<, </style, @import, @charset, @namespace,
 *    @font-face, expression(, javascript:, vbscript:, behavior, -moz-binding, \ backslash).
 * 3. Strict comment validation: unclosed or orphaned comments trigger complete rejection.
 * 4. Balanced braces {} validation.
 * 5. url(...) only allows relative /api/media/file/... via cleanImageUrl. Invalid url(...) drops
 *    the entire declaration.
 * 6. Block custom CSS requires `selector` keyword at the beginning of each selector part.
 *    Any rule without `selector` is dropped. `selector` is replaced with [data-eb-id="<id>"].
 * 7. Page custom CSS is scoped under [data-eb-page] to prevent leaking into header/footer/admin.
 */

import { cleanImageUrl } from './container-schema'
import { isSafeBlockId, STYLE_ATTR } from './css-shared'

export const MAX_BLOCK_CUSTOM_CSS_LENGTH = 5000
export const MAX_PAGE_CUSTOM_CSS_LENGTH = 20000
export const PAGE_ATTR = 'data-eb-page'

const FORBIDDEN_PATTERNS = [
  /<[a-zA-Z!/]/, // HTML opening/closing tags or comments
  /<\s*\/\s*style/i,
  /@\s*import/i,
  /@\s*charset/i,
  /@\s*namespace/i,
  /@\s*font-face/i,
  /expression\s*\(/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /behavior/i,
  /-moz-binding/i,
]

interface ParsedRule {
  preamble: string
  body: string
  isMedia: boolean
}

/**
 * Validates the raw CSS string against dangerous tokens, unclosed comments, and mismatched braces.
 * Returns the cleaned string (with valid comments removed) if valid, or null if rejected.
 */
function validateAndStripComments(raw: string, maxLength: number): string | null {
  if (typeof raw !== 'string') return null
  if (raw.length > maxLength) return null

  // Immediately reject dangerous literal characters:
  // - '<' prevents breaking out of <style> or injecting HTML
  // - '\' prevents CSS escape sequences (\3c, \6a\61\76\61, etc.)
  if (raw.includes('<') || raw.includes('\\')) return null

  // Validate comments: check for unclosed comments and strip valid comments
  const stripped = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  if (stripped.includes('/*') || stripped.includes('*/')) {
    // Unclosed /* or orphaned */ found
    return null
  }

  // Check forbidden patterns in BOTH raw and stripped text
  // (stripping comments prevents keyword splitting like @im/**/port or java/* */script:)
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(raw) || pattern.test(stripped)) {
      return null
    }
  }

  // Validate balanced braces {}
  let depth = 0
  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i]
    if (ch === '{') {
      depth++
      if (depth > 2) return null // At most @media { rule { ... } }
    } else if (ch === '}') {
      depth--
      if (depth < 0) return null
    }
  }
  if (depth !== 0) return null

  return stripped
}

/**
 * Tokenizes CSS into top-level rules and @media queries.
 */
function parseCssBlocks(css: string): ParsedRule[] {
  const blocks: ParsedRule[] = []
  let depth = 0
  let currentPreamble = ''
  let currentBody = ''

  for (let i = 0; i < css.length; i++) {
    const ch = css[i]
    if (ch === '{') {
      if (depth === 0) {
        depth = 1
      } else {
        depth++
        currentBody += ch
      }
    } else if (ch === '}') {
      depth--
      if (depth === 0) {
        const preambleTrimmed = currentPreamble.trim()
        if (preambleTrimmed) {
          const isMedia = /^@media\b/i.test(preambleTrimmed)
          // Drop non-media @-rules for safety
          if (!preambleTrimmed.startsWith('@') || isMedia) {
            blocks.push({
              preamble: preambleTrimmed,
              body: currentBody.trim(),
              isMedia,
            })
          }
        }
        currentPreamble = ''
        currentBody = ''
      } else {
        currentBody += ch
      }
    } else {
      if (depth === 0) {
        currentPreamble += ch
      } else {
        currentBody += ch
      }
    }
  }

  return blocks
}

/**
 * Filters a declaration list: verifies any url(...) references, dropping declarations that fail.
 */
function filterDeclarations(body: string): string[] {
  const declarations = body.split(';')
  const validDecls: string[] = []

  for (const decl of declarations) {
    const d = decl.trim()
    if (!d) continue

    const colonIdx = d.indexOf(':')
    if (colonIdx <= 0) continue

    // Check url(...) usages
    if (/url\s*\(/i.test(d)) {
      const urlMatches = [...d.matchAll(/url\s*\(\s*(['"]?)(.*?)\1\s*\)/gi)]
      if (urlMatches.length === 0) {
        // Malformed url(
        continue
      }
      let allValid = true
      for (const m of urlMatches) {
        const urlArg = m[2]?.trim()
        if (!urlArg || !cleanImageUrl(urlArg)) {
          allValid = false
          break
        }
      }
      if (!allValid) {
        // Drop this declaration
        continue
      }
    }

    validDecls.push(d)
  }

  return validDecls
}

const SELECTOR_KEYWORD = /^selector(?![a-zA-Z0-9_-])/i

/**
 * Sanitizes and scopes block-level custom CSS (_style.customCss).
 * Every rule MUST start with `selector`. Rules without `selector` are dropped.
 * `selector` is replaced with `[data-eb-id="<blockId>"]`.
 * Declarations without braces are wrapped as `selector { ... }`.
 *
 * REVIEW-REQUIRED:
 */
export function sanitizeBlockCustomCss(rawCss: unknown, blockId: string): string {
  if (typeof rawCss !== 'string' || !isSafeBlockId(blockId)) return ''
  let cssText = rawCss.trim()
  if (!cssText) return ''

  // If there are no braces, treat as declarations for selector { ... }
  if (!cssText.includes('{')) {
    cssText = `selector { ${cssText} }`
  }

  const validated = validateAndStripComments(cssText, MAX_BLOCK_CUSTOM_CSS_LENGTH)
  if (!validated) return ''

  const blocks = parseCssBlocks(validated)
  const result: string[] = []
  const blockSelector = `[${STYLE_ATTR}="${blockId}"]`

  function processRule(preamble: string, body: string): string | null {
    const selectorParts = preamble.split(',')
    const validSelectors: string[] = []

    for (const part of selectorParts) {
      const s = part.trim()
      if (!s) continue
      if (!SELECTOR_KEYWORD.test(s)) {
        // Drop any selector that does not start with `selector`
        continue
      }
      // Replace the leading selector keyword
      const transformed = s.replace(SELECTOR_KEYWORD, blockSelector)
      validSelectors.push(transformed)
    }

    if (validSelectors.length === 0) return null

    const decls = filterDeclarations(body)
    if (decls.length === 0) return null

    return `${validSelectors.join(', ')}{${decls.join(';')}}`
  }

  for (const block of blocks) {
    if (block.isMedia) {
      // Parse nested rules inside @media
      const innerBlocks = parseCssBlocks(block.body)
      const innerResults: string[] = []
      for (const inner of innerBlocks) {
        if (!inner.isMedia) {
          const ruleCss = processRule(inner.preamble, inner.body)
          if (ruleCss) innerResults.push(ruleCss)
        }
      }
      if (innerResults.length > 0) {
        result.push(`${block.preamble}{${innerResults.join('')}}`)
      }
    } else {
      const ruleCss = processRule(block.preamble, block.body)
      if (ruleCss) result.push(ruleCss)
    }
  }

  return result.join('')
}

/**
 * Sanitizes and scopes page-level custom CSS (root.customCss).
 * All rules are scoped under `[data-eb-page] ...` to prevent affecting outer layout/admin.
 *
 * REVIEW-REQUIRED:
 */
export function sanitizePageCustomCss(rawCss: unknown): string {
  if (typeof rawCss !== 'string') return ''
  const cssText = rawCss.trim()
  if (!cssText) return ''

  const validated = validateAndStripComments(cssText, MAX_PAGE_CUSTOM_CSS_LENGTH)
  if (!validated) return ''

  const blocks = parseCssBlocks(validated)
  const result: string[] = []
  const pageRoot = `[${PAGE_ATTR}]`

  function processPageRule(preamble: string, body: string): string | null {
    const selectorParts = preamble.split(',')
    const validSelectors: string[] = []

    for (const part of selectorParts) {
      const s = part.trim()
      if (!s) continue

      if (SELECTOR_KEYWORD.test(s)) {
        // Replace selector keyword with [data-eb-page]
        const replaced = s.replace(SELECTOR_KEYWORD, pageRoot)
        validSelectors.push(replaced)
      } else if (s.startsWith(pageRoot)) {
        validSelectors.push(s)
      } else {
        // Scope under [data-eb-page]
        validSelectors.push(`${pageRoot} ${s}`)
      }
    }

    if (validSelectors.length === 0) return null

    const decls = filterDeclarations(body)
    if (decls.length === 0) return null

    return `${validSelectors.join(', ')}{${decls.join(';')}}`
  }

  for (const block of blocks) {
    if (block.isMedia) {
      const innerBlocks = parseCssBlocks(block.body)
      const innerResults: string[] = []
      for (const inner of innerBlocks) {
        if (!inner.isMedia) {
          const ruleCss = processPageRule(inner.preamble, inner.body)
          if (ruleCss) innerResults.push(ruleCss)
        }
      }
      if (innerResults.length > 0) {
        result.push(`${block.preamble}{${innerResults.join('')}}`)
      }
    } else {
      const ruleCss = processPageRule(block.preamble, block.body)
      if (ruleCss) result.push(ruleCss)
    }
  }

  return result.join('')
}
