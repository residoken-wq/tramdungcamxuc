import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// QA DP-02c: a server page passing a function prop to a client component makes Next.js render a
// 500 page ("Event handlers cannot be passed to Client Component props"). /habit/tracker broke
// this way twice (DP-01e, DP-02), so guard the Habit / EQ server pages.
const PAGES = [
  'src/app/(site)/(shell)/habit/tracker/page.tsx',
  'src/app/(site)/(shell)/habit/5-phut/page.tsx',
  'src/app/(site)/(shell)/eq-buddy/page.tsx',
  'src/app/(site)/(shell)/eq-buddy/rut-the/page.tsx',
  'src/app/(site)/(shell)/eq-buddy/the/[qrSlug]/page.tsx',
]

describe('Habit / EQ server pages pass no inline functions to client components', () => {
  for (const rel of PAGES) {
    const file = path.join(process.cwd(), rel)
    it.runIf(fs.existsSync(file))(rel, () => {
      const src = fs.readFileSync(file, 'utf8')
      expect(src.startsWith("'use client'")).toBe(false)
      expect(src).not.toMatch(/\bon[A-Z]\w*=\{\s*(\([^)]*\)|\w+)\s*=>/)
    })
  }
})
