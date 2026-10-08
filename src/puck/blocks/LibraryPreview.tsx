import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import {
  LibraryPreview,
  type LibraryPreviewProps,
  type LibraryPreviewItem,
} from '@/components/site/LibraryPreview'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'

export interface LibraryPreviewBlockProps extends Omit<LibraryPreviewProps, 'items'> {
  _resolved?: {
    items?: LibraryPreviewItem[] | null
  }
}

export const LibraryPreviewBlock: ComponentConfig<LibraryPreviewBlockProps> = {
  label: 'Xem trước Thư viện (Library Preview)',
  fields: {
    seriesLabel: { type: 'text', label: 'Nhãn series (trên cùng)' },
    titleLine1: { type: 'text', label: 'Tiêu đề dòng 1 (Xanh thẫm / Deep Navy)' },
    titleLine2: { type: 'text', label: 'Tiêu đề dòng 2 (Hồng sen / Bright Magenta)' },
    emotionLine: { type: 'textarea', label: 'Dòng cảm xúc (Playfair Display Italic)' },
    tab: {
      type: 'select',
      label: 'Tab hiển thị',
      options: [
        { label: 'Khóa học (khoa-hoc)', value: 'khoa-hoc' },
        { label: 'Nội dung / Bài viết / Video (noi-dung)', value: 'noi-dung' },
      ],
    },
    limit: {
      type: 'select',
      label: 'Số lượng mục hiển thị',
      options: [
        { label: '3 mục', value: 3 },
        { label: '4 mục', value: 4 },
        { label: '6 mục', value: 6 },
      ],
    },
    bgColor: {
      type: 'select',
      label: 'Màu nền',
      options: [...BRAND_COLOR_OPTIONS],
    },
    padding: {
      type: 'select',
      label: 'Khoảng đệm (Padding)',
      options: [...PADDING_OPTIONS],
    },
  },
  defaultProps: {
    version: 1,
    seriesLabel: '[MẪU] Khám phá tri thức',
    titleLine1: '[MẪU] THƯ VIỆN',
    titleLine2: '[MẪU] CẢM XÚC & BÀI HỌC',
    emotionLine: '[MẪU] Những tài nguyên, bài học và công cụ được đúc kết từ thực tiễn.',
    tab: 'khoa-hoc',
    limit: 3,
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: ({ puck, _resolved, ...props }) => (
    <LibraryPreview
      {...props}
      items={_resolved?.items}
      puck={{ isEditing: puck?.isEditing ?? false }}
    />
  ),
}
