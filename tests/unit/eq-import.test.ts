// @vitest-environment node
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '../../src/payload.config'
import {
  importEqCards,
  isPathInsideRepo,
  validateEqCardsData,
  validateEqCardsFilePath,
  type EqCardInput,
} from '../../seed/import/eq-cards'

describe('EQ Cards import logic and validation', () => {
  let payload: Payload
  const created: { collection: CollectionSlug; id: number }[] = []
  const unique = () => `test-${randomUUID().slice(0, 8)}`
  const track = (collection: CollectionSlug, doc: { id: number }) => {
    created.push({ collection, id: doc.id })
    return doc.id
  }

  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  afterAll(async () => {
    for (const item of created.reverse()) {
      try {
        await payload.delete({ collection: item.collection, id: item.id })
      } catch {
        // Bỏ qua lỗi nếu bản ghi đã xóa
      }
    }
  })

  describe('Kiểm tra an toàn đường dẫn file (path inside repo guard)', () => {
    it('nhận diện chính xác file nằm trong repo và ngoài repo', () => {
      const repoRoot = process.cwd()

      // Nằm trong repo
      expect(isPathInsideRepo(path.join(repoRoot, 'cards.json'), repoRoot)).toBe(true)
      expect(isPathInsideRepo(path.join(repoRoot, 'seed', 'cards.json'), repoRoot)).toBe(true)
      expect(isPathInsideRepo(path.join(repoRoot, 'src', 'data', 'cards.json'), repoRoot)).toBe(
        true,
      )

      // Nằm ngoài repo
      expect(isPathInsideRepo(path.join(repoRoot, '..', 'cards.json'), repoRoot)).toBe(false)
      expect(isPathInsideRepo('C:\\temp\\eq-cards.json', 'C:\\projects\\my-repo')).toBe(false)
      expect(isPathInsideRepo('/tmp/eq-cards.json', '/var/www/my-repo')).toBe(false)
    })

    it('từ chối biến môi trường rỗng hoặc file nằm trong repo hoặc file không tồn tại', () => {
      // Rỗng / undefined
      expect(() => validateEqCardsFilePath(undefined)).toThrow(
        'Vui lòng chỉ định đường dẫn file JSON qua biến môi trường EQ_CARDS_FILE.',
      )
      expect(() => validateEqCardsFilePath('   ')).toThrow(
        'Vui lòng chỉ định đường dẫn file JSON qua biến môi trường EQ_CARDS_FILE.',
      )

      // File nằm trong repo
      expect(() =>
        validateEqCardsFilePath(path.join(process.cwd(), 'package.json'), process.cwd()),
      ).toThrow(
        'File dữ liệu thẻ EQ không được nằm bên trong thư mục repo (để bảo vệ dữ liệu thương mại).',
      )

      // File không tồn tại (ở ngoài repo)
      const nonExistentPath = path.resolve(
        process.cwd(),
        '..',
        'non-existent-cards-file-12345.json',
      )
      expect(() => validateEqCardsFilePath(nonExistentPath, process.cwd())).toThrow(
        'Không tìm thấy file tại đường dẫn',
      )
    })
  })

  describe('Xác thực dữ liệu thẻ bằng Zod (validateEqCardsData)', () => {
    it('chấp nhận mảng thẻ hợp lệ', () => {
      const validCards: EqCardInput[] = [
        {
          code: 'TDCX-01',
          keywordEn: 'Abundance',
          qrSlug: 'abundance',
          order: 1,
          message: 'Thông điệp 1',
          promptRecall: 'Gợi nhớ 1',
          promptPack: 'Gói ghém 1',
          promptAcknowledge: 'Ghi nhận 1',
        },
        {
          code: 'TDCX-02',
          keywordEn: 'Belonging',
          qrSlug: 'belonging',
          order: 2,
          message: 'Thông điệp 2',
          promptRecall: 'Gợi nhớ 2',
          promptPack: 'Gói ghém 2',
          promptAcknowledge: 'Ghi nhận 2',
        },
      ]

      const parsed = validateEqCardsData(validCards)
      expect(parsed).toHaveLength(2)
      expect(parsed[0].code).toBe('TDCX-01')
      expect(parsed[1].code).toBe('TDCX-02')
    })

    it('từ chối nếu dữ liệu không phải là mảng', () => {
      expect(() => validateEqCardsData({ code: 'TDCX-01' })).toThrow(
        'Dữ liệu file JSON phải là một mảng các thẻ EQ.',
      )
    })

    it('từ chối nếu thiếu 1 trong 3 câu hỏi suy ngẫm', () => {
      const invalid = [
        {
          code: 'TDCX-01',
          keywordEn: 'Abundance',
          qrSlug: 'abundance',
          message: 'Thông điệp',
          promptRecall: 'Gợi nhớ',
          promptPack: 'Gói ghém',
          // Thiếu promptAcknowledge
        },
      ]
      expect(() => validateEqCardsData(invalid)).toThrow('Dữ liệu thẻ EQ không hợp lệ')
    })

    it('từ chối nếu qrSlug chứa chữ hoa hoặc ký tự không hợp lệ', () => {
      const invalid = [
        {
          code: 'TDCX-01',
          keywordEn: 'Abundance',
          qrSlug: 'Abundance_QR', // Sai regex /^[a-z0-9-]+$/
          message: 'Thông điệp',
          promptRecall: 'Gợi nhớ',
          promptPack: 'Gói ghém',
          promptAcknowledge: 'Ghi nhận',
        },
      ]
      expect(() => validateEqCardsData(invalid)).toThrow('Mã QR chỉ dùng chữ thường không dấu')
    })

    it('từ chối nếu có mã thẻ code bị trùng lặp', () => {
      const duplicated = [
        {
          code: 'TDCX-01',
          keywordEn: 'Abundance',
          qrSlug: 'abundance',
          message: 'Thông điệp 1',
          promptRecall: 'Gợi nhớ 1',
          promptPack: 'Gói ghém 1',
          promptAcknowledge: 'Ghi nhận 1',
        },
        {
          code: 'TDCX-01', // Trùng mã
          keywordEn: 'Belonging',
          qrSlug: 'belonging',
          message: 'Thông điệp 2',
          promptRecall: 'Gợi nhớ 2',
          promptPack: 'Gói ghém 2',
          promptAcknowledge: 'Ghi nhận 2',
        },
      ]
      expect(() => validateEqCardsData(duplicated)).toThrow('Mã thẻ "TDCX-01" bị trùng lặp')
    })
  })

  describe('Lệnh nhập importEqCards vào cơ sở dữ liệu', () => {
    it('nhập lần đầu tạo mới, chạy lại không trùng, cập nhật nội dung, bảo vệ thẻ đã in', async () => {
      const prefix = unique()
      const code1 = `${prefix}-01`
      const code2 = `${prefix}-02`
      const slug1 = `${prefix}-slug1`
      const slug2 = `${prefix}-slug2`

      // Tạo trước 1 thẻ MẪU để kiểm tra việc dọn dẹp thẻ mẫu sau khi nhập
      const sampleCard = await payload.create({
        collection: 'eqCards',
        data: {
          code: `${prefix}-sample`,
          qrSlug: `${prefix}-sample-slug`,
          isSample: true,
          _status: 'published',
        },
      })
      track('eqCards', sampleCard)

      const testCards: EqCardInput[] = [
        {
          code: code1,
          keywordEn: 'Test Card 1',
          qrSlug: slug1,
          order: 101,
          message: '[TEST] Thông điệp ban đầu 1',
          promptRecall: '[TEST] Gợi nhớ 1',
          promptPack: '[TEST] Gói ghém 1',
          promptAcknowledge: '[TEST] Ghi nhận 1',
        },
        {
          code: code2,
          keywordEn: 'Test Card 2',
          qrSlug: slug2,
          order: 102,
          message: '[TEST] Thông điệp ban đầu 2',
          promptRecall: '[TEST] Gợi nhớ 2',
          promptPack: '[TEST] Gói ghém 2',
          promptAcknowledge: '[TEST] Ghi nhận 2',
        },
      ]

      // 1. Lần 1: Nhập tạo mới
      const report1 = await importEqCards(payload, testCards)
      expect(report1.created).toBe(2)
      expect(report1.updated).toBe(0)
      expect(report1.skipped).toBe(0)
      expect(report1.samplesRemoved).toBeGreaterThanOrEqual(1)

      // Kiểm tra thẻ trong DB
      const card1Res = await payload.find({
        collection: 'eqCards',
        where: { code: { equals: code1 } },
        limit: 1,
      })
      const foundCard1 = card1Res.docs[0]
      expect(foundCard1).toBeDefined()
      expect(foundCard1.keywordEn).toBe('Test Card 1')
      expect(foundCard1.message).toBe('[TEST] Thông điệp ban đầu 1')
      expect(foundCard1.isSample).toBe(false)
      expect(foundCard1._status).toBe('published')
      track('eqCards', foundCard1)

      const card2Res = await payload.find({
        collection: 'eqCards',
        where: { code: { equals: code2 } },
        limit: 1,
      })
      const foundCard2 = card2Res.docs[0]
      track('eqCards', foundCard2)

      // Thẻ mẫu đã bị xóa
      const checkSample = await payload
        .findByID({
          collection: 'eqCards',
          id: sampleCard.id,
        })
        .catch(() => null)
      expect(checkSample).toBeNull()

      // 2. Lần 2: Chạy lại với cùng dữ liệu -> Không tạo trùng, chỉ cập nhật
      const report2 = await importEqCards(payload, testCards)
      expect(report2.created).toBe(0)
      expect(report2.updated).toBe(2)
      expect(report2.skipped).toBe(0)

      // 3. Cập nhật nội dung chữ
      testCards[0].message = '[TEST] Thông điệp đã được chỉnh sửa'
      testCards[0].promptRecall = '[TEST] Gợi nhớ cập nhật mới'
      const report3 = await importEqCards(payload, testCards)
      expect(report3.updated).toBe(2)

      const reloaded1 = await payload.findByID({ collection: 'eqCards', id: foundCard1.id })
      expect(reloaded1.message).toBe('[TEST] Thông điệp đã được chỉnh sửa')
      expect(reloaded1.promptRecall).toBe('[TEST] Gợi nhớ cập nhật mới')

      // 4. Thẻ đã in đổi qrSlug -> Bỏ qua, không đổi qrSlug
      await payload.update({
        collection: 'eqCards',
        id: foundCard1.id,
        data: { printedAt: '2026-10-15T00:00:00.000Z' },
      })

      // Đổi qrSlug trong dữ liệu nhập
      testCards[0].qrSlug = `${slug1}-new-attempt`
      const report4 = await importEqCards(payload, testCards)
      expect(report4.skipped).toBe(1) // Bỏ qua thẻ 1 vì đã in
      expect(report4.updated).toBe(1) // Thẻ 2 vẫn cập nhật bình thường

      // Thẻ 1 vẫn giữ qrSlug cũ
      const checkPrinted = await payload.findByID({ collection: 'eqCards', id: foundCard1.id })
      expect(checkPrinted.qrSlug).toBe(slug1)
    })
  })
})
