import fs from 'node:fs'
import path from 'node:path'
import type { Payload, PayloadRequest } from 'payload'
import { z } from 'zod'
import { EQ_BUDDY_PRODUCT_SLUG } from '../../src/lib/eq/config'

export const eqCardInputSchema = z.object({
  code: z.string({ required_error: 'Mã thẻ là bắt buộc' }).trim().min(1, 'Mã thẻ không được rỗng'),
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
  // Resolve symlinks on both sides so a link outside the repo pointing inside it is caught.
  const real = (p: string) => {
    const resolved = path.resolve(p)
    try {
      return fs.realpathSync(resolved)
    } catch {
      return resolved
    }
  }
  const resolvedPath = real(filePath)
  const resolvedRoot = real(repoRoot)
  const rel = path.relative(resolvedRoot, resolvedPath)
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))
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

  const parsed = z.array(eqCardInputSchema).min(1, 'File không có thẻ nào.').safeParse(raw)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `[${i.path.join('.')}] ${i.message}`).join('; ')
    throw new Error(`Dữ liệu thẻ EQ không hợp lệ: ${issues}`)
  }

  const codes = new Set<string>()
  const slugs = new Set<string>()
  for (const card of parsed.data) {
    if (codes.has(card.code)) {
      throw new Error(`Mã thẻ "${card.code}" bị trùng lặp trong dữ liệu nhập.`)
    }
    if (slugs.has(card.qrSlug)) {
      throw new Error(`Mã QR "${card.qrSlug}" bị trùng lặp trong dữ liệu nhập.`)
    }
    codes.add(card.code)
    slugs.add(card.qrSlug)
  }

  return parsed.data
}

export interface EqImportOptions {
  /** Delete every sample (isSample) card after a successful import. Tests pass false. */
  deleteSamples?: boolean
}

/**
 * Imports the real cards in ONE transaction: any error rolls everything back (no partial import).
 * - Validates first (Zod, unique code + qrSlug, non-empty).
 * - Upsert by code; always published, isSample false.
 * - A printed card keeps its qrSlug: a different slug in the file -> that card is skipped.
 * - A qrSlug already used by another card -> error before writing.
 * - Sample cards are removed only when at least one real card was created or updated.
 */
export async function importEqCards(
  payload: Payload,
  rawCards: unknown,
  options: EqImportOptions = {},
): Promise<EqImportReport> {
  const cards = validateEqCardsData(rawCards)
  const deleteSamples = options.deleteSamples ?? true

  const transactionID = await payload.db.beginTransaction()
  if (!transactionID) throw new Error('Không mở được giao dịch DB để nhập thẻ.')
  const req = { transactionID } as unknown as PayloadRequest

  try {
    const productRes = await payload.find({
      collection: 'products',
      where: { slug: { equals: EQ_BUDDY_PRODUCT_SLUG } },
      limit: 1,
      depth: 0,
      draft: true,
      req,
    })
    const relatedProductId = productRes.docs[0]?.id as number | undefined

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
        req,
      })
      const found = existingRes.docs[0] as
        | { id: number; qrSlug: string; printedAt?: string | null; relatedProduct?: unknown }
        | undefined

      if (found?.printedAt && card.qrSlug !== found.qrSlug) {
        console.warn(
          `[BỎ QUA] Thẻ ${card.code} đã in, không đổi mã QR "${found.qrSlug}" sang "${card.qrSlug}".`,
        )
        skipped++
        continue
      }

      const slugOwner = await payload.find({
        collection: 'eqCards',
        where: { qrSlug: { equals: card.qrSlug } },
        limit: 1,
        depth: 0,
        draft: true,
        req,
      })
      const owner = slugOwner.docs[0] as { id: number; code: string } | undefined
      if (owner && owner.id !== found?.id) {
        throw new Error(`Mã QR "${card.qrSlug}" đang thuộc thẻ ${owner.code}.`)
      }

      const content = {
        keywordEn: card.keywordEn,
        message: card.message,
        promptRecall: card.promptRecall,
        promptPack: card.promptPack,
        promptAcknowledge: card.promptAcknowledge,
        isSample: false,
        _status: 'published' as const,
      }

      if (!found) {
        await payload.create({
          collection: 'eqCards',
          data: {
            ...content,
            code: card.code,
            qrSlug: card.qrSlug,
            order: card.order ?? 0,
            ...(relatedProductId ? { relatedProduct: relatedProductId } : {}),
          },
          draft: false,
          req,
        })
        created++
      } else {
        await payload.update({
          collection: 'eqCards',
          id: found.id,
          data: {
            ...content,
            ...(card.order !== undefined ? { order: card.order } : {}),
            ...(found.printedAt ? {} : { qrSlug: card.qrSlug }),
            ...(relatedProductId && !found.relatedProduct
              ? { relatedProduct: relatedProductId }
              : {}),
          },
          draft: false,
          req,
        })
        updated++
      }
    }

    if (deleteSamples && created + updated > 0) {
      const res = await payload.delete({
        collection: 'eqCards',
        where: { isSample: { equals: true } },
        req,
      })
      if (res.errors?.length) throw new Error('Không xóa được thẻ MẪU.')
      samplesRemoved = res.docs.length
    }

    await payload.db.commitTransaction(transactionID)
    return { created, updated, skipped, samplesRemoved }
  } catch (err) {
    await payload.db.rollbackTransaction(transactionID)
    throw err
  }
}
