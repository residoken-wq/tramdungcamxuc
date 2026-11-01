'use client'

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'

export type ContextMenuState = {
  isOpen: boolean
  x: number
  y: number
  componentId: string | null
}

export type ContextMenuContextValue = {
  menuState: ContextMenuState
  openMenu: (params: { componentId: string; x: number; y: number }) => void
  closeMenu: () => void
  renamingId: string | null
  setRenamingId: (id: string | null) => void
  toastMessage: string | null
  showToast: (message: string) => void
}

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null)

export function ContextMenuProvider({ children }: { children: React.ReactNode }) {
  const [menuState, setMenuState] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    componentId: null,
  })

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const openMenu = useCallback(
    ({ componentId, x, y }: { componentId: string; x: number; y: number }) => {
      setMenuState({
        isOpen: true,
        x,
        y,
        componentId,
      })
    },
    [],
  )

  const closeMenu = useCallback(() => {
    setMenuState((prev) => (prev.isOpen ? { ...prev, isOpen: false, componentId: null } : prev))
  }, [])

  const showToast = useCallback((message: string) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current))
    }, 3000)
  }, [])

  const value = useMemo(
    () => ({
      menuState,
      openMenu,
      closeMenu,
      renamingId,
      setRenamingId,
      toastMessage,
      showToast,
    }),
    [menuState, openMenu, closeMenu, renamingId, toastMessage, showToast],
  )

  return <ContextMenuContext.Provider value={value}>{children}</ContextMenuContext.Provider>
}

export function useContextMenu(): ContextMenuContextValue {
  const ctx = useContext(ContextMenuContext)
  if (!ctx) {
    throw new Error('useContextMenu must be used within a ContextMenuProvider')
  }
  return ctx
}
