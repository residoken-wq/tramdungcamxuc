'use client'

import React, { useSyncExternalStore } from 'react'
import { useLivePreview } from '@payloadcms/live-preview-react'
import type { PublicEqCard } from '@/lib/eq/cards.server'
import { EqCardFace } from './EqCardFace'

interface EqCardLivePreviewProps {
  initialCard: PublicEqCard
  children?: React.ReactNode
}

const subscribe = () => () => {}
const isIframe = () => typeof window !== 'undefined' && window.parent !== window
const serverSnapshot = () => false

function LiveBody({ initialCard, children }: EqCardLivePreviewProps) {
  const { data } = useLivePreview({
    initialData: initialCard as unknown as Record<string, unknown>,
    serverURL: typeof window !== 'undefined' ? window.location.origin : '',
    depth: 1,
  })

  return (
    <EqCardFace card={data as unknown as PublicEqCard} face="both">
      {children}
    </EqCardFace>
  )
}

/** Mounts live preview listener when rendered inside the CMS admin iframe */
export function EqCardLivePreview(props: EqCardLivePreviewProps) {
  const inIframe = useSyncExternalStore(subscribe, isIframe, serverSnapshot)
  return inIframe ? (
    <LiveBody {...props} />
  ) : (
    <EqCardFace card={props.initialCard} face="both">
      {props.children}
    </EqCardFace>
  )
}
