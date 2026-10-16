import React from 'react'
import type { Metadata } from 'next'
import { verifyReminderOptOutToken } from '@/lib/reminders/token'
import { vi } from '@/lib/i18n/vi'
import { OptOutForm } from './OptOutForm'

export const metadata: Metadata = {
  title: vi.reminders.optOut.pageTitle,
  robots: {
    index: false,
    follow: false,
  },
}

interface OptOutPageProps {
  searchParams: Promise<{
    t?: string
  }>
}

export default async function ReminderOptOutPage({ searchParams }: OptOutPageProps) {
  const { t: token } = await searchParams
  // REVIEW-REQUIRED: Xác thực token ở GET nhưng KHÔNG thay đổi dữ liệu trong CSDL ở bước GET
  // để bảo vệ người dùng trước các bộ quét link (link-prefetch/security scanners) trong email.
  const customerId = verifyReminderOptOutToken(token)
  const isValid = Boolean(customerId)

  return (
    <div className="py-12 sm:py-20 px-4 sm:px-6 max-w-xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-bright-magenta">
          {vi.reminders.optOut.eyebrow}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl text-deep-navy">
          {vi.reminders.optOut.heading}
        </h1>
      </div>

      <OptOutForm token={token || ''} initialValid={isValid} />
    </div>
  )
}
