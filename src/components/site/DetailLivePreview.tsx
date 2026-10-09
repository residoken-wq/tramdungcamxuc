'use client'

import { useSyncExternalStore } from 'react'
import { useLivePreview } from '@payloadcms/live-preview-react'
import { toPublicService, toPublicProgram, toPublicPost } from '@/lib/detail-pages'
import type { PreviewCollection } from '@/lib/live-preview'
import { ServiceDetail } from './ServiceDetail'
import { ProgramDetail } from './ProgramDetail'
import { PostDetail } from './PostDetail'

type Props = { collection: PreviewCollection; initialData: Record<string, unknown> }
const subscribe = () => () => {}
const isIframe = () => window.parent !== window
const serverSnapshot = () => false

function PreviewBody({ collection, initialData: data }: Props) {
  if (collection === 'services') return <ServiceDetail service={toPublicService(data)} />
  if (collection === 'programs') return <ProgramDetail program={toPublicProgram(data)} />
  return <PostDetail post={toPublicPost(data)} />
}

function LiveBody({ collection, initialData }: Props) {
  const { data } = useLivePreview({
    initialData,
    serverURL: window.location.origin,
    depth: 1,
  })
  return <PreviewBody collection={collection} initialData={data} />
}

/** Only mounted by the server after authenticating an admin preview request. */
export function DetailLivePreview(props: Props) {
  const inIframe = useSyncExternalStore(subscribe, isIframe, serverSnapshot)
  return inIframe ? <LiveBody {...props} /> : <PreviewBody {...props} />
}
