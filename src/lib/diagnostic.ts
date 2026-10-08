/**
 * Module tính điểm và xử lý logic chẩn đoán thói quen (Quiz chẩn đoán /habit/chan-doan).
 * Chứa các hàm thuần (pure functions) để dễ dàng kiểm thử đơn vị.
 */

export type HabitStage = 'cue' | 'craving' | 'response' | 'reward'

/**
 * Thứ tự ưu tiên 4 giai đoạn theo vòng lặp thói quen:
 * Cue (Gợi ý) -> Craving (Khao khát) -> Response (Phản hồi) -> Reward (Phần thưởng).
 * Dùng để giải quyết hòa điểm (Tie-break) theo quy tắc GAPS B8.
 */
export const HABIT_STAGES: readonly HabitStage[] = ['cue', 'craving', 'response', 'reward'] as const

export interface DiagnosticQuestionRef {
  id: number
  stage?: HabitStage | string | null
  statement?: string
  order?: number | null
}

export interface DiagnosticAnswerItem {
  questionId: number
  score: number // 1 đến 4
}

export interface DiagnosticScoreResult {
  scores: Record<HabitStage, number>
  topStage: HabitStage
  secondaryStage: HabitStage | null
  maxScore: number
}

export interface QuestionWithSuggestion extends DiagnosticQuestionRef {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  suggestion?: any
}

export interface DiagnosticSuggestionItem {
  questionId: number
  statement: string
  score?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  suggestion: any
}

/**
 * Chấm điểm bài test chẩn đoán thói quen theo quy tắc GAPS B8:
 * - Tổng điểm theo 4 giai đoạn: cue / craving / response / reward.
 * - Thang điểm mỗi câu: 1–4.
 * - Quy tắc hòa điểm (B8): Nếu có 2 hoặc nhiều giai đoạn hòa điểm cao nhất,
 *   ưu tiên chọn giai đoạn đứng trước theo thứ tự Cue -> Craving -> Response -> Reward.
 * - Giai đoạn thứ 2 (secondaryStage) được hiển thị kèm nếu điểm chênh lệch so với giai đoạn chính <= 1.
 * - Nếu không có giai đoạn nào chênh <= 1 điểm, secondaryStage là null.
 */
export function scoreDiagnostic(
  answers: readonly DiagnosticAnswerItem[] | Record<number | string, number> | null | undefined,
  questions: readonly DiagnosticQuestionRef[] | null | undefined,
): DiagnosticScoreResult {
  // Khởi tạo điểm cho 4 giai đoạn
  const scores: Record<HabitStage, number> = {
    cue: 0,
    craving: 0,
    response: 0,
    reward: 0,
  }

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return {
      scores,
      topStage: 'cue',
      secondaryStage: 'craving',
      maxScore: 0,
    }
  }

  // Chuẩn hóa answers thành Map<questionId, score>
  const answerMap = new Map<number, number>()
  if (answers) {
    if (Array.isArray(answers)) {
      for (const item of answers) {
        if (item && typeof item.questionId === 'number') {
          const scoreNum = Number(item.score)
          if (!isNaN(scoreNum)) {
            // Giới hạn giá trị trong khoảng 1–4
            answerMap.set(item.questionId, Math.max(1, Math.min(4, scoreNum)))
          }
        }
      }
    } else if (typeof answers === 'object') {
      for (const [key, val] of Object.entries(answers)) {
        const qId = Number(key)
        const scoreNum = Number(val)
        if (!isNaN(qId) && !isNaN(scoreNum)) {
          answerMap.set(qId, Math.max(1, Math.min(4, scoreNum)))
        }
      }
    }
  }

  // Cộng điểm theo từng giai đoạn
  for (const q of questions) {
    if (q && q.stage && (HABIT_STAGES as readonly string[]).includes(q.stage)) {
      const stage = q.stage as HabitStage
      const score = answerMap.get(q.id)
      if (typeof score === 'number') {
        scores[stage] += score
      }
    }
  }

  // Tìm điểm cao nhất
  const maxScore = Math.max(scores.cue, scores.craving, scores.response, scores.reward)

  // 1. Giai đoạn chính (topStage): Giai đoạn đầu tiên đạt maxScore theo thứ tự Cue -> Craving -> Response -> Reward
  const topStage = HABIT_STAGES.find((stage) => scores[stage] === maxScore) ?? 'cue'

  // 2. Giai đoạn thứ hai (secondaryStage):
  // Xem xét các giai đoạn còn lại (loại bỏ topStage)
  const remainingStages = HABIT_STAGES.filter((stage) => stage !== topStage)
  const secondMaxScore = Math.max(...remainingStages.map((stage) => scores[stage]))

  let secondaryStage: HabitStage | null = null
  if (maxScore - secondMaxScore <= 1) {
    // Hòa điểm ở vị trí thứ 2 cũng ưu tiên theo thứ tự Cue -> Craving -> Response -> Reward
    secondaryStage = remainingStages.find((stage) => scores[stage] === secondMaxScore) ?? null
  }

  return {
    scores,
    topStage,
    secondaryStage,
    maxScore,
  }
}

/**
 * Trích xuất gợi ý (suggestion) từ CMS cho giai đoạn được chọn theo spec T1-14:
 * - Lấy các câu thuộc giai đoạn đó mà người dùng chọn điểm 3–4 (điểm cao).
 * - Nếu không có câu nào >= 3: lấy gợi ý của câu có điểm cao nhất trong giai đoạn đó.
 * - Chỉ trả về các câu có trường suggestion hợp lệ.
 */
export function selectDiagnosticSuggestions(
  stage: HabitStage,
  questions: readonly QuestionWithSuggestion[],
  answers: readonly DiagnosticAnswerItem[] | Record<number | string, number>,
): DiagnosticSuggestionItem[] {
  if (!questions || questions.length === 0) return []

  // Chuẩn hóa answers thành Map
  const answerMap = new Map<number, number>()
  if (Array.isArray(answers)) {
    for (const item of answers) {
      if (item && typeof item.questionId === 'number') {
        answerMap.set(item.questionId, Number(item.score))
      }
    }
  } else if (typeof answers === 'object') {
    for (const [key, val] of Object.entries(answers)) {
      answerMap.set(Number(key), Number(val))
    }
  }

  // Lọc các câu thuộc giai đoạn này
  const stageQuestions = questions
    .filter((q) => q.stage === stage)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  if (stageQuestions.length === 0) return []

  // 1. Tìm các câu có điểm 3 hoặc 4 và có suggestion
  const highScored = stageQuestions.filter((q) => {
    const score = answerMap.get(q.id) ?? 0
    return score >= 3 && Boolean(q.suggestion)
  })

  if (highScored.length > 0) {
    return highScored.map((q) => ({
      questionId: q.id,
      statement: q.statement || '',
      score: answerMap.get(q.id),
      suggestion: q.suggestion,
    }))
  }

  // 2. Không có câu nào >= 3: Tìm câu có điểm cao nhất có suggestion
  let highestScore = -1
  let bestQuestion: QuestionWithSuggestion | null = null

  for (const q of stageQuestions) {
    if (!q.suggestion) continue
    const score = answerMap.get(q.id) ?? 0
    if (score > highestScore) {
      highestScore = score
      bestQuestion = q
    }
  }

  if (bestQuestion) {
    return [
      {
        questionId: bestQuestion.id,
        statement: bestQuestion.statement || '',
        score: answerMap.get(bestQuestion.id),
        suggestion: bestQuestion.suggestion,
      },
    ]
  }

  return []
}
