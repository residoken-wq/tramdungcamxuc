import React from 'react'
import { JourneyStep } from './JourneyStep'
import { JourneyStepsMotion } from './JourneyStepsMotion'
import { EmptySlotHint } from '@/components/ui/EmptySlotHint'
import { TwoToneTitle } from '@/components/ui/TwoToneTitle'
import { textTarget } from '@/puck/style/text-target'

export interface JourneyStepsProps {
  version?: number
  variant?: 'circles' | 'cards' | 'list'
  columns?: 3 | 4 | 5 | 6 | '3' | '4' | '5' | '6'
  cardAlign?: 'inherit' | 'left' | 'center'
  steps?: React.ReactNode | React.ComponentType | unknown[]
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  emotionLine?: string
  // Legacy v1/v2 props (for backward compatibility):
  highlightStep?: number
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
  puck?: {
    isEditing?: boolean
  }
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

function getGridColsClass(cols: number | string = 5) {
  const count = Number(cols) || 5
  switch (count) {
    case 3:
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-4xl'
    case 4:
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-5xl'
    case 6:
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 max-w-6xl'
    case 5:
    default:
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5 max-w-5xl'
  }
}

export function JourneySteps({
  id,
  variant = 'circles',
  columns = 5,
  cardAlign = 'inherit',
  steps,
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
  puck,
}: JourneyStepsProps & { id?: string }) {
  const isEditing = Boolean(puck?.isEditing)
  const isDeepNavy = bgColor === 'deep-navy'
  const seriesLabelColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const titleLine2ColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'

  const hasHeader = Boolean(titleLine1 || titleLine2 || seriesLabel)

  const listClasses = 'max-w-3xl mx-auto space-y-4 sm:space-y-5 [counter-reset:step-counter]'
  const gridClasses = `mx-auto grid ${getGridColsClass(columns)} gap-4 sm:gap-6 [counter-reset:step-counter]`
  const containerClasses = variant === 'list' ? listClasses : gridClasses

  const hasSteps = Boolean(steps)

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
        {hasHeader && (
          <div className="text-center mb-10 sm:mb-14 flex flex-col items-center">
            {seriesLabel && (
              <span
                {...textTarget(id, 'seriesLabel')}
                className={`mb-[var(--tdcx-eyebrow-gap,0.75rem)] font-ui text-xs font-bold uppercase tracking-widest ${seriesLabelColorClass}`}
              >
                {seriesLabel}
              </span>
            )}

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight !leading-[var(--tdcx-title-lh,1.3)]">
              <TwoToneTitle
                id={id}
                line1={titleLine1}
                line2={titleLine2}
                line1ClassName={isDeepNavy ? 'text-white' : 'text-deep-navy'}
                line2ClassName={titleLine2ColorClass}
              />
            </h2>

            {emotionLine && (
              <p
                {...textTarget(id, 'emotionLine')}
                className={`mt-[var(--tdcx-emotion-gap,1rem)] font-quote text-lg sm:text-xl italic max-w-2xl ${
                  isDeepNavy ? 'text-white/90' : 'text-deep-navy/85'
                }`}
              >
                {emotionLine}
              </p>
            )}
          </div>
        )}

        <div
          className="group/journey group/grid w-full relative"
          data-variant={variant}
          data-bg={bgColor}
          data-card-align={cardAlign || 'inherit'}
        >
          {variant === 'cards' && (
            <div
              className="hidden lg:block absolute top-[44px] left-10 right-10 h-0.5 border-t-2 border-dashed border-deep-navy/20 group-data-[bg=deep-navy]/journey:border-white/20 z-0"
              aria-hidden="true"
            />
          )}

          <div className="relative z-10">
            <JourneyStepsMotion isEditing={isEditing} variant={variant}>
              {hasSteps ? (
                typeof steps === 'function' ? (
                  <>
                    {React.createElement(
                      steps as React.ComponentType<{
                        className?: string
                        style?: React.CSSProperties
                      }>,
                      {
                        className: containerClasses,
                        style: { counterReset: 'step-counter' },
                      },
                    )}
                    <EmptySlotHint
                      parentId={id}
                      slotName="steps"
                      childLabel="Bước hành trình"
                      isEditing={isEditing}
                      isDeepNavy={isDeepNavy}
                    />
                  </>
                ) : React.isValidElement(steps) ? (
                  <div className={containerClasses} style={{ counterReset: 'step-counter' }}>
                    {steps}
                  </div>
                ) : Array.isArray(steps) ? (
                  <div className={containerClasses} style={{ counterReset: 'step-counter' }}>
                    {steps.map((child: unknown, idx: number) => {
                      if (React.isValidElement(child)) return child
                      if (child && typeof child === 'object') {
                        const item = child as { props?: Record<string, unknown> }
                        if (item.props) {
                          return (
                            <JourneyStep
                              key={typeof item.props.id === 'string' ? item.props.id : idx}
                              index={idx}
                              variant={variant}
                              isDeepNavy={isDeepNavy}
                              {...item.props}
                            />
                          )
                        }
                      }
                      return null
                    })}
                  </div>
                ) : null
              ) : (
                // Legacy v1/v2 rendering fallback
                <div className={containerClasses} style={{ counterReset: 'step-counter' }}>
                  {FIXED_JOURNEY_STEPS.map((fixed, idx) => {
                    const isHighlighted = numericHighlight === idx + 1
                    const subtitle = subtitles[idx]
                    const description = descriptions[idx]

                    return (
                      <JourneyStep
                        key={fixed.key}
                        index={idx}
                        name={fixed.name}
                        subname={fixed.subname}
                        subtitle={subtitle}
                        description={description}
                        highlight={isHighlighted}
                        variant={variant}
                        isDeepNavy={isDeepNavy}
                      />
                    )
                  })}
                </div>
              )}
            </JourneyStepsMotion>
          </div>
        </div>
      </div>
    </section>
  )
}
