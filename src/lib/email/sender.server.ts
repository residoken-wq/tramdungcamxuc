import 'server-only'
import { Resend } from 'resend'
import type { EmailSender, SendEmailParams, SendEmailResult } from './types'

export const DEFAULT_EMAIL_FROM = 'TRAM DUNG CAM XUC <no-reply@tramdungcamxuc.com>'

export class ResendSender implements EmailSender {
  private client: Resend

  constructor(apiKey: string) {
    this.client = new Resend(apiKey)
  }

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    const from = params.from || process.env.EMAIL_FROM || DEFAULT_EMAIL_FROM
    const to = Array.isArray(params.to) ? params.to : [params.to]

    try {
      const response = await this.client.emails.send({
        from,
        to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      })

      if (response.error) {
        console.error('[ResendSender] Send error:', response.error)
        return {
          success: false,
          error: response.error.message,
        }
      }

      return {
        success: true,
        id: response.data?.id,
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error('[ResendSender] Exception during send:', errorMsg)
      return {
        success: false,
        error: errorMsg,
      }
    }
  }
}

export class ConsoleSender implements EmailSender {
  async send(params: SendEmailParams): Promise<SendEmailResult> {
    // REVIEW-REQUIRED: NĐ 13/2023 - ConsoleSender only logs recipient and subject to protect PII.
    const to = Array.isArray(params.to) ? params.to.join(', ') : params.to
    console.info(`[ConsoleSender] Sent email: to="${to}", subject="${params.subject}"`)
    return {
      success: true,
      id: `console-${Date.now()}`,
    }
  }
}

export function getDefaultEmailSender(): EmailSender {
  const apiKey = process.env.RESEND_API_KEY
  if (apiKey && apiKey.trim().length > 0) {
    return new ResendSender(apiKey)
  }
  return new ConsoleSender()
}
