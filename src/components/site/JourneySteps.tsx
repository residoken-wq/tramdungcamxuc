import React from 'react'

export interface JourneyStepsProps {
  version?: number
  variant?: 'circles' | 'cards' | 'list'
  highlightStep?: number
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  emotionLine?: string
  step1Subtitle?: string
  step2Subtitle?: string
  step3Subtitle?: string
  step4Subtitle?: string
  step5Subtitle?: string
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
  variant = 'circles',
  highlightStep = 0,
  seriesLabel,
  titleLine1 = '[MẪU] 5 BƯỚC THẤU HIỂU',
  titleLine2 = '[MẪU] VÀ LÀM CHỦ CẢM XÚC',
  emotionLine,
  step1Subtitle,
  step2Subtitle,
  step3Subtitle,
  step4Subtitle,
  step5Subtitle,
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
  const defaultCardBgClass = isDeepNavy
    ? 'bg-white/10 border-white/20 text-white'
    : 'bg-white border-deep-navy/10 text-deep-navy shadow-soft'
  const defaultStepNumberColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const defaultDescColorClass = isDeepNavy ? 'text-white/85' : 'text-deep-navy/80'

  const descriptions = [
    step1Description || FIXED_JOURNEY_STEPS[0].defaultDesc,
    step2Description || FIXED_JOURNEY_STEPS[1].defaultDesc,
    step3Description || FIXED_JOURNEY_STEPS[2].defaultDesc,
    step4Description || FIXED_JOURNEY_STEPS[3].defaultDesc,
    step5Description || FIXED_JOURNEY_STEPS[4].defaultDesc,
  ]

  const subtitles = [step1Subtitle, step2Subtitle, step3Subtitle, step4Subtitle, step5Subtitle]

  const numericHighlight = Number(highlightStep) || 0

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
              className={`mt-4 font-quote text-lg sm:text-xl italic max-w-2xl ${
                isDeepNavy ? 'text-white/90' : 'text-deep-navy/85'
              }`}
            >
              {emotionLine}
            </p>
          )}
        </div>

        {/* Variant: List (danh sách dọc có số) */}
        {variant === 'list' && (
          <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5">
            {FIXED_JOURNEY_STEPS.map((step, idx) => {
              const isHighlighted = numericHighlight === idx + 1
              const itemBgClass = isHighlighted
                ? 'bg-deep-navy text-white border-deep-navy shadow-md'
                : defaultCardBgClass
              const nameColorClass = isHighlighted || isDeepNavy ? 'text-white' : 'text-deep-navy'
              const subnameBadgeClass =
                isHighlighted || isDeepNavy
                  ? 'bg-white/15 text-soft-pink'
                  : 'bg-soft-pink text-deep-navy'
              const subtitleColorClass =
                isHighlighted || isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
              const descColor = isHighlighted ? 'text-white/85' : defaultDescColorClass

              return (
                <div
                  key={step.key}
                  className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-5 sm:p-6 rounded-card border ${itemBgClass} transition-transform hover:-translate-y-0.5`}
                >
                  <div
                    className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-display text-2xl sm:text-3xl border ${
                      isHighlighted || isDeepNavy
                        ? 'bg-white/10 border-soft-pink/30 text-soft-pink'
                        : 'bg-soft-pink border-bright-magenta/20 text-bright-magenta'
                    }`}
                  >
                    {step.step}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className={`font-ui text-lg sm:text-xl font-bold ${nameColorClass}`}>
                        {step.name}
                      </h3>
                      <span
                        className={`font-ui text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${subnameBadgeClass}`}
                      >
                        {step.subname}
                      </span>
                    </div>

                    {subtitles[idx] && (
                      <p
                        className={`font-ui text-xs sm:text-sm font-semibold mb-1.5 ${subtitleColorClass}`}
                      >
                        {subtitles[idx]}
                      </p>
                    )}

                    <p className={`font-ui text-sm leading-relaxed ${descColor}`}>
                      {descriptions[idx]}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Variant: Cards (card nối nét đứt ngang, desktop 5 cột → mobile dọc) */}
        {variant === 'cards' && (
          <div className="relative">
            {/* Desktop horizontal dashed connector line */}
            <div
              className="hidden lg:block absolute top-[44px] left-10 right-10 h-0.5 border-t-2 border-dashed border-deep-navy/20 z-0"
              aria-hidden="true"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 relative z-10">
              {FIXED_JOURNEY_STEPS.map((step, idx) => {
                const isHighlighted = numericHighlight === idx + 1
                const cardBg = isHighlighted
                  ? 'bg-deep-navy text-white border-deep-navy shadow-md'
                  : defaultCardBgClass
                const stepNumClass = isHighlighted ? 'text-soft-pink' : defaultStepNumberColorClass
                const badgeClass =
                  isHighlighted || isDeepNavy
                    ? 'bg-white/15 text-soft-pink'
                    : 'bg-soft-pink text-deep-navy'
                const nameColor = isHighlighted || isDeepNavy ? 'text-white' : 'text-deep-navy'
                const subtitleColor =
                  isHighlighted || isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
                const descColor = isHighlighted ? 'text-white/85' : defaultDescColorClass

                return (
                  <div
                    key={step.key}
                    className={`flex flex-col p-5 sm:p-6 rounded-card border ${cardBg} transition-transform hover:-translate-y-1`}
                  >
                    {/* Step indicator */}
                    <div className="flex items-baseline justify-between mb-3">
                      <span
                        className={`font-display text-2xl sm:text-3xl tracking-tight ${stepNumClass}`}
                      >
                        {step.step}
                      </span>
                      <span
                        className={`font-ui text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeClass}`}
                      >
                        {step.subname}
                      </span>
                    </div>

                    {/* Step Name */}
                    <h3 className={`font-ui text-lg font-bold mb-1 ${nameColor}`}>{step.name}</h3>

                    {/* Optional Subtitle */}
                    {subtitles[idx] && (
                      <p className={`font-ui text-xs font-semibold mb-2 ${subtitleColor}`}>
                        {subtitles[idx]}
                      </p>
                    )}

                    {/* Description */}
                    <p className={`font-ui text-sm leading-relaxed mt-auto ${descColor}`}>
                      {descriptions[idx]}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Variant: Circles (mặc định / như cũ) */}
        {variant === 'circles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
            {FIXED_JOURNEY_STEPS.map((step, idx) => {
              const isHighlighted = numericHighlight === idx + 1
              const cardBg = isHighlighted
                ? 'bg-deep-navy text-white border-deep-navy shadow-md'
                : defaultCardBgClass
              const stepNumClass = isHighlighted ? 'text-soft-pink' : defaultStepNumberColorClass
              const badgeClass =
                isHighlighted || isDeepNavy
                  ? 'bg-white/15 text-soft-pink'
                  : 'bg-soft-pink text-deep-navy'
              const nameColor = isHighlighted || isDeepNavy ? 'text-white' : 'text-deep-navy'
              const subtitleColor =
                isHighlighted || isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
              const descColor = isHighlighted ? 'text-white/85' : defaultDescColorClass

              return (
                <div
                  key={step.key}
                  className={`flex flex-col p-5 sm:p-6 rounded-card border ${cardBg} transition-transform hover:-translate-y-1`}
                >
                  {/* Step indicator */}
                  <div className="flex items-baseline justify-between mb-3">
                    <span
                      className={`font-display text-2xl sm:text-3xl tracking-tight ${stepNumClass}`}
                    >
                      {step.step}
                    </span>
                    <span
                      className={`font-ui text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeClass}`}
                    >
                      {step.subname}
                    </span>
                  </div>

                  {/* Step Name */}
                  <h3 className={`font-ui text-lg font-bold mb-1 ${nameColor}`}>{step.name}</h3>

                  {/* Optional Subtitle */}
                  {subtitles[idx] && (
                    <p className={`font-ui text-xs font-semibold mb-2 ${subtitleColor}`}>
                      {subtitles[idx]}
                    </p>
                  )}

                  {/* Description editable by Hana */}
                  <p className={`font-ui text-sm leading-relaxed mt-auto ${descColor}`}>
                    {descriptions[idx]}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
