'use server'

import React from 'react'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { isAdminUser } from '@/lib/auth/access'
import { vi } from '@/lib/i18n/vi'
import {
  validateWorkshopWizardData,
  formatVietnamDateTime,
  type WorkshopWizardInput,
} from './workshop-wizard-schema'
import { WorkshopReminderEmail } from '@/emails/WorkshopReminderEmail'
import { render } from '@react-email/render'

export interface WorkshopAudienceProductOption {
  id: number | string
  name: string
  type: string
  enrolledCount?: number
}

export interface WorkshopWizardActionResult {
  success: boolean
  docId?: number | string
  error?: string
  errors?: Record<string, string>
}

/**
 * Lấy danh sách sản phẩm gói và workshop để chọn làm đối tượng tham gia workshop.
 */
export async function getAudienceProductsForWorkshopWizard(): Promise<
  WorkshopAudienceProductOption[]
> {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    const headers = await getHeaders()
    const { user } = await payload.auth({ headers })

    if (!user || !isAdminUser(user)) {
      return []
    }

    const docs = await payload.find({
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

    return docs.docs.map((doc) => ({
      id: doc.id,
      name: String(doc.name || ''),
      type: String(doc.type || ''),
    }))
  } catch {
    return []
  }
}

/**
 * Render email nhắc 24h bằng template React Email phía server để trả về chuỗi HTML an toàn cho iframe xem trước.
 */
export async function renderWorkshopEmailPreviewAction(data: {
  title: string
  vnDate: string
  vnTime: string
  joinUrl?: string
}): Promise<{ success: boolean; html?: string; error?: string }> {
  try {
    // REVIEW-REQUIRED: server actions are public endpoints – admin session only, like the other actions.
    const payload = await getPayload({ config: await config })
    const { user } = await payload.auth({ headers: await getHeaders() })
    if (!user || !isAdminUser(user)) {
      return { success: false, error: vi.cms.workshopWizard.errors.unauthorized }
    }

    const formattedTime = formatVietnamDateTime(data.vnDate, data.vnTime)
    const emailElement = React.createElement(WorkshopReminderEmail, {
      name: 'Học viên Trạm Dừng',
      workshopTitle: data.title || 'Workshop Tập thương cảm xúc',
      workshopTimeFormatted: formattedTime || '20:00 ngày 25/10/2026 (ICT UTC+7)',
      accountUrl: 'https://tramdungcamxuc.com/tai-khoan',
    })

    const html = await render(emailElement)
    return {
      success: true,
      html,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Không thể render email xem trước'
    return {
      success: false,
      error: message,
    }
  }
}

// REVIEW-REQUIRED: Server action tạo hoặc cập nhật lịch workshop từ wizard.
// Kiểm tra nghiêm ngặt phiên admin (chỉ editor hoặc owner mới được phép lên lịch workshop).
// Xác thực schema Zod (thời gian ICT -> UTC ISO, joinUrl hợp lệ, đối tượng sản phẩm).
// Gọi payload.create / payload.update với user và KHÔNG dùng overrideAccess để tôn trọng phân quyền.
// Luôn ép isSample: false trên server, không nhận cờ hệ thống từ client.
export async function createWorkshopFromWizard(
  data: WorkshopWizardInput,
  options: { publish?: boolean; docId?: number | string } = {},
): Promise<WorkshopWizardActionResult> {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    const headers = await getHeaders()
    const { user } = await payload.auth({ headers })

    if (!user || !isAdminUser(user)) {
      return {
        success: false,
        error: vi.cms.workshopWizard.errors.unauthorized,
      }
    }

    const validation = validateWorkshopWizardData(data)
    if (!validation.success || !validation.data) {
      return {
        success: false,
        error: validation.message || vi.cms.workshopWizard.errors.createFailed,
        errors: validation.errors,
      }
    }

    const clean = validation.data
    const isDraft = !options.publish

    const payloadData: Record<string, unknown> = {
      title: clean.title,
      startsAt: clean.startsAtUtcIso,
      joinUrl: clean.joinUrl,
      audienceProducts: clean.audienceProductIds,
      isSample: false,
    }

    if (clean.audienceProductIds.length > 0) {
      payloadData.product = clean.audienceProductIds[0]
    }

    // Payload keeps `_status` at its 'draft' default unless it is sent: without this line
    // "Xuất bản" saved a draft.
    payloadData._status = isDraft ? 'draft' : 'published'

    if (options.docId) {
      const updatedDoc = isDraft
        ? await payload.update({
            collection: 'workshops',
            id: options.docId,
            data: payloadData as never,
            draft: true,
            user,
            overrideAccess: false,
          })
        : await payload.update({
            collection: 'workshops',
            id: options.docId,
            data: payloadData as never,
            draft: false,
            user,
            overrideAccess: false,
          })

      return {
        success: true,
        docId: updatedDoc.id,
      }
    } else {
      const createdDoc = isDraft
        ? await payload.create({
            collection: 'workshops',
            data: payloadData as never,
            draft: true,
            user,
            overrideAccess: false,
          })
        : await payload.create({
            collection: 'workshops',
            data: payloadData as never,
            draft: false,
            user,
            overrideAccess: false,
          })

      return {
        success: true,
        docId: createdDoc.id,
      }
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : vi.cms.workshopWizard.errors.createFailed
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Lưu nháp tự động trước khi chuyển sang bước xem trước để lấy docId.
 */
export async function saveWorkshopDraftFromWizard(
  data: WorkshopWizardInput,
  existingDocId?: number | string,
): Promise<WorkshopWizardActionResult> {
  return createWorkshopFromWizard(data, { publish: false, docId: existingDocId })
}
