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
import { diagnosticSubmissionSchema, type DiagnosticSubmissionInput } from '@/lib/forms/schemas'
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

  describe('scoreDiagnostic() tie-breaking and score difference rules (GAPS B8)', () => {
    it('Trường hợp hòa 2 (Cue và Craving cùng cao nhất): ưu tiên Cue, secondaryStage là Craving', () => {
      // Cue: 4+4+2+2 = 12. Craving: 3+3+3+3 = 12. Response: 2*4=8. Reward: 1*4=4.
      const answers: DiagnosticAnswerItem[] = [
        { questionId: 1, score: 4 },
        { questionId: 2, score: 4 },
        { questionId: 3, score: 2 },
        { questionId: 4, score: 2 },
        { questionId: 5, score: 3 },
        { questionId: 6, score: 3 },
        { questionId: 7, score: 3 },
        { questionId: 8, score: 3 },
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

      expect(result.scores.cue).toBe(12)
      expect(result.scores.craving).toBe(12)
      expect(result.scores.response).toBe(8)
      expect(result.scores.reward).toBe(4)
      expect(result.maxScore).toBe(12)

      // Hòa giữa Cue và Craving -> Cue thắng vì Cue đứng trước Craving
      expect(result.topStage).toBe('cue')
      // Craving bằng điểm (chênh 0 <= 1) -> secondaryStage là craving
      expect(result.secondaryStage).toBe('craving')
    })

    it('Trường hợp hòa 2 giữa Craving và Response: ưu tiên Craving, secondaryStage là Response', () => {
      const answers: DiagnosticAnswerItem[] = [
        { questionId: 1, score: 1 },
        { questionId: 2, score: 1 },
        { questionId: 3, score: 1 },
        { questionId: 4, score: 1 }, // Cue = 4
        { questionId: 5, score: 4 },
        { questionId: 6, score: 4 },
        { questionId: 7, score: 2 },
        { questionId: 8, score: 2 }, // Craving = 12
        { questionId: 9, score: 3 },
        { questionId: 10, score: 3 },
        { questionId: 11, score: 3 },
        { questionId: 12, score: 3 }, // Response = 12
        { questionId: 13, score: 2 },
        { questionId: 14, score: 2 },
        { questionId: 15, score: 2 },
        { questionId: 16, score: 2 }, // Reward = 8
      ]

      const result = scoreDiagnostic(answers, mockQuestions)

      expect(result.scores.craving).toBe(12)
      expect(result.scores.response).toBe(12)
      expect(result.topStage).toBe('craving') // Craving đứng trước Response
      expect(result.secondaryStage).toBe('response')
    })

    it('Trường hợp hòa 4 (tất cả 4 giai đoạn bằng điểm nhau): topStage là Cue, secondaryStage là Craving', () => {
      // Mỗi câu đều chọn 3 điểm -> mỗi giai đoạn 12 điểm
      const answers: DiagnosticAnswerItem[] = mockQuestions.map((q) => ({
        questionId: q.id,
        score: 3,
      }))

      const result = scoreDiagnostic(answers, mockQuestions)

      expect(result.scores.cue).toBe(12)
      expect(result.scores.craving).toBe(12)
      expect(result.scores.response).toBe(12)
      expect(result.scores.reward).toBe(12)
      expect(result.topStage).toBe('cue')
      expect(result.secondaryStage).toBe('craving')
    })

    it('Trường hợp chênh 1 điểm: secondaryStage xuất hiện kèm', () => {
      // Cue: 13 điểm, Craving: 12 điểm, Response: 8, Reward: 6
      const answers: Record<number, number> = {
        1: 4,
        2: 4,
        3: 3,
        4: 2, // Cue = 13
        5: 3,
        6: 3,
        7: 3,
        8: 3, // Craving = 12
        9: 2,
        10: 2,
        11: 2,
        12: 2, // Response = 8
        13: 2,
        14: 2,
        15: 1,
        16: 1, // Reward = 6
      }

      const result = scoreDiagnostic(answers, mockQuestions)

      expect(result.scores.cue).toBe(13)
      expect(result.scores.craving).toBe(12)
      expect(result.maxScore).toBe(13)
      expect(result.topStage).toBe('cue')
      // Chênh lệch 13 - 12 = 1 (<= 1) -> hiển thị secondaryStage
      expect(result.secondaryStage).toBe('craving')
    })

    it('Trường hợp chênh 2 điểm: secondaryStage là null', () => {
      // Response: 15 điểm, Reward: 13 điểm (chênh 2), Cue: 8, Craving: 6
      const answers: Record<number, number> = {
        1: 2,
        2: 2,
        3: 2,
        4: 2, // Cue = 8
        5: 2,
        6: 2,
        7: 1,
        8: 1, // Craving = 6
        9: 4,
        10: 4,
        11: 4,
        12: 3, // Response = 15
        13: 4,
        14: 3,
        15: 3,
        16: 3, // Reward = 13
      }

      const result = scoreDiagnostic(answers, mockQuestions)

      expect(result.scores.response).toBe(15)
      expect(result.scores.reward).toBe(13)
      expect(result.topStage).toBe('response')
      // Chênh lệch 15 - 13 = 2 (> 1) -> secondaryStage không xuất hiện
      expect(result.secondaryStage).toBeNull()
    })

    it('Trường hợp thiếu câu (người dùng chỉ trả lời một phần): tính đúng điểm các câu đã trả lời', () => {
      // Chỉ trả lời duy nhất 2 câu thuộc Response
      const answers: DiagnosticAnswerItem[] = [
        { questionId: 9, score: 4 },
        { questionId: 10, score: 3 },
      ]

      const result = scoreDiagnostic(answers, mockQuestions)

      expect(result.scores.response).toBe(7)
      expect(result.scores.cue).toBe(0)
      expect(result.scores.craving).toBe(0)
      expect(result.scores.reward).toBe(0)
      expect(result.topStage).toBe('response')
      expect(result.secondaryStage).toBeNull()
    })

    it('Giới hạn (clamp) an toàn điểm số mỗi câu trong khoảng 1–4', () => {
      const answers: DiagnosticAnswerItem[] = [
        { questionId: 1, score: 99 }, // clamp to 4
        { questionId: 2, score: -5 }, // clamp to 1
      ]

      const result = scoreDiagnostic(answers, mockQuestions)
      expect(result.scores.cue).toBe(5) // 4 + 1
    })

    it('Hoạt động an toàn khi questions hoặc answers rỗng / null', () => {
      const emptyRes = scoreDiagnostic(null, [])
      expect(emptyRes.topStage).toBe('cue')
      expect(emptyRes.scores.cue).toBe(0)
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

    // KHÔNG tạo lead khi không có email
    expect(leadsCreated).toHaveLength(0)

    // VẪN lưu bản ghi diagnosticResults
    expect(resultsCreated).toHaveLength(1)
    expect(resultsCreated[0]?.email).toBeNull()
    expect(resultsCreated[0]?.topStage).toBe('response')
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
