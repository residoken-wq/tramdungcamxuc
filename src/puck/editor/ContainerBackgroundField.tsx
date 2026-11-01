'use client'

import React, { useId, useState } from 'react'
import { vi } from '@/lib/i18n/vi'
import {
  CONTAINER_BG_POSITIONS,
  CONTAINER_BG_SIZES,
  CONTAINER_BG_TYPES,
  CONTAINER_GRADIENT_ANGLES,
  type ContainerBackground,
  type ContainerBgSize,
  type ContainerGradientAngle,
} from '@/puck/style/container-schema'
import { useStylePanel } from './style-context'
import { ColorControl, FieldLabel, Group } from './style-controls'

const t = vi.eb05.background

type MediaItem = {
  id: string | number
  url?: string
  alt?: string
  filename?: string
}

export function ContainerBackgroundField({
  value,
  onChange,
}: {
  value?: ContainerBackground
  onChange: (value: ContainerBackground) => void
}) {
  const { tab } = useStylePanel()
  const uid = useId()

  // State for media picker modal / dropdown
  const [mediaList, setMediaList] = useState<MediaItem[]>([])
  const [loadingMedia, setLoadingMedia] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // EB-05 Lỗi 1: Custom field must self-filter and only render on Style tab
  if (tab !== 'style') return <></>

  const bg: ContainerBackground = value ?? { type: 'none' }

  const updateBg = (patch: Partial<ContainerBackground>) => {
    const nextBg: ContainerBackground = { ...bg, ...patch }
    onChange(nextBg)
  }

  const fetchMedia = async (query = '') => {
    try {
      setLoadingMedia(true)
      const q = query ? `&where[alt][like]=${encodeURIComponent(query)}` : ''
      const res = await fetch(`/api/media?limit=50&depth=0${q}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        // Every image needs alt text (AGENTS §5B): files without it are not offered.
        const docs: MediaItem[] = Array.isArray(data.docs) ? data.docs : []
        setMediaList(docs.filter((d) => typeof d.alt === 'string' && d.alt.trim().length > 0))
      }
    } catch {
      setMediaList([])
    } finally {
      setLoadingMedia(false)
    }
  }

  const handleSelectMedia = (m: MediaItem) => {
    updateBg({
      mediaId: String(m.id),
      imageUrl: m.url || '',
      imageAlt: m.alt || '',
    })
    setShowPicker(false)
  }

  return (
    <div className="pt-2" data-testid="container-background-field">
      <Group title={t.title}>
        {/* Type toggle */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel>{t.type}</FieldLabel>
          <div role="group" aria-label={t.type} className="grid grid-cols-3 gap-1">
            {CONTAINER_BG_TYPES.map((type) => {
              const active = bg.type === type
              return (
                <button
                  key={type}
                  type="button"
                  aria-pressed={active}
                  onClick={() => updateBg({ type })}
                  className={`h-8 rounded-md border text-xs font-semibold transition-colors ${
                    active
                      ? 'border-bright-magenta bg-soft-pink/50 text-bright-magenta'
                      : 'border-deep-navy/15 bg-white text-deep-navy/80 hover:border-deep-navy/30'
                  }`}
                >
                  {t.types[type]}
                </button>
              )
            })}
          </div>
        </div>

        {/* IMAGE CONTROLS */}
        {bg.type === 'image' ? (
          <div className="flex flex-col gap-3 pt-1">
            {/* Selected media preview */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel>{t.image}</FieldLabel>
              {bg.imageUrl ? (
                <div className="flex items-center gap-2 rounded-lg border border-deep-navy/15 bg-white p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bg.imageUrl}
                    alt={bg.imageAlt || ''}
                    className="h-12 w-12 rounded object-cover border border-deep-navy/10"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-deep-navy">
                      {bg.imageAlt || t.mediaId(String(bg.mediaId ?? ''))}
                    </p>
                    <p className="truncate text-[10px] text-deep-navy/60">{bg.imageUrl}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateBg({ mediaId: undefined, imageUrl: undefined, imageAlt: undefined })
                    }}
                    className="rounded p-1 text-xs text-bright-magenta hover:bg-soft-pink"
                    title={t.removeMedia}
                    aria-label={t.removeMedia}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-deep-navy/60 italic">{t.noMediaSelected}</p>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowPicker(true)
                  fetchMedia()
                }}
                className="h-8 rounded-md border border-deep-navy/20 bg-lavender-mist/40 px-3 text-xs font-semibold text-deep-navy hover:bg-lavender-mist"
              >
                {bg.imageUrl ? t.changeMedia : t.mediaSelect}
              </button>
            </div>

            {/* Media picker popup */}
            {showPicker ? (
              <div className="rounded-xl border border-deep-navy/20 bg-warm-ivory p-3 shadow-lg">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-deep-navy font-ui">{t.mediaSelect}</span>
                  <button
                    type="button"
                    onClick={() => setShowPicker(false)}
                    aria-label={t.closePicker}
                    title={t.closePicker}
                    className="text-xs text-deep-navy/60 hover:text-deep-navy"
                  >
                    ✕
                  </button>
                </div>
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  aria-label={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    fetchMedia(e.target.value)
                  }}
                  className="mb-2 h-7 w-full rounded border border-deep-navy/20 bg-white px-2 text-xs"
                />
                <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
                  {loadingMedia ? (
                    <p className="p-2 text-center text-xs text-deep-navy/60">{t.loading}</p>
                  ) : mediaList.length === 0 ? (
                    <p className="p-2 text-center text-xs text-deep-navy/60">{t.noResults}</p>
                  ) : (
                    mediaList.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectMedia(m)}
                        className="flex items-center gap-2 rounded p-1.5 text-left hover:bg-soft-pink/50 transition-colors"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.url || ''}
                          alt={m.alt || ''}
                          className="h-8 w-8 rounded object-cover"
                        />
                        <span className="truncate text-xs text-deep-navy">{m.alt}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}

            {/* Size */}
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor={`${uid}-size`}>{t.size}</FieldLabel>
              <select
                id={`${uid}-size`}
                value={bg.size ?? 'cover'}
                onChange={(e) => updateBg({ size: e.target.value as ContainerBgSize })}
                className="h-8 rounded-md border border-deep-navy/20 bg-white px-2 text-xs text-deep-navy"
              >
                {CONTAINER_BG_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {t.sizes[s]}
                  </option>
                ))}
              </select>
            </div>

            {/* 9-position grid */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel>{t.position}</FieldLabel>
              <div
                role="group"
                aria-label={t.position}
                className="grid grid-cols-3 gap-1 w-36 mx-auto rounded-lg border border-deep-navy/15 p-1.5 bg-white"
              >
                {CONTAINER_BG_POSITIONS.map((pos) => {
                  const active = (bg.position || 'center') === pos
                  return (
                    <button
                      key={pos}
                      type="button"
                      aria-pressed={active}
                      aria-label={t.positions[pos]}
                      title={t.positions[pos]}
                      onClick={() => updateBg({ position: pos })}
                      className={`h-7 rounded border transition-colors ${
                        active
                          ? 'border-bright-magenta bg-bright-magenta text-white shadow-sm'
                          : 'border-deep-navy/10 bg-warm-ivory/60 hover:bg-lavender-mist'
                      }`}
                    >
                      <span className="block h-1.5 w-1.5 mx-auto rounded-full bg-current" />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ) : null}

        {/* GRADIENT CONTROLS */}
        {bg.type === 'gradient' ? (
          <div className="flex flex-col gap-3 pt-1">
            <ColorControl
              label={t.gradientFrom}
              value={bg.from}
              onChange={(v) => updateBg({ from: v })}
            />
            <ColorControl
              label={t.gradientTo}
              value={bg.to}
              onChange={(v) => updateBg({ to: v })}
            />

            {/* Angle select */}
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor={`${uid}-angle`}>{t.gradientAngle}</FieldLabel>
              <select
                id={`${uid}-angle`}
                value={bg.angle ?? 180}
                onChange={(e) =>
                  updateBg({ angle: Number(e.target.value) as ContainerGradientAngle })
                }
                className="h-8 rounded-md border border-deep-navy/20 bg-white px-2 text-xs text-deep-navy"
              >
                {CONTAINER_GRADIENT_ANGLES.map((angle) => (
                  <option key={angle} value={angle}>
                    {t.angles[angle]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}
      </Group>
    </div>
  )
}
