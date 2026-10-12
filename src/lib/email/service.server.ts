import 'server-only'
import { render } from '@react-email/render'
import type { Payload } from 'payload'
import React from 'react'
import { LeadConfirmationEmail } from '@/emails/LeadConfirmationEmail'
import { CoachingConfirmationEmail } from '@/emails/CoachingConfirmationEmail'
import { B2BBriefConfirmationEmail } from '@/emails/B2BBriefConfirmationEmail'
import { AdminNotificationEmail } from '@/emails/AdminNotificationEmail'
import { ResourceDeliveryEmail } from '@/emails/ResourceDeliveryEmail'
import { ExperienceOrderPaidEmail } from '@/emails/ExperienceOrderPaidEmail'
import { ExperienceOrderExpiredEmail } from '@/emails/ExperienceOrderExpiredEmail'
import { PackageOrderPaidEmail } from '@/emails/PackageOrderPaidEmail'
import { HabitPlanEmail, type HabitPlanEmailTechniqueItem } from '@/emails/HabitPlanEmail'
import { CustomerOtpEmail } from '@/emails/CustomerOtpEmail'
import { WorkshopReminderEmail } from '@/emails/WorkshopReminderEmail'
import { vi } from '@/lib/i18n/vi'
import { getDefaultEmailSender } from './sender.server'
import type { EmailSender } from './types'

interface FormContext {
  page?: string
  utm?: string
}

export async function sendLeadEmails(
  payload: Payload,
  data: {
    name: string
    email: string
    phone?: string
    need?: string
    message?: string
    interestTags?: string[]
  },
  ctx?: FormContext,
  customSender?: EmailSender,
): Promise<void> {
  const sender = customSender || getDefaultEmailSender()

  // 1. Send confirmation to user
  try {
    const userHtml = await render(
      React.createElement(LeadConfirmationEmail, {
        name: data.name,
      }),
    )
    const userText = await render(
      React.createElement(LeadConfirmationEmail, {
        name: data.name,
      }),
      { plainText: true },
    )

    await sender.send({
      to: data.email,
      subject: 'Trạm Dừng Cảm Xúc – Xác nhận thông tin tài nguyên',
      html: userHtml,
      text: userText,
    })
  } catch (err) {
    console.error('[Email] Failed to send user confirmation email for lead:', err)
  }

  // 2. Send notification to admin (Hana)
  await notifyAdmin(
    payload,
    {
      formType: 'lead',
      name: data.name,
      email: data.email,
      phone: data.phone,
      need: data.need,
      message: data.message,
      interestTags: data.interestTags,
      page: ctx?.page,
      utm: ctx?.utm,
    },
    sender,
  )
}

export async function sendCoachingEmails(
  payload: Payload,
  data: {
    name: string
    email: string
    phone?: string
    serviceName?: string
    message: string
  },
  ctx?: FormContext,
  customSender?: EmailSender,
): Promise<void> {
  const sender = customSender || getDefaultEmailSender()

  // 1. Send confirmation to user
  try {
    const userHtml = await render(
      React.createElement(CoachingConfirmationEmail, {
        name: data.name,
        serviceName: data.serviceName,
      }),
    )
    const userText = await render(
      React.createElement(CoachingConfirmationEmail, {
        name: data.name,
        serviceName: data.serviceName,
      }),
      { plainText: true },
    )

    await sender.send({
      to: data.email,
      subject: 'Trạm Dừng Cảm Xúc – Tiếp nhận yêu cầu tư vấn Coaching 1:1',
      html: userHtml,
      text: userText,
    })
  } catch (err) {
    console.error('[Email] Failed to send user confirmation email for coaching:', err)
  }

  // 2. Send notification to admin
  await notifyAdmin(
    payload,
    {
      formType: 'coaching',
      name: data.name,
      email: data.email,
      phone: data.phone,
      serviceName: data.serviceName,
      message: data.message,
      page: ctx?.page,
      utm: ctx?.utm,
    },
    sender,
  )
}

export async function sendB2BBriefEmails(
  payload: Payload,
  data: {
    name: string
    email: string
    phone?: string
    company: string
    teamSize?: string
    targetBehaviors?: string
    timeline?: string
    message?: string
  },
  ctx?: FormContext,
  customSender?: EmailSender,
): Promise<void> {
  const sender = customSender || getDefaultEmailSender()

  // 1. Send confirmation to user
  try {
    const userHtml = await render(
      React.createElement(B2BBriefConfirmationEmail, {
        name: data.name,
        company: data.company,
        teamSize: data.teamSize,
        timeline: data.timeline,
      }),
    )
    const userText = await render(
      React.createElement(B2BBriefConfirmationEmail, {
        name: data.name,
        company: data.company,
        teamSize: data.teamSize,
        timeline: data.timeline,
      }),
      { plainText: true },
    )

    await sender.send({
      to: data.email,
      subject: 'Trạm Dừng Cảm Xúc – Xác nhận yêu cầu tư vấn doanh nghiệp',
      html: userHtml,
      text: userText,
    })
  } catch (err) {
    console.error('[Email] Failed to send user confirmation email for B2B:', err)
  }

  // 2. Send notification to admin
  await notifyAdmin(
    payload,
    {
      formType: 'b2b',
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      teamSize: data.teamSize,
      targetBehaviors: data.targetBehaviors,
      timeline: data.timeline,
      message: data.message,
      page: ctx?.page,
      utm: ctx?.utm,
    },
    sender,
  )
}

export async function sendResourceDeliveryEmail(
  payload: Payload,
  data: {
    name: string
    email: string
    productName: string
    files: { filename: string; downloadUrl: string }[]
    expiresAtFormatted?: string
  },
  customSender?: EmailSender,
): Promise<void> {
  const sender = customSender || getDefaultEmailSender()

  try {
    const userHtml = await render(
      React.createElement(ResourceDeliveryEmail, {
        name: data.name,
        productName: data.productName,
        files: data.files,
        expiresAtFormatted: data.expiresAtFormatted,
      }),
    )
    const userText = await render(
      React.createElement(ResourceDeliveryEmail, {
        name: data.name,
        productName: data.productName,
        files: data.files,
        expiresAtFormatted: data.expiresAtFormatted,
      }),
      { plainText: true },
    )

    await sender.send({
      to: data.email,
      subject: `Trạm Dừng Cảm Xúc – Tài liệu miễn phí: ${data.productName}`,
      html: userHtml,
      text: userText,
    })
  } catch (err) {
    console.error('[Email] Failed to send resource delivery email:', err)
  }
}

async function notifyAdmin(
  payload: Payload,
  data: {
    formType: 'lead' | 'coaching' | 'b2b'
    name: string
    email: string
    phone?: string
    need?: string
    message?: string
    serviceName?: string
    company?: string
    teamSize?: string
    targetBehaviors?: string
    timeline?: string
    interestTags?: string[]
    page?: string
    utm?: string
  },
  sender: EmailSender,
): Promise<void> {
  try {
    const siteSettings = await payload.findGlobal({
      slug: 'siteSettings',
    })

    const adminEmail = siteSettings?.email
    if (!adminEmail || adminEmail.trim().length === 0) {
      console.warn('[Email] siteSettings.email is not configured, skipping admin notification')
      return
    }

    const adminHtml = await render(React.createElement(AdminNotificationEmail, data))
    const adminText = await render(React.createElement(AdminNotificationEmail, data), {
      plainText: true,
    })

    const formLabels = {
      lead: 'Lead',
      coaching: 'Coaching',
      b2b: 'B2B',
    }

    await sender.send({
      to: adminEmail,
      subject: `[TDCX] Khách tiềm năng mới: ${formLabels[data.formType]} - ${data.name || data.email}`,
      html: adminHtml,
      text: adminText,
    })
  } catch (err) {
    console.error('[Email] Failed to notify admin:', err)
  }
}

export async function sendExperienceOrderPaidEmail(
  payload: Payload,
  data: {
    name: string
    email: string
    paymentRef: string
    amount: number
    bookingUrl?: string | null
  },
  customSender?: EmailSender,
): Promise<void> {
  const sender = customSender || getDefaultEmailSender()

  try {
    const userHtml = await render(
      React.createElement(ExperienceOrderPaidEmail, {
        name: data.name,
        paymentRef: data.paymentRef,
        amount: data.amount,
        bookingUrl: data.bookingUrl,
      }),
    )
    const userText = await render(
      React.createElement(ExperienceOrderPaidEmail, {
        name: data.name,
        paymentRef: data.paymentRef,
        amount: data.amount,
        bookingUrl: data.bookingUrl,
      }),
      { plainText: true },
    )

    await sender.send({
      to: data.email,
      subject: 'Trạm Dừng Cảm Xúc – Xác nhận thanh toán & Link đặt lịch phiên trải nghiệm',
      html: userHtml,
      text: userText,
    })
  } catch (err) {
    console.error('[Email] Failed to send experience order paid email:', err)
    throw err
  }
}

export async function sendOrderExpiredReminderEmail(
  payload: Payload,
  data: {
    name: string
    email: string
  },
  customSender?: EmailSender,
): Promise<void> {
  const sender = customSender || getDefaultEmailSender()

  try {
    const userHtml = await render(
      React.createElement(ExperienceOrderExpiredEmail, {
        name: data.name,
      }),
    )
    const userText = await render(
      React.createElement(ExperienceOrderExpiredEmail, {
        name: data.name,
      }),
      { plainText: true },
    )

    await sender.send({
      to: data.email,
      subject: 'Trạm Dừng Cảm Xúc – Nhắc hẹn phiên trải nghiệm Growth Mirror',
      html: userHtml,
      text: userText,
    })
  } catch (err) {
    console.error('[Email] Failed to send order expired reminder email:', err)
  }
}

export async function sendPackageOrderPaidEmail(
  payload: Payload,
  data: {
    name: string
    email: string
    paymentRef: string
    amount: number
    packageName: string
    components?: Array<{ label: string; quantity?: number | null }>
    hasDigitalTools?: boolean
    toolsUrl?: string
    coachingBookingUrl?: string | null
    upcomingWorkshops?: Array<{ title: string; timeString: string }>
    communityZaloUrl?: string | null
  },
  customSender?: EmailSender,
): Promise<void> {
  const sender = customSender || getDefaultEmailSender()

  try {
    const userHtml = await render(
      React.createElement(PackageOrderPaidEmail, {
        name: data.name,
        paymentRef: data.paymentRef,
        amount: data.amount,
        packageName: data.packageName,
        components: data.components,
        hasDigitalTools: data.hasDigitalTools,
        toolsUrl: data.toolsUrl,
        coachingBookingUrl: data.coachingBookingUrl,
        upcomingWorkshops: data.upcomingWorkshops,
        communityZaloUrl: data.communityZaloUrl,
      }),
    )
    const userText = await render(
      React.createElement(PackageOrderPaidEmail, {
        name: data.name,
        paymentRef: data.paymentRef,
        amount: data.amount,
        packageName: data.packageName,
        components: data.components,
        hasDigitalTools: data.hasDigitalTools,
        toolsUrl: data.toolsUrl,
        coachingBookingUrl: data.coachingBookingUrl,
        upcomingWorkshops: data.upcomingWorkshops,
        communityZaloUrl: data.communityZaloUrl,
      }),
      { plainText: true },
    )

    await sender.send({
      to: data.email,
      subject: vi.payment.email.packagePaid.subject(data.packageName),
      html: userHtml,
      text: userText,
    })
  } catch (err) {
    console.error('[Email] Failed to send package order paid email:', err)
    throw err
  }
}

export async function sendCustomerOtpEmail(
  payload: Payload,
  data: {
    email: string
    code: string
  },
  customSender?: EmailSender,
): Promise<void> {
  const sender = customSender || getDefaultEmailSender()

  try {
    const userHtml = await render(
      React.createElement(CustomerOtpEmail, {
        email: data.email,
        code: data.code,
      }),
    )
    const userText = await render(
      React.createElement(CustomerOtpEmail, {
        email: data.email,
        code: data.code,
      }),
      { plainText: true },
    )

    await sender.send({
      to: data.email,
      subject: vi.auth.otpEmailSubject,
      html: userHtml,
      text: userText,
    })
  } catch (err) {
    console.error('[Email] Failed to send customer OTP email:', err)
    // Non-fatal error logging, let caller proceed or handle
  }
}

export async function sendWorkshopReminderEmail(
  payload: Payload,
  data: {
    name: string
    email: string
    workshopTitle: string
    workshopTimeFormatted: string
    accountUrl?: string
  },
  customSender?: EmailSender,
): Promise<void> {
  const sender = customSender || getDefaultEmailSender()

  try {
    const userHtml = await render(
      React.createElement(WorkshopReminderEmail, {
        name: data.name,
        workshopTitle: data.workshopTitle,
        workshopTimeFormatted: data.workshopTimeFormatted,
        accountUrl: data.accountUrl,
      }),
    )
    const userText = await render(
      React.createElement(WorkshopReminderEmail, {
        name: data.name,
        workshopTitle: data.workshopTitle,
        workshopTimeFormatted: data.workshopTimeFormatted,
        accountUrl: data.accountUrl,
      }),
      { plainText: true },
    )

    await sender.send({
      to: data.email,
      subject: vi.workshop.reminderEmail.subject(data.workshopTitle),
      html: userHtml,
      text: userText,
    })
  } catch (err) {
    console.error('[Email] Failed to send workshop reminder email:', err)
    throw err
  }
}

export async function sendHabitPlanEmail(
  data: {
    email: string
    name?: string
    identityStatement: string
    techniques: HabitPlanEmailTechniqueItem[]
    zaloGroupUrl?: string
    revisitUrl?: string
  },
  customSender?: EmailSender,
): Promise<void> {
  const sender = customSender || getDefaultEmailSender()

  try {
    const userHtml = await render(
      React.createElement(HabitPlanEmail, {
        name: data.name,
        identityStatement: data.identityStatement,
        techniques: data.techniques,
        zaloGroupUrl: data.zaloGroupUrl,
        revisitUrl: data.revisitUrl,
      }),
    )
    const userText = await render(
      React.createElement(HabitPlanEmail, {
        name: data.name,
        identityStatement: data.identityStatement,
        techniques: data.techniques,
        zaloGroupUrl: data.zaloGroupUrl,
        revisitUrl: data.revisitUrl,
      }),
      { plainText: true },
    )

    await sender.send({
      to: data.email,
      subject: 'Trạm Dừng Cảm Xúc – Kế hoạch Habit Loop 5 phút của bạn',
      html: userHtml,
      text: userText,
    })
  } catch (err) {
    console.error('[Email] Failed to send habit plan email:', err)
    // Lỗi gửi email không làm hỏng việc lưu kế hoạch của học viên
  }
}
