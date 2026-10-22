import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { PackageCards, type PackageCardsProps } from '@/components/site/PackageCards'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { createProductExternalField } from '../product-field'
import { createPageExternalField } from '../page-field'

export type { PackageCardsProps }

export const PackageCardsBlock: ComponentConfig<PackageCardsProps> = {
  label: 'Khối các gói Growth Mirror (Package Cards)',
  fields: {
    seriesLabel: { type: 'text', label: 'Nhãn series (trên cùng)' },
    titleLine1: { type: 'text', label: 'Tiêu đề dòng 1 (Xanh thẫm / Deep Navy)' },
    titleLine2: { type: 'text', label: 'Tiêu đề dòng 2 (Hồng sen / Bright Magenta)' },
    emotionLine: { type: 'textarea', label: 'Dòng cảm xúc (Playfair Display Italic)' },
    description: { type: 'textarea', label: 'Mô tả ngắn gọn dưới tiêu đề' },
    packages: {
      type: 'array',
      label: 'Danh sách gói đồng hành (Tối đa 3 gói)',
      max: 3,
      arrayFields: {
        packageId: createProductExternalField({
          label: 'Chọn gói đồng hành (Growth Mirror)',
          filterType: 'package',
        }),
      },
      getItemSummary: (item) => (item?.packageId ? `Gói ID: ${item.packageId}` : 'Chưa chọn'),
    },
    style: {
      type: 'select',
      label: 'Kiểu hiển thị đầu thẻ',
      options: [
        { label: 'Biểu tượng (Icon)', value: 'icon' },
        { label: 'Đánh số thứ tự (01, 02, 03)', value: 'numbered' },
      ],
    },
    highlightPackageId: createProductExternalField({
      label: 'Gói nổi bật (Tùy chọn viền / bóng nhấn)',
      filterType: 'package',
    }),
    buttonText: {
      type: 'text',
      label: 'Chữ trên nút hành động dưới khối (Tùy chọn)',
    },
    buttonLinkType: {
      type: 'select',
      label: 'Loại liên kết nút',
      options: [
        { label: 'Liên kết ngoài / Tự nhập URL', value: 'url' },
        { label: 'Trang trong website', value: 'page' },
      ],
    },
    buttonPageId: createPageExternalField({
      label: 'Chọn trang trong website',
    }),
    buttonLink: {
      type: 'text',
      label: 'Đường dẫn liên kết (khi chọn Tự nhập URL)',
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
    seriesLabel: '[MẪU] Lộ trình đặc biệt',
    titleLine1: '[MẪU] 3 CỘT MỐC',
    titleLine2: '[MẪU] CHUYỂN MÌNH',
    emotionLine: '[MẪU] Đi cùng nhau để từng bước đi trở nên vững chãi và an tâm',
    description: '',
    packages: [],
    style: 'icon',
    highlightPackageId: '',
    buttonText: '[MẪU] Khám phá chi tiết lộ trình',
    buttonLinkType: 'url',
    buttonLink: '#',
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: ({ puck: _puck, ...props }) => <PackageCards {...props} />,
}
