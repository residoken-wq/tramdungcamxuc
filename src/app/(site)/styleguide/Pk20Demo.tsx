'use client'

import React from 'react'
import { IconCard } from '@/components/site/IconCard'
import { BrandImage } from '@/components/ui/BrandImage'
import { blockStyleCss } from '@/puck/style/style-css'

export function Pk20Demo() {
  return (
    <div className="space-y-16">
      {/* 1. Thẻ có vạch màu đầu thẻ (cardAccent) */}
      <div id="demo-pk20-accent" data-eb-id="demo-pk20-accent">
        <style>{blockStyleCss('demo-pk20-accent', { cardAccent: 'cycle' })}</style>
        <div className="mb-4">
          <h3 className="font-ui text-lg font-bold text-deep-navy">
            [MẪU] Vạch màu xoay vòng trên đầu thẻ (Card Accent: Cycle)
          </h3>
          <p className="font-ui text-sm text-deep-navy/70">
            [MẪU] Thẻ 1: Hồng sen, Thẻ 2: Hồng nhấn, Thẻ 3: Xanh thẫm (vạch dày 6px).
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <IconCard
            icon="star"
            title="[MẪU] Bước 1 - Lắng nghe"
            text="[MẪU] Thẻ đầu tiên mang vạch màu hồng sen tươi mới."
            index={0}
            marker="icon"
          />
          <IconCard
            icon="heart"
            title="[MẪU] Bước 2 - Thấu cảm"
            text="[MẪU] Thẻ thứ hai mang vạch màu hồng nhấn ấm áp."
            index={1}
            marker="icon"
          />
          <IconCard
            icon="target"
            title="[MẪU] Bước 3 - Hành động"
            text="[MẪU] Thẻ thứ ba mang vạch màu xanh thẫm vững chãi."
            index={2}
            marker="icon"
          />
        </div>
      </div>

      {/* 2. Thẻ nổi bật: Navy & Outline */}
      <div id="demo-pk20-highlight">
        <div className="mb-4">
          <h3 className="font-ui text-lg font-bold text-deep-navy">
            [MẪU] Thẻ nổi bật trong lưới (Highlight: Navy & Outline)
          </h3>
          <p className="font-ui text-sm text-deep-navy/70">
            [MẪU] Thẻ 1: Mặc định, Thẻ 2: Viền hồng (outline), Thẻ 3: Nền xanh thẫm (navy).
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <IconCard
            icon="star"
            title="[MẪU] Gói Cơ Bản"
            text="[MẪU] Khung thẻ mặc định thanh lịch."
            highlight="none"
            index={0}
            marker="number"
          />
          <IconCard
            icon="sparkles"
            title="[MẪU] Gói Phổ Biến"
            text="[MẪU] Viền hồng 2px nổi bật thu hút ánh nhìn."
            highlight="outline"
            index={1}
            marker="number"
          />
          <IconCard
            icon="heart"
            title="[MẪU] Gói Chuyên Sâu"
            text="[MẪU] Nền xanh thẫm uy tín với chữ và số nổi bật."
            highlight="navy"
            index={2}
            marker="number"
          />
        </div>
      </div>

      {/* 3. Thẻ kính mờ (cardFrame: 'glass') */}
      <div
        id="demo-pk20-glass"
        data-eb-id="demo-pk20-glass"
        className="p-8 rounded-card bg-gradient-to-br from-lavender-mist to-soft-pink"
      >
        <style>{blockStyleCss('demo-pk20-glass', { cardFrame: 'glass' })}</style>
        <div className="mb-4">
          <h3 className="font-ui text-lg font-bold text-deep-navy">
            [MẪU] Khung thẻ kính mờ (Card Frame: Glass)
          </h3>
          <p className="font-ui text-sm text-deep-navy/70">
            [MẪU] Nền trắng mờ 70% với backdrop-blur và viền trắng tinh tế.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <IconCard
            icon="star"
            title="[MẪU] Không gian tĩnh lặng"
            text="[MẪU] Kính mờ nhẹ nhàng hoà quyện với nền gradient."
            index={0}
            marker="icon"
          />
          <IconCard
            icon="target"
            title="[MẪU] Nhịp dừng cảm xúc"
            text="[MẪU] Giữ vững khoảng thở và sự tập trung ấm áp."
            index={1}
            marker="icon"
          />
        </div>
      </div>

      {/* 4. BrandImage: 4 hình dạng, nhãn và thẻ chú thích */}
      <div id="demo-pk20-brand-image">
        <div className="mb-4">
          <h3 className="font-ui text-lg font-bold text-deep-navy">
            [MẪU] Ảnh thương hiệu dùng chung (BrandImage)
          </h3>
          <p className="font-ui text-sm text-deep-navy/70">
            [MẪU] Hình dạng (Bo thường, Vòm trái, Vòm phải, Sóng), nhãn góc trên và thẻ chú thích
            nổi có avatar.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 4a. Bo góc thường + Nhãn + Chú thích có avatar */}
          <div id="brand-image-rounded" className="aspect-[4/5] relative">
            <BrandImage
              src="/brand/sample-cover.svg"
              alt="[MẪU] Ảnh bo góc thường"
              fill
              shape="rounded"
              badge="✨ [MẪU] TIÊU CHUẨN"
              caption={{
                title: '[MẪU] 500+ Giờ Coach',
                subtitle: '[MẪU] ICF Certified',
                avatars: ['/brand/sample-avatar.svg'],
              }}
              captionPosition="bottom-left"
            />
          </div>

          {/* 4b. Vòm trái */}
          <div id="brand-image-arch-left" className="aspect-[4/5] relative">
            <BrandImage
              src="/brand/sample-cover.svg"
              alt="[MẪU] Ảnh vòm trái"
              fill
              shape="arch-left"
              badge="[MẪU] VÒM TRÁI"
              caption={{
                title: '[MẪU] Đồng hành 1:1',
                subtitle: '[MẪU] Vững vàng',
              }}
              captionPosition="bottom-right"
            />
          </div>

          {/* 4c. Vòm phải */}
          <div id="brand-image-arch-right" className="aspect-[4/5] relative">
            <BrandImage
              src="/brand/sample-cover.svg"
              alt="[MẪU] Ảnh vòm phải"
              fill
              shape="arch-right"
              caption={{
                title: '[MẪU] Chuyển mình',
                subtitle: '[MẪU] Bình an',
              }}
              captionPosition="bottom-left"
            />
          </div>

          {/* 4d. Sóng tự nhiên */}
          <div id="brand-image-wave" className="aspect-[4/5] relative">
            <BrandImage
              src="/brand/sample-cover.svg"
              alt="[MẪU] Ảnh mép sóng"
              fill
              shape="wave"
              caption={{
                title: '[MẪU] Dòng chảy',
                subtitle: '[MẪU] Tự nhiên',
              }}
              captionPosition="bottom-right"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
