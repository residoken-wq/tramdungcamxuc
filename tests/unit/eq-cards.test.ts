// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPayload, ValidationError, type CollectionSlug, type Payload } from 'payload'
import config from '../../src/payload.config'
import { migrations } from '../../src/migrations'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import {
  mapLegacyEmotionTag,
  migrateEmotionTags,
  migrateReflectionPromptToPrompts,
  rollbackReflectionPromptsToPrompt,
} from '../../src/lib/eq/migration'
import { EMOTIONS, type EmotionKey } from '../../src/lib/emotions'
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
    await payload.db.migrate({
      migrations: migrations.map((migration) => ({
        name: migration.name,
        up: (args: unknown) => migration.up(args as MigrateUpArgs),
        down: (args: unknown) => migration.down(args as MigrateDownArgs),
      })),
    })
  }, 60000)

  afterAll(async () => {
    if (!payload) return
    try {
      for (const entry of created.reverse()) {
        try {
          await payload.delete(entry)
        } catch {
          // Record may have been cleaned up by another step
        }
      }
    } finally {
      await payload.destroy()
    }
  }, 30000)

  describe('Pure migration functions', () => {
    it('ánh xạ chính xác các nhãn cảm xúc cũ sang EmotionKey chuẩn', () => {
      // 10 cảm xúc chuẩn theo tên tiếng Việt
      expect(mapLegacyEmotionTag('Vui vẻ')).toBe('joyful')
      expect(mapLegacyEmotionTag('Bình an')).toBe('peaceful')
      expect(mapLegacyEmotionTag('Tươi mới')).toBe('fresh')
      expect(mapLegacyEmotionTag('An yên')).toBe('serene')
      expect(mapLegacyEmotionTag('Biết ơn')).toBe('grateful')
      expect(mapLegacyEmotionTag('Thư thái')).toBe('relaxed')
      expect(mapLegacyEmotionTag('Tự tin')).toBe('confident')
      expect(mapLegacyEmotionTag('Hơi mệt')).toBe('tired')
      expect(mapLegacyEmotionTag('Chùn bước')).toBe('discouraged')
      expect(mapLegacyEmotionTag('Căng thẳng')).toBe('stressed')

      // Không phân biệt hoa thường và khoảng trắng
      expect(mapLegacyEmotionTag('  vui vẻ  ')).toBe('joyful')
      expect(mapLegacyEmotionTag('VUI VẺ')).toBe('joyful')
      expect(mapLegacyEmotionTag('bình   an')).toBe('peaceful')

      // Khớp nhãn có emoji kèm theo
      expect(mapLegacyEmotionTag('😊 Vui vẻ')).toBe('joyful')
      expect(mapLegacyEmotionTag('🕊️ Bình an')).toBe('peaceful')

      // Khớp trực tiếp khóa tiếng Anh
      expect(mapLegacyEmotionTag('joyful')).toBe('joyful')
      expect(mapLegacyEmotionTag('SERENE')).toBe('serene')

      // Các chuỗi không khớp hoặc rác -> null
      expect(mapLegacyEmotionTag('[MẪU] cảm xúc 1')).toBeNull()
      expect(mapLegacyEmotionTag('Tức giận')).toBeNull()
      expect(mapLegacyEmotionTag('')).toBeNull()
      expect(mapLegacyEmotionTag(null)).toBeNull()
      expect(mapLegacyEmotionTag(undefined)).toBeNull()
    })

    it('chuyển đổi danh sách emotionTags và tính chính xác droppedCount', () => {
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
      // Up migration: chuỗi -> mảng 1 phần tử
      expect(migrateReflectionPromptToPrompts('Bạn cảm thấy thế nào hôm nay?')).toEqual([
        { prompt: 'Bạn cảm thấy thế nào hôm nay?' },
      ])
      expect(migrateReflectionPromptToPrompts('  ')).toEqual([])
      expect(migrateReflectionPromptToPrompts(null)).toEqual([])
      expect(migrateReflectionPromptToPrompts(undefined)).toEqual([])

      // Down migration: mảng -> chuỗi đầu tiên
      expect(
        rollbackReflectionPromptsToPrompt([{ prompt: 'Câu hỏi 1' }, { prompt: 'Câu hỏi 2' }]),
      ).toBe('Câu hỏi 1')
      expect(rollbackReflectionPromptsToPrompt([])).toBeNull()
      expect(rollbackReflectionPromptsToPrompt(null)).toBeNull()
    })
  })

  describe('Validation schema thẻ eqCards trong Payload', () => {
    it('chặn tạo thẻ với 0 câu hỏi hoặc 4 câu hỏi suy ngẫm; cho phép 1–3 câu', async () => {
      const codeBase = unique()

      // 0 câu hỏi -> ValidationError
      await expect(
        payload.create({
          collection: 'eqCards',
          data: {
            code: `${codeBase}-0`,
            qrSlug: `${codeBase}-0`,
            isSample: true,
            reflectionPrompts: [],
          },
        }),
      ).rejects.toThrow(ValidationError)

      // 4 câu hỏi -> ValidationError
      await expect(
        payload.create({
          collection: 'eqCards',
          data: {
            code: `${codeBase}-4`,
            qrSlug: `${codeBase}-4`,
            isSample: true,
            reflectionPrompts: [
              { prompt: '[TEST] Câu 1' },
              { prompt: '[TEST] Câu 2' },
              { prompt: '[TEST] Câu 3' },
              { prompt: '[TEST] Câu 4' },
            ],
          },
        }),
      ).rejects.toThrow(ValidationError)

      // 1 câu hỏi -> Thành công
      const card1 = await payload.create({
        collection: 'eqCards',
        data: {
          code: `${codeBase}-1`,
          qrSlug: `${codeBase}-1`,
          isSample: true,
          reflectionPrompts: [{ prompt: '[TEST] Câu hỏi 1' }],
        },
      })
      track('eqCards', card1)
      expect(card1.reflectionPrompts).toHaveLength(1)
      expect(card1.reflectionPrompts?.[0].prompt).toBe('[TEST] Câu hỏi 1')

      // 3 câu hỏi -> Thành công
      const card3 = await payload.create({
        collection: 'eqCards',
        data: {
          code: `${codeBase}-3`,
          qrSlug: `${codeBase}-3`,
          isSample: true,
          reflectionPrompts: [
            { prompt: '[TEST] Câu hỏi 1' },
            { prompt: '[TEST] Câu hỏi 2' },
            { prompt: '[TEST] Câu hỏi 3' },
          ],
        },
      })
      track('eqCards', card3)
      expect(card3.reflectionPrompts).toHaveLength(3)

      // Câu hỏi rỗng bên trong mảng -> ValidationError
      await expect(
        payload.create({
          collection: 'eqCards',
          data: {
            code: `${codeBase}-empty`,
            qrSlug: `${codeBase}-empty`,
            isSample: true,
            reflectionPrompts: [{ prompt: '   ' }],
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
            qrSlug: `${codeBase}-invalid-tag`,
            isSample: true,
            reflectionPrompts: [{ prompt: '[TEST] Câu hỏi' }],
            emotionTags: ['invalid-emotion' as EmotionKey],
          },
        }),
      ).rejects.toThrow(ValidationError)

      // Chứa cả key hợp lệ và key không hợp lệ
      await expect(
        payload.create({
          collection: 'eqCards',
          data: {
            code: `${codeBase}-mixed-tag`,
            qrSlug: `${codeBase}-mixed-tag`,
            isSample: true,
            reflectionPrompts: [{ prompt: '[TEST] Câu hỏi' }],
            emotionTags: ['joyful', 'unknown_tag' as EmotionKey],
          },
        }),
      ).rejects.toThrow(ValidationError)

      // Chọn đúng các key trong 10 cảm xúc
      const card = await payload.create({
        collection: 'eqCards',
        data: {
          code: `${codeBase}-valid-tag`,
          qrSlug: `${codeBase}-valid-tag`,
          isSample: true,
          reflectionPrompts: [{ prompt: '[TEST] Câu hỏi' }],
          emotionTags: ['joyful', 'peaceful'],
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
            qrSlug: `${codeBase}-long-vi`,
            isSample: true,
            reflectionPrompts: [{ prompt: '[TEST] Câu hỏi' }],
            keywordVi: longText,
          },
        }),
      ).rejects.toThrow(ValidationError)

      await expect(
        payload.create({
          collection: 'eqCards',
          data: {
            code: `${codeBase}-long-en`,
            qrSlug: `${codeBase}-long-en`,
            isSample: true,
            reflectionPrompts: [{ prompt: '[TEST] Câu hỏi' }],
            keywordEn: longText,
          },
        }),
      ).rejects.toThrow(ValidationError)

      const card = await payload.create({
        collection: 'eqCards',
        data: {
          code: `${codeBase}-valid-keywords`,
          qrSlug: `${codeBase}-valid-keywords`,
          isSample: true,
          reflectionPrompts: [{ prompt: '[TEST] Câu hỏi' }],
          keywordVi: 'Thấu hiểu cảm xúc',
          keywordEn: 'Emotional Clarity',
        },
      })
      track('eqCards', card)
      expect(card.keywordVi).toBe('Thấu hiểu cảm xúc')
      expect(card.keywordEn).toBe('Emotional Clarity')
    })

    it('khóa qrSlug của thẻ sau khi đã in (giữ nguyên hành vi bảo vệ)', async () => {
      const codeBase = unique()
      const card = await payload.create({
        collection: 'eqCards',
        data: {
          code: codeBase,
          qrSlug: codeBase,
          isSample: true,
          reflectionPrompts: [{ prompt: '[TEST] Câu hỏi' }],
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
          qrSlug: realCode.toLowerCase(),
          message: '[TEST] Thẻ thật của Hana',
          isSample: false,
          reflectionPrompts: [{ prompt: '[TEST] Câu hỏi thẻ thật' }],
          emotionTags: ['joyful'],
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
