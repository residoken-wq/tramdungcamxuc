import React from 'react'
import { redirect } from 'next/navigation'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { isAdminUser } from '@/lib/auth/access'
import { WorkshopWizardContainer } from './WorkshopWizardContainer'
import type { WorkshopAudienceProductOption } from '@/lib/cms/workshop-wizard.server'
import type { AdminViewServerProps } from 'payload'

// REVIEW-REQUIRED: Custom Admin View cho /admin/len-lich-workshop.
// Kiểm tra nghiêm ngặt phiên admin ở server component.
// Chỉ người dùng có role 'owner' hoặc 'editor' mới được phép xem và lên lịch workshop.
// Mọi trường hợp chưa đăng nhập hoặc không có quyền đều bị chuyển hướng về /admin/login.
export async function WorkshopWizardView(props: AdminViewServerProps) {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  let user = props.initPageResult?.req?.user
  if (!user) {
    const headers = await getHeaders()
    const authResult = await payload.auth({ headers })
    user = authResult.user
  }

  if (!user || !isAdminUser(user)) {
    redirect('/admin/login')
  }

  // Tải danh sách sản phẩm gói và workshop để chọn cấp quyền tham gia
  let availableProducts: WorkshopAudienceProductOption[] = []
  try {
    const productDocs = await payload.find({
      collection: 'products',
      where: {
        type: { in: ['package', 'workshop'] },
      },
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
    <div className="wizard-root min-h-screen bg-warm-ivory/30 pb-16">
      <WorkshopWizardContainer availableProducts={availableProducts} />
    </div>
  )
}
