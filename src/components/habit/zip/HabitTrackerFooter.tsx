'use client'

import React from 'react'
import { DEFAULT_DP01_CONTENT, type Dp01FooterContent } from '@/lib/habit/dp01-content'

export interface HabitTrackerFooterProps {
  footerContent?: Dp01FooterContent
}

export function HabitTrackerFooter({
  footerContent = DEFAULT_DP01_CONTENT.footer,
}: HabitTrackerFooterProps) {
  const { slogan, authorInfo, bookCredits } = footerContent
  if (!slogan && !authorInfo && !bookCredits) return null

  return (
    <footer className="w-full mt-14 pt-8 pb-10 border-t border-lavender-mist/80 text-center space-y-4">
      {/* Dòng 1: Slogan */}
      {slogan && (
        <p className="font-quote italic text-base sm:text-lg text-deep-navy font-semibold text-center">
          {slogan}
        </p>
      )}

      {/* Dòng 2: Thông tin Tác giả & Brand */}
      {authorInfo && (
        <p className="font-ui text-xs sm:text-sm text-deep-navy/80 font-medium text-center">
          {authorInfo}
        </p>
      )}

      {/* Dòng 3: Disclaimer/Credit */}
      {bookCredits && (
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-xs sm:text-[13px] text-deep-navy/70 font-ui leading-relaxed text-center">
            {bookCredits}
          </p>
        </div>
      )}
    </footer>
  )
}
