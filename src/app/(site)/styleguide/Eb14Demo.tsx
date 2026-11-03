'use client'

import React from 'react'
import { HeroTwoEntries } from '@/components/site/HeroTwoEntries'

export function Eb14Demo() {
  return (
    <div className="space-y-16">
      {/* 1. Split Cũ */}
      <div id="demo-eb14-split-cu" className="space-y-4">
        <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy border-b border-deep-navy/10 pb-2">
          EB-14a: Split Cũ (1440px)
        </h3>
        <div className="rounded-card overflow-hidden border border-deep-navy/10">
          <HeroTwoEntries
            layout="split"
            seriesLabel="[MẪU] Trạm Dừng Cảm Xúc"
            titleLine1="[MẪU] HIỂU MÌNH RÕ. HÀNH ĐỘNG BỀN BỈ."
            titleLine2="[MẪU] TỎA SÁNG BẰNG THẾ MẠNH RIÊNG."
            emotionLine="[MẪU] Không gian ấm áp đồng hành cùng sự chuyển mình của bạn"
            description="[MẪU] Chào mừng bạn đến với Trạm. Bố cục split ảnh bên cạnh chữ."
            imageUrl="/brand/sample-cover.svg"
            imageAlt="[MẪU] Minh họa Split Cũ"
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

      {/* 2. Backdrop Tối */}
      <div id="demo-eb14-backdrop-toi" className="space-y-4">
        <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy border-b border-deep-navy/10 pb-2">
          EB-14a: Backdrop Tối (1440px / 375px)
        </h3>
        <div className="rounded-card overflow-hidden border border-deep-navy/10">
          <HeroTwoEntries
            layout="backdrop"
            overlayTone="dark"
            overlayStrength="lg"
            imageBlur="none"
            minHeight="md"
            seriesLabel="[MẪU] Trạm Dừng Cảm Xúc"
            titleLine1="[MẪU] HIỂU MÌNH RÕ. HÀNH ĐỘNG BỀN BỈ."
            titleLine2="[MẪU] TỎA SÁNG BẰNG THẾ MẠNH RIÊNG."
            emotionLine="[MẪU] Không gian ấm áp đồng hành cùng sự chuyển mình của bạn"
            description="[MẪU] Chào mừng bạn đến với Trạm. Ảnh làm nền, phủ tối deep-navy chữ trắng."
            imageUrl="/brand/sample-cover.svg"
            imageAlt="[MẪU] Minh họa Backdrop Tối"
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

      {/* 3. Backdrop Sáng */}
      <div id="demo-eb14-backdrop-sang" className="space-y-4">
        <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy border-b border-deep-navy/10 pb-2">
          EB-14a: Backdrop Sáng (1440px / 375px)
        </h3>
        <div className="rounded-card overflow-hidden border border-deep-navy/10">
          <HeroTwoEntries
            layout="backdrop"
            overlayTone="light"
            overlayStrength="lg"
            imageBlur="sm"
            minHeight="md"
            seriesLabel="[MẪU] Trạm Dừng Cảm Xúc"
            titleLine1="[MẪU] HIỂU MÌNH RÕ. HÀNH ĐỘNG BỀN BỈ."
            titleLine2="[MẪU] TỎA SÁNG BẰNG THẾ MẠNH RIÊNG."
            emotionLine="[MẪU] Không gian ấm áp đồng hành cùng sự chuyển mình của bạn"
            description="[MẪU] Chào mừng bạn đến với Trạm. Ảnh làm nền, phủ sáng warm-ivory chữ tím than."
            imageUrl="/brand/sample-cover.svg"
            imageAlt="[MẪU] Minh họa Backdrop Sáng"
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

      {/* 4. Rows & Text Column (1.6) */}
      <div id="demo-eb14-rows-text-column" className="space-y-4">
        <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-deep-navy border-b border-deep-navy/10 pb-2">
          EB-14a: Mục 1.6 - Xếp hàng trên dưới trong cột chữ
        </h3>
        <div className="rounded-card overflow-hidden border border-deep-navy/10">
          <HeroTwoEntries
            layout="split"
            entriesLayout="rows"
            entriesPlacement="textColumn"
            seriesLabel="[MẪU] Trạm Dừng Cảm Xúc"
            titleLine1="[MẪU] HIỂU MÌNH RÕ. HÀNH ĐỘNG BỀN BỈ."
            titleLine2="[MẪU] TỎA SÁNG BẰNG THẾ MẠNH RIÊNG."
            emotionLine="[MẪU] Không gian ấm áp đồng hành cùng sự chuyển mình của bạn"
            description="[MẪU] 2 thẻ lối vào xếp hàng trên - dưới nằm trong cột chữ bên trái."
            imageUrl="/brand/sample-cover.svg"
            imageAlt="[MẪU] Minh họa Rows Text Column"
            entry1={{
              groupLabel: '[MẪU] CHO CÁ NHÂN',
              description: '[MẪU] Phát triển Năng lực & Sự nghiệp',
              buttonText: '[MẪU] KHÁM PHÁ CÁC LỘ TRÌNH',
              buttonLink: '/ca-nhan',
              buttonStyle: 'solid',
            }}
            entry2={{
              groupLabel: '[MẪU] CHO DOANH NGHIỆP',
              description: '[MẪU] Giải pháp phát triển năng lực EQ và thói quen làm việc linh hoạt',
              buttonText: '[MẪU] TÌM HIỂU THÊM',
              buttonLink: '/doanh-nghiep',
              buttonStyle: 'outline',
            }}
          />
        </div>
      </div>
    </div>
  )
}
