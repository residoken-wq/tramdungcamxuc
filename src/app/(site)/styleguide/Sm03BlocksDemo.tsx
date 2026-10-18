'use client'

import React from 'react'
import { IconCardGrid } from '@/components/site/IconCardGrid'
import { Callout } from '@/components/site/Callout'
import { QuoteBlock } from '@/components/ui/QuoteBlock'
import { StatsBar } from '@/components/site/StatsBar'
import { HeroTwoEntries } from '@/components/site/HeroTwoEntries'
import { HeroImage } from '@/components/site/HeroImage'
import { PackageCards } from '@/components/site/PackageCards'
import { PackageComparison } from '@/components/site/PackageComparison'
import { SolutionEcosystem } from '@/components/site/SolutionEcosystem'
import { TestimonialGrid } from '@/components/site/TestimonialGrid'
import { FAQ } from '@/components/site/FAQ'
import { CTASection } from '@/components/site/CTASection'
import type { PublicProduct } from '@/lib/products'
import type { PublicTestimonial } from '@/lib/testimonials'

const mockPackages: PublicProduct[] = [
  {
    id: 'pkg-clear',
    name: '[MẪU] Gói CLEAR',
    slug: 'clear',
    web: 'site',
    type: 'package',
    price: 1750000,
    salePrice: null,
    tagline: '[MẪU] Thấu hiểu bản thân',
    icon: 'compass',
    shortDescription: '[MẪU] Nhận diện và làm quen với bản đồ cảm xúc cá nhân',
    saleStatus: 'on_sale',
  },
  {
    id: 'pkg-build',
    name: '[MẪU] Gói BUILD',
    slug: 'build',
    web: 'site',
    type: 'package',
    price: 2900000,
    salePrice: null,
    tagline: '[MẪU] Kiến tạo sự vững vàng',
    icon: 'shield',
    shortDescription: '[MẪU] Xây dựng thói quen điều hòa cảm xúc và rèn luyện bền bỉ',
    saleStatus: 'on_sale',
  },
  {
    id: 'pkg-shine',
    name: '[MẪU] Gói SHINE',
    slug: 'shine',
    web: 'site',
    type: 'package',
    price: 4320000,
    salePrice: null,
    tagline: '[MẪU] Tỏa sáng thế mạnh riêng',
    icon: 'spark',
    shortDescription: '[MẪU] Chuyển hóa toàn diện và phát huy tiềm năng độc bản',
    saleStatus: 'on_sale',
  },
]

const mockServices = [
  {
    id: 'srv-1',
    name: '[MẪU] Coaching 1:1 Vững vàng chuyển mình',
    slug: 'vung-vang-chuyen-minh',
    audienceLabel: '[MẪU] Dành cho chuyên gia & người đang chuyển bước',
    ctaLabel: '[MẪU] Khám phá dịch vụ',
  },
]

const mockPrograms = [
  {
    id: 'prg-1',
    name: '[MẪU] Trí tuệ cảm xúc cho Nhà lãnh đạo',
    slug: 'eq-cho-lanh-dao',
    learnerGroup: '[MẪU] Quản lý cấp trung & cấp cao',
    ctaLabel: '[MẪU] Trao đổi chương trình',
  },
]

const mockTestimonials: PublicTestimonial[] = [
  {
    id: 'test-1',
    name: '[MẪU] Học viên Test 01',
    role: '[MẪU] Chuyên viên Sản phẩm',
    age: 32,
    quote:
      '[MẪU] Phiên trải nghiệm đã giúp tôi nhận diện những nút thắt cảm xúc mà bấy lâu nay vô tình né tránh.',
    consent: true,
    relatedOffer: '[MẪU] Gói BUILD',
    photo: {
      url: '/brand/sample-avatar.svg',
      alt: '[MẪU] Học viên Test 01',
    },
    story: {
      before:
        '[MẪU] Thường xuyên căng thẳng, hoài nghi năng lực bản thân và sợ đưa ra quyết định quan trọng.',
      insight: '[MẪU] Hiểu rằng cảm xúc bất an là một tín hiệu tự nhiên, học cách dừng lại một nhịp.',
      after: '[MẪU] Bình tĩnh trước áp lực, tự tin dẫn dắt đội ngũ và biết cách cân bằng cảm xúc cá nhân.',
    },
  },
  {
    id: 'test-2',
    name: '[MẪU] Học viên Test 02',
    role: '[MẪU] Chuyên viên Nhân sự',
    age: 28,
    quote:
      '[MẪU] Bộ công cụ số Habit Tracker cùng sự đồng hành đã thay đổi hoàn toàn cách tôi rèn luyện.',
    consent: true,
    relatedOffer: '[MẪU] Gói CLEAR',
    photo: {
      url: '/brand/sample-avatar.svg',
      alt: '[MẪU] Học viên Test 02',
    },
    story: {
      before: '[MẪU] Bị cuốn vào vòng xoáy trì hoãn, luôn cảm thấy thiếu năng lượng mỗi sáng.',
      insight: '[MẪU] Nhận diện thói quen cũ và xây dựng Habit Loop 5 phút đơn giản, không áp lực.',
      after: '[MẪU] Duy trì chuỗi 21 ngày liên tục, tái tạo năng lượng tích cực và yêu công việc hơn.',
    },
  },
  {
    id: 'test-3',
    name: '[MẪU] Học viên Test 03',
    role: '[MẪU] Giám đốc Điều hành',
    age: 36,
    quote: '[MẪU] Một không gian ấm áp, an toàn và chuyên nghiệp để lắng đọng và chuyển mình.',
    consent: true,
    relatedOffer: '[MẪU] Gói SHINE',
    photo: {
      url: '/brand/sample-avatar.svg',
      alt: '[MẪU] Học viên Test 03',
    },
    story: {
      before: '[MẪU] Áp lực vận hành lớn, cảm giác cô đơn và mất kết nối với bản thân.',
      insight: '[MẪU] Chấp nhận những cảm xúc khó khăn và tìm lại giá trị cốt lõi của người làm lãnh đạo.',
      after: '[MẪU] Vững vàng đưa ra chiến lược mới, lan tỏa sự thấu cảm tới toàn bộ đội ngũ.',
    },
  },
]

export function Sm03BlocksDemo() {
  return (
    <div className="space-y-16">
      {/* 1. IconCardGrid: Marker Icon & Number */}
      <div className="space-y-6">
        <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy border-b border-deep-navy/10 pb-2">
          1. IconCardGrid – Marker Icon (Trang chủ tr. 5) &amp; Marker Number (Trang lộ trình tr. 16)
        </h3>
        <div className="rounded-card overflow-hidden border border-deep-navy/10 bg-warm-ivory">
          <IconCardGrid
            seriesLabel="[MẪU] 4 Nỗi đau thường gặp"
            titleLine1="[MẪU] NHỮNG RÀO CẢN"
            titleLine2="[MẪU] KHIẾN BẠN CHÙN BƯỚC"
            marker="number"
            columns={4}
            items={[
              {
                title: '[MẪU] Trì hoãn kéo dài',
                text: '[MẪU] Bắt đầu với quyết tâm cao nhưng khó duy trì bền bỉ vì thiếu hệ thống.',
              },
              {
                title: '[MẪU] Choáng ngợp cảm xúc',
                text: '[MẪU] Chưa nhận diện được thông điệp của cảm xúc bên trong dẫn đến phản ứng bốc đồng.',
              },
              {
                title: '[MẪU] Mất phương hướng',
                text: '[MẪU] Loay hoay giữa nhiều ngã rẽ sự nghiệp mà không rõ thế mạnh cốt lõi.',
              },
              {
                title: '[MẪU] Cô đơn trong chuyển mình',
                text: '[MẪU] Cần một không gian an toàn để soi chiếu và phản chiếu khách quan.',
              },
            ]}
          />
        </div>
      </div>

      {/* 2. Callout */}
      <div className="space-y-6">
        <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy border-b border-deep-navy/10 pb-2">
          2. Callout – Thẻ nền Deep Navy (Trang lộ trình tr. 16)
        </h3>
        <Callout
          title="[MẪU] Bạn không cần phải tự mình vượt qua giai đoạn này một mình"
          description="[MẪU] Một phiên trải nghiệm 149.000đ sẽ giúp bạn thấu suốt bức tranh hiện tại và tìm ra hướng đi vững chãi nhất."
          buttonText="[MẪU] Đặt phiên trải nghiệm ngay"
          buttonLink="/dat-phien-trai-nghiem"
        />
      </div>

      {/* 3. QuoteBlock v2 (Dark Tone) */}
      <div className="space-y-6">
        <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy border-b border-deep-navy/10 pb-2">
          3. QuoteBlock v2 – Nền Deep Navy Chữ Trắng (Trang chủ tr. 5)
        </h3>
        <QuoteBlock
          theme="dark"
          quote="[MẪU] Cảm xúc không phải là kẻ thù cần chế ngự. Cảm xúc là người bạn chỉ đường cần được lắng nghe và thấu hiểu."
          cite="[MẪU] Người đồng hành"
          roleOrContext="[MẪU] Chuyên gia Khai vấn Cảm xúc & Sự nghiệp"
        />
      </div>

      {/* 4. StatsBar v2 */}
      <div className="space-y-6">
        <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy border-b border-deep-navy/10 pb-2">
          4. StatsBar v2 – Có Icon &amp; Mô tả chi tiết (Trang chủ tr. 8)
        </h3>
        <StatsBar
          stats={[
            {
              value: '[MẪU] 10+',
              label: '[MẪU] Năm kinh nghiệm',
              description: '[MẪU] Trong lĩnh vực quản trị và đào tạo nhân sự',
            },
            {
              icon: 'shield',
              value: '',
              label: '[MẪU] ICF ACC Coach',
              description: '[MẪU] Chứng chỉ Khai vấn Chuyên nghiệp Quốc tế',
            },
            {
              value: '[MẪU] 500+',
              label: '[MẪU] Giờ khai vấn 1:1',
              description: '[MẪU] Đồng hành cùng học viên và nhà quản lý',
            },
          ]}
        />
      </div>

      {/* 5. HeroTwoEntries v2 (With Image) */}
      <div className="space-y-6">
        <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy border-b border-deep-navy/10 pb-2">
          5. HeroTwoEntries v2 – Bố cục chữ trái, ảnh phải &amp; Group Label
        </h3>
        <div className="rounded-card overflow-hidden border border-deep-navy/10">
          <HeroTwoEntries
            seriesLabel="[MẪU] Trạm Dừng Cảm Xúc"
            titleLine1="[MẪU] HIỂU MÌNH RÕ. HÀNH ĐỘNG BỀN BỈ."
            titleLine2="[MẪU] TỎA SÁNG BẰNG THẾ MẠNH RIÊNG."
            emotionLine="[MẪU] Không gian ấm áp đồng hành cùng sự chuyển mình của bạn"
            description="[MẪU] Chào mừng bạn đến với Trạm. Dù bạn là cá nhân đang tìm kiếm điểm tựa nội tâm hay doanh nghiệp mong muốn phát triển văn hóa đội ngũ, Trạm luôn có giải pháp phù hợp."
            imageUrl="/brand/sample-cover.svg"
            imageAlt="[MẪU] Minh họa Trạm Dừng Cảm Xúc"
            entry1={{
              groupLabel: '[MẪU] DÀNH CHO CÁ NHÂN',
              label: '[MẪU] Cá nhân',
              description: '[MẪU] Tôi đang ở một bước chuyển trong sự nghiệp và cuộc sống',
              buttonText: '[MẪU] Khám phá lộ trình',
              buttonLink: '/coaching',
              buttonStyle: 'solid',
            }}
            entry2={{
              groupLabel: '[MẪU] DÀNH CHO DOANH NGHIỆP',
              label: '[MẪU] Doanh nghiệp',
              description: '[MẪU] Tôi muốn việc học tạo ra hành vi và văn hóa thực tế',
              buttonText: '[MẪU] Trao đổi chương trình',
              buttonLink: '/doanh-nghiep',
              buttonStyle: 'outline',
            }}
          />
        </div>
      </div>

      {/* 6. HeroImage v2 */}
      <div className="space-y-6">
        <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy border-b border-deep-navy/10 pb-2">
          6. HeroImage v2 – Nút thứ 2, Badges &amp; Stats Strip (Tr. 26 / 39)
        </h3>
        <div className="rounded-card overflow-hidden border border-deep-navy/10">
          <HeroImage
            seriesLabel="[MẪU] Lộ trình đồng hành chuyên sâu"
            titleLine1="[MẪU] VỮNG VÀNG"
            titleLine2="[MẪU] CHUYỂN MÌNH"
            emotionLine="[MẪU] Hành trình tái kết nối và bứt phá sự nghiệp"
            buttonText="[MẪU] Đặt phiên trải nghiệm"
            buttonLink="/dat-phien-trai-nghiem"
            secondaryButtonText="[MẪU] Tìm hiểu các gói"
            secondaryButtonLink="#packages"
            badges={[
              { text: '[MẪU] Bảo mật tuyệt đối' },
              { text: '[MẪU] Chuẩn quốc tế ICF' },
              { text: '[MẪU] Cá nhân hóa 100%' },
            ]}
            stats={[
              { value: '[MẪU] 1:1', label: '[MẪU] Tương tác trực tiếp' },
              { value: '[MẪU] 3 - 6', label: '[MẪU] Tháng đồng hành' },
              { value: '[MẪU] 98%', label: '[MẪU] Hài lòng chuyển hóa' },
            ]}
          />
        </div>
      </div>

      {/* 7. PackageCards */}
      <div className="space-y-6">
        <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy border-b border-deep-navy/10 pb-2">
          7. PackageCards – Thẻ 3 gói Growth Mirror (Trang chủ tr. 4 &amp; Lộ trình tr. 17)
        </h3>
        <PackageCards
          seriesLabel="[MẪU] 3 Gói Growth Mirror"
          titleLine1="[MẪU] CHỌN LỘ TRÌNH"
          titleLine2="[MẪU] PHÙ HỢP VỚI BẠN"
          emotionLine="[MẪU] Mỗi giai đoạn chuyển mình cần một sự nâng đỡ và cường độ khác nhau"
          style="icon"
          highlightPackageId="pkg-build"
          buttonText="[MẪU] Khám phá chi tiết so sánh các gói"
          buttonLink="/lo-trinh-chuyen-minh"
          _resolved={{
            packages: mockPackages,
          }}
        />
      </div>

      {/* 8. PackageComparison v3 */}
      <div className="space-y-6">
        <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy border-b border-deep-navy/10 pb-2">
          8. PackageComparison v3 – Cột nổi bật nền Deep Navy &amp; Nút chọn gói dẫn tới Đặt phiên trải nghiệm (Tr. 18)
        </h3>
        <PackageComparison
          showPackageButtons={true}
          highlightPackageId="pkg-build"
          _resolved={{
            packages: mockPackages,
          }}
        />
      </div>

      {/* 9. SolutionEcosystem */}
      <div className="space-y-6">
        <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy border-b border-deep-navy/10 pb-2">
          9. SolutionEcosystem – Hệ sinh thái 3 trụ cột (Cột giữa nền Deep Navy, Trang chủ tr. 10)
        </h3>
        <SolutionEcosystem
          seriesLabel="[MẪU] Hệ sinh thái giải pháp"
          titleLine1="[MẪU] ĐỒNG HÀNH TOÀN DIỆN"
          titleLine2="[MẪU] TRÊN MỌI CHẶNG ĐƯỜNG"
          emotionLine="[MẪU] Từ bước tự nhận thức đầu tiên đến sự chuyển hóa sâu sắc"
          col1Title="[MẪU] Đào tạo cá nhân"
          col1Description="[MẪU] Các công cụ số và lộ trình tự học linh hoạt theo nhịp sống"
          col2Title="[MẪU] Khai vấn 1:1"
          col2Description="[MẪU] Đồng hành chuyên sâu cá nhân hóa theo phương pháp ICF"
          col3Title="[MẪU] Doanh nghiệp"
          col3Description="[MẪU] Giải pháp phát triển trí tuệ cảm xúc cho đội ngũ và lãnh đạo"
          _resolved={{
            products: mockPackages.slice(0, 2),
            services: mockServices,
            programs: mockPrograms,
          }}
        />
      </div>

      {/* 10. TestimonialGrid v2: Story & Stages */}
      <div className="space-y-6">
        <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy border-b border-deep-navy/10 pb-2">
          10. TestimonialGrid v2 – Story (Trước / Sau tr. 19) &amp; Stages (3 Giai đoạn tr. 44)
        </h3>
        <div className="space-y-8">
          <div>
            <span className="block font-ui text-xs font-bold uppercase text-bright-magenta mb-2">
              Variant: Story (Trước / Sau)
            </span>
            <TestimonialGrid
              variant="story"
              _resolved={{
                testimonials: mockTestimonials,
              }}
            />
          </div>
          <div>
            <span className="block font-ui text-xs font-bold uppercase text-bright-magenta mb-2">
              Variant: Stages (3 Giai đoạn chuyển hóa)
            </span>
            <TestimonialGrid
              variant="stages"
              _resolved={{
                testimonials: mockTestimonials,
              }}
            />
          </div>
        </div>
      </div>

      {/* 11. FAQ v2 */}
      <div className="space-y-6">
        <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy border-b border-deep-navy/10 pb-2">
          11. FAQ v2 – Đánh số thứ tự (Numbered) &amp; Khối Booking Aside bên trái (Tr. 11, 20, 51)
        </h3>
        <FAQ
          numbered={true}
          aside="booking"
          bookingAsideTitle="[MẪU] Đặt phiên trải nghiệm"
          bookingAsideDescription="[MẪU] Nếu bạn còn bất kỳ băn khoăn nào về lộ trình, hãy đặt một phiên trò chuyện 1:1."
          bookingButtonText="[MẪU] Đặt lịch 149.000đ"
          showEmail={true}
          seeAllLink="/faq"
          _resolved={{
            email: 'lienhe@tramdungcamxuc.com',
          }}
          items={[
            {
              question: '[MẪU] Phiên trải nghiệm 149.000đ diễn ra như thế nào?',
              answer:
                '[MẪU] Phiên trải nghiệm diễn ra qua Google Meet. Chuyên gia sẽ lắng nghe khó khăn hiện tại, soi chiếu lại các điểm nghẽn cảm xúc và cùng bạn phác thảo lộ trình phù hợp.',
            },
            {
              question: '[MẪU] Tôi có được trừ 149.000đ khi đăng ký gói chính thức không?',
              answer:
                '[MẪU] Hiện tại phí phiên trải nghiệm là khoản phí riêng biệt cho phiên làm việc đó, không trừ vào giá gói chính thức.',
            },
            {
              question: '[MẪU] Nếu tôi ở xa thì có tham gia được không?',
              answer:
                '[MẪU] Toàn bộ các phiên khai vấn và công cụ số đều diễn ra online qua nền tảng số của Trạm, bạn có thể tham gia từ bất kỳ đâu.',
            },
          ]}
        />
      </div>

      {/* 12. CTASection */}
      <div className="space-y-6">
        <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy border-b border-deep-navy/10 pb-2">
          12. CTASection – Khối kêu gọi chuyển đổi lớn kèm dải bảo chứng (Trang lộ trình tr. 21)
        </h3>
        <CTASection
          seriesLabel="[MẪU] Bước đi đầu tiên"
          titleLine1="[MẪU] BẮT ĐẦU HÀNH TRÌNH"
          titleLine2="[MẪU] CHUYỂN MÌNH CÙNG TRẠM"
          emotionLine="[MẪU] Đừng để những bất an cảm xúc ngăn cản bạn bước tiếp"
          description="[MẪU] Dành tặng bản thân một khoảng dừng chất lượng để thấu hiểu chính mình và khai mở tiềm năng vốn có."
          buttonText="[MẪU] Đặt phiên trải nghiệm 149.000đ ngay"
          buttonLink="/dat-phien-trai-nghiem"
          proofText="[MẪU] Đồng hành cùng học viên và nhà quản lý trên toàn quốc"
          _resolved={{
            testimonials: mockTestimonials,
          }}
        />
      </div>
    </div>
  )
}
