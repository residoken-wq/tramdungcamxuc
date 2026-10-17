import React from 'react'
import { redirect } from 'next/navigation'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { isAdminUser } from '@/lib/auth/access'
import { LessonWizardContainer } from './LessonWizardContainer'
import type { CourseModuleOption } from '@/lib/cms/lesson-wizard.server'
import type { AdminViewServerProps } from 'payload'

// REVIEW-REQUIRED: Custom Admin View cho /admin/them-bai-hoc.
// Kiểm tra nghiêm ngặt phiên admin ở server component.
// Chỉ người dùng có role 'owner' hoặc 'editor' mới được phép xem và tạo bài học.
// Mọi trường hợp chưa đăng nhập hoặc không có quyền đều bị chuyển hướng về /admin/login.
export async function LessonWizardView(props: AdminViewServerProps) {
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

  // Tải danh sách nhóm bài học sẵn có
  let initialModules: CourseModuleOption[] = []
  try {
    const moduleDocs = await payload.find({
      collection: 'courseModules',
      limit: 100,
      sort: 'order',
      user,
      overrideAccess: false,
      select: {
        id: true,
        title: true,
        group: true,
        order: true,
      },
    })
    initialModules = moduleDocs.docs.map((doc) => ({
      id: doc.id,
      title: String(doc.title || ''),
      group: doc.group ? String(doc.group) : undefined,
      order: typeof doc.order === 'number' ? doc.order : 0,
    }))
  } catch {
    initialModules = []
  }

  return (
    <div className="wizard-root min-h-screen bg-warm-ivory/30 pb-16">
      <LessonWizardContainer initialModules={initialModules} />
    </div>
  )
}
