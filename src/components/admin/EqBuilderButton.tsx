'use client'

import React from 'react'
import { vi } from '@/lib/i18n/vi'
import { buildEqPageData, EQ_BUDDY_PAGE_SLUG } from '@/puck/templates/eq-page'
import { BuilderPagePanel } from './BuilderPagePanel'

const t = vi.bx08.eq

/** BX-08b: top of the "Nội dung EQ Buddy" global – create or open the /eq-buddy builder page. */
export const EqBuilderButton: React.FC = () => (
  <BuilderPagePanel
    slug={EQ_BUDDY_PAGE_SLUG}
    title={t.panelTitle}
    hint={t.panelHint}
    ready
    pageTitle={t.pageTitle}
    buildPuckData={buildEqPageData}
    testId="eq-builder-panel"
  />
)
