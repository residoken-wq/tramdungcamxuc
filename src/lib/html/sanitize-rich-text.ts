/**
 * REVIEW-REQUIRED: Client-safe HTML sanitizer for Puck TextWidget and user-submitted rich text.
 * Enforces a strict whitelist of markup tags and safe attributes.
 * Prevents XSS, javascript: URI execution, iframe/script injection, and event handler injection.
 */

const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'strike',
  'ul',
  'ol',
  'li',
  'a',
  'blockquote',
  'code',
  'pre',
  'hr',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
])

const DANGEROUS_TAG_CONTENTS =
  /<\s*(script|style|iframe|object|embed|applet|form|svg|math)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi
const DANGEROUS_SELF_CLOSING =
  /<\s*(script|style|iframe|object|embed|applet|form|input|button|meta|link)[^>]*\/?>/gi

/**
 * Validates whether a URL inside an href attribute is safe.
 * Rejects javascript:, data:, vbscript: and malformed protocols.
 */
export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  if (trimmed === '' || trimmed === '#') return true

  // Strip control characters
  const clean = trimmed.replace(/[\x00-\x1F\x7F-\x9F]/g, '')
  if (/^\s*(javascript|data|vbscript):/i.test(clean)) {
    return false
  }

  // Allow protocol-relative, absolute path, hash, mailto, tel, http, https
  if (/^(\/|#|\.\/|\.\.\/)/.test(clean)) return true
  if (/^(https?|mailto|tel):/i.test(clean)) return true

  return false
}

/**
 * Clean attributes on an allowed tag.
 * Only `a` is allowed to have `href`, `target`, `rel`, `title`.
 * All other tags have their attributes stripped.
 */
function cleanTagAttributes(tagName: string, rawAttrs: string): string {
  if (tagName !== 'a') {
    return ''
  }

  let href = ''
  let target = ''
  let rel = ''
  let title = ''

  // Regex to extract key="value" or key='value' or key=value
  const attrRegex = /([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g
  let match: RegExpExecArray | null

  while ((match = attrRegex.exec(rawAttrs)) !== null) {
    const key = match[1].toLowerCase()
    const val = match[2] ?? match[3] ?? match[4] ?? ''

    if (key === 'href') {
      if (isSafeUrl(val)) {
        href = val.trim()
      }
    } else if (key === 'target') {
      if (val === '_blank' || val === '_self') {
        target = val
      }
    } else if (key === 'rel') {
      rel = val.trim()
    } else if (key === 'title') {
      title = val.replace(/[<>"']/g, '')
    }
  }

  const outAttrs: string[] = []

  if (href) {
    outAttrs.push(`href="${encodeURI(href)}"`)
  } else {
    outAttrs.push('href="#"')
  }

  if (target === '_blank') {
    outAttrs.push('target="_blank"')
    outAttrs.push('rel="noopener noreferrer"')
  } else if (target) {
    outAttrs.push(`target="${target}"`)
    if (rel) outAttrs.push(`rel="${rel.replace(/[<>"']/g, '')}"`)
  } else if (rel) {
    outAttrs.push(`rel="${rel.replace(/[<>"']/g, '')}"`)
  }

  if (title) {
    outAttrs.push(`title="${title}"`)
  }

  return outAttrs.length > 0 ? ` ${outAttrs.join(' ')}` : ''
}

/**
 * Pure whitelist-based HTML sanitizer.
 * Drops forbidden tags and attributes, blocks XSS vectors.
 */
export function sanitizeRichText(rawHtml: string | null | undefined): string {
  if (!rawHtml || typeof rawHtml !== 'string') return ''

  // 1. Remove dangerous elements including their inner text/code
  let html = rawHtml.replace(DANGEROUS_TAG_CONTENTS, '')
  html = html.replace(DANGEROUS_SELF_CLOSING, '')

  // 2. Parse and filter all remaining HTML tags
  const tagRegex = /<\s*(\/)?\s*([a-zA-Z0-9_-]+)([^>]*)>/g

  const sanitized = html.replace(tagRegex, (_fullMatch, isClosing, rawTagName, rawAttrs) => {
    const tag = rawTagName.toLowerCase()

    if (!ALLOWED_TAGS.has(tag)) {
      return ''
    }

    if (isClosing) {
      return `</${tag}>`
    }

    const cleanAttrs = cleanTagAttributes(tag, rawAttrs || '')
    return `<${tag}${cleanAttrs}>`
  })

  return sanitized
}
