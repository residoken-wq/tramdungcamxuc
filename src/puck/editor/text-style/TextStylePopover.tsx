'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import { createUsePuck } from '@puckeditor/core'
import { vi } from '@/lib/i18n/vi'
import {
  DEVICES,
  FONT_SIZE_PRESETS,
  type Device,
  type FontSizePreset,
  type TextTargetStyle,
  type BlockStyle,
} from '@/puck/style/style-schema'
import { useStylePanel } from '../style-context'
import { getBlockBackground, getContrastInfo } from './contrast-helper'
import { SECTION_BG_COLOR_OPTIONS, TEXT_COLOR_OPTIONS } from '@/puck/constants'

// QA EB-15ac: headings are large text by default (WCAG 3:1), not only after picking XL+.
const LARGE_TEXT_KEYS = new Set(['titleLine1', 'titleLine2', 'title', 'mainTitle'])
const LARGE_TEXT_BLOCKS = new Set(['HeadingWidget'])
const COLOR_NAMES: Record<string, string> = Object.fromEntries(
  [...SECTION_BG_COLOR_OPTIONS, ...TEXT_COLOR_OPTIONS].map((o) => [o.value, o.label]),
)

const usePuckSelector = createUsePuck()

const DEVICE_LABELS: Record<Device, string> = {
  desktop: vi.eb15a.deviceDesktop,
  tablet: vi.eb15a.deviceTablet,
  mobile: vi.eb15a.deviceMobile,
}

const DEVICE_WIDTH_PREVIEWS: Record<Device, number | undefined> = {
  desktop: 1440,
  tablet: 768,
  mobile: 375,
}

const ALIGN_ICONS = {
  left: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 3h12v1.5H2zm0 3.5h8V8H2zm0 3.5h12v1.5H2zm0 3.5h8V15H2z" />
    </svg>
  ),
  center: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 3h12v1.5H2zm2 3.5h8V8H4zm-2 3.5h12v1.5H2zm2 3.5h8V15H4z" />
    </svg>
  ),
  right: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 3h12v1.5H2zm4 3.5h8V8H6zm-4 3.5h12v1.5H2zm4 3.5h8V15H6z" />
    </svg>
  ),
}

export interface TextStylePopoverProps {
  isOpen: boolean
  onClose: () => void
  buttonRef: React.RefObject<HTMLButtonElement | null>
  targetKey: string
  targetLabel: string
}

export function TextStylePopover({
  isOpen,
  onClose,
  buttonRef,
  targetKey,
  targetLabel,
}: TextStylePopoverProps) {
  const sizeSelectId = useId()
  const popoverRef = useRef<HTMLDivElement>(null)
  const { ds } = useStylePanel()
  const [device, setDevice] = useState<Device>('desktop')

  const selectedItem = usePuckSelector((s) => s.selectedItem)
  const selector = usePuckSelector((s) => s.appState.ui.itemSelector)
  const dispatch = usePuckSelector((s) => s.dispatch)

  // Handle escape and outside clicks
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        buttonRef.current?.focus()
      }
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('mousedown', handleClickOutside, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('mousedown', handleClickOutside, true)
    }
  }, [isOpen, onClose, buttonRef])

  if (!isOpen || !selectedItem || !selector) return null

  const currentStyle = (selectedItem.props?._style || {}) as BlockStyle
  const textStyles = currentStyle.texts || {}
  const targetStyle: TextTargetStyle = textStyles[targetKey] || {}

  const bgToken = getBlockBackground(selectedItem)
  const pickedSize = targetStyle.size?.desktop
  const isLarge = pickedSize
    ? pickedSize === 'xl' || pickedSize === '2xl' || pickedSize === '3xl'
    : LARGE_TEXT_KEYS.has(targetKey) || LARGE_TEXT_BLOCKS.has(String(selectedItem.type))

  const updateStyle = (patch: Partial<TextTargetStyle>) => {
    const updatedTarget: TextTargetStyle = {
      ...targetStyle,
      ...patch,
    }

    // Clean up empty fields
    if (!updatedTarget.color) delete updatedTarget.color
    if (!updatedTarget.weight) delete updatedTarget.weight
    if (updatedTarget.size && Object.keys(updatedTarget.size).length === 0) {
      delete updatedTarget.size
    }
    if (updatedTarget.align && Object.keys(updatedTarget.align).length === 0) {
      delete updatedTarget.align
    }

    const updatedTexts = { ...textStyles }
    if (
      !updatedTarget.color &&
      !updatedTarget.weight &&
      !updatedTarget.size &&
      !updatedTarget.align
    ) {
      delete updatedTexts[targetKey]
    } else {
      updatedTexts[targetKey] = updatedTarget
    }

    const updatedBlockStyle: BlockStyle = {
      ...currentStyle,
      texts: Object.keys(updatedTexts).length ? updatedTexts : undefined,
    }

    const updatedItem = {
      ...selectedItem,
      props: {
        ...selectedItem.props,
        _style: updatedBlockStyle,
      },
    }

    dispatch({
      type: 'replace',
      destinationIndex: selector.index,
      destinationZone: selector.zone || 'default',
      data: updatedItem,
    })
  }

  const handleReset = () => {
    const updatedTexts = { ...textStyles }
    delete updatedTexts[targetKey]

    const updatedBlockStyle: BlockStyle = {
      ...currentStyle,
      texts: Object.keys(updatedTexts).length ? updatedTexts : undefined,
    }

    const updatedItem = {
      ...selectedItem,
      props: {
        ...selectedItem.props,
        _style: updatedBlockStyle,
      },
    }

    dispatch({
      type: 'replace',
      destinationIndex: selector.index,
      destinationZone: selector.zone || 'default',
      data: updatedItem,
    })
  }

  const handleDeviceChange = (d: Device) => {
    setDevice(d)
    const previewWidth = DEVICE_WIDTH_PREVIEWS[d]
    if (previewWidth) {
      dispatch({
        type: 'setUi',
        ui: (prev) => ({
          viewports: {
            ...prev.viewports,
            current: { width: previewWidth, height: 'auto' },
          },
        }),
      })
    }
  }

  const colorsList = ds.colors && ds.colors.length > 0 ? ds.colors : []
  const anyUnknownBg = colorsList.some(
    (c) => getContrastInfo(c.token, bgToken, isLarge, colorsList).isUnknownBg,
  )

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={vi.eb15a.popoverTitle(targetLabel)}
      className="absolute right-0 top-full mt-1.5 z-50 w-72 rounded-card bg-white p-4 shadow-xl border border-deep-navy/15 text-deep-navy text-xs"
      style={{ maxHeight: '80vh', overflowY: 'auto' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-deep-navy/10">
        <div>
          <h4 className="font-ui font-bold text-deep-navy">{vi.eb15a.popoverTitle(targetLabel)}</h4>
          <p className="text-[11px] text-deep-navy/60 leading-tight">
            {vi.eb15a.popoverDescription}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={vi.eb15a.closeButton}
          className="p-1 rounded text-deep-navy/70 hover:text-deep-navy hover:bg-deep-navy/5 transition"
        >
          ✕
        </button>
      </div>

      {/* 1. Device selector */}
      <div className="mb-4">
        <div className="flex rounded border border-deep-navy/10 p-0.5 bg-warm-ivory">
          {DEVICES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDeviceChange(d)}
              className={`flex-1 py-1 text-[11px] font-ui font-semibold rounded transition text-center ${
                device === d
                  ? 'bg-white text-deep-navy shadow-sm'
                  : 'text-deep-navy/60 hover:text-deep-navy'
              }`}
            >
              {DEVICE_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Màu chữ (Color) */}
      <div className="mb-4">
        <label className="block font-ui font-semibold text-deep-navy mb-2">
          {vi.eb15a.colorLabel}
        </label>
        <div className="grid grid-cols-4 gap-2">
          {colorsList.map((c) => {
            const contrast = getContrastInfo(c.token, bgToken, isLarge, colorsList)
            const isSelected = targetStyle.color === c.token
            const isDisabled = !contrast.allowed

            return (
              <button
                key={c.token}
                type="button"
                data-token={c.token}
                aria-label={COLOR_NAMES[c.token] || `${c.label} (${c.token})`}
                disabled={isDisabled}
                title={isDisabled ? vi.eb15a.contrastWarning : `${c.label} (${c.token})`}
                onClick={() => updateStyle({ color: isSelected ? undefined : c.token })}
                className={`flex flex-col items-center gap-1 p-1 rounded border transition ${
                  isSelected
                    ? 'border-bright-magenta ring-2 ring-bright-magenta/20 bg-soft-pink/30'
                    : 'border-deep-navy/10 hover:border-deep-navy/30'
                } ${isDisabled ? 'opacity-35 cursor-not-allowed bg-deep-navy/5' : ''}`}
              >
                <span
                  className="w-5 h-5 rounded-full border border-black/10 shadow-inner block shrink-0"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="text-[10px] leading-tight truncate w-full text-center">
                  {(COLOR_NAMES[c.token] || c.label).split(' (')[0]}
                </span>
              </button>
            )
          })}
        </div>
        {anyUnknownBg && (
          <p className="mt-1.5 text-[11px] text-bright-magenta italic leading-tight">
            ℹ️ {vi.eb15a.contrastUnknownNotice}
          </p>
        )}
      </div>

      {/* 3. Cỡ chữ (Font size, per-device) */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor={sizeSelectId} className="font-ui font-semibold text-deep-navy">
            {vi.eb15a.sizeLabel} ({DEVICE_LABELS[device]})
          </label>
        </div>
        <select
          id={sizeSelectId}
          value={targetStyle.size?.[device] || ''}
          onChange={(e) => {
            const val = e.target.value as FontSizePreset | ''
            const newSize = { ...(targetStyle.size || {}) }
            if (!val) {
              delete newSize[device]
            } else {
              newSize[device] = val
            }
            updateStyle({ size: newSize })
          }}
          className="w-full px-2 py-1.5 rounded border border-deep-navy/15 bg-white text-xs font-ui focus:outline-none focus:ring-1 focus:ring-bright-magenta"
        >
          <option value="">-- {vi.eb15a.sizeInherit} --</option>
          {FONT_SIZE_PRESETS.map((sz) => (
            <option key={sz} value={sz}>
              {sz}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Độ đậm (Font weight) */}
      <div className="mb-4">
        <label className="block font-ui font-semibold text-deep-navy mb-1.5">
          {vi.eb15a.weightLabel}
        </label>
        <div className="grid grid-cols-4 gap-1">
          <button
            type="button"
            onClick={() => updateStyle({ weight: undefined })}
            className={`py-1 text-[11px] font-ui rounded border transition ${
              !targetStyle.weight
                ? 'bg-deep-navy text-white border-deep-navy'
                : 'border-deep-navy/15 text-deep-navy hover:bg-deep-navy/5'
            }`}
          >
            {vi.eb15a.sizeInherit}
          </button>
          <button
            type="button"
            onClick={() => updateStyle({ weight: 400 })}
            className={`py-1 text-[11px] font-ui rounded border font-normal transition ${
              targetStyle.weight === 400
                ? 'bg-deep-navy text-white border-deep-navy'
                : 'border-deep-navy/15 text-deep-navy hover:bg-deep-navy/5'
            }`}
            aria-pressed={targetStyle.weight === 400}
          >
            {vi.eb15a.weightNormal}
          </button>
          <button
            type="button"
            onClick={() => updateStyle({ weight: 600 })}
            className={`py-1 text-[11px] font-ui rounded border font-semibold transition ${
              targetStyle.weight === 600
                ? 'bg-deep-navy text-white border-deep-navy'
                : 'border-deep-navy/15 text-deep-navy hover:bg-deep-navy/5'
            }`}
            aria-pressed={targetStyle.weight === 600}
          >
            {vi.eb15a.weightMedium}
          </button>
          <button
            type="button"
            onClick={() => updateStyle({ weight: 700 })}
            className={`py-1 text-[11px] font-ui rounded border font-bold transition ${
              targetStyle.weight === 700
                ? 'bg-deep-navy text-white border-deep-navy'
                : 'border-deep-navy/15 text-deep-navy hover:bg-deep-navy/5'
            }`}
            aria-pressed={targetStyle.weight === 700}
          >
            {vi.eb15a.weightBold}
          </button>
        </div>
      </div>

      {/* 5. Căn lề (Align, per-device) */}
      <div className="mb-4">
        <label className="block font-ui font-semibold text-deep-navy mb-1.5">
          {vi.eb15a.alignLabel} ({DEVICE_LABELS[device]})
        </label>
        <div className="grid grid-cols-4 gap-1">
          <button
            type="button"
            onClick={() => {
              const newAlign = { ...(targetStyle.align || {}) }
              delete newAlign[device]
              updateStyle({ align: newAlign })
            }}
            className={`py-1 text-[11px] font-ui rounded border transition ${
              !targetStyle.align?.[device]
                ? 'bg-deep-navy text-white border-deep-navy'
                : 'border-deep-navy/15 text-deep-navy hover:bg-deep-navy/5'
            }`}
          >
            {vi.eb15a.sizeInherit}
          </button>
          {(['left', 'center', 'right'] as const).map((al) => (
            <button
              key={al}
              type="button"
              onClick={() => {
                const newAlign = { ...(targetStyle.align || {}) }
                newAlign[device] = al
                updateStyle({ align: newAlign })
              }}
              title={
                al === 'left'
                  ? vi.eb15a.alignLeft
                  : al === 'center'
                    ? vi.eb15a.alignCenter
                    : vi.eb15a.alignRight
              }
              className={`py-1 flex items-center justify-center rounded border transition ${
                targetStyle.align?.[device] === al
                  ? 'bg-deep-navy text-white border-deep-navy'
                  : 'border-deep-navy/15 text-deep-navy hover:bg-deep-navy/5'
              }`}
            >
              {ALIGN_ICONS[al]}
            </button>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-deep-navy/10 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleReset}
          className="px-2.5 py-1 text-[11px] font-ui font-semibold text-bright-magenta hover:bg-soft-pink/50 rounded transition"
        >
          {vi.eb15a.resetButton}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1 text-[11px] font-ui font-semibold bg-deep-navy text-white hover:bg-deep-navy/90 rounded transition shadow-sm"
        >
          {vi.eb15a.closeButton}
        </button>
      </div>
    </div>
  )
}
