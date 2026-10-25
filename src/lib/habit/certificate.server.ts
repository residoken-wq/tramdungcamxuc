import 'server-only'

import { getPayload, ValidationError, type Payload } from 'payload'
import config from '@/payload.config'
import type { Certificate, Customer, HabitPlan, SiteSetting } from '@/payload-types'
import { vi } from '@/lib/i18n/vi'
import { findOwnTrackerPlan } from './tracker.server'
import { getCurrentDayOfPlan } from './tracker-stats'
import {
  computeOutcome,
  countCompletedVotingDays,
  getJourneyDays,
  getVotingDays,
  requiredDays,
} from './journey'
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
 * Đọc tỷ lệ % hoàn thành tối thiểu để nhận chứng nhận từ cài đặt website (mặc định 90%).
 */
export async function getSiteCertificateMinPercent(payload: Payload): Promise<number> {
  try {
    const siteSettings = (await payload.findGlobal({
      slug: 'siteSettings',
      depth: 0,
    })) as SiteSetting | null

    const minPercent = siteSettings?.certificateMinPercent
    if (
      typeof minPercent === 'number' &&
      Number.isFinite(minPercent) &&
      minPercent >= 50 &&
      minPercent <= 100
    ) {
      return minPercent
    }
  } catch {
    // Bỏ qua lỗi và fallback về 90
  }
  return 90
}

/**
 * Đọc số ngày tối thiểu để nhận chứng nhận từ cài đặt website (mặc định 15).
 * Cũ: Giữ lại để tương thích ngược.
 */
export async function getSiteCertificateMinDays(payload: Payload): Promise<number> {
  try {
    const siteSettings = (await payload.findGlobal({
      slug: 'siteSettings',
      depth: 0,
    })) as SiteSetting | null

    const minDays = siteSettings?.certificateMinDays
    if (typeof minDays === 'number' && Number.isFinite(minDays) && minDays >= 1 && minDays <= 60) {
      return minDays
    }
  } catch {
    // Bỏ qua lỗi và fallback về 15
  }
  return 15
}

export function sanitizeCertificate(
  cert: Certificate,
  overrides?: {
    customerName?: string | null
    journeyDays?: number | null
  },
): PublicCertificateData {
  const customerName =
    overrides?.customerName !== undefined && overrides?.customerName !== null
      ? overrides.customerName
      : typeof cert.customer === 'object' && cert.customer !== null
        ? (cert.customer as Customer).name || ''
        : ''

  const planJourneyDays =
    overrides?.journeyDays !== undefined && overrides?.journeyDays !== null
      ? overrides.journeyDays
      : typeof cert.plan === 'object' && cert.plan !== null && 'journeyDays' in cert.plan
        ? ((cert.plan as { journeyDays?: number | null }).journeyDays ?? 28)
        : 28

  return {
    code: cert.code || '',
    customerName,
    identityStatement: cert.identityStatement || '',
    daysCompleted: cert.daysCompleted ?? 0,
    journeyDays: planJourneyDays,
    issuedAt: cert.issuedAt || new Date().toISOString(),
    isPublic: Boolean(cert.isPublic),
  }
}

export type IssuedCertificate = Certificate & { isNew?: boolean }

/**
 * REVIEW-REQUIRED: Kiểm tra điều kiện tốt nghiệp và cấp chứng nhận hành trình cho học viên.
 *
 * Tiêu chí kiểm soát:
 * 1. Chỉ cấp cho kế hoạch của chính khách hàng (findOwnTrackerPlan), không gắn hay tạo kế hoạch mới.
 * 2. Khách hàng bắt buộc phải có tên trong hồ sơ customers (không dùng tên dự phòng).
 * 3. Chỉ cấp khi đã qua ngày cuối cùng của hành trình (currentDay > journeyDays tính theo giờ Việt Nam).
 * 4. Số ngày hoàn thành (check-in done = true trong votingDays) phải đạt tối thiểu requiredDays(votingDays, minPercent) từ SiteSettings (mặc định 90%).
 * 5. Cập nhật outcome của kế hoạch thành 'completed' (nếu đủ điều kiện) hoặc 'experienced' (nếu không đạt) - ghi một lần, chạy lại không đổi.
 * 6. Không cần còn quyền dùng thử: khách hết hạn vẫn nhận được chứng nhận cho số ngày đã hoàn thành.
 * 7. Tính duy nhất & chống trùng lặp: khóa trong bộ nhớ (withCertLock) theo ID khách hàng.
 *    Nếu đã có chứng nhận cho kế hoạch thì trả lại bản ghi cũ với isNew = false.
 * 8. Sao chép snapshot identityStatement và daysCompleted từ kế hoạch tại thời điểm cấp.
 */
export async function issueCertificate(
  customerId: number,
  options?: {
    payload?: Payload
    now?: Date
  },
): Promise<IssuedCertificate> {
  const payload = options?.payload ?? (await getPayload({ config: await config }))
  const now = options?.now ?? new Date()

  return withCertLock(String(customerId), async () => {
    // 0. Kiểm tra thông tin khách hàng: khách hàng phải có tên trước khi được cấp chứng nhận
    const customer = (await payload.findByID({
      collection: 'customers',
      id: customerId,
      depth: 0,
      overrideAccess: true,
    })) as Customer | null

    if (!customer?.name?.trim()) {
      throw new Error(vi.certificate.errors.nameRequired)
    }

    // 1. Lấy kế hoạch của chính khách hàng
    const ownPlan = await findOwnTrackerPlan(customerId, payload)
    if (!ownPlan) {
      throw new Error(vi.certificate.errors.noPlan)
    }

    // 2. Nếu đã có chứng nhận cho kế hoạch này -> trả về bản ghi cũ (depth: 0)
    const existingCerts = await payload.find({
      collection: 'certificates',
      where: {
        plan: { equals: ownPlan.id },
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (existingCerts.docs.length > 0) {
      return Object.assign(existingCerts.docs[0] as Certificate, { isNew: false })
    }

    const journeyDays = getJourneyDays(ownPlan)
    const currentDay = getCurrentDayOfPlan(ownPlan.startDate, now)

    // 3. Kiểm tra ngày của kế hoạch: phải qua ngày cuối cùng (currentDay > journeyDays theo giờ VN)
    if (currentDay <= journeyDays) {
      throw new Error(vi.certificate.errors.notDay21)
    }

    // 4. Kiểm tra số ngày check-in hoàn thành theo tỷ lệ tối thiểu
    const minPercent = await getSiteCertificateMinPercent(payload)
    const votingDays = getVotingDays(ownPlan)
    const minRequired = requiredDays(votingDays, minPercent)

    const checkinsRes = await payload.find({
      collection: 'habitCheckins',
      where: {
        and: [{ plan: { equals: ownPlan.id } }, { done: { equals: true } }],
      },
      limit: 100,
      depth: 0,
      overrideAccess: true,
    })

    // REVIEW-REQUIRED: only check-ins on voting days count (rest days in a weekly rhythm do not, HB-05).
    const completedDays = countCompletedVotingDays(ownPlan, checkinsRes.docs)
    if (completedDays < minRequired) {
      // Cập nhật outcome thành 'experienced' nếu chưa ghi nhận (ghi một lần, chạy lại không đổi)
      if (ownPlan.outcome !== 'experienced' && ownPlan.outcome !== 'completed') {
        try {
          await payload.update({
            collection: 'habitPlans',
            id: ownPlan.id,
            data: { outcome: 'experienced' },
            depth: 0,
            overrideAccess: true,
          })
        } catch {
          // Bỏ qua lỗi cập nhật outcome
        }
      }
      throw new Error(vi.certificate.errors.notEnoughDays(minRequired, votingDays.length))
    }

    // 5. Tạo chứng nhận mới (depth: 0)
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
        depth: 0,
        overrideAccess: true,
      })

      // Cập nhật outcome thành 'completed' (ghi một lần, chạy lại không đổi)
      if (ownPlan.outcome !== 'completed') {
        try {
          await payload.update({
            collection: 'habitPlans',
            id: ownPlan.id,
            data: { outcome: 'completed' },
            depth: 0,
            overrideAccess: true,
          })
        } catch {
          // Bỏ qua lỗi cập nhật outcome
        }
      }

      return Object.assign(created as Certificate, { isNew: true })
    } catch (err) {
      // Concurrency fallback: nếu race condition xảy ra, tìm lại bản ghi vừa tạo
      const isValidationErr =
        err instanceof ValidationError || (err as { name?: string })?.name === 'ValidationError'

      if (isValidationErr) {
        const raceExisting = await payload.find({
          collection: 'certificates',
          where: {
            plan: { equals: ownPlan.id },
          },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })

        if (raceExisting.docs.length > 0) {
          return Object.assign(raceExisting.docs[0] as Certificate, { isNew: false })
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

  const customer = (await payload.findByID({
    collection: 'customers',
    id: customerId,
    depth: 0,
    overrideAccess: true,
  })) as Customer | null
  const customerName = customer?.name?.trim() || null
  const hasCustomerName = Boolean(customerName && customerName.length > 0)

  const ownPlan = await findOwnTrackerPlan(customerId, payload)
  if (!ownPlan) {
    return {
      eligible: false,
      currentDay: 0,
      completedDays: 0,
      minDays: 26,
      customerName,
      hasCustomerName,
      hasCertificate: false,
      reason: 'NO_PLAN',
      message: vi.certificate.errors.noPlan,
    }
  }

  const journeyDays = getJourneyDays(ownPlan)
  const currentDay = getCurrentDayOfPlan(ownPlan.startDate, now)
  const minPercent = await getSiteCertificateMinPercent(payload)
  const votingDays = getVotingDays(ownPlan)
  const minRequired = requiredDays(votingDays, minPercent)

  // Kiểm tra chứng nhận hiện có (depth: 0)
  const existingCerts = await payload.find({
    collection: 'certificates',
    where: {
      plan: { equals: ownPlan.id },
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const hasCertificate = existingCerts.docs.length > 0
  const existingCert = hasCertificate ? (existingCerts.docs[0] as Certificate) : null

  const checkinsRes = await payload.find({
    collection: 'habitCheckins',
    where: {
      and: [{ plan: { equals: ownPlan.id } }, { done: { equals: true } }],
    },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  const completedDays = countCompletedVotingDays(ownPlan, checkinsRes.docs)

  // Tính kết quả hành trình (outcome)
  let outcome = ownPlan.outcome as CertificateEligibility['outcome']
  if (!outcome || outcome === 'in_progress') {
    outcome = computeOutcome({
      plan: ownPlan,
      checkins: checkinsRes.docs,
      today: now,
      percent: minPercent,
    })
    // Ghi một lần vào DB khi hoàn thành hoặc đã trải nghiệm
    if (outcome === 'completed' || outcome === 'experienced') {
      try {
        await payload.update({
          collection: 'habitPlans',
          id: ownPlan.id,
          data: { outcome },
          depth: 0,
          overrideAccess: true,
        })
      } catch {
        // Bỏ qua lỗi cập nhật outcome
      }
    }
  }

  const isPastEndDay = currentDay > journeyDays
  const hasEnoughDays = completedDays >= minRequired
  const eligible = hasCertificate || (isPastEndDay && hasEnoughDays)

  let reason: CertificateEligibility['reason']
  let message: string | undefined

  if (!hasCertificate) {
    if (!isPastEndDay) {
      reason = 'NOT_YET_DAY_21'
      message = vi.certificate.notEligible.notDay21Notice
    } else if (!hasEnoughDays) {
      reason = 'NOT_ENOUGH_DAYS'
      message = vi.certificate.notEligible.minDaysNotice(minRequired, journeyDays)
    }
  }

  const sanitizedCert = existingCert
    ? sanitizeCertificate(existingCert, {
        customerName: customerName || '',
        journeyDays,
      })
    : null

  return {
    eligible,
    currentDay,
    completedDays,
    minDays: minRequired,
    certificateMinDays: minRequired,
    journeyDays,
    minPercent,
    outcome,
    planId: ownPlan.id,
    customerName,
    hasCustomerName,
    hasCertificate,
    certificate: sanitizedCert,
    existingCertificate: sanitizedCert,
    reason,
    message,
  }
}

/**
 * REVIEW-REQUIRED: Lấy thông tin chứng nhận công khai theo mã code (HB-06).
 *
 * Kiểm soát quyền riêng tư & bảo mật:
 * 1. Đọc chứng nhận với depth: 0 để không kéo theo kế hoạch hay khách hàng vào bộ nhớ.
 * 2. Đọc riêng tên khách qua findByID + select ({ name: true }).
 * 3. Đọc riêng journeyDays của kế hoạch qua findByID + select ({ journeyDays: true }).
 * 4. Chỉ trả về các trường cần thiết: mã code, tên, câu định danh, số ngày, ngày cấp, trạng thái công khai.
 * 5. TUYỆT ĐỐI không trả về cảm xúc (emotion), ghi chú (note), lý do riêng (privateReason), bạn đồng hành (companionName), scorecard, email hoặc customer ID.
 * 6. Nếu isPublic = false: chỉ chủ sở hữu chứng nhận đã đăng nhập mới xem được (isOwner = true).
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
    depth: 0,
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

  // Đọc tên khách hàng riêng bằng depth: 0 + select
  let customerName = ''
  if (certCustomerId) {
    const custDoc = (await payload.findByID({
      collection: 'customers',
      id: certCustomerId,
      depth: 0,
      overrideAccess: true,
      select: { name: true },
    })) as Customer | null
    customerName = custDoc?.name || ''
  }

  // Đọc journeyDays của kế hoạch riêng bằng depth: 0 + select
  const rawPlan = cert.plan
  const planId =
    typeof rawPlan === 'object' && rawPlan !== null
      ? (rawPlan as { id: number }).id
      : Number(rawPlan)

  let planJourneyDays = 28
  if (planId) {
    const planDoc = (await payload.findByID({
      collection: 'habitPlans',
      id: planId,
      depth: 0,
      overrideAccess: true,
      select: { journeyDays: true },
    })) as HabitPlan | null
    if (typeof planDoc?.journeyDays === 'number') {
      planJourneyDays = planDoc.journeyDays
    }
  }

  const sanitized = sanitizeCertificate(cert, { customerName, journeyDays: planJourneyDays })
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
