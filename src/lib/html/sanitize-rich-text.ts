/**
 * REVIEW-REQUIRED: Client-safe HTML sanitizer for Puck TextWidget, HtmlWidget, and user-submitted rich text.
 * Enforces a strict whitelist of markup tags and safe attributes.
 * Prevents XSS, javascript: URI execution, iframe/script injection, and event handler injection.
 */
import { cleanImageUrl } from '@/puck/style/container-schema'
import { cleanAnchorId } from '@/puck/style/style-schema'

const TEXT_ALLOWED_TAGS = new Set([
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

const CUSTOM_HTML_ALLOWED_TAGS = new Set([
  'div',
  'span',
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'a',
  'img',
  'figure',
  'figcaption',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'strong',
  'b',
  'em',
  'i',
  'br',
  'hr',
  'blockquote',
  'code',
  'pre',
])

const DANGEROUS_TAG_CONTENTS =
  /<\s*(script|style|iframe|object|embed|applet|form|svg|math)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi
const DANGEROUS_SELF_CLOSING =
  /<\s*(script|style|iframe|object|embed|applet|form|input|button|meta|link|svg|math)[^>]*\/?>/gi

/**
 * Decodes HTML entities commonly used to obfuscate protocol schemes in URLs.
 */
export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#x([0-9a-fA-F]+);?/g, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16))
      } catch {
        return ''
      }
    })
    .replace(/&#([0-9]+);?/g, (_, dec) => {
      try {
        return String.fromCharCode(parseInt(dec, 10))
      } catch {
        return ''
      }
    })
    .replace(/&colon;?/gi, ':')
    .replace(/&tab;?/gi, ' ')
    .replace(/&newline;?/gi, ' ')
}

/**
 * Validates whether a URL inside an href attribute is safe.
 * Rejects javascript:, data:, vbscript: and malformed protocols.
 */
export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  const decoded = decodeHtmlEntities(url).trim()
  if (decoded === '' || decoded === '#') return true

  // Strip control characters
  const clean = decoded.replace(/[\x00-\x1F\x7F-\x9F]/g, '')
  if (/^\s*(javascript|data|vbscript):/i.test(clean)) {
    return false
  }

  // Allow protocol-relative, absolute path, hash, mailto, tel, http, https
  if (/^(\/|#|\.\/|\.\.\/)/.test(clean)) return true
  if (/^(https?|mailto|tel):/i.test(clean)) return true

  return false
}

/**
 * Clean attributes on an allowed tag for standard rich text (TextWidget).
 */
function cleanTextTagAttributes(tagName: string, rawAttrs: string): string {
  if (tagName !== 'a') {
    return ''
  }

  let href = ''
  let target = ''
  let rel = ''
  let title = ''

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
 * Clean attributes on an allowed tag for custom HTML widget (HtmlWidget).
 * Allowed: class, id (cleanAnchorId), href (isSafeUrl), src (cleanImageUrl on img),
 * alt, title, width, height (numbers).
 *
 * REVIEW-REQUIRED:
 */
function cleanCustomHtmlAttributes(
  tagName: string,
  rawAttrs: string,
): { attrsStr: string; hasValidSrc: boolean } {
  let hasValidSrc = false
  const outAttrs: string[] = []

  const attrRegex = /([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g
  let match: RegExpExecArray | null

  let href = ''
  let target = ''
  let rel = ''

  while ((match = attrRegex.exec(rawAttrs)) !== null) {
    const key = match[1].toLowerCase()
    const val = match[2] ?? match[3] ?? match[4] ?? ''

    // Explicitly reject event handlers and style
    if (key.startsWith('on') || key === 'style') {
      continue
    }

    if (key === 'class') {
      const cleanClass = val.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim()
      if (cleanClass) {
        outAttrs.push(`class="${cleanClass}"`)
      }
    } else if (key === 'id') {
      const validId = cleanAnchorId(val)
      if (validId) {
        outAttrs.push(`id="${validId}"`)
      }
    } else if (key === 'href' && tagName === 'a') {
      if (isSafeUrl(val)) {
        href = val.trim()
      }
    } else if (key === 'target' && tagName === 'a') {
      if (val === '_blank' || val === '_self') {
        target = val
      }
    } else if (key === 'rel' && tagName === 'a') {
      rel = val.replace(/[<>"']/g, '').trim()
    } else if (key === 'src' && tagName === 'img') {
      const validSrc = cleanImageUrl(val.trim())
      if (validSrc) {
        hasValidSrc = true
        outAttrs.push(`src="${validSrc}"`)
      }
    } else if (key === 'alt' && tagName === 'img') {
      outAttrs.push(`alt="${val.replace(/[<>"']/g, '')}"`)
    } else if (key === 'title') {
      outAttrs.push(`title="${val.replace(/[<>"']/g, '')}"`)
    } else if ((key === 'width' || key === 'height') && /^\d{1,5}$/.test(val.trim())) {
      outAttrs.push(`${key}="${val.trim()}"`)
    }
  }

  if (tagName === 'a') {
    if (href) {
      outAttrs.unshift(`href="${encodeURI(href)}"`)
    } else {
      outAttrs.unshift('href="#"')
    }

    if (target === '_blank') {
      outAttrs.push('target="_blank"')
      outAttrs.push('rel="noopener noreferrer"')
    } else if (target) {
      outAttrs.push(`target="${target}"`)
      if (rel) outAttrs.push(`rel="${rel}"`)
    } else if (rel) {
      outAttrs.push(`rel="${rel}"`)
    }
  }

  return {
    attrsStr: outAttrs.length > 0 ? ` ${outAttrs.join(' ')}` : '',
    hasValidSrc,
  }
}

// A tag starts like the browser reads one: `<` or `</` directly followed by a letter.
const TAG_REGEX = /<(\/)?([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g

/** Text between rebuilt tags never carries markup: a stray `<` would let a browser read it as a tag. */
const escapeText = (text: string) => text.replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * REVIEW-REQUIRED: shared allow-list pass. Comments and dangerous elements are removed, every
 * complete tag is rebuilt by `rebuildTag` (which returns '' to drop it), and everything else is
 * escaped as text. EB-09c: before this, an unterminated tag at the end of the input
 * (`<img src=x onerror=alert(1) `) was copied unchanged and became a live tag once the page
 * markup that follows closed it.
 */
function rebuildHtml(
  rawHtml: string,
  rebuildTag: (isClosing: boolean, tag: string, rawAttrs: string) => string,
): string {
  let html = rawHtml.replace(/<!--[\s\S]*?(?:-->|$)/g, '')
  let prev = ''
  while (prev !== html) {
    prev = html
    html = html.replace(DANGEROUS_TAG_CONTENTS, '')
  }
  html = html.replace(DANGEROUS_SELF_CLOSING, '')

  let out = ''
  let last = 0
  for (const match of html.matchAll(TAG_REGEX)) {
    out += escapeText(html.slice(last, match.index))
    out += rebuildTag(Boolean(match[1]), match[2].toLowerCase(), match[3] || '')
    last = match.index + match[0].length
  }
  return out + escapeText(html.slice(last))
}

/**
 * Pure whitelist-based HTML sanitizer for standard rich text (TextWidget).
 */
export function sanitizeRichText(rawHtml: string | null | undefined): string {
  if (!rawHtml || typeof rawHtml !== 'string') return ''

  return rebuildHtml(rawHtml, (isClosing, tag, rawAttrs) => {
    if (!TEXT_ALLOWED_TAGS.has(tag)) return ''
    if (isClosing) return `</${tag}>`
    return `<${tag}${cleanTextTagAttributes(tag, rawAttrs)}>`
  })
}

/**
 * Pure whitelist-based HTML sanitizer for HtmlWidget.
 *
 * REVIEW-REQUIRED:
 * Filters untrusted HTML code according to strict tag and attribute allowlists.
 * Strips all <script>, <style>, <iframe>, <object>, <embed>, <form>, <svg>, <math>,
 * all on* event handlers, all style attributes, and enforces relative /api/media/file/... on img.
 */
export function sanitizeCustomHtml(rawHtml: string | null | undefined): string {
  if (!rawHtml || typeof rawHtml !== 'string') return ''
  if (rawHtml.length > 20000) return ''

  return rebuildHtml(rawHtml, (isClosing, tag, rawAttrs) => {
    if (!CUSTOM_HTML_ALLOWED_TAGS.has(tag)) return ''

    if (isClosing) {
      if (tag === 'img' || tag === 'br' || tag === 'hr') return ''
      return `</${tag}>`
    }

    if (tag === 'br') return '<br />'
    if (tag === 'hr') return '<hr />'

    const { attrsStr, hasValidSrc } = cleanCustomHtmlAttributes(tag, rawAttrs)

    // For <img>, drop the tag entirely if it does not have a safe, validated src
    if (tag === 'img') {
      if (!hasValidSrc) return ''
      return `<img${attrsStr} />`
    }

    return `<${tag}${attrsStr}>`
  })
}
