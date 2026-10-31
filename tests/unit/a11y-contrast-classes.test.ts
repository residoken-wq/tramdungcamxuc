import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

interface ContrastViolation {
  file: string
  line: number
  rule:
    'navy-low-contrast' | 'magenta-pink-opacity' | 'small-accent-pink' | 'pink-white-button-small'
  token: string
  context: string
}

const IGNORED_PREFIXES = new Set(['placeholder', 'hover', 'focus', 'group-hover', 'disabled'])

function hasIgnoredPrefix(token: string): boolean {
  const parts = token.split(':')
  const prefixes = parts.slice(0, -1)
  return prefixes.some((p) => IGNORED_PREFIXES.has(p))
}

function isLargeText(tokens: string[]): boolean {
  // Only unprefixed classes count: `text-sm md:text-lg` is still small text on mobile.
  const base = tokens.map(stripImportant).filter((t) => !t.includes(':'))
  const hasBold = base.some((t) => /^(font-bold|font-extrabold|font-black)$/.test(t))
  const hasLargeSize = base.some((t) => {
    if (/^text-(lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/.test(t)) {
      return true
    }
    const match = t.match(/^text-\[(\d+)px\]$/)
    return Boolean(match && parseInt(match[1], 10) >= 19)
  })
  return hasBold && hasLargeSize
}

function stripImportant(token: string): string {
  // Tailwind important modifier: `!text-accent-pink`, `md:!text-accent-pink`.
  return token.replace(/(^|:)!/, '$1')
}

function collectTsxFiles(dir: string, baseDir = dir): string[] {
  let results: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const relToSrc = path.relative(baseDir, fullPath).replace(/\\/g, '/')
    if (entry.isDirectory()) {
      // Prompt: "trừ src/components/admin/**"
      if (relToSrc === 'components/admin' || relToSrc.startsWith('components/admin/')) {
        continue
      }
      results = results.concat(collectTsxFiles(fullPath, baseDir))
    } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
      results.push(fullPath)
    }
  }
  return results
}

interface ClassString {
  tokens: { value: string; line: number }[]
}

/**
 * Collects class-like strings with the line of each token.
 * - `'…'` and `"…"` per line (JSX text may contain apostrophes, so these never span lines);
 * - backtick template literals over the whole file, so multi-line `className={`…`}` is scanned;
 *   `${…}` interpolations act as separators.
 */
function extractClassStrings(content: string): ClassString[] {
  const lineStarts = [0]
  for (let k = 0; k < content.length; k++) {
    if (content[k] === '\n') lineStarts.push(k + 1)
  }
  const lineOf = (offset: number): number => {
    let lo = 0
    let hi = lineStarts.length - 1
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (lineStarts[mid] <= offset) lo = mid
      else hi = mid - 1
    }
    return lo + 1
  }
  const toClassString = (raw: string, rawStart: number): ClassString => {
    const blanked = raw.replace(/\$\{[^}]*\}/g, (m) => ' '.repeat(m.length))
    const tokens: ClassString['tokens'] = []
    for (const m of blanked.matchAll(/\S+/g)) {
      tokens.push({ value: m[0], line: lineOf(rawStart + (m.index ?? 0)) })
    }
    return { tokens }
  }

  const strings: ClassString[] = []
  for (const m of content.matchAll(/`([^`]*)`/g)) {
    strings.push(toClassString(m[1], (m.index ?? 0) + 1))
  }
  const withoutTemplates = content.replace(/`[^`]*`/g, (m) => m.replace(/[^\n]/g, ' '))
  let offset = 0
  for (const line of withoutTemplates.split('\n')) {
    for (const m of line.matchAll(/(['"])([^'"]+)\1/g)) {
      strings.push(toClassString(m[2], offset + (m.index ?? 0) + 1))
    }
    offset += line.length + 1
  }
  return strings
}

export function scanContrastIssues(): ContrastViolation[] {
  const srcDir = path.resolve(process.cwd(), 'src')
  const files = collectTsxFiles(srcDir, srcDir)
  const violations: ContrastViolation[] = []

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
    const lines = content.split('\n')
    const relFile = path.relative(process.cwd(), file).replace(/\\/g, '/')
    // Exception: an `a11y-contrast-ok: <reason>` comment on the same line or the line directly above.
    const isExempt = (line: number): boolean =>
      [line - 1, line].some((n) => n >= 1 && /\ba11y-contrast-ok:\s*\S+/i.test(lines[n - 1]))
    const push = (line: number, rule: ContrastViolation['rule'], token: string) => {
      if (isExempt(line)) return
      violations.push({ file: relFile, line, rule, token, context: lines[line - 1].trim() })
    }

    for (const { tokens: located } of extractClassStrings(content)) {
      const tokens = located.map((t) => t.value)

      for (const { value: rawToken, line } of located) {
        if (hasIgnoredPrefix(rawToken)) {
          continue
        }
        const token = stripImportant(rawToken)

        // 1. text-deep-navy/NN với NN < 60
        const navyMatch = token.match(/^(?:[a-z0-9_-]+:)*text-deep-navy\/(\d+|\[[\d.]+%?\])$/)
        if (navyMatch) {
          const rawVal = navyMatch[1]
          let pct: number
          if (rawVal.startsWith('[')) {
            const num = parseFloat(rawVal.replace(/[[\]%]/g, ''))
            pct = rawVal.includes('%') || num > 1 ? num : num * 100
          } else {
            pct = parseInt(rawVal, 10)
          }
          if (pct < 60) push(line, 'navy-low-contrast', rawToken)
        }

        // 2. text-bright-magenta/NN hoặc text-accent-pink/NN (mọi độ mờ)
        if (
          /^(?:[a-z0-9_-]+:)*(text-bright-magenta|text-accent-pink)\/(\d+|\[[\d.]+%?\])$/.test(
            token,
          )
        ) {
          push(line, 'magenta-pink-opacity', rawToken)
        }

        // 3. text-accent-pink trên phần tử không phải chữ lớn
        if (/^(?:[a-z0-9_-]+:)*text-accent-pink$/.test(token) && !isLargeText(tokens)) {
          push(line, 'small-accent-pink', rawToken)
        }
      }

      // 4. bg-accent-pink(/NN) + text-white / text-warm-ivory mà không phải chữ lớn đậm
      const bgPink = located.find(
        (t) =>
          !hasIgnoredPrefix(t.value) &&
          /^(?:[a-z0-9_-]+:)*bg-accent-pink(\/\d+)?$/.test(stripImportant(t.value)),
      )
      const hasLightText = located.some(
        (t) =>
          !hasIgnoredPrefix(t.value) &&
          /^(?:[a-z0-9_-]+:)*(text-white|text-warm-ivory)$/.test(stripImportant(t.value)),
      )
      if (bgPink && hasLightText && !isLargeText(tokens)) {
        push(bgPink.line, 'pink-white-button-small', 'bg-accent-pink + text-white/warm-ivory')
      }
    }
  }

  return violations
}

describe('a11y contrast guard test (T3-07)', () => {
  it(
    'detects contrast violations across all non-admin .tsx files',
    () => {
      const violations = scanContrastIssues()

    if (violations.length > 0) {
      const summaryByType = violations.reduce<Record<string, number>>((acc, v) => {
        acc[v.rule] = (acc[v.rule] || 0) + 1
        return acc
      }, {})

      const formatted = violations
        .map((v) => `${v.file}:${v.line} [${v.rule}] ${v.token} (context: "${v.context}")`)
        .join('\n')

      const message =
        `Found ${violations.length} a11y contrast violations:\n` +
        `Summary by type: ${JSON.stringify(summaryByType, null, 2)}\n\n` +
        `${formatted}`

      expect(violations, message).toEqual([])
    } else {
      expect(violations).toEqual([])
    }
  }, 30000)
})
