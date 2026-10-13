import { timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import {
  ManualPaymentProvider,
  type BankConfig,
  type PaymentCreationResult,
  type PaymentOrderInput,
  type PaymentProvider,
  type WebhookParseResult,
} from './provider'
import { extractPaymentRef } from './payment-ref'

export const sepayWebhookSchema = z.object({
  id: z.union([z.number(), z.string()]).transform((val) => String(val)),
  gateway: z.string().optional().nullable(),
  transactionDate: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  subAccount: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  transferType: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  transferAmount: z.coerce.number(),
  accumulated: z.coerce.number().optional().nullable(),
  referenceCode: z.string().optional().nullable(),
})

export type SepayWebhookPayload = z.infer<typeof sepayWebhookSchema>

export interface SepayWebhookParseResult extends WebhookParseResult {
  isMoneyIn: boolean
  content?: string
  description?: string
  gateway?: string
  accountNumber?: string
  referenceCode?: string
  payload: SepayWebhookPayload
}

/**
 * REVIEW-REQUIRED: Provider thanh toán tự động qua SePay webhook.
 * - Sinh mã VietQR giống như ManualPaymentProvider (không sinh mã QR khác).
 * - Xác thực chữ ký / API key trong header qua constant-time timingSafeEqual.
 * - Bóc tách payload bằng Zod và trích xuất paymentRef từ nội dung chuyển khoản.
 */
export class SepayPaymentProvider implements PaymentProvider {
  readonly name = 'sepay'
  private readonly manualFallback = new ManualPaymentProvider()

  async createPayment(
    order: PaymentOrderInput,
    bankConfig: BankConfig,
    options?: { sandbox?: boolean },
  ): Promise<PaymentCreationResult> {
    return this.manualFallback.createPayment(order, bankConfig, options)
  }

  // REVIEW-REQUIRED: So khớp API key bằng timingSafeEqual để ngăn chặn tấn công timing attack.
  // Độ dài khác nhau trả về false (không ném lỗi). Thiếu biến môi trường -> ghi log console.error mà không in khóa.
  async verifyWebhook(req: Request | Record<string, unknown>): Promise<boolean> {
    const secret = process.env.SEPAY_WEBHOOK_API_KEY
    if (!secret || secret.trim().length === 0) {
      console.error('[Sepay] SEPAY_WEBHOOK_API_KEY is not configured')
      return false
    }

    let authHeader: string | null = null

    if (req && typeof (req as Request).headers?.get === 'function') {
      authHeader = (req as Request).headers.get('authorization')
    } else if (req && typeof req === 'object' && 'headers' in req) {
      const rawHeaders = (req as { headers?: Record<string, string> | Headers }).headers
      if (rawHeaders && typeof (rawHeaders as Headers).get === 'function') {
        authHeader = (rawHeaders as Headers).get('authorization')
      } else if (rawHeaders && typeof rawHeaders === 'object') {
        const headerObj = rawHeaders as Record<string, string>
        authHeader = headerObj['authorization'] || headerObj['Authorization'] || null
      }
    }

    if (!authHeader) return false

    let token = authHeader.trim()
    const prefixMatch = token.match(/^(?:Apikey|Bearer)\s+(.+)$/i)
    if (prefixMatch) {
      token = prefixMatch[1].trim()
    }

    const secretBuf = Buffer.from(secret.trim())
    const tokenBuf = Buffer.from(token)

    if (secretBuf.length !== tokenBuf.length) {
      return false
    }

    try {
      return timingSafeEqual(secretBuf, tokenBuf)
    } catch {
      return false
    }
  }

  async parseWebhook(
    req: Request | Record<string, unknown>,
  ): Promise<SepayWebhookParseResult> {
    let body: unknown
    if (req && typeof (req as Request).json === 'function') {
      body = await (req as Request).json()
    } else if (
      req &&
      typeof req === 'object' &&
      'body' in req &&
      typeof (req as { body?: unknown }).body === 'object'
    ) {
      body = (req as { body?: unknown }).body
    } else {
      body = req
    }

    const parsed = sepayWebhookSchema.parse(body)

    const transferType = (parsed.transferType || '').trim().toLowerCase()
    const isMoneyIn = transferType === 'in'

    // Tìm paymentRef trong cả content, description và code
    const combinedText = [parsed.content, parsed.description, parsed.code]
      .filter(Boolean)
      .join(' ')

    const ref = extractPaymentRef(combinedText) || ''

    return {
      paymentRef: ref,
      amount: parsed.transferAmount,
      transactionId: parsed.id,
      isMoneyIn,
      content: parsed.content || undefined,
      description: parsed.description || undefined,
      gateway: parsed.gateway || undefined,
      accountNumber: parsed.accountNumber || undefined,
      referenceCode: parsed.referenceCode || undefined,
      raw: body,
      payload: parsed,
    }
  }
}
