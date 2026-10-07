import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { PackageComparison, type PackageComparisonProps } from '@/components/site/PackageComparison'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { createProductExternalField } from '../product-field'

export type { PackageComparisonProps }

export const PackageComparisonBlock: ComponentConfig<PackageComparisonProps> = {
  label: 'Bảng so sánh 3 gói Growth Mirror (Package Comparison)',
  fields: {
    packages: {
      type: 'array',
      label: 'Danh sách các gói so sánh (Tối đa 3 gói)',
      max: 3,
      arrayFields: {
        packageId: createProductExternalField({
          label: 'Chọn gói đồng hành',
          filterType: 'package',
        }),
      },
      getItemSummary: (item) => (item?.packageId ? `Gói ID: ${item.packageId}` : 'Chưa chọn'),
    },
    showTotalValue: {
      type: 'select',
      label: 'Hiển thị tổng giá trị gạch ngang',
      options: [
        { label: 'Bật (Hiển thị)', value: true },
        { label: 'Tắt (Ẩn)', value: false },
      ],
    },
    showDiscountPercent: {
      type: 'select',
      label: 'Hiển thị % ưu đãi',
      options: [
        { label: 'Bật (Hiển thị)', value: true },
        { label: 'Tắt (Ẩn)', value: false },
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
    packages: [],
    showTotalValue: true,
    showDiscountPercent: true,
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  // Pass only serialisable props: Puck's `puck` object holds functions that cannot cross into a client component.
  render: ({ puck, ...props }) => (
    <PackageComparison {...props} puck={{ isEditing: puck?.isEditing ?? false }} />
  ),
}
