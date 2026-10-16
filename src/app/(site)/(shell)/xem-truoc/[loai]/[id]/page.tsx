import React from 'react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { isAdminUser } from '@/lib/auth/access'
import { PreviewItemLive, type PreviewType } from '@/components/site/PreviewItemLive'

// Yêu cầu bắt buộc: route xem trước luôn render động theo request, không bao giờ cache chung.
export const dynamic = 'force-dynamic'

interface PreviewRouteProps {
  params: Promise<{
    loai: string
    id: string
  }>
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Xem trước | Trạm Dừng Cảm Xúc',
    robots: {
      index: false,
      follow: false,
    },
  }
}

const COLLECTION_MAP: Record<PreviewType, 'products' | 'testimonials' | 'workshops'> = {
  'san-pham': 'products',
  'loi-chia-se': 'testimonials',
  workshop: 'workshops',
}

export default async function PreviewPage({ params }: PreviewRouteProps) {
  const { loai, id } = await params

  if (!(loai in COLLECTION_MAP)) {
    notFound()
  }

  const previewType = loai as PreviewType
  const collection = COLLECTION_MAP[previewType]

  const payload = await getPayload({ config: await config })

  // REVIEW-REQUIRED: Tuyệt đối không cho phép khách truy cập hoặc học viên xem route /xem-truoc/*.
  // Chỉ phiên quản trị viên Payload hợp lệ (users collection) mới được phép xem bản nháp và giao diện preview.
  // Mọi phiên khác đều bị trả về 404 (notFound) ngay lập tức.
  const { user } = await payload.auth({ headers: await headers() })
  if (!isAdminUser(user)) {
    notFound()
  }

  const parsedId = /^\d+$/.test(id) ? parseInt(id, 10) : id

  let doc: unknown = null
  try {
    doc = await payload.findByID({
      collection,
      id: parsedId,
      draft: true,
      overrideAccess: false,
      user,
      depth: 1,
    })
  } catch {
    notFound()
  }

  if (!doc) {
    notFound()
  }

  return (
    <PreviewItemLive type={previewType} initialData={doc as Record<string, unknown>} />
  )
}
