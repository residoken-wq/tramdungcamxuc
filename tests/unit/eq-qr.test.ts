// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import { CUSTOMER_TOKEN_COOKIE, signCustomerToken } from '../../src/lib/auth/token'
import { buildCardQrUrl, escapeCsvCell, getQrPngFilename } from '../../src/lib/eq/qr'
import { getPublishedEqCardByQrSlug } from '../../src/lib/eq/cards.server'
import { GET as GET_CSV } from '../../src/app/(payload)/api/eq-cards/qr-export/route'
import { GET as GET_PNG } from '../../src/app/(payload)/api/eq-cards/[id]/qr/route'

describe('EQ Card QR & Printing Export (T3-03)', () => {
  let payload: Payload
  let editorToken: string
  let editorId: number
  let customerToken: string
  let customerId: number
  const createdCards: (number | string)[] = []

  beforeAll(async () => {
    payload = await getPayload({ config })

    // 1. Tạo tài khoản editor
    const editorEmail = `editor-eq-${randomUUID()}@example.test`
    const editorPassword = randomUUID()
    const editorUser = await payload.create({
      collection: 'users',
      data: {
        email: editorEmail,
        password: editorPassword,
        role: 'editor',
      },
    })
    editorId = editorUser.id

    const editorLogin = await payload.login({
      collection: 'users',
      data: { email: editorEmail, password: editorPassword },
    })
    editorToken = editorLogin.token || ''

    // 2. Tạo tài khoản khách hàng (customers dùng token cookie)
    const customerEmail = `customer-eq-${randomUUID()}@example.test`
    const customer = await payload.create({
      collection: 'customers',
      data: {
        email: customerEmail,
        consentAt: new Date().toISOString(),
      },
    })
    customerId = customer.id
    customerToken = signCustomerToken({ id: customer.id, email: customer.email })
  }, 60000)

  afterAll(async () => {
    if (!payload) return
    try {
      for (const id of createdCards) {
        try {
          await payload.delete({ collection: 'eqCards', id, overrideAccess: true })
        } catch {
          // Ignore individual delete errors
        }
      }
      if (editorId) {
        try {
          await payload.delete({ collection: 'users', id: editorId, overrideAccess: true })
        } catch {
          // Ignore individual delete errors
        }
      }
      if (customerId) {
        await payload.delete({
          collection: 'customers',
          id: customerId,
          overrideAccess: true,
          context: { accountDeletion: true },
        })
      }
    } catch {
      // Ignore cleanup errors
    } finally {
      await payload.destroy()
    }
  }, 30000)

  describe('1. Hàm dựng link QR & tên file in (pure helpers)', () => {
    it('buildCardQrUrl tạo link chuẩn không thêm tham số truy vấn', () => {
      expect(buildCardQrUrl('an-yen', 'https://tramdungcamxuc.com')).toBe(
        'https://tramdungcamxuc.com/eq-buddy/the/an-yen',
      )
      expect(buildCardQrUrl('biet-on', 'https://demo.tramdungcamxuc.com/')).toBe(
        'https://demo.tramdungcamxuc.com/eq-buddy/the/biet-on',
      )
      // Default base is always the production domain, even when SITE_URL points at a demo host
      const prevSiteUrl = process.env.SITE_URL
      process.env.SITE_URL = 'http://10.0.0.1:3400'
      const url = buildCardQrUrl('tu-tin')
      if (prevSiteUrl === undefined) delete process.env.SITE_URL
      else process.env.SITE_URL = prevSiteUrl
      expect(url).toBe('https://tramdungcamxuc.com/eq-buddy/the/tu-tin')
      expect(url).not.toContain('?')
      expect(url).not.toContain('&')
    })

    it('getQrPngFilename chuyển đổi tên file sang ASCII an toàn', () => {
      expect(getQrPngFilename('EQ-01')).toBe('qr-EQ-01.png')
      expect(getQrPngFilename('EQ 02 / BÌNH AN')).toBe('qr-EQ_02___B_NH_AN.png')
      expect(getQrPngFilename('')).toBe('qr-card.png')
    })

    it('escapeCsvCell chống CSV injection', () => {
      expect(escapeCsvCell('=CMD|/C calc!A0')).toBe("'=CMD|/C calc!A0")
      expect(escapeCsvCell('+123456')).toBe("'+123456")
      expect(escapeCsvCell('-999')).toBe("'-999")
      expect(escapeCsvCell('@SUM(A1:B2)')).toBe("'@SUM(A1:B2)")
      expect(escapeCsvCell('\t=1+1')).toBe("'\t=1+1")
      expect(escapeCsvCell('Bình thường')).toBe('Bình thường')
    })
  })

  describe('2. Route xuất CSV (/api/eq-cards/qr-export)', () => {
    it('trả 401 khi chưa đăng nhập', async () => {
      const req = new Request('http://localhost:3000/api/eq-cards/qr-export', { method: 'GET' })
      const res = await GET_CSV(req)
      expect(res.status).toBe(401)
      const text = await res.text()
      expect(text).toContain('Chưa đăng nhập')
    })

    it('trả 403 khi đăng nhập bằng tài khoản khách hàng (customers)', async () => {
      const req = new Request('http://localhost:3000/api/eq-cards/qr-export', {
        method: 'GET',
        headers: {
          Cookie: `${CUSTOMER_TOKEN_COOKIE}=${customerToken}`,
        },
      })
      const res = await GET_CSV(req)
      expect(res.status).toBe(403)
      const text = await res.text()
      expect(text).toContain('Không có quyền truy cập')
    })

    it('trả 200 cho editor, có UTF-8 BOM, đầy đủ cột và chống CSV injection', async () => {
      const suffix = randomUUID().slice(0, 6)
      const injectedCode = `=SUM(1)-${suffix}`
      const testSlug = `test-csv-qr-${suffix}`

      const card = await payload.create({
        collection: 'eqCards',
        data: {
          code: injectedCode,
          qrSlug: testSlug,
          message: 'Lời nhắn thử nghiệm [TEST]',
          keywordEn: '[TEST] Keyword',
          promptRecall: '[TEST] Gợi nhớ?',
          promptPack: '[TEST] Gói ghém?',
          promptAcknowledge: '[TEST] Ghi nhận?',
          _status: 'published',
          order: 10,
        },
        draft: false,
      })
      createdCards.push(card.id)

      const req = new Request('http://localhost:3000/api/eq-cards/qr-export', {
        method: 'GET',
        headers: {
          Authorization: `JWT ${editorToken}`,
        },
      })
      const res = await GET_CSV(req)
      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toContain('text/csv; charset=utf-8')
      expect(res.headers.get('Content-Disposition')).toContain('attachment; filename="eq-qr-')

      const buffer = await res.arrayBuffer()
      const bytes = new Uint8Array(buffer)

      // Kiểm tra UTF-8 BOM bytes (\uFEFF: 0xEF, 0xBB, 0xBF)
      expect(bytes[0]).toBe(0xef)
      expect(bytes[1]).toBe(0xbb)
      expect(bytes[2]).toBe(0xbf)

      const csv = new TextDecoder('utf-8', { ignoreBOM: true }).decode(buffer)
      expect(csv.startsWith('\uFEFF')).toBe(true)

      // Kiểm tra tiêu đề các cột chuẩn
      expect(csv).toContain('code,qrSlug,url,trạng thái,ngày in,link PNG')

      // Kiểm tra dòng dữ liệu có link in và link PNG
      expect(csv).toContain(testSlug)
      expect(csv).toContain(`/eq-buddy/the/${testSlug}`)
      expect(csv).toContain(`/api/eq-cards/${card.id}/qr`)
      expect(csv).toContain('Đã xuất bản')

      // Kiểm tra chống CSV injection: code bắt đầu bằng '=' được escape thành "'="
      expect(csv).toContain(`'=SUM(1)-${suffix}`)
      expect(csv).not.toMatch(new RegExp(`(^|\\n)=SUM\\(1\\)-${suffix}`))
    })
  })

  describe('3. Route tải ảnh PNG (/api/eq-cards/[id]/qr)', () => {
    it('trả 401 khi chưa đăng nhập', async () => {
      const req = new Request('http://localhost:3000/api/eq-cards/999999/qr', { method: 'GET' })
      const res = await GET_PNG(req, { params: Promise.resolve({ id: '999999' }) })
      expect(res.status).toBe(401)
    })

    it('trả 403 khi đăng nhập bằng khách hàng (customers)', async () => {
      const req = new Request('http://localhost:3000/api/eq-cards/999999/qr', {
        method: 'GET',
        headers: {
          Cookie: `${CUSTOMER_TOKEN_COOKIE}=${customerToken}`,
        },
      })
      const res = await GET_PNG(req, { params: Promise.resolve({ id: '999999' }) })
      expect(res.status).toBe(403)
    })

    it('trả 404 khi ID thẻ không tồn tại', async () => {
      const req = new Request('http://localhost:3000/api/eq-cards/999999/qr', {
        method: 'GET',
        headers: {
          Authorization: `JWT ${editorToken}`,
        },
      })
      const res = await GET_PNG(req, { params: Promise.resolve({ id: '999999' }) })
      expect(res.status).toBe(404)
    })

    it('trả 200 ảnh PNG giải mã được (chữ ký \\x89PNG) cho thẻ hợp lệ', async () => {
      const suffix = randomUUID().slice(0, 6)
      const testCode = `EQ-${suffix}`
      const testSlug = `test-png-qr-${suffix}`

      const card = await payload.create({
        collection: 'eqCards',
        data: {
          code: testCode,
          qrSlug: testSlug,
          message: 'Thông điệp thẻ test PNG [TEST]',
          keywordEn: '[TEST] Keyword',
          promptRecall: '[TEST] Gợi nhớ?',
          promptPack: '[TEST] Gói ghém?',
          promptAcknowledge: '[TEST] Ghi nhận?',
          _status: 'published',
          order: 1,
        },
        draft: false,
      })
      createdCards.push(card.id)

      const req = new Request(`http://localhost:3000/api/eq-cards/${card.id}/qr`, {
        method: 'GET',
        headers: {
          Authorization: `JWT ${editorToken}`,
        },
      })
      const res = await GET_PNG(req, { params: Promise.resolve({ id: String(card.id) }) })
      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toBe('image/png')
      expect(res.headers.get('Content-Disposition')).toContain(`filename="qr-${testCode}.png"`)

      const buffer = await res.arrayBuffer()
      const bytes = new Uint8Array(buffer)

      // Chữ ký PNG chuẩn: 0x89, 0x50 ('P'), 0x4E ('N'), 0x47 ('G'), 0x0D, 0x0A, 0x1A, 0x0A
      expect(bytes[0]).toBe(0x89)
      expect(bytes[1]).toBe(0x50)
      expect(bytes[2]).toBe(0x4e)
      expect(bytes[3]).toBe(0x47)
      expect(bytes[4]).toBe(0x0d)
      expect(bytes[5]).toBe(0x0a)
      expect(bytes[6]).toBe(0x1a)
      expect(bytes[7]).toBe(0x0a)

      // Kích thước tối thiểu lớn hơn 5KB (đáp ứng 1200x1200px)
      expect(bytes.byteLength).toBeGreaterThan(5000)
    })
  })

  describe('4. Đọc thẻ EQ (getPublishedEqCardByQrSlug)', () => {
    it('thẻ nháp (draft) trả về null (trang sẽ 404)', async () => {
      const draftSlug = `test-draft-slug-${randomUUID().slice(0, 8)}`
      const card = await payload.create({
        collection: 'eqCards',
        data: {
          code: `[TEST] DRAFT-${randomUUID().slice(0, 6)}`,
          qrSlug: draftSlug,
          message: 'Thông điệp thẻ nháp [TEST]',
          _status: 'draft',
        },
        draft: true,
      })
      createdCards.push(card.id)

      const found = await getPublishedEqCardByQrSlug(draftSlug)
      expect(found).toBeNull()
    })

    it('thẻ đã xuất bản (published) đọc được thông điệp và thông tin', async () => {
      const pubSlug = `test-pub-slug-${randomUUID().slice(0, 8)}`
      const expectedMessage = 'Hít sâu, thở nhẹ, bạn đang ở đây trong an lành. [TEST]'
      const expectedCode = `[TEST] PUB-${randomUUID().slice(0, 6)}`

      const card = await payload.create({
        collection: 'eqCards',
        data: {
          code: expectedCode,
          qrSlug: pubSlug,
          message: expectedMessage,
          keywordEn: '[TEST] Keyword',
          promptRecall: '[TEST] Gợi nhớ?',
          promptPack: '[TEST] Gói ghém?',
          promptAcknowledge: '[TEST] Ghi nhận?',
          _status: 'published',
        },
        draft: false,
      })
      createdCards.push(card.id)

      const found = await getPublishedEqCardByQrSlug(pubSlug)
      expect(found).not.toBeNull()
      expect(found?.code).toBe(expectedCode)
      expect(found?.message).toBe(expectedMessage)
      expect(found?.qrSlug).toBe(pubSlug)
    })

    it('slug không tồn tại trả về null', async () => {
      const notFound = await getPublishedEqCardByQrSlug(`non-existent-${randomUUID()}`)
      expect(notFound).toBeNull()
    })
  })
})
