import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('PK-28b: Content fidelity against docs/design/chuyen-minh-noi-dung.md', () => {
  const root = process.cwd()
  let md = readFileSync(path.resolve(root, 'docs/design/chuyen-minh-noi-dung.md'), 'utf8')
  const start = md.indexOf('## 1')
  if (start >= 0) md = md.slice(start)
  const ts = readFileSync(path.resolve(root, 'src/puck/templates/journey.ts'), 'utf8').replace(
    /\\n/g,
    ' ',
  )

  const norm = (s: string) =>
    s
      .normalize('NFC')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .replace(/^[ .;:,]+|[ .;:,]+$/g, '')
  const tsn = norm(ts)

  const phrases: string[] = []
  for (let line of md.split('\n')) {
    line = line
      .trim()
      .replace(/^[-*>#]+/, '')
      .trim()
    if (!line || line.startsWith('|--')) continue
    line = line.replace(/[*_`]/g, '')
    const cells =
      line.startsWith('|') || line.includes(' | ')
        ? line.split(/\s*\|\s*/).filter(Boolean)
        : [line]
    for (let c of cells) {
      if (c.includes(': ')) c = c.split(': ').slice(1).join(': ')
      for (let p of c.split(/\s+\/\s+|;\s*$/)) {
        p = p.replace(/^[ "“”;]+|[ "“”;]+$/g, '')
        if (p.length >= 10) phrases.push(p)
      }
    }
  }

  const missing = phrases.filter((p) => !tsn.includes(norm(p)))
  const found = phrases.length - missing.length
  const pct = Math.floor((100 * found) / phrases.length)

  it('achieves content fidelity score >= 65%', () => {
    expect(pct).toBeGreaterThanOrEqual(65)
  })

  it('contains mandatory key phrases from Hana design', () => {
    expect(ts.includes('39%')).toBe(true)
    expect(ts.includes('3X')).toBe(true)
    expect(ts.includes('Chuyển mình')).toBe(true)
    expect(ts.includes('không chênh vênh')).toBe(true)
    expect(ts.includes('Bước tiếp cùng AI, mà vẫn là chính mình')).toBe(true)
    expect(ts.includes('Hai phase: xây nền trước, định hướng sau')).toBe(true)
    expect(ts.includes('Một vòng lặp cho mọi kỹ năng')).toBe(true)
    expect(ts.includes('Reflection giữ thay đổi ở lại sau workshop')).toBe(true)
  })

  it('does not contain prohibited invented phrases or numbers', () => {
    expect(ts.includes('1/3')).toBe(false)
    expect(ts.includes('2.5')).toBe(false)
    expect(ts.toLowerCase().includes('hoàn tiền')).toBe(false)
  })
})

