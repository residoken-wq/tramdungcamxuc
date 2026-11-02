'use client'

import { useEffect } from 'react'

/**
 * EB-09: Progressive entrance animation handler for public pages.
 *
 * Rules:
 * - If JS is disabled or prefers-reduced-motion is active: elements remain 100% visible immediately.
 * - Only sets `eb-anim-ready` on <html> after confirming motion is permitted.
 * - Uses IntersectionObserver to trigger animations once elements enter the viewport.
 */
export function EntranceAnimator() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motionQuery.matches) {
      return
    }

    const htmlEl = document.documentElement
    htmlEl.classList.add('eb-anim-ready')

    const elements = document.querySelectorAll<HTMLElement>(
      '[data-eb-entrance]:not([data-eb-entrance="none"])',
    )
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('eb-in-view')
            observer.unobserve(entry.target)
          }
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      },
    )

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect()
      // If already in view on load, show immediately
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('eb-in-view')
      } else {
        observer.observe(el)
      }
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  return null
}
