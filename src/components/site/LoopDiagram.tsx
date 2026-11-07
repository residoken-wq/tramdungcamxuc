import React from 'react'
import { TwoToneTitle } from '@/components/ui/TwoToneTitle'

export interface LoopNode {
  label: string
}

export interface LoopDiagramProps {
  version?: number
  seriesLabel?: string
  titleLine1?: string
  titleLine2?: string
  emotionLine?: string
  nodes?: LoopNode[]
  centerText?: string
  bgColor?:
    | 'warm-ivory'
    | 'soft-pink'
    | 'lavender-mist'
    | 'mint-haze'
    | 'butter-cream'
    | 'deep-navy'
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
  md: 'py-12 px-6 sm:px-8',
  lg: 'py-16 px-6 sm:px-12',
} as const

const DEFAULT_NODES: LoopNode[] = [
  { label: '01 · Nhận diện vấn đề' },
  { label: '02 · Hiểu rõ phương pháp' },
  { label: '03 · Hướng dẫn' },
  { label: '04 · Thử nghiệm' },
  { label: '05 · Nhìn lại' },
  { label: '06 · Đúc kết' },
]

export function LoopDiagram({
  seriesLabel,
  titleLine1,
  titleLine2,
  emotionLine,
  nodes = DEFAULT_NODES,
  centerText = 'Hiểu mình và tự tin hơn qua từng trải nghiệm',
  bgColor = 'warm-ivory',
  padding = 'md',
}: LoopDiagramProps) {
  const isDeepNavy = bgColor === 'deep-navy'
  const hasHeader = Boolean(titleLine1 || titleLine2 || seriesLabel)
  const nodeCount = Math.max(3, Math.min(8, nodes.length || DEFAULT_NODES.length))
  const displayNodes = nodes.length > 0 ? nodes : DEFAULT_NODES

  return (
    <section className={`w-full ${BG_COLORS[bgColor]} ${PADDINGS[padding]} transition-colors`}>
      <div className="mx-auto max-w-5xl">
        {hasHeader && (
          <div className="mb-8 sm:mb-12">
            <header className="flex flex-col text-left items-start">
              {seriesLabel && (
                <span
                  className={`mb-[var(--tdcx-eyebrow-gap,1rem)] font-ui text-xs font-bold uppercase tracking-widest ${
                    isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
                  }`}
                >
                  {seriesLabel}
                </span>
              )}
              {titleLine1 && (
                <TwoToneTitle
                  line1={titleLine1}
                  line2={titleLine2}
                  line1ClassName={isDeepNavy ? 'text-white' : 'text-deep-navy'}
                  line2ClassName={isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'}
                />
              )}
              {emotionLine && (
                <p
                  className={`mt-[var(--tdcx-emotion-gap,0.875rem)] font-quote text-lg sm:text-xl italic max-w-2xl ${
                    isDeepNavy ? 'text-white/85' : 'text-deep-navy/85'
                  }`}
                >
                  {emotionLine}
                </p>
              )}
            </header>
          </div>
        )}

        {/* Desktop View: Circular diagram with clockwise arrows */}
        <div
          aria-hidden="true"
          className="hidden md:flex relative items-center justify-center mx-auto my-6 w-full max-w-[520px] aspect-square select-none"
        >
          {/* Circular SVG Track & Clockwise Arrowheads */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 520 520"
            fill="none"
          >
            <circle
              cx="260"
              cy="260"
              r="185"
              stroke={isDeepNavy ? 'rgba(255,255,255,0.2)' : 'rgba(40,10,96,0.15)'}
              strokeWidth="2"
              strokeDasharray="6 6"
            />
            {/* Clockwise curved arrow hints around the circle */}
            <circle
              cx="260"
              cy="260"
              r="185"
              stroke={isDeepNavy ? 'rgba(239,59,131,0.5)' : 'rgba(188,3,158,0.35)'}
              strokeWidth="1.5"
            />
          </svg>

          {/* Center Text (italic) */}
          {centerText && (
            <div className="absolute inset-0 flex items-center justify-center p-12 text-center pointer-events-none">
              <p
                className={`max-w-[210px] font-quote text-base sm:text-lg italic leading-relaxed ${
                  isDeepNavy ? 'text-white/90' : 'text-deep-navy/85'
                }`}
              >
                {centerText}
              </p>
            </div>
          )}

          {/* Nodes positioned in circle */}
          {displayNodes.map((node, idx) => {
            const angleDeg = idx * (360 / nodeCount) - 90
            const angleRad = (angleDeg * Math.PI) / 180
            const radius = 37 // percentage from center
            const left = 50 + radius * Math.cos(angleRad)
            const top = 50 + radius * Math.sin(angleRad)

            // Alternating styling: lavender-mist vs white with deep-navy border
            const isLavender = idx % 2 === 0
            const nodeClass = isDeepNavy
              ? isLavender
                ? 'bg-lavender-mist/90 text-deep-navy border-white/20'
                : 'bg-white/10 text-white border-white/30 backdrop-blur-xs'
              : isLavender
                ? 'bg-lavender-mist text-deep-navy border-deep-navy/15'
                : 'bg-white text-deep-navy border-2 border-deep-navy/40 shadow-soft'

            return (
              <div
                key={idx}
                data-eb-card=""
                style={{
                  position: 'absolute',
                  left: `${left}%`,
                  top: `${top}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`px-4 py-2 rounded-full font-ui text-xs sm:text-sm font-bold border whitespace-nowrap shadow-xs transition-transform hover:scale-105 ${nodeClass}`}
              >
                {node.label}
              </div>
            )
          })}
        </div>

        {/* Mobile View & Accessible Semantic Markup: <ol> */}
        <div className="w-full md:hidden">
          <ol className="flex flex-col gap-2.5">
            {displayNodes.map((node, idx) => {
              const isLavender = idx % 2 === 0
              const nodeClass = isDeepNavy
                ? isLavender
                  ? 'bg-lavender-mist/90 text-deep-navy border-white/20'
                  : 'bg-white/10 text-white border-white/30'
                : isLavender
                  ? 'bg-lavender-mist text-deep-navy border-deep-navy/15'
                  : 'bg-white text-deep-navy border-2 border-deep-navy/40 shadow-soft'

              return (
                <li key={idx} className="flex flex-col items-center">
                  <div
                    data-eb-card=""
                    className={`w-full text-center py-3 px-4 rounded-xl font-ui text-sm font-bold border ${nodeClass}`}
                  >
                    {node.label}
                  </div>
                  {idx < displayNodes.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="my-1 text-bright-magenta font-bold text-lg select-none"
                    >
                      ↓
                    </span>
                  )}
                </li>
              )
            })}
          </ol>

          {centerText && (
            <div
              className={`mt-5 p-4 rounded-xl border text-center font-quote italic text-sm sm:text-base leading-relaxed ${
                isDeepNavy
                  ? 'bg-white/5 border-white/15 text-white/90'
                  : 'bg-white border-deep-navy/10 text-deep-navy/85 shadow-soft'
              }`}
            >
              {centerText}
            </div>
          )}
        </div>

        {/* Screen-reader accessible list for desktop (so <ol> is always semantically available) */}
        <ol className="sr-only hidden md:block">
          {displayNodes.map((node, idx) => (
            <li key={idx}>{node.label}</li>
          ))}
        </ol>
      </div>
    </section>
  )
}
