// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import {
  scoreDiagnostic,
  selectDiagnosticSuggestions,
  type DiagnosticAnswerItem,
  type DiagnosticQuestionRef,
  type QuestionWithSuggestion,
} from '@/lib/diagnostic'
import {
  diagnosticAnswerSchema,
  diagnosticSubmissionSchema,
  type DiagnosticSubmissionInput,
} from '@/lib/forms/schemas'
import { submitDiagnostic } from '@/lib/diagnostic.server'
import { vi as viStrings } from '@/lib/i18n/vi'
import type { Payload } from 'payload'

describe('Diagnostic Quiz Pure Functions & Scoring (T1-14)', () => {
  // Bộ 16 câu hỏi mẫu (mỗi giai đoạn 4 câu: IDs 1..4 = cue, 5..8 = craving, 9..12 = response, 13..16 = reward)
  const mockQuestions: DiagnosticQuestionRef[] = [
    { id: 1, stage: 'cue', statement: 'Câu 1' },
    { id: 2, stage: 'cue', statement: 'Câu 2' },
    { id: 3, stage: 'cue', statement: 'Câu 3' },
    { id: 4, stage: 'cue', statement: 'Câu 4' },
    { id: 5, stage: 'craving', statement: 'Câu 5' },
    { id: 6, stage: 'craving', statement: 'Câu 6' },
    { id: 7, stage: 'craving', statement: 'Câu 7' },
    { id: 8, stage: 'craving', statement: 'Câu 8' },
    { id: 9, stage: 'response', statement: 'Câu 9' },
    { id: 10, stage: 'response', statement: 'Câu 10' },
    { id: 11, stage: 'response', statement: 'Câu 11' },
    { id: 12, stage: 'response', statement: 'Câu 12' },
    { id: 13, stage: 'reward', statement: 'Câu 13' },
    { id: 14, stage: 'reward', statement: 'Câu 14' },
    { id: 15, stage: 'reward', statement: 'Câu 15' },
    { id: 16, stage: 'reward', statement: 'Câu 16' },
  ]

  describe('scoreDiagnostic() average scoring & tie-breaking rules (T2-12, H1, H2, GAPS B8)', () => {
    it('Chấm theo điểm trung bình (16 câu chia 6/3/5/2): Khao khát thắng dù tổng điểm Tín hiệu cao hơn', () => {
      // Bộ câu hỏi 16 câu chia không đều theo spec T2-12:
      // Tín hiệu (Cue): 6 câu (IDs 101..106)
      // Khao khát (Craving): 3 câu (IDs 107..109)
      // Phản hồi (Response): 5 câu (IDs 110..114)
      // Phần thưởng (Reward): 2 câu (IDs 115..116)
      const unevenQuestions: DiagnosticQuestionRef[] = [
        { id: 101, stage: 'cue', statement: 'Cue 1' },
        { id: 102, stage: 'cue', statement: 'Cue 2' },
        { id: 103, stage: 'cue', statement: 'Cue 3' },
        { id: 104, stage: 'cue', statement: 'Cue 4' },
        { id: 105, stage: 'cue', statement: 'Cue 5' },
        { id: 106, stage: 'cue', statement: 'Cue 6' },
        { id: 107, stage: 'craving', statement: 'Craving 1' },
        { id: 108, stage: 'craving', statement: 'Craving 2' },
        { id: 109, stage: 'craving', statement: 'Craving 3' },
        { id: 110, stage: 'response', statement: 'Response 1' },
        { id: 111, stage: 'response', statement: 'Response 2' },
        { id: 112, stage: 'response', statement: 'Response 3' },
        { id: 113, stage: 'response', statement: 'Response 4' },
        { id: 114, stage: 'response', statement: 'Response 5' },
        { id: 115, stage: 'reward', statement: 'Reward 1' },
        { id: 116, stage: 'reward', statement: 'Reward 2' },
      ]

      // Tín hiệu trả 3 cho cả 6 câu (tổng 18, TB 3.0)
      // Khao khát trả 5 cho cả 3 câu (tổng 15, TB 5.0)
      // Còn lại (Phản hồi, Phần thưởng) trả 1 (Response tổng 5 TB 1.0; Reward tổng 2 TB 1.0)
      const answers: DiagnosticAnswerItem[] = [
        { questionId: 101, score: 3 },
        { questionId: 102, score: 3 },
        { questionId: 103, score: 3 },
        { questionId: 104, score: 3 },
        { questionId: 105, score: 3 },
        { questionId: 106, score: 3 },
        { questionId: 107, score: 5 },
        { questionId: 108, score: 5 },
        { questionId: 109, score: 5 },
        { questionId: 110, score: 1 },
        { questionId: 111, score: 1 },
        { questionId: 112, score: 1 },
        { questionId: 113, score: 1 },
        { questionId: 114, score: 1 },
        { questionId: 115, score: 1 },
        { questionId: 116, score: 1 },
      ]

      const result = scoreDiagnostic(answers, unevenQuestions)

      // Kiểm tra tổng điểm
      expect(result.scores.cue).toBe(18)
      expect(result.scores.craving).toBe(15)
      expect(result.scores.response).toBe(5)
      expect(result.scores.reward).toBe(2)

      // Kiểm tra điểm trung bình
      expect(result.averageScores.cue).toBe(3.0)
      expect(result.averageScores.craving).toBe(5.0)
      expect(result.averageScores.response).toBe(1.0)
      expect(result.averageScores.reward).toBe(1.0)

      // CHỨNG MINH ĐÃ ĐỔI CÁCH CHẤM:
      // Tổng điểm Cue (18) > Craving (15), nhưng điểm TB Craving (5.0) > Cue (3.0)
      // -> Kết quả topStage phải là 'craving'!
      expect(result.topStage).toBe('craving')
      expect(result.maxScore).toBe(5.0)

      // Chênh lệch giữa Craving (5.0) và Cue (3.0) là 2.0 > 0.5 -> secondaryStage là null
      expect(result.secondaryStage).toBeNull()
    })

    it('Trường hợp hòa 2 (Cue và Craving cùng điểm trung bình cao nhất): ưu tiên Cue, secondaryStage là Craving', () => {
      // Cue: 4 câu (5 + 5 + 3 + 3 = 16, TB 4.0)
      // Craving: 4 câu (4 + 4 + 4 + 4 = 16, TB 4.0)
      // Response: 4 câu (2*4 = 8, TB 2.0)
      // Reward: 4 câu (1*4 = 4, TB 1.0)
      const answers: DiagnosticAnswerItem[] = [
        { questionId: 1, score: 5 },
        { questionId: 2, score: 5 },
        { questionId: 3, score: 3 },
        { questionId: 4, score: 3 },
        { questionId: 5, score: 4 },
        { questionId: 6, score: 4 },
        { questionId: 7, score: 4 },
        { questionId: 8, score: 4 },
        { questionId: 9, score: 2 },
        { questionId: 10, score: 2 },
        { questionId: 11, score: 2 },
        { questionId: 12, score: 2 },
        { questionId: 13, score: 1 },
        { questionId: 14, score: 1 },
        { questionId: 15, score: 1 },
        { questionId: 16, score: 1 },
      ]

      const result = scoreDiagnostic(answers, mockQuestions)

      expect(result.averageScores.cue).toBe(4.0)
      expect(result.averageScores.craving).toBe(4.0)
      expect(result.averageScores.response).toBe(2.0)
      expect(result.averageScores.reward).toBe(1.0)
      expect(result.maxScore).toBe(4.0)

      // Hòa giữa Cue và Craving -> Cue thắng vì Cue đứng trước Craving theo B8
      expect(result.topStage).toBe('cue')
      // Craving bằng điểm (chênh 0 <= 0.5) -> secondaryStage là craving
      expect(result.secondaryStage).toBe('craving')
    })

    it('Trường hợp hòa 2 giữa Craving và Response: ưu tiên Craving, secondaryStage là Response', () => {
      const answers: DiagnosticAnswerItem[] = [
        { questionId: 1, score: 1 },
        { questionId: 2, score: 1 },
        { questionId: 3, score: 1 },
        { questionId: 4, score: 1 }, // Cue TB = 1.0
        { questionId: 5, score: 5 },
        { questionId: 6, score: 5 },
        { questionId: 7, score: 4 },
        { questionId: 8, score: 4 }, // Craving: 18 / 4 = 4.5
        { questionId: 9, score: 5 },
        { questionId: 10, score: 5 },
        { questionId: 11, score: 4 },
        { questionId: 12, score: 4 }, // Response: 18 / 4 = 4.5
        { questionId: 13, score: 2 },
        { questionId: 14, score: 2 },
        { questionId: 15, score: 2 },
        { questionId: 16, score: 2 }, // Reward TB = 2.0
      ]

      const result = scoreDiagnostic(answers, mockQuestions)

      expect(result.averageScores.craving).toBe(4.5)
      expect(result.averageScores.response).toBe(4.5)
      expect(result.topStage).toBe('craving') // Craving đứng trước Response theo B8
      expect(result.secondaryStage).toBe('response')
    })

    it('Trường hợp hòa 4 (tất cả 4 giai đoạn bằng điểm trung bình nhau): topStage là Cue, secondaryStage là Craving', () => {
      // Mỗi câu đều chọn 3 điểm -> mỗi giai đoạn điểm TB 3.0
      const answers: DiagnosticAnswerItem[] = mockQuestions.map((q) => ({
        questionId: q.id,
        score: 3,
      }))

      const result = scoreDiagnostic(answers, mockQuestions)

      expect(result.averageScores.cue).toBe(3.0)
      expect(result.averageScores.craving).toBe(3.0)
      expect(result.averageScores.response).toBe(3.0)
      expect(result.averageScores.reward).toBe(3.0)
      expect(result.topStage).toBe('cue')
      expect(result.secondaryStage).toBe('craving')
    })

    it('Trường hợp chênh lệch điểm trung bình <= 0.5: secondaryStage xuất hiện kèm', () => {
      // Cue: TB 4.2 (4+4+4+5 = 17 / 4 = 4.25 -> 4.3)
      // Craving: TB 3.8 (4+4+4+3 = 15 / 4 = 3.75 -> 3.8) -> chênh 4.3 - 3.8 = 0.5 (<= 0.5)
      const answers: Record<number, number> = {
        1: 5,
        2: 4,
        3: 4,
        4: 4, // Cue = 17, TB = 4.3
        5: 4,
        6: 4,
        7: 4,
        8: 3, // Craving = 15, TB = 3.8
        9: 2,
        10: 2,
        11: 2,
        12: 2, // Response = 8, TB = 2.0
        13: 1,
        14: 1,
        15: 1,
        16: 1, // Reward = 4, TB = 1.0
      }

      const result = scoreDiagnostic(answers, mockQuestions)

      expect(result.averageScores.cue).toBe(4.3)
      expect(result.averageScores.craving).toBe(3.8)
      expect(result.maxScore).toBe(4.3)
      expect(result.topStage).toBe('cue')
      // Chênh lệch 4.3 - 3.8 = 0.5 (<= 0.5) -> hiển thị secondaryStage
      expect(result.secondaryStage).toBe('craving')
    })

    it('Trường hợp chênh lệch điểm trung bình > 0.5: secondaryStage là null', () => {
      // Response: TB 4.5, Reward: TB 3.8 (chênh 0.7 > 0.5)
      const answers: Record<number, number> = {
        1: 2,
        2: 2,
        3: 2,
        4: 2, // Cue TB = 2.0
        5: 2,
        6: 2,
        7: 1,
        8: 1, // Craving TB = 1.5
        9: 5,
        10: 5,
        11: 4,
        12: 4, // Response = 18 / 4 = 4.5
        13: 4,
        14: 4,
        15: 4,
        16: 3, // Reward = 15 / 4 = 3.8
      }

      const result = scoreDiagnostic(answers, mockQuestions)

      expect(result.averageScores.response).toBe(4.5)
      expect(result.averageScores.reward).toBe(3.8)
      expect(result.topStage).toBe('response')
      // Chênh lệch 4.5 - 3.8 = 0.7 (> 0.5) -> secondaryStage là null
      expect(result.secondaryStage).toBeNull()
    })

    it('Trường hợp thiếu câu (người dùng chỉ trả lời một phần): tính đúng điểm TB các câu đã trả lời, bỏ qua giai đoạn không có câu nào', () => {
      // Chỉ trả lời duy nhất 2 câu thuộc Response (điểm 5 và 4 -> TB 4.5)
      const answers: DiagnosticAnswerItem[] = [
        { questionId: 9, score: 5 },
        { questionId: 10, score: 4 },
      ]

      const result = scoreDiagnostic(answers, mockQuestions)

      expect(result.scores.response).toBe(9)
      expect(result.averageScores.response).toBe(4.5)
      expect(result.averageScores.cue).toBe(0)
      expect(result.averageScores.craving).toBe(0)
      expect(result.averageScores.reward).toBe(0)

      // Giai đoạn không có câu nào bị loại khỏi so sánh
      expect(result.topStage).toBe('response')
      expect(result.secondaryStage).toBeNull()
    })

    it('Giới hạn (clamp) an toàn điểm số mỗi câu trong khoảng 1–5', () => {
      const answers: DiagnosticAnswerItem[] = [
        { questionId: 1, score: 99 }, // clamp to 5 (DIAGNOSTIC_SCALE_MAX)
        { questionId: 2, score: -5 }, // clamp to 1 (DIAGNOSTIC_SCALE_MIN)
      ]

      const result = scoreDiagnostic(answers, mockQuestions)
      expect(result.scores.cue).toBe(6) // 5 + 1
      expect(result.averageScores.cue).toBe(3.0) // 6 / 2
    })

    it('Hoạt động an toàn khi questions hoặc answers rỗng / null', () => {
      const emptyRes = scoreDiagnostic(null, [])
      expect(emptyRes.topStage).toBe('cue')
      expect(emptyRes.secondaryStage).toBeNull()
      expect(emptyRes.scores.cue).toBe(0)
      expect(emptyRes.averageScores.cue).toBe(0)
      expect(emptyRes.maxScore).toBe(0)

      const emptyAnswersRes = scoreDiagnostic([], mockQuestions)
      expect(emptyAnswersRes.topStage).toBe('cue')
      expect(emptyAnswersRes.secondaryStage).toBeNull()
    })

    it('Validation Zod: diagnosticAnswerSchema chấp nhận 1..5 và từ chối ngoài khoảng', () => {
      const validScore5 = { questionId: 1, score: 5 }
      const validScore1 = { questionId: 1, score: 1 }
      const invalidScore0 = { questionId: 1, score: 0 }
      const invalidScore6 = { questionId: 1, score: 6 }

      expect(diagnosticAnswerSchema.safeParse(validScore5).success).toBe(true)
      expect(diagnosticAnswerSchema.safeParse(validScore1).success).toBe(true)
      expect(diagnosticAnswerSchema.safeParse(invalidScore0).success).toBe(false)
      expect(diagnosticAnswerSchema.safeParse(invalidScore6).success).toBe(false)
    })
  })

  describe('selectDiagnosticSuggestions()', () => {
    const questionsWithSuggestions: QuestionWithSuggestion[] = [
      {
        id: 1,
        stage: 'cue',
        statement: 'Tình huống 1',
        order: 1,
        suggestion: { root: { children: [{ text: 'Gợi ý câu 1' }] } },
      },
      {
        id: 2,
        stage: 'cue',
        statement: 'Tình huống 2',
        order: 2,
        suggestion: { root: { children: [{ text: 'Gợi ý câu 2' }] } },
      },
      {
        id: 3,
        stage: 'cue',
        statement: 'Tình huống 3',
        order: 3,
        suggestion: null, // Không có gợi ý
      },
      {
        id: 4,
        stage: 'cue',
        statement: 'Tình huống 4',
        order: 4,
        suggestion: { root: { children: [{ text: 'Gợi ý câu 4' }] } },
      },
    ]

    it('Ưu tiên lấy gợi ý của các câu có điểm >= 3', () => {
      const answers = {
        1: 4, // >= 3 -> lấy
        2: 2, // < 3 -> bỏ
        3: 4, // >= 3 nhưng suggestion null -> bỏ
        4: 3, // >= 3 -> lấy
      }

      const suggestions = selectDiagnosticSuggestions('cue', questionsWithSuggestions, answers)

      expect(suggestions).toHaveLength(2)
      expect(suggestions[0]?.questionId).toBe(1)
      expect(suggestions[1]?.questionId).toBe(4)
    })

    it('Nếu không có câu nào >= 3: lấy gợi ý của câu có điểm cao nhất', () => {
      const answers = {
        1: 1,
        2: 2, // Điểm cao nhất có suggestion
        3: 2, // suggestion null
        4: 1,
      }

      const suggestions = selectDiagnosticSuggestions('cue', questionsWithSuggestions, answers)

      expect(suggestions).toHaveLength(1)
      expect(suggestions[0]?.questionId).toBe(2)
    })

    it('Trả về mảng rỗng nếu không có câu hỏi nào thuộc giai đoạn hoặc không có gợi ý', () => {
      const suggestions = selectDiagnosticSuggestions('reward', questionsWithSuggestions, { 1: 4 })
      expect(suggestions).toEqual([])
    })
  })
})

describe('Diagnostic Submission & Validation (submitDiagnostic)', () => {
  const dummyQuestions = [
    {
      id: 1,
      statement: 'Khi chuông báo thức reo, tôi thường tắt đi',
      stage: 'cue',
      order: 1,
      suggestion: { text: 'Hãy đặt đồng hồ xa tầm tay' },
    },
    {
      id: 2,
      statement: 'Tôi thấy thói quen mới quá khó thực hiện',
      stage: 'response',
      order: 2,
      suggestion: { text: 'Hãy thu nhỏ hành động dưới 2 phút' },
    },
  ]

  const createMockPayload = () => {
    const leadsCreated: Array<Record<string, unknown>> = []
    const resultsCreated: Array<Record<string, unknown>> = []

    const mockPayload = {
      find: vi.fn().mockResolvedValue({
        docs: dummyQuestions,
      }),
      count: vi.fn().mockResolvedValue({
        totalDocs: 0,
      }),
      delete: vi.fn().mockResolvedValue({
        id: 1,
      }),
      create: vi.fn().mockImplementation(({ collection, data }) => {
        if (collection === 'leads') {
          leadsCreated.push(data)
          return Promise.resolve({ id: 101, ...data })
        }
        if (collection === 'diagnosticResults') {
          resultsCreated.push(data)
          return Promise.resolve({ id: 201, ...data })
        }
        if (collection === 'rateLimitHits') {
          return Promise.resolve({ id: 301, ...data })
        }
        return Promise.resolve({ id: 999, ...data })
      }),
    } as unknown as Payload

    return { mockPayload, leadsCreated, resultsCreated }
  }

  it('Schema bắt lỗi tiếng Việt khi nhập email nhưng không tick đồng ý chính sách bảo mật', () => {
    const invalidInput = {
      answers: [{ questionId: 1, score: 3 }],
      email: 'khachhang@example.com',
      consent: false,
    }

    const parseResult = diagnosticSubmissionSchema.safeParse(invalidInput)
    expect(parseResult.success).toBe(false)
    if (!parseResult.success) {
      const consentError = parseResult.error.issues.find((issue) => issue.path.includes('consent'))
      expect(consentError).toBeDefined()
      expect(consentError?.message).toBe(viStrings.forms.validation.consentRequired)
    }
  })

  it('Schema bắt lỗi tiếng Việt khi email sai định dạng', () => {
    const invalidInput = {
      answers: [{ questionId: 1, score: 3 }],
      email: 'invalid-email-format',
      consent: true,
    }

    const parseResult = diagnosticSubmissionSchema.safeParse(invalidInput)
    expect(parseResult.success).toBe(false)
    if (!parseResult.success) {
      const emailError = parseResult.error.issues.find((issue) => issue.path.includes('email'))
      expect(emailError).toBeDefined()
      expect(emailError?.message).toBe(viStrings.forms.validation.emailInvalid)
    }
  })

  it('Không nhập email: Vẫn xem được kết quả và KHÔNG tạo lead trong collection leads', async () => {
    const { mockPayload, leadsCreated, resultsCreated } = createMockPayload()

    const input: DiagnosticSubmissionInput = {
      answers: [
        { questionId: 1, score: 2 },
        { questionId: 2, score: 4 }, // Response = 4 -> Response thắng
      ],
      email: '',
      consent: false,
    }

    const res = await submitDiagnostic(input, {}, { payload: mockPayload })

    expect(res.success).toBe(true)
    expect(res.data?.topStage).toBe('response')
    expect(res.data?.scores.response).toBe(4)
    expect(res.data?.averageScores.response).toBe(4.0)

    // KHÔNG tạo lead khi không có email
    expect(leadsCreated).toHaveLength(0)

    // VẪN lưu bản ghi diagnosticResults
    expect(resultsCreated).toHaveLength(1)
    expect(resultsCreated[0]?.email).toBeNull()
    expect(resultsCreated[0]?.topStage).toBe('response')
  })

  it('Không nhập email vẫn bị giới hạn tần suất theo IP (chống spam bảng diagnosticResults)', async () => {
    const { mockPayload, resultsCreated } = createMockPayload()
    // The IP already has 5 hits in the window.
    ;(mockPayload.count as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ totalDocs: 5 })

    const input: DiagnosticSubmissionInput = {
      answers: [{ questionId: 2, score: 4 }],
      email: '',
      consent: false,
    }

    await expect(
      submitDiagnostic(input, { ip: '203.0.113.9' }, { payload: mockPayload }),
    ).rejects.toThrow()
    expect(resultsCreated).toHaveLength(0)
  })

  it('Chấm lại hoàn toàn phía SERVER: không tin điểm hay topStage giả mạo từ client', async () => {
    const { mockPayload, resultsCreated } = createMockPayload()

    // Client gửi answers chứng minh Cue = 4, Response = 1, nhưng client cố gắng truyền thêm topStage: 'reward'
    const input = {
      answers: [
        { questionId: 1, score: 4 }, // Cue = 4
        { questionId: 2, score: 1 }, // Response = 1
      ],
      topStage: 'reward', // Cố tình giả mạo
    }

    const res = await submitDiagnostic(
      input as unknown as DiagnosticSubmissionInput,
      {},
      {
        payload: mockPayload,
      },
    )

    expect(res.success).toBe(true)
    // Server tự chấm lại và kết luận Cue thắng, không bị lừa bởi 'reward'
    expect(res.data?.topStage).toBe('cue')
    expect(resultsCreated[0]?.topStage).toBe('cue')
  })

  it('Nhập email hợp lệ kèm consent: Tạo lead thành công và lưu diagnosticResults có email', async () => {
    const { mockPayload, leadsCreated, resultsCreated } = createMockPayload()

    const input: DiagnosticSubmissionInput = {
      answers: [
        { questionId: 1, score: 4 },
        { questionId: 2, score: 2 },
      ],
      email: 'HANA.test@example.com ',
      consent: true,
    }

    const res = await submitDiagnostic(input, {}, { payload: mockPayload })

    expect(res.success).toBe(true)
    expect(res.data?.topStage).toBe('cue')

    // Kiểm tra tạo Lead
    expect(leadsCreated).toHaveLength(1)
    expect(leadsCreated[0]?.email).toBe('hana.test@example.com')
    expect(leadsCreated[0]?.need).toBe('personal')
    expect(leadsCreated[0]?.interestTags).toEqual([{ text: 'diagnostic' }, { text: 'stage:cue' }])

    // Kiểm tra lưu DiagnosticResults
    expect(resultsCreated).toHaveLength(1)
    expect(resultsCreated[0]?.email).toBe('hana.test@example.com')
    expect(resultsCreated[0]?.topStage).toBe('cue')
  })
})
