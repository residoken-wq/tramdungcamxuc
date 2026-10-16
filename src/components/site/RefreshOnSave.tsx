'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'

/**
 * Re-renders a server-rendered preview page after Hana saves a draft in the admin.
 * Payload posts a document event to the iframe; we only accept it from this origin.
 * Render only for an authenticated admin preview (see getAdminPreviewUser).
 */
export function RefreshOnSave() {
  const router = useRouter()
  return (
    <RefreshRouteOnSave
      refresh={() => router.refresh()}
      serverURL={typeof window !== 'undefined' ? window.location.origin : ''}
    />
  )
}
