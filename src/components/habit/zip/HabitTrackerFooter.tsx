'use client'

import React from 'react'

export function HabitTrackerFooter() {
  return (
    <footer className="w-full mt-14 pt-8 pb-10 border-t border-lavender-mist/80 text-center space-y-4">
      {/* Dòng 1: Slogan */}
      <p className="font-quote italic text-base sm:text-lg text-deep-navy font-semibold text-center">
        Dừng lại • Lắng nghe • Sống trọn vẹn hơn
      </p>

      {/* Dòng 2: Thông tin Tác giả & Brand */}
      <p className="font-ui text-xs sm:text-sm text-deep-navy/80 font-medium text-center">
        Hana Lương • Career Clarity Coach • Trạm Dừng Cảm Xúc
      </p>

      {/* Dòng 3: Disclaimer/Credit */}
      <div className="max-w-2xl mx-auto px-4 text-center">
        <p className="text-xs sm:text-[13px] text-deep-navy/70 font-ui leading-relaxed text-center">
          Nội dung chia sẻ có vay mượn chất xám từ bốn cuốn sách nổi tiếng về thói quen —{' '}
          <em className="italic font-medium text-deep-navy/90">Atomic Habits</em>,{' '}
          <em className="italic font-medium text-deep-navy/90">The Power of Habit</em>,{' '}
          <em className="italic font-medium text-deep-navy/90">
            The 7 Habits of Highly Effective People
          </em>
          , <em className="italic font-medium text-deep-navy/90">Hooked</em> — kết hợp với hành
          trình “đập đi, xây lại” nhiều lần của chính mình.
        </p>
      </div>
    </footer>
  )
}
