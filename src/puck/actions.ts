'use server'

import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Data } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'

export type SaveActionResult = {
  success: boolean
  code?: 'UNAUTHORIZED' | 'SAVE_FAILED'
  message?: string
  status?: string
}

// REVIEW-REQUIRED: Server action for saving visual builder drafts with strict user authentication
export async function saveDraftAction(
  pageId: string,
  puckData: Data
): Promise<SaveActionResult> {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Always re-authenticate user on server
    const { user } = await payload.auth({ headers })
    if (!user) {
      return {
        success: false,
        code: 'UNAUTHORIZED',
        message: vi.builder.unauthorized,
      }
    }

    const updatedDoc = await payload.update({
      collection: 'pages',
      id: pageId,
      data: {
        puckData,
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
export async function publishPageAction(
  pageId: string,
  puckData: Data
): Promise<SaveActionResult> {
  try {
    const headers = await getHeaders()
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Always re-authenticate user on server
    const { user } = await payload.auth({ headers })
    if (!user) {
      return {
        success: false,
        code: 'UNAUTHORIZED',
        message: vi.builder.unauthorized,
      }
    }

    const updatedDoc = await payload.update({
      collection: 'pages',
      id: pageId,
      data: {
        puckData,
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
