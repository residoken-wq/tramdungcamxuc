'use server'

import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { isAdminUser } from '@/lib/auth/access'
import { vi } from '@/lib/i18n/vi'
import {
  validateLessonWizardData,
  type LessonWizardInput,
} from './lesson-wizard-schema'

export interface CourseModuleOption {
  id: number | string
  title: string
  group?: string
  order?: number
}

export interface LessonWizardActionResult {
  success: boolean
  docId?: number | string
  error?: string
  errors?: Record<string, string>
}

export interface CreateModuleActionResult {
  success: boolean
  docId?: number | string
  title?: string
  error?: string
}

/**
 * Lấy danh sách nhóm bài học (CourseModules) sẵn có để hiển thị trong wizard.
 */
export async function getCourseModulesForWizard(): Promise<CourseModuleOption[]> {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    const headers = await getHeaders()
    const { user } = await payload.auth({ headers })

    if (!user || !isAdminUser(user)) {
      return []
    }

    const docs = await payload.find({
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

    return docs.docs.map((doc) => ({
      id: doc.id,
      title: String(doc.title || ''),
      group: doc.group ? String(doc.group) : undefined,
      order: typeof doc.order === 'number' ? doc.order : 0,
    }))
  } catch {
    return []
  }
}

/**
 * Lấy thứ tự bài học tiếp theo (gợi ý) trong một nhóm bài học cụ thể.
 */
export async function getNextLessonOrderByModule(
  moduleId: number | string,
): Promise<number> {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    const headers = await getHeaders()
    const { user } = await payload.auth({ headers })

    if (!user || !isAdminUser(user)) {
      return 1
    }

    const lessons = await payload.find({
      collection: 'lessons',
      where: {
        module: { equals: moduleId },
      },
      limit: 100,
      sort: '-order',
      draft: true,
      user,
      overrideAccess: false,
      select: {
        order: true,
      },
    })

    if (lessons.docs.length === 0) {
      return 1
    }

    const highest = lessons.docs[0]?.order
    return typeof highest === 'number' ? highest + 1 : lessons.docs.length + 1
  } catch {
    return 1
  }
}

/**
 * Tạo nhanh một nhóm bài học mới ngay tại Bước 1 của wizard.
 */
export async function createCourseModuleQuickAction(data: {
  title: string
  group?: 'insight' | 'principle' | 'technique'
  order?: number
}): Promise<CreateModuleActionResult> {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    const headers = await getHeaders()
    const { user } = await payload.auth({ headers })

    if (!user || !isAdminUser(user)) {
      return {
        success: false,
        error: vi.cms.lessonWizard.errors.unauthorized,
      }
    }

    const title = data.title?.trim()
    if (!title) {
      return {
        success: false,
        error: vi.cms.lessonWizard.errors.createModuleFailed,
      }
    }

    const created = await payload.create({
      collection: 'courseModules',
      data: {
        title,
        group: data.group || 'insight',
        order: typeof data.order === 'number' ? data.order : 0,
        isSample: false,
      },
      user,
      overrideAccess: false,
    })

    return {
      success: true,
      docId: created.id,
      title: created.title,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : vi.cms.lessonWizard.errors.createModuleFailed
    return {
      success: false,
      error: message,
    }
  }
}

// REVIEW-REQUIRED: Server action tạo hoặc xuất bản bài học từ wizard.
// Kiểm tra nghiêm ngặt phiên admin (chỉ editor hoặc owner mới được phép tạo bài học).
// Xác thực schema Zod (kiểm tra GUID video Bunny chuẩn BUNNY_VIDEO_ID_REGEX, thời lượng, tiêu đề).
// Gọi payload.create / payload.update với user và KHÔNG dùng overrideAccess để tôn trọng phân quyền.
// Luôn ép isSample: false trên server, không nhận cờ hệ thống từ client.
export async function createLessonFromWizard(
  data: LessonWizardInput,
  options: { publish?: boolean; docId?: number | string } = {},
): Promise<LessonWizardActionResult> {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    const headers = await getHeaders()
    const { user } = await payload.auth({ headers })

    if (!user || !isAdminUser(user)) {
      return {
        success: false,
        error: vi.cms.lessonWizard.errors.unauthorized,
      }
    }

    const validation = validateLessonWizardData(data, { publish: options.publish })
    if (!validation.success || !validation.data) {
      return {
        success: false,
        error: validation.message || vi.cms.lessonWizard.errors.createFailed,
        errors: validation.errors,
      }
    }

    const clean = validation.data
    const isDraft = !options.publish

    const payloadData: Record<string, unknown> = {
      module: clean.moduleId,
      title: clean.title,
      summary: clean.summary,
      stage: clean.stage,
      order: clean.order,
      videoId: clean.videoId || undefined,
      durationSec: clean.durationSec || undefined,
      isFreePreview: clean.isFreePreview,
      isSample: false,
    }

    if (options.docId) {
      const updatedDoc = isDraft
        ? await payload.update({
            collection: 'lessons',
            id: options.docId,
            data: payloadData as never,
            draft: true,
            user,
            overrideAccess: false,
          })
        : await payload.update({
            collection: 'lessons',
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
            collection: 'lessons',
            data: payloadData as never,
            draft: true,
            user,
            overrideAccess: false,
          })
        : await payload.create({
            collection: 'lessons',
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
    const message = error instanceof Error ? error.message : vi.cms.lessonWizard.errors.createFailed
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Lưu nháp tự động trước khi chuyển sang bước xem trước để lấy docId tải iframe xem trước.
 */
export async function saveLessonDraftFromWizard(
  data: LessonWizardInput,
  existingDocId?: number | string,
): Promise<LessonWizardActionResult> {
  return createLessonFromWizard(data, { publish: false, docId: existingDocId })
}
