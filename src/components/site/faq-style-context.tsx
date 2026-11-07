'use client'

import React, { createContext, useContext } from 'react'

export type FaqIconStyle = 'chevron' | 'plusminus'
export type FaqVariant = 'accordion' | 'cards' | 'quick'

export interface FaqStyleContextValue {
  iconStyle?: FaqIconStyle
  variant?: FaqVariant
}

const FaqStyleContext = createContext<FaqStyleContextValue>({})

/**
 * QA PK-19c / PK-21: FAQ questions are separate Puck child blocks (slot), so they never received the
 * parent's iconStyle or variant props. The parent FAQ wraps its items in this provider.
 */
export function FaqStyleProvider({
  iconStyle,
  variant,
  children,
}: {
  iconStyle?: FaqIconStyle
  variant?: FaqVariant
  children: React.ReactNode
}) {
  return (
    <FaqStyleContext.Provider value={{ iconStyle, variant }}>{children}</FaqStyleContext.Provider>
  )
}

export function useFaqIconStyle(own?: FaqIconStyle): FaqIconStyle {
  const ctx = useContext(FaqStyleContext)
  return own ?? ctx.iconStyle ?? 'chevron'
}

export function useFaqVariant(own?: FaqVariant): FaqVariant {
  const ctx = useContext(FaqStyleContext)
  return own ?? ctx.variant ?? 'accordion'
}
