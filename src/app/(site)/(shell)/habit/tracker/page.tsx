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
import { extractIdentityParts } from '@/lib/habit'
import {
  getHabitJourneyContent,
  getHabitSiteSettings,
  type CleanStepQuote,
  type HabitJourneyContentResult,
} from '@/lib/habit/journey-content.server'
import { getStationReflectionsForPlan } from '@/lib/habit/reflections.server'
import { vi } from '@/lib/i18n/vi'
import { PlanSetupForm } from '@/components/habit/PlanSetupForm'
import { ToolPaywall } from '@/components/site/trial/ToolPaywall'
import {
  Dashboard28Days,
  type InitialCheckinData,
} from '@/components/habit/zip/Result/Dashboard28Days'
import { HabitTrackerHeader } from '@/components/habit/zip/HabitTrackerHeader'
import { StepNavigation } from '@/components/habit/zip/StepNavigation'
import { HabitTrackerFooter } from '@/components/habit/zip/HabitTrackerFooter'

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
    ? await getOrCreateTrackerPlan(customer.id, { payload })
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

  // 7. Đọc cấu hình nội dung hành trình để lấy tên các trạm, câu giải thích dữ liệu, nội dung đồng hành sau 28 ngày và liên kết coach (HB-13 / HB-14 / HB-24)
  let stationNames: string[] = []
  let stationQuestions: { question: string }[][] = []
  let privacyNote: string | null = null
  let afterJourneyTitle: string | null = null
  let afterJourneyText: string | null = null
  let coachBookingUrl: string | null = null
  let quote: CleanStepQuote | null = null
  let journeyContent: HabitJourneyContentResult | null = null

  try {
    const [jc, habitSiteSettings] = await Promise.all([
      getHabitJourneyContent(payload),
      getHabitSiteSettings(payload),
    ])
    journeyContent = jc
    stationNames = (journeyContent.stations || []).map((s) => s.name).filter(Boolean)
    stationQuestions = (journeyContent.stations || []).map((s) =>
      (s.reflectionQuestions || [])
        .map((q) => ({ question: q.question?.trim() || '' }))
        .filter((q) => Boolean(q.question)),
    )
    privacyNote = journeyContent.privacyNote ?? null
    afterJourneyTitle = journeyContent.tracker?.afterJourneyTitle ?? null
    afterJourneyText = journeyContent.tracker?.afterJourneyText ?? null
    coachBookingUrl = habitSiteSettings.habitCoachBookingUrl ?? null
    quote = journeyContent.stepQuotes?.tracker ?? null
  } catch (err) {
    // Lỗi đọc -> trang vẫn chạy bình thường, không có tên trạm
    console.error('Failed to load habit journey stations/settings for tracker:', err)
  }

  // 7b. Đọc các bài suy ngẫm đã lưu của học viên (HB-12)
  const initialReflections = await getStationReflectionsForPlan(payload, plan.id, customer.id)

  const currentDay = getCurrentDayOfPlan(plan.startDate, now)
  const isReadOnly = !access.hasAccess
  const isTrialOrExpired = access.status === 'trial' || access.status === 'expired'

  // Lấy điều kiện nhận chứng nhận
  const eligibility = await getCertificateEligibility(customer.id, { payload, now })

  // Z1: Tách căn tính từ plan hoặc identityStatement
  const extracted = extractIdentityParts(plan.identityStatement)
  const planAny = plan as unknown as Record<string, unknown>
  const identityRole =
    (typeof planAny.personText === 'string' && planAny.personText.trim()) ||
    extracted.personText ||
    null
  const identityAction =
    (typeof planAny.actionText === 'string' && planAny.actionText.trim()) ||
    extracted.actionText ||
    null

  return (
    <div className="w-full min-h-[calc(100vh-160px)] py-8 sm:py-12 px-4 bg-linear-to-b from-warm-ivory via-warm-ivory/80 to-lavender-mist/20">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <HabitTrackerHeader currentStep={7} headerContent={journeyContent?.dp01Content?.header} />
        {/* QA DP-01e / DP-02c: no function props from this server page (it crashes the tracker). */}
        <StepNavigation currentStep={7} hasSavedPlan={true} />
        <Dashboard28Days
          planId={plan.id}
          identityStatement={plan.identityStatement}
          identityRole={identityRole}
          identityAction={identityAction}
          atomicHabit={plan.twoMinuteAction || plan.anchorHabit || null}
          selectedMentor={plan.anchorHabit || null}
          selectedDays={plan.rhythmDays ?? null}
          startDate={plan.startDate ?? null}
          stationNames={stationNames}
          stationQuestions={stationQuestions}
          initialReflections={initialReflections}
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
          afterJourneyTitle={afterJourneyTitle}
          afterJourneyText={afterJourneyText}
          coachBookingUrl={coachBookingUrl}
          quote={quote ? { quoteText: quote.text, quoteAuthor: quote.author } : null}
          checkInContent={journeyContent?.dp01Content?.checkIn}
        />
        <HabitTrackerFooter footerContent={journeyContent?.dp01Content?.footer} />
      </div>
    </div>
  )
}
