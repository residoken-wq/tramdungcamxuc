'use server'

import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Data } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'
import { validatePageLockedBlocks } from '@/puck/locks'
import { generateDuplicateSlug } from '@/puck/duplicate'
import { applyPuckMigrations, normalizePuckData } from '@/puck/migrations'
import { isAdminUser } from '@/lib/auth/access'

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
}

export type GetVersionsActionResult = {
  success: boolean
  code?: 'UNAUTHORIZED' | 'FETCH_FAILED'
  message?: string
  versions?: VersionSummary[]
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
export async function getVersionsAction(pageId: string): Promise<GetVersionsActionResult> {
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
      limit: 25,
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
      }
    })

    return {
      success: true,
      versions: summaries,
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
