import React from 'react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import config from '../../src/payload.config'
import type { Customer, Product } from '../../src/payload-types'
import { getTrialEligibility } from '../../src/lib/entitlements/service.server'
import { getHabitStageGate } from '../../src/lib/habit/stage-gate.server'
import { sampleProductData } from './helpers/product-fixture'
import { getSafeRedirectUrl } from '../../src/lib/auth/redirect'
import { submitHabitPlan } from '../../src/lib/habit.server'
import { hashTrialEmail } from '../../src/lib/auth/token'
import { HabitTrackerApp } from '../../src/components/habit/zip/HabitTrackerApp'
import { HABIT_TRACKER_PRODUCT_SLUG } from '../../src/lib/habit/config'
import { vi as viStrings } from '../../src/lib/i18n/vi'

describe('DP-03: Cổng đăng nhập sau Giai đoạn 1 Habit (/habit/5-phut)', () => {
  let payload: Payload
  let habitProduct: Product
  let inactiveProduct: Product
  const createdDocs: { collection: CollectionSlug; id: number }[] = []
  const trackedEmails: string[] = []

  const track = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
    createdDocs.push({ collection, id: doc.id })
    return doc
  }

  const createCustomer = async (prefix: string, consent = true): Promise<Customer> => {
    const email = `dp03-${prefix}-${randomUUID().slice(0, 8)}@example.test`
    trackedEmails.push(email)
    const doc = await payload.create({
      collection: 'customers',
      data: {
        email,
        name: `Test ${prefix}`,
        consentAt: consent ? new Date().toISOString() : undefined,
      },
      overrideAccess: true,
    })
    return track('customers', doc as Customer)
  }

  beforeAll(async () => {
    payload = await getPayload({ config })

    // Đảm bảo có sản phẩm habit-tracker-so on_sale
    const existing = await payload.find({
      collection: 'products',
      where: { slug: { equals: HABIT_TRACKER_PRODUCT_SLUG } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (existing.docs.length > 0) {
      habitProduct = existing.docs[0] as Product
    } else {
      habitProduct = track(
        'products',
        (await payload.create({
          collection: 'products',
          data: sampleProductData({
            name: '[MẪU] Habit Tracker số',
            slug: HABIT_TRACKER_PRODUCT_SLUG,
            price: 250000,
            salePrice: 178000,
            trialDays: 28,
          }) as never,
          overrideAccess: true,
        })) as Product,
      )
    }

    // Sản phẩm không bán (hidden)
    inactiveProduct = track(
      'products',
      (await payload.create({
        collection: 'products',
        data: sampleProductData({
          name: '[MẪU] Sản phẩm ngưng bán',
          slug: `inactive-${randomUUID().slice(0, 6)}`,
          saleStatus: 'hidden',
          price: 100000,
          trialDays: 14,
        }) as never,
        overrideAccess: true,
      })) as Product,
    )
  })

  afterAll(async () => {
    cleanup()
    vi.restoreAllMocks()

    for (const item of createdDocs.reverse()) {
      try {
        await payload.delete({
          collection: item.collection,
          id: item.id,
          overrideAccess: true,
        })
      } catch {
        // noop
      }
    }

    for (const email of trackedEmails) {
      try {
        await payload.delete({
          collection: 'leads',
          where: { email: { equals: email } },
          overrideAccess: true,
        })
      } catch {
        // noop
      }
      try {
        await payload.delete({
          collection: 'habitPlans',
          where: { leadEmail: { equals: email } },
          overrideAccess: true,
        })
      } catch {
        // noop
      }
    }
  })

  describe('1. getTrialEligibility (hàm chỉ đọc đánh giá điều kiện dùng thử)', () => {
    it('khách mới -> eligible: true', async () => {
      const customer = await createCustomer('new')
      const res = await getTrialEligibility(customer.id, habitProduct.id, { payload })
      expect(res.eligible).toBe(true)
    })

    it('đã có entitlement trial (còn hạn hoặc hết hạn) -> eligible: false', async () => {
      const customer = await createCustomer('had-trial')

      // Cấp trial cho khách
      const trialEntitlement = track(
        'entitlements',
        await payload.create({
          collection: 'entitlements',
          data: {
            customer: customer.id,
            product: habitProduct.id,
            source: 'trial',
            status: 'trial',
            grantedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
            trialKey: `${customer.id}:${habitProduct.id}`,
          },
          overrideAccess: true,
        }),
      )

      const res = await getTrialEligibility(customer.id, habitProduct.id, { payload })
      expect(res.eligible).toBe(false)
      expect(res.code).toBe('TRIAL_ACTIVE')

      // Chuyển trial sang expired -> vẫn không được dùng thử lần 2
      await payload.update({
        collection: 'entitlements',
        id: trialEntitlement.id,
        data: {
          status: 'expired',
          expiresAt: new Date(Date.now() - 86400000).toISOString(),
        },
        overrideAccess: true,
      })

      const resExpired = await getTrialEligibility(customer.id, habitProduct.id, { payload })
      expect(resExpired.eligible).toBe(false)
      expect(resExpired.code).toBe('TRIAL_ALREADY_USED')
    })

    it('email đã dùng thử ở tài khoản đã xoá (trialUsage theo hashTrialEmail) -> eligible: false', async () => {
      const email = `dp03-deleted-${randomUUID().slice(0, 8)}@example.test`
      trackedEmails.push(email)

      // Ghi vết vào trialUsage
      track(
        'trialUsage',
        await payload.create({
          collection: 'trialUsage',
          data: {
            emailHash: hashTrialEmail(email),
            product: habitProduct.id,
            usedAt: new Date().toISOString(),
          },
          overrideAccess: true,
        }),
      )

      // Tạo customer mới với đúng email này (như trường hợp xoá tài khoản rồi tạo lại)
      const customer = track(
        'customers',
        await payload.create({
          collection: 'customers',
          data: { email, name: '[MẪU] Khách đã xoá' },
          overrideAccess: true,
        }),
      )

      const res = await getTrialEligibility(customer.id, habitProduct.id, { payload })
      expect(res.eligible).toBe(false)
      expect(res.code).toBe('TRIAL_ALREADY_USED')
    })

    it('sản phẩm không bán (hidden) -> eligible: false', async () => {
      const customer = await createCustomer('inactive-prod')
      const res = await getTrialEligibility(customer.id, inactiveProduct.id, { payload })
      expect(res.eligible).toBe(false)
      expect(res.code).toBe('NOT_ELIGIBLE')
    })

    it('không ghi gì vào cơ sở dữ liệu (đếm bản ghi trước / sau)', async () => {
      const customer = await createCustomer('read-only')

      const countEntitlementsBefore = (await payload.count({ collection: 'entitlements' }))
        .totalDocs
      const countUsageBefore = (await payload.count({ collection: 'trialUsage' })).totalDocs

      await getTrialEligibility(customer.id, habitProduct.id, { payload })

      const countEntitlementsAfter = (await payload.count({ collection: 'entitlements' })).totalDocs
      const countUsageAfter = (await payload.count({ collection: 'trialUsage' })).totalDocs

      expect(countEntitlementsAfter).toBe(countEntitlementsBefore)
      expect(countUsageAfter).toBe(countUsageBefore)
    })
  })

  describe('2. getHabitStageGateAction & getHabitStageGate', () => {
    it('chưa đăng nhập -> trạng thái login kèm loginUrl đúng query next', async () => {
      const gate = await getHabitStageGate({ customer: null, payload })
      expect(gate.status).toBe('login')
      expect(gate.loginUrl).toBe(
        `/tai-khoan/dang-nhap?next=${encodeURIComponent('/habit/5-phut?buoc=3')}`,
      )
    })

    it('đã đăng nhập và còn quyền dùng thử -> trạng thái ok kèm trialAvailable=true', async () => {
      const customer = await createCustomer('eligible-gate')
      const gate = await getHabitStageGate({ customer, payload })
      expect(gate.status).toBe('ok')
      expect(gate.trialAvailable).toBe(true)
      expect(gate.customer?.email).toBe(customer.email)
    })

    it('đã mua sản phẩm (entitlement active) -> trạng thái ok kèm daysLeft/access', async () => {
      const customer = await createCustomer('active-gate')
      track(
        'entitlements',
        await payload.create({
          collection: 'entitlements',
          data: {
            customer: customer.id,
            product: habitProduct.id,
            source: 'order',
            status: 'active',
            grantedAt: new Date().toISOString(),
          },
          overrideAccess: true,
        }),
      )

      const gate = await getHabitStageGate({ customer, payload })
      expect(gate.status).toBe('ok')
      expect(gate.trialAvailable).toBe(false)
    })

    it('đã dùng hết thời gian dùng thử -> trạng thái buy kèm buyUrl và giá từ CMS', async () => {
      const customer = await createCustomer('expired-gate')
      track(
        'entitlements',
        await payload.create({
          collection: 'entitlements',
          data: {
            customer: customer.id,
            product: habitProduct.id,
            source: 'trial',
            status: 'expired',
            grantedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
            expiresAt: new Date(Date.now() - 2 * 86400000).toISOString(),
            trialKey: `${customer.id}:${habitProduct.id}`,
          },
          overrideAccess: true,
        }),
      )

      const gate = await getHabitStageGate({ customer, payload })
      expect(gate.status).toBe('buy')
      expect(gate.buyUrl).toBe('/thanh-toan?san-pham=habit-tracker-so')
      expect(gate.offerUrl).toBe('/habit/1-percent-better')
      expect(gate.salePrice).toBe(178000)
    })

    it('sản phẩm không tồn tại -> fallback trả về ok để không chặn khách', async () => {
      const customer = await createCustomer('missing-prod')
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Tạm mock tìm sản phẩm trả về rỗng
      const origFind = payload.find.bind(payload)
      const findSpy = vi.spyOn(payload, 'find').mockImplementation((async (
        args: Parameters<Payload['find']>[0],
      ) => {
        if (args?.collection === 'products') {
          return { docs: [], totalDocs: 0, limit: 1, totalPages: 1, page: 1, pagingCounter: 1 }
        }
        return origFind(args)
      }) as unknown as Payload['find'])

      const gate = await getHabitStageGate({ customer, payload })
      expect(gate.status).toBe('ok')
      expect(gate.trialAvailable).toBe(true)
      expect(warnSpy).toHaveBeenCalled()

      findSpy.mockRestore()
      warnSpy.mockRestore()
    })
  })

  describe('3. getSafeRedirectUrl', () => {
    it('giữ nguyên query string /habit/5-phut?buoc=3', () => {
      const safe = getSafeRedirectUrl('/habit/5-phut?buoc=3')
      expect(safe).toBe('/habit/5-phut?buoc=3')
    })

    it('chặn domain ngoài và open redirect', () => {
      expect(getSafeRedirectUrl('https://evil.com/habit/5-phut?buoc=3')).toBe('/tai-khoan')
      expect(getSafeRedirectUrl('//evil.com/habit/5-phut')).toBe('/tai-khoan')
    })
  })

  describe('4. HabitTrackerApp & Cổng giao diện', () => {
    it('initialGate="login": bấm Tiếp ở bước 2 -> hiện màn cổng, không render nội dung bước 3', async () => {
      render(
        <HabitTrackerApp
          initialGate={{
            status: 'login',
            loginUrl: '/tai-khoan/dang-nhap?next=%2Fhabit%2F5-phut%3Fbuoc%3D3',
          }}
          initialStepParam={2}
          techniques={[]}
          journeyDays={28}
        />,
      )

      // Đang ở bước 2: bấm "Sang giai đoạn 2 · Xây thói quen"
      const nextBtn = screen.getByRole('button', { name: /Sang giai đoạn 2/i })
      fireEvent.click(nextBtn)

      // Màn cổng login hiện ra
      expect(screen.getByText(viStrings.dp03.loginTitle)).toBeDefined()
      expect(screen.getByText(viStrings.dp03.loginButton)).toBeDefined()
      expect(screen.getByText(viStrings.dp03.backToStage1)).toBeDefined()

      // Nội dung bước 3 KHÔNG được render
      expect(screen.queryByPlaceholderText('Thức dậy, uống một ly nước')).toBeNull()

      cleanup()
    })

    it('initialGate="login": bấm thẻ Giai đoạn 2 ở đầu trang cũng hiện màn cổng', async () => {
      render(
        <HabitTrackerApp
          initialGate={{
            status: 'login',
            loginUrl: '/tai-khoan/dang-nhap?next=%2Fhabit%2F5-phut%3Fbuoc%3D3',
          }}
          initialStepParam={2}
          techniques={[]}
          journeyDays={28}
        />,
      )

      // Bấm thẻ Giai đoạn 2 trên Header
      const stage2Btns = screen.getAllByRole('button', { name: /GIAI ĐOẠN 2/i })
      fireEvent.click(stage2Btns[0])

      // Thấy màn cổng login
      expect(screen.getByText(viStrings.dp03.loginTitle)).toBeDefined()
      expect(screen.queryByPlaceholderText('Thức dậy, uống một ly nước')).toBeNull()

      // Bấm "Quay lại Giai đoạn 1" -> quay về bước 2
      fireEvent.click(screen.getByText(viStrings.dp03.backToStage1))
      expect(screen.getByRole('button', { name: /Sang giai đoạn 2/i })).toBeDefined()

      cleanup()
    })

    it('initialGate="ok": vào bước 3 bình thường', async () => {
      render(
        <HabitTrackerApp
          initialGate={{
            status: 'ok',
            trialAvailable: true,
            customer: {
              id: 999,
              email: 'test@example.com',
              name: 'Học viên Test 01',
              hasConsent: true,
            },
          }}
          initialStepParam={3}
          techniques={[]}
          journeyDays={28}
        />,
      )

      // Mở thẳng bước 3
      expect(screen.getByPlaceholderText('Thức dậy, uống một ly nước')).toBeDefined()
      expect(screen.queryByText(viStrings.dp03.loginTitle)).toBeNull()

      cleanup()
    })
  })

  describe('4b. QA DP-03c', () => {
    it('server action không nhận tham số từ trình duyệt; helper nằm ngoài file use server', async () => {
      const actions = await import('../../src/lib/habit/actions')
      expect(actions.getHabitStageGateAction.length).toBe(0)
      expect('getHabitStageGate' in actions).toBe(false)
    })

    it('thẻ Giai đoạn 3 khi chưa lưu kế hoạch: không mở màn trống, vẫn ở bước hiện tại', () => {
      render(
        <HabitTrackerApp
          initialGate={{ status: 'ok', trialAvailable: true }}
          initialStepParam={3}
          techniques={[]}
          journeyDays={28}
        />,
      )
      fireEvent.click(screen.getAllByRole('button', { name: /GIAI ĐOẠN 3/i })[0])
      expect(screen.getByPlaceholderText('Thức dậy, uống một ly nước')).toBeDefined()
      cleanup()
    })

    it('habit_stage1_completed chỉ ghi một lần dù khách bấm cổng nhiều lần', async () => {
      const analytics = await import('../../src/lib/analytics/track')
      const spy = vi.spyOn(analytics, 'track').mockImplementation(() => {})
      render(
        <HabitTrackerApp
          initialGate={{ status: 'login', loginUrl: '/tai-khoan/dang-nhap' }}
          initialStepParam={2}
          techniques={[]}
          journeyDays={28}
        />,
      )
      fireEvent.click(screen.getByRole('button', { name: /Sang giai đoạn 2/i }))
      fireEvent.click(screen.getByText(viStrings.dp03.backToStage1))
      fireEvent.click(screen.getByRole('button', { name: /Sang giai đoạn 2/i }))
      expect(spy.mock.calls.filter(([e]) => e === 'habit_stage1_completed')).toHaveLength(1)
      spy.mockRestore()
      cleanup()
    })
  })

  describe('4c. QA DP-03c: giữ câu trả lời bước 1 sau khi đăng nhập quay lại', () => {
    it('nháp 8 câu vẫn khôi phục khi CMS có số câu chẩn đoán khác 8', () => {
      window.localStorage.setItem(
        'tdcx_habit_loop_v1',
        JSON.stringify({ version: 2, step: 2, diagnoseAnswers: [4, 4, 4, 4, 4, 4, 4, 4] }),
      )
      const sixteen = Array.from({ length: 16 }, (_, i) => ({
        statement: `[MẪU] Câu ${i + 1}`,
        stage: 'cue',
      }))
      const { container } = render(
        <HabitTrackerApp
          initialGate={{ status: 'ok', trialAvailable: true }}
          initialStepParam={1}
          techniques={[]}
          journeyDays={28}
          diagnose={{ questions: sixteen } as never}
        />,
      )
      expect(container.querySelectorAll('button[aria-pressed="true"]')).toHaveLength(8)
      cleanup()
      window.localStorage.clear()
    })
  })

  describe('5. submitHabitPlan bảo mật email từ phiên', () => {
    it('khi có customerId trong phiên, luôn lưu bằng email của tài khoản dù trình duyệt gửi email khác', async () => {
      const customer = await createCustomer('session-email-check')
      const spoofedEmail = 'attacker-spoof@example.test'
      trackedEmails.push(spoofedEmail)

      const submission = {
        scorecard: [{ habit: 'Uống nước ấm', rating: 'good' as const }],
        identityStatement: 'Tôi sẽ uống nước ấm để trở thành người khỏe mạnh',
        chosenTechniques: [],
        email: spoofedEmail, // Trình duyệt cố gửi email khác
        name: 'Học viên Test 01',
        consent: true,
      }

      const randomIp = `10.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`
      const res = await submitHabitPlan(
        submission,
        { ip: randomIp },
        { payload, customerId: customer.id },
      )

      expect(res.success).toBe(true)
      expect(res.planId).toBeDefined()

      // Kiểm tra trong DB: kế hoạch phải lưu bằng email thật của customer
      const plan = await payload.findByID({
        collection: 'habitPlans',
        id: res.planId!,
        overrideAccess: true,
      })

      expect(plan.leadEmail).toBe(customer.email.toLowerCase())
      expect(plan.leadEmail).not.toBe(spoofedEmail)
      const planCustomerId =
        typeof plan.customer === 'object' && plan.customer !== null
          ? (plan.customer as { id: number }).id
          : plan.customer
      expect(planCustomerId).toBe(customer.id)
    })
  })
})
