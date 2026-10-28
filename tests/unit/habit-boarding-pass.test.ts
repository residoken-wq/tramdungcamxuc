import { describe, it, expect } from 'vitest'
import {
  boardingPassInputSchema,
  buildBoardingPass,
  formatStartDateVN,
  truncateText,
} from '@/lib/habit/boarding-pass'

describe('boardingPassInputSchema', () => {
  it('chấp nhận input hợp lệ đầy đủ', () => {
    const raw = {
      identityStatement: 'Tôi sẽ đọc sách mỗi tối để trở thành người ham học hỏi',
      anchorHabit: 'Rửa mặt buổi tối',
      twoMinuteAction: 'Mở sách đọc 1 trang',
      rhythmDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
      techniqueIds: [1, 2, 3],
    }

    const parsed = boardingPassInputSchema.parse(raw)
    expect(parsed.identityStatement).toBe(raw.identityStatement)
    expect(parsed.anchorHabit).toBe(raw.anchorHabit)
    expect(parsed.twoMinuteAction).toBe(raw.twoMinuteAction)
    expect(parsed.rhythmDays).toEqual(['mon', 'tue', 'wed', 'thu', 'fri'])
    expect(parsed.techniqueIds).toEqual([1, 2, 3])
  })

  it('tự động điền giá trị mặc định cho rhythmDays và techniqueIds', () => {
    const raw = {
      identityStatement: 'Tôi sẽ thiền 5 phút mỗi sáng để bình an',
    }

    const parsed = boardingPassInputSchema.parse(raw)
    expect(parsed.rhythmDays).toEqual(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])
    expect(parsed.techniqueIds).toEqual([])
    expect(parsed.anchorHabit).toBeUndefined()
    expect(parsed.twoMinuteAction).toBeUndefined()
  })

  it('loại bỏ các trường lạ không thuộc schema (strip)', () => {
    const raw = {
      identityStatement: 'Tôi sẽ tập thể dục',
      email: 'test@example.com',
      privateReason: 'Lý do sâu kín',
      companionName: 'Bạn đồng hành',
      scorecard: [{ habit: 'Uống cà phê', rating: 'bad' }],
    }

    const parsed = boardingPassInputSchema.parse(raw)
    expect(parsed.identityStatement).toBe('Tôi sẽ tập thể dục')
    expect((parsed as Record<string, unknown>).email).toBeUndefined()
    expect((parsed as Record<string, unknown>).privateReason).toBeUndefined()
    expect((parsed as Record<string, unknown>).companionName).toBeUndefined()
    expect((parsed as Record<string, unknown>).scorecard).toBeUndefined()
  })

  it('từ chối khi thiếu câu định danh hoặc câu định danh rỗng', () => {
    expect(() => boardingPassInputSchema.parse({})).toThrow()
    expect(() => boardingPassInputSchema.parse({ identityStatement: '   ' })).toThrow()
  })

  it('từ chối câu định danh quá 500 ký tự', () => {
    const longText = 'a'.repeat(501)
    expect(() => boardingPassInputSchema.parse({ identityStatement: longText })).toThrow()
  })

  it('từ chối rhythmDays rỗng', () => {
    expect(() =>
      boardingPassInputSchema.parse({
        identityStatement: 'Hợp lệ',
        rhythmDays: [],
      }),
    ).toThrow()
  })

  it('từ chối rhythmDays có phần tử trùng nhau', () => {
    expect(() =>
      boardingPassInputSchema.parse({
        identityStatement: 'Hợp lệ',
        rhythmDays: ['mon', 'mon', 'tue'],
      }),
    ).toThrow()
  })

  it('từ chối quá 8 techniqueIds', () => {
    expect(() =>
      boardingPassInputSchema.parse({
        identityStatement: 'Hợp lệ',
        techniqueIds: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      }),
    ).toThrow()
  })
})

describe('buildBoardingPass & formatters', () => {
  it('đánh dấu đúng ngày bỏ phiếu và ngày nghỉ mờ trong 7 ô nhịp tuần', () => {
    const input = boardingPassInputSchema.parse({
      identityStatement: 'Tôi rèn luyện mỗi ngày',
      rhythmDays: ['mon', 'wed', 'fri'],
    })

    const data = buildBoardingPass(input, { journeyDays: 28 })

    expect(data.rhythmDays).toHaveLength(7)
    expect(data.activeRhythmCount).toBe(3)

    const mon = data.rhythmDays.find((d) => d.day === 'mon')
    const tue = data.rhythmDays.find((d) => d.day === 'tue')
    const wed = data.rhythmDays.find((d) => d.day === 'wed')
    const sun = data.rhythmDays.find((d) => d.day === 'sun')

    expect(mon?.isActive).toBe(true)
    expect(tue?.isActive).toBe(false) // Ngày nghỉ mờ
    expect(wed?.isActive).toBe(true)
    expect(sun?.isActive).toBe(false) // Ngày nghỉ mờ
  })

  it('cắt chữ dài có dấu … để không làm vỡ bố cục ảnh', () => {
    expect(truncateText('Ngắn', 10)).toBe('Ngắn')
    expect(truncateText('Một chuỗi văn bản rất là dài dòng', 15)).toBe('Một chuỗi văn…')

    const input = boardingPassInputSchema.parse({
      identityStatement: 'A'.repeat(300),
      anchorHabit: 'B'.repeat(110),
      twoMinuteAction: 'C'.repeat(180),
    })

    const data = buildBoardingPass(input, { journeyDays: 28 })
    expect(data.identityStatement.endsWith('…')).toBe(true)
    expect(data.identityStatement.length).toBeLessThanOrEqual(240)
    expect(data.anchorHabit?.endsWith('…')).toBe(true)
    expect(data.twoMinuteAction?.endsWith('…')).toBe(true)
  })

  it('định dạng ngày giờ Việt Nam chính xác (23:30 UTC -> ngày hôm sau theo VN UTC+7)', () => {
    // 2026-10-28 23:30:00 UTC = 2026-10-29 06:30:00 Asia/Ho_Chi_Minh
    const utcDate = new Date('2026-10-28T23:30:00Z')
    const formatted = formatStartDateVN(utcDate)
    expect(formatted).toBe('29/10/2026')
  })

  it('không chứa trường riêng tư trong kết quả hiển thị', () => {
    const input = boardingPassInputSchema.parse({
      identityStatement: 'Mục tiêu công khai',
      anchorHabit: 'Thói quen neo tốt',
      twoMinuteAction: 'Bản tối giản',
    })

    const data = buildBoardingPass(input, { journeyDays: 28 })
    const dataKeys = Object.keys(data)

    expect(dataKeys).not.toContain('email')
    expect(dataKeys).not.toContain('name')
    expect(dataKeys).not.toContain('scorecard')
    expect(dataKeys).not.toContain('privateReason')
    expect(dataKeys).not.toContain('companionName')
    expect(dataKeys).not.toContain('reflection')
    expect(dataKeys).not.toContain('emotions')
  })

  it('nhóm kỹ thuật theo đúng 4 giai đoạn và lọc theo techniqueIds đã xuất bản', () => {
    const input = boardingPassInputSchema.parse({
      identityStatement: 'Học tiếng Anh',
      techniqueIds: [10, 20],
    })

    const techniques = [
      { id: 10, name: 'Đặt sách lên bàn', stage: 'cue' },
      { id: 20, name: 'Đo lường tiến độ', stage: 'reward' },
      { id: 30, name: 'Kỹ thuật khác', stage: 'craving' }, // Không nằm trong techniqueIds
    ]

    const data = buildBoardingPass(input, { journeyDays: 28, techniques })

    expect(data.techniquesByStage).toHaveLength(4)
    const cueStage = data.techniquesByStage.find((s) => s.stage === 'cue')
    const cravingStage = data.techniquesByStage.find((s) => s.stage === 'craving')
    const rewardStage = data.techniquesByStage.find((s) => s.stage === 'reward')

    expect(cueStage?.techniqueNames).toEqual(['Đặt sách lên bàn'])
    expect(cravingStage?.techniqueNames).toEqual([])
    expect(rewardStage?.techniqueNames).toEqual(['Đo lường tiến độ'])
  })

  it('câu neo dùng hành động trong câu định danh; bản tối giản là khối riêng (HB-10c)', () => {
    const base = boardingPassInputSchema.parse({
      identityStatement: '[MẪU] Tôi sẽ đọc 1 trang sách để trở thành người ham học',
      anchorHabit: '[MẪU] Pha trà',
      twoMinuteAction: '[MẪU] Mở sách',
    })
    // Không có actionText -> không có câu neo, không chèn chữ thay thế
    const noAction = buildBoardingPass(base)
    expect(noAction.anchorFormula).toBeUndefined()
    expect(noAction.twoMinuteAction).toBe('[MẪU] Mở sách')

    const withAction = buildBoardingPass({ ...base, actionText: 'đọc 1 trang sách' })
    expect(withAction.anchorFormula).toBe('Sau khi [MẪU] Pha trà, tôi sẽ đọc 1 trang sách')
    expect(withAction.twoMinuteAction).toBe('[MẪU] Mở sách')
  })
})
