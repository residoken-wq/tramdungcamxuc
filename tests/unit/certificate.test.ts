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
    for (const item of created.reverse()) {
      try {
        await payload.delete({
          collection: item.collection,
          id: item.id,
          overrideAccess: true,
        })
      } catch {
        // Bỏ qua lỗi xóa dọn dẹp
      }
    }
  })

  // Helper tạo khách hàng
  async function createTestCustomer(name = 'Học viên Test') {
    const customer = track(
      'customers',
      (await payload.create({
        collection: 'customers',
        data: {
          email: `cert-customer-${randomUUID()}@example.test`,
          name,
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
      const checkin = await payload.create({
        collection: 'habitCheckins',
        data: {
          plan: planId,
          day,
          done: true,
          emotion: 'peaceful',
          note: `Ghi chú ngày ${day}`,
        },
        overrideAccess: true,
      })
      track('habitCheckins', checkin)
    }
  }

  it('chưa tới ngày 21 -> không cấp chứng nhận (báo lỗi)', async () => {
    const customer = await createTestCustomer()
    // Kế hoạch mới bắt đầu hôm nay -> Ngày 1
    const todayYmd = new Date().toISOString().split('T')[0]
    await createTestPlan(customer.id, todayYmd)

    // Tạo sẵn 5 check-in
    await expect(issueCertificate(customer.id, { payload })).rejects.toThrow(
      i18n.certificate.errors.notDay21,
    )

    const eligibility = await getCertificateEligibility(customer.id, { payload })
    expect(eligibility.eligible).toBe(false)
    expect(eligibility.reason).toBe('NOT_YET_DAY_21')
  })

  it('đã tới ngày 21 nhưng dưới certificateMinDays (mặc định 15) -> không cấp chứng nhận', async () => {
    const customer = await createTestCustomer()
    // Ngày bắt đầu 25 ngày trước -> currentDay = 26 (>= 21)
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 25)
    const startDate = pastDate.toISOString().split('T')[0]
    const plan = await createTestPlan(customer.id, startDate)

    // Chỉ hoàn thành 10 ngày (< 15)
    await createCheckins(plan.id, 10)

    await expect(issueCertificate(customer.id, { payload })).rejects.toThrow(
      i18n.certificate.errors.notEnoughDays(15),
    )

    const eligibility = await getCertificateEligibility(customer.id, { payload })
    expect(eligibility.eligible).toBe(false)
    expect(eligibility.reason).toBe('NOT_ENOUGH_DAYS')
  })

  it('đủ điều kiện (currentDay >= 21 và hoàn thành >= minDays) -> cấp chứng nhận thành công', async () => {
    const customer = await createTestCustomer('Nguyễn Văn An')
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 22)
    const startDate = pastDate.toISOString().split('T')[0]
    const statement = 'Tôi sẽ dành 5 phút mỗi sáng để trở thành người an yên.'
    const plan = await createTestPlan(customer.id, startDate, statement)

    // Hoàn thành 18 ngày (>= 15)
    await createCheckins(plan.id, 18)

    const cert = await issueCertificate(customer.id, { payload })
    track('certificates', cert)

    expect(cert).toBeDefined()
    expect(cert.code).toBeTruthy()
    expect(cert.daysCompleted).toBe(18)
    expect(cert.identityStatement).toBe(statement)
    expect(cert.isPublic).toBe(true)

    // Kiểm tra getCertificateEligibility
    const eligibility = await getCertificateEligibility(customer.id, { payload })
    expect(eligibility.eligible).toBe(true)
    expect(eligibility.hasCertificate).toBe(true)
    expect(eligibility.certificate?.code).toBe(cert.code)
  })

  it('gọi 2 lần hoặc gọi song song -> trả về đúng 1 bản ghi Certificate duy nhất', async () => {
    const customer = await createTestCustomer('Trần Thị Bình')
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 23)
    const startDate = pastDate.toISOString().split('T')[0]
    const plan = await createTestPlan(customer.id, startDate)
    await createCheckins(plan.id, 16)

    // Gọi song song 2 lần
    const [cert1, cert2] = await Promise.all([
      issueCertificate(customer.id, { payload }),
      issueCertificate(customer.id, { payload }),
    ])

    expect(cert1.id).toBe(cert2.id)
    expect(cert1.code).toBe(cert2.code)

    // Kiểm tra số lượng bản ghi trong database của customer này
    const allCerts = await payload.find({
      collection: 'certificates',
      where: { customer: { equals: customer.id } },
      overrideAccess: true,
    })
    expect(allCerts.totalDocs).toBe(1)
    track('certificates', cert1)
  })

  it('không thể cấp chứng nhận cho khách hàng chưa có kế hoạch', async () => {
    const customerWithoutPlan = await createTestCustomer('Lê Văn Cường')

    await expect(issueCertificate(customerWithoutPlan.id, { payload })).rejects.toThrow(
      i18n.certificate.errors.noPlan,
    )
  })

  it('khách hàng hết hạn dùng thử vẫn được nhận chứng nhận cho 21 ngày đã thực hành', async () => {
    const customer = await createTestCustomer('Phạm Hoàng Dũng')

    // Gán quyền dùng thử đã hết hạn
    const expiredEntitlement = track(
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
    expect(expiredEntitlement).toBeDefined()

    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 24)
    const startDate = pastDate.toISOString().split('T')[0]
    const plan = await createTestPlan(customer.id, startDate)
    await createCheckins(plan.id, 17)

    // Khách hết hạn dùng thử vẫn nhận được chứng nhận thành công
    const cert = await issueCertificate(customer.id, { payload })
    track('certificates', cert)

    expect(cert).toBeDefined()
    expect(cert.daysCompleted).toBe(17)
  })

  it('quyền riêng tư: tắt công khai (isPublic = false) -> người ngoài không xem được, chủ sở hữu xem được', async () => {
    const ownerCustomer = await createTestCustomer('Chủ Chứng Nhận')
    const strangerCustomer = await createTestCustomer('Người Lạ')

    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 22)
    const plan = await createTestPlan(ownerCustomer.id, pastDate.toISOString().split('T')[0])
    await createCheckins(plan.id, 15)

    const cert = await issueCertificate(ownerCustomer.id, { payload })
    track('certificates', cert)
    expect(cert.code).toBeTruthy()
    const certCode = cert.code!

    // Chủ sở hữu tắt link công khai
    const updatedStatus = await toggleCertificatePublic(certCode, false, ownerCustomer.id, {
      payload,
    })
    expect(updatedStatus).toBe(false)

    // Người ngoài xem -> trả về null (404)
    const strangerView = await getCertificateByCode(certCode, {
      currentCustomerId: strangerCustomer.id,
      payload,
    })
    expect(strangerView).toBeNull()

    // Khách vãng lai (không đăng nhập) xem -> trả về null (404)
    const guestView = await getCertificateByCode(certCode, {
      currentCustomerId: null,
      payload,
    })
    expect(guestView).toBeNull()

    // Chủ sở hữu đã đăng nhập xem -> trả về dữ liệu kèm isOwner = true
    const ownerView = await getCertificateByCode(certCode, {
      currentCustomerId: ownerCustomer.id,
      payload,
    })
    expect(ownerView).not.toBeNull()
    expect(ownerView?.isOwner).toBe(true)
    expect(ownerView?.isPublic).toBe(false)
  })

  it('dữ liệu trang công khai TUYỆT ĐỐI KHÔNG có cảm xúc, ghi chú, email hay customer id', async () => {
    const customer = await createTestCustomer('Bảo Vệ Riêng Tư')
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 22)
    const plan = await createTestPlan(customer.id, pastDate.toISOString().split('T')[0])
    await createCheckins(plan.id, 15)

    const cert = await issueCertificate(customer.id, { payload })
    track('certificates', cert)
    expect(cert.code).toBeTruthy()
    const certCode = cert.code!

    const publicData = await getCertificateByCode(certCode, { payload })
    expect(publicData).not.toBeNull()

    // Kiểm tra cấu trúc sanitized: chỉ có các trường cho phép
    const keys = Object.keys(publicData!)
    expect(keys).toContain('code')
    expect(keys).toContain('customerName')
    expect(keys).toContain('identityStatement')
    expect(keys).toContain('daysCompleted')
    expect(keys).toContain('issuedAt')
    expect(keys).toContain('isPublic')

    // TUYỆT ĐỐI không có dữ liệu nhạy cảm
    expect(keys).not.toContain('emotion')
    expect(keys).not.toContain('emotions')
    expect(keys).not.toContain('note')
    expect(keys).not.toContain('notes')
    expect(keys).not.toContain('email')
    expect(keys).not.toContain('customerId')
    expect(keys).not.toContain('customer')
  })

  it('khách khác không thể đổi trạng thái isPublic của chứng nhận', async () => {
    const ownerCustomer = await createTestCustomer('Chủ Sở Hữu Thật')
    const hackerCustomer = await createTestCustomer('Khách Giả Mạo')

    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 22)
    const plan = await createTestPlan(ownerCustomer.id, pastDate.toISOString().split('T')[0])
    await createCheckins(plan.id, 15)

    const cert = await issueCertificate(ownerCustomer.id, { payload })
    track('certificates', cert)
    expect(cert.code).toBeTruthy()
    const certCode = cert.code!

    // Khách khác cố đổi isPublic -> ném lỗi cấm
    await expect(
      toggleCertificatePublic(certCode, false, hackerCustomer.id, { payload }),
    ).rejects.toThrow(i18n.certificate.errors.forbidden)
  })

  it('unit test route ảnh: trả image/png cho 4x5 và 9x16; trả 404 cho mã sai hoặc format sai', async () => {
    const customer = await createTestCustomer('Ảnh Mẫu Unit Test')
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 22)
    const plan = await createTestPlan(customer.id, pastDate.toISOString().split('T')[0])
    await createCheckins(plan.id, 15)

    const cert = await issueCertificate(customer.id, { payload })
    track('certificates', cert)
    expect(cert.code).toBeTruthy()
    const certCode = cert.code!

    // 1. Gọi route 4x5 hợp lệ
    const res45 = await imageRouteHandler(new Request('http://localhost/chung-nhan/test/anh/4x5'), {
      params: Promise.resolve({ code: certCode, format: '4x5' }),
    })
    expect(res45.status).toBe(200)
    expect(res45.headers.get('content-type')).toContain('image/png')
    const buf45 = await res45.arrayBuffer()
    expect(buf45.byteLength).toBeGreaterThan(1000)

    // 2. Gọi route 9x16 hợp lệ
    const res916 = await imageRouteHandler(
      new Request('http://localhost/chung-nhan/test/anh/9x16'),
      {
        params: Promise.resolve({ code: certCode, format: '9x16' }),
      },
    )
    expect(res916.status).toBe(200)
    expect(res916.headers.get('content-type')).toContain('image/png')
    const buf916 = await res916.arrayBuffer()
    expect(buf916.byteLength).toBeGreaterThan(1000)

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
  })
})
