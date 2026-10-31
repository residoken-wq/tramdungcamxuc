import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { PackageCardItem, type PackageCardItemProps } from '@/components/site/PackageCardItem'
import { FONT_SIZE_OPTIONS, ALIGN_OPTIONS } from '../constants'
import { allowedTextColors, getChildRealBg } from '@/lib/brand/format-classes'
import { createProductExternalField } from '../product-field'
import { vi } from '@/lib/i18n/vi'

export type { PackageCardItemProps as PackageCardProps }

export const PackageCardBlock: ComponentConfig<PackageCardItemProps> = {
  label: vi.puckPackageCard?.label || 'Thẻ gói',
  fields: {
    packageId: createProductExternalField({
      label: vi.puckPackageCard?.packageId || 'Chọn gói đồng hành (Growth Mirror)',
      filterType: 'package',
    }),
    highlight: {
      type: 'select',
      label: vi.puckPackageCard?.highlight || 'Gói nổi bật (Viền / bóng nhấn)',
      options: [
        { label: 'Không (Mặc định)', value: false },
        { label: 'Có (Gói nổi bật)', value: true },
      ],
    },
    nameColor: {
      type: 'select',
      label: vi.puckPackageCard?.nameColor || 'Màu tên gói',
      options: allowedTextColors('white', true),
    },
    nameSize: {
      type: 'select',
      label: vi.puckPackageCard?.nameSize || 'Cỡ tên gói',
      options: [...FONT_SIZE_OPTIONS],
    },
    textColor: {
      type: 'select',
      label: vi.puckPackageCard?.textColor || 'Màu nội dung mô tả',
      options: allowedTextColors('white', false),
    },
    textSize: {
      type: 'select',
      label: vi.puckPackageCard?.textSize || 'Cỡ nội dung mô tả',
      options: [...FONT_SIZE_OPTIONS],
    },
    align: {
      type: 'select',
      label: vi.puckPackageCard?.align || 'Căn lề',
      options: [...ALIGN_OPTIONS],
    },
  },
  defaultProps: {
    version: 1,
    packageId: '',
    highlight: false,
    nameColor: 'deep-navy',
    nameSize: 'md',
    textColor: 'deep-navy',
    textSize: 'md',
    align: 'left',
  },
  resolveFields: (data, params) => {
    // Package card background stays white (or white/15 on navy section) even when highlighted
    const realBg = getChildRealBg(params?.parent)
    const isNameLarge = true
    const nameColors = allowedTextColors(realBg, isNameLarge)
    const isTextLarge = data?.props?.textSize === 'lg'
    const textColors = allowedTextColors(realBg, isTextLarge)

    return {
      ...params.fields,
      nameColor: {
        type: 'select',
        label: vi.puckPackageCard?.nameColor || 'Màu tên gói',
        options: nameColors,
      },
      textColor: {
        type: 'select',
        label: vi.puckPackageCard?.textColor || 'Màu nội dung mô tả',
        options: textColors,
      },
    }
  },
  render: (props) => <PackageCardItem {...props} />,
}
