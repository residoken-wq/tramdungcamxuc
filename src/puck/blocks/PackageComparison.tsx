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
    highlightPackageId: createProductExternalField({
      label: 'Gói nổi bật (Cột nền tối)',
      filterType: 'package',
    }),
    highlightLabel: {
      type: 'text',
      label: 'Nhãn gói nổi bật (Mặc định: Khuyên dùng)',
    },
    showPackageButtons: {
      type: 'select',
      label: 'Hiển thị nút đặt phiên trải nghiệm dưới mỗi cột',
      options: [
        { label: 'Tắt (Ẩn nút - Mặc định)', value: false as never },
        { label: 'Bật (Hiện nút)', value: true as never },
      ],
    },
    packageButtonText: {
      type: 'text',
      label: 'Chữ trên nút (Mặc định: Chọn gói này)',
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
    note: {
      type: 'textarea',
      label: 'Ghi chú dưới bảng gói',
    },
    showPaymentPolicyLink: {
      type: 'select',
      label: 'Hiện liên kết Chính sách giá – thanh toán',
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
    version: 3,
    packages: [],
    highlightPackageId: '',
    highlightLabel: '',
    showPackageButtons: false,
    packageButtonText: '',
    showTotalValue: true,
    showDiscountPercent: true,
    note: '[MẪU] Các gói đồng hành được thiết kế theo lộ trình cá nhân hóa.',
    showPaymentPolicyLink: true,
    bgColor: 'warm-ivory',
    padding: 'md',
  },

  // Pass only serialisable props: Puck's `puck` object holds functions that cannot cross into a client component.
  render: ({ puck, ...props }) => (
    <PackageComparison {...props} puck={{ isEditing: puck?.isEditing ?? false }} />
  ),
}
