import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { ContactInfo, type ContactInfoProps } from '@/components/site/ContactInfo'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'

export type { ContactInfoProps }

export const ContactInfoBlock: ComponentConfig<ContactInfoProps> = {
  label: 'Thông tin liên hệ (Contact Info)',
  fields: {
    seriesLabel: {
      type: 'text',
      label: 'Nhãn series (trên cùng)',
    },
    titleLine1: {
      type: 'text',
      label: 'Tiêu đề dòng 1 (Xanh thẫm / Deep Navy)',
    },
    titleLine2: {
      type: 'text',
      label: 'Tiêu đề dòng 2 (Hồng sen / Bright Magenta)',
    },
    emotionLine: {
      type: 'textarea',
      label: 'Dòng cảm xúc (Playfair Display Italic, tùy chọn)',
    },
    showEmail: {
      type: 'select',
      label: 'Hiển thị Email liên hệ (từ Cài đặt website)',
      options: [
        { label: 'Hiển thị', value: true },
        { label: 'Ẩn', value: false },
      ],
    },
    showHotline: {
      type: 'select',
      label: 'Hiển thị Hotline / Zalo (từ Cài đặt website)',
      options: [
        { label: 'Hiển thị', value: true },
        { label: 'Ẩn', value: false },
      ],
    },
    showOfficeAddress: {
      type: 'select',
      label: 'Hiển thị Địa điểm văn phòng (từ Cài đặt website)',
      options: [
        { label: 'Hiển thị', value: true },
        { label: 'Ẩn', value: false },
      ],
    },
    showSocial: {
      type: 'select',
      label: 'Hiển thị Kênh mạng xã hội (từ Cài đặt website)',
      options: [
        { label: 'Hiển thị', value: true },
        { label: 'Ẩn', value: false },
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
    seriesLabel: '[MẪU] THÔNG TIN LIÊN HỆ',
    titleLine1: '[MẪU] KẾT NỐI VỚI TRẠM',
    titleLine2: '[MẪU] LẮNG NGHE VÀ ĐỒNG HÀNH',
    emotionLine:
      '[MẪU] Mọi chia sẻ của bạn đều được đón nhận bằng sự thấu cảm, tôn trọng và trọn vẹn yêu thương.',
    showEmail: true,
    showHotline: true,
    showOfficeAddress: true,
    showSocial: true,
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: ({ puck, ...props }) => (
    <ContactInfo {...props} puck={{ isEditing: puck?.isEditing ?? false }} />
  ),
}
