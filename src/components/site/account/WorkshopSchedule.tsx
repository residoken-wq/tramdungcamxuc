import React from 'react'
import type { EligibleWorkshop } from '@/lib/workshops/eligible.server'
import { vi } from '@/lib/i18n/vi'
import { Button } from '@/components/ui/Button'

interface WorkshopScheduleProps {
  workshops: EligibleWorkshop[]
}

export function WorkshopSchedule({ workshops }: WorkshopScheduleProps) {
  return (
    <div className="bg-white/95 rounded-2xl p-6 border border-lavender-mist shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-deep-navy/10 pb-3">
        <h2 className="font-ui text-base font-bold text-deep-navy">{vi.workshop.heading}</h2>
        {workshops.length > 0 && (
          <span className="text-xs font-medium text-bright-magenta font-mono">
            ({workshops.length})
          </span>
        )}
      </div>

      {workshops.length === 0 ? (
        <div className="p-8 rounded-xl bg-warm-ivory/50 border border-dashed border-deep-navy/20 text-center">
          <p className="font-sans text-sm text-deep-navy/60">{vi.workshop.empty}</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {workshops.map((ws) => (
            <div
              key={ws.id}
              className="p-4 sm:p-5 rounded-xl bg-warm-ivory/40 border border-lavender-mist/80 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              {/* Workshop info */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-ui font-bold text-sm sm:text-base text-deep-navy break-words">
                    {ws.title}
                  </h3>
                  {ws.canJoinNow ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-mint-haze text-deep-navy">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-pink motion-safe:animate-pulse" />
                      {vi.workshop.openBadge}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-lavender-mist/60 text-deep-navy/80">
                      {vi.workshop.upcomingBadge}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-deep-navy/70">
                  <svg
                    className="w-4 h-4 text-bright-magenta shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{ws.formattedTime}</span>
                </div>
              </div>

              {/* Action */}
              <div className="shrink-0 w-full sm:w-auto">
                {ws.canJoinNow && ws.joinUrl ? (
                  <Button
                    href={ws.joinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="primary"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    {vi.workshop.joinButton}
                  </Button>
                ) : (
                  <div className="text-xs text-deep-navy/60 italic bg-white/70 px-3 py-2 rounded-lg border border-lavender-mist/50 text-center sm:text-right">
                    {vi.workshop.linkOpeningNotice}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
