// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { Customer, HabitPlan, Product } from '../../src/payload-types'
import {
  issueCertificate,
  getCertificateEligibility,
  getCertificateByCode,
  toggleCertificatePublic,
} from '../../src/lib/habit/certificate.server'
import { issueCertificateAction } from '../../src/lib/habit/certificate-actions'
import * as sessionServer from '../../src/lib/auth/session.server'
import { vi as i18n } from '../../src/lib/i18n/vi'
import { HABIT_TRACKER_PRODUCT_SLUG } from '../../src/lib/habit/config'
import { GET as imageRouteHandler } from '../../src/app/(site)/chung-nhan/[code]/anh/[format]/route'

describe('21-Day Certificate Issuance & Verification (T2-07)', () => {
  let payload: Payload
  const created: { collection: CollectionSlug; id: number }[] = []
  let habitProduct: Product

  const track = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
    created.push({ collection, id: doc.id })
    return doc
  }

  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    const existing = await payload.find({
      collection: 'products',
      where: { slug: { equals: HABIT_TRACKER_PRODUCT_SLUG } },
      overrideAccess: true,
      limit: 1,
    })

    if (existing.docs.length > 0) {
      habitProduct = existing.docs[0] as Product
    } else {
      habitProduct = track(
        'products',
        (await payload.create({
          collection: 'products',
          data: {
            name: 'Habit Tracker Số',
            slug: HABIT_TRACKER_PRODUCT_SLUG,
            web: 'habit',
            type: 'digital_tool',
            price: 250000,
            salePrice: 178000,
            trialDays: 21,
            saleStatus: 'on_sale',
            _status: 'published',
          },
          overrideAccess: true,
        })) as Product,
      )
    }
  })

  afterAll(async () => {
    // 1. Dọn dẹp toàn bộ dữ liệu do test tạo theo thứ tự ngược lại (certificates -> checkins -> plans -> entitlements -> customers)
    for (const item of created.reverse()) {
      try {
        await payload.delete({
          collection: item.collection,
          id: item.id,
          overrideAccess: true,
        })
      } catch {
        // Bỏ qua lỗi xóa nếu đã bị xóa trước đó
      }
    }

    // 2. Xác nhận database không còn dữ liệu test sót lại
    const certIds = created.filter((c) => c.collection === 'certificates').map((c) => c.id)
    const planIds = created.filter((c) => c.collection === 'habitPlans').map((c) => c.id)
    const checkinIds = created.filter((c) => c.collection === 'habitCheckins').map((c) => c.id)

    if (certIds.length > 0) {
      const remainingCerts = await payload.find({
        collection: 'certificates',
        where: { id: { in: certIds } },
        overrideAccess: true,
      })
      expect(remainingCerts.totalDocs).toBe(0)
    }

    if (planIds.length > 0) {
      const remainingPlans = await payload.find({
        collection: 'habitPlans',
        where: { id: { in: planIds } },
        overrideAccess: true,
      })
      expect(remainingPlans.totalDocs).toBe(0)
    }

    if (checkinIds.length > 0) {
      const remainingCheckins = await payload.find({
        collection: 'habitCheckins',
        where: { id: { in: checkinIds } },
        overrideAccess: true,
      })
      expect(remainingCheckins.totalDocs).toBe(0)
    }
  })

  // Helper tạo khách hàng với tên test chuẩn hóa
  async function createTestCustomer(name?: string) {
    const customer = track(
      'customers',
      (await payload.create({
        collection: 'customers',
        data: {
          email: `cert-customer-${randomUUID()}@example.test`,
          name: name !== undefined ? name : 'Học viên Test 01',
        },
        overrideAccess: true,
      })) as Customer,
    )
    return customer
  }

  // Helper tạo kế hoạch Habit Plan
  async function createTestPlan(
    customerId: number,
    startDate: string,
    statement = 'Tôi sẽ dành 5 phút mỗi sáng để thấu hiểu cảm xúc.',
  ) {
    const plan = track(
      'habitPlans',
      (await payload.create({
        collection: 'habitPlans',
        data: {
          customer: customerId,
          identityStatement: statement,
          startDate,
        },
        overrideAccess: true,
      })) as HabitPlan,
    )
    return plan
  }

  // Helper tạo danh sách check-in
  async function createCheckins(planId: number, count: number) {
    for (let day = 1; day <= count; day++) {
      const checkin = track(
        'habitCheckins',
        await payload.create({
          collection: 'habitCheckins',
          data: {
            plan: planId,
            day,
            done: true,
            emotion: 'peaceful',
            note: `Ghi chú ngày ${day}`,
          },
          overrideAccess: true,
        }),
      )
      expect(checkin).toBeDefined()
    }
  }

  it('chưa tới ngày 21 -> không cấp chứng nhận (báo lỗi)', async () => {
    const customer = await createTestCustomer('Học viên Test 01')
    const todayYmd = new Date().toISOString().split('T')[0]
    await createTestPlan(customer.id, todayYmd)

    await expect(issueCertificate(customer.id, { payload })).rejects.toThrow(
      i18n.certificate.errors.notDay21,
    )

    const eligibility = await getCertificateEligibility(customer.id, { payload })
    expect(eligibility.eligible).toBe(false)
    expect(eligibility.reason).toBe('NOT_YET_DAY_21')
  })

  it('đã tới ngày 21 nhưng dưới certificateMinDays (mặc định 15) -> không cấp chứng nhận', async () => {
    const customer = await createTestCustomer('Học viên Test 02')
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 25)
    const startDate = pastDate.toISOString().split('T')[0]
    const plan = await createTestPlan(customer.id, startDate)

    await createCheckins(plan.id, 10)

    await expect(issueCertificate(customer.id, { payload })).rejects.toThrow(
      i18n.certificate.errors.notEnoughDays(15),
    )

    const eligibility = await getCertificateEligibility(customer.id, { payload })
    expect(eligibility.eligible).toBe(false)
    expect(eligibility.reason).toBe('NOT_ENOUGH_DAYS')
  })

  it('đủ điều kiện (currentDay >= 21 và hoàn thành >= minDays) -> cấp chứng nhận thành công', async () => {
    const customer = await createTestCustomer('Học viên Test 03')
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 22)
    const startDate = pastDate.toISOString().split('T')[0]
    const statement = 'Tôi sẽ dành 5 phút mỗi sáng để trở thành người an yên.'
    const plan = await createTestPlan(customer.id, startDate, statement)

    await createCheckins(plan.id, 18)

    const cert = await issueCertificate(customer.id, { payload })
    track('certificates', cert)

    expect(cert).toBeDefined()
    expect(cert.isNew).toBe(true)
    expect(cert.code).toBeTruthy()
    expect(cert.daysCompleted).toBe(18)
    expect(cert.identityStatement).toBe(statement)
    expect(cert.isPublic).toBe(true)

    const eligibility = await getCertificateEligibility(customer.id, { payload })
    expect(eligibility.eligible).toBe(true)
    expect(eligibility.hasCertificate).toBe(true)
    expect(eligibility.certificate?.code).toBe(cert.code)
  })

  it('gọi 2 lần hoặc gọi song song -> trả về đúng 1 bản ghi Certificate duy nhất', async () => {
    const customer = await createTestCustomer('Học viên Test 04')
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 23)
    const startDate = pastDate.toISOString().split('T')[0]
    const plan = await createTestPlan(customer.id, startDate)
    await createCheckins(plan.id, 16)

    const [cert1, cert2] = await Promise.all([
      issueCertificate(customer.id, { payload }),
      issueCertificate(customer.id, { payload }),
    ])
    track('certificates', cert1)

    expect(cert1.id).toBe(cert2.id)
    expect(cert1.code).toBe(cert2.code)

    const allCerts = await payload.find({
      collection: 'certificates',
      where: { customer: { equals: customer.id } },
      overrideAccess: true,
    })
    expect(allCerts.totalDocs).toBe(1)
  })

  it('không thể cấp chứng nhận cho khách hàng chưa có kế hoạch', async () => {
    const customerWithoutPlan = await createTestCustomer('Học viên Test 05')

    await expect(issueCertificate(customerWithoutPlan.id, { payload })).rejects.toThrow(
      i18n.certificate.errors.noPlan,
    )
  })

  it('kế hoạch của khách khác -> không cấp cho khách hàng này', async () => {
    const ownerCustomer = await createTestCustomer('Học viên Test Chủ')
    const strangerCustomer = await createTestCustomer('Học viên Test Khác')

    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 22)
    const startDate = pastDate.toISOString().split('T')[0]
    const plan = await createTestPlan(ownerCustomer.id, startDate)
    await createCheckins(plan.id, 18)

    // Khách khác không có kế hoạch của riêng mình -> bị từ chối
    await expect(issueCertificate(strangerCustomer.id, { payload })).rejects.toThrow(
      i18n.certificate.errors.noPlan,
    )

    // Khách khác kiểm tra điều kiện -> eligible: false
    const eligibility = await getCertificateEligibility(strangerCustomer.id, { payload })
    expect(eligibility.eligible).toBe(false)
    expect(eligibility.hasCertificate).toBe(false)
  })

  it('khách hàng hết hạn dùng thử vẫn được nhận chứng nhận cho 21 ngày đã thực hành', async () => {
    const customer = await createTestCustomer('Học viên Test 06')

    track(
      'entitlements',
      await payload.create({
        collection: 'entitlements',
        data: {
          customer: customer.id,
          product: habitProduct.id,
          source: 'trial',
          status: 'expired',
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
        overrideAccess: true,
      }),
    )

    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 24)
    const startDate = pastDate.toISOString().split('T')[0]
    const plan = await createTestPlan(customer.id, startDate)
    await createCheckins(plan.id, 17)

    const cert = await issueCertificate(customer.id, { payload })
    track('certificates', cert)

    expect(cert).toBeDefined()
    expect(cert.daysCompleted).toBe(17)
  })

  it('quyền riêng tư: tắt công khai (isPublic = false) -> người ngoài không xem được, chủ sở hữu xem được', async () => {
    const ownerCustomer = await createTestCustomer('Học viên Test Chủ')
    const strangerCustomer = await createTestCustomer('Học viên Test Người Lạ')

    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 22)
    const plan = await createTestPlan(ownerCustomer.id, pastDate.toISOString().split('T')[0])
    await createCheckins(plan.id, 15)

    const cert = await issueCertificate(ownerCustomer.id, { payload })
    track('certificates', cert)
    const certCode = cert.code!

    const updatedStatus = await toggleCertificatePublic(certCode, false, ownerCustomer.id, {
      payload,
    })
    expect(updatedStatus).toBe(false)

    const strangerView = await getCertificateByCode(certCode, {
      currentCustomerId: strangerCustomer.id,
      payload,
    })
    expect(strangerView).toBeNull()

    const guestView = await getCertificateByCode(certCode, {
      currentCustomerId: null,
      payload,
    })
    expect(guestView).toBeNull()

    const ownerView = await getCertificateByCode(certCode, {
      currentCustomerId: ownerCustomer.id,
      payload,
    })
    expect(ownerView).not.toBeNull()
    expect(ownerView?.isOwner).toBe(true)
    expect(ownerView?.isPublic).toBe(false)
  })

  it('dữ liệu trang công khai TUYỆT ĐỐI KHÔNG có cảm xúc, ghi chú, email hay customer id', async () => {
    const customer = await createTestCustomer('Học viên Test Bảo Vệ')
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 22)
    const plan = await createTestPlan(customer.id, pastDate.toISOString().split('T')[0])
    await createCheckins(plan.id, 15)

    const cert = await issueCertificate(customer.id, { payload })
    track('certificates', cert)
    const certCode = cert.code!

    const publicData = await getCertificateByCode(certCode, { payload })
    expect(publicData).not.toBeNull()

    const keys = Object.keys(publicData!)
    expect(keys).toContain('code')
    expect(keys).toContain('customerName')
    expect(keys).toContain('identityStatement')
    expect(keys).toContain('daysCompleted')
    expect(keys).toContain('issuedAt')
    expect(keys).toContain('isPublic')

    expect(keys).not.toContain('emotion')
    expect(keys).not.toContain('emotions')
    expect(keys).not.toContain('note')
    expect(keys).not.toContain('notes')
    expect(keys).not.toContain('email')
    expect(keys).not.toContain('customerId')
    expect(keys).not.toContain('customer')
  })

  it('khách khác không thể đổi trạng thái isPublic của chứng nhận', async () => {
    const ownerCustomer = await createTestCustomer('Học viên Test Chủ')
    const hackerCustomer = await createTestCustomer('Học viên Test Giả Mạo')

    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 22)
    const plan = await createTestPlan(ownerCustomer.id, pastDate.toISOString().split('T')[0])
    await createCheckins(plan.id, 15)

    const cert = await issueCertificate(ownerCustomer.id, { payload })
    track('certificates', cert)
    const certCode = cert.code!

    await expect(
      toggleCertificatePublic(certCode, false, hackerCustomer.id, { payload }),
    ).rejects.toThrow(i18n.certificate.errors.forbidden)
  })

  describe('A1: Hỏi tên khi nhận chứng nhận qua action issueCertificateAction', () => {
    it('khách không tên + không gửi tên -> từ chối, không tạo chứng nhận', async () => {
      const customer = await createTestCustomer('')
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 22)
      const plan = await createTestPlan(customer.id, pastDate.toISOString().split('T')[0])
      await createCheckins(plan.id, 16)

      vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customer)

      const res = await issueCertificateAction()
      expect(res.success).toBe(false)
      expect(res.error).toBe('NAME_REQUIRED')
      expect(res.message).toBe(i18n.certificate.errors.nameRequired)

      const certs = await payload.find({
        collection: 'certificates',
        where: { customer: { equals: customer.id } },
        overrideAccess: true,
      })
      expect(certs.totalDocs).toBe(0)
    })

    it('khách không tên + gửi tên hợp lệ -> tên lưu vào khách, chứng nhận có tên', async () => {
      const customer = await createTestCustomer('')
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 22)
      const plan = await createTestPlan(customer.id, pastDate.toISOString().split('T')[0])
      await createCheckins(plan.id, 16)

      vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customer)

      const res = await issueCertificateAction({ name: 'Học viên Test 01' })
      expect(res.success).toBe(true)
      expect(res.isNew).toBe(true)
      expect(res.certificate?.customerName).toBe('Học viên Test 01')

      // Kiểm tra tên đã được lưu vào customers
      const updatedCustomer = await payload.findByID({
        collection: 'customers',
        id: customer.id,
        depth: 0,
        overrideAccess: true,
      })
      expect(updatedCustomer.name).toBe('Học viên Test 01')

      // Ghi nhận chứng nhận để dọn dẹp
      const certDoc = await payload.find({
        collection: 'certificates',
        where: { customer: { equals: customer.id } },
        limit: 1,
        overrideAccess: true,
      })
      if (certDoc.docs[0]) {
        track('certificates', certDoc.docs[0])
      }
    })

    it('khách chưa đủ ngày gửi tên -> không đổi tên khách', async () => {
      const customer = await createTestCustomer('')
      const todayYmd = new Date().toISOString().split('T')[0]
      await createTestPlan(customer.id, todayYmd)
      // Chưa đủ ngày 21

      vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customer)

      const res = await issueCertificateAction({ name: 'Tên Không Được Lưu' })
      expect(res.success).toBe(false)

      const customerInDb = await payload.findByID({
        collection: 'customers',
        id: customer.id,
        depth: 0,
        overrideAccess: true,
      })
      expect(customerInDb.name || '').toBe('')
    })

    it('khách đã có tên gửi tên khác -> tên khách giữ nguyên', async () => {
      const customer = await createTestCustomer('Học viên Test Gốc')
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 22)
      const plan = await createTestPlan(customer.id, pastDate.toISOString().split('T')[0])
      await createCheckins(plan.id, 16)

      vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customer)

      const res = await issueCertificateAction({ name: 'Học viên Tên Khác' })
      expect(res.success).toBe(true)
      expect(res.certificate?.customerName).toBe('Học viên Test Gốc')

      const customerInDb = await payload.findByID({
        collection: 'customers',
        id: customer.id,
        depth: 0,
        overrideAccess: true,
      })
      expect(customerInDb.name).toBe('Học viên Test Gốc')

      const certDoc = await payload.find({
        collection: 'certificates',
        where: { customer: { equals: customer.id } },
        limit: 1,
        overrideAccess: true,
      })
      if (certDoc.docs[0]) {
        track('certificates', certDoc.docs[0])
      }
    })
  })

  it('unit test route ảnh: trả image/png cho 4x5 và 9x16; kiểm tra kích thước IHDR; trả 404 cho mã sai hoặc private', async () => {
    const customer = await createTestCustomer('Học viên Test Ảnh')
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 22)
    const plan = await createTestPlan(customer.id, pastDate.toISOString().split('T')[0])
    await createCheckins(plan.id, 15)

    const cert = await issueCertificate(customer.id, { payload })
    track('certificates', cert)
    expect(cert.code).toBeTruthy()
    const certCode = cert.code!

    // 1. Gọi route 4x5 hợp lệ & kiểm tra kích thước IHDR PNG
    const res45 = await imageRouteHandler(new Request('http://localhost/chung-nhan/test/anh/4x5'), {
      params: Promise.resolve({ code: certCode, format: '4x5' }),
    })
    expect(res45.status).toBe(200)
    expect(res45.headers.get('content-type')).toContain('image/png')
    expect(res45.headers.get('cache-control')).toContain('max-age=0')
    const buf45 = Buffer.from(await res45.arrayBuffer())
    expect(buf45.byteLength).toBeGreaterThan(1000)
    const width45 = buf45.readUInt32BE(16)
    const height45 = buf45.readUInt32BE(20)
    expect(width45).toBe(1080)
    expect(height45).toBe(1350)

    // 2. Gọi route 9x16 hợp lệ & kiểm tra kích thước IHDR PNG
    const res916 = await imageRouteHandler(
      new Request('http://localhost/chung-nhan/test/anh/9x16'),
      {
        params: Promise.resolve({ code: certCode, format: '9x16' }),
      },
    )
    expect(res916.status).toBe(200)
    expect(res916.headers.get('content-type')).toContain('image/png')
    const buf916 = Buffer.from(await res916.arrayBuffer())
    expect(buf916.byteLength).toBeGreaterThan(1000)
    const width916 = buf916.readUInt32BE(16)
    const height916 = buf916.readUInt32BE(20)
    expect(width916).toBe(1080)
    expect(height916).toBe(1920)

    // 3. Format không hợp lệ (ví dụ: '1x1') -> 404 (throws NEXT_HTTP_ERROR_FALLBACK)
    await expect(
      imageRouteHandler(new Request('http://localhost/chung-nhan/test/anh/1x1'), {
        params: Promise.resolve({ code: certCode, format: '1x1' }),
      }),
    ).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK.*404/)

    // 4. Mã chứng nhận không tồn tại -> 404
    await expect(
      imageRouteHandler(new Request('http://localhost/chung-nhan/test/anh/4x5'), {
        params: Promise.resolve({ code: 'non-existent-code-999', format: '4x5' }),
      }),
    ).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK.*404/)

    // 5. Route ảnh private -> 404 cho người lạ
    await toggleCertificatePublic(certCode, false, customer.id, { payload })
    vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(null)
    await expect(
      imageRouteHandler(new Request('http://localhost/chung-nhan/test/anh/4x5'), {
        params: Promise.resolve({ code: certCode, format: '4x5' }),
      }),
    ).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK.*404/)
  }, 30000)
})
