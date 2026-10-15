// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPayload, ValidationError, type CollectionSlug, type Payload } from 'payload'
import config from '../../src/payload.config'
import {
  mapLegacyEmotionTag,
  migrateEmotionTags,
  migrateReflectionPromptToPrompts,
  rollbackReflectionPromptsToPrompt,
} from '../../src/lib/eq/migration'
import { type EmotionKey } from '../../src/lib/emotions'
import { shouldHideFloatingChat } from '../../src/components/site/FloatingChat'
import { seed } from '../../seed/seed'

describe('EQ Cards schema, migration helpers, and seed protection', () => {
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
        // Bỏ qua lỗi dọn dẹp nếu bản ghi đã bị xóa
      }
    }
  })

  describe('Migration helpers độc lập (pure functions)', () => {
    it('ánh xạ đúng các biến thể của 10 nhãn cảm xúc và loại bỏ nhãn không hợp lệ', () => {
      // Khớp chính xác nhãn hoặc key
      expect(mapLegacyEmotionTag('joyful')).toBe('joyful')
      expect(mapLegacyEmotionTag('Vui vẻ')).toBe('joyful')
      expect(mapLegacyEmotionTag('vui ve')).toBe('joyful')
      expect(mapLegacyEmotionTag('😊 Vui vẻ')).toBe('joyful')

      // Cảm xúc có khoảng trắng
      expect(mapLegacyEmotionTag('Bình an')).toBe('peaceful')
      expect(mapLegacyEmotionTag('Hơi mệt')).toBe('tired')
      expect(mapLegacyEmotionTag('Chùn bước')).toBe('discouraged')
      expect(mapLegacyEmotionTag('Căng thẳng')).toBe('stressed')

      // Không hợp lệ hoặc rỗng
      expect(mapLegacyEmotionTag('Buồn bã')).toBeNull()
      expect(mapLegacyEmotionTag('Tức giận')).toBeNull()
      expect(mapLegacyEmotionTag('   ')).toBeNull()
      expect(mapLegacyEmotionTag(null)).toBeNull()
      expect(mapLegacyEmotionTag(undefined)).toBeNull()
    })

    it('chuẩn hóa danh sách nhãn cảm xúc cũ, loại bỏ trùng lặp và đếm nhãn bị bỏ', () => {
      const legacy = [
        { text: 'Vui vẻ' },
        { text: '  Bình an  ' },
        { text: '[MẪU] cảm xúc 1' },
        { text: 'vui vẻ' }, // Trùng lặp
        { text: 'Không rõ' },
        { text: '' },
      ]

      const result = migrateEmotionTags(legacy)
      expect(result.tags).toEqual(['joyful', 'peaceful'])
      expect(result.droppedCount).toBe(3) // '[MẪU] cảm xúc 1', 'Không rõ', ''
    })

    it('xử lý migrateReflectionPromptToPrompts và rollbackReflectionPromptsToPrompt', () => {
      // Up migration: chuỗi -> 3 ô câu hỏi với promptRecall nhận giá trị cũ
      expect(migrateReflectionPromptToPrompts('Bạn cảm thấy thế nào hôm nay?')).toEqual({
        promptRecall: 'Bạn cảm thấy thế nào hôm nay?',
        promptPack: '',
        promptAcknowledge: '',
      })
      expect(migrateReflectionPromptToPrompts('  ')).toEqual({
        promptRecall: '',
        promptPack: '',
        promptAcknowledge: '',
      })
      expect(migrateReflectionPromptToPrompts(null)).toEqual({
        promptRecall: '',
        promptPack: '',
        promptAcknowledge: '',
      })

      // Down migration: promptRecall -> chuỗi đơn
      expect(rollbackReflectionPromptsToPrompt('Câu hỏi 1')).toBe('Câu hỏi 1')
      expect(rollbackReflectionPromptsToPrompt('  ')).toBeNull()
      expect(rollbackReflectionPromptsToPrompt(null)).toBeNull()
    })
  })

  describe('Validation schema thẻ eqCards trong Payload', () => {
    it('xuất bản thiếu 1 trong 3 câu hỏi suy ngẫm -> ValidationError; nháp thiếu thì được', async () => {
      const codeBase = unique()

      // Thiếu promptRecall khi xuất bản -> ValidationError
      await expect(
        payload.create({
          collection: 'eqCards',
          data: {
            code: `${codeBase}-no-recall`,
            keywordEn: 'Recall Missing',
            message: 'Thông điệp',
            qrSlug: `${codeBase}-no-recall`,
            promptPack: 'Gói ghém',
            promptAcknowledge: 'Ghi nhận',
            _status: 'published',
          },
        }),
      ).rejects.toThrow(ValidationError)

      // Thiếu promptPack khi xuất bản -> ValidationError
      await expect(
        payload.create({
          collection: 'eqCards',
          data: {
            code: `${codeBase}-no-pack`,
            keywordEn: 'Pack Missing',
            message: 'Thông điệp',
            qrSlug: `${codeBase}-no-pack`,
            promptRecall: 'Gợi nhớ',
            promptAcknowledge: 'Ghi nhận',
            _status: 'published',
          },
        }),
      ).rejects.toThrow(ValidationError)

      // Thiếu promptAcknowledge khi xuất bản -> ValidationError
      await expect(
        payload.create({
          collection: 'eqCards',
          data: {
            code: `${codeBase}-no-ack`,
            keywordEn: 'Ack Missing',
            message: 'Thông điệp',
            qrSlug: `${codeBase}-no-ack`,
            promptRecall: 'Gợi nhớ',
            promptPack: 'Gói ghém',
            _status: 'published',
          },
        }),
      ).rejects.toThrow(ValidationError)

      // Nháp thiếu cả 3 câu hỏi suy ngẫm -> Được phép
      const draftCard = await payload.create({
        collection: 'eqCards',
        data: {
          code: `${codeBase}-draft`,
          qrSlug: `${codeBase}-draft`,
          _status: 'draft',
        },
      })
      track('eqCards', draftCard)
      expect(draftCard._status).toBe('draft')

      // Đủ cả 3 câu hỏi khi xuất bản -> Thành công
      const fullCard = await payload.create({
        collection: 'eqCards',
        data: {
          code: `${codeBase}-full`,
          keywordEn: 'Abundance',
          message: 'Thông điệp đầy đủ',
          qrSlug: `${codeBase}-full`,
          promptRecall: 'Gợi nhớ điều gì?',
          promptPack: 'Gói ghém bài học gì?',
          promptAcknowledge: 'Ghi nhận bản thân ra sao?',
          _status: 'published',
        },
      })
      track('eqCards', fullCard)
      expect(fullCard.keywordEn).toBe('Abundance')
      expect(fullCard.promptRecall).toBe('Gợi nhớ điều gì?')
      expect(fullCard.promptPack).toBe('Gói ghém bài học gì?')
      expect(fullCard.promptAcknowledge).toBe('Ghi nhận bản thân ra sao?')
    })

    it('xuất bản thiếu keywordEn hoặc message -> ValidationError', async () => {
      const codeBase = unique()

      // Thiếu keywordEn khi xuất bản -> ValidationError
      await expect(
        payload.create({
          collection: 'eqCards',
          data: {
            code: `${codeBase}-no-kw`,
            qrSlug: `${codeBase}-no-kw`,
            message: 'Thông điệp',
            promptRecall: 'Gợi nhớ',
            promptPack: 'Gói ghém',
            promptAcknowledge: 'Ghi nhận',
            _status: 'published',
          },
        }),
      ).rejects.toThrow(ValidationError)

      // Thiếu message khi xuất bản -> ValidationError
      await expect(
        payload.create({
          collection: 'eqCards',
          data: {
            code: `${codeBase}-no-msg`,
            keywordEn: 'No Message',
            qrSlug: `${codeBase}-no-msg`,
            promptRecall: 'Gợi nhớ',
            promptPack: 'Gói ghém',
            promptAcknowledge: 'Ghi nhận',
            _status: 'published',
          },
        }),
      ).rejects.toThrow(ValidationError)
    })

    it('chặn emotionTags ngoài 10 key chuẩn; cho phép các key hợp lệ', async () => {
      const codeBase = unique()

      // Chứa key không hợp lệ
      await expect(
        payload.create({
          collection: 'eqCards',
          data: {
            code: `${codeBase}-invalid-tag`,
            keywordEn: 'Invalid Tag',
            message: 'Thông điệp',
            qrSlug: `${codeBase}-invalid-tag`,
            promptRecall: 'Gợi nhớ',
            promptPack: 'Gói ghém',
            promptAcknowledge: 'Ghi nhận',
            emotionTags: ['invalid-emotion' as EmotionKey],
          },
        }),
      ).rejects.toThrow(ValidationError)

      // Chọn đúng các key trong 10 cảm xúc
      const card = await payload.create({
        collection: 'eqCards',
        data: {
          code: `${codeBase}-valid-tag`,
          keywordEn: 'Valid Tag',
          message: 'Thông điệp',
          qrSlug: `${codeBase}-valid-tag`,
          promptRecall: 'Gợi nhớ',
          promptPack: 'Gói ghém',
          promptAcknowledge: 'Ghi nhận',
          emotionTags: ['joyful', 'peaceful'],
          _status: 'published',
        },
      })
      track('eqCards', card)
      expect(card.emotionTags).toEqual(['joyful', 'peaceful'])
    })

    it('giới hạn keywordVi và keywordEn tối đa 40 ký tự', async () => {
      const codeBase = unique()
      const longText = 'a'.repeat(41)

      await expect(
        payload.create({
          collection: 'eqCards',
          data: {
            code: `${codeBase}-long-vi`,
            keywordEn: 'Valid EN',
            message: 'Thông điệp',
            qrSlug: `${codeBase}-long-vi`,
            promptRecall: 'Gợi nhớ',
            promptPack: 'Gói ghém',
            promptAcknowledge: 'Ghi nhận',
            keywordVi: longText,
          },
        }),
      ).rejects.toThrow(ValidationError)

      await expect(
        payload.create({
          collection: 'eqCards',
          data: {
            code: `${codeBase}-long-en`,
            keywordEn: longText,
            message: 'Thông điệp',
            qrSlug: `${codeBase}-long-en`,
            promptRecall: 'Gợi nhớ',
            promptPack: 'Gói ghém',
            promptAcknowledge: 'Ghi nhận',
          },
        }),
      ).rejects.toThrow(ValidationError)
    })

    it('khóa qrSlug của thẻ sau khi đã in (giữ nguyên hành vi bảo vệ)', async () => {
      const codeBase = unique()
      const card = await payload.create({
        collection: 'eqCards',
        data: {
          code: codeBase,
          keywordEn: 'Printed Lock',
          message: 'Thông điệp',
          qrSlug: codeBase,
          promptRecall: 'Gợi nhớ',
          promptPack: 'Gói ghém',
          promptAcknowledge: 'Ghi nhận',
          _status: 'published',
        },
      })
      track('eqCards', card)

      // Cập nhật khi chưa in: được phép
      const newSlug = `${codeBase}-updated`
      await payload.update({
        collection: 'eqCards',
        id: card.id,
        data: { qrSlug: newSlug },
      })

      // Đánh dấu đã in
      await payload.update({
        collection: 'eqCards',
        id: card.id,
        data: { printedAt: '2026-10-15T00:00:00.000Z' },
      })

      // Cố tình đổi qrSlug sau khi đã in -> Chặn
      await expect(
        payload.update({
          collection: 'eqCards',
          id: card.id,
          data: { qrSlug: `${codeBase}-attempt` },
        }),
      ).rejects.toMatchObject({
        data: { errors: [{ path: 'qrSlug', message: 'Thẻ đã in, không được đổi mã QR' }] },
      })

      // Cố tình xóa ngày in sau khi đã in -> Chặn
      await expect(
        payload.update({
          collection: 'eqCards',
          id: card.id,
          data: { printedAt: null },
        }),
      ).rejects.toMatchObject({
        data: {
          errors: [{ path: 'printedAt', message: 'Thẻ đã in, không được đổi hoặc xóa ngày in.' }],
        },
      })

      // Cập nhật thông điệp nhưng giữ nguyên qrSlug -> Được phép
      const updated = await payload.update({
        collection: 'eqCards',
        id: card.id,
        data: { message: '[TEST] Cập nhật thông điệp mới' },
      })
      expect(updated.message).toBe('[TEST] Cập nhật thông điệp mới')
    })
  })

  describe('Cơ chế bảo vệ thẻ thật và tính lũy thừa khi seed', () => {
    it('seed chạy không tạo trùng và không sửa đổi thẻ thật của Hana', async () => {
      // 1. Tạo 1 thẻ thật (isSample = false)
      const realCode = `REAL-${unique()}`
      const realCard = await payload.create({
        collection: 'eqCards',
        data: {
          code: realCode,
          keywordEn: 'Real Card',
          qrSlug: realCode.toLowerCase(),
          message: '[TEST] Thẻ thật của Hana',
          promptRecall: '[TEST] Gợi nhớ',
          promptPack: '[TEST] Gói ghém',
          promptAcknowledge: '[TEST] Ghi nhận',
          isSample: false,
          emotionTags: ['joyful'],
          _status: 'published',
        },
      })
      track('eqCards', realCard)

      // Đếm số lượng thẻ mẫu trước khi seed
      const countBefore = await payload.count({
        collection: 'eqCards',
        where: { isSample: { equals: true } },
      })

      // 2. Chạy seed khi đã có thẻ thật
      await seed(payload)

      // Vì có thẻ thật (isSample != true), seed không tạo hoặc ghi đè thẻ MẪU
      const countAfter = await payload.count({
        collection: 'eqCards',
        where: { isSample: { equals: true } },
      })
      expect(countAfter.totalDocs).toBe(countBefore.totalDocs)

      // Thẻ thật hoàn toàn nguyên vẹn
      const reloadedReal = await payload.findByID({
        collection: 'eqCards',
        id: realCard.id,
      })
      expect(reloadedReal.message).toBe('[TEST] Thẻ thật của Hana')
      expect(reloadedReal.isSample).toBe(false)
    })
  })

  describe('Ẩn nút chat nổi trên các route EQ Buddy', () => {
    it('ẩn nút chat nổi trên /eq-buddy/the và /eq-buddy/rut-the; hiện trên /eq-buddy', () => {
      // Ẩn trên các route xem thẻ theo QR và rút thẻ
      expect(shouldHideFloatingChat('/eq-buddy/the')).toBe(true)
      expect(shouldHideFloatingChat('/eq-buddy/the/mau-01')).toBe(true)
      expect(shouldHideFloatingChat('/eq-buddy/rut-the')).toBe(true)
      expect(shouldHideFloatingChat('/eq-buddy/rut-the/the-01')).toBe(true)

      // Vẫn hiện trên trang giới thiệu /eq-buddy
      expect(shouldHideFloatingChat('/eq-buddy')).toBe(false)
      expect(shouldHideFloatingChat('/eq-buddy-intro')).toBe(false)
    })
  })
})
