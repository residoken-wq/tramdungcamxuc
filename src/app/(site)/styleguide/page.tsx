import React from 'react'
import type { Metadata } from 'next'
import { headers as getHeaders } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { Logo, HeartLine, ThinLine, Valve, Butterfly, Leaf, BrandIcon } from '@/components/brand'
import { BRAND_ICONS } from '@/lib/brand/icons'
import { BRAND_COLORS_HEX, type BrandColorToken, BRAND_COLOR_DESCRIPTIONS } from '@/lib/brand/tokens'
import { InteractivePrimitivesDemo } from './InteractivePrimitivesDemo'
import { InteractiveCompositesDemo } from './InteractiveCompositesDemo'
import { EqShareDemo } from './EqShareDemo'
import { Sm03BlocksDemo } from './Sm03BlocksDemo'
import { Sm04BlocksDemo } from './Sm04BlocksDemo'
import { Sm05BlocksDemo } from './Sm05BlocksDemo'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Brand Styleguide',
  description: 'Bảng quy chuẩn thương hiệu Trạm Dừng Cảm Xúc (Brand Book 2026)',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function StyleguidePage() {
  const isPublic = process.env.NODE_ENV !== 'production' || process.env.STYLEGUIDE_PUBLIC === 'true'

  // Trong môi trường production thật, chỉ người dùng đã đăng nhập admin Payload mới có quyền xem
  if (!isPublic) {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    const { user } = await payload.auth({ headers })
    if (!user) {
      notFound()
    }
  }

  const colorTokens = Object.keys(BRAND_COLORS_HEX) as BrandColorToken[]

  return (
    <div className="min-h-screen bg-warm-ivory text-deep-navy">
      {/* Top Banner */}
      <header className="border-b border-deep-navy/10 bg-warm-ivory/80 px-6 py-8 backdrop-blur-md">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-block rounded-full bg-soft-pink px-3 py-1 text-xs font-bold tracking-wider uppercase text-bright-magenta">
                Brand Book 2026
              </span>
              <h1 className="mt-2 font-display text-4xl uppercase tracking-tight text-deep-navy sm:text-5xl">
                Brand Styleguide
              </h1>
              <p className="mt-1 font-ui text-sm text-deep-navy/70">
                Hệ thống nhận diện thương hiệu Trạm Dừng Cảm Xúc
              </p>
            </div>
            <Logo width={140} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-16 px-6 py-12">
        {/* Section 1: Signature Two-tone Heading */}
        <section aria-labelledby="heading-signature">
          <h2
            id="heading-signature"
            className="mb-6 font-ui text-xs font-bold tracking-widest uppercase text-bright-magenta"
          >
            1. Tiêu đề 2 tầng màu đặc trưng (Signature Two-Tone Heading)
          </h2>
          <div className="rounded-card border border-deep-navy/10 bg-white p-8 shadow-soft">
            <p className="mb-2 font-ui text-xs font-semibold tracking-wider uppercase text-deep-navy/60">
              Series Label: TẬP THƯƠNG CẢM XÚC
            </p>
            <div className="space-y-1">
              <h3 className="font-display text-4xl uppercase tracking-tight text-deep-navy sm:text-5xl">
                Hiểu mình rõ.
              </h3>
              <h3 className="font-display text-4xl uppercase tracking-tight text-bright-magenta sm:text-5xl">
                Hành động bền bỉ.
              </h3>
            </div>
            <p className="mt-4 font-quote text-xl italic text-deep-navy/80">
              Tỏa sáng bằng thế mạnh riêng trong từng nhịp thở thường ngày.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {/* a11y-contrast-ok: SVG trang trí HeartLine hiển thị mẫu */}
              <HeartLine className="text-accent-pink" width={56} height={20} />
              <span className="font-ui text-xs text-deep-navy/70">
                Quy tắc: Dòng 1 Anton (deep-navy) → Dòng 2 Anton (bright-magenta) → Dòng cảm xúc
                Playfair Display Italic
              </span>
            </div>
          </div>
        </section>

        {/* Section 2: Colors */}
        <section aria-labelledby="heading-colors">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
            <h2
              id="heading-colors"
              className="font-ui text-xs font-bold tracking-widest uppercase text-bright-magenta"
            >
              2. Bảng 8 màu chuẩn thương hiệu (Chỉ dùng các token này)
            </h2>
            <span className="font-ui text-xs text-deep-navy/60">
              Khai báo trong tailwind.config.ts & styles.css
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {colorTokens.map((token) => {
              const hex = BRAND_COLORS_HEX[token]
              const desc = BRAND_COLOR_DESCRIPTIONS[token]
              const isDark =
                token === 'deep-navy' || token === 'bright-magenta' || token === 'accent-pink'

              return (
                <div
                  key={token}
                  className="flex flex-col justify-between overflow-hidden rounded-card border border-deep-navy/10 bg-white shadow-soft transition-transform hover:-translate-y-1"
                >
                  <div className="flex h-28 items-end p-4" style={{ backgroundColor: hex }}>
                    <span
                      className={`font-display text-xl uppercase ${
                        isDark ? 'text-white' : 'text-deep-navy'
                      }`}
                    >
                      {hex}
                    </span>
                  </div>
                  <div className="space-y-1.5 p-4">
                    <p className="font-ui text-base font-bold text-deep-navy">{token}</p>
                    <p className="font-ui text-xs leading-relaxed text-deep-navy/70">{desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Section 3: Typography & Diacritics */}
        <section aria-labelledby="heading-typography">
          <h2
            id="heading-typography"
            className="mb-6 font-ui text-xs font-bold tracking-widest uppercase text-bright-magenta"
          >
            3. Typography & Kiểm tra dấu tiếng Việt (Font Check)
          </h2>

          <div className="space-y-6">
            {/* Anton */}
            <div className="rounded-card border border-deep-navy/10 bg-white p-6 shadow-soft">
              <div className="mb-3 flex items-center justify-between border-b border-deep-navy/10 pb-2">
                <span className="font-ui text-xs font-bold uppercase tracking-wider text-deep-navy">
                  Font Display: Anton (Weight 400) – Tiêu đề chính H1, H2
                </span>
                <span className="font-ui text-xs text-deep-navy/70">--font-display</span>
              </div>
              <p className="font-display text-2xl uppercase tracking-tight text-deep-navy sm:text-3xl">
                Trạm Dừng Cảm Xúc – Hiểu mình rõ. Hành động bền bỉ. Tỏa sáng bằng thế mạnh riêng.
              </p>
              {/* Critical Vietnamese Diacritics Verification */}
              <div className="mt-4 rounded-lg bg-lavender-mist/40 p-4">
                <p className="mb-1 font-ui text-xs font-semibold text-deep-navy/70">
                  Kiểm tra dấu tiếng Việt đặc thù (Vietnamese Diacritics Test):
                </p>
                <p className="font-display text-3xl tracking-wide text-bright-magenta sm:text-4xl">
                  Ữ Ộ Ặ Ỷ Ẫ Ỡ ữ ộ ặ ỷ
                </p>
                <p className="mt-1 font-ui text-xs text-deep-navy/60">
                  (Đảm bảo Anton hiển thị đúng vị trí dấu tiếng Việt, không bị rơi hoặc lỗi glyph)
                </p>
              </div>
            </div>

            {/* Montserrat */}
            <div className="rounded-card border border-deep-navy/10 bg-white p-6 shadow-soft">
              <div className="mb-3 flex items-center justify-between border-b border-deep-navy/10 pb-2">
                <span className="font-ui text-xs font-bold uppercase tracking-wider text-deep-navy">
                  Font UI & Body: Montserrat (Weights 400, 600, 700) – Đoạn văn, nhãn, nút
                </span>
                <span className="font-ui text-xs text-deep-navy/70">--font-ui</span>
              </div>
              <div className="space-y-3 font-ui text-deep-navy">
                <p className="font-normal text-base">
                  <span className="font-semibold text-xs uppercase text-deep-navy/70 mr-2">
                    Regular 400:
                  </span>
                  Trạm Dừng Cảm Xúc là không gian đồng hành cùng bạn nhận diện, điều hòa cảm xúc và
                  chuyển hóa thành thói quen hành động bền vững.
                </p>
                <p className="font-semibold text-base">
                  <span className="font-semibold text-xs uppercase text-deep-navy/70 mr-2">
                    SemiBold 600:
                  </span>
                  Chẩn đoán thói quen 5 phút · Bộ công cụ số Habit Tracker · EQ Buddy 26 thẻ cảm
                  xúc.
                </p>
                <p className="font-bold text-base">
                  <span className="font-semibold text-xs uppercase text-deep-navy/70 mr-2">
                    Bold 700:
                  </span>
                  Đặt phiên trải nghiệm · Dùng thử 21 ngày miễn phí · Khám phá cách Hana đồng hành.
                </p>
              </div>
            </div>

            {/* Playfair Display */}
            <div className="rounded-card border border-deep-navy/10 bg-white p-6 shadow-soft">
              <div className="mb-3 flex items-center justify-between border-b border-deep-navy/10 pb-2">
                <span className="font-ui text-xs font-bold uppercase tracking-wider text-deep-navy">
                  Font Quote: Playfair Display (Style Italic) – Câu quote, dòng cảm xúc
                </span>
                <span className="font-ui text-xs text-deep-navy/70">--font-quote</span>
              </div>
              <blockquote className="font-quote text-xl italic text-deep-navy/90 sm:text-2xl">
                “Lỡ nhịp một ngày là không sao cả. Ngày hôm nay, bạn đã bỏ phiếu cho con người bạn
                muốn trở thành?”
              </blockquote>
            </div>
          </div>
        </section>

        {/* Section 4: Spacing, Radius, Shadow & Gradient */}
        <section aria-labelledby="heading-tokens">
          <h2
            id="heading-tokens"
            className="mb-6 font-ui text-xs font-bold tracking-widest uppercase text-bright-magenta"
          >
            4. Spacing (&ldquo;Khoảng thở&rdquo;), Bo góc, Bóng &amp; Nền Gradient
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Spacing tokens */}
            <div className="rounded-card border border-deep-navy/10 bg-white p-6 shadow-soft">
              <h3 className="mb-4 font-ui text-sm font-bold text-deep-navy">
                Khoảng thở thương hiệu (Breathing Spacing)
              </h3>
              <div className="space-y-4 font-ui text-xs">
                <div>
                  <div className="flex justify-between text-deep-navy/70 mb-1">
                    <span>space-breath-sm (16px)</span>
                    <span>Header → Heading</span>
                  </div>
                  <div className="h-4 w-full rounded bg-lavender-mist" />
                </div>
                <div>
                  <div className="flex justify-between text-deep-navy/70 mb-1">
                    <span>space-breath-md (24px)</span>
                    <span>Heading → Emotional line / Lề ngoài tối thiểu</span>
                  </div>
                  <div className="h-6 w-full rounded bg-soft-pink" />
                </div>
                <div>
                  <div className="flex justify-between text-deep-navy/70 mb-1">
                    <span>space-breath-lg (32px)</span>
                    <span>Emotional line → Hình ảnh</span>
                  </div>
                  <div className="h-8 w-full rounded bg-mint-haze" />
                </div>
              </div>
            </div>

            {/* Radius, Shadow & Gradient */}
            <div className="rounded-card border border-deep-navy/10 bg-white p-6 shadow-soft">
              <h3 className="mb-4 font-ui text-sm font-bold text-deep-navy">
                Bo góc, Bóng nhẹ & Gradient Pastel
              </h3>
              <div className="space-y-4">
                <div className="rounded-card border border-deep-navy/10 bg-brand-gradient p-4 text-center shadow-soft">
                  <p className="font-ui text-xs font-semibold text-deep-navy">
                    Nền bg-brand-gradient + Bo góc rounded-card (20px) + shadow-soft
                  </p>
                  <p className="mt-1 font-quote text-xs italic text-deep-navy/70">
                    Gradient pastel tím – hồng – be – trắng, nhẹ nhàng và thanh khiết.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-ui text-deep-navy/70">
                  <span className="rounded bg-warm-ivory px-2 py-1 border border-deep-navy/10">
                    rounded-card: 20px
                  </span>
                  <span className="rounded bg-warm-ivory px-2 py-1 border border-deep-navy/10">
                    shadow-soft: 0 4px 20px -2px rgba(40,10,96,0.06)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Brand SVG Assets */}
        <section aria-labelledby="heading-assets">
          <h2
            id="heading-assets"
            className="mb-6 font-ui text-xs font-bold tracking-widest uppercase text-bright-magenta"
          >
            5. Visual Assets – Bộ SVG nhận diện thương hiệu
          </h2>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {/* HeartLine */}
            <div className="flex flex-col items-center justify-center rounded-card border border-deep-navy/10 bg-white p-6 text-center shadow-soft">
              {/* a11y-contrast-ok: SVG trang trí HeartLine hiển thị mẫu */}
              <HeartLine className="text-accent-pink" width={64} height={24} />
              <span className="mt-3 font-ui text-xs font-semibold text-deep-navy">HeartLine</span>
              <span className="font-ui text-[10px] text-deep-navy/70">Nét trái tim</span>
            </div>

            {/* Valve */}
            <div className="flex flex-col items-center justify-center rounded-card border border-deep-navy/10 bg-white p-6 text-center shadow-soft">
              <Valve className="text-deep-navy" width={32} height={32} />
              <span className="mt-3 font-ui text-xs font-semibold text-deep-navy">Valve</span>
              <span className="font-ui text-[10px] text-deep-navy/70">Van cảm xúc</span>
            </div>

            {/* Butterfly */}
            <div className="flex flex-col items-center justify-center rounded-card border border-deep-navy/10 bg-white p-6 text-center shadow-soft">
              <Butterfly className="text-bright-magenta" width={32} height={32} />
              <span className="mt-3 font-ui text-xs font-semibold text-deep-navy">Butterfly</span>
              <span className="font-ui text-[10px] text-deep-navy/70">Cánh bướm</span>
            </div>

            {/* Leaf */}
            <div className="flex flex-col items-center justify-center rounded-card border border-deep-navy/10 bg-white p-6 text-center shadow-soft">
              {/* a11y-contrast-ok: SVG trang trí Leaf hiển thị mẫu */}
              <Leaf className="text-accent-pink" width={32} height={32} />
              <span className="mt-3 font-ui text-xs font-semibold text-deep-navy">Leaf</span>
              <span className="font-ui text-[10px] text-deep-navy/70">Họa tiết lá</span>
            </div>

            {/* ThinLine */}
            <div className="flex flex-col items-center justify-center rounded-card border border-deep-navy/10 bg-white p-6 text-center shadow-soft">
              <div className="w-full">
                <ThinLine className="text-deep-navy" width="100%" height={8} />
              </div>
              <span className="mt-3 font-ui text-xs font-semibold text-deep-navy">ThinLine</span>
              <span className="font-ui text-[10px] text-deep-navy/70">Đường kẻ mảnh</span>
            </div>

            {/* Logo */}
            <div className="flex flex-col items-center justify-center rounded-card border border-deep-navy/10 bg-white p-6 text-center shadow-soft">
              <Logo width={120} />
              <span className="mt-3 font-ui text-xs font-semibold text-deep-navy">Logo</span>
              <span className="font-ui text-[10px] text-deep-navy/70">Placeholder chuẩn</span>
            </div>
          </div>

          {/* Logo Variants Showcase */}
          <div className="mt-6 rounded-card border border-deep-navy/10 bg-white p-6 shadow-soft">
            <h3 className="mb-4 font-ui text-xs font-bold uppercase tracking-wider text-deep-navy">
              Các biến thể Logo trên các nền khác nhau (Tối thiểu 120px)
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="flex flex-col items-center justify-center rounded-lg bg-warm-ivory p-4 border border-deep-navy/10">
                <Logo variant="default" width={130} />
                <span className="mt-2 font-ui text-[11px] text-deep-navy/60">
                  Nền Warm Ivory (Mặc định)
                </span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg bg-white p-4 border border-deep-navy/10">
                <Logo variant="light" width={130} />
                <span className="mt-2 font-ui text-[11px] text-deep-navy/60">Nền White</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg bg-deep-navy p-4">
                <Logo variant="dark" width={130} />
                <span className="mt-2 font-ui text-[11px] text-warm-ivory/70">Nền Deep Navy</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg bg-lavender-mist p-4 border border-deep-navy/10">
                <Logo variant="monochrome" width={130} />
                <span className="mt-2 font-ui text-[11px] text-deep-navy/60">Monochrome</span>
              </div>
            </div>
          </div>

          {/* Brand Icons 16 keys showcase */}
          <div className="mt-6 rounded-card border border-deep-navy/10 bg-white p-6 shadow-soft">
            <h3 className="mb-4 font-ui text-xs font-bold uppercase tracking-wider text-deep-navy">
              16 Biểu tượng thương hiệu (Brand Icons – Brand Book 2026)
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
              {BRAND_ICONS.map(({ value, label }) => (
                <div
                  key={value}
                  className="flex flex-col items-center justify-center rounded-lg border border-deep-navy/10 bg-warm-ivory/50 p-4 text-center hover:bg-soft-pink/30 transition-colors"
                >
                  <BrandIcon name={value} className="text-deep-navy" size={28} />
                  <span className="mt-2 font-ui text-xs font-semibold text-deep-navy">{label}</span>
                  <span className="font-ui text-[10px] text-deep-navy/60">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 6: UI Primitives (T0-04) */}
        <section aria-labelledby="heading-primitives">
          <h2
            id="heading-primitives"
            className="mb-6 font-ui text-xs font-bold tracking-widest uppercase text-bright-magenta"
          >
            6. Bộ UI Primitives nền tảng (8 Components theo Brand Book 2026 &amp; WCAG AA)
          </h2>

          <InteractivePrimitivesDemo />
        </section>

        {/* Section 7: UI Composites (T0-05) */}
        <section aria-labelledby="heading-composites">
          <h2
            id="heading-composites"
            className="mb-6 font-ui text-xs font-bold tracking-widest uppercase text-bright-magenta"
          >
            7. Bộ UI Composites (T0-05 – Ghép từ Primitives theo Brand Book 2026)
          </h2>

          <InteractiveCompositesDemo />
        </section>

        {/* Section 8: EQ Buddy Sharing & Offers (T3-05) */}
        <section aria-labelledby="heading-eq-share">
          <h2
            id="heading-eq-share"
            className="mb-6 font-ui text-xs font-bold tracking-widest uppercase text-bright-magenta"
          >
            8. Bộ EQ Buddy Sharing &amp; Offers (T3-05 [MẪU])
          </h2>

          <EqShareDemo />
        </section>

        {/* Section 9: SM-03 Blocks & Variants (Sitemap v2) */}
        <section aria-labelledby="heading-sm03-blocks">
          <h2
            id="heading-sm03-blocks"
            className="mb-6 font-ui text-xs font-bold tracking-widest uppercase text-bright-magenta"
          >
            9. Khối Puck mới &amp; Nâng cấp (Sitemap v2 – SM-03 [MẪU])
          </h2>

          <Sm03BlocksDemo />
        </section>

        {/* Section 10: SM-04 Blocks & Variants (Sitemap v2) */}
        <section aria-labelledby="heading-sm04-blocks">
          <h2
            id="heading-sm04-blocks"
            className="mb-6 font-ui text-xs font-bold tracking-widest uppercase text-bright-magenta"
          >
            10. Khối Puck mới &amp; Nâng cấp (Sitemap v2 – SM-04 [MẪU])
          </h2>

          <Sm04BlocksDemo />
        </section>

        {/* Section 11: SM-05 Blocks & Features (Sitemap v2 – SM-05 [MẪU]) */}
        <section aria-labelledby="heading-sm05-blocks">
          <h2
            id="heading-sm05-blocks"
            className="mb-6 font-ui text-xs font-bold tracking-widest uppercase text-bright-magenta"
          >
            11. Khối Puck mới &amp; Tính năng (Sitemap v2 – SM-05 [MẪU])
          </h2>

          <Sm05BlocksDemo />
        </section>
      </main>

      <footer className="border-t border-deep-navy/10 bg-warm-ivory py-8 text-center">
        <p className="font-ui text-xs text-deep-navy/60">
          Trạm Dừng Cảm Xúc · Thiết kế hệ thống theo Brand Book 2026 · Strictly enforces tdcx-brand
        </p>
      </footer>
    </div>
  )
}
