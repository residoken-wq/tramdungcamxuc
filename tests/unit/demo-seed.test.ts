// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import { verifyOtp } from '../../src/lib/auth/otp.server'
import { checkDemoSeedAllowed, checkDemoSeedEnv } from '../../seed/demo-guard'
import { getAccess } from '../../src/lib/entitlements/service.server'
import { getCurrentDayOfPlan } from '../../src/lib/habit/tracker-stats'
import { getEligibleWorkshops } from '../../src/lib/workshops/eligible.server'
import {
  cleanDemoGd2,
  createDemoOtp,
  DEMO_EMAILS,
  DEMO_WORKSHOP_TITLE,
  HABIT_TRACKER_PRODUCT_SLUG,
  seedDemoGd2,
} from '../../seed/demo-gd2-lib'

describe('Demo Seed & Clean Flow (T2-15)', () => {
  let payload: Payload
  const NON_DEMO_EMAIL = 'khach-khac-t215@example.test'
  let nonDemoCustomerId: number | null = null
  let nonDemoPlanId: number | null = null
  let testProductId: number | null = null
  const testStartedAt = new Date().toISOString()

  beforeAll(async () => {
    payload = await getPayload({ config })
    // Dọn dữ liệu demo cũ; dùng lại sản phẩm habit-tracker-so nếu đã có (không xóa danh mục mẫu)
    await cleanDemoGd2(payload)
    await payload
      .delete({
        collection: 'customers',
        where: { email: { equals: NON_DEMO_EMAIL } },
        overrideAccess: true,
        context: { accountDeletion: true },
      })
      .catch(() => {})
    const existing = await payload.find({
      collection: 'products',
      where: { slug: { equals: HABIT_TRACKER_PRODUCT_SLUG } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs[0]) return

    const prod = await payload.create({
      collection: 'products',
      data: {
        name: 'Habit Tracker số (MẪU)',
        slug: HABIT_TRACKER_PRODUCT_SLUG,
        web: 'habit',
        type: 'digital_tool',
        journeyStep: 'practice',
        price: 250000,
        salePrice: 178000,
        trialDays: 28,
        saleStatus: 'coming_soon',
        _status: 'published',
      },
      overrideAccess: true,
    })
    testProductId = prod.id
  })

  afterAll(async () => {
    // 1. Dọn dẹp toàn bộ dữ liệu demo trước (orders, entitlements, workshops)
    await cleanDemoGd2(payload)

    // 2. Dọn dẹp khách không phải demo
    if (nonDemoPlanId) {
      await payload
        .delete({
          collection: 'habitPlans',
          where: { id: { equals: nonDemoPlanId } },
          overrideAccess: true,
        })
        .catch((e) => console.error('[cleanup]', e))
    }
    if (nonDemoCustomerId) {
      await payload
        .delete({
          collection: 'customers',
          where: { id: { equals: nonDemoCustomerId } },
          overrideAccess: true,
          context: { accountDeletion: true },
        })
        .catch((e) => console.error('[cleanup]', e))
    }

    // verifyOtp ghi rateLimitHits cho email demo
    await payload.delete({
      collection: 'rateLimitHits',
      where: { createdAt: { greater_than_equal: testStartedAt } },
      overrideAccess: true,
    })

    // 3. Chỉ xóa sản phẩm do chính test tạo
    if (testProductId) {
      await payload.delete({ collection: 'products', id: testProductId, overrideAccess: true })
    }
  })

  describe('checkDemoSeedAllowed (Guard checks)', () => {
    it('từ chối khi thiếu biến môi trường DEMO_SEED_ALLOW hoặc không phải true', () => {
      const facts = { hasPaidOrderFromNonExampleEmail: false }
      const res1 = checkDemoSeedAllowed({}, facts)
      expect(res1.ok).toBe(false)
      if (!res1.ok) {
        expect(res1.reason).toContain('DEMO_SEED_ALLOW')
      }

      const res2 = checkDemoSeedAllowed({ DEMO_SEED_ALLOW: 'false' }, facts)
      expect(res2.ok).toBe(false)
    })

    it('từ chối khi SITE_URL hoặc NEXT_PUBLIC_SITE_URL trỏ tới tên miền production thật', () => {
      const facts = { hasPaidOrderFromNonExampleEmail: false }

      const res1 = checkDemoSeedAllowed(
        { DEMO_SEED_ALLOW: 'true', SITE_URL: 'https://tramdungcamxuc.com' },
        facts,
      )
      expect(res1.ok).toBe(false)
      if (!res1.ok) {
        expect(res1.reason).toContain('tramdungcamxuc.com')
      }

      const res2 = checkDemoSeedAllowed(
        { DEMO_SEED_ALLOW: 'true', NEXT_PUBLIC_SITE_URL: 'https://WWW.tramdungcamxuc.com/' },
        facts,
      )
      expect(res2.ok).toBe(false)
    })

    it('chấp nhận khi tên miền là localhost hoặc subdomain demo.tramdungcamxuc.com', () => {
      const facts = { hasPaidOrderFromNonExampleEmail: false }

      const res1 = checkDemoSeedAllowed(
        { DEMO_SEED_ALLOW: 'true', SITE_URL: 'http://localhost:3000' },
        facts,
      )
      expect(res1.ok).toBe(true)

      const res2 = checkDemoSeedAllowed(
        { DEMO_SEED_ALLOW: 'true', SITE_URL: 'https://demo.tramdungcamxuc.com' },
        facts,
      )
      expect(res2.ok).toBe(true)
    })

    it('từ chối khi DB có dấu hiệu đơn hàng đã thanh toán của email người dùng thật', () => {
      const facts = { hasPaidOrderFromNonExampleEmail: true }
      const res = checkDemoSeedAllowed(
        { DEMO_SEED_ALLOW: 'true', SITE_URL: 'https://demo.tramdungcamxuc.com' },
        facts,
      )
      expect(res.ok).toBe(false)
      if (!res.ok) {
        expect(res.reason).toContain('đơn hàng đã thanh toán')
      }
    })

    it('NODE_ENV=production mà thiếu SITE_URL -> từ chối (container seed không tự có URL)', () => {
      const res = checkDemoSeedEnv({ DEMO_SEED_ALLOW: 'true', NODE_ENV: 'production' })
      expect(res.ok).toBe(false)
      const ok = checkDemoSeedEnv({
        DEMO_SEED_ALLOW: 'true',
        NODE_ENV: 'production',
        SITE_URL: 'https://demo.tramdungcamxuc.com',
      })
      expect(ok.ok).toBe(true)
    })

    it('cho phép chạy khi thỏa mãn đầy đủ cả 3 điều kiện', () => {
      const facts = { hasPaidOrderFromNonExampleEmail: false }
      const res = checkDemoSeedAllowed(
        { DEMO_SEED_ALLOW: 'true', SITE_URL: 'https://demo.tramdungcamxuc.com' },
        facts,
      )
      expect(res.ok).toBe(true)
    })
  })

  describe('seedDemoGd2 & Idempotency', () => {
    it('bảo vệ khách hàng không phải demo trước, trong và sau khi seed', async () => {
      // 1. Tạo trước một khách không phải demo + kế hoạch
      const nonDemoCustomer = await payload.create({
        collection: 'customers',
        data: {
          email: NON_DEMO_EMAIL,
          name: 'Khách Khác T215',
          consentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
      nonDemoCustomerId = nonDemoCustomer.id

      const nonDemoPlan = await payload.create({
        collection: 'habitPlans',
        data: {
          customer: nonDemoCustomer.id,
          startDate: new Date().toISOString(),
          identityStatement: 'Kế hoạch của khách hàng thật ngoài demo',
        },
        overrideAccess: true,
      })
      nonDemoPlanId = nonDemoPlan.id

      // 2. Chạy seed demo 2 lần liên tiếp để kiểm tra tính lũy đẳng
      await seedDemoGd2(payload)
      const res2 = await seedDemoGd2(payload)

      expect(res2.rows).toHaveLength(3)

      // 3. Kiểm tra đúng 3 khách demo
      const demoCustomers = await payload.find({
        collection: 'customers',
        where: { email: { in: [...DEMO_EMAILS] } },
        overrideAccess: true,
      })
      expect(demoCustomers.totalDocs).toBe(3)

      // Kiểm tra khách không phải demo vẫn còn nguyên
      const checkNonDemo = await payload.findByID({
        collection: 'customers',
        id: nonDemoCustomerId,
        overrideAccess: true,
      })
      expect(checkNonDemo).not.toBeNull()
      expect(checkNonDemo?.email).toBe(NON_DEMO_EMAIL)

      const checkNonDemoPlan = await payload.findByID({
        collection: 'habitPlans',
        id: nonDemoPlanId,
        overrideAccess: true,
      })
      expect(checkNonDemoPlan).not.toBeNull()

      // 4. Kiểm tra đơn hàng: 1 pending (Test 01), 1 paid (Test 03)
      const demoOrders = await payload.find({
        collection: 'orders',
        where: {
          customer: { in: demoCustomers.docs.map((c) => c.id) },
        },
        overrideAccess: true,
      })
      expect(demoOrders.totalDocs).toBe(2)
      const pendingOrder = demoOrders.docs.find((o) => o.paymentStatus === 'pending')
      const paidOrder = demoOrders.docs.find((o) => o.paymentStatus === 'paid')
      expect(pendingOrder).toBeDefined()
      expect(paidOrder).toBeDefined()

      // 5. Kiểm tra workshop demo
      const demoWorkshops = await payload.find({
        collection: 'workshops',
        where: { title: { equals: DEMO_WORKSHOP_TITLE } },
        overrideAccess: true,
      })
      expect(demoWorkshops.totalDocs).toBe(1)
      expect(demoWorkshops.docs[0].audienceProducts).toBeDefined()

      // 6. Kiểm tra số ngày check-in của từng khách
      const cust01 = demoCustomers.docs.find((c) => c.email === DEMO_EMAILS[0])!
      const cust02 = demoCustomers.docs.find((c) => c.email === DEMO_EMAILS[1])!
      const cust03 = demoCustomers.docs.find((c) => c.email === DEMO_EMAILS[2])!

      const plan01 = (
        await payload.find({
          collection: 'habitPlans',
          where: { customer: { equals: cust01.id } },
          overrideAccess: true,
        })
      ).docs[0]
      const plan02 = (
        await payload.find({
          collection: 'habitPlans',
          where: { customer: { equals: cust02.id } },
          overrideAccess: true,
        })
      ).docs[0]
      const plan03 = (
        await payload.find({
          collection: 'habitPlans',
          where: { customer: { equals: cust03.id } },
          overrideAccess: true,
        })
      ).docs[0]

      const checkins01 = await payload.find({
        collection: 'habitCheckins',
        where: { plan: { equals: plan01.id } },
        overrideAccess: true,
      })
      const checkins02 = await payload.find({
        collection: 'habitCheckins',
        where: { plan: { equals: plan02.id } },
        overrideAccess: true,
      })
      const checkins03 = await payload.find({
        collection: 'habitCheckins',
        where: { plan: { equals: plan03.id } },
        overrideAccess: true,
      })

      expect(checkins01.totalDocs).toBe(4) // Test 01: 4 ngày
      expect(checkins02.totalDocs).toBe(10) // Test 02: 10 ngày
      expect(checkins03.totalDocs).toBe(28) // Test 03: 28 ngày

      // Kiểm tra Test 02 có entitlement hết hạn
      const ent02 = (
        await payload.find({
          collection: 'entitlements',
          where: { customer: { equals: cust02.id } },
          overrideAccess: true,
        })
      ).docs[0]
      expect(ent02.status).toBe('expired')

      // Kiểm tra Test 03 chưa có chứng nhận để có thể bấm nhận thử
      const cert03 = await payload.find({
        collection: 'certificates',
        where: { customer: { equals: cust03.id } },
        overrideAccess: true,
      })
      expect(cert03.totalDocs).toBe(0)

      // 7. Tình huống thật như app thấy: ngày hiện tại, quyền truy cập, workshop
      const productId = (
        typeof pendingOrder!.items?.[0]?.product === 'object'
          ? pendingOrder!.items[0].product.id
          : pendingOrder!.items?.[0]?.product
      ) as number
      expect(getCurrentDayOfPlan(plan01.startDate)).toBe(5)
      const access01 = await getAccess(cust01.id, productId, { payload })
      expect(access01.status).toBe('trial')
      expect(access01.hasAccess).toBe(true)
      const access02 = await getAccess(cust02.id, productId, { payload })
      expect(access02.hasAccess).toBe(false)
      expect(access02.status).toBe('expired')
      const access03 = await getAccess(cust03.id, productId, { payload })
      expect(access03.status).toBe('active')
      const workshops03 = await getEligibleWorkshops(cust03.id, new Date(), payload)
      expect(workshops03.some((w) => w.title === DEMO_WORKSHOP_TITLE)).toBe(true)

      // 8. Mã chuyển khoản và link in ra phải khớp đúng đơn trong DB
      const row01 = res2.rows.find((r) => r.email === DEMO_EMAILS[0])!
      expect(row01.paymentRef).toBe(pendingOrder!.paymentRef)
      expect(res2.pendingOrderToken).toBe(pendingOrder!.payToken)
      expect(row01.link).toContain(`/thanh-toan/don/${pendingOrder!.payToken}`)
    })

    it('cleanDemoGd2 xóa sạch toàn bộ bản ghi demo mà không đụng tới khách khác', async () => {
      const tally = await cleanDemoGd2(payload)
      expect(tally.customers).toBe(3)
      expect(tally.orders).toBe(2)
      expect(tally.workshops).toBe(1)
      expect(tally.habitPlans).toBe(3)
      expect(tally.habitCheckins).toBe(42) // 4 + 10 + 28 = 42

      // Sau khi clean: 0 bản ghi demo còn sót lại
      const checkCustomers = await payload.find({
        collection: 'customers',
        where: { email: { in: [...DEMO_EMAILS] } },
        overrideAccess: true,
      })
      expect(checkCustomers.totalDocs).toBe(0)

      const checkWorkshops = await payload.find({
        collection: 'workshops',
        where: { title: { equals: DEMO_WORKSHOP_TITLE } },
        overrideAccess: true,
      })
      expect(checkWorkshops.totalDocs).toBe(0)

      // Khách không phải demo vẫn còn nguyên
      const checkNonDemo = await payload.findByID({
        collection: 'customers',
        id: nonDemoCustomerId!,
        overrideAccess: true,
      })
      expect(checkNonDemo).not.toBeNull()
      expect(checkNonDemo?.email).toBe(NON_DEMO_EMAIL)
    })
  })

  describe('createDemoOtp (Mã OTP dòng lệnh)', () => {
    beforeAll(async () => {
      await seedDemoGd2(payload)
    })

    it('từ chối sinh mã cho email ngoài danh sách demo', async () => {
      await expect(createDemoOtp(payload, 'stranger@example.com')).rejects.toThrow(
        /không thuộc danh sách demo/,
      )
    })

    it('sinh mã 6 số cho email demo và verifyOtp đăng nhập thành công', async () => {
      const demoEmail = DEMO_EMAILS[0]
      const { code } = await createDemoOtp(payload, demoEmail)

      expect(code).toMatch(/^\d{6}$/)

      // Thử verifyOtp với mã vừa sinh
      const verifyRes = await verifyOtp(
        { email: demoEmail, code, consentPolicy: true },
        {},
        { payload },
      )
      expect(verifyRes.success).toBe(true)
      expect(verifyRes.customer.email).toBe(demoEmail)
    })
  })
})
