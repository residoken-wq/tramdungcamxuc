'use client'

import React, { createContext, useContext } from 'react'

export interface ServiceCardsContextValue {
  layout?: 'default' | 'detailed'
  cardTitles?: Array<{ text?: string }>
  cardMedia?: Array<{ mediaId?: string | number; imageUrl?: string }>
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
  return (
    <ServiceCardsContext.Provider value={{ layout, cardTitles, cardMedia }}>
      {children}
    </ServiceCardsContext.Provider>
  )
}

export function useServiceCardsContext(): ServiceCardsContextValue {
  return useContext(ServiceCardsContext)
}
