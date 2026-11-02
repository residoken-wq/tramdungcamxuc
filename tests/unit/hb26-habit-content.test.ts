import { describe, expect, it } from 'vitest'
import {
  buildHabitContentPatch,
  createLexicalParagraph,
  TARGET_HABIT_CONTENT,
} from '../../src/lib/habit/hb26-content-patch'

describe('HB-26: buildHabitContentPatch unit tests', () => {
  it('1. Trả về đúng bản vá theo bảng spec khi chạy trên dữ liệu trống / ban đầu', () => {
    const initial = {
      stations: [{ name: 'Trạm 1: Khởi động', reflectionQuestions: [{ question: 'Q1' }] }],
      diagnose: {
        title: 'Tiêu đề cũ',
        intro: createLexicalParagraph('Intro cũ'),
        questions: [{ statement: 'Câu hỏi khảo sát', stage: 'cue' }],
        scaleMinLabel: 'Min cũ',
        scaleMaxLabel: 'Max cũ',
        stats: [{ value: '80%', label: 'Label cũ', sourceLabel: 'Nguồn cũ' }],
        results: [{ stage: 'cue', title: 'Nút thắt', suggestion: 'Gợi ý' }],
      },
      onePercent: {
        title: '1% cũ',
        intro: createLexicalParagraph('1% intro cũ'),
        dailyPercent: 2,
        maxDays: 300,
        facts: [{ statement: 'Fact cũ', sourceLabel: 'Nguồn' }],
        unknowns: [{ title: 'Điều cũ', body: 'Body cũ' }],
        closing: 'Closing cũ',
      },
      loop: {
        stages: [{ stage: 'cue', title: 'Tín hiệu cũ', explanation: 'Giải thích cũ' }],
        rules: [{ title: 'Rule 1', body: 'Rule 1 body' }],
        note: 'Note cũ',
        techniqueHint: 'Hint cũ',
      },
      stepQuotes: {
        onePercent: { text: 'Quote cũ', author: 'Author', source: 'Source' },
        boardingPass: { text: 'Câu Boarding Pass Hana nhập', author: 'Tác giả', source: 'Nguồn' },
      },
      tracker: {
        afterJourneyTitle: 'Title cũ',
        afterJourneyText: 'Text cũ',
      },
      quotes: [{ text: 'Legacy quote', author: 'A', source: 'S' }],
      privacyNote: 'Privacy note cũ',
    }

    const patch = buildHabitContentPatch(initial)
    expect(patch).not.toBeNull()
    if (!patch) return

    // 1. diagnose
    expect(patch.diagnose).toBeDefined()
    const diag = patch.diagnose as any
    expect(diag.title).toBe('Khám đúng “bệnh” — Kê đúng “toa”')
    expect(diag.quote.text).toBe(
      'Chúng ta chỉ đang thay đổi thói quen bằng hành động đơn lẻ. Trong khi thứ chúng ta cần là một hệ thống — một vòng lặp — cho thói quen.',
    )
    expect(diag.quote.author).toBe('James Clear')
    expect(diag.quote.source).toBe('Atomic Habits')

    // 2. onePercent
    expect(patch.onePercent).toBeDefined()
    const op = patch.onePercent as any
    expect(op.title).toBe('Nguyên lý 1% tốt hơn mỗi ngày')
    expect(op.closing).toBe(
      'Lời giải không nằm ở cố gắng nhiều hơn, mà ở một hệ thống tốt hơn. Ở giai đoạn 2, bạn sẽ tự tay xây hệ thống đó cho thói quen của mình.',
    )
    expect(op.facts).toEqual([])
    expect(op.unknowns).toHaveLength(3)
    expect(op.unknowns[0].title).toBe('Giai đoạn thất vọng')
    expect(op.unknowns[1].title).toBe('Tiến trình')
    expect(op.unknowns[2].title).toBe('Tư duy và phương pháp hợp với mình')

    // 3. stepQuotes
    expect(patch.stepQuotes).toBeDefined()
    const sq = patch.stepQuotes as any
    expect(sq.onePercent.text).toBe('Thay đổi thói quen thực ra là thay đổi tư duy.')
    expect(sq.onePercent.author).toBe('Robert Kiyosaki')
    expect(sq.onePercent.source).toBe('Cha giàu Cha nghèo')
    expect(sq.mentor.text).toBe('Môi trường là bàn tay vô hình định hình hành vi của con người.')
    expect(sq.name.text).toBe(
      'Mỗi hành động bạn thực hiện là một lá phiếu cho con người mà bạn muốn trở thành.',
    )
    expect(sq.loop.text).toBe(
      'Bạn không vươn tới tầm mục tiêu của mình. Bạn rơi xuống tầm hệ thống của mình.',
    )
    // HB-26c: Boarding Pass quote has no source in the new version – left exactly as stored.
    expect(sq.boardingPass).toEqual({
      text: 'Câu Boarding Pass Hana nhập',
      author: 'Tác giả',
      source: 'Nguồn',
    })
    expect(sq.tracker.text).toBe('Thói quen là lãi kép của sự tự hoàn thiện.')

    // 4. loop
    expect(patch.loop).toBeDefined()
    const loop = patch.loop as any
    expect(loop.stages).toHaveLength(4)
    expect(loop.stages[0].stage).toBe('cue')
    expect(loop.stages[0].title).toBe('Tín hiệu')
    expect(loop.stages[1].stage).toBe('craving')
    expect(loop.stages[2].stage).toBe('response')
    expect(loop.stages[3].stage).toBe('reward')
    expect(loop.note).toBe(
      'Hai giai đoạn đầu là vấn đề, hai giai đoạn sau là giải pháp. Bốn quy tắc dưới đây là cách bạn thiết kế lại từng mắt xích.',
    )
    expect(loop.techniqueHint).toBe(
      'Đánh dấu kỹ thuật bạn sẽ dùng — chỉ những kỹ thuật được đánh dấu mới hiện trên Habit Boarding Pass.',
    )

    // 5. tracker & privacyNote
    expect((patch.tracker as any).afterJourneyTitle).toBe('Đồng hành sau 28 ngày')
    expect((patch.tracker as any).afterJourneyText).toBe(
      'Nếu cần một Habit Coach đồng hành cùng bạn sau hành trình 28 ngày này, đặt một buổi trò chuyện với Hana.',
    )
    // HB-26c: privacyNote is never patched (the new copy is false for this site).
    expect(patch).not.toHaveProperty('privacyNote')

    // 6. quotes cũ bị xóa rỗng
    expect(patch.quotes).toEqual([])

    // 7. Bảo toàn các field "KHÔNG ĐỤNG"
    expect(patch.stations).toBeUndefined() // Không đụng stations
    expect(diag.questions).toEqual(initial.diagnose.questions) // Giữ nguyên questions
    expect(diag.results).toEqual(initial.diagnose.results) // Giữ nguyên results
    expect(diag.scaleMinLabel).toBe('Min cũ') // Giữ nguyên scaleMinLabel
    expect(diag.scaleMaxLabel).toBe('Max cũ') // Giữ nguyên scaleMaxLabel
    expect(diag.stats).toEqual(initial.diagnose.stats) // Giữ nguyên stats
    expect(op.dailyPercent).toBe(2) // Giữ nguyên dailyPercent
    expect(op.maxDays).toBe(300) // Giữ nguyên maxDays
    expect(loop.rules).toEqual(initial.loop.rules) // Giữ nguyên rules
  })

  it('2. Idempotent: chạy lần thứ 2 trên dữ liệu đã nạp trả về null (không thay đổi gì)', () => {
    // Giả lập trạng thái sau khi đã apply patch
    const appliedState = {
      stations: [{ name: 'Trạm 1' }],
      diagnose: {
        title: TARGET_HABIT_CONTENT.diagnose.title,
        intro: createLexicalParagraph(TARGET_HABIT_CONTENT.diagnose.introText),
        quote: TARGET_HABIT_CONTENT.diagnose.quote,
        questions: [{ statement: 'Q1', stage: 'cue' }],
        stats: [{ value: '80%', label: 'L', sourceLabel: 'S' }],
      },
      onePercent: {
        title: TARGET_HABIT_CONTENT.onePercent.title,
        intro: createLexicalParagraph(TARGET_HABIT_CONTENT.onePercent.introText),
        unknowns: TARGET_HABIT_CONTENT.onePercent.unknowns,
        closing: TARGET_HABIT_CONTENT.onePercent.closing,
        facts: [],
      },
      stepQuotes: TARGET_HABIT_CONTENT.stepQuotes,
      loop: {
        stages: TARGET_HABIT_CONTENT.loop.stages,
        note: TARGET_HABIT_CONTENT.loop.note,
        techniqueHint: TARGET_HABIT_CONTENT.loop.techniqueHint,
        rules: [{ title: 'R1' }],
      },
      tracker: TARGET_HABIT_CONTENT.tracker,
      privacyNote: 'Câu Hana tự viết',
      quotes: [],
    }

    const secondPatch = buildHabitContentPatch(appliedState)
    expect(secondPatch).toBeNull()
  })
})
