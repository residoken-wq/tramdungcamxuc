import 'server-only'

import { getPayload, ValidationError, type Payload } from 'payload'
import config from '@/payload.config'
import type { Certificate, Customer, SiteSetting } from '@/payload-types'
import { vi } from '@/lib/i18n/vi'
import { findOwnTrackerPlan } from './tracker.server'
import { getCurrentDayOfPlan } from './tracker-stats'
import type { CertificateEligibility, PublicCertificateData } from './certificate-types'

const certCreationLocks = new Map<string, Promise<unknown>>()

async function withCertLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  while (certCreationLocks.has(key)) {
    try {
      await certCreationLocks.get(key)
    } catch {
      // Bỏ qua lỗi của luồng trước
    }
  }
  let resolveLock!: () => void
  const lockPromise = new Promise<void>((resolve) => {
    resolveLock = resolve
  })
  certCreationLocks.set(key, lockPromise)
  try {
    return await fn()
  } finally {
    certCreationLocks.delete(key)
    resolveLock()
  }
}

/**
 * Đọc số ngày tối thiểu để nhận chứng nhận từ cài đặt website (mặc định 15).
 */
export async function getSiteCertificateMinDays(payload: Payload): Promise<number> {
  try {
    const siteSettings = (await payload.findGlobal({
      slug: 'siteSettings',
      depth: 0,
    })) as SiteSetting | null

    const minDays = siteSettings?.certificateMinDays
    if (typeof minDays === 'number' && Number.isFinite(minDays) && minDays >= 1 && minDays <= 21) {
      return minDays
    }
  } catch {
    // Bỏ qua lỗi và fallback về 15
  }
  return 15
}

function sanitizeCertificate(cert: Certificate, defaultName = 'Học viên'): PublicCertificateData {
  const customerName =
    typeof cert.customer === 'object' && cert.customer !== null
      ? (cert.customer as Customer).name || defaultName
      : defaultName

  return {
    code: cert.code || '',
    customerName,
    identityStatement: cert.identityStatement || '',
    daysCompleted: cert.daysCompleted ?? 0,
    issuedAt: cert.issuedAt || new Date().toISOString(),
    isPublic: Boolean(cert.isPublic),
  }
}

/**
 * REVIEW-REQUIRED: Kiểm tra điều kiện tốt nghiệp và cấp chứng nhận 21 ngày cho học viên.
 *
 * Tiêu chí kiểm soát:
 * 1. Chỉ cấp cho kế hoạch của chính khách hàng (findOwnTrackerPlan), không gắn hay tạo kế hoạch mới.
 * 2. Chỉ cấp khi đã tới Ngày 21 trở đi (currentDay >= 21 tính theo giờ Việt Nam).
 * 3. Số ngày hoàn thành (check-in done = true) phải đạt tối thiểu certificateMinDays từ SiteSettings (mặc định 15).
 * 4. Không cần còn quyền dùng thử: khách hết hạn vẫn nhận được chứng nhận cho 21 ngày đã làm.
 * 5. Tính duy nhất: mỗi kế hoạch chỉ có 1 chứng nhận; nếu đã có thì trả lại bản ghi cũ; gọi song song bắt ValidationError.
 * 6. Sao chép snapshot identityStatement và daysCompleted từ kế hoạch tại thời điểm cấp.
 */
export async function issueCertificate(
  customerId: number,
  options?: {
    payload?: Payload
    now?: Date
  },
): Promise<Certificate> {
  const payload = options?.payload ?? (await getPayload({ config: await config }))
  const now = options?.now ?? new Date()

  return withCertLock(String(customerId), async () => {
    // 1. Lấy kế hoạch của chính khách hàng
    const ownPlan = await findOwnTrackerPlan(customerId, payload)
    if (!ownPlan) {
      throw new Error(vi.certificate.errors.noPlan)
    }

    // 2. Nếu đã có chứng nhận cho kế hoạch này -> trả về bản ghi cũ
    const existingCerts = await payload.find({
      collection: 'certificates',
      where: {
        plan: { equals: ownPlan.id },
      },
      limit: 1,
      depth: 1,
      overrideAccess: true,
    })

    if (existingCerts.docs.length > 0) {
      return existingCerts.docs[0] as Certificate
    }

    // 3. Kiểm tra ngày của kế hoạch (phải từ ngày 21 trở đi theo giờ VN)
    const currentDay = getCurrentDayOfPlan(ownPlan.startDate, now)
    if (currentDay < 21) {
      throw new Error(vi.certificate.errors.notDay21)
    }

    // 4. Kiểm tra số ngày check-in hoàn thành
    const minDays = await getSiteCertificateMinDays(payload)

    const checkinsRes = await payload.find({
      collection: 'habitCheckins',
      where: {
        and: [{ plan: { equals: ownPlan.id } }, { done: { equals: true } }],
      },
      limit: 100,
      depth: 0,
      overrideAccess: true,
    })

    const completedDays = checkinsRes.docs.length
    if (completedDays < minDays) {
      throw new Error(vi.certificate.errors.notEnoughDays(minDays))
    }

    // 5. Tạo chứng nhận mới
    try {
      const created = await payload.create({
        collection: 'certificates',
        data: {
          customer: customerId,
          plan: ownPlan.id,
          identityStatement: ownPlan.identityStatement || '',
          daysCompleted: completedDays,
          issuedAt: now.toISOString(),
          isPublic: true,
        },
        depth: 1,
        overrideAccess: true,
      })

      return created as Certificate
    } catch (err) {
      // Concurrency: nếu 2 request cùng gọi song song, bắt ValidationError từ unique index
      const isValidationErr =
        err instanceof ValidationError || (err as { name?: string })?.name === 'ValidationError'

      if (isValidationErr) {
        const raceExisting = await payload.find({
          collection: 'certificates',
          where: {
            plan: { equals: ownPlan.id },
          },
          limit: 1,
          depth: 1,
          overrideAccess: true,
        })

        if (raceExisting.docs.length > 0) {
          return raceExisting.docs[0] as Certificate
        }
      }

      throw err
    }
  })
}

/**
 * Kiểm tra xem khách hàng có đủ điều kiện nhận chứng nhận hay chưa, hoặc đã có chứng nhận chưa.
 */
export async function getCertificateEligibility(
  customerId: number,
  options?: {
    payload?: Payload
    now?: Date
  },
): Promise<CertificateEligibility> {
  const payload = options?.payload ?? (await getPayload({ config: await config }))
  const now = options?.now ?? new Date()

  const ownPlan = await findOwnTrackerPlan(customerId, payload)
  if (!ownPlan) {
    return {
      eligible: false,
      currentDay: 0,
      completedDays: 0,
      minDays: 15,
      hasCertificate: false,
      reason: 'NO_PLAN',
      message: vi.certificate.errors.noPlan,
    }
  }

  // Kiểm tra chứng nhận hiện có
  const existingCerts = await payload.find({
    collection: 'certificates',
    where: {
      plan: { equals: ownPlan.id },
    },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })

  const hasCertificate = existingCerts.docs.length > 0
  const existingCert = hasCertificate ? (existingCerts.docs[0] as Certificate) : null

  const currentDay = getCurrentDayOfPlan(ownPlan.startDate, now)
  const minDays = await getSiteCertificateMinDays(payload)

  const checkinsRes = await payload.find({
    collection: 'habitCheckins',
    where: {
      and: [{ plan: { equals: ownPlan.id } }, { done: { equals: true } }],
    },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  const completedDays = checkinsRes.docs.length

  const isDay21OrMore = currentDay >= 21
  const hasEnoughDays = completedDays >= minDays
  const eligible = hasCertificate || (isDay21OrMore && hasEnoughDays)

  let reason: CertificateEligibility['reason']
  let message: string | undefined

  if (!hasCertificate) {
    if (!isDay21OrMore) {
      reason = 'NOT_YET_DAY_21'
      message = vi.certificate.notEligible.notDay21Notice
    } else if (!hasEnoughDays) {
      reason = 'NOT_ENOUGH_DAYS'
      message = vi.certificate.notEligible.minDaysNotice(minDays)
    }
  }

  const sanitizedCert = existingCert ? sanitizeCertificate(existingCert) : null

  return {
    eligible,
    currentDay,
    completedDays,
    minDays,
    certificateMinDays: minDays,
    planId: ownPlan.id,
    hasCertificate,
    certificate: sanitizedCert,
    existingCertificate: sanitizedCert,
    reason,
    message,
  }
}

/**
 * REVIEW-REQUIRED: Lấy thông tin chứng nhận công khai theo mã code.
 *
 * Kiểm soát quyền riêng tư & bảo mật:
 * 1. Chỉ trả về các trường cần thiết: tên, câu định danh, số ngày, ngày cấp, mã xác minh.
 * 2. TUYỆT ĐỐI không trả về cảm xúc (emotion), ghi chú (note), email hoặc customer ID.
 * 3. Nếu isPublic = false: chỉ chủ sở hữu chứng nhận đã đăng nhập mới xem được (isOwner = true).
 *    Nếu người ngoài xem khi isPublic = false -> trả về null (dẫn đến 404).
 */
export async function getCertificateByCode(
  code: string,
  options?: {
    currentCustomerId?: number | null
    payload?: Payload
  },
): Promise<PublicCertificateData | null> {
  const cleanCode = (code || '').trim()
  if (!cleanCode) return null

  const payload = options?.payload ?? (await getPayload({ config: await config }))

  const certsRes = await payload.find({
    collection: 'certificates',
    where: {
      code: { equals: cleanCode },
    },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })

  if (certsRes.docs.length === 0) {
    return null
  }

  const cert = certsRes.docs[0] as Certificate
  const rawCustomer = cert.customer
  const certCustomerId =
    typeof rawCustomer === 'object' && rawCustomer !== null
      ? (rawCustomer as Customer).id
      : Number(rawCustomer)

  const isOwner = Boolean(
    options?.currentCustomerId && certCustomerId === options.currentCustomerId,
  )

  // Nếu tắt chia sẻ công khai và không phải chủ sở hữu -> không tìm thấy (404)
  if (!cert.isPublic && !isOwner) {
    return null
  }

  const sanitized = sanitizeCertificate(cert)
  return {
    ...sanitized,
    isOwner,
  }
}

/**
 * REVIEW-REQUIRED: Chủ chứng nhận thay đổi trạng thái chia sẻ công khai (isPublic).
 */
export async function toggleCertificatePublic(
  code: string,
  isPublic: boolean,
  customerId: number,
  options?: {
    payload?: Payload
  },
): Promise<boolean> {
  const cleanCode = (code || '').trim()
  if (!cleanCode) {
    throw new Error(vi.certificate.errors.notFound)
  }

  const payload = options?.payload ?? (await getPayload({ config: await config }))

  const certsRes = await payload.find({
    collection: 'certificates',
    where: {
      code: { equals: cleanCode },
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (certsRes.docs.length === 0) {
    throw new Error(vi.certificate.errors.notFound)
  }

  const cert = certsRes.docs[0] as Certificate
  const certCustomerId =
    typeof cert.customer === 'object' && cert.customer !== null
      ? (cert.customer as Customer).id
      : Number(cert.customer)

  if (certCustomerId !== customerId) {
    throw new Error(vi.certificate.errors.forbidden)
  }

  await payload.update({
    collection: 'certificates',
    id: cert.id,
    data: {
      isPublic: Boolean(isPublic),
    },
    depth: 0,
    overrideAccess: true,
  })

  return Boolean(isPublic)
}
