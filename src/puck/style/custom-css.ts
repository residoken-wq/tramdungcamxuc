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
 * 3. The input is scanned the way a browser tokenizes it (comments, quoted strings). Unclosed
 *    comments / strings, and strings holding `{`, `}`, `;` or a line break, reject the whole
 *    input: otherwise the splitter below and the browser would disagree on where a rule ends
 *    (EB-09c: `selector[x="{"], footer { … } }` reached the footer).
 * 4. Balanced braces {} (at most `@media { rule { … } }`); a plain rule with a nested block
 *    (CSS nesting) is dropped, since `& ~ *` inside it would reach other blocks.
 * 5. Selector lists and declaration lists are split outside strings / brackets, and every
 *    part must have balanced () [] – an open `(` would swallow the rules that follow.
 * 6. url(...) only allows relative /api/media/file/... via cleanImageUrl; image-set(), image(),
 *    cross-fade() and src() (which take bare string URLs) are not allowed. A failing
 *    declaration is dropped.
 * 7. Block custom CSS: every selector must start with `selector`, replaced with
 *    [data-eb-id="<id>"]. Page custom CSS: every selector is put under [data-eb-page].
 *    In both, the scoped element may not be followed by a `+` / `~` combinator, which would
 *    style its siblings (other blocks, or the site footer next to the page).
 */

import { cleanImageUrl } from './container-schema'
import { isSafeBlockId, STYLE_ATTR } from './css-shared'

export const MAX_BLOCK_CUSTOM_CSS_LENGTH = 5000
export const MAX_PAGE_CUSTOM_CSS_LENGTH = 20000
export const PAGE_ATTR = 'data-eb-page'

const FORBIDDEN_PATTERNS = [
  /<\s*\/\s*style/i,
  /@\s*import/i,
  /@\s*charset/i,
  /@\s*namespace/i,
  /@\s*font-face/i,
  /expression\s*\(/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /(?<![\w-])behavior/i, // IE `behavior:`; `scroll-behavior` stays allowed
  /-moz-binding/i,
]

/** Functions that load a resource from a bare string, bypassing the url() check. */
const STRING_URL_FUNCTIONS = /(?:image-set|\bimage|cross-fade|\bsrc)\s*\(/i

interface ParsedRule {
  preamble: string
  body: string
  isMedia: boolean
}

/**
 * Removes comments while tracking quoted strings exactly like the CSS tokenizer.
 * Returns null when the input must be rejected as a whole.
 */
function stripComments(css: string): string | null {
  let out = ''
  let i = 0
  while (i < css.length) {
    const ch = css[i]
    if (ch === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2)
      if (end === -1) return null
      i = end + 2 // removed entirely, so `java/**/script:` is caught as `javascript:`
      continue
    }
    if (ch === '"' || ch === "'") {
      const end = css.indexOf(ch, i + 1)
      if (end === -1) return null
      const inner = css.slice(i + 1, end)
      if (/[{};\n\r\f]/.test(inner)) return null
      out += css.slice(i, end + 1)
      i = end + 1
      continue
    }
    if (ch === '*' && css[i + 1] === '/') return null // orphaned */
    out += ch
    i++
  }
  return out
}

/**
 * Validates the raw CSS string against dangerous tokens, unclosed comments / strings and
 * mismatched braces. Returns the string without comments, or null if rejected.
 */
function validateAndStripComments(raw: string, maxLength: number): string | null {
  if (typeof raw !== 'string') return null
  if (raw.length > maxLength) return null

  // - '<' prevents breaking out of <style> or injecting HTML
  // - '\' prevents CSS escape sequences (\3c, \6a\61\76\61, etc.)
  if (raw.includes('<') || raw.includes('\\')) return null

  const stripped = stripComments(raw)
  if (stripped === null) return null

  // Check forbidden patterns in BOTH raw and stripped text
  // (stripping comments prevents keyword splitting like @im/**/port or java/* */script:)
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(raw) || pattern.test(stripped)) return null
  }

  // Braces never sit inside strings here (rejected above), so counting them is exact.
  let depth = 0
  for (const ch of stripped) {
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

/** Splits on `sep` outside quoted strings, () and []. */
function splitTopLevel(text: string, sep: string): string[] {
  const parts: string[] = []
  let depth = 0
  let quote = ''
  let current = ''
  for (const ch of text) {
    if (quote) {
      if (ch === quote) quote = ''
    } else if (ch === '"' || ch === "'") {
      quote = ch
    } else if (ch === '(' || ch === '[') {
      depth++
    } else if (ch === ')' || ch === ']') {
      depth--
    } else if (ch === sep && depth === 0) {
      parts.push(current)
      current = ''
      continue
    }
    current += ch
  }
  parts.push(current)
  return parts
}

/** True when () and [] outside strings are balanced and correctly nested. */
function isBalanced(text: string): boolean {
  const stack: string[] = []
  let quote = ''
  for (const ch of text) {
    if (quote) {
      if (ch === quote) quote = ''
    } else if (ch === '"' || ch === "'") {
      quote = ch
    } else if (ch === '(' || ch === '[') {
      stack.push(ch === '(' ? ')' : ']')
    } else if (ch === ')' || ch === ']') {
      if (stack.pop() !== ch) return false
    }
  }
  return stack.length === 0 && !quote
}

/**
 * Tokenizes CSS into top-level rules and @media queries.
 */
function parseCssBlocks(css: string): ParsedRule[] {
  const blocks: ParsedRule[] = []
  let depth = 0
  let currentPreamble = ''
  let currentBody = ''

  for (const ch of css) {
    if (ch === '{') {
      if (depth > 0) currentBody += ch
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0) {
        const preamble = currentPreamble.trim()
        const isMedia = /^@media\b/i.test(preamble)
        // Drop non-media @-rules, and plain rules holding a nested block (CSS nesting).
        const keep =
          preamble && (isMedia || (!preamble.startsWith('@') && !currentBody.includes('{')))
        if (keep && isBalanced(preamble)) {
          blocks.push({ preamble, body: currentBody.trim(), isMedia })
        }
        currentPreamble = ''
        currentBody = ''
      } else {
        currentBody += ch
      }
    } else if (depth === 0) {
      currentPreamble += ch
    } else {
      currentBody += ch
    }
  }

  return blocks
}

/**
 * Filters a declaration list: verifies any url(...) references, dropping declarations that fail.
 */
function filterDeclarations(body: string): string[] {
  const validDecls: string[] = []

  for (const decl of splitTopLevel(body, ';')) {
    const d = decl.trim()
    if (!d || !isBalanced(d)) continue

    const colonIdx = d.indexOf(':')
    if (colonIdx <= 0) continue
    if (STRING_URL_FUNCTIONS.test(d)) continue

    if (/url\s*\(/i.test(d)) {
      const urlMatches = [...d.matchAll(/url\s*\(\s*(['"]?)(.*?)\1\s*\)/gi)]
      // Every url( must be one of the matches, and every match must point at our media.
      const urlCount = d.match(/url\s*\(/gi)?.length ?? 0
      const allValid =
        urlMatches.length === urlCount &&
        urlMatches.every((m) => {
          const urlArg = m[2]?.trim()
          return Boolean(urlArg && cleanImageUrl(urlArg))
        })
      if (!allValid) continue
    }

    validDecls.push(d)
  }

  return validDecls
}

const SELECTOR_KEYWORD = /^selector(?![a-zA-Z0-9_-])/i

/**
 * `rest` is what follows the scoped element in a selector. Returns false when the first
 * combinator after the element's own compound selector is `+` or `~` (a sibling, outside the
 * scope).
 */
function staysInside(rest: string): boolean {
  let depth = 0
  let quote = ''
  let i = 0
  for (; i < rest.length; i++) {
    const ch = rest[i]
    if (quote) {
      if (ch === quote) quote = ''
      continue
    }
    if (ch === '"' || ch === "'") quote = ch
    else if (ch === '(' || ch === '[') depth++
    else if (ch === ')' || ch === ']') depth--
    else if (depth === 0 && /[\s>+~]/.test(ch)) break
  }
  const next = rest.slice(i).trimStart()[0]
  return next !== '+' && next !== '~'
}

/** Replaces the leading `selector` keyword with the block's attribute selector. */
function scopeBlockSelector(part: string, blockSelector: string): string | null {
  if (!SELECTOR_KEYWORD.test(part)) return null
  const rest = part.replace(SELECTOR_KEYWORD, '')
  return staysInside(rest) ? blockSelector + rest : null
}

/** Puts a page-level selector under the builder's page wrapper. */
function scopePageSelector(part: string): string | null {
  const pageRoot = `[${PAGE_ATTR}]`
  let rest: string
  if (SELECTOR_KEYWORD.test(part)) rest = part.replace(SELECTOR_KEYWORD, '')
  else if (part.startsWith(pageRoot)) rest = part.slice(pageRoot.length)
  else return /^[+~]/.test(part) ? null : `${pageRoot} ${part}`
  return staysInside(rest) ? pageRoot + rest : null
}

function sanitizeScopedCss(
  rawCss: string,
  maxLength: number,
  scope: (selectorPart: string) => string | null,
): string {
  const validated = validateAndStripComments(rawCss, maxLength)
  if (!validated) return ''

  function processRule(preamble: string, body: string): string | null {
    const validSelectors: string[] = []
    for (const part of splitTopLevel(preamble, ',')) {
      const s = part.trim()
      if (!s || !isBalanced(s)) continue
      const scoped = scope(s)
      if (scoped) validSelectors.push(scoped)
    }
    if (validSelectors.length === 0) return null

    const decls = filterDeclarations(body)
    if (decls.length === 0) return null

    return `${validSelectors.join(', ')}{${decls.join(';')}}`
  }

  const result: string[] = []
  for (const block of parseCssBlocks(validated)) {
    if (block.isMedia) {
      // Parse nested rules inside @media
      const innerResults: string[] = []
      for (const inner of parseCssBlocks(block.body)) {
        if (inner.isMedia) continue
        const ruleCss = processRule(inner.preamble, inner.body)
        if (ruleCss) innerResults.push(ruleCss)
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

  const blockSelector = `[${STYLE_ATTR}="${blockId}"]`
  return sanitizeScopedCss(cssText, MAX_BLOCK_CUSTOM_CSS_LENGTH, (part) =>
    scopeBlockSelector(part, blockSelector),
  )
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
  return sanitizeScopedCss(cssText, MAX_PAGE_CUSTOM_CSS_LENGTH, scopePageSelector)
}
