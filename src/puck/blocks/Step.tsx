import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { JourneyStep, type JourneyStepProps } from '@/components/site/JourneyStep'
import { FONT_SIZE_OPTIONS, ALIGN_OPTIONS } from '../constants'
import { allowedTextColors, getChildRealBg } from '@/lib/brand/format-classes'
import { vi } from '@/lib/i18n/vi'

export type { JourneyStepProps as StepProps }

export const StepBlock: ComponentConfig<JourneyStepProps> = {
  label: vi.puckStep?.label || 'Bước hành trình',
  permissions: {
    insert: false,
  },
  fields: {
    name: {
      type: 'text',
      label: vi.puckStep?.name || 'Tên bước (Ví dụ: Pause)',
      contentEditable: true,
    },
    subname: {
      type: 'text',
      label: vi.puckStep?.subname || 'Nhãn badge (Ví dụ: Dừng lại)',
      contentEditable: true,
    },
    subtitle: {
      type: 'text',
      label: vi.puckStep?.subtitle || 'Dòng phụ (Tùy chọn)',
      contentEditable: true,
    },
    description: {
      type: 'textarea',
      label: vi.puckStep?.description || 'Nội dung mô tả bước',
      contentEditable: true,
    },
    highlight: {
      type: 'select',
      label: vi.puckStep?.highlight || 'Bước nổi bật (Nền xanh thẫm Deep Navy)',
      options: [
        { label: 'Không (Mặc định)', value: false },
        { label: 'Có (Bước nổi bật - Nền Navy)', value: true },
      ],
    },
    nameColor: {
      type: 'select',
      label: vi.puckStep?.nameColor || 'Màu tên bước',
      options: allowedTextColors('warm-ivory', false),
    },
    nameSize: {
      type: 'select',
      label: vi.puckStep?.nameSize || 'Cỡ tên bước',
      options: [...FONT_SIZE_OPTIONS],
    },
    descColor: {
      type: 'select',
      label: vi.puckStep?.descColor || 'Màu mô tả',
      options: allowedTextColors('warm-ivory', false),
    },
    descSize: {
      type: 'select',
      label: vi.puckStep?.descSize || 'Cỡ mô tả',
      options: [...FONT_SIZE_OPTIONS],
    },
    align: {
      type: 'select',
      label: vi.puckStep?.align || 'Căn lề',
      options: [...ALIGN_OPTIONS],
    },
  },
  defaultProps: {
    version: 1,
    name: 'Pause',
    subname: 'Dừng lại',
    subtitle: '',
    description:
      '[MẪU] Tạo khoảng dừng cần thiết giữa kích hoạt và phản ứng, hít thở sâu để lấy lại sự hiện diện.',
    highlight: false,
    nameColor: 'deep-navy',
    nameSize: 'md',
    descColor: 'deep-navy',
    descSize: 'md',
    align: 'left',
  },
  resolveFields: (data, params) => {
    const isHighlight = Boolean(data?.props?.highlight)
    const realBg = getChildRealBg(params?.parent, { highlight: isHighlight })
    const isNameLarge = data?.props?.nameSize === 'lg'
    const nameColors = allowedTextColors(realBg, isNameLarge)
    const descColors = allowedTextColors(realBg, false)

    return {
      ...params.fields,
      nameColor: {
        type: 'select',
        label: vi.puckStep?.nameColor || 'Màu tên bước',
        options: nameColors,
      },
      descColor: {
        type: 'select',
        label: vi.puckStep?.descColor || 'Màu mô tả',
        options: descColors,
      },
    }
  },
  render: (props) => <JourneyStep {...props} />,
}
