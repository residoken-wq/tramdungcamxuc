import React from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Product, HabitCheckin } from '@/payload-types'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { getAccess } from '@/lib/entitlements'
import { HABIT_TRACKER_PRODUCT_SLUG } from '@/lib/habit/config'
import {
  findOwnTrackerPlan,
  getCurrentDayOfPlan,
  getOrCreateTrackerPlan,
} from '@/lib/habit/tracker.server'
import { getCertificateEligibility } from '@/lib/habit/certificate.server'
import { getHabitJourneyContent } from '@/lib/habit/journey-content.server'
import { vi } from '@/lib/i18n/vi'
import { PlanSetupForm } from '@/components/habit/PlanSetupForm'
import { TrackerDashboard, type InitialCheckinData } from '@/components/habit/TrackerDashboard'
import { ToolPaywall } from '@/components/site/trial/ToolPaywall'
import { readHabitRestartSince } from '@/lib/habit/restart-marker.server'

export const metadata: Metadata = {
  title: `${vi.tracker.pageTitle} | Trạm Dừng Cảm Xúc`,
  description: vi.tracker.subtitle,
  robots: {
    index: false,
    follow: false,
  },
}

export default async function HabitTrackerPage() {
  // 1. Kiểm tra trạng thái đăng nhập
  const customer = await getCurrentCustomer()
  if (!customer) {
    redirect('/tai-khoan/dang-nhap?next=/habit/tracker')
  }

  const payload = await getPayload({ config: await config })

  // 2. Kiểm tra sản phẩm và quyền truy cập
  const products = await payload.find({
    collection: 'products',
    where: { slug: { equals: HABIT_TRACKER_PRODUCT_SLUG } },
    overrideAccess: true,
    limit: 1,
  })

  const product = products.docs[0] as Product | undefined
  if (!product) {
    return (
      <div className="w-full max-w-xl mx-auto py-12 px-4 text-center">
        <p className="text-sm font-sans text-deep-navy/70">{vi.tracker.productNotFound}</p>
      </div>
    )
  }

  const now = new Date()
  const access = await getAccess(customer.id, product.id, { payload, now })

  const buyUrl = `/thanh-toan?san-pham=${encodeURIComponent(product.slug)}`

  // 3. Lấy kế hoạch của khách hàng (nếu có).
  // REVIEW-REQUIRED: Chỉ khách còn quyền mới được gắn kế hoạch Habit Loop; khách không có quyền
  // chỉ xem kế hoạch đã là của mình (chỉ đọc), không gắn, không tạo.
  const plan = access.hasAccess
    ? await getOrCreateTrackerPlan(customer.id, {
        payload,
        restartSince: await readHabitRestartSince(),
      })
    : await findOwnTrackerPlan(customer.id, payload)

  // 4. Nếu khách hàng không có quyền truy cập (chưa dùng thử hoặc đã hết hạn) và chưa có kế hoạch
  // -> Hiển thị khối mời dùng thử / mua sản phẩm (không hiển thị form tạo kế hoạch)
  if (!plan && !access.hasAccess) {
    return (
      <ToolPaywall
        productSlug={HABIT_TRACKER_PRODUCT_SLUG}
        product={product}
        access={access}
        badge={vi.tracker.paywall.title}
        fallbackDescription={vi.tracker.paywall.description}
      />
    )
  }

  // 5. Nếu chưa có kế hoạch nhưng có quyền truy cập -> hiển thị form tạo kế hoạch
  if (!plan) {
    return (
      <div className="w-full max-w-2xl mx-auto py-10 px-4">
        <PlanSetupForm />
      </div>
    )
  }

  // 6. Đọc các check-in hiện có của kế hoạch (đủ cho số ngày tối đa trong CMS hoặc kế hoạch)
  const journeyDays = plan.journeyDays ?? 28
  const maxCheckinLimit = Math.max(60, journeyDays)
  const checkinsRes = await payload.find({
    collection: 'habitCheckins',
    where: {
      plan: { equals: plan.id },
    },
    limit: maxCheckinLimit,
    depth: 0,
    overrideAccess: true,
  })

  const rawDocs = checkinsRes.docs as unknown as HabitCheckin[]
  const initialCheckins: InitialCheckinData[] = rawDocs.map((doc) => ({
    day: doc.day,
    done: Boolean(doc.done),
    status: doc.status || (doc.done ? 'voted' : 'missed'),
    emotion: doc.emotion || null,
    note: doc.note || null,
  }))

  // 7. Đọc cấu hình nội dung hành trình để lấy tên các trạm và câu giải thích dữ liệu (HB-13 / HB-24)
  let stationNames: string[] = []
  let privacyNote: string | null = null
  try {
    const journeyContent = await getHabitJourneyContent(payload)
    stationNames = (journeyContent.stations || []).map((s) => s.name).filter(Boolean)
    privacyNote = journeyContent.privacyNote ?? null
  } catch (err) {
    // Lỗi đọc -> trang vẫn chạy bình thường, không có tên trạm
    console.error('Failed to load habit journey stations for tracker:', err)
  }

  const currentDay = getCurrentDayOfPlan(plan.startDate, now)
  const isReadOnly = !access.hasAccess
  const isTrialOrExpired = access.status === 'trial' || access.status === 'expired'

  // Lấy điều kiện nhận chứng nhận
  const eligibility = await getCertificateEligibility(customer.id, { payload, now })

  return (
    <div className="w-full min-h-[calc(100vh-160px)] py-8 sm:py-12 px-4 bg-linear-to-b from-warm-ivory via-warm-ivory/80 to-lavender-mist/20">
      <TrackerDashboard
        planId={plan.id}
        identityStatement={plan.identityStatement}
        anchorHabit={plan.anchorHabit ?? null}
        twoMinuteAction={plan.twoMinuteAction ?? null}
        privateReason={plan.privateReason ?? null}
        rhythmDays={plan.rhythmDays ?? null}
        startDate={plan.startDate ?? null}
        stationNames={stationNames}
        currentDay={currentDay}
        initialCheckins={initialCheckins}
        readOnly={isReadOnly}
        isTrialOrExpired={isTrialOrExpired}
        buyUrl={buyUrl}
        initialCertificate={eligibility.existingCertificate ?? null}
        eligibility={eligibility}
        customerName={customer.name ?? null}
        journeyDays={journeyDays}
        privacyNote={privacyNote}
      />
    </div>
  )
}
