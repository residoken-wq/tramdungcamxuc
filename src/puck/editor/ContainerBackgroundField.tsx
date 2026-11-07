'use client'

import React, { useId } from 'react'
import { vi } from '@/lib/i18n/vi'
import {
  CONTAINER_BG_POSITIONS,
  CONTAINER_BG_SIZES,
  CONTAINER_BG_TYPES,
  CONTAINER_GRADIENT_ANGLES,
  type ContainerBackground,
  type ContainerBgPosition,
  type ContainerBgSize,
  type ContainerGradientAngle,
  type ContainerOverlayOpacity,
} from '@/puck/style/container-schema'
import { MediaPickerField, type MediaDoc } from './MediaPickerField'
import { useStylePanel } from './style-context'
import { ColorControl, FieldLabel, Group, SelectControl } from './style-controls'

const t = vi.eb05.background
const t18 = vi.pk18.bgImage

export function ContainerBackgroundField({
  value,
  onChange,
}: {
  value?: ContainerBackground
  onChange: (value: ContainerBackground) => void
}) {
  const { tab } = useStylePanel()
  const uid = useId()

  // EB-05 Lỗi 1: Custom field must self-filter and only render on Style tab
  if (tab !== 'style') return <></>

  const bg: ContainerBackground = value ?? { type: 'none' }

  const updateBg = (patch: Partial<ContainerBackground>) => {
    const nextBg: ContainerBackground = { ...bg, ...patch }
    onChange(nextBg)
  }

  const handleSelectMedia = (m: MediaDoc) => {
    updateBg({
      mediaId: String(m.id),
      imageUrl: m.url || '',
      imageAlt: m.alt || '',
      overlayOpacity: bg.overlayOpacity ?? 40,
    })
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
            <MediaPickerField
              value={bg.mediaId}
              label={t.image}
              onChange={(id) => {
                if (!id) {
                  updateBg({ mediaId: undefined, imageUrl: undefined, imageAlt: undefined })
                } else {
                  updateBg({ mediaId: id })
                }
              }}
              onSelectMedia={handleSelectMedia}
            />

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

            {/* Overlay color & opacity */}
            <ColorControl
              label={t18.overlayLabel}
              value={bg.overlay}
              onChange={(v) => updateBg({ overlay: v })}
            />

            <SelectControl
              label={t18.overlayOpacityLabel}
              value={bg.overlayOpacity !== undefined ? String(bg.overlayOpacity) : '40'}
              options={[
                { value: '0', label: '0%' },
                { value: '20', label: '20%' },
                { value: '40', label: '40%' },
                { value: '60', label: '60%' },
                { value: '80', label: '80%' },
              ]}
              onChange={(v) =>
                updateBg({
                  overlayOpacity:
                    v !== undefined ? (Number(v) as ContainerOverlayOpacity) : undefined,
                })
              }
            />

            {bg.overlayOpacity === 0 && (
              <p
                role="alert"
                className="rounded-md bg-butter-cream px-2 py-1.5 text-[11px] text-deep-navy font-medium"
              >
                {t18.contrastWarning}
              </p>
            )}
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
