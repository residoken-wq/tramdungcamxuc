'use server'

import { getPayload } from 'payload'
import { z } from 'zod'
import config from '@/payload.config'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { signDownloadToken } from '@/lib/downloads/token'
import { vi } from '@/lib/i18n/vi'
import { findOwnPaidOrderFile } from './order-files.server'

const DOWNLOAD_LINK_TTL_MS = 10 * 60 * 1000

const inputSchema = z.object({
  orderId: z.number().int().positive(),
  fileId: z.number().int().positive(),
})

export type RequestOrderFileDownloadResult =
  { ok: true; url: string } | { ok: false; message: string }

/**
 * REVIEW-REQUIRED: Sinh link tải lại file đã mua (hạn 10 phút) cho khách trong phiên.
 * Khách lấy từ cookie phiên, không nhận từ client; đơn phải của chính khách và đã thanh toán.
 */
export async function requestOrderFileDownloadAction(
  input: unknown,
): Promise<RequestOrderFileDownloadResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: vi.account.orders.downloadUnavailable }

  const payload = await getPayload({ config })
  const customer = await getCurrentCustomer(payload)
  if (!customer) return { ok: false, message: vi.account.orders.downloadLoginRequired }

  const match = await findOwnPaidOrderFile(payload, {
    customerId: customer.id,
    orderId: parsed.data.orderId,
    fileId: parsed.data.fileId,
  })
  if (!match) return { ok: false, message: vi.account.orders.downloadUnavailable }

  const token = signDownloadToken({
    productId: match.productId,
    fileId: match.fileId,
    orderId: parsed.data.orderId,
    customerId: customer.id,
    expiresAt: Date.now() + DOWNLOAD_LINK_TTL_MS,
  })
  return { ok: true, url: `/api/download/${token}` }
}
