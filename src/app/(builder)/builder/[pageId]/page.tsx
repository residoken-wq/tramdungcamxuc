import React from 'react'
import { headers as getHeaders } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Data } from '@puckeditor/core'
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

  const initialData: Data = (pageDoc.puckData as Data) || {
    content: [],
    root: { props: { title: pageDoc.title || '' } },
  }

  return (
    <PuckEditorClient
      initialData={initialData}
      pageId={pageId}
      pageTitle={pageDoc.title || pageId}
      pageSlug={pageDoc.slug || '/'}
      initialStatus={pageDoc._status || 'draft'}
    />
  )
}
