import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { HeroEntryCard, type HeroEntryCardProps } from '@/components/site/HeroEntryCard'
import { FONT_SIZE_OPTIONS, ALIGN_OPTIONS } from '../constants'
import { allowedTextColors, getChildRealBg } from '@/lib/brand/format-classes'

export type { HeroEntryCardProps as EntryCardProps }

/** Child block of HeroTwoEntries' `entries` slot (PK-08): one draggable entry card. */
export const EntryCardBlock: ComponentConfig<HeroEntryCardProps> = {
  label: 'Thẻ lối vào',
  permissions: {
    insert: false,
  },
  fields: {
    // Sidebar only: inline editing turns even an empty label into an element, which would hide
    // the badge `label` fallback in the editor while the public page shows it.
    groupLabel: { type: 'text', label: 'Nhãn nhóm (VD: CHO CÁ NHÂN)' },
    label: { type: 'text', label: 'Nhãn lối vào (hiện khi không có nhãn nhóm)' },
    description: { type: 'textarea', label: 'Mô tả ngắn', contentEditable: true },
    buttonText: { type: 'text', label: 'Chữ trên nút', contentEditable: true },
    buttonLink: { type: 'text', label: 'Đường dẫn liên kết' },
    buttonStyle: {
      type: 'select',
      label: 'Kiểu nút',
      options: [
        { label: 'Nút đặc (Solid)', value: 'solid' },
        { label: 'Nút viền (Outline)', value: 'outline' },
      ],
    },
    badgeColor: {
      type: 'select',
      label: 'Màu huy hiệu nhãn',
      options: [
        { label: 'Hồng phấn (Soft Pink)', value: 'soft-pink' },
        { label: 'Tím oải hương (Lavender Mist)', value: 'lavender-mist' },
      ],
    },
    labelColor: {
      type: 'select',
      label: 'Màu nhãn nhóm',
      options: allowedTextColors('white', false),
    },
    textColor: {
      type: 'select',
      label: 'Màu mô tả',
      options: allowedTextColors('white', false),
    },
    labelSize: { type: 'select', label: 'Cỡ chữ nhãn', options: [...FONT_SIZE_OPTIONS] },
    textSize: { type: 'select', label: 'Cỡ chữ mô tả', options: [...FONT_SIZE_OPTIONS] },
    align: { type: 'select', label: 'Căn lề', options: [...ALIGN_OPTIONS] },
  },
  defaultProps: {
    version: 1,
    groupLabel: '[MẪU] CHO CÁ NHÂN',
    label: '',
    description: '[MẪU] Mô tả ngắn gọn về lối vào',
    buttonText: '[MẪU] Khám phá ngay',
    buttonLink: '#',
    buttonStyle: 'solid',
    badgeColor: 'soft-pink',
    labelColor: 'deep-navy',
    textColor: 'deep-navy',
    labelSize: 'md',
    textSize: 'md',
    align: 'left',
  },
  resolveFields: (data, params) => {
    // Cards sit on white (navy section → navy): offer only colours that pass WCAG AA there.
    const realBg = getChildRealBg(params?.parent, { cardStyle: 'white' })
    return {
      ...params.fields,
      labelColor: {
        type: 'select',
        label: 'Màu nhãn nhóm',
        options: allowedTextColors(realBg, false),
      },
      textColor: {
        type: 'select',
        label: 'Màu mô tả',
        options: allowedTextColors(realBg, false),
      },
    }
  },
  render: ({ puck: _puck, ...props }) => <HeroEntryCard {...props} />,
}
