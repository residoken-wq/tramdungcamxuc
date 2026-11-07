'use client'

import React, { useId, useState } from 'react'
import { createUsePuck } from '@puckeditor/core'
import { contrastRatio, isOpen, isValidHex } from '@/lib/design/design-system'
import { DESIGN_FONT_OPTIONS } from '@/lib/design/fonts'
import { vi } from '@/lib/i18n/vi'
import type {
  EmotionGapPreset,
  EyebrowGapPreset,
  TitleLineHeightPreset,
} from '@/lib/design/title-spacing'
import {
  cleanCssClasses,
  cleanEntrance,
  cleanEntranceDelay,
  cleanZIndex,
  DEVICES,
  FONT_SIZE_PRESETS,
  FONT_WEIGHTS,
  LINE_HEIGHTS,
  RADIUS_PRESETS,
  resolveDevice,
  SHADOWS,
  SIDES,
  SPACING_PRESETS,
  TEXT_ALIGNS,
  type BlockBackgroundImage,
  type BlockStyle,
  type Box,
  type Device,
  type LengthKind,
  type Responsive,
} from '@/puck/style/style-schema'
import {
  CONTAINER_BG_POSITIONS,
  CONTAINER_BG_SIZES,
  type ContainerBgPosition,
  type ContainerBgSize,
  type ContainerOverlayOpacity,
} from '@/puck/style/container-schema'
import { MAX_BLOCK_CUSTOM_CSS_LENGTH } from '@/puck/style/custom-css'
import { MediaPickerField, type MediaDoc } from './MediaPickerField'
import { useStylePanel } from './style-context'
import {
  ColorControl,
  DEVICE_WIDTH,
  deviceForWidth,
  FieldLabel,
  Group,
  LengthControl,
  SelectControl,
} from './style-controls'

const usePuckSelector = createUsePuck()
const t = vi.eb04

export { deviceForWidth }

export const STYLE_TAB_KEYS: (keyof BlockStyle)[] = [
  'background',
  'textColor',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'textAlign',
  'radius',
  'borderWidth',
  'borderColor',
  'shadow',
  'titleLineHeight',
  'eyebrowGap',
  'emotionGap',
  'cardFrame',
  'cardAccent',
]
export const ADVANCED_TAB_KEYS: (keyof BlockStyle)[] = [
  'padding',
  'margin',
  'hideOn',
  'anchorId',
  'cssClasses',
  'zIndex',
  'entrance',
  'entranceDelay',
  'customCss',
]

/** Drops empty values so `_style` stays small (and absent when nothing is set). */
export function compactStyle(style: BlockStyle): BlockStyle | undefined {
  const entries = Object.entries(style).filter(([, v]) => {
    if (v === undefined || v === '') return false
    if (Array.isArray(v)) return v.length > 0
    if (v && typeof v === 'object') return Object.keys(v).length > 0
    return true
  })
  return entries.length ? (Object.fromEntries(entries) as BlockStyle) : undefined
}

function BoxControl({
  label,
  kind,
  value,
  inheritedValue,
  onChange,
}: {
  label: string
  kind: LengthKind
  value: Box | undefined
  inheritedValue: Box | undefined
  onChange: (value: Box | undefined) => void
}) {
  const [linked, setLinked] = useState(false)
  const setSide = (side: (typeof SIDES)[number], v: string | undefined) => {
    const next: Box = linked
      ? Object.fromEntries(SIDES.map((s) => [s, v]))
      : { ...value, [side]: v }
    const clean = Object.fromEntries(Object.entries(next).filter(([, x]) => x !== undefined))
    onChange(Object.keys(clean).length ? (clean as Box) : undefined)
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-ui text-xs font-semibold text-deep-navy">{label}</span>
        <label className="flex items-center gap-1 text-[11px] text-deep-navy">
          <input type="checkbox" checked={linked} onChange={(e) => setLinked(e.target.checked)} />
          {t.fields.linkSides}
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {SIDES.map((side) => (
          <LengthControl
            key={side}
            label={t.sides[side]}
            value={value?.[side]}
            presets={SPACING_PRESETS}
            kind={kind}
            inherited={value?.[side] === undefined && inheritedValue?.[side] !== undefined}
            onChange={(v) => setSide(side, v)}
          />
        ))}
      </div>
    </div>
  )
}

function hexOf(value: string | undefined, palette: { token: string; hex: string }[]) {
  if (!value) return undefined
  if (isValidHex(value)) return value
  return palette.find((c) => c.token === value)?.hex
}

/**
 * EB-04b: the `_style` custom field. Draws the Style or Advanced tab (nothing on Content), with
 * per-device values for spacing, font size and alignment. Controls follow the brand locks.
 */
export function StyleField({
  value,
  onChange,
}: {
  value: unknown
  onChange: (value: BlockStyle | undefined) => void
}) {
  const { ds, tab, isOwner } = useStylePanel()
  const width = usePuckSelector((s) => s.appState.ui.viewports.current.width)
  const selectedItem = usePuckSelector((s) => s.selectedItem)
  const dispatch = usePuckSelector((s) => s.dispatch)
  const device = deviceForWidth(typeof width === 'number' ? width : undefined)
  const style: BlockStyle =
    value && typeof value === 'object' && !Array.isArray(value) ? (value as BlockStyle) : {}

  const hasChildCards = Boolean(
    selectedItem &&
    [
      'IconCardGrid',
      'VisionMission',
      'StatsBar',
      'ServiceCards',
      'TwoPathCards',
      'Callout',
      'HeroTwoEntries',
      'JourneySteps',
      'PackageCards',
      'Card',
    ].includes(String(selectedItem.type)),
  )

  // QA PK-18c: "Ảnh" is a UI mode until an image is picked. Saving an empty backgroundImage did
  // nothing (sanitize drops it without a mediaId), so the button never showed the picker.
  // Remembered per block id, so selecting another block does not carry the mode over.
  const selectedId = (selectedItem?.props as { id?: string } | undefined)?.id
  const [bgImageModeFor, setBgImageModeFor] = useState<string | undefined>()
  const bgImageMode = bgImageModeFor !== undefined && bgImageModeFor === selectedId
  const setBgImageMode = (on: boolean) => setBgImageModeFor(on ? selectedId : undefined)

  if (tab === 'content') return <></>

  const update = (patch: Partial<BlockStyle>) => onChange(compactStyle({ ...style, ...patch }))
  const setResponsive = <K extends 'fontSize' | 'textAlign' | 'padding' | 'margin'>(
    key: K,
    v: NonNullable<BlockStyle[K]>[Device] | undefined,
  ) => {
    const current = { ...(style[key] as Responsive<unknown> | undefined) }
    if (v === undefined) delete current[device]
    else current[device] = v
    update({ [key]: Object.keys(current).length ? current : undefined } as Partial<BlockStyle>)
  }
  const inheritedFrom = <T,>(v: Responsive<T> | undefined) =>
    v?.[device] === undefined ? resolveDevice(v, device) : undefined
  const resetTab = () =>
    onChange(
      compactStyle(
        Object.fromEntries(
          Object.entries(style).filter(
            ([k]) =>
              !(tab === 'style' ? STYLE_TAB_KEYS : ADVANCED_TAB_KEYS).includes(
                k as keyof BlockStyle,
              ),
          ),
        ) as BlockStyle,
      ),
    )

  const deviceBar = (
    <div className="mb-3 flex items-center justify-between gap-2">
      <span className="text-[11px] text-deep-navy">{t.devices.editing(t.devices[device])}</span>
      <div role="group" aria-label={t.devices.editing(t.devices[device])} className="flex gap-1">
        {DEVICES.map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={device === d}
            aria-label={t.devices[d]}
            title={t.devices[d]}
            onClick={() =>
              dispatch({
                type: 'setUi',
                ui: (prev) => ({
                  viewports: {
                    ...prev.viewports,
                    current: { width: DEVICE_WIDTH[d], height: 'auto' },
                  },
                }),
              })
            }
            className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
              device === d ? 'bg-deep-navy text-white' : 'bg-warm-ivory text-deep-navy'
            }`}
          >
            {t.devices[d]}
          </button>
        ))}
      </div>
    </div>
  )

  const locked = !isOpen(ds, 'colors') || !isOpen(ds, 'sizes') || !isOpen(ds, 'fonts')
  const textHex = hexOf(style.textColor, ds.colors)
  const bgHex = hexOf(style.background, ds.colors)
  const ratio = textHex && bgHex ? contrastRatio(textHex, bgHex) : null

  const t18 = vi.pk18.bgImage
  const hasBgImage = Boolean(style.backgroundImage?.mediaId || style.backgroundImage?.imageUrl)
  const bgType = hasBgImage || bgImageMode ? 'image' : 'color'

  const updateBgImage = (patch: Partial<BlockBackgroundImage>) => {
    const current = style.backgroundImage || {}
    const next: BlockBackgroundImage = { ...current, ...patch }
    // If no media, clean it
    if (!next.mediaId && !next.mobileMediaId && !next.imageUrl && !next.mobileImageUrl) {
      update({ backgroundImage: undefined })
    } else {
      update({ backgroundImage: next })
    }
  }

  return (
    <div className="pt-2" data-testid={`style-field-${tab}`}>
      {deviceBar}
      {locked ? <p className="mb-3 text-[11px] text-deep-navy/80">{t.lockedHint}</p> : null}

      {tab === 'style' ? (
        <>
          <Group title={t.groups.background}>
            {/* Toggle Color / Image */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel>{t18.bgTypeLabel}</FieldLabel>
              <div role="group" aria-label={t18.bgTypeLabel} className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  aria-pressed={bgType === 'color'}
                  onClick={() => {
                    if (bgType === 'image') {
                      setBgImageMode(false)
                      update({ backgroundImage: undefined })
                    }
                  }}
                  className={`h-8 rounded-md border text-xs font-semibold transition-colors ${
                    bgType === 'color'
                      ? 'border-bright-magenta bg-soft-pink/50 text-bright-magenta'
                      : 'border-deep-navy/15 bg-white text-deep-navy/80 hover:border-deep-navy/30'
                  }`}
                >
                  {t18.bgTypeColor}
                </button>
                <button
                  type="button"
                  aria-pressed={bgType === 'image'}
                  onClick={() => setBgImageMode(true)}
                  className={`h-8 rounded-md border text-xs font-semibold transition-colors ${
                    bgType === 'image'
                      ? 'border-bright-magenta bg-soft-pink/50 text-bright-magenta'
                      : 'border-deep-navy/15 bg-white text-deep-navy/80 hover:border-deep-navy/30'
                  }`}
                >
                  {t18.bgTypeImage}
                </button>
              </div>
            </div>

            {bgType === 'color' ? (
              <ColorControl
                label={t.fields.background}
                value={style.background}
                onChange={(v) => update({ background: v })}
              />
            ) : (
              <div className="flex flex-col gap-3 pt-1">
                {/* Desktop & Tablet background image */}
                <MediaPickerField
                  label={t18.imageLabel}
                  value={style.backgroundImage?.mediaId}
                  onChange={(id) => {
                    if (!id) {
                      updateBgImage({
                        mediaId: undefined,
                        imageUrl: undefined,
                        imageAlt: undefined,
                      })
                    } else {
                      updateBgImage({ mediaId: id })
                    }
                  }}
                  onSelectMedia={(m: MediaDoc) => {
                    const isDark = style.background === 'deep-navy'
                    const defaultOverlay = isDark ? 'deep-navy' : 'warm-ivory'
                    updateBgImage({
                      mediaId: String(m.id),
                      imageUrl: m.url || '',
                      imageAlt: m.alt || '',
                      overlay: style.backgroundImage?.overlay || defaultOverlay,
                      overlayOpacity: style.backgroundImage?.overlayOpacity ?? 40,
                    })
                  }}
                />

                {/* Mobile background image (optional) */}
                <MediaPickerField
                  label={t18.mobileImageLabel}
                  value={style.backgroundImage?.mobileMediaId}
                  onChange={(id) => {
                    if (!id) {
                      updateBgImage({
                        mobileMediaId: undefined,
                        mobileImageUrl: undefined,
                      })
                    } else {
                      updateBgImage({ mobileMediaId: id })
                    }
                  }}
                  onSelectMedia={(m: MediaDoc) => {
                    updateBgImage({
                      mobileMediaId: String(m.id),
                      mobileImageUrl: m.url || '',
                    })
                  }}
                />

                {/* Size */}
                <SelectControl
                  label={t18.sizeLabel}
                  value={style.backgroundImage?.size ?? 'cover'}
                  options={[
                    { value: 'cover', label: t18.sizeCover },
                    { value: 'contain', label: t18.sizeContain },
                  ]}
                  onChange={(v) => updateBgImage({ size: v as ContainerBgSize })}
                />

                {/* Position */}
                <SelectControl
                  label={t18.positionLabel}
                  value={style.backgroundImage?.position ?? 'center'}
                  options={CONTAINER_BG_POSITIONS.map((pos) => ({
                    value: pos,
                    label: t18.positions[pos],
                  }))}
                  onChange={(v) => updateBgImage({ position: v as ContainerBgPosition })}
                />

                {/* Overlay color */}
                <ColorControl
                  label={t18.overlayLabel}
                  value={style.backgroundImage?.overlay}
                  onChange={(v) => updateBgImage({ overlay: v })}
                />

                {/* Overlay opacity */}
                <SelectControl
                  label={t18.overlayOpacityLabel}
                  value={
                    style.backgroundImage?.overlayOpacity !== undefined
                      ? String(style.backgroundImage.overlayOpacity)
                      : '40'
                  }
                  options={[
                    { value: '0', label: '0%' },
                    { value: '20', label: '20%' },
                    { value: '40', label: '40%' },
                    { value: '60', label: '60%' },
                    { value: '80', label: '80%' },
                  ]}
                  onChange={(v) =>
                    updateBgImage({
                      overlayOpacity:
                        v !== undefined ? (Number(v) as ContainerOverlayOpacity) : undefined,
                    })
                  }
                />

                {style.backgroundImage?.overlayOpacity === 0 && (
                  <p
                    role="alert"
                    className="rounded-md bg-butter-cream px-2 py-1.5 text-[11px] text-deep-navy font-medium"
                  >
                    {t18.contrastWarning}
                  </p>
                )}
              </div>
            )}
          </Group>
          <Group title={t.groups.text}>
            <ColorControl
              label={t.fields.textColor}
              value={style.textColor}
              onChange={(v) => update({ textColor: v })}
            />
            {ds.lock.contrastCheck && ratio !== null && ratio < 4.5 ? (
              <p
                role="alert"
                className="rounded-md bg-butter-cream px-2 py-1.5 text-[11px] text-deep-navy"
              >
                {t.contrastWarning(ratio.toFixed(2))}
              </p>
            ) : null}
            {isOpen(ds, 'fonts') ? (
              <SelectControl
                label={t.fields.fontFamily}
                value={style.fontFamily}
                options={DESIGN_FONT_OPTIONS.map((f) => f.value)}
                onChange={(v) => update({ fontFamily: v })}
              />
            ) : null}
            <LengthControl
              label={t.fields.fontSize}
              value={style.fontSize?.[device]}
              presets={FONT_SIZE_PRESETS}
              kind="fontSize"
              inherited={inheritedFrom(style.fontSize) !== undefined}
              onChange={(v) => setResponsive('fontSize', v)}
            />
            <SelectControl
              label={t.fields.fontWeight}
              value={style.fontWeight ? String(style.fontWeight) : undefined}
              options={FONT_WEIGHTS.map(String)}
              onChange={(v) => update({ fontWeight: v ? Number(v) : undefined })}
            />
            <SelectControl
              label={t.fields.lineHeight}
              value={style.lineHeight}
              options={LINE_HEIGHTS}
              onChange={(v) => update({ lineHeight: v })}
            />
            <SelectControl
              label={t.fields.textAlign}
              value={style.textAlign?.[device]}
              options={TEXT_ALIGNS}
              inherited={inheritedFrom(style.textAlign) !== undefined}
              onChange={(v) => setResponsive('textAlign', v)}
            />
          </Group>
          <Group title={vi.pk13.titleSpacing.groupLabel}>
            <SelectControl
              label={vi.pk13.titleSpacing.titleLineHeight}
              value={style.titleLineHeight}
              defaultLabel={vi.pk13.titleSpacing.byGlobalDefault}
              options={[
                { value: 'normal', label: vi.pk13.titleSpacing.blockLevels.normal },
                { value: 'airy', label: vi.pk13.titleSpacing.lineHeightLevels.airy },
                { value: 'very-airy', label: vi.pk13.titleSpacing.lineHeightLevels.veryAiry },
              ]}
              onChange={(v) =>
                update({ titleLineHeight: v ? (v as TitleLineHeightPreset) : undefined })
              }
            />
            <SelectControl
              label={vi.pk13.titleSpacing.eyebrowGap}
              value={style.eyebrowGap}
              defaultLabel={vi.pk13.titleSpacing.byGlobalDefault}
              options={[
                { value: 'tight', label: vi.pk13.titleSpacing.gapLevels.tight },
                { value: 'normal', label: vi.pk13.titleSpacing.blockLevels.normal },
                { value: 'airy', label: vi.pk13.titleSpacing.gapLevels.airy },
              ]}
              onChange={(v) => update({ eyebrowGap: v ? (v as EyebrowGapPreset) : undefined })}
            />
            <SelectControl
              label={vi.pk13.titleSpacing.emotionGap}
              value={style.emotionGap}
              defaultLabel={vi.pk13.titleSpacing.byGlobalDefault}
              options={[
                { value: 'tight', label: vi.pk13.titleSpacing.gapLevels.tight },
                { value: 'normal', label: vi.pk13.titleSpacing.blockLevels.normal },
                { value: 'airy', label: vi.pk13.titleSpacing.gapLevels.airy },
              ]}
              onChange={(v) => update({ emotionGap: v ? (v as EmotionGapPreset) : undefined })}
            />
          </Group>
          <Group title={t.groups.border}>
            <LengthControl
              label={t.fields.radius}
              value={style.radius}
              presets={RADIUS_PRESETS}
              kind="radius"
              onChange={(v) => update({ radius: v })}
            />
            <div className="flex flex-col gap-1">
              <FieldLabel>{t.fields.borderWidth}</FieldLabel>
              <input
                type="number"
                min={0}
                max={16}
                aria-label={t.fields.borderWidth}
                value={style.borderWidth ?? ''}
                onChange={(e) =>
                  update({
                    borderWidth: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
                className="h-8 rounded-md border border-deep-navy/20 px-2 text-xs text-deep-navy"
              />
            </div>
            <ColorControl
              label={t.fields.borderColor}
              value={style.borderColor}
              onChange={(v) => update({ borderColor: v })}
            />
          </Group>
          <Group title={t.groups.shadow}>
            <SelectControl
              label={t.fields.shadow}
              value={style.shadow}
              options={SHADOWS}
              onChange={(v) => update({ shadow: v })}
            />
          </Group>
          {hasChildCards && (
            <Group title={vi.pk17?.cardFrame?.groupTitle || 'Thẻ con'}>
              <SelectControl
                label={vi.pk17?.cardFrame?.label || 'Khung thẻ'}
                value={style.cardFrame || 'default'}
                options={[
                  { value: 'default', label: vi.pk17?.cardFrame?.default || 'Mặc định' },
                  { value: 'borderless', label: vi.pk17?.cardFrame?.borderless || 'Bỏ viền' },
                  { value: 'flat', label: vi.pk17?.cardFrame?.flat || 'Bỏ viền và bóng' },
                  { value: 'none', label: vi.pk17?.cardFrame?.none || 'Không khung' },
                  { value: 'glass', label: vi.pk20?.cardFrame?.glass || 'Kính mờ' },
                ]}
                onChange={(v) =>
                  update({
                    cardFrame:
                      v && v !== 'default'
                        ? (v as 'borderless' | 'flat' | 'none' | 'glass')
                        : undefined,
                  })
                }
              />
              <SelectControl
                label={vi.pk20?.cardAccent?.label || 'Vạch màu đầu thẻ'}
                value={style.cardAccent || 'none'}
                options={[
                  { value: 'none', label: vi.pk20?.cardAccent?.none || 'Không có' },
                  {
                    value: 'cycle',
                    label:
                      vi.pk20?.cardAccent?.cycle || 'Xoay vòng (Hồng sen → Hồng nhấn → Xanh thẫm)',
                  },
                  {
                    value: 'deep-navy',
                    label: vi.pk20?.cardAccent?.['deep-navy'] || 'Xanh thẫm (Deep Navy)',
                  },
                  {
                    value: 'bright-magenta',
                    label: vi.pk20?.cardAccent?.['bright-magenta'] || 'Hồng sen (Bright Magenta)',
                  },
                  {
                    value: 'accent-pink',
                    label: vi.pk20?.cardAccent?.['accent-pink'] || 'Hồng nhấn (Accent Pink)',
                  },
                  {
                    value: 'soft-pink',
                    label: vi.pk20?.cardAccent?.['soft-pink'] || 'Hồng phấn (Soft Pink)',
                  },
                  {
                    value: 'lavender-mist',
                    label: vi.pk20?.cardAccent?.['lavender-mist'] || 'Tím nhạt (Lavender Mist)',
                  },
                  {
                    value: 'mint-haze',
                    label: vi.pk20?.cardAccent?.['mint-haze'] || 'Xanh bạc hà (Mint Haze)',
                  },
                  {
                    value: 'butter-cream',
                    label: vi.pk20?.cardAccent?.['butter-cream'] || 'Vàng bơ (Butter Cream)',
                  },
                  {
                    value: 'warm-ivory',
                    label: vi.pk20?.cardAccent?.['warm-ivory'] || 'Trắng ngà (Warm Ivory)',
                  },
                ]}
                onChange={(v) =>
                  update({
                    cardAccent: v && v !== 'none' ? (v as any) : undefined,
                  })
                }
              />
            </Group>
          )}
        </>
      ) : (
        <>
          <Group title={t.groups.spacing}>
            <BoxControl
              label={t.fields.padding}
              kind="spacing"
              value={style.padding?.[device]}
              inheritedValue={inheritedFrom(style.padding)}
              onChange={(v) => setResponsive('padding', v)}
            />
            <BoxControl
              label={t.fields.margin}
              kind="margin"
              value={style.margin?.[device]}
              inheritedValue={inheritedFrom(style.margin)}
              onChange={(v) => setResponsive('margin', v)}
            />
          </Group>
          <Group title={t.groups.visibility}>
            <span className="font-ui text-xs font-semibold text-deep-navy">{t.fields.hideOn}</span>
            {DEVICES.map((d) => (
              <label key={d} className="flex items-center gap-2 text-xs text-deep-navy">
                <input
                  type="checkbox"
                  checked={style.hideOn?.includes(d) ?? false}
                  onChange={(e) => {
                    const set = new Set(style.hideOn ?? [])
                    if (e.target.checked) set.add(d)
                    else set.delete(d)
                    update({ hideOn: [...set] })
                  }}
                />
                {t.devices[d]}
              </label>
            ))}
          </Group>
          <Group title={t.groups.anchor}>
            <AnchorControl value={style.anchorId} onChange={(v) => update({ anchorId: v })} />
          </Group>
          <Group title={vi.eb09.classesZIndexGroup}>
            <div className="flex flex-col gap-1">
              <FieldLabel>{vi.eb09.cssClassesLabel}</FieldLabel>
              <CssClassesInput
                value={style.cssClasses}
                onCommit={(cssClasses) => update({ cssClasses })}
              />
              <span className="text-[11px] text-deep-navy/80">{vi.eb09.cssClassesHelp}</span>
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel>{vi.eb09.zIndexLabel}</FieldLabel>
              <input
                type="number"
                min={-10}
                max={100}
                aria-label={vi.eb09.zIndexLabel}
                placeholder="0"
                value={style.zIndex ?? ''}
                onChange={(e) =>
                  update({
                    zIndex: e.target.value === '' ? undefined : cleanZIndex(Number(e.target.value)),
                  })
                }
                className="h-8 rounded-md border border-deep-navy/20 bg-warm-ivory/50 px-2 text-xs text-deep-navy focus:border-deep-navy focus:outline-none"
              />
              <span className="text-[11px] text-deep-navy/80">{vi.eb09.zIndexHelp}</span>
            </div>
          </Group>
          <Group title={vi.eb09.entranceGroup}>
            <div className="flex flex-col gap-1">
              <FieldLabel>{vi.eb09.entranceLabel}</FieldLabel>
              <select
                aria-label={vi.eb09.entranceLabel}
                value={style.entrance ?? 'none'}
                onChange={(e) => update({ entrance: cleanEntrance(e.target.value) })}
                className="h-8 rounded-md border border-deep-navy/20 bg-warm-ivory/50 px-2 text-xs text-deep-navy focus:border-deep-navy focus:outline-none"
              >
                <option value="none">{vi.eb09.entranceNone}</option>
                <option value="fade-in">{vi.eb09.entranceFadeIn}</option>
                <option value="fade-up">{vi.eb09.entranceFadeUp}</option>
                <option value="zoom-in">{vi.eb09.entranceZoomIn}</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel>{vi.eb09.entranceDelayLabel}</FieldLabel>
              <select
                aria-label={vi.eb09.entranceDelayLabel}
                value={String(style.entranceDelay ?? 0)}
                onChange={(e) =>
                  update({ entranceDelay: cleanEntranceDelay(Number(e.target.value)) })
                }
                className="h-8 rounded-md border border-deep-navy/20 bg-warm-ivory/50 px-2 text-xs text-deep-navy focus:border-deep-navy focus:outline-none"
              >
                <option value="0">{vi.eb09.delayNone}</option>
                <option value="150">{vi.eb09.delay150}</option>
                <option value="300">{vi.eb09.delay300}</option>
                <option value="500">{vi.eb09.delay500}</option>
              </select>
            </div>
          </Group>
          {isOpen(ds, 'customCss') && isOwner ? (
            <Group title={vi.eb09.customCssGroup}>
              <div
                role="note"
                className="rounded-md bg-butter-cream/60 px-2 py-1.5 text-[11px] font-semibold text-deep-navy"
              >
                ⚠️ {vi.eb09.customCssWarning}
              </div>
              <p className="text-[11px] text-deep-navy/80">{vi.eb09.customCssHelp}</p>
              <div className="flex flex-col gap-1">
                <textarea
                  rows={6}
                  maxLength={MAX_BLOCK_CUSTOM_CSS_LENGTH}
                  placeholder={vi.eb09.customCssPlaceholder}
                  aria-label={vi.eb09.customCssLabel}
                  value={style.customCss ?? ''}
                  onChange={(e) => update({ customCss: e.target.value })}
                  className="w-full rounded-md border border-deep-navy/20 bg-warm-ivory/50 p-2 font-mono text-xs text-deep-navy focus:border-deep-navy focus:outline-none"
                />
                <div className="text-right text-[11px] text-deep-navy/70">
                  {vi.eb09.customCssCharCount(
                    (style.customCss ?? '').length,
                    MAX_BLOCK_CUSTOM_CSS_LENGTH,
                  )}
                </div>
              </div>
            </Group>
          ) : null}
        </>
      )}

      <button
        type="button"
        onClick={resetTab}
        className="mt-1 rounded-lg border border-deep-navy/20 px-3 py-1.5 font-ui text-xs font-semibold text-deep-navy hover:bg-soft-pink/40"
      >
        {t.reset}
      </button>
    </div>
  )
}

function AnchorControl({
  value,
  onChange,
}: {
  value: string | undefined
  onChange: (value: string | undefined) => void
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel htmlFor={id}>{t.fields.anchorId}</FieldLabel>
      <input
        id={id}
        type="text"
        value={value ?? ''}
        placeholder="dang-ky"
        onChange={(e) => onChange(e.target.value.trim() || undefined)}
        className="h-8 rounded-md border border-deep-navy/20 px-2 text-xs text-deep-navy"
      />
      <span className="text-[11px] text-deep-navy/80">{t.fields.anchorHint}</span>
    </div>
  )
}

/**
 * EB-09c: the class list is cleaned when the field loses focus (or on Enter). Cleaning on every
 * keystroke trimmed the trailing space right away, so a second class could not be typed.
 */
function CssClassesInput({
  value,
  onCommit,
}: {
  value: string[] | undefined
  onCommit: (value: string[] | undefined) => void
}) {
  const saved = value?.join(' ') ?? ''
  const [draft, setDraft] = useState<string | null>(null)
  const commit = () => {
    if (draft === null) return
    onCommit(cleanCssClasses(draft))
    setDraft(null)
  }
  return (
    <input
      type="text"
      aria-label={vi.eb09.cssClassesLabel}
      placeholder={vi.eb09.cssClassesPlaceholder}
      value={draft ?? saved}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
      }}
      className="h-8 rounded-md border border-deep-navy/20 bg-warm-ivory/50 px-2 text-xs text-deep-navy focus:border-deep-navy focus:outline-none"
    />
  )
}
