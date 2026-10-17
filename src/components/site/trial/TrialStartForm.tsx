'use client'

import React, { useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { track } from '@/lib/analytics/track'
import { vi } from '@/lib/i18n/vi'
import { startTrialAction } from '@/lib/entitlements/actions'

interface TrialStartFormProps {
  productSlug: string
  productName: string
  trialDays: number
  toolUrl: string
}

export function TrialStartForm({
  productSlug,
  productName: _productName,
  trialDays,
  toolUrl,
}: TrialStartFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  // Khóa nút tới khi trang chạy JavaScript: bấm sớm thì form gửi kiểu HTML thường (GET) và mất ?san-pham=
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const res = await startTrialAction(productSlug)
      if (res.success && res.code === 'TRIAL_STARTED') {
        // Ghi nhận sự kiện phân tích chỉ khi kích hoạt dùng thử thành công
        track('trial_started', {
          productSlug,
          days: res.days ?? trialDays,
        })
        const targetUrl = res.toolUrl || toolUrl
        router.push(targetUrl)
        return
      }

      if (res.code === 'TRIAL_ACTIVE' || res.code === 'ALREADY_HAVE_ACTIVE') {
        const targetUrl = res.toolUrl || toolUrl
        router.push(targetUrl)
        return
      }

      setErrorMessage(res.message || vi.trial.generalError)
      setIsLoading(false)
    } catch (err) {
      console.error('[TrialStartForm] Error starting trial:', err)
      setErrorMessage(vi.trial.generalError)
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleStart} className="w-full space-y-4">
      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-accent-pink/10 border border-accent-pink/30 text-bright-magenta font-sans text-xs sm:text-sm"
        >
          {errorMessage}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={!isHydrated || isLoading}
        className="w-full justify-center shadow-md shadow-accent-pink/20"
      >
        {isLoading ? vi.trial.starting : vi.trial.startButton(trialDays)}
      </Button>
    </form>
  )
}
