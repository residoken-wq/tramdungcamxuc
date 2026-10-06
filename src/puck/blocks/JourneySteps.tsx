import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import {
  JourneySteps,
  type JourneyStepsProps,
  FIXED_JOURNEY_STEPS,
} from '@/components/site/JourneySteps'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'

export type { JourneyStepsProps }

export const JourneyStepsBlock: ComponentConfig<JourneyStepsProps> = {
  label: 'Hành trình 5 Bước Chuyển hóa (Journey Steps)',
  fields: {
    seriesLabel: { type: 'text', label: 'Nhãn series (trên cùng)' },
    titleLine1: { type: 'text', label: 'Tiêu đề dòng 1 (Xanh thẫm / Deep Navy)' },
    titleLine2: { type: 'text', label: 'Tiêu đề dòng 2 (Hồng sen / Bright Magenta)' },
    emotionLine: { type: 'textarea', label: 'Dòng cảm xúc (Playfair Display Italic)' },
    step1Description: {
      type: 'textarea',
      label: 'Mô tả Bước 1: Pause (Dừng lại)',
    },
    step2Description: {
      type: 'textarea',
      label: 'Mô tả Bước 2: Feel (Cảm nhận)',
    },
    step3Description: {
      type: 'textarea',
      label: 'Mô tả Bước 3: Name (Gọi tên)',
    },
    step4Description: {
      type: 'textarea',
      label: 'Mô tả Bước 4: Choose (Lựa chọn)',
    },
    step5Description: {
      type: 'textarea',
      label: 'Mô tả Bước 5: Practice (Thực hành)',
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
    seriesLabel: '[MẪU] 5 Bước chuyển hóa',
    titleLine1: '[MẪU] HÀNH TRÌNH THẤU HIỂU',
    titleLine2: '[MẪU] VÀ LÀM CHỦ CẢM XÚC',
    emotionLine:
      '[MẪU] Từng bước chậm rãi để kết nối lại với chính mình và nuôi dưỡng sự bình an nội tại.',
    step1Description: FIXED_JOURNEY_STEPS[0].defaultDesc,
    step2Description: FIXED_JOURNEY_STEPS[1].defaultDesc,
    step3Description: FIXED_JOURNEY_STEPS[2].defaultDesc,
    step4Description: FIXED_JOURNEY_STEPS[3].defaultDesc,
    step5Description: FIXED_JOURNEY_STEPS[4].defaultDesc,
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: (props) => <JourneySteps {...props} />,
}
