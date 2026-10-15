import fs from 'node:fs'
import path from 'node:path'
import type { Payload } from 'payload'
import { z } from 'zod'
import { EQ_BUDDY_PRODUCT_SLUG } from '../../src/lib/eq/config'

export const eqCardInputSchema = z.object({
  code: z
    .string({ required_error: 'Mã thẻ là bắt buộc' })
    .trim()
    .min(1, 'Mã thẻ không được rỗng'),
  keywordEn: z
    .string({ required_error: 'Từ khóa tiếng Anh là bắt buộc' })
    .trim()
    .min(1, 'Từ khóa tiếng Anh không được rỗng')
    .max(40, 'Từ khóa tiếng Anh không được vượt quá 40 ký tự'),
  qrSlug: z
    .string({ required_error: 'Mã QR là bắt buộc' })
    .trim()
    .regex(/^[a-z0-9-]+$/, 'Mã QR chỉ dùng chữ thường không dấu, số và dấu -'),
  order: z.number().int().optional(),
  message: z
    .string({ required_error: 'Thông điệp là bắt buộc' })
    .trim()
    .min(1, 'Thông điệp không được rỗng'),
  promptRecall: z
    .string({ required_error: 'Câu hỏi gợi nhớ là bắt buộc' })
    .trim()
    .min(1, 'Câu hỏi gợi nhớ không được rỗng'),
  promptPack: z
    .string({ required_error: 'Câu hỏi gói ghém là bắt buộc' })
    .trim()
    .min(1, 'Câu hỏi gói ghém không được rỗng'),
  promptAcknowledge: z
    .string({ required_error: 'Câu hỏi ghi nhận là bắt buộc' })
    .trim()
    .min(1, 'Câu hỏi ghi nhận không được rỗng'),
})

export type EqCardInput = z.infer<typeof eqCardInputSchema>

export interface EqImportReport {
  created: number
  updated: number
  skipped: number
  samplesRemoved: number
}

/**
 * Kiểm tra xem một đường dẫn file có nằm bên trong repo hay không.
 * Chặn file nằm trong repo để bảo vệ nội dung thương mại thẻ in.
 */
export function isPathInsideRepo(filePath: string, repoRoot: string = process.cwd()): boolean {
  const resolvedPath = path.resolve(filePath).toLowerCase()
  const resolvedRoot = path.resolve(repoRoot).toLowerCase()
  return (
    resolvedPath === resolvedRoot ||
    resolvedPath.startsWith(resolvedRoot + path.sep) ||
    resolvedPath.startsWith(resolvedRoot + '/')
  )
}

/**
 * Xác thực biến môi trường EQ_CARDS_FILE:
 * - Không được thiếu hoặc rỗng
 * - Không được trỏ vào trong thư mục repo
 * - File phải tồn tại trên ổ đĩa
 */
export function validateEqCardsFilePath(
  filePath: string | undefined,
  repoRoot: string = process.cwd(),
): string {
  if (!filePath || filePath.trim().length === 0) {
    throw new Error('Vui lòng chỉ định đường dẫn file JSON qua biến môi trường EQ_CARDS_FILE.')
  }
  const resolved = path.resolve(filePath)
  if (isPathInsideRepo(resolved, repoRoot)) {
    throw new Error(
      'File dữ liệu thẻ EQ không được nằm bên trong thư mục repo (để bảo vệ dữ liệu thương mại). Vui lòng đặt file ngoài thư mục dự án.',
    )
  }
  if (!fs.existsSync(resolved)) {
    throw new Error(`Không tìm thấy file tại đường dẫn: ${resolved}`)
  }
  return resolved
}

/**
 * Kiểm tra tính hợp lệ của mảng thẻ EQ bằng Zod và đảm bảo mã thẻ là duy nhất.
 */
export function validateEqCardsData(raw: unknown): EqCardInput[] {
  if (!Array.isArray(raw)) {
    throw new Error('Dữ liệu file JSON phải là một mảng các thẻ EQ.')
  }

  const parsed = z.array(eqCardInputSchema).safeParse(raw)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `[${i.path.join('.')}] ${i.message}`)
      .join('; ')
    throw new Error(`Dữ liệu thẻ EQ không hợp lệ: ${issues}`)
  }

  const codes = new Set<string>()
  for (const card of parsed.data) {
    if (codes.has(card.code)) {
      throw new Error(`Mã thẻ "${card.code}" bị trùng lặp trong dữ liệu nhập.`)
    }
    codes.add(card.code)
  }

  return parsed.data
}

/**
 * Nhập danh sách thẻ EQ thật vào database:
 * - Xác thực Zod (nếu lỗi, in dòng lỗi và không ghi gì vào DB)
 * - Tìm theo mã code: chưa có -> tạo mới (isSample = false, _status = 'published')
 * - Đã có -> cập nhật nội dung chữ, KHÔNG đổi qrSlug nếu thẻ đã có printedAt (khác -> báo và bỏ qua)
 * - Xóa thẻ MẪU (isSample = true) sau khi nhập thành công
 * - An toàn khi chạy lại nhiều lần (không tạo trùng)
 */
export async function importEqCards(payload: Payload, rawCards: unknown): Promise<EqImportReport> {
  const cards = validateEqCardsData(rawCards)

  let relatedProductId: number | undefined
  try {
    const productRes = await payload.find({
      collection: 'products',
      where: { slug: { equals: EQ_BUDDY_PRODUCT_SLUG } },
      limit: 1,
      depth: 0,
      draft: true,
    })
    if (productRes.docs.length > 0) {
      relatedProductId = productRes.docs[0].id
    }
  } catch {
    // Không tìm thấy sản phẩm, tiếp tục không gán
  }

  let created = 0
  let updated = 0
  let skipped = 0
  let samplesRemoved = 0

  for (const card of cards) {
    const existingRes = await payload.find({
      collection: 'eqCards',
      where: { code: { equals: card.code } },
      limit: 1,
      depth: 0,
      draft: true,
    })

    const found = existingRes.docs[0] as
      | {
          id: number
          code: string
          qrSlug: string
          printedAt?: string | null
          order?: number | null
          relatedProduct?: unknown
        }
      | undefined

    if (!found) {
      await payload.create({
        collection: 'eqCards',
        data: {
          code: card.code,
          keywordEn: card.keywordEn,
          qrSlug: card.qrSlug,
          order: card.order ?? 0,
          message: card.message,
          promptRecall: card.promptRecall,
          promptPack: card.promptPack,
          promptAcknowledge: card.promptAcknowledge,
          ...(relatedProductId ? { relatedProduct: relatedProductId } : {}),
          isSample: false,
          _status: 'published',
        },
      })
      created++
    } else {
      if (found.printedAt && card.qrSlug !== found.qrSlug) {
        console.warn(
          `[BỎ QUA] Thẻ ${card.code} đã in ngày ${found.printedAt}, không thể đổi mã QR từ "${found.qrSlug}" sang "${card.qrSlug}".`,
        )
        skipped++
        continue
      }

      await payload.update({
        collection: 'eqCards',
        id: found.id,
        data: {
          keywordEn: card.keywordEn,
          message: card.message,
          promptRecall: card.promptRecall,
          promptPack: card.promptPack,
          promptAcknowledge: card.promptAcknowledge,
          ...(card.order !== undefined ? { order: card.order } : {}),
          ...(found.printedAt ? {} : { qrSlug: card.qrSlug }),
          ...(relatedProductId && !found.relatedProduct
            ? { relatedProduct: relatedProductId }
            : {}),
        },
      })
      updated++
    }
  }

  // Xóa thẻ MẪU sau khi nhập thành công thẻ thật
  const samplesRes = await payload.find({
    collection: 'eqCards',
    where: { isSample: { equals: true } },
    limit: 1000,
    depth: 0,
    draft: true,
    pagination: false,
  })

  for (const sample of samplesRes.docs as { id: number }[]) {
    await payload.delete({ collection: 'eqCards', id: sample.id })
    samplesRemoved++
  }

  return { created, updated, skipped, samplesRemoved }
}
