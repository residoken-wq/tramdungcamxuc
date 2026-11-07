import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { Callout, type CalloutProps } from '@/components/site/Callout'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { createPageExternalField } from '../page-field'
import { alignField, sizeField } from '../format-fields'
import { vi } from '@/lib/i18n/vi'

export type { CalloutProps }

export const CalloutBlock: ComponentConfig<CalloutProps> = {
  label: 'Khối Điểm Nhấn Nền Tối (Callout)',
  fields: {
    variant: {
      type: 'select',
      label: 'Kiểu hiển thị',
      options: [
        { label: 'Hộp nổi bật nền tối (Box)', value: 'box' },
        { label: 'Dải ghi chú mảnh (Strip)', value: 'strip' },
      ],
    },
    stripTone: {
      type: 'select',
      label: vi.pk26?.callout?.stripTone || 'Tông màu dải ghi chú',
      options: [
        {
          label: vi.pk26?.callout?.tones?.['soft-pink'] || 'Hồng phấn (Mặc định)',
          value: 'soft-pink',
        },
        {
          label: vi.pk26?.callout?.tones?.['lavender-mist'] || 'Tím sương (Lavender Mist)',
          value: 'lavender-mist',
        },
        { label: vi.pk26?.callout?.tones?.white || 'Trắng viền mảnh', value: 'white' },
        {
          label: vi.pk26?.callout?.tones?.dashed || 'Viền đứt hồng (Nền trong)',
          value: 'dashed',
        },
        {
          label: vi.pk26?.callout?.tones?.['deep-navy'] || 'Xanh thẫm (Deep Navy, chữ trắng)',
          value: 'deep-navy',
        },
      ],
    },
    title: {
      type: 'text',
      label: 'Tiêu đề nổi bật',
      contentEditable: true,
    },
    description: {
      type: 'textarea',
      label: 'Mô tả thông điệp',
      contentEditable: true,
    },
    titleSize: sizeField('Cỡ chữ tiêu đề'),
    textSize: sizeField('Cỡ chữ mô tả'),
    align: alignField(),
    showButton: {
      type: 'select',
      label: 'Hiển thị nút hành động',
      options: [
        { label: 'Có', value: true as never },
        { label: 'Không', value: false as never },
      ],
    },
    buttonText: {
      type: 'text',
      label: 'Chữ trên nút (Tùy chọn)',
      contentEditable: true,
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
    buttonVariant: {
      type: 'select',
      label: 'Kiểu nút',
      options: [
        { label: 'Chính (Hồng nhấn - Primary)', value: 'primary' },
        { label: 'Phụ (Secondary)', value: 'secondary' },
        { label: 'Viền mảnh (Ghost)', value: 'ghost' },
      ],
    },
    bgColor: {
      type: 'select',
      label: 'Màu nền ngoài',
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
    variant: 'box',
    stripTone: 'soft-pink',
    titleSize: 'md',
    textSize: 'md',
    align: 'center',
    title: '[MẪU] Bạn không cần phải tự mình đối diện với những rối bời cảm xúc',
    description:
      '[MẪU] Trạm Dừng Cảm Xúc luôn sẵn sàng đồng hành cùng bạn bằng những phương pháp khoa học, nhẹ nhàng và an toàn nhất.',
    showButton: true,
    buttonText: '[MẪU] Đặt phiên trải nghiệm 149.000đ',
    buttonLinkType: 'url',
    buttonPageId: '',
    buttonLink: '/dat-phien-trai-nghiem',
    buttonVariant: 'primary',
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: ({ puck, ...props }) => (
    <Callout {...props} puck={{ isEditing: puck?.isEditing ?? false }} />
  ),
}
