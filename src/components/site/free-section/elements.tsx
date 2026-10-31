import React from 'react'
import Image from 'next/image'
import { textColorClass, type TextColorOption } from '@/lib/brand/format-classes'
import {
  EMOTION_SIZES,
  HEADING_SIZES,
  LABEL_SIZES,
  PARAGRAPH_SIZES,
  pick,
  type ElementSize,
} from './sizes'

// Inline editing (Puck contentEditable) passes text props as React elements in the editor, so
// text props are ReactNode and never go through string operations except when they are strings.
type Text = React.ReactNode

/** `deep-navy` (the stored default) means "automatic": the section's own colour for its bg. */
function colorClass(color: TextColorOption | undefined, autoClass: string): string {
  return !color || color === 'deep-navy' ? autoClass : textColorClass(color)
}

export interface SeriesLabelElProps {
  version?: number
  text?: Text
  color?: TextColorOption
  size?: ElementSize
}

export function SeriesLabelEl({ text, color, size }: SeriesLabelElProps) {
  if (!text) return null
  const auto = 'text-bright-magenta group-data-[bg=deep-navy]/fs:text-soft-pink'
  return (
    <span
      className={`block font-ui font-bold uppercase tracking-widest ${pick(LABEL_SIZES, size)} ${colorClass(color, auto)}`}
    >
      {text}
    </span>
  )
}

export interface HeadingElProps {
  version?: number
  line1?: Text
  line2?: Text
  level?: 'h1' | 'h2' | 'h3'
  line1Color?: TextColorOption
  line2Color?: TextColorOption
  size?: ElementSize
}

export function HeadingEl({
  line1,
  line2,
  level = 'h2',
  line1Color,
  line2Color,
  size,
}: HeadingElProps) {
  if (!line1 && !line2) return null
  const Tag = level
  const line1Class = colorClass(
    line1Color,
    'text-deep-navy group-data-[bg=deep-navy]/fs:text-white',
  )
  // Line 2 defaults to bright-magenta (two-tone heading); on deep navy it becomes soft-pink.
  const line2Class =
    !line2Color || line2Color === 'bright-magenta'
      ? 'text-bright-magenta group-data-[bg=deep-navy]/fs:text-soft-pink'
      : colorClass(line2Color, 'text-deep-navy group-data-[bg=deep-navy]/fs:text-white')
  return (
    <Tag
      className={`font-display ${pick(HEADING_SIZES, size)} uppercase tracking-tight leading-[1.3]`}
    >
      {line1 ? <span className={line1Class}>{line1}</span> : null}
      {line1 && line2 ? ' ' : null}
      {line2 ? <span className={line2Class}>{line2}</span> : null}
    </Tag>
  )
}

export interface ParagraphElProps {
  version?: number
  content?: Text
  color?: TextColorOption
  size?: ElementSize
}

export function ParagraphEl({ content, color, size }: ParagraphElProps) {
  const paragraphs: Text[] =
    typeof content === 'string'
      ? content
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter(Boolean)
      : content
        ? [content]
        : []
  if (paragraphs.length === 0) return null
  const cls = `font-ui leading-relaxed ${pick(PARAGRAPH_SIZES, size)} ${colorClass(
    color,
    'text-deep-navy/80 group-data-[bg=deep-navy]/fs:text-white/90',
  )}`
  return (
    <div className="space-y-3">
      {paragraphs.map((p, idx) => (
        <p key={idx} className={cls}>
          {p}
        </p>
      ))}
    </div>
  )
}

export interface EmotionElProps {
  version?: number
  text?: Text
  color?: TextColorOption
  size?: ElementSize
}

export function EmotionEl({ text, color, size }: EmotionElProps) {
  if (!text) return null
  return (
    <p
      className={`font-quote italic leading-relaxed ${pick(EMOTION_SIZES, size)} ${colorClass(
        color,
        'text-deep-navy/85 group-data-[bg=deep-navy]/fs:text-white/90',
      )}`}
    >
      {text}
    </p>
  )
}

export interface ImageElProps {
  version?: number
  mediaId?: string | number
  imageUrl?: string
  imageAlt?: string
  width?: 'sm' | 'md' | 'lg' | 'full'
}

const IMAGE_WIDTHS = {
  sm: 'max-w-xs',
  md: 'max-w-md',
  lg: 'max-w-xl',
  full: 'max-w-full',
} as const

export function ImageEl({ imageUrl, imageAlt, width = 'full' }: ImageElProps) {
  // Brand rule: an image without alt text is never shown.
  if (!imageUrl || !imageAlt || imageAlt.trim().length === 0) return null
  return (
    <div
      className={`w-full ${IMAGE_WIDTHS[width] ?? IMAGE_WIDTHS.full} overflow-hidden rounded-card border border-deep-navy/10 shadow-soft group-data-[bg=deep-navy]/fs:border-white/20`}
    >
      <Image
        src={imageUrl}
        alt={imageAlt.trim()}
        width={1200}
        height={800}
        sizes="(max-width: 768px) 100vw, 600px"
        className="w-full h-auto object-cover"
      />
    </div>
  )
}
