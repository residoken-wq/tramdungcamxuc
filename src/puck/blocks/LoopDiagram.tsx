import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { LoopDiagram, type LoopDiagramProps } from '@/components/site/LoopDiagram'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { vi } from '@/lib/i18n/vi'

export type { LoopDiagramProps }

export const LoopDiagramBlock: ComponentConfig<LoopDiagramProps> = {
  label: vi.pk26?.loopDiagram?.label || 'Sơ đồ vòng lặp (Loop Diagram)',
  fields: {
    seriesLabel: {
      type: 'text',
      label: vi.eb15a?.seriesLabel || 'Nhãn series',
    },
    titleLine1: {
      type: 'text',
      label: vi.eb15a?.titleLine1 || 'Tiêu đề dòng 1',
    },
    titleLine2: {
      type: 'text',
      label: vi.eb15a?.titleLine2 || 'Tiêu đề dòng 2',
    },
    emotionLine: {
      type: 'textarea',
      label: vi.eb15a?.emotionLine || 'Dòng cảm xúc',
    },
    titleCase: {
      type: 'select',
      label: 'Kiểu chữ tiêu đề',
      options: [
        { label: 'Chữ in hoa (UPPERCASE)', value: 'upper' },
        { label: 'Giữ nguyên chữ thường (Title case)', value: 'none' },
      ],
    },
    showAccentBar: {
      type: 'radio',
      label: 'Vạch hồng gạch dưới tiêu đề',
      options: [
        { label: 'Không', value: false },
        { label: 'Có', value: true },
      ],
    },
    centerText: {
      type: 'textarea',
      label: vi.pk26?.loopDiagram?.centerText || 'Thông điệp trung tâm (chữ nghiêng)',
    },
    rightTitle: {
      type: 'text',
      label: 'Tiêu đề cột phải',
    },
    rightItems: {
      type: 'array',
      label: 'Danh sách mục cột phải (có huy hiệu / pill)',
      getItemSummary: (item: { pill?: string }) => item?.pill || 'Mục',
      arrayFields: {
        pill: { type: 'text', label: 'Tên huy hiệu (VD: Workshop, 28 ngày)' },
        pillStyle: {
          type: 'select',
          label: 'Kiểu huy hiệu',
          options: [
            { label: 'Nền tím sương (Lavender)', value: 'solid' },
            { label: 'Viền đen nét mảnh (Outline)', value: 'outline' },
          ],
        },
        text: { type: 'textarea', label: 'Mô tả nội dung' },
      },
    },
    bottomQuote: {
      type: 'textarea',
      label: 'Dòng đúc kết nghiêng cuối (Playfair Display)',
    },
    nodes: {
      type: 'array',
      label: vi.pk26?.loopDiagram?.nodes || 'Danh sách các nút vòng lặp',
      getItemSummary: (node: { label?: string }) => node?.label || 'Nút',
      arrayFields: {
        label: {
          type: 'text',
          label: vi.pk26?.loopDiagram?.nodeLabel || 'Tên nút (VD: 01 · Nhận diện vấn đề)',
        },
      },
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
    seriesLabel: '[MẪU] 06 · NGUYÊN LÝ THIẾT KẾ',
    titleLine1: '[MẪU] MỘT VÒNG LẶP CHO MỌI KỸ NĂNG',
    titleLine2: '',
    emotionLine: '',
    centerText: '[MẪU] Hiểu mình và tự tin hơn qua từng trải nghiệm',
    nodes: [
      { label: '[MẪU] 01 · Nhận diện vấn đề' },
      { label: '[MẪU] 02 · Hiểu rõ phương pháp' },
      { label: '[MẪU] 03 · Hướng dẫn' },
      { label: '[MẪU] 04 · Thử nghiệm' },
      { label: '[MẪU] 05 · Nhìn lại' },
      { label: '[MẪU] 06 · Đúc kết' },
    ],
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: (props) => <LoopDiagram {...props} />,
}

