'use client'

import React, { useEffect, useRef, useState } from 'react'

export interface JourneyStepsMotionProps {
  children: React.ReactNode
  isEditing?: boolean
  variant?: 'circles' | 'cards' | 'list'
}

/**
 * PK-29 FX-05: Journey Steps progressive glow when scrolling into viewport.
 * Pure wrapper receiving only children to keep RSC / slot safety.
 */
export function JourneyStepsMotion({
  children,
  isEditing = false,
  variant = 'circles',
}: JourneyStepsMotionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null)

  useEffect(() => {
    if (isEditing || typeof window === 'undefined') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches) return

    const container = containerRef.current
    if (!container) return

    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          ticking = false
          const cards = container.querySelectorAll<HTMLElement>('[data-eb-card]')
          if (cards.length === 0) return

          const viewportCenter = window.innerHeight / 2
          let closestIndex = -1
          let closestDist = Infinity

          cards.forEach((card, idx) => {
            const rect = card.getBoundingClientRect()
            if (rect.top <= window.innerHeight && rect.bottom >= 0) {
              const cardCenter = rect.top + rect.height / 2
              const dist = Math.abs(cardCenter - viewportCenter)
              if (dist < closestDist) {
                closestDist = dist
                closestIndex = idx
              }
            }
          })

          if (closestIndex !== -1) {
            setActiveStepIndex(closestIndex)
            cards.forEach((card, idx) => {
              if (idx === closestIndex) {
                card.classList.add('eb-step-active')
              } else {
                card.classList.remove('eb-step-active')
              }
            })
          }
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isEditing])

  const progressRatio =
    activeStepIndex !== null ? Math.min(Math.max(activeStepIndex / 4, 0), 1) : 0

  return (
    <div ref={containerRef} className="relative w-full eb-journey-motion">
      {variant === 'cards' && (
        <div
          className="hidden lg:block absolute top-[44px] left-10 right-10 h-0.5 bg-bright-magenta z-0 origin-left transition-transform pointer-events-none"
          style={{
            transform: `scaleX(${progressRatio})`,
            transitionDuration: 'var(--motion-base, 320ms)',
            transitionTimingFunction: 'var(--motion-ease-out, cubic-bezier(.22,1,.36,1))',
          }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  )
}

