import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { vi } from '@/lib/i18n/vi'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { getCertificateByCode } from '@/lib/habit/certificate.server'
import { CertificatePublicToggle } from '@/components/habit/CertificatePublicToggle'
import { CertificateShareButtons } from '@/components/habit/CertificateShareButtons'

export interface CertificatePageProps {
  params: Promise<{ code: string }>
}

function formatDateVN(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d)
  } catch {
    return dateStr
  }
}

export async function generateMetadata({ params }: CertificatePageProps): Promise<Metadata> {
  const { code } = await params
  const customer = await getCurrentCustomer()
  const cert = await getCertificateByCode(code, {
    currentCustomerId: customer?.id ?? null,
  })

  if (!cert) {
    return {
      title: `${vi.certificate.notFound.title} | ${vi.certificate.og.brand}`,
      robots: { index: false, follow: false },
    }
  }

  const title = vi.certificate.metaTitle(cert.customerName)
  const description = vi.certificate.metaDescription

  const metadata: Metadata = {
    title,
    description,
    robots: {
      index: false,
      follow: false,
    },
  }

  // Open Graph chỉ trỏ ảnh 4:5 khi chứng nhận đang ở chế độ công khai
  if (cert.isPublic) {
    metadata.openGraph = {
      title,
      description,
      images: [
        {
          url: `/chung-nhan/${cert.code}/anh/4x5`,
          width: 1080,
          height: 1350,
          alt: vi.certificate.imageAlt(cert.customerName),
        },
      ],
    }
  }

  return metadata
}

export default async function CertificatePage({ params }: CertificatePageProps) {
  const { code } = await params
  const customer = await getCurrentCustomer()
  const cert = await getCertificateByCode(code, {
    currentCustomerId: customer?.id ?? null,
  })

  // Nếu không tìm thấy hoặc người xem không phải chủ sở hữu khi isPublic = false -> 404
  if (!cert) {
    notFound()
  }

  const formattedDate = formatDateVN(cert.issuedAt)

  return (
    <div className="w-full min-h-[calc(100vh-160px)] py-10 sm:py-16 px-4 bg-linear-to-b from-warm-ivory via-warm-ivory/80 to-lavender-mist/20">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Banner dành riêng cho chủ sở hữu nếu chứng nhận đang tắt chia sẻ */}
        {cert.isOwner && (
          <div className="w-full">
            <CertificatePublicToggle code={cert.code} initialIsPublic={cert.isPublic} />
          </div>
        )}

        {/* Khung chứng nhận hiển thị */}
        <div className="bg-warm-ivory rounded-card border-2 border-bright-magenta/20 p-6 sm:p-10 shadow-md text-center space-y-6">
          <div className="space-y-2">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-ui font-bold bg-mint-haze text-deep-navy shadow-xs">
              {vi.certificate.badge}
            </span>

            <h1 className="font-display text-3xl sm:text-5xl text-deep-navy tracking-wide">
              {vi.certificate.titleLine1}
              <span className="block text-bright-magenta text-xl sm:text-3xl mt-1">
                {vi.certificate.titleLine2}
              </span>
            </h1>

            <p className="font-sans text-xs sm:text-sm text-deep-navy/70 pt-2">
              {vi.certificate.subtitle}
            </p>
            <p className="font-ui font-bold text-xl sm:text-2xl text-deep-navy uppercase tracking-wider">
              {cert.customerName}
            </p>
          </div>

          {/* Câu định danh */}
          {cert.identityStatement && (
            <div className="max-w-xl mx-auto p-4 sm:p-6 rounded-2xl bg-warm-ivory/80 border border-deep-navy/10 shadow-xs">
              <p className="text-xs font-ui uppercase font-semibold text-bright-magenta mb-2">
                {vi.certificate.identityCommitmentTitle}
              </p>
              <p className="font-quote italic text-base sm:text-lg text-deep-navy leading-relaxed">
                &ldquo;{cert.identityStatement}&rdquo;
              </p>
            </div>
          )}

          {/* Thống kê hoàn thành & Ngày cấp */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm font-sans text-deep-navy/80">
            <span className="px-3 py-1 rounded-full bg-mint-haze/80 font-ui font-semibold text-deep-navy">
              {vi.certificate.completedStats(cert.daysCompleted)}
            </span>
            <span>
              {vi.certificate.issuedDateLabel} <strong>{formattedDate}</strong>
            </span>
            <span>
              {vi.certificate.verificationCodeLabel}{' '}
              <strong className="font-ui tracking-wider text-deep-navy">{cert.code}</strong>
            </span>
          </div>

          {/* Ảnh xem trước 4:5 */}
          <div className="max-w-md mx-auto rounded-2xl overflow-hidden shadow-lg border border-deep-navy/15 aspect-4/5 bg-soft-pink/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/chung-nhan/${cert.code}/anh/4x5`}
              alt={vi.certificate.imageAlt(cert.customerName)}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Các nút tải & chia sẻ */}
          <div className="pt-2">
            <CertificateShareButtons
              code={cert.code}
              customerName={cert.customerName}
              isPublic={cert.isPublic}
            />
          </div>

          {/* Điều hướng về tracker nếu là chủ sở hữu */}
          {cert.isOwner && (
            <div className="pt-4 border-t border-deep-navy/10">
              <Link
                href="/habit/tracker"
                className="text-xs font-ui font-semibold text-deep-navy/70 hover:text-bright-magenta underline transition-colors motion-reduce:transition-none"
              >
                {vi.certificate.backToTracker}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
