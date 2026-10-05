// Run against the isolated tdcx-demo-test stack, never a development or customer database.
import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { chromium, request } from '@playwright/test'

const baseURL = 'http://127.0.0.1:3400'
const output = 'test-results/docker-demo'
await mkdir(output, { recursive: true })
const api = await request.newContext({ baseURL })
const hash = (buffer) => createHash('sha256').update(buffer).digest('hex')

try {
  for (const path of ['/', '/admin', '/api/users/init', '/robots.txt', '/missing-demo-page']) {
    const response = await api.get(path)
    assert.equal(response.headers()['x-robots-tag'], 'noindex, nofollow', path)
  }
  const robots = await api.get('/robots.txt')
  assert.match(await robots.text(), /Disallow: \/\s/)

  if (process.argv[2] === 'bootstrap') {
    assert.equal((await (await api.get('/api/users/init')).json()).initialized, false)
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage({ baseURL })
      await page.goto('/admin', { waitUntil: 'networkidle' })
      await page.locator('#field-email').waitFor()
      await page.screenshot({ path: `${output}/first-admin.png`, fullPage: true })
      await page.locator('#field-email').fill(`demo-${randomUUID()}@example.test`)
      const password = randomUUID()
      await page.locator('#field-password').fill(password)
      await page.locator('#field-confirm-password').fill(password)
      const registration = page.waitForResponse((res) => res.url().includes('/first-register'))
      await page.locator('button[type="submit"]').click()
      assert.equal((await registration).ok(), true)
      await page.waitForURL(/\/admin\/?$/)
      const png = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lN8AAAAASUVORK5CYII=',
        'base64',
      )
      const uploaded = await page.request.post('/api/media', {
        multipart: {
          _payload: JSON.stringify({ alt: '[MẪU] Docker persistence probe' }),
          file: { name: `demo-${randomUUID()}.png`, mimeType: 'image/png', buffer: png },
        },
      })
      assert.equal(uploaded.ok(), true, await uploaded.text())
      const media = (await uploaded.json()).doc
      const file = await api.get(media.url)
      assert.equal(file.ok(), true)
      await writeFile(
        `${output}/state.json`,
        JSON.stringify({ id: media.id, url: media.url, hash: hash(await file.body()) }),
      )
      console.log(
        'PASS: empty DB, first-admin form, admin registration, PNG upload, noindex headers and robots',
      )
    } finally {
      await browser.close()
    }
  } else if (process.argv[2] === 'verify') {
    assert.equal((await (await api.get('/api/users/init')).json()).initialized, true)
    const saved = JSON.parse(await readFile(`${output}/state.json`, 'utf8'))
    const media = await api.get(`/api/media/${saved.id}`)
    assert.equal(media.ok(), true)
    assert.equal((await media.json()).alt, '[MẪU] Docker persistence probe')
    const file = await api.get(saved.url)
    assert.equal(file.ok(), true)
    assert.equal(hash(await file.body()), saved.hash)
    console.log(
      'PASS: admin and media record preserved; uploaded image SHA-256 unchanged; noindex active',
    )
  } else {
    throw new Error('Usage: node tests/manual/docker-demo.mjs bootstrap|verify')
  }
} finally {
  await api.dispose()
}
