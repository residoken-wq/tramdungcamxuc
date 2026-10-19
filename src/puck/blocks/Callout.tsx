import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { Callout, type CalloutProps } from '@/components/site/Callout'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { createPageExternalField } from '../page-field'

export type { CalloutProps }

export const CalloutBlock: ComponentConfig<CalloutProps> = {
  label: 'Khối Điểm Nhấn Nền Tối (Callout)',
  fields: {
    title: {
      type: 'text',
      label: 'Tiêu đề nổi bật (Montserrat Bold)',
    },
    description: {
      type: 'textarea',
      label: 'Mô tả thông điệp',
    },
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
  render: (props) => <Callout {...props} />,
}
