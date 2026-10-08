import {
  assertValidBankConfig,
  buildVietQrPayload,
  generateVietQrSvg,
  type BankConfig,
} from './vietqr'

export interface PaymentOrderInput {
  id?: number | string
  paymentRef: string
  total: number
  payToken?: string | null
  items?: Array<{
    product?: number | { id: number; name?: string; title?: string } | null
    price?: number
  }>
}

export interface BankAccountInfo {
  bankBin: string
  bankName?: string
  accountNumber: string
  accountName: string
  transferPrefix?: string
}

export interface PaymentCreationResult {
  paymentRef: string
  amount: number
  bankInfo: BankAccountInfo
  qrPayload: string
  qrSvg: string
  sandbox: boolean
  orderSummary?: string
}

export interface WebhookParseResult {
  paymentRef: string
  amount: number
  transactionId?: string
  raw?: unknown
}

export interface PaymentProvider {
  readonly name: string
  createPayment(
    order: PaymentOrderInput,
    bankInfo: BankConfig,
    options?: { sandbox?: boolean },
  ): Promise<PaymentCreationResult>
  verifyWebhook(req: Request | Record<string, unknown>): Promise<boolean>
  parseWebhook(req: Request | Record<string, unknown>): Promise<WebhookParseResult>
}

/**
 * Provider thanh toán thủ công áp dụng cho Giai đoạn 1.
 * - Trả về chuỗi VietQR và ảnh QR SVG kèm thông tin chuyển khoản.
 * - Webhook ném lỗi vì chưa hỗ trợ tự động ở Giai đoạn 1.
 */
export class ManualPaymentProvider implements PaymentProvider {
  readonly name = 'manual'

  async createPayment(
    order: PaymentOrderInput,
    bankConfig: BankConfig,
    options?: { sandbox?: boolean },
  ): Promise<PaymentCreationResult> {
    assertValidBankConfig(bankConfig)

    const isSandbox = options?.sandbox ?? process.env.PAYMENT_SANDBOX === 'true'

    const qrPayload = buildVietQrPayload({
      bin: bankConfig.bankBin,
      accountNumber: bankConfig.accountNumber,
      amount: order.total,
      addInfo: order.paymentRef,
    })

    const qrSvg = await generateVietQrSvg(qrPayload)

    return {
      paymentRef: order.paymentRef,
      amount: order.total,
      bankInfo: {
        bankBin: bankConfig.bankBin,
        bankName: bankConfig.bankName || undefined,
        accountNumber: bankConfig.accountNumber,
        accountName: bankConfig.accountName,
        transferPrefix: bankConfig.transferPrefix || 'TDCX',
      },
      qrPayload,
      qrSvg,
      sandbox: isSandbox,
    }
  }

  async verifyWebhook(_req: Request | Record<string, unknown>): Promise<boolean> {
    throw new Error(
      'Chức năng xác thực webhook chưa được hỗ trợ trong Giai đoạn 1 (chế độ chuyển khoản thủ công).',
    )
  }

  async parseWebhook(_req: Request | Record<string, unknown>): Promise<WebhookParseResult> {
    throw new Error(
      'Chức năng phân tích webhook chưa được hỗ trợ trong Giai đoạn 1 (chế độ chuyển khoản thủ công).',
    )
  }
}

/**
 * Trả về provider thanh toán tương ứng dựa theo biến môi trường PAYMENT_PROVIDER (mặc định là 'manual').
 * Đảm bảo luồng thanh toán không bị phụ thuộc cứng vào bất kỳ cổng cụ thể nào.
 */
export function getPaymentProvider(name?: string): PaymentProvider {
  const providerName = name || process.env.PAYMENT_PROVIDER || 'manual'
  if (providerName === 'manual') {
    return new ManualPaymentProvider()
  }
  throw new Error(`Cổng thanh toán "${providerName}" chưa được hỗ trợ trong hệ thống.`)
}
