import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { PackageCards, type PackageCardsProps } from '@/components/site/PackageCards'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS, GRID_CARD_ALIGN_OPTIONS } from '../constants'
import { createPageExternalField } from '../page-field'
import { vi } from '@/lib/i18n/vi'

export type { PackageCardsProps }

export const PackageCardsBlock: ComponentConfig<PackageCardsProps> = {
  label: 'Khối các gói Growth Mirror (Package Cards)',
  fields: {
    seriesLabel: { type: 'text', label: vi.eb15a?.seriesLabel || 'Nhãn series' },
    titleLine1: { type: 'text', label: vi.eb15a?.titleLine1 || 'Tiêu đề dòng 1' },
    titleLine2: { type: 'text', label: vi.eb15a?.titleLine2 || 'Tiêu đề dòng 2' },
    emotionLine: { type: 'textarea', label: vi.eb15a?.emotionLine || 'Dòng cảm xúc' },
    description: {
      type: 'textarea',
      label: vi.eb15a?.description || 'Mô tả ngắn gọn dưới tiêu đề',
    },
    cardAlign: {
      type: 'select',
      label: vi.eb15b?.gridCardAlign || 'Căn lề tất cả thẻ',
      options: [...GRID_CARD_ALIGN_OPTIONS],
    },
    cards: {
      type: 'slot',
      label: 'Danh sách gói đồng hành',
      allow: ['PackageCard'],
    },
    style: {
      type: 'select',
      label: 'Kiểu hiển thị đầu thẻ',
      options: [
        { label: 'Biểu tượng (Icon)', value: 'icon' },
        { label: 'Đánh số thứ tự (01, 02, 03)', value: 'numbered' },
      ],
    },
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
    version: 2,
    seriesLabel: '[MẪU] Lộ trình đặc biệt',
    titleLine1: '[MẪU] 3 CỘT MỐC',
    titleLine2: '[MẪU] CHUYỂN MÌNH',
    emotionLine: '[MẪU] Đi cùng nhau để từng bước đi trở nên vững chãi và an tâm',
    description: '',
    cards: [],
    style: 'icon',
    cardAlign: 'inherit',
    buttonText: '[MẪU] Khám phá chi tiết lộ trình',
    buttonLinkType: 'url',
    buttonLink: '#',
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  // PK-14c: keep `puck` out (as before PK-14) so the builder renders the block exactly like the
  // public page (v1 packages resolve their names); only the empty-slot hint knows it is editing.
  render: ({ puck, ...props }) => (
    <PackageCards {...props} _editingHint={Boolean(puck?.isEditing)} />
  ),
}
