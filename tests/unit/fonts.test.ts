import { describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

vi.mock('next/font/local', () => ({
  default: vi.fn((options: { variable?: string; src?: unknown }) => ({
    className: `mocked-${options?.variable?.replace('--', '') || 'font'}`,
    variable: options?.variable || '',
    style: { fontFamily: 'mock-font' },
  })),
}))

import { anton, montserrat, playfair } from '@/lib/fonts'

describe('Self-hosted fonts', () => {
  it('exports all 3 required font definitions with correct CSS variables', () => {
    expect(anton).toBeDefined()
    expect(anton.variable).toBe('--font-display')

    expect(montserrat).toBeDefined()
    expect(montserrat.variable).toBe('--font-ui')

    expect(playfair).toBeDefined()
    expect(playfair.variable).toBe('--font-quote')
  })

  it('contains font files in src/fonts and OFL.txt license', () => {
    const fontsDir = path.resolve(process.cwd(), 'src/fonts')
    expect(fs.existsSync(fontsDir)).toBe(true)

    const expectedFiles = [
      'anton-400.woff2',
      'montserrat-400.woff2',
      'montserrat-600.woff2',
      'montserrat-700.woff2',
      'playfair-display-italic.woff2',
      'OFL.txt',
    ]

    for (const file of expectedFiles) {
      const filePath = path.join(fontsDir, file)
      expect(fs.existsSync(filePath), `Missing ${file}`).toBe(true)
      const stat = fs.statSync(filePath)
      expect(stat.size).toBeGreaterThan(0)
    }
  })

  it('ensures no files in src/ import next/font/google', () => {
    const srcDir = path.resolve(process.cwd(), 'src')

    function scanDir(dir: string): string[] {
      let results: string[] = []
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          results = results.concat(scanDir(fullPath))
        } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, 'utf8')
          if (content.includes('next/font/google')) {
            results.push(fullPath)
          }
        }
      }
      return results
    }

    const offendingFiles = scanDir(srcDir)
    expect(offendingFiles).toEqual([])
  })
})
