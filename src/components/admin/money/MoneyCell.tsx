'use client'

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'
import { formatVnd } from '@/lib/format'

/** List-view cell for money fields: 1750000 -> `1.750.000đ`. */
export function MoneyCell({ cellData }: DefaultCellComponentProps) {
  return <span>{typeof cellData === 'number' ? formatVnd(cellData) : ''}</span>
}
