import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { VisionMission, type VisionMissionProps } from '@/components/site/VisionMission'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { BRAND_ICONS } from '@/lib/brand/icons'

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
    },
    titleLine2: {
      type: 'text',
      label: 'Tiêu đề dòng 2 (Hồng sen / Bright Magenta)',
    },
    quote: {
      type: 'textarea',
      label: 'Câu trích dẫn ở giữa (Playfair Display Italic, tùy chọn)',
    },
    visionTitle: {
      type: 'text',
      label: 'Tiêu đề thẻ Tầm nhìn',
    },
    visionContent: {
      type: 'textarea',
      label: 'Nội dung thẻ Tầm nhìn (các đoạn phân tách bằng 2 lần xuống dòng)',
    },
    visionIcon: {
      type: 'select',
      label: 'Biểu tượng thẻ Tầm nhìn',
      options: BRAND_ICONS.map((i) => ({ label: `${i.label} (${i.value})`, value: i.value })),
    },
    missionTitle: {
      type: 'text',
      label: 'Tiêu đề thẻ Sứ mệnh',
    },
    missionContent: {
      type: 'textarea',
      label: 'Nội dung thẻ Sứ mệnh (các đoạn phân tách bằng 2 lần xuống dòng)',
    },
    missionIcon: {
      type: 'select',
      label: 'Biểu tượng thẻ Sứ mệnh',
      options: BRAND_ICONS.map((i) => ({ label: `${i.label} (${i.value})`, value: i.value })),
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
    seriesLabel: '[MẪU] ĐỊNH HƯỚNG TƯƠNG LAI',
    titleLine1: '[MẪU] TẦM NHÌN &',
    titleLine2: '[MẪU] SỨ MỆNH',
    quote: '[MẪU] Dừng lại để lắng nghe, thấu cảm để vững vàng bước tiếp.',
    visionTitle: '[MẪU] TẦM NHÌN',
    visionContent:
      '[MẪU] Trở thành điểm tựa tinh thần và người bạn đồng hành tin cậy cho hàng triệu người trẻ và tổ chức trên hành trình phát triển trí tuệ cảm xúc.',
    visionIcon: 'compass',
    missionTitle: '[MẪU] SỨ MỆNH',
    missionContent:
      '[MẪU] Giúp mỗi cá nhân nhận diện, gọi tên và chuyển hóa cảm xúc thành sức mạnh nội tại, kiến tạo cuộc sống an yên và sự nghiệp thăng hoa.',
    missionIcon: 'heart',
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: ({ puck: _puck, ...props }) => <VisionMission {...props} />,
}
