import 'server-only'
import { render } from '@react-email/render'
import type { Payload } from 'payload'
import React from 'react'
import { LeadConfirmationEmail } from '@/emails/LeadConfirmationEmail'
import { CoachingConfirmationEmail } from '@/emails/CoachingConfirmationEmail'
import { B2BBriefConfirmationEmail } from '@/emails/B2BBriefConfirmationEmail'
import { AdminNotificationEmail } from '@/emails/AdminNotificationEmail'
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
