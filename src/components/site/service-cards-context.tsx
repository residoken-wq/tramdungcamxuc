'use client'

import React, { createContext, useContext, useRef } from 'react'

export interface ServiceCardsContextValue {
  layout?: 'default' | 'detailed'
  cardTitles?: Array<{ text?: string }>
  cardMedia?: Array<{ mediaId?: string | number; imageUrl?: string }>
  getIndex?: () => number
}

const ServiceCardsContext = createContext<ServiceCardsContextValue>({})

export function ServiceCardsProvider({
  layout = 'default',
  cardTitles = [],
  cardMedia = [],
  children,
}: {
  layout?: 'default' | 'detailed'
  cardTitles?: Array<{ text?: string }>
  cardMedia?: Array<{ mediaId?: string | number; imageUrl?: string }>
  children: React.ReactNode
}) {
  const counterRef = useRef(0)
  counterRef.current = 0

  const getIndex = () => {
    const idx = counterRef.current
    counterRef.current += 1
    return idx
  }

  return (
    <ServiceCardsContext.Provider value={{ layout, cardTitles, cardMedia, getIndex }}>
      {children}
    </ServiceCardsContext.Provider>
  )
}

export function useServiceCardsContext(): ServiceCardsContextValue {
  return useContext(ServiceCardsContext)
}
