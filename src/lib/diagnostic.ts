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

export const DIAGNOSTIC_SCALE_MIN = 1
export const DIAGNOSTIC_SCALE_MAX = 5
/**
 * Ngưỡng chênh lệch điểm trung bình để xác định giai đoạn phụ (secondaryStage).
 * Đề xuất 0.5 điểm trên thang 1–5 (tương đương 12.5% dải điểm, tương ứng với nửa bậc thang đo Likert),
 * giúp phát hiện điểm nghẽn sát nút một cách chính xác mà không quá rộng.
 */
export const DIAGNOSTIC_SECONDARY_THRESHOLD = 0.5

export interface DiagnosticQuestionRef {
  id: number
  stage?: HabitStage | string | null
  statement?: string
  order?: number | null
}

export interface DiagnosticAnswerItem {
  questionId: number
  score: number // 1 đến 5 (DIAGNOSTIC_SCALE_MAX)
}

export interface DiagnosticScoreResult {
  scores: Record<HabitStage, number> // Tổng điểm các câu đã trả lời mỗi giai đoạn
  averageScores: Record<HabitStage, number> // Điểm trung bình mỗi giai đoạn (làm tròn 1 chữ số thập phân)
  topStage: HabitStage
  secondaryStage: HabitStage | null
  maxScore: number // Điểm trung bình cao nhất (làm tròn 1 chữ số thập phân)
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
 * Chấm điểm bài test chẩn đoán thói quen theo quyết định H1, H2 (10/10/2026, T2-12):
 * - Thang điểm mỗi câu: 1–5 (DIAGNOSTIC_SCALE_MIN đến DIAGNOSTIC_SCALE_MAX).
 * - Điểm mỗi giai đoạn: Tính theo ĐIỂM TRUNG BÌNH = (tổng điểm) / (số câu đã trả lời của giai đoạn đó).
 * - Làm tròn điểm trung bình 1 chữ số thập phân.
 * - Giai đoạn không có câu nào được trả lời sẽ bị loại khỏi so sánh xếp hạng.
 * - Quy tắc hòa điểm (GAPS B8): Nếu có từ 2 giai đoạn trở lên có cùng điểm trung bình cao nhất,
 *   ưu tiên chọn giai đoạn đứng trước theo thứ tự tự nhiên: Cue -> Craving -> Response -> Reward.
 * - Giai đoạn phụ (secondaryStage): Được ghi nhận nếu có chênh lệch so với giai đoạn cao nhất
 *   <= DIAGNOSTIC_SECONDARY_THRESHOLD (0.5 điểm). Nếu không có giai đoạn nào thỏa mãn, secondaryStage là null.
 */
export function scoreDiagnostic(
  answers: readonly DiagnosticAnswerItem[] | Record<number | string, number> | null | undefined,
  questions: readonly DiagnosticQuestionRef[] | null | undefined,
): DiagnosticScoreResult {
  // Khởi tạo điểm tổng và điểm trung bình cho 4 giai đoạn
  const scores: Record<HabitStage, number> = {
    cue: 0,
    craving: 0,
    response: 0,
    reward: 0,
  }

  const averageScores: Record<HabitStage, number> = {
    cue: 0,
    craving: 0,
    response: 0,
    reward: 0,
  }

  const answeredCounts: Record<HabitStage, number> = {
    cue: 0,
    craving: 0,
    response: 0,
    reward: 0,
  }

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return {
      scores,
      averageScores,
      topStage: 'cue',
      secondaryStage: null,
      maxScore: 0,
    }
  }

  // Chuẩn hóa answers thành Map<questionId, score> với giá trị được kẹp an toàn 1..5
  const answerMap = new Map<number, number>()
  if (answers) {
    if (Array.isArray(answers)) {
      for (const item of answers) {
        if (item && typeof item.questionId === 'number') {
          const scoreNum = Number(item.score)
          if (!isNaN(scoreNum)) {
            // Giới hạn giá trị trong khoảng DIAGNOSTIC_SCALE_MIN–DIAGNOSTIC_SCALE_MAX
            answerMap.set(
              item.questionId,
              Math.max(DIAGNOSTIC_SCALE_MIN, Math.min(DIAGNOSTIC_SCALE_MAX, scoreNum)),
            )
          }
        }
      }
    } else if (typeof answers === 'object') {
      for (const [key, val] of Object.entries(answers)) {
        const qId = Number(key)
        const scoreNum = Number(val)
        if (!isNaN(qId) && !isNaN(scoreNum)) {
          answerMap.set(
            qId,
            Math.max(DIAGNOSTIC_SCALE_MIN, Math.min(DIAGNOSTIC_SCALE_MAX, scoreNum)),
          )
        }
      }
    }
  }

  // Cộng điểm và đếm số câu đã trả lời theo từng giai đoạn
  for (const q of questions) {
    if (q && q.stage && (HABIT_STAGES as readonly string[]).includes(q.stage)) {
      const stage = q.stage as HabitStage
      const score = answerMap.get(q.id)
      if (typeof score === 'number') {
        scores[stage] += score
        answeredCounts[stage] += 1
      }
    }
  }

  // Tính điểm trung bình cho từng giai đoạn (làm tròn 1 chữ số thập phân)
  for (const stage of HABIT_STAGES) {
    const count = answeredCounts[stage]
    if (count > 0) {
      averageScores[stage] = Math.round((scores[stage] / count) * 10) / 10
    } else {
      averageScores[stage] = 0
    }
  }

  // Lọc các giai đoạn có ít nhất 1 câu được trả lời (giai đoạn không có câu nào bị loại khỏi so sánh)
  const activeStages = HABIT_STAGES.filter((stage) => answeredCounts[stage] > 0)

  if (activeStages.length === 0) {
    return {
      scores,
      averageScores,
      topStage: 'cue',
      secondaryStage: null,
      maxScore: 0,
    }
  }

  // Tìm điểm trung bình cao nhất trong các giai đoạn có câu trả lời
  const maxScore = Math.max(...activeStages.map((stage) => averageScores[stage]))

  // 1. Giai đoạn chính (topStage): Giai đoạn đầu tiên đạt maxScore theo thứ tự B8 (Cue -> Craving -> Response -> Reward)
  const topStage =
    activeStages.find((stage) => averageScores[stage] === maxScore) ?? activeStages[0]

  // 2. Giai đoạn thứ hai (secondaryStage):
  // Xem xét các giai đoạn còn lại có câu trả lời (loại bỏ topStage)
  const remainingStages = activeStages.filter((stage) => stage !== topStage)

  let secondaryStage: HabitStage | null = null
  if (remainingStages.length > 0) {
    const secondMaxScore = Math.max(...remainingStages.map((stage) => averageScores[stage]))
    const diff = Math.round((maxScore - secondMaxScore) * 10) / 10

    if (diff <= DIAGNOSTIC_SECONDARY_THRESHOLD) {
      // Hòa điểm ở vị trí thứ 2 cũng ưu tiên theo thứ tự B8
      secondaryStage =
        remainingStages.find((stage) => averageScores[stage] === secondMaxScore) ?? null
    }
  }

  return {
    scores,
    averageScores,
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
