import type { BankConfig } from './vietqr'

export type { BankConfig }

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
