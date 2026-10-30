import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { PathCard, type PathCardProps } from '@/components/site/PathCard'
import { FONT_SIZE_OPTIONS, ALIGN_OPTIONS } from '../constants'
import { createPageExternalField } from '../page-field'
import { allowedTextColors, getChildRealBg } from '@/lib/brand/format-classes'

export type { PathCardProps }

function colorFields(realBg: string, titleLarge: boolean) {
  return {
    labelColor: {
      type: 'select' as const,
      label: 'Màu nhãn nhóm',
      options: allowedTextColors(realBg, false),
    },
    titleColor: {
      type: 'select' as const,
      label: 'Màu tiêu đề',
      options: allowedTextColors(realBg, titleLarge),
    },
    textColor: {
      type: 'select' as const,
      label: 'Màu mô tả',
      options: allowedTextColors(realBg, false),
    },
  }
}

/** Child block of TwoPathCards' `paths` slot (PK-08): one draggable path card. */
export const PathCardBlock: ComponentConfig<PathCardProps> = {
  label: 'Thẻ lối đi',
  permissions: {
    insert: false,
  },
  fields: {
    groupLabel: { type: 'text', label: 'Nhãn nhóm (VD: CHO CÁ NHÂN)', contentEditable: true },
    title: { type: 'text', label: 'Tiêu đề', contentEditable: true },
    description: { type: 'textarea', label: 'Đoạn văn mô tả', contentEditable: true },
    buttonLabel: { type: 'text', label: 'Chữ trên nút', contentEditable: true },
    linkType: {
      type: 'select',
      label: 'Loại liên kết',
      options: [
        { label: 'Liên kết ngoài / Tự nhập URL', value: 'url' },
        { label: 'Trang trong website', value: 'page' },
      ],
    },
    pageId: createPageExternalField({ label: 'Chọn trang trong website' }),
    href: { type: 'text', label: 'Đường dẫn liên kết (khi chọn Tự nhập URL)' },
    buttonStyle: {
      type: 'select',
      label: 'Kiểu nút bấm',
      options: [
        { label: 'Màu khối nổi bật (Solid / Primary)', value: 'solid' },
        { label: 'Viền nét thanh thoát (Outline / Ghost)', value: 'outline' },
      ],
    },
    ...colorFields('white', false),
    titleSize: { type: 'select', label: 'Cỡ chữ tiêu đề', options: [...FONT_SIZE_OPTIONS] },
    textSize: { type: 'select', label: 'Cỡ chữ mô tả', options: [...FONT_SIZE_OPTIONS] },
    align: { type: 'select', label: 'Căn lề', options: [...ALIGN_OPTIONS] },
  },
  defaultProps: {
    version: 1,
    groupLabel: '[MẪU] CHO CÁ NHÂN',
    title: '[MẪU] TIÊU ĐỀ LỐI ĐI',
    description: '[MẪU] Mô tả ngắn gọn về lối đi này',
    buttonLabel: '[MẪU] Khám phá',
    linkType: 'url',
    pageId: '',
    href: '#',
    buttonStyle: 'solid',
    labelColor: 'deep-navy',
    titleColor: 'deep-navy',
    textColor: 'deep-navy',
    titleSize: 'md',
    textSize: 'md',
    align: 'left',
  },
  resolveFields: (data, params) => {
    // Cards sit on white (navy section → navy): offer only colours that pass WCAG AA there.
    const realBg = getChildRealBg(params?.parent, { cardStyle: 'white' })
    return { ...params.fields, ...colorFields(realBg, data.props?.titleSize === 'lg') }
  },
  render: ({ puck: _puck, ...props }) => <PathCard {...props} />,
}
