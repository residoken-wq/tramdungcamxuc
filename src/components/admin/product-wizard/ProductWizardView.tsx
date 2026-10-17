import React from 'react'
import { redirect } from 'next/navigation'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { isAdminUser } from '@/lib/auth/access'
import { ProductWizardContainer } from './ProductWizardContainer'
import type { MediaOption, ProductOption } from '@/lib/cms/product-wizard.server'
import type { AdminViewServerProps } from 'payload'

// REVIEW-REQUIRED: Custom Admin View cho /admin/tao-san-pham.
// Kiểm tra nghiêm ngặt phiên admin ở server component.
// Chỉ người dùng có role 'owner' hoặc 'editor' mới được phép xem và tạo sản phẩm.
// Mọi trường hợp chưa đăng nhập hoặc không có quyền đều bị chuyển hướng về /admin/login.
export async function ProductWizardView(props: AdminViewServerProps) {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Lấy thông tin user từ initPageResult hoặc auth lại qua headers
  let user = props.initPageResult?.req?.user
  if (!user) {
    const headers = await getHeaders()
    const authResult = await payload.auth({ headers })
    user = authResult.user
  }

  if (!user || !isAdminUser(user)) {
    redirect('/admin/login')
  }

  // Tải danh sách media sẵn có để người dùng chọn ảnh bìa
  let mediaList: MediaOption[] = []
  try {
    const mediaDocs = await payload.find({
      collection: 'media',
      limit: 60,
      sort: '-createdAt',
      user,
      overrideAccess: false,
    })
    mediaList = mediaDocs.docs
      .filter((doc) => doc.url)
      .map((doc) => ({
        id: doc.id,
        url: String(doc.url || ''),
        alt: String(doc.alt || ''),
        filename: doc.filename ? String(doc.filename) : undefined,
      }))
  } catch {
    mediaList = []
  }

  // Tải danh sách sản phẩm để người dùng chọn cấp quyền trong gói đồng hành
  let availableProducts: ProductOption[] = []
  try {
    const productDocs = await payload.find({
      collection: 'products',
      limit: 100,
      sort: 'name',
      draft: true,
      user,
      overrideAccess: false,
      select: {
        id: true,
        name: true,
        type: true,
      },
    })
    availableProducts = productDocs.docs.map((doc) => ({
      id: doc.id,
      name: String(doc.name || ''),
      type: String(doc.type || ''),
    }))
  } catch {
    availableProducts = []
  }

  return (
    <div className="min-h-screen bg-warm-ivory/30 pb-16">
      <ProductWizardContainer
        mediaList={mediaList}
        availableProducts={availableProducts}
      />
    </div>
  )
}
