'use client'

import React, { createContext, useContext, useMemo, useState } from 'react'
import { DEFAULT_DESIGN_SYSTEM, type CleanDesignSystem } from '@/lib/design/design-system'
import type { PanelTab } from '@/puck/style/field-groups'

type StylePanelContextValue = {
  ds: CleanDesignSystem
  tab: PanelTab
  setTab: (tab: PanelTab) => void
  isOwner?: boolean
}

const StylePanelContext = createContext<StylePanelContextValue>({
  ds: DEFAULT_DESIGN_SYSTEM,
  tab: 'content',
  setTab: () => {},
  isOwner: false,
})

/**
 * EB-04b: the design system (brand locks, palette) loaded on the server and the active tab of the
 * right-hand panel. The tab survives selecting another block, like Elementor.
 * EB-09: passes isOwner from the server so custom CSS / HTML controls are only shown to owners.
 */
export function StylePanelProvider({
  ds,
  isOwner = false,
  children,
}: {
  ds: CleanDesignSystem
  isOwner?: boolean
  children: React.ReactNode
}) {
  const [tab, setTab] = useState<PanelTab>('content')
  const value = useMemo(() => ({ ds, tab, setTab, isOwner }), [ds, tab, isOwner])
  return <StylePanelContext.Provider value={value}>{children}</StylePanelContext.Provider>
}

export function useStylePanel(): StylePanelContextValue {
  return useContext(StylePanelContext)
}
