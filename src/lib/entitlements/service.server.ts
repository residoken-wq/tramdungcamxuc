import 'server-only'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import type { Entitlement, Product } from '@/payload-types'
import { track } from '@/lib/analytics/track'
import { vi } from '@/lib/i18n/vi'
import type { AccessResult, EntitlementStatus, MarkExpiredResult, StartTrialResult } from './types'

function parseCtx(ctx?: { payload?: Payload; now?: Date } | Date): {
  payload?: Payload
  now: Date
} {
  if (ctx instanceof Date) {
    return { now: ctx }
  }
  if (ctx && typeof ctx === 'object' && 'now' in ctx && ctx.now instanceof Date) {
    return { payload: ctx.payload, now: ctx.now }
  }
  return { payload: ctx?.payload, now: new Date() }
}

function isDuplicateTrialKeyError(err: unknown): boolean {
  if (!err) return false
  const msg = err instanceof Error ? err.message : String(err)
  const anyErr = err as {
    code?: string
    errors?: Array<{ path?: string; message?: string }>
    data?: { errors?: Array<{ path?: string; message?: string }> }
  }
  const errorsList = Array.isArray(anyErr?.errors)
    ? anyErr.errors
    : Array.isArray(anyErr?.data?.errors)
      ? anyErr.data.errors
      : []

  const hasDuplicateField = errorsList.some(
    (e) =>
      e?.path === 'trialKey' ||
      String(e?.message || '').includes('dùng thử') ||
      String(e?.message || '').includes('một lần'),
  )

  return (
    msg.includes('dùng thử một lần') ||
    msg.includes('dùng thử sản phẩm này rồi') ||
    msg.includes('trialKey') ||
    msg.includes('unique constraint') ||
    msg.includes('duplicate key') ||
    anyErr?.code === '23505' ||
    hasDuplicateField
  )
}

/**
 * Kết quả khi khách đã có bản ghi trial: còn hạn -> TRIAL_ACTIVE (kèm số ngày còn lại thật),
 * hết hạn -> TRIAL_ALREADY_USED.
 */
async function existingTrialResult(
  customerId: number,
  productId: number,
  payload: Payload,
  now: Date,
): Promise<StartTrialResult> {
  const access = await getAccess(customerId, productId, { payload, now })
  if (access.status === 'trial' && access.hasAccess) {
    return {
      success: true,
      message: vi.entitlement.trialAlreadyActive,
      code: 'TRIAL_ACTIVE',
      status: 'trial',
      expiresAt: access.expiresAt,
      daysLeft: access.daysLeft,
    }
  }
  return {
    success: false,
    message: vi.entitlement.trialAlreadyUsed,
    code: 'TRIAL_ALREADY_USED',
    status: access.status,
    expiresAt: access.expiresAt,
    daysLeft: 0,
  }
}

/**
 * REVIEW-REQUIRED: Khởi tạo dùng thử cho khách hàng.
 * - Chỉ cho phép khi sản phẩm đã xuất bản, saleStatus = on_sale, trialDays > 0.
 * - Thời gian hết hạn = now + trialDays ngày.
 * - Kiểm tra DB unique trialKey: khách đã từng dùng thử sẽ bị từ chối với thông báo tiếng Việt rõ ràng.
 * - Nếu khách đã có quyền active thì không tạo trial và thông báo đã có quyền.
 * - Xử lý tương tranh an toàn: 2 yêu cầu đồng thời tạo đúng 1 bản ghi trial.
 */
export async function startTrial(
  customerId: number,
  productId: number,
  ctx?: { payload?: Payload; now?: Date } | Date,
): Promise<StartTrialResult> {
  const { now, payload: rawPayload } = parseCtx(ctx)
  const payload = rawPayload ?? (await getPayload({ config: await config }))

  // 1. Kiểm tra xem khách đã có quyền active còn hiệu lực hay chưa
  const currentAccess = await getAccess(customerId, productId, { payload, now })
  if (currentAccess.status === 'active' && currentAccess.hasAccess) {
    return {
      success: false,
      message: vi.entitlement.alreadyHasActiveAccess,
      code: 'ALREADY_HAVE_ACTIVE',
      status: 'active',
      expiresAt: currentAccess.expiresAt,
      daysLeft: currentAccess.daysLeft,
    }
  }

  // Đang trong thời gian dùng thử -> báo đúng trạng thái và số ngày còn lại (không phải "đã dùng hết")
  if (currentAccess.status === 'trial' && currentAccess.hasAccess) {
    return {
      success: true,
      message: vi.entitlement.trialAlreadyActive,
      code: 'TRIAL_ACTIVE',
      status: 'trial',
      expiresAt: currentAccess.expiresAt,
      daysLeft: currentAccess.daysLeft,
    }
  }

  // 2. Đọc thông tin sản phẩm
  const product = (await payload.findByID({
    collection: 'products',
    id: productId,
    depth: 0,
    overrideAccess: true,
  })) as Product | null

  if (!product) {
    return {
      success: false,
      message: vi.entitlement.productNotFound,
      code: 'PRODUCT_NOT_FOUND',
    }
  }

  const isPublished = product._status === 'published'
  const isOnSale = product.saleStatus === 'on_sale'
  const trialDays = typeof product.trialDays === 'number' ? product.trialDays : 0

  // Chỉ công cụ số mới có dùng thử (gói, ebook… có trialDays cũng không mở).
  const isDigitalTool = product.type === 'digital_tool'

  if (!isPublished || !isOnSale || !isDigitalTool || trialDays <= 0) {
    return {
      success: false,
      message: vi.entitlement.productNotAvailableForTrial,
      code: 'NOT_ELIGIBLE',
    }
  }

  // 3. Kiểm tra xem khách hàng đã từng dùng thử công cụ này chưa
  const existingTrial = await payload.find({
    collection: 'entitlements',
    where: {
      and: [
        { customer: { equals: customerId } },
        { product: { equals: productId } },
        { source: { equals: 'trial' } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (existingTrial.totalDocs > 0) {
    // Có thể là trial vừa được một yêu cầu song song tạo ra -> đọc lại trạng thái thật.
    return await existingTrialResult(customerId, productId, payload, now)
  }

  // 4. Tạo bản ghi trial với trialKey duy nhất
  const expiresAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000)
  const trialKey = `${customerId}:${productId}`

  try {
    const created = await payload.create({
      collection: 'entitlements',
      data: {
        customer: customerId,
        product: productId,
        source: 'trial',
        status: 'trial',
        grantedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        trialKey,
      },
      overrideAccess: true,
    })

    // Ghi nhận sự kiện phân tích (chỉ productSlug, productId, days - không chứa PII)
    // TODO(T2-04): track() chỉ gửi được từ trình duyệt; gọi ở server hiện không ghi nhận gì.
    // T2-04 gửi `trial_started` từ phía client sau khi startTrial thành công.
    track('trial_started', {
      productSlug: product.slug,
      productId: product.id,
      days: trialDays,
    })

    return {
      success: true,
      message: vi.entitlement.trialStartedSuccess,
      code: 'TRIAL_STARTED',
      entitlementId: created.id,
      status: 'trial',
      expiresAt,
      daysLeft: trialDays,
    }
  } catch (err: unknown) {
    if (isDuplicateTrialKeyError(err)) {
      // Một yêu cầu song song vừa tạo trial: đọc lại để trả đúng trạng thái hiện tại.
      return await existingTrialResult(customerId, productId, payload, now)
    }
    throw err
  }
}

/**
 * REVIEW-REQUIRED: Kiểm tra chi tiết quyền truy cập của khách hàng với một sản phẩm.
 * - Hết hạn được tính toán ngay lúc đọc (read-time evaluation) dựa theo expiresAt và now, không phụ thuộc cron.
 * - Nếu có nhiều bản ghi (ví dụ trial cũ + đơn mua mới): chọn quyền tốt nhất (active > trial > expired > none).
 * - Trả về: { hasAccess, status: 'trial' | 'active' | 'expired' | 'none', expiresAt, daysLeft }.
 */
export async function getAccess(
  customerId: number,
  productId: number,
  ctx?: { payload?: Payload; now?: Date } | Date,
): Promise<AccessResult> {
  const { now, payload: rawPayload } = parseCtx(ctx)
  const payload = rawPayload ?? (await getPayload({ config: await config }))

  const res = await payload.find({
    collection: 'entitlements',
    where: {
      and: [{ customer: { equals: customerId } }, { product: { equals: productId } }],
    },
    depth: 0,
    limit: 100,
    overrideAccess: true,
  })

  const docs = res.docs as Entitlement[]
  if (docs.length === 0) {
    return {
      hasAccess: false,
      status: 'none',
      expiresAt: null,
      daysLeft: null,
    }
  }

  interface EvaluatedEntitlement {
    status: EntitlementStatus
    hasAccess: boolean
    expiresAt: Date | null
    daysLeft: number | null
  }

  const evaluated: EvaluatedEntitlement[] = docs.map((doc) => {
    const expiresAt = doc.expiresAt ? new Date(doc.expiresAt) : null
    const isExpiredAtNow = expiresAt !== null && now.getTime() >= expiresAt.getTime()

    if (isExpiredAtNow || doc.status === 'expired') {
      return {
        status: 'expired',
        hasAccess: false,
        expiresAt,
        daysLeft: 0,
      }
    }

    if (doc.status === 'active') {
      let daysLeft: number | null = null
      if (expiresAt !== null) {
        const diffMs = expiresAt.getTime() - now.getTime()
        daysLeft = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)))
      }
      return {
        status: 'active',
        hasAccess: true,
        expiresAt,
        daysLeft,
      }
    }

    // Dùng thử luôn phải có ngày hết hạn; thiếu (VD nhập tay trong admin) -> coi như hết hạn.
    if (doc.status === 'trial' && expiresAt !== null) {
      const diffMs = expiresAt.getTime() - now.getTime()
      const daysLeft = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)))
      return {
        status: 'trial',
        hasAccess: true,
        expiresAt,
        daysLeft,
      }
    }

    return {
      status: 'expired',
      hasAccess: false,
      expiresAt,
      daysLeft: 0,
    }
  })

  // Chọn quyền tốt nhất theo thứ tự: active > trial > expired
  // 1. Tìm active còn hiệu lực
  const activeDocs = evaluated.filter((e) => e.status === 'active')
  if (activeDocs.length > 0) {
    // Ưu tiên bản ghi vĩnh viễn (expiresAt === null)
    const lifetime = activeDocs.find((e) => e.expiresAt === null)
    if (lifetime) return lifetime

    // Hoặc bản ghi có thời hạn xa nhất
    activeDocs.sort((a, b) => (b.expiresAt?.getTime() ?? 0) - (a.expiresAt?.getTime() ?? 0))
    return activeDocs[0]!
  }

  // 2. Tìm trial còn hiệu lực
  const trialDocs = evaluated.filter((e) => e.status === 'trial')
  if (trialDocs.length > 0) {
    trialDocs.sort((a, b) => (b.expiresAt?.getTime() ?? 0) - (a.expiresAt?.getTime() ?? 0))
    return trialDocs[0]!
  }

  // 3. Toàn bộ bản ghi đã hết hạn
  const expiredDocs = evaluated.filter((e) => e.status === 'expired')
  expiredDocs.sort((a, b) => (b.expiresAt?.getTime() ?? 0) - (a.expiresAt?.getTime() ?? 0))
  return (
    expiredDocs[0] ?? {
      hasAccess: false,
      status: 'none',
      expiresAt: null,
      daysLeft: null,
    }
  )
}

/**
 * Lối tắt boolean của getAccess.
 */
export async function hasAccess(
  customerId: number,
  productId: number,
  ctx?: { payload?: Payload; now?: Date } | Date,
): Promise<boolean> {
  const result = await getAccess(customerId, productId, ctx)
  return result.hasAccess
}

/**
 * Đánh dấu các bản ghi quá hạn sang 'expired' tại DB và phát sự kiện trial_expired.
 * Mục đích: CHỈ để hiển thị đồng bộ trong admin và phát sự kiện analytics.
 * Chặn quyền truy cập KHÔNG phụ thuộc vào hàm này (vì getAccess đã tính toán lúc đọc).
 */
export async function markExpiredEntitlements(
  nowOrCtx?: Date | { payload?: Payload; now?: Date },
  ctx?: { payload?: Payload },
): Promise<MarkExpiredResult> {
  let now: Date
  let rawPayload: Payload | undefined

  if (nowOrCtx instanceof Date) {
    now = nowOrCtx
    rawPayload = ctx?.payload
  } else if (nowOrCtx && typeof nowOrCtx === 'object' && 'now' in nowOrCtx && nowOrCtx.now) {
    now = nowOrCtx.now
    rawPayload = nowOrCtx.payload
  } else {
    now = new Date()
    rawPayload = ctx?.payload
  }

  const payload = rawPayload ?? (await getPayload({ config: await config }))

  const expiredRes = await payload.find({
    collection: 'entitlements',
    where: {
      and: [
        { status: { in: ['trial', 'active'] } },
        { expiresAt: { less_than_equal: now.toISOString() } },
        { expiresAt: { exists: true } },
      ],
    },
    depth: 1,
    limit: 500,
    overrideAccess: true,
  })

  let updatedCount = 0

  for (const doc of expiredRes.docs as Array<Entitlement & { product?: Product | number | null }>) {
    try {
      await payload.update({
        collection: 'entitlements',
        id: doc.id,
        data: { status: 'expired' },
        overrideAccess: true,
      })
      updatedCount++

      if (doc.status === 'trial') {
        const prod = typeof doc.product === 'object' && doc.product !== null ? doc.product : null
        // TODO(T2-04): track() không ghi nhận gì ở server; cần kênh gửi sự kiện từ server.
        track('trial_expired', {
          productSlug: prod?.slug,
          productId: prod?.id ?? (typeof doc.product === 'number' ? doc.product : undefined),
        })
      }
    } catch (updateErr) {
      console.error(
        `[Entitlements] Không thể cập nhật trạng thái expired cho entitlement ${doc.id}:`,
        updateErr,
      )
    }
  }

  return { updatedCount }
}
