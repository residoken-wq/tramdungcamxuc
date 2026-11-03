'use client'

import React from 'react'
import { usePuck } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'
import { useLockContext } from './lock-context'

export function LockPropertiesBanner() {
  const { selectedItem } = usePuck()
  const { isOwner, isUnlocked, getBlockInfo, requestUnlock, relock } = useLockContext()

  if (!selectedItem) return null

  const info = getBlockInfo(selectedItem.type)
  if (!info.locked) return null

  const itemId = selectedItem.props?.id ? String(selectedItem.props.id) : undefined
  const unlocked = isUnlocked(itemId)

  if (unlocked) {
    return (
      <div
        role="status"
        data-testid="lock-properties-banner"
        className="bg-butter-cream text-deep-navy border-b border-deep-navy/15 p-3 flex flex-col gap-1.5 text-xs font-ui"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-bold text-bright-magenta">
            <span aria-hidden="true">🔓</span>
            <span>{vi.eb14b.unlockedBadge}</span>
          </div>
          {itemId && (
            <button
              type="button"
              data-testid="block-banner-relock"
              onClick={() => relock(itemId)}
              className="px-2.5 py-1 rounded bg-white hover:bg-warm-ivory text-deep-navy font-semibold border border-deep-navy/20 transition cursor-pointer text-xs"
            >
              {vi.eb14b.relockButton}
            </button>
          )}
        </div>
        <p className="text-[11px] text-deep-navy/80">
          Đang mở khoá trong phiên này. Tải lại trang sẽ tự khoá lại.
        </p>
      </div>
    )
  }

  return (
    <div
      role="status"
      data-testid="lock-properties-banner"
      className="bg-butter-cream text-deep-navy border-b border-deep-navy/15 p-3 flex flex-col gap-2 text-xs font-ui"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-bold text-deep-navy">
          <span aria-hidden="true">🔒</span>
          <span>{vi.eb14b.lockedBadge}</span>
        </div>
        {info.canUnlock && isOwner && (
          <button
            type="button"
            data-testid="block-banner-unlock"
            onClick={() => requestUnlock(selectedItem)}
            className="px-2.5 py-1 rounded bg-deep-navy text-white hover:bg-deep-navy/90 font-bold transition cursor-pointer text-xs shadow-sm"
          >
            {vi.eb14b.unlockButton}
          </button>
        )}
      </div>

      <div className="space-y-1 text-deep-navy/90 text-xs">
        <p className="font-semibold">{info.reason}</p>
        {info.blocked.length > 0 && (
          <p className="text-[11px] text-deep-navy/80">
            <span className="font-medium">{vi.eb14b.blockedPrefix}</span>{' '}
            {info.blocked.map((b) => vi.eb14b.blockedActions[b]).join(', ')}.
          </p>
        )}
      </div>

      {info.canUnlock && !isOwner && (
        <p className="text-[11px] italic text-deep-navy/70">{vi.eb14b.editorOnlyOwnerCanUnlock}</p>
      )}

      {!info.canUnlock && selectedItem.type === 'HtmlWidget' && (
        <p className="text-[11px] font-medium text-bright-magenta">{vi.eb14b.htmlLockedGuide}</p>
      )}
    </div>
  )
}
