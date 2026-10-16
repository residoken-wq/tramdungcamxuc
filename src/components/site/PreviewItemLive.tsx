'use client'

import React, { useSyncExternalStore } from 'react'
import { useLivePreview } from '@payloadcms/live-preview-react'
import { ProductCard } from '@/components/site/ProductCard'
import { PriceTag } from '@/components/ui/PriceTag'
import { TestimonialCard } from '@/components/site/TestimonialCard'
import { Card } from '@/components/ui/Card'
import { StatusBadge, type SaleStatus } from '@/components/ui/StatusBadge'
import { formatWorkshopTime } from '@/lib/workshops/format'
import { resolveProductCta } from '@/lib/products'
import { vi } from '@/lib/i18n/vi'

export type PreviewType = 'san-pham' | 'loi-chia-se' | 'workshop'

interface PreviewItemLiveProps {
  type: PreviewType
  initialData: Record<string, unknown>
}

const subscribe = () => () => {}
const isIframe = () => typeof window !== 'undefined' && window.parent !== window
const serverSnapshot = () => false

function PreviewBanner() {
  return (
    <div className="mb-6 rounded-xl border border-bright-magenta/20 bg-soft-pink/50 p-4 text-deep-navy shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-bright-magenta text-xs font-bold text-white">
            👁
          </span>
          <span className="font-ui text-sm font-bold text-deep-navy">
            {vi.cms.preview.adminOnlyBanner}
          </span>
        </div>
        <span className="font-ui text-xs font-medium text-bright-magenta">
          {vi.cms.preview.draftNotice}
        </span>
      </div>
    </div>
  )
}

function ProductPreview({ data }: { data: Record<string, unknown> }) {
  const name = String(data.name || 'Tên sản phẩm')
  const shortDescription = data.shortDescription ? String(data.shortDescription) : undefined

  type MediaDoc = { url?: string | null; alt?: string | null }
  const coverImageDoc: MediaDoc | null =
    data.coverImage && typeof data.coverImage === 'object'
      ? (data.coverImage as MediaDoc)
      : data.preview && typeof data.preview === 'object'
        ? (data.preview as MediaDoc)
        : null

  const coverImage = coverImageDoc?.url
    ? { src: coverImageDoc.url, alt: coverImageDoc.alt || name }
    : null

  const price = typeof data.price === 'number' ? data.price : null
  const salePrice = typeof data.salePrice === 'number' ? data.salePrice : null
  const saleStatus = (data.saleStatus as SaleStatus) || 'on_sale'
  const isHidden = saleStatus === 'hidden'
  const trialDays = typeof data.trialDays === 'number' ? data.trialDays : null
  const journeyStep = typeof data.journeyStep === 'string' ? data.journeyStep : undefined

  const ctaInfo = resolveProductCta({
    slug: (data.slug as string) || '',
    saleStatus,
    type: data.type as Parameters<typeof resolveProductCta>[0]['type'],
    trialDays,
    externalUrl: data.externalUrl as string | undefined,
    externalLabel: data.externalButtonLabel as string | undefined,
  })

  return (
    <div className="space-y-6">
      {isHidden && (
        <div className="rounded-xl border border-butter-cream bg-butter-cream/40 p-4 text-xs font-medium text-deep-navy">
          ⚠️ <strong>Trạng thái: Ẩn.</strong> Thẻ sản phẩm này sẽ không xuất hiện trên website công
          khai. Dưới đây là giao diện mẫu khi được mở bán.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Cột 1: Thẻ ProductCard */}
        <div>
          <h2 className="font-ui text-xs font-bold uppercase tracking-wider text-deep-navy/60 mb-3">
            Giao diện thẻ sản phẩm (ProductCard)
          </h2>
          <div className="max-w-sm">
            <ProductCard
              name={name}
              shortDescription={shortDescription}
              coverImage={coverImage}
              price={price}
              salePrice={salePrice}
              saleStatus={isHidden ? 'coming_soon' : saleStatus}
              trialDays={trialDays}
              journeyStep={journeyStep}
              ctaInfo={ctaInfo}
            />
          </div>
        </div>

        {/* Cột 2: Khối giá PriceTag độc lập */}
        <div className="space-y-4">
          <h2 className="font-ui text-xs font-bold uppercase tracking-wider text-deep-navy/60 mb-3">
            Khối hiển thị giá chi tiết (PriceTag)
          </h2>
          <Card variant="white" className="p-6 border border-lavender-mist">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-lavender-mist pb-3">
                <span className="font-ui text-xs uppercase text-deep-navy/60">Trạng thái bán</span>
                <StatusBadge status={saleStatus} />
              </div>
              <div>
                <span className="font-ui text-xs uppercase text-deep-navy/60 block mb-1">
                  Giá hiển thị
                </span>
                <PriceTag originalPrice={price} salePrice={salePrice} size="lg" />
              </div>
              {trialDays && trialDays > 0 ? (
                <div className="rounded-lg bg-soft-pink/50 p-3 text-xs text-bright-magenta font-ui font-semibold">
                  🎁 Dùng thử miễn phí {trialDays} ngày trước khi thanh toán
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function TestimonialPreview({ data }: { data: Record<string, unknown> }) {
  const name = String(data.name || 'Tên người chia sẻ')
  const role = data.role ? String(data.role) : undefined
  const quote = String(data.quote || 'Lời chia sẻ của học viên sẽ hiển thị tại đây...')
  const consent = Boolean(data.consent)

  type MediaDoc = { url?: string | null; alt?: string | null }
  const photoDoc: MediaDoc | null =
    data.photo && typeof data.photo === 'object' ? (data.photo as MediaDoc) : null

  const photo = photoDoc?.url ? { src: photoDoc.url, alt: photoDoc.alt || name } : undefined

  return (
    <div className="space-y-6">
      {consent ? (
        <div className="rounded-xl border border-mint-haze bg-mint-haze/50 p-4 text-xs font-medium text-deep-navy">
          ✅ <strong>Đã đồng ý cho phép hiển thị.</strong> Lời chia sẻ này sẵn sàng xuất hiện công
          khai trên website khi xuất bản.
        </div>
      ) : (
        <div className="rounded-xl border border-butter-cream bg-butter-cream/50 p-4 text-xs font-medium text-deep-navy">
          ⚠️ <strong>Chưa đồng ý cho phép hiển thị (consent = false).</strong> Lời chia sẻ này đang
          ẩn trên website công khai để tuân thủ quy định bảo vệ dữ liệu.
        </div>
      )}

      <div className="max-w-xl">
        <h2 className="font-ui text-xs font-bold uppercase tracking-wider text-deep-navy/60 mb-3">
          Giao diện thẻ lời chia sẻ (TestimonialCard)
        </h2>
        {/* Luôn truyền consent={true} vào component để quản trị viên xem trước được định dạng */}
        <TestimonialCard
          name={name}
          role={role}
          quote={quote}
          photo={photo}
          consent={true}
          className="shadow-sm"
        />
      </div>
    </div>
  )
}

function WorkshopPreview({ data }: { data: Record<string, unknown> }) {
  const title = String(data.title || 'Tên workshop')
  const startsAt = data.startsAt ? String(data.startsAt) : null
  const endsAt = data.endsAt ? String(data.endsAt) : null
  const formattedTime = formatWorkshopTime(startsAt, endsAt)
  const joinUrl = data.joinUrl ? String(data.joinUrl) : null

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <h2 className="font-ui text-xs font-bold uppercase tracking-wider text-deep-navy/60 mb-3">
          Giao diện lịch workshop như khách thấy
        </h2>

        <div className="bg-white/95 rounded-2xl p-6 border border-lavender-mist shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-deep-navy/10 pb-3">
            <h3 className="font-ui text-base font-bold text-deep-navy">{vi.workshop.heading}</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-mint-haze text-deep-navy">
              Xem trước
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-warm-ivory/40 border border-lavender-mist/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-ui font-bold text-sm sm:text-base text-deep-navy break-words">
                  {title}
                </h4>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-lavender-mist/60 text-deep-navy/80">
                  {vi.workshop.upcomingBadge}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-deep-navy/70">
                <svg
                  className="w-4 h-4 text-bright-magenta shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>{formattedTime || 'Chưa thiết lập thời gian bắt đầu'}</span>
              </div>
            </div>

            <div className="shrink-0 w-full sm:w-auto">
              <div className="text-xs text-deep-navy/60 italic bg-white/70 px-3 py-2 rounded-lg border border-lavender-mist/50 text-center sm:text-right">
                {joinUrl
                  ? 'Liên kết phòng họp đã được thiết lập (chỉ hiển thị cho học viên trước 60 phút).'
                  : vi.workshop.linkOpeningNotice}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PreviewItemBody({ type, data }: { type: PreviewType; data: Record<string, unknown> }) {
  return (
    <div className="min-h-screen bg-warm-ivory py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <PreviewBanner />
        {type === 'san-pham' && <ProductPreview data={data} />}
        {type === 'loi-chia-se' && <TestimonialPreview data={data} />}
        {type === 'workshop' && <WorkshopPreview data={data} />}
      </div>
    </div>
  )
}

function LiveBody({ type, initialData }: PreviewItemLiveProps) {
  const { data } = useLivePreview({
    initialData,
    serverURL: typeof window !== 'undefined' ? window.location.origin : '',
    depth: 1,
  })
  return <PreviewItemBody type={type} data={data} />
}

/** Component xem trước trực tiếp: mount hook lắng nghe khi nằm trong iframe của admin. */
export function PreviewItemLive(props: PreviewItemLiveProps) {
  const inIframe = useSyncExternalStore(subscribe, isIframe, serverSnapshot)
  return inIframe ? (
    <LiveBody {...props} />
  ) : (
    <PreviewItemBody {...props} data={props.initialData} />
  )
}
