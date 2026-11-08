'use client'

import React, { useEffect, useRef, useState } from 'react'
import { parseStatValue, formatStatNumber } from '@/lib/stat-counter'

export interface StatCounterProps {
  value: string
  className?: string
  isEditing?: boolean
}

/**
 * PK-29 FX-09: Count-up for stat numbers (1200ms cubic-ease-out).
 * Accessible: announces final value to screen readers, SSR renders final value.
 */
export function StatCounter({ value, className = '', isEditing = false }: StatCounterProps) {
  const parsed = parseStatValue(value)
  const [currentVal, setCurrentVal] = useState<number | null>(null)
  const elementRef = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!parsed || isEditing || typeof window === 'undefined') return
    // QA PK-29: matchMedia / IntersectionObserver may be missing (old browsers, tests): stay static.
    if (typeof window.matchMedia !== 'function') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (typeof IntersectionObserver === 'undefined') return

    const node = elementRef.current
    if (!node) return

    let frameId: number | null = null

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          observer.disconnect()

          const startTime = performance.now()
          const start = 0
          const end = parsed.number
          const duration = 1200

          setCurrentVal(0)

          const step = (now: number) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
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
      { threshold: 0.1 },
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
      if (frameId !== null) cancelAnimationFrame(frameId)
    }
  }, [isEditing, parsed?.number])

  if (!parsed) {
    return <span className={className}>{value}</span>
  }

  const isAnimating = currentVal !== null && currentVal !== parsed.number
  const displayNum =
    currentVal !== null
      ? `${parsed.prefix}${formatStatNumber(currentVal, parsed.separator)}${parsed.suffix}`
      : value

  return (
    <span ref={elementRef} className={className}>
      {isAnimating ? (
        <>
          <span aria-hidden="true">{displayNum}</span>
          <span className="sr-only">{value}</span>
        </>
      ) : (
        <span>{value}</span>
      )}
    </span>
  )
}
