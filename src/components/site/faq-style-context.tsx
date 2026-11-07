'use client'

import React, { createContext, useContext } from 'react'

export type FaqIconStyle = 'chevron' | 'plusminus'

const FaqStyleContext = createContext<{ iconStyle?: FaqIconStyle }>({})

/**
 * QA PK-19c: FAQ questions are separate Puck child blocks (slot), so they never received the
 * parent's iconStyle prop. The parent FAQ (server component) wraps its items in this provider.
 */
export function FaqStyleProvider({
  iconStyle,
  children,
}: {
  iconStyle?: FaqIconStyle
  children: React.ReactNode
}) {
  return <FaqStyleContext.Provider value={{ iconStyle }}>{children}</FaqStyleContext.Provider>
}

export function useFaqIconStyle(own?: FaqIconStyle): FaqIconStyle {
  const ctx = useContext(FaqStyleContext)
  return own ?? ctx.iconStyle ?? 'chevron'
}
