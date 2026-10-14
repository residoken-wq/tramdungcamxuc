'use client'

import React, { useState, useSyncExternalStore, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { requestOrderFileDownloadAction } from '@/lib/account/download-actions'
import { vi } from '@/lib/i18n/vi'

const subscribe = () => () => {}

export interface OrderFileDownloadButtonProps {
  orderId: number
  fileId: number
  filename?: string
}

/** Nút "Tải lại": xin link ký (hạn 10 phút) từ server khi bấm rồi chuyển tới link đó. */
export function OrderFileDownloadButton({
  orderId,
  fileId,
  filename,
}: OrderFileDownloadButtonProps) {
  const isHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleClick = () => {
    setError(null)
    startTransition(async () => {
      const res = await requestOrderFileDownloadAction({ orderId, fileId })
      if (res.ok) {
        window.location.assign(res.url)
      } else {
        setError(res.message)
      }
    })
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={!isHydrated || isPending}
        onClick={handleClick}
        className="motion-reduce:transition-none"
      >
        {isPending
          ? vi.account.orders.downloadPreparing
          : filename
            ? vi.account.orders.downloadFileWithFilename(filename)
            : vi.account.orders.downloadFile}
      </Button>
      {error && (
        <p role="alert" className="text-xs font-sans font-semibold text-deep-navy">
          {error}
        </p>
      )}
    </div>
  )
}
