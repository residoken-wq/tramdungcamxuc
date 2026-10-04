'use client'

import React, { useRef, useState } from 'react'
import {
  Button,
  Card,
  SectionHeader,
  QuoteBlock,
  PriceTag,
  StatusBadge,
  Modal,
  Toast,
  ToastType,
  SaleStatus,
} from '@/components/ui'

export function InteractivePrimitivesDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [toastConfig, setToastConfig] = useState<{
    isOpen: boolean
    type: ToastType
    message: string
    description?: string
  }>({
    isOpen: false,
    type: 'info',
    message: '',
  })

  const openModalButtonRef = useRef<HTMLButtonElement>(null)

  const showToast = (type: ToastType, message: string, description?: string) => {
    setToastConfig({
      isOpen: true,
      type,
      message,
      description,
    })
  }

  const allStatuses: SaleStatus[] = ['coming_soon', 'on_sale', 'free', 'consult', 'hidden']

  return (
    <div className="space-y-12">
      {/* 1. Button Primitive */}
      <div className="space-y-6">
        <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy">
          6.1 Button (Variants, Sizes, States &amp; Link Rendering)
        </h3>
        <p className="font-ui text-xs text-deep-navy/70 leading-relaxed max-w-3xl">
          Nút CTA chính (primary) tuân thủ tiêu chuẩn tương phản WCAG AA bằng chữ lớn ≥ 18.66px đậm. Ở kích thước nhỏ (size sm), hệ thống tự động sử dụng nền deep-navy (secondary) để đảm bảo độ rõ đọc. Vùng chạm luôn đạt tối thiểu 44×44px.
        </p>

        {/* Variants showcase */}
        <div className="rounded-card border border-deep-navy/10 bg-white p-6 shadow-soft space-y-6">
          <div>
            <h4 className="font-ui text-xs font-semibold text-deep-navy/60 uppercase tracking-wider mb-3">
              Các biến thể (Variants) ở Size MD (Mặc định)
            </h4>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary">Nút Primary (CTA)</Button>
              <Button variant="secondary">Nút Secondary</Button>
              <Button variant="ghost">Nút Ghost</Button>
            </div>
          </div>

          {/* Sizes showcase */}
          <div>
            <h4 className="font-ui text-xs font-semibold text-deep-navy/60 uppercase tracking-wider mb-3">
              Các kích thước (Sizes: SM, MD, LG)
            </h4>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="sm" variant="secondary">
                Size SM (Secondary)
              </Button>
              <Button size="md" variant="primary">
                Size MD (Primary)
              </Button>
              <Button size="lg" variant="primary">
                Size LG (Primary)
              </Button>
            </div>
          </div>

          {/* States showcase: loading, disabled, link */}
          <div>
            <h4 className="font-ui text-xs font-semibold text-deep-navy/60 uppercase tracking-wider mb-3">
              Các trạng thái (States: Loading, Disabled &amp; Link)
            </h4>
            <div className="flex flex-wrap items-center gap-4">
              <Button isLoading variant="primary">
                Đang xử lý
              </Button>
              <Button disabled variant="primary">
                Bị vô hiệu hóa
              </Button>
              <Button href="/styleguide" variant="secondary">
                Nút dạng Link (Next.js)
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Card Primitive */}
      <div className="space-y-6">
        <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy">
          6.2 Card (Bo góc 20px, bóng nhẹ &amp; 3 biến thể nền)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="white">
            <span className="font-ui text-xs font-bold text-bright-magenta uppercase">Variant White</span>
            <h4 className="font-ui text-base font-bold text-deep-navy mt-1">Khung thẻ nền trắng</h4>
            <p className="font-ui text-xs text-deep-navy/70 mt-2 leading-relaxed">
              Dành cho các nội dung chính, danh sách bài học hoặc thẻ bài tập cần độ tương phản sắc nét nhất.
            </p>
          </Card>

          <Card variant="soft-pink">
            <span className="font-ui text-xs font-bold text-bright-magenta uppercase">Variant Soft Pink</span>
            <h4 className="font-ui text-base font-bold text-deep-navy mt-1">Khung thẻ nền hồng mềm</h4>
            <p className="font-ui text-xs text-deep-navy/70 mt-2 leading-relaxed">
              Dành cho các gói sản phẩm tâm điểm, ưu đãi dùng thử hoặc thông điệp khuyến khích cảm xúc.
            </p>
          </Card>

          <Card variant="lavender-mist">
            <span className="font-ui text-xs font-bold text-bright-magenta uppercase">Variant Lavender Mist</span>
            <h4 className="font-ui text-base font-bold text-deep-navy mt-1">Khung thẻ tím sương mai</h4>
            <p className="font-ui text-xs text-deep-navy/70 mt-2 leading-relaxed">
              Dành cho các ghi chú phụ trợ, hướng dẫn thực hành hoặc phần trích dẫn bước đồng hành.
            </p>
          </Card>
        </div>
      </div>

      {/* 3. SectionHeader Primitive */}
      <div className="space-y-6">
        <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy">
          6.3 SectionHeader (Tiêu đề 2 tầng màu &amp; Dòng cảm xúc)
        </h3>
        <div className="rounded-card border border-deep-navy/10 bg-white p-8 shadow-soft">
          <SectionHeader
            seriesLabel="CHUỖI BÀI HỌC CẢM XÚC"
            titleLine1="Nhận diện cơn bão."
            titleLine2="Tìm về điểm tựa."
            emotionLine="Khoảnh khắc bạn dừng lại và gọi tên cảm xúc, bạn đã trao cho mình quyền làm chủ hành vi."
            as="h3"
          />
        </div>
      </div>

      {/* 4. QuoteBlock Primitive */}
      <div className="space-y-6">
        <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy">
          6.4 QuoteBlock (Trích dẫn phong cách cảm xúc)
        </h3>
        <QuoteBlock
          quote="Cảm xúc không phải là kẻ thù cần chế ngự, mà là người đưa tin cần được lắng nghe với lòng trắc ẩn."
          cite="Hana Lương"
          roleOrContext="Chuyên gia Khai vấn Cảm xúc & Thói quen"
        />
      </div>

      {/* 5. PriceTag & StatusBadge Primitives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PriceTag */}
        <div className="space-y-4">
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy">
            6.5 PriceTag (Định dạng VND &amp; Hỗ trợ Screen Reader)
          </h3>
          <div className="rounded-card border border-deep-navy/10 bg-white p-6 shadow-soft space-y-4">
            <div>
              <p className="font-ui text-xs text-deep-navy/60 uppercase font-semibold mb-1">
                Giá ưu đãi kèm giá gốc (Size LG)
              </p>
              <PriceTag originalPrice={250000} salePrice={178000} size="lg" />
            </div>
            <div>
              <p className="font-ui text-xs text-deep-navy/60 uppercase font-semibold mb-1">
                Gói Growth Mirror (Size MD)
              </p>
              <PriceTag originalPrice={2500000} salePrice={1750000} size="md" />
            </div>
            <div>
              <p className="font-ui text-xs text-deep-navy/60 uppercase font-semibold mb-1">
                Một mức giá duy nhất (Size SM)
              </p>
              <PriceTag originalPrice={149000} size="sm" />
            </div>
          </div>
        </div>

        {/* StatusBadge */}
        <div className="space-y-4">
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy">
            6.6 StatusBadge (5 trạng thái saleStatus)
          </h3>
          <div className="rounded-card border border-deep-navy/10 bg-white p-6 shadow-soft space-y-3">
            <p className="font-ui text-xs text-deep-navy/60 uppercase font-semibold">
              Nhãn tiếng Việt đồng bộ theo vi.ts
            </p>
            <div className="flex flex-wrap gap-2.5">
              {allStatuses.map((st) => (
                <StatusBadge key={st} status={st} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 6. Modal & Toast Interactive Demonstrations */}
      <div className="space-y-6">
        <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy">
          6.7 Modal &amp; Toast (Khóa focus, phím Esc, trả focus &amp; Tự ẩn)
        </h3>
        <div className="rounded-card border border-deep-navy/10 bg-white p-6 shadow-soft">
          <div className="flex flex-wrap items-center gap-4">
            <Button
              ref={openModalButtonRef}
              variant="secondary"
              onClick={() => setIsModalOpen(true)}
              id="open-modal-demo-btn"
            >
              Mở Hộp thoại Modal
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                showToast(
                  'success',
                  'Đã lưu thói quen thành công!',
                  'Chuỗi 21 ngày của bạn đã được cập nhật thêm một bước vững vàng.'
                )
              }
            >
              Bật Toast Thành công
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                showToast(
                  'error',
                  'Chưa hoàn thành đủ thông tin',
                  'Vui lòng kiểm tra lại họ tên và địa chỉ email trước khi gửi.'
                )
              }
            >
              Bật Toast Lỗi
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                showToast(
                  'info',
                  'Gợi ý thực hành cảm xúc',
                  'Dành 2 phút hít thở sâu và ghi lại 1 điều bạn cảm thấy biết ơn.'
                )
              }
            >
              Bật Toast Thông tin
            </Button>
          </div>

          <p className="mt-4 font-ui text-xs text-deep-navy/60 leading-relaxed">
            Kiểm tra trải nghiệm bàn phím: Bấm <strong>Enter</strong> trên nút &ldquo;Mở Hộp thoại Modal&rdquo; để mở, dùng phím <strong>Tab</strong> để điều hướng tuần hoàn bên trong, bấm <strong>Escape</strong> để đóng và quan sát focus tự động quay về nút ban đầu.
          </p>
        </div>
      </div>

      {/* Modal Demo Instance */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Trạm Dừng Nhận Diện Cảm Xúc"
        triggerRef={openModalButtonRef}
      >
        <div className="space-y-4 font-ui">
          <p className="text-sm text-deep-navy/85 leading-relaxed">
            Đây là hộp thoại tương tác chuẩn theo Brand Book 2026. Hộp thoại có cơ chế khóa cuộn màn hình nền, khóa tiêu điểm bàn phím (focus trap) và tự động trả lại focus cho nút kích hoạt khi đóng.
          </p>
          <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-deep-navy/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Đóng lại
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsModalOpen(false)
                showToast('success', 'Đã xác nhận thành công từ Modal!')
              }}
            >
              Xác nhận
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast Demo Instance */}
      <Toast
        isOpen={toastConfig.isOpen}
        type={toastConfig.type}
        message={toastConfig.message}
        description={toastConfig.description}
        onClose={() => setToastConfig((prev) => ({ ...prev, isOpen: false }))}
        duration={4500}
      />
    </div>
  )
}
