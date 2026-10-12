// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import {
  formatIdentityStatement,
  flattenChosenTechniques,
  getDefaultHabitDraft,
  HABIT_LOOP_PATH,
  HABIT_LOOP_STORAGE_KEY,
  type HabitChosenTechnique,
} from '@/lib/habit'
import {
  habitScorecardItemSchema,
  habitChosenTechniqueSchema,
  habitPlanSubmissionSchema,
  type HabitPlanSubmissionInput,
} from '@/lib/forms/schemas'
import { submitHabitPlan, getTechniques, getHabitProduct } from '@/lib/habit.server'
import { vi as viStrings } from '@/lib/i18n/vi'
import type { Payload } from 'payload'

describe('Habit Loop Pure Functions & Schemas (T2-03)', () => {
  describe('formatIdentityStatement()', () => {
    it('kết hợp đầy đủ hành động và con người: Tôi sẽ [hành động] để trở thành [con người]', () => {
      const result = formatIdentityStatement(
        'đọc sách 10 phút mỗi ngày',
        'người ham học hỏi và kỷ luật',
      )
      expect(result).toBe(
        'Tôi sẽ đọc sách 10 phút mỗi ngày để trở thành người ham học hỏi và kỷ luật',
      )
    })

    it('loại bỏ khoảng trắng thừa ở hai đầu', () => {
      const result = formatIdentityStatement('   uống nước ấm   ', '  người khỏe mạnh  ')
      expect(result).toBe('Tôi sẽ uống nước ấm để trở thành người khỏe mạnh')
    })

    it('xử lý khi chỉ có hành động', () => {
      expect(formatIdentityStatement('đọc sách', '')).toBe('Tôi sẽ đọc sách')
    })

    it('xử lý khi chỉ có con người', () => {
      expect(formatIdentityStatement('', 'người kỷ luật')).toBe('Để trở thành người kỷ luật')
    })

    it('trả về chuỗi rỗng khi cả 2 trống', () => {
      expect(formatIdentityStatement('', '')).toBe('')
    })
  })

  describe('flattenChosenTechniques()', () => {
    it('gom phẳng danh sách kỹ thuật từ 4 giai đoạn và bỏ qua hành động rỗng', () => {
      const byStage: Record<'cue' | 'craving' | 'response' | 'reward', HabitChosenTechnique[]> = {
        cue: [{ techniqueId: 1, action: 'Đặt sách cạnh gối' }],
        craving: [
          { techniqueId: 2, action: 'Pha trà thảo mộc' },
          { techniqueId: 3, action: '   ' }, // Rỗng -> bỏ qua
        ],
        response: [{ techniqueId: 4, action: 'Quy tắc 2 phút' }],
        reward: [{ techniqueId: 5, action: 'Tick vào ô hoàn thành' }],
      }

      const flattened = flattenChosenTechniques(byStage)
      expect(flattened).toHaveLength(4)
      expect(flattened).toEqual([
        { techniqueId: 1, stage: 'cue', action: 'Đặt sách cạnh gối' },
        { techniqueId: 2, stage: 'craving', action: 'Pha trà thảo mộc' },
        { techniqueId: 4, stage: 'response', action: 'Quy tắc 2 phút' },
        { techniqueId: 5, stage: 'reward', action: 'Tick vào ô hoàn thành' },
      ])
    })
  })

  describe('getDefaultHabitDraft()', () => {
    it('khởi tạo bản nháp mặc định với 4 giai đoạn rỗng và key v1', () => {
      expect(HABIT_LOOP_STORAGE_KEY).toBe('tdcx_habit_loop_v1')
      const draft = getDefaultHabitDraft()
      expect(draft.step).toBe(1)
      expect(draft.scorecard).toEqual([])
      expect(draft.actionText).toBe('')
      expect(draft.personText).toBe('')
      expect(draft.name).toBe('')
      expect(draft.consent).toBe(false)
      expect(draft.chosenTechniques.cue).toEqual([])
      expect(draft.chosenTechniques.craving).toEqual([])
      expect(draft.chosenTechniques.response).toEqual([])
      expect(draft.chosenTechniques.reward).toEqual([])
    })
  })

  describe('Zod Schema Validation', () => {
    describe('habitScorecardItemSchema', () => {
      it('hợp lệ với rating good / neutral / bad', () => {
        expect(habitScorecardItemSchema.parse({ habit: 'Uống nước', rating: 'good' })).toEqual({
          habit: 'Uống nước',
          rating: 'good',
        })
        expect(habitScorecardItemSchema.parse({ habit: 'Ngồi thiền', rating: 'neutral' })).toEqual({
          habit: 'Ngồi thiền',
          rating: 'neutral',
        })
        expect(habitScorecardItemSchema.parse({ habit: 'Thức khuya', rating: 'bad' })).toEqual({
          habit: 'Thức khuya',
          rating: 'bad',
        })
      })

      it('từ chối khi thói quen để trống', () => {
        expect(() => habitScorecardItemSchema.parse({ habit: '   ', rating: 'good' })).toThrow()
      })

      it('từ chối khi rating không hợp lệ', () => {
        expect(() =>
          habitScorecardItemSchema.parse({
            habit: 'Chạy bộ',
            rating: 'excellent' as unknown as 'good',
          }),
        ).toThrow()
      })
    })

    describe('habitChosenTechniqueSchema', () => {
      it('hợp lệ với techniqueId dương, stage hợp lệ và hành động cụ thể', () => {
        expect(
          habitChosenTechniqueSchema.parse({
            techniqueId: 10,
            stage: 'cue',
            action: 'Đặt chuông nhắc nhở',
          }),
        ).toEqual({ techniqueId: 10, stage: 'cue', action: 'Đặt chuông nhắc nhở' })
      })

      it('từ chối khi thiếu stage', () => {
        expect(() =>
          habitChosenTechniqueSchema.parse({ techniqueId: 10, action: 'Hành động' }),
        ).toThrow()
      })

      it('từ chối khi techniqueId <= 0', () => {
        expect(() =>
          habitChosenTechniqueSchema.parse({ techniqueId: 0, stage: 'cue', action: 'Hành động' }),
        ).toThrow()
      })

      it('từ chối khi action trống', () => {
        expect(() =>
          habitChosenTechniqueSchema.parse({ techniqueId: 1, stage: 'cue', action: '   ' }),
        ).toThrow()
      })
    })

    describe('habitPlanSubmissionSchema', () => {
      const validPlan: HabitPlanSubmissionInput = {
        scorecard: [
          { habit: 'Thức dậy 6h', rating: 'good' },
          { habit: 'Lướt mạng xã hội', rating: 'bad' },
        ],
        identityStatement: 'Tôi sẽ đọc sách 10 phút để trở thành người kỷ luật',
        chosenTechniques: [
          { techniqueId: 1, stage: 'cue', action: 'Đặt sách cạnh giường' },
          { techniqueId: 2, stage: 'craving', action: 'Pha trà ấm' },
        ],
        email: 'hocvien@example.com',
        consent: true,
      }

      it('hợp lệ khi đầy đủ dữ liệu và consent = true', () => {
        const parsed = habitPlanSubmissionSchema.parse(validPlan)
        expect(parsed.email).toBe('hocvien@example.com')
        expect(parsed.consent).toBe(true)
      })

      it('BẮT BUỘC consent = true khi có nhập email (Nghị định 13/2023)', () => {
        expect(() =>
          habitPlanSubmissionSchema.parse({
            ...validPlan,
            consent: false,
          }),
        ).toThrow(viStrings.forms.validation.consentRequired)
      })

      it('cho phép không nhập email (tùy chọn) mà không bắt consent', () => {
        const anonymousPlan = {
          ...validPlan,
          email: '',
          consent: false,
        }
        const parsed = habitPlanSubmissionSchema.parse(anonymousPlan)
        expect(parsed.scorecard).toHaveLength(2)
      })

      it('từ chối khi scorecard rỗng', () => {
        expect(() =>
          habitPlanSubmissionSchema.parse({
            ...validPlan,
            scorecard: [],
          }),
        ).toThrow()
      })

      it('cho phép chosenTechniques rỗng (CMS chưa có kỹ thuật cho giai đoạn nào thì không chặn)', () => {
        expect(() =>
          habitPlanSubmissionSchema.parse({
            ...validPlan,
            chosenTechniques: [],
          }),
        ).not.toThrow()
      })

      it('từ chối khi chosenTechniques vượt quá 8 kỹ thuật', () => {
        const tooMany = Array.from({ length: 9 }, (_, i) => ({
          techniqueId: i + 1,
          stage: 'cue' as const,
          action: `Kỹ thuật ${i + 1}`,
        }))
        expect(() =>
          habitPlanSubmissionSchema.parse({
            ...validPlan,
            chosenTechniques: tooMany,
          }),
        ).toThrow()
      })
    })
  })
})

describe('submitHabitPlan() Server Logic (T2-03)', () => {
  it('chặn honeypot và trả về fake success mà không ghi DB', async () => {
    const mockPayload = {
      create: vi.fn(),
      find: vi.fn(),
      findGlobal: vi.fn(),
    } as unknown as Payload

    const result = await submitHabitPlan(
      {
        scorecard: [{ habit: 'Ăn sáng', rating: 'good' }],
        identityStatement: 'Tôi sẽ ăn sáng để trở thành người khỏe mạnh',
        chosenTechniques: [{ techniqueId: 1, stage: 'cue', action: 'Nấu ăn' }],
        email: 'bot@spam.com',
        consent: true,
        honeypot: 'spam-bot-value',
      },
      {},
      { payload: mockPayload },
    )

    expect(result.success).toBe(true)
    expect(result.fake).toBe(true)
    expect(mockPayload.create).not.toHaveBeenCalled()
  })

  it('tạo lead (tag habit-loop) và habitPlans khi người dùng cung cấp email', async () => {
    const createdLead: Record<string, unknown>[] = []
    const createdPlans: Record<string, unknown>[] = []

    const mockPayload = {
      create: vi.fn().mockImplementation(({ collection, data }) => {
        if (collection === 'leads') {
          createdLead.push(data)
          return Promise.resolve({ id: 101, ...data })
        }
        if (collection === 'habitPlans') {
          createdPlans.push(data)
          return Promise.resolve({ id: 202, ...data })
        }
        if (collection === 'rateLimitHits') {
          return Promise.resolve({ id: 999 })
        }
        return Promise.resolve({ id: 1 })
      }),
      find: vi.fn().mockImplementation(({ collection }) => {
        if (collection === 'rateLimitHits') {
          return Promise.resolve({ docs: [], totalDocs: 0 })
        }
        if (collection === 'customers') {
          return Promise.resolve({ docs: [{ id: 55 }], totalDocs: 1 })
        }
        if (collection === 'techniques') {
          return Promise.resolve({
            docs: [{ id: 3, name: 'Kỹ thuật 3', stage: 'cue' }],
            totalDocs: 1,
          })
        }
        return Promise.resolve({ docs: [], totalDocs: 0 })
      }),
      findGlobal: vi.fn().mockResolvedValue({
        zaloGroupUrl: 'https://zalo.me/g/tdcx-sample',
      }),
      count: vi.fn().mockResolvedValue({ totalDocs: 0 }),
      delete: vi.fn().mockResolvedValue({}),
    } as unknown as Payload

    const input: HabitPlanSubmissionInput = {
      scorecard: [{ habit: 'Tập thể dục', rating: 'good' }],
      identityStatement: 'Tôi sẽ tập thể dục 15 phút để trở thành người tràn đầy năng lượng',
      chosenTechniques: [{ techniqueId: 3, stage: 'cue', action: 'Mang giày chạy bộ' }],
      email: 'HOCVIEN@example.com',
      consent: true,
    }

    const result = await submitHabitPlan(input, { ip: '127.0.0.1' }, { payload: mockPayload })

    expect(result.success).toBe(true)
    expect(result.planId).toBe(202)
    expect(result.zaloGroupUrl).toBe('https://zalo.me/g/tdcx-sample')

    // Kiểm tra bản ghi lead
    expect(createdLead).toHaveLength(1)
    expect(createdLead[0]).toMatchObject({
      email: 'hocvien@example.com',
      need: 'resource',
      consent: true,
      source: {
        form: 'habit-loop',
        page: HABIT_LOOP_PATH,
      },
      interestTags: [{ text: 'habit-loop' }],
    })

    // Kiểm tra bản ghi habitPlans
    expect(createdPlans).toHaveLength(1)
    expect(createdPlans[0]).toMatchObject({
      leadEmail: 'hocvien@example.com',
      identityStatement: 'Tôi sẽ tập thể dục 15 phút để trở thành người tràn đầy năng lượng',
      chosenTechniques: [{ technique: 3, action: 'Mang giày chạy bộ' }],
    })
    expect(createdPlans[0].customer).toBeUndefined()
  })
})

describe('getTechniques() and getHabitProduct() (T2-03)', () => {
  it('đọc danh sách kỹ thuật đã xuất bản và map đúng cấu trúc', async () => {
    const mockDocs = [
      { id: 1, name: 'Kỹ thuật 1', stage: 'cue', _status: 'published' },
      { id: 2, name: 'Kỹ thuật 2', stage: 'craving', _status: 'published' },
      { id: 3, name: 'Kỹ thuật 3', stage: 'response', _status: 'published' },
      { id: 4, name: 'Kỹ thuật 4', stage: 'reward', _status: 'published' },
    ]

    const mockPayload = {
      find: vi.fn().mockResolvedValue({ docs: mockDocs }),
    } as unknown as Payload

    const techniques = await getTechniques(mockPayload)
    expect(techniques).toHaveLength(4)
    expect(techniques[0]).toEqual({
      id: 1,
      name: 'Kỹ thuật 1',
      stage: 'cue',
      howTo: undefined,
      example: undefined,
    })
  })

  it('đọc thông tin sản phẩm habit-tracker-so', async () => {
    const mockProduct = {
      id: 10,
      name: 'Habit Tracker số (Habit Hack 1% Better)',
      slug: 'habit-tracker-so',
      price: 250000,
      salePrice: 178000,
      trialDays: 21,
      shortDescription: 'Mô tả ngắn',
      saleStatus: 'coming_soon',
    }

    const mockPayload = {
      find: vi.fn().mockResolvedValue({ docs: [mockProduct] }),
      count: vi.fn().mockResolvedValue({ totalDocs: 10 }),
    } as unknown as Payload

    const product = await getHabitProduct(mockPayload)
    expect(product).not.toBeNull()
    expect(product?.price).toBe(250000)
    expect(product?.salePrice).toBe(178000)
    expect(product?.trialDays).toBe(21)
  })
})
