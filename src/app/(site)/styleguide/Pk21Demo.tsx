'use client'

import React from 'react'
import { PhotoGallery } from '@/components/site/PhotoGallery'
import { IconCardGrid } from '@/components/site/IconCardGrid'
import { FAQ } from '@/components/site/FAQ'
import { ServiceCards } from '@/components/site/ServiceCards'
import { TestimonialGrid } from '@/components/site/TestimonialGrid'
import { ImageText } from '@/components/site/ImageText'
import { ContactForms } from '@/components/site/ContactForms'
import { LeadMagnetCarousel } from '@/components/site/LeadMagnetCarousel'
import { LibraryPreview } from '@/components/site/LibraryPreview'
import { Callout } from '@/components/site/Callout'

const SAMPLE_PHOTOS = [
  {
    imageUrl: '/brand/sample-cover.svg',
    alt: '[MẪU] Khoảnh khắc 1',
    caption: '[MẪU] Lắng đọng cùng cảm xúc',
  },
  {
    imageUrl: '/brand/sample-cover.svg',
    alt: '[MẪU] Khoảnh khắc 2',
    caption: '[MẪU] Thấu cảm và chia sẻ',
  },
  {
    imageUrl: '/brand/sample-cover.svg',
    alt: '[MẪU] Khoảnh khắc 3',
    caption: '[MẪU] Không gian an lành',
  },
  {
    imageUrl: '/brand/sample-cover.svg',
    alt: '[MẪU] Khoảnh khắc 4',
    caption: '[MẪU] Vững vàng bước tiếp',
  },
  {
    imageUrl: '/brand/sample-cover.svg',
    alt: '[MẪU] Khoảnh khắc 5',
    caption: '[MẪU] Gắn kết cộng đồng',
  },
]

const SAMPLE_FAQS = [
  {
    question: '[MẪU] Phiên trải nghiệm 149.000đ diễn ra như thế nào?',
    answer:
      '[MẪU] Phiên trải nghiệm kéo dài 60 phút, giúp bạn nhận diện bức tranh cảm xúc hiện tại và định hướng lộ trình phù hợp.',
    highlight: true,
  },
  {
    question: '[MẪU] Tôi có thể tự học hay cần người đồng hành?',
    answer:
      '[MẪU] Bạn có thể tự học qua công cụ số hoặc tham gia coaching 1:1 tùy theo nhu cầu và tốc độ của bản thân.',
  },
  {
    question: '[MẪU] Bộ thẻ EQ Buddy số dùng như thế nào?',
    answer:
      '[MẪU] Bạn có thể rút thẻ mỗi ngày để lắng nghe cảm xúc, nhận lời gợi ý thực hành điều hòa tâm trí.',
  },
]

export function Pk21Demo() {
  return (
    <div className="space-y-16" data-testid="pk21-demo-root">
      {/* 1. PhotoGallery */}
      <div id="demo-pk21-gallery" className="space-y-6">
        <div>
          <h3 className="font-ui text-lg font-bold text-deep-navy">
            1. Khối PhotoGallery: Ghép ảnh Mosaic &amp; Lưới Grid (PK-21 1.1)
          </h3>
          <p className="font-ui text-sm text-deep-navy/70">
            [MẪU] Bố cục mosaic 4 ảnh tỉ lệ cân đối, có nút mũi tên chuyển nhóm và hỗ trợ phím mũi tên.
          </p>
        </div>
        <div data-testid="pk21-gallery-container">
          <PhotoGallery
            layout="mosaic"
            items={SAMPLE_PHOTOS}
            seriesLabel="[MẪU] Khoảnh khắc Trạm"
            titleLine1="[MẪU] GHI DẤU"
            titleLine2="[MẪU] HÀNH TRÌNH CẢM XÚC"
            emotionLine="[MẪU] Từng khoảnh khắc bình an trên hành trình thấu cảm chính mình."
          />
        </div>
      </div>

      {/* 2. IconCardGrid Carousel */}
      <div id="demo-pk21-icon-carousel" className="space-y-6">
        <div>
          <h3 className="font-ui text-lg font-bold text-deep-navy">
            2. Khối IconCardGrid: Dạng trượt Carousel (PK-21 1.1)
          </h3>
          <p className="font-ui text-sm text-deep-navy/70">
            [MẪU] Cột dạng carousel trượt ngang mượt mà, cuộn từng thẻ.
          </p>
        </div>
        <IconCardGrid
          columns="carousel"
          seriesLabel="[MẪU] Trải nghiệm"
          titleLine1="[MẪU] KHÁM PHÁ"
          titleLine2="[MẪU] CÁC BƯỚC THỰC HÀNH"
          items={[
            { icon: 'star', title: '[MẪU] Dừng lại', text: '[MẪU] Dành 5 phút quan sát hơi thở.' },
            { icon: 'heart', title: '[MẪU] Lắng nghe', text: '[MẪU] Cảm nhận trọn vẹn thân tâm.' },
            { icon: 'target', title: '[MẪU] Gọi tên', text: '[MẪU] Nhận diện đúng cảm xúc.' },
            { icon: 'compass', title: '[MẪU] Chuyển hóa', text: '[MẪU] Lựa chọn phản ứng tích cực.' },
          ]}
        />
      </div>

      {/* 3. FAQ Variants: Cards & Quick */}
      <div id="demo-pk21-faq" className="space-y-8">
        <div>
          <h3 className="font-ui text-lg font-bold text-deep-navy">
            3. Khối FAQ: Biến thể Thẻ (Cards) &amp; Nhanh (Quick) (PK-21 1.2)
          </h3>
          <p className="font-ui text-sm text-deep-navy/70">
            [MẪU] Biến thể Cards luôn mở, đánh số Anton; Quick 1 dòng thu gọn có nút mở rộng.
          </p>
        </div>
        <div data-testid="pk21-faq-cards">
          <FAQ
            variant="cards"
            seriesLabel="[MẪU] Giải đáp"
            titleLine1="[MẪU] CÂU HỎI"
            titleLine2="[MẪU] THƯỜNG GẶP (CARDS)"
            items={SAMPLE_FAQS}
          />
        </div>
        <div data-testid="pk21-faq-quick">
          <FAQ
            variant="quick"
            seriesLabel="[MẪU] Nhanh"
            titleLine1="[MẪU] CÂU HỎI"
            titleLine2="[MẪU] NHANH (QUICK)"
            seeAllLink="/lien-he#faq"
            items={SAMPLE_FAQS}
          />
        </div>
      </div>

      {/* 4. ServiceCards Detailed */}
      <div id="demo-pk21-service-detailed" className="space-y-6">
        <div>
          <h3 className="font-ui text-lg font-bold text-deep-navy">
            4. Khối ServiceCards: Biến thể Chi tiết (Detailed) (PK-21 1.3)
          </h3>
          <p className="font-ui text-sm text-deep-navy/70">
            [MẪU] Thẻ dịch vụ chi tiết hiển thị badge, đối tượng, tình huống phù hợp và kết quả đạt được.
          </p>
        </div>
        <ServiceCards
          layout="detailed"
          seriesLabel="[MẪU] Lộ trình"
          titleLine1="[MẪU] DỊCH VỤ"
          titleLine2="[MẪU] ĐỒNG HÀNH CHUYÊN SÂU"
          cardTitles={[{ text: '[MẪU] Khai vấn Cá nhân 1:1' }, { text: '[MẪU] Workshop Doanh nghiệp' }]}
          _resolved={{
            services: [
              {
                id: 1,
                name: '[MẪU] Khai vấn Cá nhân 1:1',
                slug: 'khai-van-ca-nhan',
                badge: '1:1',
                audience: 'Dành cho người đi làm',
                situations: ['[MẪU] Thường xuyên stress, mất cân bằng', '[MẪU] Mông lung về định hướng nghề nghiệp'],
                outcomes: ['[MẪU] Nhận diện nguyên nhân gốc rễ', '[MẪU] Xây dựng nhịp sống chủ động'],
              },
              {
                id: 2,
                name: '[MẪU] Workshop Doanh nghiệp',
                slug: 'workshop-doanh-nghiep',
                badge: 'B2B',
                audience: 'Dành cho đội ngũ lãnh đạo',
                situations: ['[MẪU] Giao tiếp nội bộ căng thẳng', '[MẪU] Thiếu gắn kết sau biến động'],
                outcomes: ['[MẪU] Tăng cường thấu cảm nhóm', '[MẪU] Nâng cao trí tuệ cảm xúc nơi làm việc'],
              },
            ],
          }}
        />
      </div>

      {/* 5. TestimonialGrid Featured */}
      <div id="demo-pk21-testimonial-featured" className="space-y-6">
        <div>
          <h3 className="font-ui text-lg font-bold text-deep-navy">
            5. Khối TestimonialGrid: Biến thể Nổi bật (Featured) (PK-21 1.3)
          </h3>
          <p className="font-ui text-sm text-deep-navy/70">
            [MẪU] 1 lời chia sẻ lớn bên trái + 2 lời chia sẻ nhỏ bên phải, chỉ hiện khi đồng ý (consent = true).
          </p>
        </div>
        <TestimonialGrid
          variant="featured"
          _resolved={{
            testimonials: [
              {
                id: '1',
                name: '[MẪU] Chị M.H.',
                role: 'Quản lý dự án',
                quote:
                  'Sau phiên trải nghiệm, mình hiểu vì sao bản thân hay dồn nén cảm xúc. Phương pháp tại Trạm rất an toàn và thực tế.',
                consent: true,
              },
              {
                id: '2',
                name: '[MẪU] Anh T.D.',
                role: 'Lập trình viên',
                quote:
                  'Thói quen check-in 5 phút mỗi sáng giúp mình bình tĩnh hơn rất nhiều trước áp lực deadline.',
                consent: true,
              },
              {
                id: '3',
                name: '[MẪU] Bạn K.L.',
                role: 'Chuyên viên Nhân sự',
                quote:
                  'Bộ thẻ EQ Buddy số là người bạn thân thiết giúp mình chuyển hóa những cơn giận vô cớ.',
                consent: true,
              },
            ],
          }}
        />
      </div>

      {/* 6. ImageText imageBleed */}
      <div id="demo-pk21-image-bleed" className="space-y-6">
        <div>
          <h3 className="font-ui text-lg font-bold text-deep-navy">
            6. Khối ImageText: Tràn mép hình ảnh (Image Bleed) (PK-21 1.3)
          </h3>
          <p className="font-ui text-sm text-deep-navy/70">
            [MẪU] Ảnh chạm mép màn hình, nội dung thẳng hàng lưới trang chuẩn.
          </p>
        </div>
        <ImageText
          imageBleed={true}
          layout="image-right"
          imageUrl="/brand/sample-cover.svg"
          imageAlt="[MẪU] Không gian tĩnh lặng"
          seriesLabel="[MẪU] Không gian"
          titleLine1="[MẪU] NƠI DỪNG LẠI"
          titleLine2="[MẪU] ĐỂ PHỤC HỒI NĂNG LƯỢNG"
          content="[MẪU] Trạm Dừng Cảm Xúc mang đến một góc nhỏ an yên để bạn tạm gác lại những âu lo thường nhật, chăm sóc tâm trí một cách dịu dàng."
        />
      </div>

      {/* 7. ContactForms personal */}
      <div id="demo-pk21-contact-personal" className="space-y-6">
        <div>
          <h3 className="font-ui text-lg font-bold text-deep-navy">
            7. Khối ContactForms: Biến thể 1 Form Cá nhân (Personal) (PK-21 1.4)
          </h3>
          <p className="font-ui text-sm text-deep-navy/70">
            [MẪU] Form cá nhân hóa tập trung, đủ 5 ô nhập liệu (Họ tên, Email, Số điện thoại, Lộ trình, Điều trăn trở).
          </p>
        </div>
        <ContactForms
          layout="personal"
          titleB2C="[MẪU] ĐẶT LỊCH PHIÊN TRẢI NGHIỆM"
          descriptionB2C="[MẪU] Để lại thông tin để Trạm sắp xếp lịch hẹn phù hợp nhất cùng bạn."
        />
      </div>

      {/* 8. LeadMagnetCarousel list */}
      <div id="demo-pk21-lead-list" className="space-y-6">
        <div>
          <h3 className="font-ui text-lg font-bold text-deep-navy">
            8. Khối LeadMagnetCarousel: Dạng Danh sách (List) (PK-21 1.5)
          </h3>
          <p className="font-ui text-sm text-deep-navy/70">
            [MẪU] Hiển thị dạng danh sách thẻ trắng, tiêu đề hồng sen, mô tả ngắn và nút nhận tài liệu.
          </p>
        </div>
        <LeadMagnetCarousel
          display="list"
          seriesLabel="[MẪU] Tài liệu hữu ích"
          titleLine1="[MẪU] CẨM NANG"
          titleLine2="[MẪU] CHĂM SÓC CẢM XÚC"
          emotionLine="[MẪU] Tài nguyên tự thực hành được gửi trực tiếp đến hộp thư của bạn."
          items={[
            {
              id: 'm1',
              name: '[MẪU] Cẩm nang Nhận diện Cảm xúc',
              slug: 'cam-nang-nhan-dien-cam-xuc',
              shortDescription: '[MẪU] Hướng dẫn gọi tên và điều hòa 10 trạng thái cảm xúc phổ biến.',
            },
            {
              id: 'm2',
              name: '[MẪU] Bảng Theo dõi Thói quen 28 Ngày',
              slug: 'bang-theo-doi-thoi-quen-28-ngay',
              shortDescription: '[MẪU] Mẫu in sẵn giúp duy trì nhịp điệu tích cực mỗi ngày.',
            },
          ]}
        />
      </div>

      {/* 9. LibraryPreview featured */}
      <div id="demo-pk21-library-featured" className="space-y-6">
        <div>
          <h3 className="font-ui text-lg font-bold text-deep-navy">
            9. Khối LibraryPreview: Bố cục Nổi bật (Featured) (PK-21 1.5)
          </h3>
          <p className="font-ui text-sm text-deep-navy/70">
            [MẪU] 1 bài viết lớn nổi bật ở trên, 3 bài viết nhỏ hơn ở dưới kèm nhãn chủ đề và thời gian đọc.
          </p>
        </div>
        <LibraryPreview
          layout="featured"
          seriesLabel="[MẪU] Góc nhìn"
          titleLine1="[MẪU] BÀI VIẾT"
          titleLine2="[MẪU] NỔI BẬT NHẤT"
          emotionLine="[MẪU] Những chia sẻ sâu sắc về tâm lý và thực hành cảm xúc."
          items={[
            {
              id: 'p1',
              isPost: true,
              title: '[MẪU] Hiểu về cơn giận và cách lắng nghe thông điệp ẩn giấu',
              slug: 'mau-hieu-ve-con-gian',
              format: 'article',
              topic: 'Cảm xúc',
              readingMinutes: 5,
              excerpt: '[MẪU] Cơn giận không phải kẻ thù, mà là tiếng chuông báo hiệu ranh giới của bạn đang bị xâm phạm.',
              featured: true,
              thumbnail: { src: '/brand/sample-cover.svg', alt: '[MẪU] Cơn giận' },
            },
            {
              id: 'p2',
              isPost: true,
              title: '[MẪU] 5 phút tĩnh lặng trước giờ làm việc',
              slug: 'mau-5-phut-tinh-lang',
              format: 'article',
              topic: 'Thói quen',
              readingMinutes: 3,
              thumbnail: { src: '/brand/sample-cover.svg', alt: '[MẪU] Tĩnh lặng' },
            },
            {
              id: 'p3',
              isPost: true,
              title: '[MẪU] Khi nào bạn cần tìm đến một Coach chuyên nghiệp?',
              slug: 'mau-khi-nao-can-coach',
              format: 'article',
              topic: 'Khai vấn',
              readingMinutes: 4,
              thumbnail: { src: '/brand/sample-cover.svg', alt: '[MẪU] Khai vấn' },
            },
          ]}
        />
      </div>

      {/* 10. Callout strip */}
      <div id="demo-pk21-callout-strip" className="space-y-6">
        <div>
          <h3 className="font-ui text-lg font-bold text-deep-navy">
            10. Khối Callout: Dải Ghi chú Mảnh (Strip) (PK-21 1.6)
          </h3>
          <p className="font-ui text-sm text-deep-navy/70">
            [MẪU] Dải ghi chú nền hồng mềm, tiêu đề in hoa tiền tố, tô hồng sen cho cụm từ được đánh dấu dấu sao kép.
          </p>
        </div>
        <Callout
          variant="strip"
          title="[MẪU] LƯU Ý TỪ TRẠM:"
          description="Mọi cảm xúc đều xứng đáng được **lắng nghe** và **chăm sóc** trọn vẹn mỗi ngày."
          showButton={true}
          buttonText="[MẪU] Tìm hiểu thêm"
          buttonLink="/ve-hana"
        />
      </div>
    </div>
  )
}
