'use client'

import React, { useState } from 'react'
import {
  ProductCard,
  TestimonialCard,
  LeadForm,
  Navbar,
  Footer,
} from '@/components/site'
import { EmotionPicker, ProgressGrid, type ProgressDayItem } from '@/components/habit'
import { Button } from '@/components/ui/Button'
import type { EmotionKey } from '@/lib/emotions'

export function InteractiveCompositesDemo() {
  // State for EmotionPicker demo
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionKey>('calm')
  const [isEmotionPickerDisabled, setIsEmotionPickerDisabled] = useState(false)

  // State for Testimonial consent toggle demo
  const [testimonialConsent, setTestimonialConsent] = useState(true)

  // State for ProductCard hidden toggle demo
  const [showHiddenProduct, setShowHiddenProduct] = useState(false)

  // State for ProgressGrid demo
  const [selectedDayInfo, setSelectedDayInfo] = useState<string | null>(null)

  const sampleProgressDays: ProgressDayItem[] = [
    { day: 1, status: 'done', emotionKey: 'calm' },
    { day: 2, status: 'done', emotionKey: 'grateful' },
    { day: 3, status: 'done', emotionKey: 'energized' },
    { day: 4, status: 'missed' },
    { day: 5, status: 'done', emotionKey: 'calm' },
    { day: 6, status: 'today' },
    { day: 7, status: 'future' },
    { day: 8, status: 'future' },
    { day: 9, status: 'future' },
    { day: 10, status: 'future' },
    { day: 11, status: 'future' },
    { day: 12, status: 'future' },
    { day: 13, status: 'future' },
    { day: 14, status: 'future' },
    { day: 15, status: 'locked' },
    { day: 16, status: 'locked' },
    { day: 17, status: 'locked' },
    { day: 18, status: 'locked' },
    { day: 19, status: 'locked' },
    { day: 20, status: 'locked' },
    { day: 21, status: 'locked' },
  ]

  // Mock submit handler for LeadForm demonstrating async Promise
  const handleLeadSubmit = async (values: { name: string; email: string; consent: boolean }) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800))
    // Simulate error if name is "error"
    if (values.name.toLowerCase() === 'error') {
      throw new Error('Simulation error')
    }
  }

  return (
    <div className="space-y-16">
      {/* 1. Navbar Demo */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-deep-navy/10 pb-2">
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy">
            1. Navbar Component (Điều hướng trên Desktop &amp; Di động)
          </h3>
          <span className="font-ui text-xs text-deep-navy/60">
            Hỗ trợ Esc đóng mobile drawer, giữ mục &ldquo;Test thói quen 5 phút&rdquo; ở thanh ngoài
          </span>
        </div>

        <div className="rounded-card border border-deep-navy/10 bg-warm-ivory/60 p-4 shadow-soft overflow-hidden">
          <p className="text-xs font-ui text-deep-navy/60 mb-3">
            [MẪU] Khung xem trước Navbar (Tương tác thu nhỏ màn hình hoặc click nút mở menu):
          </p>
          <div className="border border-deep-navy/15 rounded-xl overflow-hidden bg-white shadow-sm">
            <Navbar />
          </div>
        </div>
      </div>

      {/* 2. ProductCard Demo */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-deep-navy/10 pb-2">
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy">
            2. ProductCard Component (Thẻ Sản phẩm Đa Trạng thái)
          </h3>
          <span className="font-ui text-xs text-deep-navy/60">
            Dùng next/image, PriceTag, StatusBadge, Badge dùng thử 21 ngày
          </span>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowHiddenProduct((prev) => !prev)}
          >
            {showHiddenProduct
              ? 'Đang bật sản phẩm ẩn (saleStatus="hidden" -> return null)'
              : 'Thử nghiệm sản phẩm ẩn (saleStatus="hidden")'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: On Sale with Discount and Trial */}
          <ProductCard
            name="[MẪU] Sổ tay Thói quen 21 Ngày"
            shortDescription="[MẪU] Bộ công cụ số kết hợp phương pháp khoa học giúp bạn xây dựng thói quen kiên định và nuôi dưỡng cảm xúc tích cực mỗi ngày."
            coverImage={{
              src: '/brand/sample-cover.svg',
              alt: '[MẪU] Bìa sản phẩm Sổ tay Thói quen',
            }}
            price={250000}
            salePrice={178000}
            saleStatus="on_sale"
            trialDays={21}
            journeyStep="pause"
            cta={
              <Button variant="primary" size="md" className="w-full">
                Dùng thử 21 ngày miễn phí
              </Button>
            }
          />

          {/* Card 2: Free Resource */}
          <ProductCard
            name="[MẪU] Bộ Thẻ Cảm Xúc EQ Buddy"
            shortDescription="[MẪU] 26 thẻ suy ngẫm giúp nhận diện và kết nối sâu sắc với thế giới nội tâm của bạn."
            coverImage={{
              src: '/brand/sample-cover.svg',
              alt: '[MẪU] Bìa sản phẩm EQ Buddy',
            }}
            price={null}
            salePrice={0}
            saleStatus="free"
            journeyStep="feel"
            cta={
              <Button variant="secondary" size="md" className="w-full">
                Nhận tài nguyên miễn phí
              </Button>
            }
          />

          {/* Card 3: Consult Service */}
          <ProductCard
            name="[MẪU] Chương trình Coaching 1:1"
            shortDescription="[MẪU] Lộ trình đồng hành chuyên sâu cùng chuyên gia khai vấn để chuyển mình vững vàng trong sự nghiệp."
            coverImage={{
              src: '/brand/sample-cover.svg',
              alt: '[MẪU] Bìa dịch vụ Coaching 1:1',
            }}
            price={null}
            salePrice={null}
            saleStatus="consult"
            journeyStep="choose"
            cta={
              <Button variant="secondary" size="md" className="w-full">
                Đăng ký tư vấn
              </Button>
            }
          />

          {/* Card 4: Hidden Product demonstration */}
          {showHiddenProduct && (
            <div className="col-span-full rounded-xl border border-dashed border-deep-navy/30 p-4 text-center text-xs font-ui text-deep-navy/70">
              <p className="font-semibold mb-1">
                Kiểm tra: Sản phẩm dưới đây có saleStatus=&quot;hidden&quot;
              </p>
              <ProductCard
                name="[MẪU] Sản phẩm trạng thái ẩn"
                coverImage={{ src: '/brand/sample-cover.svg', alt: '[MẪU] Bìa' }}
                saleStatus="hidden"
              />
              <p className="italic text-deep-navy/50">
                (Component ProductCard đã trả về null – hoàn toàn không có DOM rác được sinh ra)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. TestimonialCard Demo */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-deep-navy/10 pb-2">
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy">
            3. TestimonialCard Component (Lời Chứng Thực Khách Hàng)
          </h3>
          <span className="font-ui text-xs text-deep-navy/60">
            Chỉ hiển thị khi consent=true (AGENTS.md §7) · Font Playfair Display Italic
          </span>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setTestimonialConsent((prev) => !prev)}
          >
            {testimonialConsent
              ? 'Consent: TRUE (Đang hiển thị)'
              : 'Consent: FALSE (Đang ẩn theo quy tắc bảo mật)'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TestimonialCard
            quote="[MẪU] Sau phiên đồng hành, tôi nhận diện được những nút thắt trong công việc và học cách bao dung với chính mình."
            name="[MẪU] Chị Phương Mai"
            role="[MẪU] Quản trị Nhân sự"
            photo={{
              src: '/brand/sample-avatar.svg',
              alt: '[MẪU] Ảnh đại diện học viên',
            }}
            consent={testimonialConsent}
          />

          <TestimonialCard
            quote="[MẪU] Bộ thẻ EQ Buddy đã trở thành nghi thức buổi sáng không thể thiếu, giúp tôi khởi đầu ngày mới an yên."
            name="[MẪU] Anh Tuấn Kiệt"
            role="[MẪU] Kỹ sư công nghệ"
            consent={testimonialConsent}
          />
        </div>
        {!testimonialConsent && (
          <p className="text-center font-ui text-xs italic text-deep-navy/60 p-4 border border-dashed border-deep-navy/20 rounded-xl">
            (Cả hai TestimonialCard đang ẩn hoàn toàn vì consent=false – tuân thủ tuyệt đối quy định bảo mật)
          </p>
        )}
      </div>

      {/* 4. LeadForm Demo */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-deep-navy/10 pb-2">
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy">
            4. LeadForm Component (Biểu Mẫu Thu Thập Lead An Toàn)
          </h3>
          <span className="font-ui text-xs text-deep-navy/60">
            Validate tiếng Việt, bẫy Honeypot chống bot, thông báo lỗi ngay dưới ô, link bảo mật
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <LeadForm
            onSubmit={handleLeadSubmit}
            title="[MẪU] Đăng ký nhận cẩm nang cảm xúc"
            description="[MẪU] Nhận ngay ebook hướng dẫn nhận diện và điều hòa cảm xúc trong 5 phút mỗi ngày."
          />

          <div className="rounded-card border border-deep-navy/10 bg-white p-6 shadow-soft space-y-3 text-xs font-sans text-deep-navy/80">
            <h4 className="font-ui font-bold text-sm text-deep-navy uppercase">
              Hướng dẫn kiểm thử Biểu mẫu
            </h4>
            <ul className="list-disc pl-4 space-y-1.5 leading-relaxed">
              <li>
                <strong>Bỏ trống và bấm Gửi:</strong> Hiển thị thông báo lỗi tiếng Việt dưới từng trường.
              </li>
              <li>
                <strong>Nhập email sai cú pháp:</strong> Báo lỗi &ldquo;Địa chỉ email không hợp lệ&rdquo;.
              </li>
              <li>
                <strong>Bấm Tab qua bàn phím:</strong> Thứ tự Tab hợp lý từ Họ tên → Email → Checkbox → Nút gửi (Bỏ qua ô Honeypot).
              </li>
              <li>
                <strong>Thử nghiệm lỗi mô phỏng:</strong> Nhập tên là &ldquo;error&rdquo; để xem thông báo lỗi máy chủ tiếng Việt.
              </li>
              <li>
                <strong>Thành công:</strong> Nhập thông tin hợp lệ và tick đồng ý để xem màn hình xác nhận với vai trò <code>role=&quot;status&quot;</code>.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 5. EmotionPicker Demo */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-deep-navy/10 pb-2">
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy">
            5. EmotionPicker Component (Chọn Trạng Thái Cảm Xúc)
          </h3>
          <span className="font-ui text-xs text-deep-navy/60">
            Đánh dấu // PENDING Q14 · Radio group bàn phím (Phím mũi tên) · SVG nét mảnh, không dùng emoji
          </span>
        </div>

        <div className="rounded-card border border-deep-navy/10 bg-white p-6 sm:p-8 shadow-soft space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-ui text-xs font-semibold text-deep-navy/60 uppercase">
                Trạng thái đang chọn:
              </p>
              <p className="font-ui font-bold text-lg text-deep-navy">
                {selectedEmotion}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEmotionPickerDisabled((prev) => !prev)}
            >
              {isEmotionPickerDisabled ? 'Kích hoạt lại' : 'Vô hiệu hóa (disabled)'}
            </Button>
          </div>

          <EmotionPicker
            value={selectedEmotion}
            onChange={(key) => setSelectedEmotion(key)}
            disabled={isEmotionPickerDisabled}
          />
        </div>
      </div>

      {/* 6. ProgressGrid Demo */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-deep-navy/10 pb-2">
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy">
            6. ProgressGrid Component (Lưới Tiến Trình 21 Ngày)
          </h3>
          <span className="font-ui text-xs text-deep-navy/60">
            21 ô tương thích màn hình 375px · Không dựa hoàn toàn vào màu · Khóa ngày tương lai / đã khóa
          </span>
        </div>

        <div className="rounded-card border border-deep-navy/10 bg-white p-6 sm:p-8 shadow-soft space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-ui text-xs font-semibold text-deep-navy/60 uppercase">
                Tương tác người dùng:
              </p>
              <p className="font-ui text-sm font-bold text-deep-navy">
                {selectedDayInfo || 'Bấm vào một ngày để xem chi tiết trạng thái'}
              </p>
            </div>
          </div>

          {/* Progress Grid representation */}
          <ProgressGrid
            days={sampleProgressDays}
            onSelectDay={(day) => {
              const item = sampleProgressDays.find((d) => d.day === day)
              setSelectedDayInfo(
                `Bạn vừa chọn Ngày ${day}: ${item?.status} ${
                  item?.emotionKey ? `(Cảm xúc: ${item.emotionKey})` : ''
                }`
              )
            }}
          />

          {/* Legend explanation */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-4 border-t border-deep-navy/10 text-xs font-ui">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-mint-haze border border-deep-navy/20 inline-block" />
              <span>Đã hoàn thành</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-white border-2 border-accent-pink inline-block" />
              <span>Hôm nay</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-soft-pink/50 border border-dashed border-deep-navy/30 inline-block" />
              <span>Đã lỡ nhịp</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-white/50 border border-deep-navy/10 inline-block" />
              <span>Chưa tới</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-warm-ivory border border-deep-navy/10 inline-block" />
              <span>Đã khóa</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Footer Demo */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-deep-navy/10 pb-2">
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy">
            7. Footer Component (Chân Trang Thương Hiệu &amp; Pháp Lý)
          </h3>
          <span className="font-ui text-xs text-deep-navy/60">
            6 trang pháp lý xếp theo order · Ẩn trường rỗng trong sellerInfo · Bản quyền tự tính theo năm
          </span>
        </div>

        <div className="rounded-card border border-deep-navy/10 overflow-hidden shadow-soft">
          <Footer />
        </div>
      </div>
    </div>
  )
}
