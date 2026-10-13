import React from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Product, HabitCheckin } from '@/payload-types'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { getAccess } from '@/lib/entitlements'
import { HABIT_TRACKER_PRODUCT_SLUG } from '@/lib/habit/config'
import { getCurrentDayOfPlan, getOrCreateTrackerPlan } from '@/lib/habit/tracker.server'
import { vi } from '@/lib/i18n/vi'
import { PlanSetupForm } from '@/components/habit/PlanSetupForm'
import { TrackerDashboard, type InitialCheckinData } from '@/components/habit/TrackerDashboard'

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
  const trialUrl = `/dung-thu?san-pham=${encodeURIComponent(product.slug)}`

  // 3. Lấy kế hoạch của khách hàng (nếu có)
  const plan = await getOrCreateTrackerPlan(customer.id, { payload })

  // 4. Nếu khách hàng không có quyền truy cập (chưa dùng thử hoặc đã hết hạn) và chưa có kế hoạch
  // -> Hiển thị khối mời dùng thử / mua sản phẩm (không hiển thị form tạo kế hoạch)
  if (!plan && !access.hasAccess) {
    return (
      <div className="w-full max-w-xl mx-auto py-12 px-4">
        <div className="bg-warm-ivory rounded-card border border-deep-navy/15 p-6 sm:p-8 shadow-soft text-center space-y-5">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-ui font-bold bg-soft-pink text-deep-navy">
            {vi.tracker.paywall.title}
          </span>
          <h1 className="font-ui font-bold text-2xl sm:text-3xl text-deep-navy">{product.name}</h1>
          <p className="font-sans text-sm text-deep-navy/80 max-w-md mx-auto leading-relaxed">
            {vi.tracker.paywall.description}
          </p>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={trialUrl}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-accent-pink text-warm-ivory font-ui font-bold text-sm hover:bg-accent-pink/90 transition-all shadow-sm"
            >
              {vi.tracker.paywall.trialButton}
            </Link>
            <Link
              href={buyUrl}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-full border border-deep-navy/20 text-deep-navy bg-warm-ivory hover:bg-lavender-mist/40 font-ui font-semibold text-sm transition-all"
            >
              {vi.tracker.paywall.buyButton}
            </Link>
          </div>
        </div>
      </div>
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

  // 6. Đọc các check-in hiện có của kế hoạch
  const checkinsRes = await payload.find({
    collection: 'habitCheckins',
    where: {
      plan: { equals: plan.id },
    },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  const rawDocs = checkinsRes.docs as unknown as HabitCheckin[]
  const initialCheckins: InitialCheckinData[] = rawDocs.map((doc) => ({
    day: doc.day,
    done: Boolean(doc.done),
    emotion: doc.emotion || null,
    note: doc.note || null,
  }))

  const currentDay = getCurrentDayOfPlan(plan.startDate, now)
  const isReadOnly = access.status === 'expired'
  const isTrialOrExpired = access.status === 'trial' || access.status === 'expired'

  return (
    <div className="w-full min-h-[calc(100vh-160px)] py-8 sm:py-12 px-4 bg-linear-to-b from-warm-ivory via-warm-ivory/80 to-lavender-mist/20">
      <TrackerDashboard
        planId={plan.id}
        identityStatement={plan.identityStatement}
        currentDay={currentDay}
        initialCheckins={initialCheckins}
        readOnly={isReadOnly}
        isTrialOrExpired={isTrialOrExpired}
        buyUrl={buyUrl}
      />
    </div>
  )
}
