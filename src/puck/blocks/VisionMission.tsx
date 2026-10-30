import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { VisionMission, type VisionMissionProps } from '@/components/site/VisionMission'
import { BRAND_COLOR_OPTIONS, FONT_SIZE_OPTIONS, PADDING_OPTIONS } from '../constants'

export type { VisionMissionProps }

export const VisionMissionBlock: ComponentConfig<VisionMissionProps> = {
  label: 'Tầm nhìn & Sứ mệnh (Vision & Mission)',
  fields: {
    seriesLabel: {
      type: 'text',
      label: 'Nhãn series (Tùy chọn)',
    },
    titleLine1: {
      type: 'text',
      label: 'Tiêu đề dòng 1 (Xanh thẫm / Deep Navy)',
      contentEditable: true,
    },
    titleLine2: {
      type: 'text',
      label: 'Tiêu đề dòng 2 (Hồng sen / Bright Magenta)',
      contentEditable: true,
    },
    quote: {
      type: 'textarea',
      label: 'Câu trích dẫn ở giữa (Playfair Display Italic, tùy chọn)',
      contentEditable: true,
    },
    titleSize: {
      type: 'select',
      label: 'Cỡ chữ tiêu đề',
      options: [...FONT_SIZE_OPTIONS],
    },
    cards: {
      type: 'slot',
      label: 'Các thẻ (kéo thả để đổi thứ tự)',
      allow: ['VisionCard'],
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
    seriesLabel: '[MẪU] ĐỊNH HƯỚNG TƯƠNG LAI',
    titleLine1: '[MẪU] TẦM NHÌN &',
    titleLine2: '[MẪU] SỨ MỆNH',
    quote: '[MẪU] Dừng lại để lắng nghe, thấu cảm để vững vàng bước tiếp.',
    titleSize: 'md',
    cards: [
      {
        type: 'VisionCard',
        props: {
          version: 1,
          icon: 'compass',
          title: '[MẪU] TẦM NHÌN',
          content:
            '[MẪU] Trở thành điểm tựa tinh thần và người bạn đồng hành tin cậy cho hàng triệu người trẻ và tổ chức trên hành trình phát triển trí tuệ cảm xúc.',
          titleColor: 'deep-navy',
          textColor: 'deep-navy',
          titleSize: 'md',
          textSize: 'md',
          align: 'left',
        },
      },
      {
        type: 'VisionCard',
        props: {
          version: 1,
          icon: 'heart',
          title: '[MẪU] SỨ MỆNH',
          content:
            '[MẪU] Giúp mỗi cá nhân nhận diện, gọi tên và chuyển hóa cảm xúc thành sức mạnh nội tại, kiến tạo cuộc sống an yên và sự nghiệp thăng hoa.',
          titleColor: 'deep-navy',
          textColor: 'deep-navy',
          titleSize: 'md',
          textSize: 'md',
          align: 'left',
        },
      },
    ],
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: ({ puck: _puck, ...props }) => <VisionMission {...props} />,
}
