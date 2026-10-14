import { assertValidBankConfig, buildVietQrPayload, generateVietQrSvg } from './vietqr'
import {
  type BankAccountInfo,
  type BankConfig,
  type PaymentCreationResult,
  type PaymentOrderInput,
  type PaymentProvider,
  type WebhookParseResult,
} from './types'
import { SepayPaymentProvider } from './sepay'

export type {
  BankAccountInfo,
  BankConfig,
  PaymentCreationResult,
  PaymentOrderInput,
  PaymentProvider,
  WebhookParseResult,
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

let hasWarnedInvalidProvider = false

/**
 * Trả về provider thanh toán tương ứng dựa theo biến môi trường PAYMENT_PROVIDER (mặc định là 'manual').
 * Đảm bảo luồng thanh toán không bị phụ thuộc cứng vào bất kỳ cổng cụ thể nào.
 * - Nếu tham số name được truyền rõ ràng: trả về provider tương ứng hoặc ném lỗi nếu không hỗ trợ.
 * - Nếu đọc từ biến môi trường: giá trị lạ sẽ console.warn 1 lần và fallback về 'manual'.
 */
export function getPaymentProvider(name?: string): PaymentProvider {
  if (name !== undefined) {
    const normalizedName = name.trim().toLowerCase()
    if (normalizedName === 'manual') {
      return new ManualPaymentProvider()
    }
    if (normalizedName === 'sepay') {
      return new SepayPaymentProvider()
    }
    throw new Error(`Cổng thanh toán "${name}" chưa được hỗ trợ trong hệ thống.`)
  }

  const rawEnv = process.env.PAYMENT_PROVIDER || 'manual'
  const normalizedEnv = normalizePaymentProviderEnv()

  if (normalizedEnv === 'manual') {
    return new ManualPaymentProvider()
  }
  if (normalizedEnv === 'sepay') {
    return new SepayPaymentProvider()
  }

  if (!hasWarnedInvalidProvider) {
    console.warn(`[payment] Cổng thanh toán "${rawEnv}" không hợp lệ, chuyển về chế độ "manual".`)
    hasWarnedInvalidProvider = true
  }
  return new ManualPaymentProvider()
}

function normalizePaymentProviderEnv(): string {
  return (process.env.PAYMENT_PROVIDER || 'manual').trim().toLowerCase()
}

/** Chế độ SePay đang bật (cùng cách chuẩn hóa với getPaymentProvider: không phân biệt hoa thường). */
export function isSepayMode(): boolean {
  return normalizePaymentProviderEnv() === 'sepay'
}
