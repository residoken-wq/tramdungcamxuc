import { readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'

// Docker images are built without a database or PAYLOAD_SECRET, so CMS-driven
// pages must render per request instead of being prerendered at build time.
test.each(['src/app/(site)/page.tsx', 'src/app/(site)/[...slug]/page.tsx'])(
  '%s is rendered on demand',
  (file) => {
    const source = readFileSync(path.resolve(__dirname, '../..', file), 'utf8')
    expect(source).toMatch(/export const dynamic = 'force-dynamic'/)
  },
)
