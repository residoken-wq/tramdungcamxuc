import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'

// Docker images are built without a database or PAYLOAD_SECRET, so CMS-driven
// pages must render per request instead of being prerendered at build time.
test.each([
  ['src/app/(site)/(shell)/page.tsx', 'src/app/(site)/page.tsx'],
  ['src/app/(site)/(shell)/[...slug]/page.tsx', 'src/app/(site)/[...slug]/page.tsx'],
])('%s is rendered on demand', (...candidates) => {
  const filePath = candidates.find((c) => existsSync(path.resolve(__dirname, '../..', c)))
  expect(filePath).toBeDefined()
  const source = readFileSync(path.resolve(__dirname, '../..', filePath!), 'utf8')
  expect(source).toMatch(/export const dynamic = 'force-dynamic'/)
})
