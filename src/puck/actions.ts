'use server'

import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Data } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'
import { validatePageLockedBlocks } from '@/puck/locks'
import { generateDuplicateSlug } from '@/puck/duplicate'
import { normalizePuckData } from '@/puck/migrations'
import { isAdminUser, isOwnerUser } from '@/lib/auth/access'
import { validateTemplatePuckData } from '@/puck/template-validation'
import { puckConfig } from '@/puck/config'

export type SaveActionResult = {
  success: boolean
  code?: 'UNAUTHORIZED' | 'SAVE_FAILED' | 'VALIDATION_FAILED'
  message?: string
  status?: string
}

export type VersionSummary = {
  id: string
  updatedAt: string
  createdAt: string
  status: 'draft' | 'published'
  autosave: boolean
  title?: string
  authorName?: string | null
}

export type GetVersionsActionResult = {
  success: boolean
  code?: 'UNAUTHORIZED' | 'FETCH_FAILED'
  message?: string
  versions?: VersionSummary[]
  hasMore?: boolean
  totalDocs?: number
  page?: number
}

export type TemplateSummary = {
  id: string
  name: string
  kind: 'section' | 'page'
  description?: string | null
  createdAt: string
  updatedAt: string
  createdBy?: {
    id: number | string
    name?: string | null
    email: string
  } | null
  puckData: unknown
}

export type SaveTemplateActionResult = {
  success: boolean
  code?: 'UNAUTHORIZED' | 'VALIDATION_FAILED' | 'SAVE_FAILED'
  message?: string
  template?: TemplateSummary
}

export type ListTemplatesActionResult = {
  success: boolean
  code?: 'UNAUTHORIZED' | 'FETCH_FAILED'
  message?: string
  templates?: TemplateSummary[]
}

export type DeleteTemplateActionResult = {
  success: boolean
  code?: 'UNAUTHORIZED' | 'FORBIDDEN' | 'DELETE_FAILED' | 'NOT_FOUND'
  message?: string
}

export type RestoreVersionActionResult = {
  success: boolean
  code?: 'UNAUTHORIZED' | 'RESTORE_FAILED'
  message?: string
  status?: string
  puckData?: Data
}

export type DuplicatePageActionResult = {
  success: boolean
  code?: 'UNAUTHORIZED' | 'DUPLICATE_FAILED'
  message?: string
  newPageId?: string
  newSlug?: string
}

// REVIEW-REQUIRED: Server action for saving visual builder drafts with strict user authentication
export async function saveDraftAction(pageId: string, puckData: Data): Promise<SaveActionResult> {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Always re-authenticate user on server
    const { user } = await payload.auth({ headers })
    if (!user || !isAdminUser(user)) {
      return {
        success: false,
        code: 'UNAUTHORIZED',
        message: vi.builder.unauthorized,
      }
    }

    const existingPage = await payload.findByID({
      collection: 'pages',
      id: pageId,
      draft: true,
      user,
      overrideAccess: false,
    })

    const migratedData = normalizePuckData(puckData)

    if (existingPage?.slug) {
      const validation = validatePageLockedBlocks(existingPage.slug, migratedData)
      if (!validation.valid) {
        return {
          success: false,
          code: 'VALIDATION_FAILED',
          message: validation.error,
        }
      }
    }

    const updatedDoc = await payload.update({
      collection: 'pages',
      id: pageId,
      data: {
        puckData: migratedData,
      },
      draft: true,
      user,
      overrideAccess: false,
    })

    return {
      success: true,
      message: vi.builder.savedDraft,
      status: updatedDoc._status || 'draft',
    }
  } catch (error) {
    console.error('Error in saveDraftAction:', error)
    return {
      success: false,
      code: 'SAVE_FAILED',
      message: vi.builder.saveFailed,
    }
  }
}

// REVIEW-REQUIRED: Server action for publishing visual builder page with strict user authentication
export async function publishPageAction(pageId: string, puckData: Data): Promise<SaveActionResult> {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Always re-authenticate user on server
    const { user } = await payload.auth({ headers })
    if (!user || !isAdminUser(user)) {
      return {
        success: false,
        code: 'UNAUTHORIZED',
        message: vi.builder.unauthorized,
      }
    }

    const existingPage = await payload.findByID({
      collection: 'pages',
      id: pageId,
      draft: true,
      user,
      overrideAccess: false,
    })

    const migratedData = normalizePuckData(puckData)

    if (existingPage?.slug) {
      const validation = validatePageLockedBlocks(existingPage.slug, migratedData)
      if (!validation.valid) {
        return {
          success: false,
          code: 'VALIDATION_FAILED',
          message: validation.error,
        }
      }
    }

    const updatedDoc = await payload.update({
      collection: 'pages',
      id: pageId,
      data: {
        puckData: migratedData,
        _status: 'published',
      },
      draft: false,
      user,
      overrideAccess: false,
    })

    return {
      success: true,
      message: vi.builder.published,
      status: updatedDoc._status || 'published',
    }
  } catch (error) {
    console.error('Error in publishPageAction:', error)
    return {
      success: false,
      code: 'SAVE_FAILED',
      message: vi.builder.saveFailed,
    }
  }
}

// REVIEW-REQUIRED: Server action for fetching page versions list with strict user authentication
export async function getVersionsAction(
  pageId: string,
  page = 1,
  limit = 25,
): Promise<GetVersionsActionResult> {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const { user } = await payload.auth({ headers })
    if (!user || !isAdminUser(user)) {
      return {
        success: false,
        code: 'UNAUTHORIZED',
        message: vi.builder.unauthorized,
      }
    }

    const versionsRes = await payload.findVersions({
      collection: 'pages',
      where: {
        parent: {
          equals: pageId,
        },
      },
      sort: '-updatedAt',
      page,
      limit,
      user,
      overrideAccess: false,
    })

    const summaries: VersionSummary[] = (versionsRes.docs || []).map((doc) => {
      const versionDoc = doc.version as {
        _status?: 'draft' | 'published'
        title?: string
      }
      return {
        id: String(doc.id),
        updatedAt: doc.updatedAt,
        createdAt: doc.createdAt,
        status: versionDoc?._status === 'published' ? 'published' : 'draft',
        autosave: Boolean((doc as { autosave?: boolean }).autosave),
        title: versionDoc?.title,
        authorName: (user as { name?: string }).name || user.email || null,
      }
    })

    return {
      success: true,
      versions: summaries,
      hasMore: Boolean(versionsRes.hasNextPage),
      totalDocs: versionsRes.totalDocs,
      page,
    }
  } catch (error) {
    console.error('Error in getVersionsAction:', error)
    return {
      success: false,
      code: 'FETCH_FAILED',
      message: vi.builder.error,
    }
  }
}

// REVIEW-REQUIRED: Server action for restoring a specific version with strict user authentication
export async function restoreVersionAction(versionId: string): Promise<RestoreVersionActionResult> {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const { user } = await payload.auth({ headers })
    if (!user || !isAdminUser(user)) {
      return {
        success: false,
        code: 'UNAUTHORIZED',
        message: vi.builder.unauthorized,
      }
    }

    const restoredDoc = await payload.restoreVersion({
      collection: 'pages',
      id: versionId,
      user,
      overrideAccess: false,
    })

    return {
      success: true,
      message: vi.builder.restoredVersion,
      status: restoredDoc._status || 'draft',
      puckData: normalizePuckData(restoredDoc.puckData),
    }
  } catch (error) {
    console.error('Error in restoreVersionAction:', error)
    return {
      success: false,
      code: 'RESTORE_FAILED',
      message: vi.builder.restoreFailed,
    }
  }
}

// REVIEW-REQUIRED: Server action for duplicating a page with strict user authentication
export async function duplicatePageAction(pageId: string): Promise<DuplicatePageActionResult> {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const { user } = await payload.auth({ headers })
    if (!user || !isAdminUser(user)) {
      return {
        success: false,
        code: 'UNAUTHORIZED',
        message: vi.builder.unauthorized,
      }
    }

    const originalDoc = await payload.findByID({
      collection: 'pages',
      id: pageId,
      draft: true,
      user,
      overrideAccess: false,
    })

    if (!originalDoc) {
      return {
        success: false,
        code: 'DUPLICATE_FAILED',
        message: vi.builder.duplicatePageFailed,
      }
    }

    const allPages = await payload.find({
      collection: 'pages',
      pagination: false,
      select: { slug: true },
      user,
      overrideAccess: false,
    })

    const existingSlugs = allPages.docs.map((d) => d.slug).filter(Boolean) as string[]
    const newSlug = generateDuplicateSlug(originalDoc.slug || '', existingSlugs)

    const newDoc = await payload.create({
      collection: 'pages',
      data: {
        title: `${originalDoc.title || 'Trang'} (Bản sao)`,
        slug: newSlug,
        puckData: normalizePuckData(originalDoc.puckData),
        template: originalDoc.template,
        isSample: (originalDoc as { isSample?: boolean }).isSample ?? false,
        _status: 'draft',
      },
      draft: true,
      user,
      overrideAccess: false,
    })

    return {
      success: true,
      newPageId: String(newDoc.id),
      newSlug,
    }
  } catch (error) {
    console.error('Error in duplicatePageAction:', error)
    return {
      success: false,
      code: 'DUPLICATE_FAILED',
      message: vi.builder.duplicatePageFailed,
    }
  }
}

// REVIEW-REQUIRED: Server action for loading version snapshot without restoring/mutating DB
export async function getVersionDataAction(versionId: string): Promise<{
  success: boolean
  code?: 'UNAUTHORIZED' | 'FETCH_FAILED'
  message?: string
  puckData?: Data
  status?: string
  updatedAt?: string
}> {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const { user } = await payload.auth({ headers })
    if (!user || !isAdminUser(user)) {
      return {
        success: false,
        code: 'UNAUTHORIZED',
        message: vi.builder.unauthorized,
      }
    }

    const versionDoc = await payload.findVersionByID({
      collection: 'pages',
      id: versionId,
      user,
      overrideAccess: false,
    })

    if (!versionDoc || !versionDoc.version) {
      return {
        success: false,
        code: 'FETCH_FAILED',
        message: vi.builder.error,
      }
    }

    const v = versionDoc.version as { puckData?: Data; _status?: string }
    return {
      success: true,
      puckData: normalizePuckData(v.puckData),
      status: v._status || 'draft',
      updatedAt: versionDoc.updatedAt,
    }
  } catch (error) {
    console.error('Error in getVersionDataAction:', error)
    return {
      success: false,
      code: 'FETCH_FAILED',
      message: vi.builder.error,
    }
  }
}

// REVIEW-REQUIRED: Server action for saving section/page template with strict admin auth and puckData validation
export async function saveTemplateAction(params: {
  name: string
  kind: 'section' | 'page'
  puckData: unknown
  description?: string
}): Promise<SaveTemplateActionResult> {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const { user } = await payload.auth({ headers })
    if (!user || !isAdminUser(user)) {
      return {
        success: false,
        code: 'UNAUTHORIZED',
        message: vi.builder.unauthorized,
      }
    }

    const trimmedName = (params.name || '').trim()
    if (!trimmedName) {
      return {
        success: false,
        code: 'VALIDATION_FAILED',
        message: vi.eb08.templateNameRequired,
      }
    }

    if (trimmedName.length > 80) {
      return {
        success: false,
        code: 'VALIDATION_FAILED',
        message: vi.eb08.templateNameTooLong,
      }
    }

    if (params.kind !== 'section' && params.kind !== 'page') {
      return {
        success: false,
        code: 'VALIDATION_FAILED',
        message: vi.eb08.invalidData,
      }
    }

    const validation = validateTemplatePuckData(params.puckData, params.kind, puckConfig)
    if (!validation.success) {
      return {
        success: false,
        code: 'VALIDATION_FAILED',
        message: validation.message,
      }
    }

    const doc = await payload.create({
      collection: 'blockTemplates',
      data: {
        name: trimmedName,
        kind: params.kind,
        description: params.description?.trim() || null,
        puckData: params.puckData as Record<string, unknown>,
        createdBy: user.id,
      },
      user,
      overrideAccess: false,
    })

    return {
      success: true,
      message: vi.eb08.savedSuccess,
      template: {
        id: String(doc.id),
        name: doc.name,
        kind: doc.kind,
        description: doc.description || null,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        createdBy: {
          id: user.id,
          name: (user as { name?: string }).name || null,
          email: user.email,
        },
        puckData: doc.puckData,
      },
    }
  } catch (error) {
    console.error('Error in saveTemplateAction:', error)
    return {
      success: false,
      code: 'SAVE_FAILED',
      message: vi.eb08.saveFailed,
    }
  }
}

// REVIEW-REQUIRED: Server action for listing templates filtered by kind with strict admin auth
export async function listTemplatesAction(
  kind?: 'section' | 'page',
): Promise<ListTemplatesActionResult> {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const { user } = await payload.auth({ headers })
    if (!user || !isAdminUser(user)) {
      return {
        success: false,
        code: 'UNAUTHORIZED',
        message: vi.builder.unauthorized,
      }
    }

    const res = await payload.find({
      collection: 'blockTemplates',
      where: kind ? { kind: { equals: kind } } : undefined,
      sort: '-createdAt',
      limit: 100,
      depth: 1,
      user,
      overrideAccess: false,
    })

    const templates: TemplateSummary[] = res.docs.map((doc) => {
      const creator = doc.createdBy as { id: number; name?: string; email: string } | undefined
      return {
        id: String(doc.id),
        name: doc.name,
        kind: doc.kind,
        description: doc.description || null,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        createdBy: creator
          ? { id: creator.id, name: creator.name || null, email: creator.email }
          : null,
        puckData: doc.puckData,
      }
    })

    return {
      success: true,
      templates,
    }
  } catch (error) {
    console.error('Error in listTemplatesAction:', error)
    return {
      success: false,
      code: 'FETCH_FAILED',
      message: vi.builder.error,
    }
  }
}

// REVIEW-REQUIRED: Server action for deleting template with strict admin auth and ownership enforcement
export async function deleteTemplateAction(
  templateId: string,
): Promise<DeleteTemplateActionResult> {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const { user } = await payload.auth({ headers })
    if (!user || !isAdminUser(user)) {
      return {
        success: false,
        code: 'UNAUTHORIZED',
        message: vi.builder.unauthorized,
      }
    }

    const existing = await payload.findByID({
      collection: 'blockTemplates',
      id: templateId,
      depth: 0,
      user,
      overrideAccess: false,
    })

    if (!existing) {
      return {
        success: false,
        code: 'NOT_FOUND',
        message: vi.eb08.deleteFailed,
      }
    }

    const isOwner = isOwnerUser(user)
    const creatorId =
      typeof existing.createdBy === 'object' && existing.createdBy
        ? (existing.createdBy as { id: unknown }).id
        : existing.createdBy
    const isCreator = String(creatorId) === String(user.id)

    if (!isOwner && !isCreator) {
      return {
        success: false,
        code: 'FORBIDDEN',
        message: vi.eb08.cannotDeleteNotOwner,
      }
    }

    await payload.delete({
      collection: 'blockTemplates',
      id: templateId,
      user,
      overrideAccess: false,
    })

    return {
      success: true,
      message: vi.eb08.deleteSuccess,
    }
  } catch (error) {
    console.error('Error in deleteTemplateAction:', error)
    return {
      success: false,
      code: 'DELETE_FAILED',
      message: vi.eb08.deleteFailed,
    }
  }
}
