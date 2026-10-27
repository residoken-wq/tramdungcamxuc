import { describe, expect, it } from 'vitest'
import {
  getDefaultHabitDraft,
  DEFAULT_RHYTHM_DAYS,
  type HabitPlanDraft,
  type HabitScorecardItem,
} from '@/lib/habit'
import { habitPlanSubmissionSchema, habitScorecardItemSchema } from '@/lib/forms/schemas'
import { vi as viStrings } from '@/lib/i18n/vi'

describe('HB-09: Unit tests for Wizard B3-B4 Draft & Schema Validation', () => {
  describe('1. Draft defaults & recovery logic', () => {
    it('getDefaultHabitDraft có đủ 4 nhóm field mới với giá trị mặc định chuẩn', () => {
      const draft = getDefaultHabitDraft()
      expect(draft.anchorHabit).toBe('')
      expect(draft.twoMinuteAction).toBe('')
      expect(draft.rhythmDays).toEqual(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])
      expect(draft.scorecard).toEqual([])
    })

    it('khôi phục nháp cũ không có field mới -> tự động điền giá trị mặc định, không lỗi', () => {
      const legacyDraft = {
        step: 2,
        actionText: 'uống 1 cốc nước ấm',
        personText: 'người khỏe mạnh',
        identityStatement: 'Tôi sẽ uống 1 cốc nước ấm để trở thành người khỏe mạnh',
        scorecard: [
          { habit: 'Thức dậy 6h', rating: 'good' },
          { habit: 'Uống nước ấm', rating: 'good' },
        ],
      } as unknown as Partial<HabitPlanDraft>

      const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/
      const VALID_WEEKDAYS = new Set(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])

      const rawScorecard = Array.isArray(legacyDraft.scorecard) ? legacyDraft.scorecard : []
      const cleanedScorecard: HabitScorecardItem[] = rawScorecard
        .filter((item): item is HabitScorecardItem =>
          Boolean(
            item &&
            typeof item === 'object' &&
            typeof (item as { habit: unknown }).habit === 'string' &&
            ['good', 'neutral', 'bad'].includes((item as { rating: unknown }).rating as string),
          ),
        )
        .map((item) => {
          const rawTime = typeof item.time === 'string' ? item.time.trim() : undefined
          const validTime = rawTime && TIME_REGEX.test(rawTime) ? rawTime : undefined
          return {
            habit: item.habit.trim(),
            rating: item.rating,
            ...(validTime ? { time: validTime } : {}),
          }
        })

      let cleanedAnchor =
        typeof legacyDraft.anchorHabit === 'string' ? legacyDraft.anchorHabit.trim() : ''
      const goodHabits = new Set(
        cleanedScorecard.filter((s) => s.rating === 'good').map((s) => s.habit),
      )
      if (!goodHabits.has(cleanedAnchor)) {
        cleanedAnchor = ''
      }

      let cleanedRhythm = [...DEFAULT_RHYTHM_DAYS]
      if (Array.isArray(legacyDraft.rhythmDays)) {
        const filtered = legacyDraft.rhythmDays.filter(
          (d): d is (typeof DEFAULT_RHYTHM_DAYS)[number] =>
            typeof d === 'string' && VALID_WEEKDAYS.has(d),
        )
        const unique = Array.from(new Set(filtered))
        if (unique.length > 0) {
          cleanedRhythm = unique
        }
      }

      const cleanedTwoMinuteAction =
        typeof legacyDraft.twoMinuteAction === 'string'
          ? legacyDraft.twoMinuteAction.slice(0, 200)
          : ''

      expect(cleanedAnchor).toBe('')
      expect(cleanedTwoMinuteAction).toBe('')
      expect(cleanedRhythm).toEqual(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])
      expect(cleanedScorecard).toHaveLength(2)
      expect(cleanedScorecard[0].time).toBeUndefined()
    })

    it('làm sạch giờ sai định dạng trong nháp và giữ giờ hợp lệ', () => {
      const draftWithTimes = {
        scorecard: [
          { habit: 'Thói quen 1', rating: 'good', time: '07:30' },
          { habit: 'Thói quen 2', rating: 'neutral', time: '25:00' },
          { habit: 'Thói quen 3', rating: 'bad', time: '9h' },
          { habit: 'Thói quen 4', rating: 'good', time: '00:00' },
        ],
      }

      const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/
      const cleaned = draftWithTimes.scorecard.map((item) => {
        const rawTime = typeof item.time === 'string' ? item.time.trim() : undefined
        const validTime = rawTime && TIME_REGEX.test(rawTime) ? rawTime : undefined
        return {
          habit: item.habit,
          rating: item.rating as 'good' | 'neutral' | 'bad',
          ...(validTime ? { time: validTime } : {}),
        }
      })

      expect(cleaned[0].time).toBe('07:30')
      expect(cleaned[1].time).toBeUndefined()
      expect(cleaned[2].time).toBeUndefined()
      expect(cleaned[3].time).toBe('00:00')
    })

    it('anchorHabit bị xóa khi thói quen không còn là rating good', () => {
      const scorecard: HabitScorecardItem[] = [
        { habit: 'Uống nước', rating: 'neutral' }, // bị đổi từ good sang neutral
        { habit: 'Chạy bộ', rating: 'good' },
      ]
      let anchorHabit = 'Uống nước'

      const goodHabits = new Set(scorecard.filter((s) => s.rating === 'good').map((s) => s.habit))
      if (!goodHabits.has(anchorHabit)) {
        anchorHabit = ''
      }

      expect(anchorHabit).toBe('')
    })
  })

  describe('2. Zod validation for scorecard[].time', () => {
    it('chấp nhận giờ hợp lệ (HH:mm)', () => {
      expect(
        habitScorecardItemSchema.safeParse({ habit: 'Thiền', rating: 'good', time: '07:30' })
          .success,
      ).toBe(true)
      expect(
        habitScorecardItemSchema.safeParse({ habit: 'Thiền', rating: 'good', time: '00:00' })
          .success,
      ).toBe(true)
      expect(
        habitScorecardItemSchema.safeParse({ habit: 'Thiền', rating: 'good', time: '23:59' })
          .success,
      ).toBe(true)
      expect(
        habitScorecardItemSchema.safeParse({ habit: 'Thiền', rating: 'good', time: '' }).success,
      ).toBe(true)
      expect(
        habitScorecardItemSchema.safeParse({ habit: 'Thiền', rating: 'good', time: undefined })
          .success,
      ).toBe(true)
      expect(
        habitScorecardItemSchema.safeParse({ habit: 'Thiền', rating: 'good', time: null }).success,
      ).toBe(true)
    })

    it('từ chối giờ sai định dạng (24:00, 25:00, 9h, abc)', () => {
      const r1 = habitScorecardItemSchema.safeParse({
        habit: 'Thiền',
        rating: 'good',
        time: '24:00',
      })
      expect(r1.success).toBe(false)
      if (!r1.success) {
        expect(r1.error.issues[0].message).toBe(viStrings.hb03.errors.timeInvalidFormat)
      }

      const r2 = habitScorecardItemSchema.safeParse({ habit: 'Thiền', rating: 'good', time: '9h' })
      expect(r2.success).toBe(false)

      const r3 = habitScorecardItemSchema.safeParse({ habit: 'Thiền', rating: 'good', time: 'abc' })
      expect(r3.success).toBe(false)
    })
  })

  describe('3. Zod validation for habitPlanSubmissionSchema (B3-B4)', () => {
    const baseValidInput = {
      scorecard: [
        { habit: 'Uống nước ấm', rating: 'good' as const, time: '07:00' },
        { habit: 'Đi dạo', rating: 'neutral' as const },
      ],
      identityStatement: 'Tôi sẽ uống nước ấm để trở thành người khỏe mạnh',
      chosenTechniques: [],
      consent: true,
      email: 'hb09-test@example.test',
    }

    it('chấp nhận anchorHabit trùng với thói quen rating good', () => {
      const res = habitPlanSubmissionSchema.safeParse({
        ...baseValidInput,
        anchorHabit: 'Uống nước ấm',
      })
      expect(res.success).toBe(true)
    })

    it('từ chối anchorHabit khi không trùng hoặc rating là neutral/bad', () => {
      // Không trùng thói quen nào
      const r1 = habitPlanSubmissionSchema.safeParse({
        ...baseValidInput,
        anchorHabit: 'Tập gym 1 tiếng',
      })
      expect(r1.success).toBe(false)
      if (!r1.success) {
        expect(r1.error.issues[0].message).toBe(viStrings.hb09.errors.anchorHabitNotGood)
      }

      // Trùng thói quen nhưng rating là neutral
      const r2 = habitPlanSubmissionSchema.safeParse({
        ...baseValidInput,
        anchorHabit: 'Đi dạo',
      })
      expect(r2.success).toBe(false)
      if (!r2.success) {
        expect(r2.error.issues[0].message).toBe(viStrings.hb09.errors.anchorHabitNotGood)
      }
    })

    it('từ chối anchorHabit vượt quá 120 ký tự', () => {
      const longHabit = 'a'.repeat(121)
      const res = habitPlanSubmissionSchema.safeParse({
        ...baseValidInput,
        scorecard: [{ habit: longHabit, rating: 'good' as const }],
        anchorHabit: longHabit,
      })
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0].message).toBe(viStrings.hb03.errors.anchorHabitTooLong)
      }
    })

    it('rhythmDays thiếu / undefined / null -> tự động mặc định cả 7 ngày', () => {
      const r1 = habitPlanSubmissionSchema.safeParse(baseValidInput)
      expect(r1.success).toBe(true)
      if (r1.success) {
        expect(r1.data.rhythmDays).toEqual(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])
      }

      const r2 = habitPlanSubmissionSchema.safeParse({
        ...baseValidInput,
        rhythmDays: null,
      })
      expect(r2.success).toBe(true)
      if (r2.success) {
        expect(r2.data.rhythmDays).toEqual(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])
      }
    })

    it('rhythmDays rỗng [] -> từ chối với lỗi rhythmDaysEmpty', () => {
      const res = habitPlanSubmissionSchema.safeParse({
        ...baseValidInput,
        rhythmDays: [],
      })
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0].message).toBe(viStrings.hb09.errors.rhythmDaysEmpty)
      }
    })

    it('rhythmDays trùng lặp -> từ chối với lỗi rhythmDaysDuplicate', () => {
      const res = habitPlanSubmissionSchema.safeParse({
        ...baseValidInput,
        rhythmDays: ['mon', 'mon'],
      })
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0].message).toBe(viStrings.hb03.errors.rhythmDaysDuplicate)
      }
    })

    it('rhythmDays có phần tử không hợp lệ -> từ chối với lỗi rhythmDaysInvalid', () => {
      const res = habitPlanSubmissionSchema.safeParse({
        ...baseValidInput,
        rhythmDays: ['monday'],
      })
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0].message).toBe(viStrings.hb03.errors.rhythmDaysInvalid)
      }
    })

    it('twoMinuteAction chấp nhận chuỗi <= 200 ký tự và từ chối > 200 ký tự', () => {
      const validAction = 'Rót sẵn 1 cốc nước ấm'
      const r1 = habitPlanSubmissionSchema.safeParse({
        ...baseValidInput,
        twoMinuteAction: validAction,
      })
      expect(r1.success).toBe(true)
      if (r1.success) {
        expect(r1.data.twoMinuteAction).toBe(validAction)
      }

      const r2 = habitPlanSubmissionSchema.safeParse({
        ...baseValidInput,
        twoMinuteAction: 'b'.repeat(201),
      })
      expect(r2.success).toBe(false)
      if (!r2.success) {
        expect(r2.error.issues[0].message).toBe(viStrings.hb03.errors.twoMinuteActionTooLong)
      }
    })

    it('bỏ qua (strip) privateReason, companionName, startDate gửi kèm trong input', () => {
      const res = habitPlanSubmissionSchema.safeParse({
        ...baseValidInput,
        privateReason: 'Lý do thầm kín cố tình gửi',
        companionName: 'Bạn đồng hành bí mật',
        startDate: '2099-01-01T00:00:00.000Z',
      })
      expect(res.success).toBe(true)
      if (res.success) {
        const data = res.data as Record<string, unknown>
        expect(data.privateReason).toBeUndefined()
        expect(data.companionName).toBeUndefined()
        expect(data.startDate).toBeUndefined()
      }
    })
  })
})
