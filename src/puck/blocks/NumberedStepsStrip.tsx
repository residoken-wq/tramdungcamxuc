import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import {
  NumberedStepsStrip,
  type NumberedStepsStripProps,
} from '@/components/site/NumberedStepsStrip'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { vi } from '@/lib/i18n/vi'

export type { NumberedStepsStripProps }

export const NumberedStepsStripBlock: ComponentConfig<NumberedStepsStripProps> = {
  label: vi.pk28?.numberedStepsStrip?.label || 'Chuỗi 5 bước số lớn & Đầu ra (Numbered Steps Strip)',
  fields: {
    seriesLabel: { type: 'text', label: 'Nhãn series' },
    title: { type: 'text', label: 'Tiêu đề chính' },
    showAccentBar: {
      type: 'radio',
      label: 'Vạch hồng gạch dưới tiêu đề',
      options: [
        { label: 'Không', value: false },
        { label: 'Có', value: true },
      ],
    },
    steps: {
      type: 'array',
      label: '5 thẻ số lớn (01 - 05)',
      getItemSummary: (it: { number?: string; title?: string }) =>
        `${it?.number || ''} · ${it?.title || ''}`.trim() || 'Thẻ',
      arrayFields: {
        number: { type: 'text', label: 'Số thứ tự (VD: 01)' },
        title: { type: 'text', label: 'Tiêu đề thẻ' },
        text: { type: 'textarea', label: 'Mô tả nội dung thẻ' },
        subLines: {
          type: 'array',
          label: 'Các dòng phân nhánh (VD: Nam tính / Nữ tính)',
          getItemSummary: (it: { label?: string }) => it?.label || 'Dòng',
          arrayFields: {
            label: { type: 'text', label: 'Tên nhánh (VD: Nam tính)' },
            text: { type: 'text', label: 'Nội dung nhánh' },
          },
        },
      },
    },
    outputStripLabel: { type: 'text', label: 'Nhãn dải đầu ra dưới (VD: ĐẦU RA)' },
    outputStripText: { type: 'textarea', label: 'Nội dung dải đầu ra dưới' },
    bottomQuote: { type: 'textarea', label: 'Dòng đúc kết nghiêng cuối (Playfair Display)' },
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
    seriesLabel: '[MẪU] CHƯƠNG TRÌNH 02 · BỘ CÔNG CỤ ĐIỀU HÒA',
    title: '[MẪU] Năm bước đi qua một cơn dông cảm xúc',
    showAccentBar: true,
    steps: [
      {
        number: '[MẪU] 01',
        title: '[MẪU] DỪNG',
        text: '[MẪU] Nhận ra mình đang bị cuốn vào phản ứng; tạm dừng nếu an toàn.',
      },
      {
        number: '[MẪU] 02',
        title: '[MẪU] NHẬN DIỆN',
        text: '[MẪU] Gọi tên cảm xúc, tín hiệu cơ thể và nhu cầu cần được chú ý.',
      },
      {
        number: '[MẪU] 03',
        title: '[MẪU] ĐIỀU HÒA',
        text: '[MẪU] Thử một cách làm dịu: thở tự nhiên, grounding, uống nước, đi bộ.',
      },
      {
        number: '[MẪU] 04',
        title: '[MẪU] LỰA CHỌN',
        text: '[MẪU] Cân nhắc cách nói, hành động hoặc xin hỗ trợ trước khi phản hồi.',
      },
      {
        number: '[MẪU] 05',
        title: '[MẪU] QUAY LẠI',
        text: '[MẪU] Nhìn lại điều hiệu quả, không phán xét mình vì từng mất bình tĩnh.',
      },
    ],
    outputStripLabel: '[MẪU] ĐẦU RA',
    outputStripText:
      '[MẪU] Emotional First-Aid Plan — kế hoạch vừa sức cho một tình huống quen thuộc, ví dụ khi nhận một phản hồi khiến mình muốn trả lời ngay.',
    bottomQuote: '[MẪU] Vững vàng không phải là không có cơn dông.',
    bgColor: 'soft-pink',
    padding: 'md',
  },
  render: (props) => <NumberedStepsStrip {...props} />,
}
