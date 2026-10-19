'use client'

import React from 'react'
import { ResourcePostsSlot } from '@/components/site/ResourcePostsSlot'
import { LeadMagnetCarousel, type LeadMagnetItem } from '@/components/site/LeadMagnetCarousel'
import { NewsletterForm } from '@/components/site/NewsletterForm'

const demoCarouselItems: LeadMagnetItem[] = [
  {
    id: 101,
    name: '[MẪU SM-05] Cẩm nang Nhận diện Cảm xúc',
    slug: 'cam-nang-nhan-dien-cam-xuc',
    shortDescription:
      'Tài liệu hướng dẫn gọi tên 26 sắc thái cảm xúc và cách thức chuyển hóa nhẹ nhàng.',
    topic: 'eq',
    coverImage: null,
  },
  {
    id: 102,
    name: '[MẪU SM-05] Sổ tay 21 Ngày Thói quen',
    slug: 'so-tay-21-ngay-thoi-quen',
    shortDescription:
      'Phương pháp rèn luyện 5 phút mỗi ngày với vòng lặp thói quen bền bỉ và dễ áp dụng.',
    topic: 'habit',
    coverImage: null,
  },
  {
    id: 103,
    name: '[MẪU SM-05] 16 Kỹ thuật Vượt qua Trì hoãn',
    slug: '16-ky-thuat-vuot-qua-tri-hoan',
    shortDescription:
      'Bẻ khóa điểm nghẽn tâm lý, thiết lập động lực nội tại để hành động nhất quán.',
    topic: 'habit',
    coverImage: null,
  },
  {
    id: 104,
    name: '[MẪU SM-05] Bảng Cân bằng Năng lượng',
    slug: 'bang-can-bang-nang-luong',
    shortDescription:
      'Nhật ký cân bằng cảm xúc và tái tạo nguồn năng lượng tích cực mỗi tuần làm việc.',
    topic: 'career',
    coverImage: null,
  },
]

export function Sm05BlocksDemo() {
  return (
    <div className="space-y-16">
      {/* 1. ResourcePostsSlot */}
      <div className="space-y-6">
        <div className="border-b border-deep-navy/10 pb-2">
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-bright-magenta">
            1. Khối ResourcePostsSlot (Vị trí danh sách bài viết)
          </h3>
          <p className="mt-1 font-ui text-xs text-deep-navy/70">
            Khối layout đánh dấu vị trí tách trang /tai-nguyen: phần trước → ứng dụng danh sách bài
            viết → phần sau. Trên trang công khai render null; trong editor Puck hiện khung hướng dẫn.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-card border border-deep-navy/10 bg-white p-6 shadow-soft">
            <p className="mb-3 font-ui text-xs font-bold uppercase tracking-wider text-deep-navy/70">
              Giao diện hiển thị trong Puck Editor (isEditing = true)
            </p>
            <ResourcePostsSlot puck={{ isEditing: true }} />
          </div>

          <div className="rounded-card border border-deep-navy/10 bg-warm-ivory p-6">
            <p className="font-ui text-xs text-deep-navy/70">
              <span className="font-bold text-deep-navy">Trang công khai:</span> Khối render{' '}
              <code className="rounded bg-lavender-mist/50 px-1 py-0.5 text-xs">null</code> và ứng
              dụng sẽ chèn bộ lọc bài viết, ô tìm kiếm và phân trang vào vị trí này.
            </p>
          </div>
        </div>
      </div>

      {/* 2. LeadMagnetCarousel */}
      <div className="space-y-6">
        <div className="border-b border-deep-navy/10 pb-2">
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-bright-magenta">
            2. Khối LeadMagnetCarousel (Carousel tài nguyên miễn phí)
          </h3>
          <p className="mt-1 font-ui text-xs text-deep-navy/70">
            Hiển thị tài nguyên miễn phí (mode auto / manual), không tự chạy, hỗ trợ scroll-snap,
            nút Prev / Next, dots, phím mũi tên và tích hợp form nhận tài liệu qua email.
          </p>
        </div>

        <div className="rounded-card border border-deep-navy/10 bg-white overflow-hidden shadow-soft">
          <LeadMagnetCarousel
            seriesLabel="[MẪU SM-05] TÀI NGUYÊN NHẬN NGAY QUA EMAIL"
            titleLine1="CÔNG CỤ & TÀI LIỆU"
            titleLine2="ĐỒNG HÀNH MIỄN PHÍ"
            emotionLine="Những tài liệu đúc kết từ thực tế, sẵn sàng hỗ trợ bạn trên từng bước chuyển."
            bgColor="warm-ivory"
            padding="md"
            isDemo={true}
            _resolved={{ items: demoCarouselItems }}
          />
        </div>
      </div>

      {/* 3. NewsletterForm */}
      <div className="space-y-6">
        <div className="border-b border-deep-navy/10 pb-2">
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-bright-magenta">
            3. Khối NewsletterForm (Đăng ký nhận bản tin)
          </h3>
          <p className="mt-1 font-ui text-xs text-deep-navy/70">
            Khối đăng ký bản tin độc lập với email bắt buộc, tên tùy chọn, ô đồng ý bảo mật,
            chống trùng lead theo email và tag newsletter, không hứa tần suất chưa thực hiện được.
          </p>
        </div>

        <div className="rounded-card border border-deep-navy/10 bg-white overflow-hidden shadow-soft">
          <NewsletterForm
            title="[MẪU SM-05] NHẬN BẢN TIN TỪ TRẠM DỪNG CẢM XÚC"
            description="[MẪU SM-05] Đăng ký để nhận những bài viết mới nhất và tài nguyên chọn lọc từ Hana gửi trực tiếp tới email."
            submitLabel="[MẪU SM-05] Đăng ký nhận bản tin"
            consentText="[MẪU SM-05] Tôi đồng ý nhận email chia sẻ và thông tin hữu ích từ Trạm Dừng Cảm Xúc theo"
            bgColor="warm-ivory"
            padding="md"
            isDemo={true}
          />
        </div>
      </div>
    </div>
  )
}
