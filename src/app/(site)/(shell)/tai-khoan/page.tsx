import React from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { logoutAction } from '@/lib/auth/actions'
import { getEligibleWorkshops } from '@/lib/workshops/eligible.server'
import { vi } from '@/lib/i18n/vi'
import { Button } from '@/components/ui/Button'
import { WorkshopSchedule } from '@/components/site/account/WorkshopSchedule'

export const metadata: Metadata = {
  title: 'Tài khoản của tôi | Trạm Dừng Cảm Xúc',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AccountPage() {
  const customer = await getCurrentCustomer()
  if (!customer) {
    redirect('/tai-khoan/dang-nhap?next=/tai-khoan')
  }

  const displayName = customer.name?.trim() || customer.email
  const eligibleWorkshops = await getEligibleWorkshops(customer.id)

  return (
    <div className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      {/* Header with Greeting & Logout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-deep-navy/10">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-bright-magenta mb-1">
            {vi.auth.accountHeading}
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl text-deep-navy">
            {vi.auth.welcomeCustomer(displayName)}
          </h1>
          <p className="font-quote italic text-sm text-deep-navy/70 mt-1">{customer.email}</p>
        </div>

        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="sm" className="w-full sm:w-auto">
            {vi.auth.logoutButton}
          </Button>
        </form>
      </div>

      {/* Grid: Account Info & Empty Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Information Card */}
        <div className="md:col-span-1 bg-white/95 rounded-2xl p-6 border border-lavender-mist shadow-sm space-y-4">
          <h2 className="font-ui text-base font-bold text-deep-navy border-b border-deep-navy/10 pb-3">
            {vi.auth.customerInfo}
          </h2>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs font-semibold uppercase text-deep-navy/50 block">
                {vi.auth.nameLabel}
              </span>
              <span className="font-medium text-deep-navy">
                {customer.name?.trim() || vi.auth.nameNotUpdated}
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase text-deep-navy/50 block">
                {vi.auth.emailLabel}
              </span>
              <span className="font-medium text-deep-navy font-mono text-xs sm:text-sm break-all">
                {customer.email}
              </span>
            </div>
          </div>
        </div>

        {/* Courses, Workshops & Orders Sections */}
        <div className="md:col-span-2 space-y-6">
          {/* Lịch workshop của tôi */}
          <WorkshopSchedule workshops={eligibleWorkshops} />

          {/* Khóa học của tôi */}
          <div className="bg-white/95 rounded-2xl p-6 border border-lavender-mist shadow-sm space-y-4">
            <h2 className="font-ui text-base font-bold text-deep-navy">{vi.auth.myCourses}</h2>
            <div className="p-8 rounded-xl bg-warm-ivory/50 border border-dashed border-deep-navy/20 text-center">
              <p className="font-sans text-sm text-deep-navy/60">{vi.auth.myCoursesEmpty}</p>
            </div>
          </div>

          {/* Đơn hàng */}
          <div className="bg-white/95 rounded-2xl p-6 border border-lavender-mist shadow-sm space-y-4">
            <h2 className="font-ui text-base font-bold text-deep-navy">{vi.auth.myOrders}</h2>
            <div className="p-8 rounded-xl bg-warm-ivory/50 border border-dashed border-deep-navy/20 text-center">
              <p className="font-sans text-sm text-deep-navy/60">{vi.auth.myOrdersEmpty}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
