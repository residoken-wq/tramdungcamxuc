'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { vi } from '@/lib/i18n/vi'
import { buildEqIntroView, type EqIntroView } from '@/lib/eq/intro-view'
import { useEqContent } from '@/puck/use-eq-content'
import type { EqPageResolved } from '@/puck/eq-page-types'
import { GuideModal } from '@/components/eq/zip/GuideModal'
import {
  EQ_DRAW_HREF,
  EqDrawActions,
  EqFrame,
  EqGuideInline,
  EqIntroHeader,
  EqSeriesBar,
  EqShopeeLink,
  EqWhatIsContent,
  type EqAlign,
  type EqFrameBg,
} from './EqIntroSections'

export interface EqFrameOptions {
  showSeriesBar?: boolean
  showGuideButton?: boolean
  showHeader?: boolean
  align?: EqAlign
  bg?: EqFrameBg
}

export interface EqStandaloneOption {
  /** Wrap the block in its own card (when it is not dropped inside "Khung EQ Buddy"). */
  inCard?: boolean
}

export type EqPageSectionProps =
  | ({ section: 'frame' } & EqFrameOptions)
  | ({ section: 'whatIs'; columns?: 1 | 2 | 4; showIcons?: boolean } & EqStandaloneOption)
  | ({
      section: 'draw'
      size?: 'auto' | 'large' | 'compact'
      showGuideButton?: boolean
    } & EqStandaloneOption)
  | ({ section: 'guide'; mode?: 'inline' | 'button' } & EqStandaloneOption)
  | { section: 'shopee' }

const SECTION_LABEL: Record<EqPageSectionProps['section'], string> = vi.bx08.eq.sections

function EditorNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto my-4 max-w-3xl rounded-card border border-dashed border-bright-magenta/40 bg-soft-pink/40 p-4 text-center font-ui text-sm text-deep-navy">
      {children}
    </div>
  )
}

/** Outer spacing of a top-level EQ block (the coded page uses py-6 sm:py-10 px-4 sm:px-6). */
function Standalone({ inCard, children }: { inCard?: boolean; children: React.ReactNode }) {
  if (!inCard) return <div className="mx-auto w-full max-w-3xl">{children}</div>
  return (
    <div className="w-full px-4 py-6 sm:px-6 sm:py-10">
      <EqFrame>{children}</EqFrame>
    </div>
  )
}

function useGuideModal(view: EqIntroView) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const modal = (
    <GuideModal
      isOpen={open}
      onClose={() => setOpen(false)}
      {...view.guide}
      onConfirm={() => router.push(EQ_DRAW_HREF)}
    />
  )
  return { openGuide: () => setOpen(true), modal }
}

/**
 * BX-08b: one part of the /eq-buddy intro as a builder block. Texts come from the
 * "Nội dung EQ Buddy" global (server-resolved on public pages, fetched in the builder).
 */
export function EqPageSection(
  props: EqPageSectionProps & {
    _resolved?: EqPageResolved | null
    isEditing?: boolean
    children?: React.ReactNode
  },
) {
  const { _resolved, isEditing = false } = props
  const { data, loading } = useEqContent(_resolved)

  if (loading) return isEditing ? <EditorNote>{vi.bx08.loading}</EditorNote> : null
  if (!data) return isEditing ? <EditorNote>{vi.bx08.eq.contentUnavailable}</EditorNote> : null

  return <EqSectionBody {...props} view={buildEqIntroView(data.eqContent)} isEditing={isEditing} />
}

function EqSectionBody(
  props: EqPageSectionProps & {
    view: EqIntroView
    isEditing: boolean
    children?: React.ReactNode
  },
) {
  const { view, isEditing } = props
  const { openGuide, modal } = useGuideModal(view)
  const empty = <EditorNote>{vi.bx08.eq.sectionEmpty(SECTION_LABEL[props.section])}</EditorNote>

  switch (props.section) {
    case 'frame': {
      const {
        showSeriesBar = true,
        showGuideButton = true,
        showHeader = true,
        align = 'auto',
        bg = 'warm-ivory',
        children,
      } = props
      return (
        <div className="w-full px-4 py-6 sm:px-6 sm:py-10">
          <EqFrame bg={bg}>
            {showSeriesBar && (
              <EqSeriesBar view={view} showGuideButton={showGuideButton} onGuide={openGuide} />
            )}
            {showHeader && <EqIntroHeader view={view} align={align} />}
            {children}
          </EqFrame>
          {modal}
        </div>
      )
    }
    case 'whatIs': {
      if (!view.hasIntro1) return isEditing ? empty : null
      const { columns = 2, showIcons = true, inCard } = props
      return (
        <Standalone inCard={inCard}>
          <div className="space-y-6 animate-fadeIn font-ui">
            <EqWhatIsContent view={view} columns={columns} showIcons={showIcons} />
          </div>
        </Standalone>
      )
    }
    case 'draw': {
      const { size = 'auto', showGuideButton = true, inCard } = props
      const variant = size === 'auto' ? (view.hasIntro1 ? 'compact' : 'large') : size
      return (
        <Standalone inCard={inCard}>
          <div className={variant === 'compact' ? 'mt-6 font-ui' : undefined}>
            <EqDrawActions
              variant={variant}
              showGuideButton={showGuideButton}
              onGuide={openGuide}
            />
          </div>
          {modal}
        </Standalone>
      )
    }
    case 'guide': {
      const { mode = 'inline', inCard } = props
      if (mode === 'button') {
        return (
          <Standalone inCard={inCard}>
            <div className="flex justify-center py-4 font-ui">
              <button
                type="button"
                onClick={openGuide}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white hover:bg-soft-pink/40 border border-lavender-mist hover:border-bright-magenta text-deep-navy text-xs sm:text-sm font-semibold transition-all shadow-soft-md cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-bright-magenta" />
                <span className="whitespace-nowrap">{vi.dp01eq.guide}</span>
              </button>
            </div>
            {modal}
          </Standalone>
        )
      }
      if (!hasGuideContent(view)) return isEditing ? empty : null
      return (
        <Standalone inCard={inCard}>
          <div className="py-4">
            <EqGuideInline view={view} />
          </div>
        </Standalone>
      )
    }
    case 'shopee': {
      if (!view.shopeeUrl) {
        return isEditing ? <EditorNote>{vi.bx08.eq.noShopeeUrl}</EditorNote> : null
      }
      return (
        <div className="w-full px-4 pb-6 sm:px-6 sm:pb-10">
          <EqShopeeLink view={view} />
        </div>
      )
    }
  }
}

function hasGuideContent(view: EqIntroView): boolean {
  const g = view.guide
  if (g.useDefaultCopy) return true
  return [
    g.title,
    g.quote,
    g.step1Title,
    g.step1Desc,
    g.step2Title,
    g.step2Desc,
    g.step3Title,
    g.step3Desc,
  ].some((v) => typeof v === 'string' && v.trim().length > 0)
}
