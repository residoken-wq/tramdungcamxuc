'use client'

import React from 'react'
import { ArrowRight } from 'lucide-react'
import type { CleanHabitDiagnose } from '@/lib/habit/journey-content.server'

export interface Step1DiagnoseProps {
  diagnose?: CleanHabitDiagnose | null
  answers: Record<number, number>
  onAnswerChange: (questionId: number, score: number) => void
  onNext: () => void
}

export const DEFAULT_DIAGNOSE_QUESTIONS = [
  { id: 1, text: 'Bạn thường quên bẵng đi thói quen mới nếu không có ai nhắc hoặc lịch báo?', category: 'cue' },
  { id: 2, text: 'Không gian sống hoặc làm việc của bạn không có dấu hiệu trực quan nào nhắc bạn làm việc này?', category: 'cue' },
  { id: 3, text: 'Nghĩ đến việc bắt đầu, bạn thấy chán ngắt và muốn lướt mạng thêm một chút?', category: 'craving' },
  { id: 4, text: 'Bạn không thấy có động lực tức thì hoặc sự thôi thúc nào để bắt tay vào làm?', category: 'craving' },
  { id: 5, text: 'Mỗi lần làm đòi hỏi quá nhiều khâu chuẩn bị, dụng cụ phức tạp hoặc công sức?', category: 'response' },
  { id: 6, text: 'Bạn đặt mục tiêu quá lớn ngay từ đầu (ví dụ: viết 1 bài dài, tập 60 phút) khiến não ngại?', category: 'response' },
  { id: 7, text: 'Làm xong bạn thấy trống rỗng, không có cảm giác chiến thắng hay thỏa mãn nào?', category: 'reward' },
  { id: 8, text: 'Bạn không hề có bất kỳ phần thưởng nhỏ hay sự ghi nhận nào cho bản thân sau khi hoàn thành?', category: 'reward' },
]

export const STAT_CARDS_STEP1 = [
  { stat: '92%', text: 'người từ bỏ mục tiêu năm mới trước khi bước sang tháng Hai.' },
  { stat: '1/3', text: 'thói quen thất bại vì không có thời gian và địa điểm kích hoạt cụ thể.' },
  { stat: '28 ngày', text: 'là khoảng thời gian tối thiểu để não bộ ghi nhận một phản xạ quen thuộc.' },
]

export const CATEGORY_MAP = {
  cue: {
    id: 'cue',
    name: 'Tín hiệu · Cue',
    colorHex: '#3b4991',
    barColor: 'bg-[#3b4991]',
    textColor: 'text-[#3b4991]',
    borderColor: 'border-[#3b4991]',
    diagnosis:
      'Thói quen của bạn chưa có tín hiệu rõ ràng. Nó đang chờ bạn tự nhớ ra — mà trí nhớ thì luôn bận.',
  },
  craving: {
    id: 'craving',
    name: 'Khao khát · Craving',
    colorHex: '#a8325d',
    barColor: 'bg-[#a8325d]',
    textColor: 'text-[#a8325d]',
    borderColor: 'border-[#a8325d]',
    diagnosis:
      'Việc này chưa đủ hấp dẫn với bạn, nên bạn né nó một cách rất tự nhiên — không phải vì lười.',
  },
  response: {
    id: 'response',
    name: 'Phản hồi · Response',
    colorHex: '#b87614',
    barColor: 'bg-[#b87614]',
    textColor: 'text-[#b87614]',
    borderColor: 'border-[#b87614]',
    diagnosis:
      'Mỗi lần bắt đầu đang tốn quá nhiều công sức. Không ai duy trì nổi một việc nặng trong 28 ngày.',
  },
  reward: {
    id: 'reward',
    name: 'Phần thưởng · Reward',
    colorHex: '#23684a',
    barColor: 'bg-[#23684a]',
    textColor: 'text-[#23684a]',
    borderColor: 'border-[#23684a]',
    diagnosis:
      'Bạn chưa nhận được sự ghi nhận nào ngay sau khi làm, nên não chưa thấy việc này đáng để lặp lại.',
  },
}

export function Step1Diagnose({
  diagnose,
  answers,
  onAnswerChange,
  onNext,
}: Step1DiagnoseProps) {
  const questions = diagnose?.questions && diagnose.questions.length > 0
    ? diagnose.questions.map((q, idx) => ({
        id: idx + 1,
        text: q.text,
        category: (q.stage || 'cue').toLowerCase(),
      }))
    : DEFAULT_DIAGNOSE_QUESTIONS

  const answeredCount = Object.values(answers).filter((v) => typeof v === 'number' && v > 0).length
  const isAllAnswered = answeredCount === questions.length

  // Tính điểm trung bình 4 nhóm (thang 1–5 theo quyết định H3)
  const getStageAverage = (stage: string) => {
    const stageQuestions = questions.filter((q) => q.category === stage)
    if (stageQuestions.length === 0) return 0
    let total = 0
    let count = 0
    stageQuestions.forEach((q) => {
      const score = answers[q.id]
      if (typeof score === 'number' && score > 0) {
        total += score
        count++
      }
    })
    return count > 0 ? total / count : 0
  }

  const avgCue = getStageAverage('cue')
  const avgCraving = getStageAverage('craving')
  const avgResponse = getStageAverage('response')
  const avgReward = getStageAverage('reward')

  const categories = [
    { ...CATEGORY_MAP.cue, score: avgCue },
    { ...CATEGORY_MAP.craving, score: avgCraving },
    { ...CATEGORY_MAP.response, score: avgResponse },
    { ...CATEGORY_MAP.reward, score: avgReward },
  ]

  // Tìm nhóm có điểm cao nhất
  let topCategory = categories[0]
  for (let i = 1; i < categories.length; i++) {
    if (categories[i].score > topCategory.score) {
      topCategory = categories[i]
    }
  }

  // H4: Chỉ hiện thẻ số liệu khi có nguồn
  const statCards = diagnose?.statCards
    ? diagnose.statCards.filter((c) => Boolean(c.sourceLabel?.trim()))
    : []

  return (
    <div className="space-y-8">
      {/* 1. Hộp mở đầu */}
      <div className="p-6 sm:p-8 rounded-[20px] bg-white border border-lavender-mist shadow-soft text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-deep-navy via-bright-magenta to-accent-pink" />
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-soft-pink text-bright-magenta text-xs font-semibold uppercase tracking-wider mb-2 font-ui">
          <span>GIAI ĐOẠN 1 · KHÁM THÓI QUEN</span>
        </div>
        <h2 className="font-display text-xl sm:text-2xl text-deep-navy uppercase tracking-wide mb-3">
          Khám đúng “bệnh” — Kê đúng “toa”
        </h2>
        <blockquote className="font-quote italic text-lg sm:text-xl md:text-2xl text-deep-navy max-w-2xl mx-auto leading-relaxed">
          &ldquo;Chúng ta chỉ đang thay đổi thói quen bằng hành động đơn lẻ. Trong khi thứ chúng ta cần là một hệ thống — một vòng lặp — cho thói quen.&rdquo;
        </blockquote>
        <p className="mt-2 font-ui font-semibold text-xs sm:text-sm text-bright-magenta tracking-wide">
          — James Clear, Atomic Habits.
        </p>
      </div>

      {/* Lead-in Text */}
      <p className="text-center text-deep-navy/60 text-sm md:text-base max-w-2xl mx-auto mt-4 mb-8 leading-relaxed font-ui">
        Bạn đã đọc sách, đã lập kế hoạch, đã bắt đầu vài lần. Vấn đề không nằm ở việc bạn thiếu kỷ luật.
      </p>

      {/* 2. Thẻ số liệu (chỉ hiện khi có nguồn per H4) */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statCards.map((item, idx) => {
            const isHighlight = idx === 0
            return (
              <div
                key={idx}
                className={`p-5 rounded-[20px] border shadow-soft flex flex-col justify-between transition-all ${
                  isHighlight
                    ? 'bg-gradient-to-b from-soft-pink/60 to-white border-bright-magenta/35 ring-1 ring-bright-magenta/20 shadow-soft-md'
                    : 'bg-white border-lavender-mist/90'
                }`}
              >
                <div>
                  <div className="mb-2">
                    <span
                      className={`font-display text-3xl sm:text-4xl tracking-tight ${
                        isHighlight ? 'text-bright-magenta font-black' : 'text-deep-navy'
                      }`}
                    >
                      {item.value}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-deep-navy/80 leading-relaxed font-ui">
                    {item.label}
                  </p>
                </div>
                {item.sourceLabel && (
                  <p className="text-[10px] text-deep-navy/40 font-ui mt-3 pt-2 border-t border-lavender-mist/60">
                    {item.sourceLabel}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 3. Khối khảo sát 8 câu */}
      <div className="bg-white rounded-[20px] border border-lavender-mist shadow-soft p-5 sm:p-7 space-y-6">
        <div className="border-b border-lavender-mist/80 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-bright-magenta" />
                <h2 className="font-ui font-bold text-lg text-deep-navy">
                  Khám thói quen qua 8 câu hỏi đơn giản
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-deep-navy/60 font-ui mt-0.5">
                Khám thói quen của bạn thông qua khảo sát nhanh sau đây. Chọn mức độ bạn thấy đúng với mình — khoảng hai phút.
              </p>
            </div>

            <div className="text-xs font-semibold px-3 py-1 rounded-full bg-soft-pink text-bright-magenta border border-bright-magenta/20 self-start sm:self-auto font-ui">
              {answeredCount}/{questions.length}
            </div>
          </div>
        </div>

        {/* List câu hỏi */}
        <div className="space-y-4">
          {questions.map((q) => {
            const currentScore = answers[q.id]
            const hasAnswered = typeof currentScore === 'number' && currentScore > 0

            return (
              <div
                key={q.id}
                className={`p-4 rounded-2xl border transition-all ${
                  hasAnswered
                    ? 'bg-warm-ivory/50 border-lavender-mist'
                    : 'bg-white border-lavender-mist/60 hover:border-bright-magenta/40'
                }`}
              >
                <div className="flex items-start gap-2.5 mb-3">
                  <span className="w-5 h-5 rounded-full bg-soft-pink text-bright-magenta flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5 font-ui">
                    {q.id}
                  </span>
                  <p className="font-ui text-xs sm:text-sm text-deep-navy font-medium leading-relaxed">
                    {q.text}
                  </p>
                </div>

                {/* Dãy 5 nút: số 1, 2, 3, 4, 5 (bấm lại thì bỏ chọn theo H3) */}
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2 pt-1 max-w-md">
                  {[1, 2, 3, 4, 5].map((score) => {
                    const isSelected = hasAnswered && currentScore === score
                    return (
                      <button
                        key={score}
                        type="button"
                        onClick={() => onAnswerChange(q.id, isSelected ? 0 : score)}
                        className={`flex items-center justify-center py-2 rounded-lg border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-bright-magenta text-white border-bright-magenta shadow-sm font-bold'
                            : 'bg-white text-deep-navy/70 border-lavender-mist/80 hover:border-bright-magenta/50 hover:bg-soft-pink/30'
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-bold font-ui">
                          {score}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Dòng chú giải 2 đầu dưới câu 1 */}
                {q.id === 1 && (
                  <div className="flex justify-between text-xs text-deep-navy/55 mt-1.5 max-w-md px-0.5 font-ui">
                    <span>1 · Không bao giờ</span>
                    <span>5 · Rất thường xuyên</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Khi chưa trả lời đủ: dòng chữ nghiêng */}
        {!isAllAnswered && (
          <p className="text-xs sm:text-sm italic text-deep-navy/60 font-ui text-center pt-2">
            Đã trả lời {answeredCount}/{questions.length} câu. Trả lời hết để thấy lỗ hổng trong hệ thống thói quen của bạn.
          </p>
        )}
      </div>

      {/* 4. Khối Kết quả Chẩn đoán */}
      {isAllAnswered && (
        <div className="space-y-4">
          <div
            className={`border-2 rounded-[20px] p-5 sm:p-7 bg-white shadow-soft space-y-5 ${topCategory.borderColor}`}
          >
            <p className="text-xs sm:text-sm text-deep-navy/70 font-ui">
              Lỗ hổng trong hệ thống thói quen của bạn phần lớn đang là…
            </p>

            <h3
              className={`font-display text-2xl sm:text-3xl font-black uppercase tracking-wide ${topCategory.textColor}`}
            >
              {topCategory.name}
            </h3>

            <p className="text-xs sm:text-sm text-deep-navy/85 font-ui leading-relaxed bg-warm-ivory/60 p-3.5 rounded-2xl border border-lavender-mist/60">
              {topCategory.diagnosis}
            </p>

            {/* Biểu đồ 4 thanh ngang theo thang /5 */}
            <div className="space-y-3.5 pt-2 font-ui">
              {[
                { id: 'cue', label: 'Tín hiệu · Cue', score: avgCue, color: 'bg-[#3b4991]' },
                { id: 'craving', label: 'Khao khát · Craving', score: avgCraving, color: 'bg-[#a8325d]' },
                { id: 'response', label: 'Phản hồi · Response', score: avgResponse, color: 'bg-[#b87614]' },
                { id: 'reward', label: 'Phần thưởng · Reward', score: avgReward, color: 'bg-[#23684a]' },
              ].map((item, idx) => {
                const percent = Math.min(100, Math.max(0, (item.score / 5) * 100))
                const isWeakest = item.id === topCategory.id

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between text-xs sm:text-sm transition-opacity duration-200 ${
                      isWeakest ? 'opacity-100' : 'opacity-50'
                    }`}
                  >
                    <div className="w-44 sm:w-52 flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className={`font-semibold ${
                          isWeakest ? 'text-deep-navy font-bold text-sm' : 'text-deep-navy/80'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>

                    <div className="flex-1 mx-3 sm:mx-4 h-3 bg-lavender-mist/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${item.color}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <span
                      className={`w-12 font-bold text-right flex-shrink-0 ${
                        isWeakest ? 'text-deep-navy text-sm font-black' : 'text-deep-navy/70'
                      }`}
                    >
                      {item.score.toFixed(1)}/5
                    </span>
                  </div>
                )
              })}
            </div>

            <p className="text-xs text-deep-navy/55 font-ui italic pt-2 border-t border-lavender-mist/60">
              Điểm càng cao, bạn càng hay vướng ở giai đoạn đó của vòng lặp.
            </p>
          </div>

          {/* Hộp dẫn dắt */}
          <div className="p-5 sm:p-6 rounded-[20px] bg-soft-pink/60 border border-bright-magenta/25 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-deep-navy/85 font-ui leading-relaxed">
              <strong className="text-deep-navy font-bold">Làm sao để lấp lỗ hổng này?</strong>{' '}
              Câu trả lời bắt đầu từ một nguyên lý mà hầu hết mọi người đều nghĩ là mình đã hiểu.
            </p>

            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-bright-magenta hover:bg-bright-magenta/90 text-white text-xs sm:text-sm font-ui font-semibold shadow-soft hover:shadow-soft-md transition-all active:scale-95 flex-shrink-0 cursor-pointer"
            >
              <span>Tiếp · Nguyên lý 1% Better</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
