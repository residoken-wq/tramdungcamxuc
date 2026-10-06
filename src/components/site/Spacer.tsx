import React from 'react'

export type SpacerHeight = 16 | 24 | 32 | 48 | 64

export interface SpacerProps {
  version?: number
  height?: SpacerHeight | number | string
}

const HEIGHT_CLASSES: Record<number, string> = {
  16: 'h-4',
  24: 'h-6',
  32: 'h-8',
  48: 'h-12',
  64: 'h-16',
}

export function Spacer({ height = 32 }: SpacerProps) {
  const num = Number(height)
  const validHeight = [16, 24, 32, 48, 64].includes(num) ? num : 32
  const heightClass = HEIGHT_CLASSES[validHeight]

  return <div className={`w-full ${heightClass}`} aria-hidden="true" />
}
