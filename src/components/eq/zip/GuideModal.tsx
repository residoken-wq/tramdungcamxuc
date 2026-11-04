'use client'

import React, { useEffect } from 'react'
import { BookOpen, X } from 'lucide-react'

export interface GuideModalProps {
  isOpen: boolean
  onClose: () => void
  quote?: string
}

export function GuideModal({
  isOpen,
  onClose,
  quote = '“Mỗi thẻ là một tấm gương soi chiếu. Không có lá bài đúng hay sai, chỉ có khoảnh khắc bạn chân thật với chính mình.” ♡',
}: GuideModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-navy/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-3xl p-5 sm:p-7 border border-lavender-mist shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-lavender-mist pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-deep-navy to-bright-magenta text-white flex items-center justify-center shadow-soft-md">
              <BookOpen className="w-4 h-4 text-soft-pink" />
            </div>
            <div>
              <h3 id="guide-modal-title" className="font-display text-lg sm:text-xl text-deep-navy uppercase">
                Hướng Dẫn Sử Dụng Bộ Thẻ
              </h3>
              <p className="text-[11px] text-deep-navy/60 font-medium font-ui">
                4 bước tĩnh lặng để lắng nghe và kết nối nội tâm
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hướng dẫn"
            className="w-8 h-8 rounded-full bg-warm-ivory hover:bg-soft-pink text-deep-navy/60 hover:text-deep-navy flex items-center justify-center transition-colors border border-lavender-mist cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: 4 Bước rõ ràng */}
        <div className="space-y-3 text-left font-ui">
          {/* 1. Mở đầu */}
          <div className="p-3.5 rounded-2xl bg-warm-ivory border border-lavender-mist flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-mint-haze text-deep-navy flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              1
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-xs sm:text-sm text-deep-navy">
                  1. Mở đầu
                </h4>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-mint-haze text-deep-navy">
                  Đặt ý định
                </span>
              </div>
              <p className="text-xs text-deep-navy/70 leading-relaxed">
                Đặt ý định cho điều gì trong cuộc sống hay công việc hôm nay? Dành 30 giây thả lỏng và thở sâu.
              </p>
            </div>
          </div>

          {/* 2. Chọn thẻ */}
          <div className="p-3.5 rounded-2xl bg-warm-ivory border border-lavender-mist flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-soft-pink text-bright-magenta flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              2
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-xs sm:text-sm text-deep-navy">
                  2. Chọn thẻ
                </h4>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-soft-pink text-bright-magenta">
                  Gọi tên
                </span>
              </div>
              <p className="text-xs text-deep-navy/70 leading-relaxed">
                Chia sẻ cảm xúc bạn đang gặp — hoặc để trống và rút ngẫu nhiên thông điệp phù hợp cho khoảnh khắc này.
              </p>
            </div>
          </div>

          {/* 3. Thực hiện */}
          <div className="p-3.5 rounded-2xl bg-warm-ivory border border-lavender-mist flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-butter-cream text-deep-navy flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              3
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-xs sm:text-sm text-deep-navy">
                  3. Thực hiện
                </h4>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-butter-cream text-deep-navy">
                  Mặt trước
                </span>
              </div>
              <p className="text-xs text-deep-navy/70 leading-relaxed">
                Đọc từ khóa kèm câu diễn giải ở mặt trước → kết nối cảm nhận và lắng nghe phản hồi của cơ thể và tâm trí.
              </p>
            </div>
          </div>

          {/* 4. Khám phá */}
          <div className="p-3.5 rounded-2xl bg-warm-ivory border border-lavender-mist flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-lavender-mist text-deep-navy flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              4
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-xs sm:text-sm text-deep-navy">
                  4. Khám phá
                </h4>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-lavender-mist text-deep-navy">
                  Mặt sau
                </span>
              </div>
              <p className="text-xs text-deep-navy/70 leading-relaxed">
                Lật thẻ sang mặt sau, trả lời 3 câu hỏi ở mặt sau để đào sâu và kết nối, gói ghém bài học và ghi nhận bản thân.
              </p>
            </div>
          </div>
        </div>

        {/* Note châm ngôn vỗ về */}
        <div className="p-3 rounded-2xl bg-soft-pink/50 border border-soft-pink text-center">
          <p className="font-quote italic text-xs text-bright-magenta">
            {quote}
          </p>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-bright-magenta hover:bg-bright-magenta/90 text-white text-xs sm:text-sm font-semibold shadow-soft-md transition-all active:scale-95 cursor-pointer font-ui"
          >
            Đã hiểu & Tiếp tục trải nghiệm
          </button>
        </div>
      </div>
    </div>
  )
}
