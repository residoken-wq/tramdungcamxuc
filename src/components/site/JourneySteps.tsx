import React from 'react'

export interface JourneyStepsProps {
  version?: number
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  emotionLine?: string
  step1Description?: string
  step2Description?: string
  step3Description?: string
  step4Description?: string
  step5Description?: string
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
}

const BG_COLORS = {
  'warm-ivory': 'bg-warm-ivory',
  'soft-pink': 'bg-soft-pink',
  'lavender-mist': 'bg-lavender-mist',
  'mint-haze': 'bg-mint-haze',
  'butter-cream': 'bg-butter-cream',
  'deep-navy': 'bg-deep-navy text-white',
} as const

const PADDINGS = {
  sm: 'py-8 px-4 sm:px-6',
  md: 'py-14 px-6 sm:px-8',
  lg: 'py-20 px-6 sm:px-12',
} as const

export const FIXED_JOURNEY_STEPS = [
  {
    step: '01',
    key: 'pause',
    name: 'Pause',
    subname: 'Dừng lại',
    defaultDesc:
      '[MẪU] Tạo khoảng dừng cần thiết giữa kích hoạt và phản ứng, hít thở sâu để lấy lại sự hiện diện.',
  },
  {
    step: '02',
    key: 'feel',
    name: 'Feel',
    subname: 'Cảm nhận',
    defaultDesc:
      '[MẪU] Nhận biết tín hiệu trên cơ thể và cho phép cảm xúc được hiện diện mà không phán xét.',
  },
  {
    step: '03',
    key: 'name',
    name: 'Name',
    subname: 'Gọi tên',
    defaultDesc:
      '[MẪU] Định danh chính xác cảm xúc bạn đang trải qua để làm rõ thông điệp ẩn giấu bên dưới.',
  },
  {
    step: '04',
    key: 'choose',
    name: 'Choose',
    subname: 'Lựa chọn',
    defaultDesc:
      '[MẪU] Chọn phản hồi mang tính xây dựng thay vì phản ứng theo thói quen hay xung lực bản năng.',
  },
  {
    step: '05',
    key: 'practice',
    name: 'Practice',
    subname: 'Thực hành',
    defaultDesc:
      '[MẪU] Đưa hành vi mới vào thực tế hàng ngày, biến thói quen thấu hiểu cảm xúc thành phản xạ tự nhiên.',
  },
] as const

export function JourneySteps({
  seriesLabel,
  titleLine1 = '[MẪU] 5 BƯỚC THẤU HIỂU',
  titleLine2 = '[MẪU] VÀ LÀM CHỦ CẢM XÚC',
  emotionLine,
  step1Description,
  step2Description,
  step3Description,
  step4Description,
  step5Description,
  bgColor = 'warm-ivory',
  padding = 'md',
}: JourneyStepsProps) {
  const isDeepNavy = bgColor === 'deep-navy'
  const seriesLabelColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const titleLine2ColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const cardBgClass = isDeepNavy
    ? 'bg-white/10 border-white/20 text-white'
    : 'bg-white border-deep-navy/10 text-deep-navy shadow-soft'
  const stepNumberColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const descColorClass = isDeepNavy ? 'text-white/85' : 'text-deep-navy/80'

  const descriptions = [
    step1Description || FIXED_JOURNEY_STEPS[0].defaultDesc,
    step2Description || FIXED_JOURNEY_STEPS[1].defaultDesc,
    step3Description || FIXED_JOURNEY_STEPS[2].defaultDesc,
    step4Description || FIXED_JOURNEY_STEPS[3].defaultDesc,
    step5Description || FIXED_JOURNEY_STEPS[4].defaultDesc,
  ]

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-5xl">
        {/* Header Section */}
        <div className="text-center mb-10 sm:mb-14 flex flex-col items-center">
          {seriesLabel && (
            <span
              className={`mb-3 font-ui text-xs font-bold uppercase tracking-widest ${seriesLabelColorClass}`}
            >
              {seriesLabel}
            </span>
          )}

          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight leading-[1.15]">
            <span className={isDeepNavy ? 'text-white' : 'text-deep-navy'}>{titleLine1}</span>{' '}
            <span className={titleLine2ColorClass}>{titleLine2}</span>
          </h2>

          {emotionLine && (
            <p
              className={`mt-4 font-quote text-lg sm:text-xl italic max-w-2xl ${isDeepNavy ? 'text-white/90' : 'text-deep-navy/85'}`}
            >
              {emotionLine}
            </p>
          )}
        </div>

        {/* 5 Steps Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          {FIXED_JOURNEY_STEPS.map((step, idx) => (
            <div
              key={step.key}
              className={`flex flex-col p-5 sm:p-6 rounded-card border ${cardBgClass} transition-transform hover:-translate-y-1`}
            >
              {/* Step indicator */}
              <div className="flex items-baseline justify-between mb-3">
                <span
                  className={`font-display text-2xl sm:text-3xl tracking-tight ${stepNumberColorClass}`}
                >
                  {step.step}
                </span>
                <span
                  className={`font-ui text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isDeepNavy ? 'bg-white/15 text-soft-pink' : 'bg-soft-pink text-deep-navy'
                  }`}
                >
                  {step.subname}
                </span>
              </div>

              {/* Step Name */}
              <h3
                className={`font-ui text-lg font-bold mb-2 ${isDeepNavy ? 'text-white' : 'text-deep-navy'}`}
              >
                {step.name}
              </h3>

              {/* Description editable by Hana */}
              <p className={`font-ui text-sm leading-relaxed mt-auto ${descColorClass}`}>
                {descriptions[idx]}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
