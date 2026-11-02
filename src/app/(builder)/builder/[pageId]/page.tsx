import React from 'react'
import { headers as getHeaders } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Data } from '@puckeditor/core'
import { normalizePuckData } from '@/puck/migrations'
import { getDesignSystem } from '@/lib/design/design-system.server'
import { isOwnerUser } from '@/lib/auth/access'
import { PuckEditorClient } from './PuckEditorClient'

export const dynamic = 'force-dynamic'

type BuilderPageProps = {
  params: Promise<{
    pageId: string
  }>
}

export default async function BuilderPage({ params }: BuilderPageProps) {
  const { pageId } = await params
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // REVIEW-REQUIRED: Server-side authentication guard for visual page builder
  const { user } = await payload.auth({ headers })
  if (!user) {
    redirect(`/admin/login?redirect=${encodeURIComponent(`/builder/${pageId}`)}`)
  }

  // Load page document using Local API with draft: true
  let pageDoc = null
  try {
    pageDoc = await payload.findByID({
      collection: 'pages',
      id: pageId,
      draft: true,
      user,
      overrideAccess: false,
    })
  } catch {
    notFound()
  }

  if (!pageDoc) {
    notFound()
  }

  const initialData: Data = normalizePuckData(pageDoc.puckData)
  if (!initialData.root?.props?.title && pageDoc.title) {
    initialData.root = {
      ...initialData.root,
      props: {
        ...(initialData.root?.props || {}),
        title: pageDoc.title,
      },
    }
  }

  const designSystem = await getDesignSystem(payload)
  const isOwner = isOwnerUser(user)

  return (
    <PuckEditorClient
      designSystem={designSystem}
      isOwner={isOwner}
      initialData={initialData}
      pageId={pageId}
      pageTitle={pageDoc.title || pageId}
      pageSlug={pageDoc.slug || '/'}
      pageKind={pageDoc.kind || 'page'}
      initialStatus={pageDoc._status || 'draft'}
    />
  )
}
