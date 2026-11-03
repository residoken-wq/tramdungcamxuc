'use client'

import React, { createContext, useContext, useState, useRef, useCallback } from 'react'
import type { ComponentData } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'
import { getBlockLockInfo, type BlockLockInfo } from '@/puck/locks'
import type { PageKind } from '@/puck/config'
import { useContextMenu } from '@/puck/editor/context-menu/context-menu-context'
import { UnlockConfirmDialog } from './UnlockConfirmDialog'

export type LockContextValue = {
  isOwner: boolean
  pageSlug: string
  pageKind: PageKind
  htmlLocked: boolean
  unlockedBlockIds: Set<string>
  isUnlocked: (id?: string) => boolean
  getBlockInfo: (type?: string) => BlockLockInfo
  pendingUnlockItem: ComponentData | null
  requestUnlock: (item: ComponentData) => void
  confirmUnlock: () => void
  cancelUnlock: () => void
  relock: (id: string) => void
  registerRefreshPermissions: (fn: () => void) => () => void
}

const LockContext = createContext<LockContextValue | null>(null)

const defaultContextValue: LockContextValue = {
  isOwner: false,
  pageSlug: '',
  pageKind: 'page',
  htmlLocked: false,
  unlockedBlockIds: new Set(),
  isUnlocked: () => false,
  getBlockInfo: (type?: string) => getBlockLockInfo({ type }),
  pendingUnlockItem: null,
  requestUnlock: () => {},
  confirmUnlock: () => {},
  cancelUnlock: () => {},
  relock: () => {},
  registerRefreshPermissions: () => () => {},
}

export function useLockContext(): LockContextValue {
  const ctx = useContext(LockContext)
  return ctx ?? defaultContextValue
}

export type LockProviderProps = {
  children: React.ReactNode
  pageSlug: string
  pageKind?: PageKind
  isOwner?: boolean
  htmlLocked?: boolean
  unlockedBlockIds?: Set<string>
  setUnlockedBlockIds?: React.Dispatch<React.SetStateAction<Set<string>>>
  onUnlockedChange?: (unlockedIds: Set<string>) => void
}

export function LockProvider({
  children,
  pageSlug,
  pageKind = 'page',
  isOwner = false,
  htmlLocked = false,
  unlockedBlockIds: externalUnlockedIds,
  setUnlockedBlockIds: externalSetUnlockedIds,
  onUnlockedChange,
}: LockProviderProps) {
  const { showToast } = useContextMenu()
  const [localUnlockedBlockIds, setLocalUnlockedBlockIds] = useState<Set<string>>(() => new Set())
  const unlockedBlockIds = externalUnlockedIds ?? localUnlockedBlockIds
  const setUnlockedBlockIds = externalSetUnlockedIds ?? setLocalUnlockedBlockIds
  const [pendingUnlockItem, setPendingUnlockItem] = useState<ComponentData | null>(null)
  const refreshFnsRef = useRef<Set<() => void>>(new Set())

  const registerRefreshPermissions = useCallback((fn: () => void) => {
    refreshFnsRef.current.add(fn)
    return () => {
      refreshFnsRef.current.delete(fn)
    }
  }, [])

  const triggerRefreshPermissions = useCallback(() => {
    refreshFnsRef.current.forEach((fn) => {
      try {
        fn()
      } catch {
        // Safe execution
      }
    })
  }, [])

  const isUnlocked = useCallback(
    (id?: string) => {
      if (!id || !isOwner) return false
      return unlockedBlockIds.has(id)
    },
    [isOwner, unlockedBlockIds],
  )

  const getBlockInfo = useCallback(
    (type?: string) => {
      return getBlockLockInfo({
        type,
        pageSlug,
        kind: pageKind,
        htmlLocked,
      })
    },
    [pageSlug, pageKind, htmlLocked],
  )

  const requestUnlock = useCallback(
    (item: ComponentData) => {
      if (!isOwner) return
      const info = getBlockLockInfo({
        type: item.type,
        pageSlug,
        kind: pageKind,
        htmlLocked,
      })
      if (!info.canUnlock) return
      setPendingUnlockItem(item)
    },
    [isOwner, pageSlug, pageKind, htmlLocked],
  )

  // REVIEW-REQUIRED: Thực hiện mở khoá khối trong phiên chỉnh sửa cho owner
  const confirmUnlock = useCallback(() => {
    if (!pendingUnlockItem || !pendingUnlockItem.props?.id) {
      setPendingUnlockItem(null)
      return
    }

    const id = String(pendingUnlockItem.props.id)
    setUnlockedBlockIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      onUnlockedChange?.(next)
      return next
    })

    setPendingUnlockItem(null)
    showToast(vi.eb14b.toastUnlocked)
    // Notify Puck to recalculate permissions
    setTimeout(() => {
      triggerRefreshPermissions()
    }, 10)
  }, [pendingUnlockItem, setUnlockedBlockIds, showToast, triggerRefreshPermissions])

  const cancelUnlock = useCallback(() => {
    setPendingUnlockItem(null)
  }, [])

  // REVIEW-REQUIRED: Khoá lại khối trong phiên chỉnh sửa
  const relock = useCallback(
    (id: string) => {
      setUnlockedBlockIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        onUnlockedChange?.(next)
        return next
      })
      showToast(vi.eb14b.toastRelocked)
      setTimeout(() => {
        triggerRefreshPermissions()
      }, 10)
    },
    [setUnlockedBlockIds, showToast, triggerRefreshPermissions],
  )

  return (
    <LockContext.Provider
      value={{
        isOwner,
        pageSlug,
        pageKind,
        htmlLocked,
        unlockedBlockIds,
        isUnlocked,
        getBlockInfo,
        pendingUnlockItem,
        requestUnlock,
        confirmUnlock,
        cancelUnlock,
        relock,
        registerRefreshPermissions,
      }}
    >
      {children}
      {pendingUnlockItem && (
        <UnlockConfirmDialog
          item={pendingUnlockItem}
          pageSlug={pageSlug}
          pageKind={pageKind}
          onConfirm={confirmUnlock}
          onCancel={cancelUnlock}
        />
      )}
    </LockContext.Provider>
  )
}
