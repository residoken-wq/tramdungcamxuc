// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import * as actions from '../../src/lib/eq/actions'
import {
  drawEqCardCore,
  signGuestDrawCookie,
  verifyGuestDrawCookie,
  checkEqDrawAccess,
  EQ_DRAW_GUEST_COOKIE,
} from '../../src/lib/eq/draw.server'
import { getPublishedEqKeywords } from '../../src/lib/eq/cards.server'
import { EQ_BUDDY_PRODUCT_SLUG } from '../../src/lib/eq/config'
import type { Customer, Product } from '../../src/payload-types'

describe('EQ Buddy Card Draw & 21-Day Trial Limit (T3-02)', () => {
  let payload: Payload
  let productId: number
  const createdCardIds: (number | string)[] = []
  const createdCustomerIds: number[] = []
  const createdEntitlementIds: number[] = []

  let cardACode: string
  let cardBCode: string
  let cardDraftCode: string
  let cardASlug: string
  let cardBSlug: string
  let cardDraftSlug: string

  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    // 1. Kiểm tra hoặc tạo sản phẩm EQ Buddy số
    const existingProducts = await payload.find({
      collection: 'products',
      where: { slug: { equals: EQ_BUDDY_PRODUCT_SLUG } },
      limit: 1,
      overrideAccess: true,
    })

    if (existingProducts.docs.length > 0) {
      productId = existingProducts.docs[0].id
    } else {
      const p = await payload.create({
        collection: 'products',
        data: {
          slug: EQ_BUDDY_PRODUCT_SLUG,
          name: '[TEST] EQ Buddy số',
          web: 'eq',
          type: 'digital_tool',
          journeyStep: 'feel',
          trialDays: 21,
          saleStatus: 'on_sale',
          _status: 'published',
        },
        overrideAccess: true,
      })
      productId = p.id
    }

    const suffix = randomUUID().slice(0, 8)
    cardACode = `EQ-TEST-A-${suffix}`
    cardBCode = `EQ-TEST-B-${suffix}`
    cardDraftCode = `EQ-TEST-DRAFT-${suffix}`
    cardASlug = `test-slug-a-${suffix}`
    cardBSlug = `test-slug-b-${suffix}`
    cardDraftSlug = `test-slug-draft-${suffix}`

    // 2. Tạo 2 thẻ đã xuất bản và 1 thẻ nháp
    const cardA = await payload.create({
      collection: 'eqCards',
      data: {
        code: cardACode,
        keywordEn: `Alpha ${suffix}`,
        qrSlug: cardASlug,
        message: 'Thông điệp thẻ A thử nghiệm',
        promptRecall: 'Câu hỏi gợi nhớ A',
        promptPack: 'Câu hỏi gói ghém A',
        promptAcknowledge: 'Câu hỏi ghi nhận A',
        order: 9001,
        _status: 'published',
      },
      overrideAccess: true,
    })
    createdCardIds.push(cardA.id)

    const cardB = await payload.create({
      collection: 'eqCards',
      data: {
        code: cardBCode,
        keywordEn: `Beta ${suffix}`,
        qrSlug: cardBSlug,
        message: 'Thông điệp thẻ B thử nghiệm',
        promptRecall: 'Câu hỏi gợi nhớ B',
        promptPack: 'Câu hỏi gói ghém B',
        promptAcknowledge: 'Câu hỏi ghi nhận B',
        order: 9002,
        _status: 'published',
      },
      overrideAccess: true,
    })
    createdCardIds.push(cardB.id)

    const cardDraft = await payload.create({
      collection: 'eqCards',
      data: {
        code: cardDraftCode,
        keywordEn: `Draft ${suffix}`,
        qrSlug: cardDraftSlug,
        message: 'Thông điệp thẻ nháp',
        promptRecall: 'Câu hỏi gợi nhớ nháp',
        promptPack: 'Câu hỏi gói ghém nháp',
        promptAcknowledge: 'Câu hỏi ghi nhận nháp',
        order: 9003,
        _status: 'draft',
      },
      overrideAccess: true,
    })
    createdCardIds.push(cardDraft.id)
  }, 60000)

  afterAll(async () => {
    // 1. Dọn entitlements
    for (const id of createdEntitlementIds) {
      try {
        await payload.delete({ collection: 'entitlements', id, overrideAccess: true })
      } catch {
        // Ignore individual errors
      }
    }

    // 2. Dọn thẻ test
    for (const id of createdCardIds) {
      try {
        await payload.delete({ collection: 'eqCards', id, overrideAccess: true })
      } catch {
        // Ignore individual errors
      }
    }

    // 3. Dọn khách hàng: bắt buộc truyền accountDeletion: true
    for (const id of createdCustomerIds) {
      try {
        await payload.delete({
          collection: 'customers',
          id,
          overrideAccess: true,
          context: { accountDeletion: true },
        })
      } catch {
        // Ignore individual errors
      }
    }

    const remainingCusts = await payload.find({
      collection: 'customers',
      overrideAccess: true,
      limit: 10,
    })
    console.log('REMAINING_CUSTOMERS_IN_DB:', remainingCusts.totalDocs)

    await payload.destroy()
  }, 30000)

  describe('1. Kiến trúc phân tách server action và hàm lõi', () => {
    it('actions.ts chỉ export duy nhất hàm bọc drawEqCardAction', () => {
      expect(Object.keys(actions)).toEqual(['drawEqCardAction'])
      expect(typeof actions.drawEqCardAction).toBe('function')
    })
  })

  describe('2. Chữ ký HMAC cookie lượt rút của khách chưa đăng nhập', () => {
    it('cookie rỗng hoặc null được coi là chưa rút (count = 0)', () => {
      expect(verifyGuestDrawCookie(null).count).toBe(0)
      expect(verifyGuestDrawCookie(undefined).count).toBe(0)
      expect(verifyGuestDrawCookie('').count).toBe(0)
    })

    it('ký và giải mã cookie hợp lệ chính xác', () => {
      const signed = signGuestDrawCookie({ count: 1, timestamp: Date.now() })
      const res = verifyGuestDrawCookie(signed)
      expect(res.valid).toBe(true)
      expect(res.count).toBe(1)
    })

    it('cookie ký sai hoặc sửa tay bị chặn và coi như đã dùng (count = 1)', () => {
      // 1. Chữ ký giả mạo
      const fakeSig = '1:123456789.bad_signature_abc'
      const res1 = verifyGuestDrawCookie(fakeSig)
      expect(res1.valid).toBe(false)
      expect(res1.count).toBe(1)

      // 2. Sửa payload của cookie đã ký (tấn công tamper)
      const valid = signGuestDrawCookie({ count: 1, timestamp: Date.now() })
      const tampered = valid.replace('1:', '0:')
      const res2 = verifyGuestDrawCookie(tampered)
      expect(res2.valid).toBe(false)
      expect(res2.count).toBe(1)

      // 3. Chuỗi rác không đúng format
      const res3 = verifyGuestDrawCookie('gibberish-without-dots')
      expect(res3.valid).toBe(false)
      expect(res3.count).toBe(1)
    })
  })

  describe('3. Đọc từ khóa và quy tắc rút thẻ (Published / Random / Keyword)', () => {
    it('getPublishedEqKeywords chỉ trả về thẻ đã xuất bản và sắp theo order', async () => {
      const keywords = await getPublishedEqKeywords()
      const foundA = keywords.find((k) => k.code === cardACode)
      const foundB = keywords.find((k) => k.code === cardBCode)
      const foundDraft = keywords.find((k) => k.code === cardDraftCode)

      expect(foundA).toBeDefined()
      expect(foundB).toBeDefined()
      expect(foundDraft).toBeUndefined()
    })

    it('rút ngẫu nhiên không bao giờ trả về thẻ nháp', async () => {
      for (let i = 0; i < 5; i++) {
        const res = await drawEqCardCore({ mode: 'random' }, { guestCookieOverride: null })
        expect(res.success).toBe(true)
        if (res.success) {
          expect(res.card.code).not.toBe(cardDraftCode)
        }
      }
    })

    it('rút ngẫu nhiên không trùng thẻ vừa rút liền trước khi có ≥ 2 thẻ', async () => {
      // Khi loại trừ cardACode, nếu candidates có ≥ 2 thì không được trả về cardACode
      for (let i = 0; i < 5; i++) {
        const res = await drawEqCardCore(
          { mode: 'random', previousCardCode: cardACode },
          { guestCookieOverride: null },
        )
        expect(res.success).toBe(true)
        if (res.success) {
          expect(res.card.code).not.toBe(cardACode)
        }
      }
    })

    it('chọn theo từ khóa với slug nháp hoặc không tồn tại trả về lỗi NOT_FOUND', async () => {
      // Slug nháp
      const resDraft = await drawEqCardCore(
        { mode: 'keyword', qrSlug: cardDraftSlug },
        { guestCookieOverride: null },
      )
      expect(resDraft.success).toBe(false)
      if (!resDraft.success) {
        expect(resDraft.code).toBe('NOT_FOUND')
      }

      // Slug không tồn tại
      const resNonExistent = await drawEqCardCore(
        { mode: 'keyword', qrSlug: `non-existent-${randomUUID()}` },
        { guestCookieOverride: null },
      )
      expect(resNonExistent.success).toBe(false)
      if (!resNonExistent.success) {
        expect(resNonExistent.code).toBe('NOT_FOUND')
      }
    })

    it('chọn theo từ khóa hợp lệ trả về đúng thẻ', async () => {
      const res = await drawEqCardCore(
        { mode: 'keyword', qrSlug: cardASlug },
        { guestCookieOverride: null },
      )
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.card.code).toBe(cardACode)
        expect(res.card.keywordEn).toContain('Alpha')
      }
    })
  })

  describe('4. Giới hạn dùng thử (Guest vs Logged-in Customer)', () => {
    it('khách chưa đăng nhập: lần 1 được rút, lần 2 bị chặn bởi paywall', async () => {
      let savedCookie = ''
      const res1 = await drawEqCardCore(
        { mode: 'random' },
        {
          guestCookieOverride: null,
          setCookie: (_name, value) => {
            savedCookie = value
          },
        },
      )
      expect(res1.success).toBe(true)
      expect(savedCookie).toBeTruthy()

      // Lần thứ 2 gửi kèm cookie đã ký
      const res2 = await drawEqCardCore({ mode: 'random' }, { guestCookieOverride: savedCookie })
      expect(res2.success).toBe(false)
      if (!res2.success) {
        expect(res2.code).toBe('PAYWALL')
        expect(res2.productSlug).toBe(EQ_BUDDY_PRODUCT_SLUG)
      }
    })

    it('khách chưa đăng nhập gửi cookie giả mạo bị chặn ngay bởi paywall', async () => {
      const res = await drawEqCardCore(
        { mode: 'random' },
        { guestCookieOverride: '0:12345.tampered' },
      )
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.code).toBe('PAYWALL')
      }
    })

    it('thành viên đã đăng nhập có trial còn hạn -> không giới hạn lượt rút', async () => {
      // 1. Tạo customer
      const customer = await payload.create({
        collection: 'customers',
        data: {
          email: `trial-cust-${randomUUID()}@example.test`,
          consentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
      createdCustomerIds.push(customer.id)

      // 2. Tạo quyền trial còn 21 ngày
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString()
      const ent = await payload.create({
        collection: 'entitlements',
        data: {
          customer: customer.id,
          product: productId,
          source: 'trial',
          status: 'trial',
          startsAt: now.toISOString(),
          expiresAt,
        },
        overrideAccess: true,
      })
      createdEntitlementIds.push(ent.id)

      // 3. Rút nhiều lần liên tiếp vẫn thành công
      for (let i = 0; i < 3; i++) {
        const res = await drawEqCardCore({ mode: 'random' }, { customerIdOverride: customer.id })
        expect(res.success).toBe(true)
      }
    })

    it('thành viên đã đăng nhập nhưng trial đã hết hạn -> bị chặn bởi paywall', async () => {
      // 1. Tạo customer
      const customer = await payload.create({
        collection: 'customers',
        data: {
          email: `expired-cust-${randomUUID()}@example.test`,
          consentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
      createdCustomerIds.push(customer.id)

      // 2. Tạo quyền trial đã hết hạn 1 ngày trước
      const now = new Date()
      const past = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      const ent = await payload.create({
        collection: 'entitlements',
        data: {
          customer: customer.id,
          product: productId,
          source: 'trial',
          status: 'expired',
          startsAt: new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000).toISOString(),
          expiresAt: past,
        },
        overrideAccess: true,
      })
      createdEntitlementIds.push(ent.id)

      // 3. Rút thẻ bị chặn
      const res = await drawEqCardCore({ mode: 'random' }, { customerIdOverride: customer.id })
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.code).toBe('PAYWALL')
      }
    })
  })
})
