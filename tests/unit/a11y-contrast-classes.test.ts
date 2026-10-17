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
  const hasBold = tokens.some((t) =>
    /^(?:[a-z0-9_-]+:)*(font-bold|font-extrabold|font-black)$/.test(t),
  )
  const hasLargeSize = tokens.some((t) => {
    if (/^(?:[a-z0-9_-]+:)*text-(lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/.test(t)) {
      return true
    }
    const match = t.match(/^(?:[a-z0-9_-]+:)*text-\[(\d+)px\]$/)
    if (match && parseInt(match[1], 10) >= 19) {
      return true
    }
    return false
  })
  return hasBold && hasLargeSize
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

export function scanContrastIssues(): ContrastViolation[] {
  const srcDir = path.resolve(process.cwd(), 'src')
  const files = collectTsxFiles(srcDir, srcDir)
  const violations: ContrastViolation[] = []

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8')
    const lines = content.split(/\r?\n/)
    const relFile = path.relative(process.cwd(), file).replace(/\\/g, '/')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // Ngoại lệ hợp lệ: dòng có comment a11y-contrast-ok: <lý do> ngay trên → bỏ qua
      let hasExceptionComment = false
      for (let j = Math.max(0, i - 4); j <= i; j++) {
        if (/\ba11y-contrast-ok:\s*\S+/i.test(lines[j])) {
          hasExceptionComment = true
          break
        }
      }
      if (hasExceptionComment) {
        continue
      }

      // Trích xuất các chuỗi class trong dấu nháy kép, nháy đơn hoặc template literal
      const stringMatches = line.match(/(['"`])([^'"`]+)\1/g) || []

      for (const quoted of stringMatches) {
        const rawString = quoted.slice(1, -1)
        const tokens = rawString.split(/\s+/).filter(Boolean)

        for (const token of tokens) {
          if (hasIgnoredPrefix(token)) {
            continue
          }

          // 1. text-deep-navy/NN với NN < 60
          const navyMatch = token.match(/^(?:[a-z0-9_-]+:)*text-deep-navy\/(\d+|\[[\d.]+\])$/)
          if (navyMatch) {
            const rawVal = navyMatch[1]
            let pct: number
            if (rawVal.startsWith('[')) {
              const num = parseFloat(rawVal.replace(/[[\]]/g, ''))
              pct = num <= 1 ? num * 100 : num
            } else {
              pct = parseInt(rawVal, 10)
            }
            if (pct < 60) {
              violations.push({
                file: relFile,
                line: i + 1,
                rule: 'navy-low-contrast',
                token,
                context: line.trim(),
              })
            }
          }

          // 2. text-bright-magenta/NN hoặc text-accent-pink/NN (mọi độ mờ)
          const magPinkMatch = token.match(
            /^(?:[a-z0-9_-]+:)*(text-bright-magenta|text-accent-pink)\/(\d+|\[[\d.]+\])$/,
          )
          if (magPinkMatch) {
            violations.push({
              file: relFile,
              line: i + 1,
              rule: 'magenta-pink-opacity',
              token,
              context: line.trim(),
            })
          }

          // 3. text-accent-pink trên phần tử không phải chữ lớn
          const accentPinkMatch = token.match(/^(?:[a-z0-9_-]+:)*text-accent-pink$/)
          if (accentPinkMatch) {
            if (!isLargeText(tokens)) {
              violations.push({
                file: relFile,
                line: i + 1,
                rule: 'small-accent-pink',
                token,
                context: line.trim(),
              })
            }
          }
        }

        // 4. bg-accent-pink + text-white (hoặc text-warm-ivory) mà không có (text-[19px]/text-[20px]/text-lg+ và font-bold)
        const hasBgPink = tokens.some(
          (t) => /^(?:[a-z0-9_-]+:)*bg-accent-pink$/.test(t) && !hasIgnoredPrefix(t),
        )
        const hasLightText = tokens.some(
          (t) => /^(?:[a-z0-9_-]+:)*(text-white|text-warm-ivory)$/.test(t) && !hasIgnoredPrefix(t),
        )
        if (hasBgPink && hasLightText && !isLargeText(tokens)) {
          violations.push({
            file: relFile,
            line: i + 1,
            rule: 'pink-white-button-small',
            token: 'bg-accent-pink + text-white/warm-ivory',
            context: line.trim(),
          })
        }
      }
    }
  }

  return violations
}

describe('a11y contrast guard test (T3-07)', () => {
  it('detects contrast violations across all non-admin .tsx files', () => {
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
  })
})
