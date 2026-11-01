'use client'

import React, { useEffect, useRef, useState } from 'react'
import { typographyClasses, type TypographyDefaults } from './style-defaults'

export interface CounterWidgetProps {
  version?: number
  startNumber?: number
  endNumber?: number
  prefix?: string
  suffix?: string
  thousandSeparator?: '.' | ',' | 'none'
  duration?: number
  label?: string
  align?: 'left' | 'center' | 'right'
}

export function formatCounterNumber(num: number, separator: '.' | ',' | 'none' = '.'): string {
  const rounded = Math.round(num)
  if (separator === 'none') return String(rounded)
  const sep = separator === '.' ? '.' : ','
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep)
}

const COUNTER_DEFAULTS = (align: 'left' | 'center' | 'right'): TypographyDefaults => ({
  textColor: 'text-deep-navy',
  fontFamily: 'font-display',
  fontWeight: 'font-bold',
  fontSize: 'text-4xl sm:text-5xl',
  textAlign: align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left',
  lineHeight: 'leading-none',
})

export function CounterWidget({
  startNumber = 0,
  endNumber = 100,
  prefix = '',
  suffix = '',
  thousandSeparator = '.',
  duration = 2000,
  label = 'Chỉ số thống kê',
  align = 'center',
  _style,
  puck,
}: CounterWidgetProps & { id?: string; _style?: unknown; puck?: { isEditing?: boolean } }) {
  const elementRef = useRef<HTMLDivElement>(null)
  // SSR and initial client state always display the final endNumber
  const [currentVal, setCurrentVal] = useState<number>(endNumber)
  const [hasAnimated, setHasAnimated] = useState<boolean>(false)

  const numberClass = typographyClasses(COUNTER_DEFAULTS(align), _style)
  const isEditing = puck?.isEditing ?? false

  useEffect(() => {
    // In editor or if reduced motion is preferred, keep endNumber without animation
    if (
      isEditing ||
      typeof window === 'undefined' ||
      typeof window.IntersectionObserver !== 'function'
    )
      return
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const node = elementRef.current
    if (!node) return

    let frameId: number | null = null

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          observer.disconnect()

          const startTime = performance.now()
          const start = startNumber
          const end = endNumber

          const step = (now: number) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            // Cubic ease-out
            const ease = 1 - Math.pow(1 - progress, 3)
            const nextVal = Math.round(start + (end - start) * ease)
            setCurrentVal(nextVal)

            if (progress < 1) {
              frameId = requestAnimationFrame(step)
            } else {
              setCurrentVal(end)
            }
          }

          frameId = requestAnimationFrame(step)
        }
      },
      { threshold: 0.2 },
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
      }
    }
  }, [duration, endNumber, hasAnimated, isEditing, startNumber])

  const alignContainerClass =
    align === 'center'
      ? 'items-center text-center'
      : align === 'right'
        ? 'items-end text-right'
        : 'items-start text-left'

  const formattedNum = formatCounterNumber(currentVal, thousandSeparator)

  return (
    <div ref={elementRef} className={`w-full flex flex-col py-2 ${alignContainerClass}`}>
      <div className="flex items-baseline gap-0.5">
        {prefix && <span className={`${numberClass} select-none`}>{prefix}</span>}
        <span className={numberClass}>{formattedNum}</span>
        {suffix && <span className={`${numberClass} select-none`}>{suffix}</span>}
      </div>

      {label && (
        <p className="mt-2 text-deep-navy/75 font-ui text-sm sm:text-base font-medium leading-relaxed">
          {label}
        </p>
      )}
    </div>
  )
}
