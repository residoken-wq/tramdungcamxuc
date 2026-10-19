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
    variant: {
      type: 'select',
      label: 'Kiểu hiển thị',
      options: [
        { label: 'Vòng tròn tiêu chuẩn (Circles - Mặc định)', value: 'circles' },
        { label: 'Thẻ nối nét đứt ngang (Cards)', value: 'cards' },
        { label: 'Danh sách dọc có số (List)', value: 'list' },
      ],
    },
    highlightStep: {
      type: 'select',
      label: 'Bước nổi bật (Nền xanh thẫm Deep Navy)',
      options: [
        { label: 'Không có (0)', value: 0 },
        { label: 'Bước 1: Pause', value: 1 },
        { label: 'Bước 2: Feel', value: 2 },
        { label: 'Bước 3: Name', value: 3 },
        { label: 'Bước 4: Choose', value: 4 },
        { label: 'Bước 5: Practice', value: 5 },
      ],
    },
    seriesLabel: { type: 'text', label: 'Nhãn series (trên cùng)' },
    titleLine1: { type: 'text', label: 'Tiêu đề dòng 1 (Xanh thẫm / Deep Navy)' },
    titleLine2: { type: 'text', label: 'Tiêu đề dòng 2 (Hồng sen / Bright Magenta)' },
    emotionLine: { type: 'textarea', label: 'Dòng cảm xúc (Playfair Display Italic)' },
    step1Subtitle: {
      type: 'text',
      label: 'Dòng phụ Bước 1 (tùy chọn)',
    },
    step1Description: {
      type: 'textarea',
      label: 'Mô tả Bước 1: Pause (Dừng lại)',
    },
    step2Subtitle: {
      type: 'text',
      label: 'Dòng phụ Bước 2 (tùy chọn)',
    },
    step2Description: {
      type: 'textarea',
      label: 'Mô tả Bước 2: Feel (Cảm nhận)',
    },
    step3Subtitle: {
      type: 'text',
      label: 'Dòng phụ Bước 3 (tùy chọn)',
    },
    step3Description: {
      type: 'textarea',
      label: 'Mô tả Bước 3: Name (Gọi tên)',
    },
    step4Subtitle: {
      type: 'text',
      label: 'Dòng phụ Bước 4 (tùy chọn)',
    },
    step4Description: {
      type: 'textarea',
      label: 'Mô tả Bước 4: Choose (Lựa chọn)',
    },
    step5Subtitle: {
      type: 'text',
      label: 'Dòng phụ Bước 5 (tùy chọn)',
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
    version: 2,
    variant: 'circles',
    highlightStep: 0,
    seriesLabel: '[MẪU] 5 Bước chuyển hóa',
    titleLine1: '[MẪU] HÀNH TRÌNH THẤU HIỂU',
    titleLine2: '[MẪU] VÀ LÀM CHỦ CẢM XÚC',
    emotionLine:
      '[MẪU] Từng bước chậm rãi để kết nối lại với chính mình và nuôi dưỡng sự bình an nội tại.',
    step1Subtitle: '',
    step1Description: FIXED_JOURNEY_STEPS[0].defaultDesc,
    step2Subtitle: '',
    step2Description: FIXED_JOURNEY_STEPS[1].defaultDesc,
    step3Subtitle: '',
    step3Description: FIXED_JOURNEY_STEPS[2].defaultDesc,
    step4Subtitle: '',
    step4Description: FIXED_JOURNEY_STEPS[3].defaultDesc,
    step5Subtitle: '',
    step5Description: FIXED_JOURNEY_STEPS[4].defaultDesc,
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: ({ puck: _puck, ...props }) => <JourneySteps {...props} />,
}
