'use client'

import React, { useState } from 'react'
import { ArrowLeft, ArrowRight, Info } from 'lucide-react'
import { StepQuoteHeader } from '../StepQuoteHeader'
import type { CleanHabitOnePercent, CleanTitledText } from '@/lib/habit/journey-content.server'
import { DEFAULT_DP01_CONTENT, type Dp01Step2Content } from '@/lib/habit/dp01-content'
import { vi } from '@/lib/i18n/vi'

export interface Step2PercentPrincipleProps {
  onePercent?: CleanHabitOnePercent | null
  onePercentUnknowns?: CleanTitledText[]
  step2Content?: Dp01Step2Content
  onNext: () => void
  onPrev: () => void
}

export function Step2PercentPrinciple({
  onePercent,
  onePercentUnknowns,
  step2Content = DEFAULT_DP01_CONTENT.step2,
  onNext,
  onPrev,
}: Step2PercentPrincipleProps) {
  // Slider days (0 to 365) - khởi tạo theo CMS maxDays nếu có hoặc mặc định 21 ngày
  const [days, setDays] = useState<number>(() => onePercent?.maxDays ?? 21)

  const unknownItems =
    onePercentUnknowns && onePercentUnknowns.length > 0
      ? onePercentUnknowns
      : [
          {
            title: '1. Giai đoạn thất vọng',
            content:
              'Bạn chỉ phát huy được tiềm năng của mình sau khi đi qua giai đoạn thất vọng — quãng mà kết quả thấp hơn hẳn công sức bỏ ra.',
          },
          {
            title: '2. Tin vào tiến trình',
            content:
              'Bí quyết đi qua giai đoạn đó là tin vào tiến trình thay vì kết quả. Tiến trình là số lần bạn đã làm, không phải kết quả bạn đã thấy.',
          },
          {
            title: '3. Tư duy phù hợp',
            content:
              'Tiến trình dễ hơn rất nhiều khi bạn có tư duy và phương pháp hợp với mình — chứ không phải phương pháp hợp với người bạn đang ngưỡng mộ.',
          },
        ]

  return (
    <div className="space-y-8" data-testid="one-percent-section">
      {/* 1. Quote Block */}
      <StepQuoteHeader
        stage="GIAI ĐOẠN 1 · KHÁM THÓI QUEN"
        title={onePercent?.title || 'Nguyên lý 1% tốt hơn mỗi ngày'}
        quote="“Thay đổi thói quen thực ra là thay đổi tư duy.”"
        author="— Robert Kiyosaki, Cha giàu Cha nghèo —"
      />

      {/* Lead-in Text */}
      <p className="text-center text-deep-navy/60 text-sm md:text-base max-w-2xl mx-auto mt-4 mb-8 leading-relaxed font-ui">
        {step2Content.leadIn}
      </p>

      {/* 2. Biểu đồ "Vùng năng lực tiềm ẩn" */}
      <div className="bg-white rounded-[20px] border border-lavender-mist shadow-soft p-5 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-lavender-mist/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-bright-magenta" />
              <h2 className="font-ui font-bold text-lg text-deep-navy">
                {step2Content.chartTitle}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-deep-navy/60 font-ui mt-0.5">
              {step2Content.chartSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-ui">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-deep-navy/40 border-t border-dashed border-deep-navy" />
              <span className="text-deep-navy/70">Tôi nghĩ sẽ là</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-bright-magenta rounded-full" />
              <span className="font-bold text-bright-magenta">Thực tế diễn ra</span>
            </div>
          </div>
        </div>

        {/* SVG Curve Chart (giữ hex minh họa per C1) */}
        <div className="relative w-full bg-warm-ivory/60 rounded-2xl border border-lavender-mist/60 overflow-hidden">
          <svg viewBox="0 0 600 400" className="w-full h-auto font-sans">
            {/* 1. TRỤC & NHÃN */}
            <text
              transform="rotate(-90)"
              x="-180"
              y="30"
              fill="#4a5568"
              fontSize="13"
              fontWeight="600"
              fontFamily="Montserrat, sans-serif"
            >
              Mức phát triển
            </text>
            <line x1="100" y1="40" x2="100" y2="290" stroke="#e2e8f0" strokeWidth="1.5" />
            <line x1="100" y1="290" x2="510" y2="290" stroke="#e2e8f0" strokeWidth="1" />
            <text
              x="80"
              y="295"
              fill="#2d3748"
              fontSize="14"
              fontWeight="bold"
              fontFamily="Montserrat, sans-serif"
            >
              1
            </text>
            <text
              x="475"
              y="312"
              fill="#718096"
              fontSize="12"
              fontWeight="500"
              fontFamily="Montserrat, sans-serif"
            >
              1 năm
            </text>

            {/* 2. KHỐI MỜ VÙNG NĂNG LỰC TIỀM ẨN */}
            <rect x="100" y="65" width="260" height="225" fill="#fdf2fa" opacity="0.6" />
            <text
              x="110"
              y="90"
              fill="#8A2E3B"
              fontSize="13"
              fontWeight="bold"
              letterSpacing="0.05em"
              fontFamily="Montserrat, sans-serif"
            >
              VÙNG NĂNG LỰC TIỀM ẨN
            </text>

            {/* 3. VÙNG RÂM GIAI ĐOẠN THẤT VỌNG */}
            <path d="M 100 290 Q 250 282 355 210 L 100 290 Z" fill="#3b5998" opacity="0.1" />
            <text
              x="130"
              y="276"
              fill="#2B4C7E"
              fontSize="11"
              fontWeight="bold"
              fontFamily="Montserrat, sans-serif"
            >
              Giai đoạn thất vọng
            </text>

            {/* 4. ĐƯỜNG NÉT ĐỨT "Tôi nghĩ sẽ là" */}
            <path
              d="M 100 290 L 510 160"
              stroke="#4a5568"
              strokeDasharray="4 4"
              strokeWidth="1.5"
              fill="none"
            />
            <text
              x="415"
              y="152"
              fill="#4a5568"
              fontSize="12"
              fontWeight="bold"
              fontFamily="Montserrat, sans-serif"
            >
              Tôi nghĩ sẽ là
            </text>

            {/* 5. ĐƯỜNG CONG XANH "Thực tế là" */}
            <path
              d="M 100 290 C 220 290, 310 260, 355 210 C 380 182, 430 115, 510 70"
              stroke="#2B4C7E"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />
            <text
              x="445"
              y="58"
              fill="#2B4C7E"
              fontSize="12"
              fontWeight="bold"
              fontFamily="Montserrat, sans-serif"
            >
              Thực tế là
            </text>

            {/* 6. ĐƯỜNG ĐỎ MẬN "Tệ hơn 1% mỗi ngày" */}
            <line x1="100" y1="290" x2="510" y2="320" stroke="#a73a52" strokeWidth="2.5" />
            <text
              x="370"
              y="345"
              fill="#a73a52"
              fontSize="12"
              fontWeight="bold"
              fontFamily="Montserrat, sans-serif"
            >
              Tệ hơn 1% mỗi ngày
            </text>

            {/* 7. ĐIỂM BỨT PHÁ */}
            <circle cx="355" cy="210" r="7" fill="#a73a52" />
            <line
              x1="340"
              y1="200"
              x2="270"
              y2="192"
              stroke="#a73a52"
              strokeWidth="1"
              strokeDasharray="3 2"
              opacity="0.6"
            />
            <text
              x="190"
              y="192"
              fill="#a73a52"
              fontSize="13"
              fontWeight="bold"
              fontFamily="Montserrat, sans-serif"
            >
              Điểm bứt phá
            </text>
          </svg>
        </div>

        {/* Bottom axis labels */}
        <div className="flex justify-between text-[11px] font-ui text-deep-navy/70 pt-2 border-t border-lavender-mist/40">
          <span>Ngày 1 (Khởi hành)</span>
          <span>Ngày 14 (Tạo đà)</span>
          <span className="font-semibold text-bright-magenta">Ngày 28 (Vượt ngưỡng)</span>
          <span>Sau 1 năm (Vững vàng)</span>
        </div>
      </div>

      {/* 3. Tương tác "Kéo thử: sau N ngày" */}
      <div className="bg-white rounded-[20px] border border-lavender-mist shadow-soft p-5 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-lavender-mist/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-bright-magenta" />
              <h2 className="font-ui font-bold text-lg text-deep-navy">Kéo thử: sau {days} ngày</h2>
            </div>
            <p className="text-xs sm:text-sm text-deep-navy/60 font-ui mt-0.5">
              Mô phỏng sức mạnh của việc tốt hơn hoặc tệ hơn 1% mỗi ngày
            </p>
          </div>

          <div className="px-3 py-1 rounded-full bg-bright-magenta/10 text-bright-magenta font-ui font-bold text-xs">
            {days} ngày
          </div>
        </div>

        {/* Range Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={onePercent?.maxDays ?? 365}
            step={1}
            value={days}
            aria-valuenow={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-full h-2.5 bg-lavender-mist rounded-lg appearance-none cursor-pointer accent-bright-magenta"
          />
          <div className="flex justify-between text-[11px] font-ui text-deep-navy/70">
            <span>7 ngày</span>
            <span className="text-bright-magenta font-semibold">28 ngày</span>
            <span>90 ngày</span>
            <span>365 ngày</span>
          </div>
        </div>

        {/* 2 Card kết quả so sánh */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Card Tốt hơn: 1,01^n */}
          <div className="p-5 rounded-[20px] bg-white border border-mint-haze shadow-soft">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-deep-navy/70">1,01^{days}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-mint-haze text-deep-navy">
                +1%
              </span>
            </div>
            <div className="my-2">
              <span className="font-display text-4xl sm:text-5xl text-deep-navy">
                {(1.01 ** days).toFixed(2).replace('.', ',')}
              </span>
            </div>
            <p className="text-xs text-deep-navy/70 font-ui font-medium">tốt hơn 1% mỗi ngày</p>
          </div>

          {/* Card Tệ hơn: 0,99^n */}
          <div className="p-5 rounded-[20px] bg-white border border-bright-magenta/20 shadow-soft">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-deep-navy/70">0,99^{days}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-soft-pink text-bright-magenta">
                -1%
              </span>
            </div>
            <div className="my-2">
              <span className="font-display text-4xl sm:text-5xl text-deep-navy/80">
                {(0.99 ** days).toFixed(2).replace('.', ',')}
              </span>
            </div>
            <p className="text-xs text-deep-navy/70 font-ui font-medium">tệ hơn 1% mỗi ngày</p>
          </div>
        </div>

        {/* Đoạn văn ĐỘNG bên dưới 2 ô kết quả, tự đổi theo n */}
        <div className="pt-3 border-t border-lavender-mist/50 text-xs sm:text-sm text-deep-navy/80 font-ui leading-relaxed">
          {days <= 30 && (
            <p>
              Sau {days} ngày đều đặn, bạn mới tốt hơn{' '}
              <strong className="text-deep-navy">{Math.round((1.01 ** days - 1) * 100)}%</strong>.
              Gần như không cảm thấy gì — đó chính là lý do tuần thứ ba ai cũng muốn bỏ. Giờ kéo
              tiếp tới 365.
            </p>
          )}
          {days > 30 && days < 300 && (
            <p>
              Đường cong bắt đầu bẻ lên. Người bỏ cuộc ở tuần thứ ba không bao giờ thấy được đoạn
              này.
            </p>
          )}
          {days >= 300 && (
            <p>
              Giữ đủ một năm: tốt hơn{' '}
              <strong className="text-deep-navy">
                {(1.01 ** days).toFixed(2).replace('.', ',')}
              </strong>{' '}
              lần. Cùng điểm xuất phát, chỉ khác ở việc có lặp lại hay không.
            </p>
          )}
        </div>
      </div>

      {/* 4. Text: 3 điều có thể bạn chưa biết về 1% Better */}
      <div className="p-6 rounded-[20px] bg-white border border-lavender-mist shadow-soft space-y-4">
        <h3 className="font-ui font-bold text-base text-deep-navy flex items-center gap-2">
          <Info className="w-4 h-4 text-bright-magenta" />
          <span>Ba điều có thể bạn chưa biết về 1% Better</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm font-ui">
          {unknownItems.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-warm-ivory/60 border border-lavender-mist/70 space-y-1.5"
            >
              <div className="font-bold text-bright-magenta">{item.title}</div>
              <p className="text-deep-navy/75 leading-relaxed text-xs">
                {'body' in item ? item.body : (item as any).content}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Cuối Bước 2: Hộp dẫn dắt (sticky chỉ giữ thanh nút trên mobile để không che nội dung) */}
      <div className="space-y-3 sm:space-y-0 sm:p-6 sm:rounded-[20px] sm:bg-soft-pink/60 sm:border sm:border-bright-magenta/25 sm:shadow-soft flex flex-col sm:flex-row sm:items-center justify-between sm:gap-4">
        <p className="p-4 sm:p-0 rounded-[20px] sm:rounded-none bg-soft-pink/60 sm:bg-transparent border border-bright-magenta/25 sm:border-0 text-xs sm:text-sm text-deep-navy/85 font-ui leading-relaxed">
          <strong className="text-deep-navy font-bold">
            Lời giải không nằm ở cố gắng nhiều hơn, mà ở một hệ thống tốt hơn.
          </strong>{' '}
          Ở giai đoạn 2, bạn sẽ tự tay xây hệ thống đó cho thói quen của mình.
        </p>

        <div className="sticky bottom-2 z-20 sm:static bg-warm-ivory/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none py-2.5 sm:py-0 px-2 sm:px-0 rounded-2xl border border-lavender-mist sm:border-0 shadow-soft sm:shadow-none flex items-center justify-between sm:justify-end gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={onPrev}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-deep-navy/30 hover:border-deep-navy text-deep-navy text-xs sm:text-sm font-ui font-semibold bg-white hover:bg-warm-ivory transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>

          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-bright-magenta hover:bg-bright-magenta/90 text-white text-xs sm:text-sm font-ui font-semibold shadow-soft hover:shadow-soft-md transition-all active:scale-95 group cursor-pointer"
          >
            <span>Sang giai đoạn 2 · Xây thói quen</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  )
}
