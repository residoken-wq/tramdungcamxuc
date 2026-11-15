'use client'

import React, { useEffect, useRef } from 'react'
import type { TitleHighlightAnimation } from './TwoToneTitle'

export interface TitleHighlightAnimatorProps {
  children: React.ReactNode
  animation?: TitleHighlightAnimation
  className?: string
}

/**
 * BX-04: Client component kích hoạt hiệu ứng tiêu đề khi phần tử xuất hiện trong khung nhìn (IntersectionObserver).
 * - Không truyền hàm từ server sang client (PK-28 §2.2).
 * - Trạng thái nghỉ là trạng thái cuối: khi chưa animate hoặc không JS/SEO, nội dung vẫn hiển thị đầy đủ.
 * - Tự động tắt khi người dùng bật prefers-reduced-motion: reduce.
 * - Trong builder: khi đổi animation prop, useEffect sẽ chạy lại để xem trước.
 */
export function TitleHighlightAnimator({
  children,
  animation = 'none',
  className = '',
}: TitleHighlightAnimatorProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (animation === 'none') {
      el.classList.remove('title-anim-active')
      return
    }

    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    ) {
      el.classList.remove('title-anim-active')
      return
    }

    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('title-anim-active')
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.remove('title-anim-active')
            requestAnimationFrame(() => {
              el.classList.add('title-anim-active')
            })
            observer.disconnect()
          }
        })
      },
      { threshold: 0.1 },
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
    }
  }, [animation])

  if (!animation || animation === 'none') {
    return <>{children}</>
  }

  return (
    <span
      ref={ref}
      className={`inline title-anim-wrapper title-anim-${animation} ${className}`}
      data-title-animation={animation}
    >
      {children}
    </span>
  )
}
