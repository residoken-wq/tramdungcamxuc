// REVIEW-REQUIRED: Thư viện tạo, xóa và cấp mã OTP cho dữ liệu demo GĐ 2.
import { randomInt } from 'node:crypto'
import { createRequire } from 'node:module'
import type { Payload, Where } from 'payload'
import { EMOTIONS } from '../src/lib/emotions'
import { getVietnamYmd } from '../src/lib/habit/tracker-stats'
import { getEffectivePrice } from '../src/lib/products'
import type { DemoSeedFacts } from './demo-guard'

// Intercept server-only package when executed outside Next.js bundler
const require = createRequire(import.meta.url)
try {
  const resolved = require.resolve('server-only')
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports: {},
  } as unknown as NodeJS.Module
} catch {
  // Ignored in environments where server-only is mocked or not loaded
}

export const DEMO_EMAILS = [
  'hoc-vien-test-01@example.test',
  'hoc-vien-test-02@example.test',
  'hoc-vien-test-03@example.test',
] as const

export type DemoEmail = (typeof DEMO_EMAILS)[number]

export const DEMO_WORKSHOP_TITLE = '[DEMO GĐ2] Tập thương cảm xúc'
export const DEMO_WORKSHOP_PREFIX = '[DEMO GĐ2]'
export const HABIT_TRACKER_PRODUCT_SLUG = 'habit-tracker-so'

export interface DemoSeedRow {
  email: string
  scenario: string
  link: string
  paymentRef: string
  amount: string
}

export interface DemoSeedResult {
  rows: DemoSeedRow[]
  pendingOrderToken: string
}

/**
 * Tính chuỗi thời gian ISO theo múi giờ Việt Nam (+07:00).
 */
export function addVietnamDays(
  baseYmd: string,
  offsetDays: number,
  timeStr = '00:00:00+07:00',
): string {
  const [y, m, d] = baseYmd.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + offsetDays))
  const ymdStr = date.toISOString().slice(0, 10)
  return new Date(`${ymdStr}T${timeStr}`).toISOString()
}

/**
 * Thu thập dữ kiện kiểm tra an toàn từ cơ sở dữ liệu.
 */
export async function collectDemoSeedFacts(payload: Payload): Promise<DemoSeedFacts> {
  const paidOrders = await payload.find({
    collection: 'orders',
    where: {
      paymentStatus: { equals: 'paid' },
    },
    pagination: false,
    depth: 1,
    overrideAccess: true,
  })

  let hasPaidOrderFromNonExampleEmail = false
  for (const order of paidOrders.docs) {
    let email: string | undefined
    if (typeof order.customer === 'object' && order.customer !== null) {
      email = (order.customer as { email?: string }).email
    } else if (order.customer) {
      const cust = await payload.findByID({
        collection: 'customers',
        id: Number(order.customer),
        depth: 0,
        overrideAccess: true,
      })
      email = cust?.email
    }

    if (!email || !email.toLowerCase().endsWith('@example.test')) {
      hasPaidOrderFromNonExampleEmail = true
      break
    }
  }

  return { hasPaidOrderFromNonExampleEmail }
}

/**
 * Xóa dữ liệu demo theo đúng thứ tự con trước cha:
 * certificates → habitCheckins → trackerNudges → habitPlans → workshopReminders →
 * trialReminders → lessonProgress → savedCards → paymentEvents → auditLogs →
 * entitlements → orders → otpCodes → diagnosticResults, leads → customers → demo workshop.
 */
export async function cleanDemoGd2(payload: Payload): Promise<Record<string, number>> {
  const tally: Record<string, number> = {}

  // 1. Tìm các ID liên kết của demo
  const demoCustomers = await payload.find({
    collection: 'customers',
    where: { email: { in: [...DEMO_EMAILS] } },
    pagination: false,
    overrideAccess: true,
  })
  const demoCustomerIds = demoCustomers.docs.map((c) => c.id)

  const demoWorkshops = await payload.find({
    collection: 'workshops',
    where: { title: { like: `${DEMO_WORKSHOP_PREFIX}%` } },
    pagination: false,
    overrideAccess: true,
  })
  // `like` của Payload khớp "chứa"; chỉ lấy đúng tiêu đề BẮT ĐẦU bằng tiền tố demo
  const demoWorkshopIds = demoWorkshops.docs
    .filter((w) => typeof w.title === 'string' && w.title.startsWith(DEMO_WORKSHOP_PREFIX))
    .map((w) => w.id)

  let demoOrderIds: number[] = []
  let demoPlanIds: number[] = []
  let demoEntitlementIds: number[] = []

  if (demoCustomerIds.length > 0) {
    const orders = await payload.find({
      collection: 'orders',
      where: { customer: { in: demoCustomerIds } },
      pagination: false,
      overrideAccess: true,
    })
    demoOrderIds = orders.docs.map((o) => o.id)

    const plans = await payload.find({
      collection: 'habitPlans',
      where: {
        or: [{ customer: { in: demoCustomerIds } }, { leadEmail: { in: [...DEMO_EMAILS] } }],
      },
      pagination: false,
      overrideAccess: true,
    })
    demoPlanIds = plans.docs.map((p) => p.id)

    const entitlements = await payload.find({
      collection: 'entitlements',
      where: { customer: { in: demoCustomerIds } },
      pagination: false,
      overrideAccess: true,
    })
    demoEntitlementIds = entitlements.docs.map((e) => e.id)
  } else {
    const plans = await payload.find({
      collection: 'habitPlans',
      where: { leadEmail: { in: [...DEMO_EMAILS] } },
      pagination: false,
      overrideAccess: true,
    })
    demoPlanIds = plans.docs.map((p) => p.id)
  }

  // 2. Xóa certificates
  if (demoCustomerIds.length > 0 || demoPlanIds.length > 0) {
    const orConditions: Where[] = []
    if (demoCustomerIds.length > 0) orConditions.push({ customer: { in: demoCustomerIds } })
    if (demoPlanIds.length > 0) orConditions.push({ plan: { in: demoPlanIds } })

    const res = await payload.delete({
      collection: 'certificates',
      where: { or: orConditions },
      overrideAccess: true,
    })
    if (res.errors?.length) throw new Error(`Lỗi xóa certificates: ${JSON.stringify(res.errors)}`)
    tally.certificates = res.docs.length
  } else {
    tally.certificates = 0
  }

  // 3. Xóa habitCheckins
  if (demoPlanIds.length > 0) {
    const res = await payload.delete({
      collection: 'habitCheckins',
      where: { plan: { in: demoPlanIds } },
      overrideAccess: true,
    })
    if (res.errors?.length) throw new Error(`Lỗi xóa habitCheckins: ${JSON.stringify(res.errors)}`)
    tally.habitCheckins = res.docs.length
  } else {
    tally.habitCheckins = 0
  }

  // 4. Xóa trackerNudges
  if (demoPlanIds.length > 0) {
    const res = await payload.delete({
      collection: 'trackerNudges',
      where: { plan: { in: demoPlanIds } },
      overrideAccess: true,
    })
    if (res.errors?.length) throw new Error(`Lỗi xóa trackerNudges: ${JSON.stringify(res.errors)}`)
    tally.trackerNudges = res.docs.length
  } else {
    tally.trackerNudges = 0
  }

  // 5. Xóa habitPlans
  if (demoPlanIds.length > 0) {
    const res = await payload.delete({
      collection: 'habitPlans',
      where: { id: { in: demoPlanIds } },
      overrideAccess: true,
    })
    if (res.errors?.length) throw new Error(`Lỗi xóa habitPlans: ${JSON.stringify(res.errors)}`)
    tally.habitPlans = res.docs.length
  } else {
    tally.habitPlans = 0
  }

  // 6. Xóa workshopReminders
  if (demoCustomerIds.length > 0 || demoWorkshopIds.length > 0) {
    const orConditions: Where[] = []
    if (demoCustomerIds.length > 0) orConditions.push({ customer: { in: demoCustomerIds } })
    if (demoWorkshopIds.length > 0) orConditions.push({ workshop: { in: demoWorkshopIds } })

    const res = await payload.delete({
      collection: 'workshopReminders',
      where: { or: orConditions },
      overrideAccess: true,
    })
    if (res.errors?.length)
      throw new Error(`Lỗi xóa workshopReminders: ${JSON.stringify(res.errors)}`)
    tally.workshopReminders = res.docs.length
  } else {
    tally.workshopReminders = 0
  }

  // 7. Xóa trialReminders
  if (demoEntitlementIds.length > 0) {
    const res = await payload.delete({
      collection: 'trialReminders',
      where: { entitlement: { in: demoEntitlementIds } },
      overrideAccess: true,
    })
    if (res.errors?.length) throw new Error(`Lỗi xóa trialReminders: ${JSON.stringify(res.errors)}`)
    tally.trialReminders = res.docs.length
  } else {
    tally.trialReminders = 0
  }

  // 8. Xóa lessonProgress
  if (demoCustomerIds.length > 0) {
    const res = await payload.delete({
      collection: 'lessonProgress',
      where: { customer: { in: demoCustomerIds } },
      overrideAccess: true,
    })
    if (res.errors?.length) throw new Error(`Lỗi xóa lessonProgress: ${JSON.stringify(res.errors)}`)
    tally.lessonProgress = res.docs.length
  } else {
    tally.lessonProgress = 0
  }

  // 9. Xóa savedCards
  if (demoCustomerIds.length > 0) {
    const res = await payload.delete({
      collection: 'savedCards',
      where: { customer: { in: demoCustomerIds } },
      overrideAccess: true,
    })
    if (res.errors?.length) throw new Error(`Lỗi xóa savedCards: ${JSON.stringify(res.errors)}`)
    tally.savedCards = res.docs.length
  } else {
    tally.savedCards = 0
  }

  // 10. Xóa paymentEvents (của đơn demo)
  if (demoOrderIds.length > 0) {
    const res = await payload.delete({
      collection: 'paymentEvents',
      where: { order: { in: demoOrderIds } },
      overrideAccess: true,
    })
    if (res.errors?.length) throw new Error(`Lỗi xóa paymentEvents: ${JSON.stringify(res.errors)}`)
    tally.paymentEvents = res.docs.length
  } else {
    tally.paymentEvents = 0
  }

  // 11. Xóa auditLogs (tham chiếu đơn / khách demo)
  const auditTargets: string[] = [
    ...demoOrderIds.map((id) => `orders:${id}`),
    ...demoCustomerIds.map((id) => `customers:${id}`),
  ]
  if (auditTargets.length > 0) {
    const res = await payload.delete({
      collection: 'auditLogs',
      where: { target: { in: auditTargets } },
      overrideAccess: true,
    })
    if (res.errors?.length) throw new Error(`Lỗi xóa auditLogs: ${JSON.stringify(res.errors)}`)
    tally.auditLogs = res.docs.length
  } else {
    tally.auditLogs = 0
  }

  // 12. Xóa entitlements
  if (demoEntitlementIds.length > 0) {
    const res = await payload.delete({
      collection: 'entitlements',
      where: { id: { in: demoEntitlementIds } },
      overrideAccess: true,
    })
    if (res.errors?.length) throw new Error(`Lỗi xóa entitlements: ${JSON.stringify(res.errors)}`)
    tally.entitlements = res.docs.length
  } else {
    tally.entitlements = 0
  }

  // 13. Xóa orders
  if (demoOrderIds.length > 0) {
    const res = await payload.delete({
      collection: 'orders',
      where: { id: { in: demoOrderIds } },
      overrideAccess: true,
    })
    if (res.errors?.length) throw new Error(`Lỗi xóa orders: ${JSON.stringify(res.errors)}`)
    tally.orders = res.docs.length
  } else {
    tally.orders = 0
  }

  // 14. Xóa otpCodes (email demo)
  {
    const res = await payload.delete({
      collection: 'otpCodes',
      where: { email: { in: [...DEMO_EMAILS] } },
      overrideAccess: true,
    })
    if (res.errors?.length) throw new Error(`Lỗi xóa otpCodes: ${JSON.stringify(res.errors)}`)
    tally.otpCodes = res.docs.length
  }

  // 15. Xóa diagnosticResults (email demo)
  {
    const res = await payload.delete({
      collection: 'diagnosticResults',
      where: { email: { in: [...DEMO_EMAILS] } },
      overrideAccess: true,
    })
    if (res.errors?.length)
      throw new Error(`Lỗi xóa diagnosticResults: ${JSON.stringify(res.errors)}`)
    tally.diagnosticResults = res.docs.length
  }

  // 16. Xóa leads (email demo)
  {
    const res = await payload.delete({
      collection: 'leads',
      where: { email: { in: [...DEMO_EMAILS] } },
      overrideAccess: true,
    })
    if (res.errors?.length) throw new Error(`Lỗi xóa leads: ${JSON.stringify(res.errors)}`)
    tally.leads = res.docs.length
  }

  // 17. Xóa customers
  if (demoCustomerIds.length > 0) {
    const res = await payload.delete({
      collection: 'customers',
      where: { id: { in: demoCustomerIds } },
      overrideAccess: true,
      context: { accountDeletion: true },
    })
    if (res.errors?.length) throw new Error(`Lỗi xóa customers: ${JSON.stringify(res.errors)}`)
    tally.customers = res.docs.length
  } else {
    tally.customers = 0
  }

  // 18. Xóa demo workshop
  if (demoWorkshopIds.length > 0) {
    const res = await payload.delete({
      collection: 'workshops',
      where: { id: { in: demoWorkshopIds } },
      overrideAccess: true,
    })
    if (res.errors?.length) throw new Error(`Lỗi xóa workshops: ${JSON.stringify(res.errors)}`)
    tally.workshops = res.docs.length
  } else {
    tally.workshops = 0
  }

  return tally
}

/**
 * Seed dữ liệu demo GĐ 2.
 * Tự động reset (clean) dữ liệu demo cũ trước khi tạo lại để đảm bảo tính lũy đẳng (idempotent).
 */
export async function seedDemoGd2(
  payload: Payload,
  options?: { now?: Date },
): Promise<DemoSeedResult> {
  // 1. Kiểm tra sản phẩm habit-tracker-so TRƯỚC khi xóa gì
  const productRes = await payload.find({
    collection: 'products',
    where: { slug: { equals: HABIT_TRACKER_PRODUCT_SLUG } },
    limit: 1,
    overrideAccess: true,
  })
  const habitProduct = productRes.docs[0]
  if (!habitProduct) {
    throw new Error(
      `Không tìm thấy sản phẩm '${HABIT_TRACKER_PRODUCT_SLUG}'. Chạy 'pnpm seed' trước để nạp danh mục sản phẩm.`,
    )
  }

  // 2. Reset dữ liệu demo cũ
  await cleanDemoGd2(payload)

  const now = options?.now ?? new Date()
  const nowIso = now.toISOString()
  const todayYmd = getVietnamYmd(now)
  // Giá và số ngày dùng thử lấy từ CMS, cùng cách tính với createDigitalToolOrder (không ghi cứng)
  const effective = getEffectivePrice(habitProduct, now)
  const productPrice = effective.salePrice ?? effective.price
  if (productPrice == null || productPrice <= 0) {
    throw new Error(`Sản phẩm '${HABIT_TRACKER_PRODUCT_SLUG}' chưa có giá trong CMS.`)
  }
  const trialDays = habitProduct.trialDays
  if (!trialDays || trialDays <= 0) {
    throw new Error(`Sản phẩm '${HABIT_TRACKER_PRODUCT_SLUG}' chưa đặt số ngày dùng thử.`)
  }

  // -------------------------------------------------------------
  // KHÁCH 01: Học viên Test 01
  // Dùng thử đang chạy, hôm nay là ngày 5. Check-in 4 ngày.
  // -------------------------------------------------------------
  const customer01 = await payload.create({
    collection: 'customers',
    data: {
      email: DEMO_EMAILS[0],
      name: 'Học viên Test 01',
      consentMarketing: false,
      consentAt: nowIso,
    },
    overrideAccess: true,
  })

  const c1GrantedAt = addVietnamDays(todayYmd, -4)
  const c1ExpiresAt = addVietnamDays(todayYmd, -4 + trialDays)
  await payload.create({
    collection: 'entitlements',
    data: {
      customer: customer01.id,
      product: habitProduct.id,
      source: 'trial',
      status: 'trial',
      grantedAt: c1GrantedAt,
      expiresAt: c1ExpiresAt,
    },
    overrideAccess: true,
  })

  const plan01 = await payload.create({
    collection: 'habitPlans',
    data: {
      customer: customer01.id,
      startDate: c1GrantedAt,
      // [MẪU] Câu định danh của học viên test 01
      identityStatement: 'Tôi sẽ đọc 10 trang sách mỗi tối để trở thành người học suốt đời',
    },
    overrideAccess: true,
  })

  // Check-in ngày 1 đến 4 (hôm nay là ngày 5 chưa check-in)
  for (let day = 1; day <= 4; day++) {
    const emotionIndex = (day - 1) % EMOTIONS.length
    await payload.create({
      collection: 'habitCheckins',
      data: {
        plan: plan01.id,
        day,
        done: true,
        emotion: EMOTIONS[emotionIndex].key,
      },
      overrideAccess: true,
    })
  }

  // Đơn chờ thanh toán của Học viên Test 01. paymentRef / payToken do hook của Orders sinh
  // (context.paymentAction như createDigitalToolOrder) → đọc lại từ bản ghi để in đúng.
  const pendingOrder = await payload.create({
    collection: 'orders',
    data: {
      customer: customer01.id,
      items: [{ product: habitProduct.id, price: productPrice }],
      subtotal: productPrice,
      total: productPrice,
      paymentStatus: 'pending',
      termsAcceptedAt: nowIso,
    },
    context: { paymentAction: true },
    overrideAccess: true,
  })
  const paymentRef01 = pendingOrder.paymentRef ?? ''
  const payToken01 = pendingOrder.payToken ?? ''
  if (!paymentRef01 || !payToken01) {
    throw new Error('Đơn chờ thanh toán demo không có mã chuyển khoản hoặc payToken.')
  }

  // -------------------------------------------------------------
  // KHÁCH 02: Học viên Test 02
  // Dùng thử đã hết hạn. Check-in 10 ngày rải rác. Tracker chỉ xem.
  // -------------------------------------------------------------
  const customer02 = await payload.create({
    collection: 'customers',
    data: {
      email: DEMO_EMAILS[1],
      name: 'Học viên Test 02',
      consentMarketing: false,
      consentAt: nowIso,
    },
    overrideAccess: true,
  })

  const c2GrantedAt = addVietnamDays(todayYmd, -25)
  const c2ExpiresAt = addVietnamDays(todayYmd, -4)
  await payload.create({
    collection: 'entitlements',
    data: {
      customer: customer02.id,
      product: habitProduct.id,
      source: 'trial',
      status: 'expired',
      grantedAt: c2GrantedAt,
      expiresAt: c2ExpiresAt,
    },
    overrideAccess: true,
  })

  const plan02 = await payload.create({
    collection: 'habitPlans',
    data: {
      customer: customer02.id,
      startDate: c2GrantedAt,
      identityStatement: '[MẪU] Tôi sẽ đi bộ 15 phút mỗi sáng để chăm sóc sức khỏe',
    },
    overrideAccess: true,
  })

  // Check-in 10 ngày rải rác trong 21 ngày
  const c2CheckinDays = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19]
  for (const day of c2CheckinDays) {
    const emotionIndex = (day - 1) % EMOTIONS.length
    await payload.create({
      collection: 'habitCheckins',
      data: {
        plan: plan02.id,
        day,
        done: true,
        emotion: EMOTIONS[emotionIndex].key,
      },
      overrideAccess: true,
    })
  }

  // -------------------------------------------------------------
  // KHÁCH 03: Học viên Test 03
  // Đã mua + hoàn thành 28/28 ngày. Sẵn sàng bấm nhận chứng nhận.
  // -------------------------------------------------------------
  const customer03 = await payload.create({
    collection: 'customers',
    data: {
      email: DEMO_EMAILS[2],
      name: 'Học viên Test 03',
      consentMarketing: false,
      consentAt: nowIso,
    },
    overrideAccess: true,
  })

  const c3PaidAt = addVietnamDays(todayYmd, -30, '12:00:00+07:00')
  const c3Order = await payload.create({
    collection: 'orders',
    data: {
      customer: customer03.id,
      items: [{ product: habitProduct.id, price: productPrice }],
      subtotal: productPrice,
      total: productPrice,
      paymentStatus: 'paid',
      paidAt: c3PaidAt,
      termsAcceptedAt: addVietnamDays(todayYmd, -30, '11:55:00+07:00'),
      deliveryStatus: 'access_granted',
    },
    context: { paymentAction: true },
    overrideAccess: true,
  })

  await payload.create({
    collection: 'entitlements',
    data: {
      customer: customer03.id,
      product: habitProduct.id,
      order: c3Order.id,
      source: 'order',
      status: 'active',
      grantedAt: c3PaidAt,
    },
    overrideAccess: true,
  })

  const plan03 = await payload.create({
    collection: 'habitPlans',
    data: {
      customer: customer03.id,
      startDate: addVietnamDays(todayYmd, -29),
      identityStatement: '[MẪU] Tôi sẽ tập thở sâu 5 phút mỗi sáng để tâm an yên',
    },
    overrideAccess: true,
  })

  // Check-in đủ cả 28 ngày
  for (let day = 1; day <= 28; day++) {
    const emotionIndex = (day - 1) % EMOTIONS.length
    await payload.create({
      collection: 'habitCheckins',
      data: {
        plan: plan03.id,
        day,
        done: true,
        emotion: EMOTIONS[emotionIndex].key,
      },
      overrideAccess: true,
    })
  }

  // -------------------------------------------------------------
  // WORKSHOP DEMO
  // [DEMO GĐ2] Tập thương cảm xúc (sắp diễn ra sau 3 ngày)
  // -------------------------------------------------------------
  const wsStartsAt = addVietnamDays(todayYmd, 3, '19:00:00+07:00')
  const wsEndsAt = addVietnamDays(todayYmd, 3, '21:00:00+07:00')
  await payload.create({
    collection: 'workshops',
    data: {
      title: DEMO_WORKSHOP_TITLE,
      startsAt: wsStartsAt,
      endsAt: wsEndsAt,
      product: habitProduct.id,
      audienceProducts: [habitProduct.id],
      joinUrl: 'https://example.test/demo-gd2-workshop',
      _status: 'published',
    },
    overrideAccess: true,
  })

  const rows: DemoSeedRow[] = [
    {
      email: DEMO_EMAILS[0],
      scenario: 'Dùng thử đang chạy (ngày 5/21, check-in 4 ngày) + 1 đơn chờ thanh toán',
      link: `/habit/tracker hoặc /thanh-toan/don/${payToken01}`,
      paymentRef: paymentRef01,
      amount: `${productPrice.toLocaleString('vi-VN')} đ`,
    },
    {
      email: DEMO_EMAILS[1],
      scenario: 'Dùng thử đã hết hạn (check-in 10 ngày dở dang) -> tracker chỉ xem',
      link: '/habit/tracker',
      paymentRef: '—',
      amount: '—',
    },
    {
      email: DEMO_EMAILS[2],
      scenario: 'Đã mua + xong 21/21 ngày -> bấm nhận chứng nhận + thấy workshop demo',
      link: '/habit/tracker hoặc /tai-khoan',
      paymentRef: '—',
      amount: '—',
    },
  ]

  return {
    rows,
    pendingOrderToken: payToken01,
  }
}

/**
 * Sinh mã OTP đăng nhập 6 số cho 1 trong 3 khách demo mà không gửi email.
 */
export async function createDemoOtp(
  payload: Payload,
  email: string,
  options?: { now?: Date },
): Promise<{ code: string }> {
  const normalizedEmail = email.trim().toLowerCase()
  if (!DEMO_EMAILS.includes(normalizedEmail as DemoEmail)) {
    throw new Error(
      `Từ chối: Email '${email}' không thuộc danh sách demo (chỉ chấp nhận: ${DEMO_EMAILS.join(', ')}).`,
    )
  }

  const { computeOtpHash } = await import('../src/lib/auth/otp.server')

  const now = options?.now ?? new Date()
  const nowIso = now.toISOString()
  const code = randomInt(100000, 1000000).toString()
  const codeHash = computeOtpHash(normalizedEmail, code)
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString()

  // 1. Đánh dấu đã dùng cho các mã cũ chưa dùng
  await payload.update({
    collection: 'otpCodes',
    where: {
      and: [{ email: { equals: normalizedEmail } }, { usedAt: { exists: false } }],
    },
    data: {
      usedAt: nowIso,
    },
    overrideAccess: true,
  })

  // 2. Tạo bản ghi mã OTP mới nhất
  await payload.create({
    collection: 'otpCodes',
    data: {
      email: normalizedEmail,
      codeHash,
      expiresAt,
      attempts: 0,
    },
    overrideAccess: true,
  })

  return { code }
}
