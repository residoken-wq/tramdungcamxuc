'use server'

import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Data } from '@puckeditor/core'

export type SaveActionResult = {
  success: boolean
  message?: string
  status?: string
}

// REVIEW-REQUIRED: Server action for saving visual builder drafts with strict user authentication
export async function saveDraftAction(
  pageId: string,
  puckData: Data
): Promise<SaveActionResult> {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Always re-authenticate user on server
  const { user } = await payload.auth({ headers })
  if (!user) {
    throw new Error('UNAUTHORIZED')
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
    message: 'Đã lưu bản nháp thành công',
    status: updatedDoc._status || 'draft',
  }
}

// REVIEW-REQUIRED: Server action for publishing visual builder page with strict user authentication
export async function publishPageAction(
  pageId: string,
  puckData: Data
): Promise<SaveActionResult> {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Always re-authenticate user on server
  const { user } = await payload.auth({ headers })
  if (!user) {
    throw new Error('UNAUTHORIZED')
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
    message: 'Đã xuất bản trang thành công',
    status: updatedDoc._status || 'published',
  }
}
