// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { randomUUID } from 'node:crypto'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import { signDownloadToken, verifyDownloadToken } from '../../src/lib/downloads/token'
import { GET } from '../../src/app/(site)/api/download/[token]/route'

describe('Download Token & Delivery Route (T1-07)', () => {
  const testSecret = 'test-secret-payload-key-1234567890'
  let payload: Payload
  let productId: number
  let otherProductId: number
  let privateFileId: number
  let privateFileName: string
  let tempFilePath: string

  beforeAll(async () => {
    process.env.PAYLOAD_SECRET = testSecret
    payload = await getPayload({ config })
    const testFileName = `test-resource-${randomUUID()}.pdf`
    tempFilePath = path.resolve(os.tmpdir(), testFileName)
    const validPdfBuffer = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<<>>\nendobj\nxref\n0 1\n0000000000 65535 f\ntrailer\n<<>>\nstartxref\n9\n%%EOF\n',
    )
    fs.writeFileSync(tempFilePath, validPdfBuffer)

    // Create privateFiles record using filePath
    const privateFileDoc = await payload.create({
      collection: 'privateFiles',
      data: {
        description: 'Tài liệu test tải về',
      },
      filePath: tempFilePath,
      overrideAccess: true,
    })
    privateFileId = privateFileDoc.id
    privateFileName = (privateFileDoc as unknown as { filename: string }).filename

    // Create product containing this private file
    const productDoc = await payload.create({
      collection: 'products',
      data: {
        name: 'Sách mẫu hướng dẫn',
        slug: `sach-mau-${randomUUID()}`,
        web: 'site',
        type: 'ebook',
        saleStatus: 'free',
        files: [{ file: privateFileId }],
        _status: 'published',
      },
      overrideAccess: true,
    })
    productId = productDoc.id

    // Create other product without this private file (for cross-product testing)
    const otherProductDoc = await payload.create({
      collection: 'products',
      data: {
        name: 'Sản phẩm khác',
        slug: `san-pham-khac-${randomUUID()}`,
        web: 'site',
        type: 'toolkit',
        saleStatus: 'free',
        files: [],
        _status: 'published',
      },
      overrideAccess: true,
    })
    otherProductId = otherProductDoc.id
  }, 60000)

  afterAll(async () => {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath)
      } catch {
        // ignore
      }
    }

    if (payload) {
      try {
        if (productId) {
          await payload.delete({ collection: 'products', id: productId, overrideAccess: true })
        }
        if (otherProductId) {
          await payload.delete({ collection: 'products', id: otherProductId, overrideAccess: true })
        }
        if (privateFileId) {
          await payload.delete({
            collection: 'privateFiles',
            id: privateFileId,
            overrideAccess: true,
          })
        }
      } catch {
        // ignore
      } finally {
        await payload.destroy()
      }
    }
  }, 30000)

  describe('Pure Download Token Signing & Verification', () => {
    it('signs and verifies a valid token successfully', () => {
      const now = Date.now()
      const expiresAt = now + 7 * 24 * 60 * 60 * 1000

      const token = signDownloadToken({
        productId: 101,
        fileId: 202,
        expiresAt,
        secret: testSecret,
      })

      expect(typeof token).toBe('string')
      expect(token).toContain('.')

      const result = verifyDownloadToken(token, now, testSecret)
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.payload.productId).toBe(101)
        expect(result.payload.fileId).toBe(202)
        expect(result.payload.expiresAt).toBe(expiresAt)
      }
    })

    it('defaults to 7-day expiration when expiresAt is not provided', () => {
      const before = Date.now()
      const token = signDownloadToken({
        productId: 1,
        fileId: 2,
        secret: testSecret,
      })
      const after = Date.now()

      const result = verifyDownloadToken(token, before, testSecret)
      expect(result.valid).toBe(true)
      if (result.valid) {
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
        expect(result.payload.expiresAt).toBeGreaterThanOrEqual(before + sevenDaysMs)
        expect(result.payload.expiresAt).toBeLessThanOrEqual(after + sevenDaysMs)
      }
    })

    it('rejects token when 1 character is modified in the payload part', () => {
      const token = signDownloadToken({
        productId: 101,
        fileId: 202,
        secret: testSecret,
      })

      const [data, sig] = token.split('.')
      // Alter one character in payload
      const tamperedData = data.slice(0, -1) + (data.slice(-1) === 'a' ? 'b' : 'a')
      const tamperedToken = `${tamperedData}.${sig}`

      const result = verifyDownloadToken(tamperedToken, Date.now(), testSecret)
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.reason).toBe('invalid')
      }
    })

    it('rejects token when 1 character is modified in the signature part', () => {
      const token = signDownloadToken({
        productId: 101,
        fileId: 202,
        secret: testSecret,
      })

      const [data, sig] = token.split('.')
      // Alter one character in signature
      const tamperedSig = sig.slice(0, -1) + (sig.slice(-1) === 'x' ? 'y' : 'x')
      const tamperedToken = `${data}.${tamperedSig}`

      const result = verifyDownloadToken(tamperedToken, Date.now(), testSecret)
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.reason).toBe('invalid')
      }
    })

    it('rejects expired token when current time exceeds expiresAt', () => {
      const expiresAt = 1000000
      const token = signDownloadToken({
        productId: 101,
        fileId: 202,
        expiresAt,
        secret: testSecret,
      })

      const result = verifyDownloadToken(token, expiresAt + 1000, testSecret)
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.reason).toBe('expired')
      }
    })

    it('rejects token at the exact expiration milestone (now === expiresAt)', () => {
      const expiresAt = 1000000
      const token = signDownloadToken({
        productId: 101,
        fileId: 202,
        expiresAt,
        secret: testSecret,
      })

      const result = verifyDownloadToken(token, expiresAt, testSecret)
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.reason).toBe('expired')
      }
    })
  })

  describe('Download Route GET /api/download/[token]', () => {
    it('returns 404 for invalid / tampered token', async () => {
      const req = new Request('http://localhost:3000/api/download/invalid-token')
      const response = await GET(req, {
        params: Promise.resolve({ token: 'invalid.token-tampered' }),
      })

      expect(response.status).toBe(404)
      const text = await response.text()
      expect(text).toContain('không hợp lệ')
    })

    it('returns 410 for expired token', async () => {
      const pastTime = Date.now() - 100000
      const token = signDownloadToken({
        productId,
        fileId: privateFileId,
        expiresAt: pastTime,
        secret: testSecret,
      })

      const req = new Request(`http://localhost:3000/api/download/${token}`)
      const response = await GET(req, {
        params: Promise.resolve({ token }),
      })

      expect(response.status).toBe(410)
      const text = await response.text()
      expect(text).toContain('hết hạn')
    })

    it('returns 404 when file belongs to another product or is not in product.files', async () => {
      // Token points to otherProductId which does not have privateFileId
      const token = signDownloadToken({
        productId: otherProductId,
        fileId: privateFileId,
        secret: testSecret,
      })

      const req = new Request(`http://localhost:3000/api/download/${token}`)
      const response = await GET(req, {
        params: Promise.resolve({ token }),
      })

      expect(response.status).toBe(404)
      const text = await response.text()
      expect(text).toContain('không còn thuộc sản phẩm')
    })

    it('returns 200 and streams file attachment when token is valid and associated with product', async () => {
      const token = signDownloadToken({
        productId,
        fileId: privateFileId,
        secret: testSecret,
      })

      const req = new Request(`http://localhost:3000/api/download/${token}`)
      const response = await GET(req, {
        params: Promise.resolve({ token }),
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/pdf')
      expect(response.headers.get('Content-Disposition')).toContain('attachment')
      expect(response.headers.get('Content-Disposition')).toContain(privateFileName)

      const bodyText = await response.text()
      expect(bodyText).toContain('%PDF-1.4')
    })
  })
})
