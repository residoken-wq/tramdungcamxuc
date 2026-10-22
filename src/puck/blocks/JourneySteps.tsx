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
  label: 'Hành trình các bước chuyển hóa (Journey Steps)',
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
    columns: {
      type: 'select',
      label: 'Số cột hiển thị (Desktop: Circles / Cards)',
      options: [
        { label: '3 cột', value: 3 },
        { label: '4 cột', value: 4 },
        { label: '5 cột (Mặc định)', value: 5 },
        { label: '6 cột', value: 6 },
      ],
    },
    steps: {
      type: 'slot',
      label: 'Các bước hành trình',
      allow: ['Step'],
    },
    seriesLabel: { type: 'text', label: 'Nhãn series (trên cùng)' },
    titleLine1: { type: 'text', label: 'Tiêu đề dòng 1 (Xanh thẫm / Deep Navy)' },
    titleLine2: { type: 'text', label: 'Tiêu đề dòng 2 (Hồng sen / Bright Magenta)' },
    emotionLine: { type: 'textarea', label: 'Dòng cảm xúc (Playfair Display Italic)' },
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
    variant: 'circles',
    columns: 5,
    seriesLabel: '[MẪU] 5 Bước chuyển hóa',
    titleLine1: '[MẪU] HÀNH TRÌNH THẤU HIỂU',
    titleLine2: '[MẪU] VÀ LÀM CHỦ CẢM XÚC',
    emotionLine:
      '[MẪU] Từng bước chậm rãi để kết nối lại với chính mình và nuôi dưỡng sự bình an nội tại.',
    steps: FIXED_JOURNEY_STEPS.map((fixed, index) => ({
      type: 'Step',
      props: {
        id: `step-default-${index + 1}`,
        name: fixed.name,
        subname: fixed.subname,
        subtitle: '',
        description: fixed.defaultDesc,
        highlight: false,
        nameColor: 'deep-navy',
        nameSize: 'md',
        descColor: 'deep-navy',
        descSize: 'md',
        align: 'left',
      },
    })),
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: (props) => <JourneySteps {...props} />,
}
