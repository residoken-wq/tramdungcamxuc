'use client'

import React from 'react'
import Image from 'next/image'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { useClientTeamMembers, type PublicTeamMember } from '@/puck/client-preview'
import { vi } from '@/lib/i18n/vi'

export type { PublicTeamMember }

export interface TeamGridProps {
  version?: number
  seriesLabel?: string
  titleLine1: string
  titleLine2?: string
  emotionLine?: string
  bgColor?:
    'warm-ivory' | 'soft-pink' | 'lavender-mist' | 'mint-haze' | 'butter-cream' | 'deep-navy'
  padding?: 'sm' | 'md' | 'lg'
  _resolved?: {
    members?: PublicTeamMember[]
  }
  puck?: {
    isEditing?: boolean
  }
}

const BG_COLORS = {
  'warm-ivory': 'bg-warm-ivory',
  'soft-pink': 'bg-soft-pink',
  'lavender-mist': 'bg-lavender-mist',
  'mint-haze': 'bg-mint-haze',
  'butter-cream': 'bg-butter-cream',
  'deep-navy': 'bg-deep-navy text-white',
} as const

const PADDINGS = {
  sm: 'py-8 px-4 sm:px-6',
  md: 'py-14 px-6 sm:px-8',
  lg: 'py-20 px-6 sm:px-12',
} as const

export function TeamGrid({
  seriesLabel,
  titleLine1,
  titleLine2,
  emotionLine,
  bgColor = 'warm-ivory',
  padding = 'md',
  _resolved,
  puck,
}: TeamGridProps) {
  const isEditing = puck?.isEditing ?? false
  const isDeepNavy = bgColor === 'deep-navy'

  const { members: clientMembers } = useClientTeamMembers({
    initialMembers: _resolved?.members,
  })

  const rawMembers = _resolved?.members ?? clientMembers ?? []
  // Privacy safeguard: only members who consented are rendered
  const validMembers = rawMembers.filter((m) => m && m.consent === true)

  if (!isEditing && validMembers.length === 0) {
    return null
  }

  if (isEditing && validMembers.length === 0) {
    return (
      <section
        className={`w-full ${BG_COLORS[bgColor] || BG_COLORS['warm-ivory']} ${PADDINGS[padding]}`}
      >
        <div className="mx-auto max-w-5xl py-8 px-4 rounded-card border-2 border-dashed border-deep-navy/20 text-center font-ui text-sm text-deep-navy/70 bg-white/50">
          {vi.sm04?.teamEmptyMessage || 'Chưa có dữ liệu – nhập trong CMS'}
        </div>
      </section>
    )
  }

  const cardBgClass = isDeepNavy
    ? 'bg-white/10 border-white/15 text-white'
    : 'bg-white border-deep-navy/10 text-deep-navy'
  const textColorClass = isDeepNavy ? 'text-white' : 'text-deep-navy'
  const roleColorClass = isDeepNavy ? 'text-soft-pink' : 'text-bright-magenta'
  const specialtyColorClass = isDeepNavy ? 'text-white/70' : 'text-deep-navy/70'
  const bioColorClass = isDeepNavy ? 'text-white/90' : 'text-deep-navy/80'

  const gridColsClass =
    validMembers.length === 1
      ? 'max-w-sm mx-auto'
      : validMembers.length === 2
        ? 'grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-2xl mx-auto'
        : validMembers.length === 3
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto'
          : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 max-w-6xl mx-auto'

  return (
    <section
      className={`w-full ${BG_COLORS[bgColor] || BG_COLORS['warm-ivory']} ${PADDINGS[padding]} transition-colors`}
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          seriesLabel={seriesLabel}
          titleLine1={titleLine1}
          titleLine2={titleLine2}
          emotionLine={emotionLine}
          align="center"
          className="mb-10 sm:mb-14"
        />

        <div className={gridColsClass}>
          {validMembers.map((member) => {
            const initial = (member.name || '').trim().charAt(0).toUpperCase() || '?'

            return (
              <div
                key={member.id}
                className={`rounded-card border ${cardBgClass} p-6 sm:p-7 shadow-soft flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1`}
              >
                {member.photoUrl ? (
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-accent-pink/30 shadow-soft mx-auto mb-4 bg-warm-ivory/50">
                    <Image
                      src={member.photoUrl}
                      alt={member.photoAlt || member.name}
                      fill
                      sizes="(max-width: 640px) 96px, 112px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-soft-pink border-2 border-accent-pink/20 flex items-center justify-center mx-auto mb-4 shadow-soft">
                    <span className="font-display text-2xl sm:text-3xl text-deep-navy font-bold">
                      {initial}
                    </span>
                  </div>
                )}

                <h3
                  className={`font-display text-xl sm:text-2xl uppercase tracking-tight mb-1 ${textColorClass}`}
                >
                  {member.name}
                </h3>

                {member.role && (
                  <p className={`font-ui text-sm font-bold mb-1 ${roleColorClass}`}>
                    {member.role}
                  </p>
                )}

                {member.specialty && (
                  <p className={`font-ui text-xs mb-3 italic ${specialtyColorClass}`}>
                    {member.specialty}
                  </p>
                )}

                {member.bio && (
                  <p className={`font-ui text-sm leading-relaxed ${bioColorClass}`}>{member.bio}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
