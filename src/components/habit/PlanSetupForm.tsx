'use client'

import React, { useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { vi } from '@/lib/i18n/vi'
import { createTrackerPlanAction } from '@/lib/habit/tracker-actions'
import { Button } from '@/components/ui/Button'

export function PlanSetupForm() {
  const router = useRouter()
  const [statement, setStatement] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Khóa nút tới khi trang chạy JavaScript (tránh gửi form dạng HTML thường làm mất nội dung)
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!statement.trim()) {
      setError(vi.tracker.planSetup.errorEmpty)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await createTrackerPlanAction(statement)
      if (res.success) {
        router.refresh()
      } else {
        setError(res.message || vi.tracker.planSetup.errorCreate)
      }
    } catch (_err) {
      setError(vi.tracker.planSetup.errorGeneral)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto bg-warm-ivory rounded-card border border-deep-navy/10 p-6 sm:p-8 shadow-soft">
      <div className="text-center mb-6">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-ui font-semibold bg-soft-pink text-deep-navy mb-2">
          {vi.tracker.planSetup.title}
        </span>
        <h1 className="font-ui font-bold text-xl sm:text-2xl text-deep-navy">
          {vi.tracker.planSetup.subtitle}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="identity-statement"
            className="block text-sm font-ui font-semibold text-deep-navy mb-2"
          >
            {vi.tracker.planSetup.label}
          </label>
          <textarea
            id="identity-statement"
            rows={4}
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder={vi.tracker.planSetup.placeholder}
            disabled={!isHydrated || isLoading}
            className="w-full rounded-xl border border-deep-navy/20 p-3.5 text-sm font-sans text-deep-navy placeholder:text-deep-navy/40 focus:outline-none focus:ring-2 focus:ring-accent-pink/50 focus:border-accent-pink transition-all motion-reduce:transition-none resize-none"
          />
        </div>

        {error && (
          <p className="text-xs font-ui font-medium text-bright-magenta bg-soft-pink p-2.5 rounded-lg border border-accent-pink/30">
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={!isHydrated || isLoading}
        >
          {isLoading ? vi.tracker.planSetup.submitting : vi.tracker.planSetup.submit}
        </Button>
      </form>
    </div>
  )
}
