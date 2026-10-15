// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { Customer, Product } from '../../src/payload-types'
import { resolveProductCta, GROWTH_MIRROR_PATH } from '../../src/lib/products'
import { startTrialAction } from '../../src/lib/entitlements/actions'
import * as sessionServer from '../../src/lib/auth/session.server'
import * as emailService from '../../src/lib/email/service.server'
import { submitDiagnostic } from '../../src/lib/diagnostic.server'
import { HABIT_TRACKER_PRODUCT_SLUG } from '../../src/lib/habit/config'
import { vi as viStrings } from '../../src/lib/i18n/vi'

describe('Trial Actions & Quiz CTA (T2-04)', () => {
  let payload: Payload
  const createdCustomers: number[] = []
  const createdProducts: number[] = []
  const createdEntitlements: number[] = []
  const createdLeads: number[] = []
  const createdResults: number[] = []

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  afterAll(async () => {
    for (const id of createdEntitlements) {
      try {
        await payload.delete({ collection: 'entitlements', id, overrideAccess: true })
      } catch (_e) {}
    }
    for (const id of createdResults) {
      try {
        await payload.delete({ collection: 'diagnosticResults', id, overrideAccess: true })
      } catch (_e) {}
    }
    for (const id of createdLeads) {
      try {
        await payload.delete({ collection: 'leads', id, overrideAccess: true })
      } catch (_e) {}
    }
    for (const id of createdCustomers) {
      try {
        await payload.delete({
          collection: 'customers',
          id,
          overrideAccess: true,
          context: { accountDeletion: true },
        })
      } catch (_e) {}
    }
    for (const id of createdProducts) {
      try {
        await payload.delete({ collection: 'products', id, overrideAccess: true })
      } catch (_e) {}
    }
  })

  async function createCustomer(name = 'Khách Dùng Thử'): Promise<Customer> {
    const cust = await payload.create({
      collection: 'customers',
      data: {
        email: `trial-cust-${randomUUID()}@example.test`,
        name,
        consentAt: new Date().toISOString(),
      },
      overrideAccess: true,
    })
    createdCustomers.push(cust.id)
    return cust
  }

  async function createDigitalProduct(data: {
    name: string
    slug?: string
    trialDays?: number
    saleStatus?: 'on_sale' | 'consult' | 'coming_soon' | 'free' | 'hidden'
    status?: 'published' | 'draft'
  }): Promise<Product> {
    const prod = await payload.create({
      collection: 'products',
      data: {
        name: data.name,
        slug: data.slug || `trial-prod-${randomUUID()}`,
        web: 'habit',
        type: 'digital_tool',
        price: 250000,
        salePrice: 178000,
        trialDays: data.trialDays ?? 21,
        saleStatus: data.saleStatus ?? 'on_sale',
        _status: data.status ?? 'published',
      },
      overrideAccess: true,
    })
    createdProducts.push(prod.id)
    return prod
  }

  describe('1. resolveProductCta', () => {
    it('sản phẩm có trialDays > 0 và on_sale -> dẫn tới /dung-thu?san-pham=<slug>', () => {
      const mockProduct = {
        slug: 'habit-tracker-so',
        type: 'digital_tool',
        saleStatus: 'on_sale',
        trialDays: 21,
      } as Product

      const cta = resolveProductCta(mockProduct)
      expect(cta).not.toBeNull()
      expect(cta?.kind).toBe('trial')
      expect(cta?.href).toBe('/dung-thu?san-pham=habit-tracker-so')
    })
  })

  describe('2. startTrialAction', () => {
    it('chưa đăng nhập -> từ chối với UNAUTHENTICATED', async () => {
      vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValueOnce(null)

      const res = await startTrialAction('some-product-slug')
      expect(res.success).toBe(false)
      expect(res.code).toBe('UNAUTHENTICATED')
      expect(res.message).toBe(viStrings.auth.unauthorizedNotice)
    })

    it('TRIAL_STARTED gửi đúng 1 email; TRIAL_ACTIVE không gửi thêm', async () => {
      const product = await createDigitalProduct({
        name: 'Habit Tracker Số Test',
        trialDays: 21,
      })
      const customer = await createCustomer('Khách Action Test')

      vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customer)
      const sendEmailSpy = vi
        .spyOn(emailService, 'sendTrialWelcomeEmail')
        .mockResolvedValue(undefined)

      // Lần 1: Bắt đầu dùng thử -> TRIAL_STARTED
      const res1 = await startTrialAction(product.slug)
      expect(res1.success).toBe(true)
      expect(res1.code).toBe('TRIAL_STARTED')
      expect(res1.days).toBe(21)
      expect(res1.toolUrl).toBeDefined()
      expect(sendEmailSpy).toHaveBeenCalledTimes(1)

      const emailCall = sendEmailSpy.mock.calls[0]
      expect(emailCall[1].email).toBe(customer.email)
      expect(emailCall[1].toolName).toBe(product.name)
      expect(emailCall[1].trialDays).toBe(21)

      // Lần 2: Gọi lại -> TRIAL_ACTIVE, không gửi thêm email
      sendEmailSpy.mockClear()
      const res2 = await startTrialAction(product.slug)
      expect(res2.success).toBe(true)
      expect(res2.code).toBe('TRIAL_ACTIVE')
      expect(sendEmailSpy).not.toHaveBeenCalled()
    })
  })

  describe('3. CTA kết quả quiz (submitDiagnostic)', () => {
    it('có sản phẩm Habit Tracker số mở dùng thử -> ctaHref là link dùng thử, ctaLabel theo dùng thử', async () => {
      // Đảm bảo có sản phẩm HABIT_TRACKER_PRODUCT_SLUG
      await createDigitalProduct({
        name: 'Habit Tracker Số Quiz Test',
        slug: HABIT_TRACKER_PRODUCT_SLUG,
        trialDays: 21,
        saleStatus: 'on_sale',
        status: 'published',
      })

      // Lấy câu hỏi từ DB
      const qRes = await payload.find({
        collection: 'diagnosticQuestions',
        where: { _status: { equals: 'published' } },
        limit: 16,
      })
      if (qRes.docs.length === 0) return

      const answers = qRes.docs.map((q) => ({ questionId: q.id, score: 3 }))

      const result = await submitDiagnostic(
        { answers },
        { ip: '127.0.0.1', page: '/habit/chan-doan' },
        { payload },
      )

      expect(result.success).toBe(true)
      expect(result.data?.ctaHref).toBe(`/dung-thu?san-pham=${HABIT_TRACKER_PRODUCT_SLUG}`)
      expect(result.data?.ctaLabel).toBe(viStrings.diagnostic.result.trialCtaButton(21))
    })

    it('không có hoặc tắt sản phẩm -> ctaHref giữ GROWTH_MIRROR_PATH', async () => {
      // Tạm cập nhật habitProduct sang draft
      const habitRes = await payload.find({
        collection: 'products',
        where: { slug: { equals: HABIT_TRACKER_PRODUCT_SLUG } },
      })
      if (habitRes.docs[0]) {
        await payload.update({
          collection: 'products',
          id: habitRes.docs[0].id,
          data: { _status: 'draft' },
        })
      }

      const qRes = await payload.find({
        collection: 'diagnosticQuestions',
        where: { _status: { equals: 'published' } },
        limit: 16,
      })
      if (qRes.docs.length === 0) return

      const answers = qRes.docs.map((q) => ({ questionId: q.id, score: 3 }))

      const result = await submitDiagnostic(
        { answers },
        { ip: '127.0.0.1', page: '/habit/chan-doan' },
        { payload },
      )

      expect(result.success).toBe(true)
      expect(result.data?.ctaHref).toBe(GROWTH_MIRROR_PATH)
      expect(result.data?.ctaLabel).toBe(viStrings.diagnostic.result.ctaButton)

      // Khôi phục lại
      if (habitRes.docs[0]) {
        await payload.update({
          collection: 'products',
          id: habitRes.docs[0].id,
          data: { _status: 'published' },
        })
      }
    })
  })
})
