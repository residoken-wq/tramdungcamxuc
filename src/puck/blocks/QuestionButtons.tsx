import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import {
  QuestionButtons,
  type QuestionButtonsProps,
  type QuestionButtonActionItem,
} from '@/components/site/QuestionButtons'
import { PADDING_OPTIONS } from '../constants'
import { createPageExternalField } from '../page-field'

export type { QuestionButtonsProps, QuestionButtonActionItem }

export const QUESTION_BUTTONS_BG_OPTIONS = [
  { label: 'Hồng sen (Bright Magenta)', value: 'bright-magenta' },
  { label: 'Xanh thẫm (Deep Navy)', value: 'deep-navy' },
  { label: 'Ngà ấm (Warm Ivory)', value: 'warm-ivory' },
  { label: 'Hồng phấn (Soft Pink)', value: 'soft-pink' },
  { label: 'Tím sương (Lavender Mist)', value: 'lavender-mist' },
  { label: 'Bạc hà (Mint Haze)', value: 'mint-haze' },
  { label: 'Kem bơ (Butter Cream)', value: 'butter-cream' },
] as const

export const QuestionButtonsBlock: ComponentConfig<QuestionButtonsProps> = {
  label: 'Câu hỏi + nút (nền màu)',
  fields: {
    question: {
      type: 'textarea',
      label: 'Câu hỏi / câu nghiêng (Playfair Display Italic)',
      contentEditable: true,
    },
    buttons: {
      type: 'array',
      label: 'Danh sách nút (1–3 nút)',
      max: 3,
      getItemSummary: (item, index) => item?.text || `Nút ${(index ?? 0) + 1}`,
      arrayFields: {
        text: {
          type: 'text',
          label: 'Chữ trên nút',
        },
        action: {
          type: 'select',
          label: 'Hành động',
          options: [
            { label: 'Liên kết', value: 'link' },
            { label: 'Đặt lịch phiên trải nghiệm (AU-04)', value: 'booking' },
          ],
        },
        linkType: {
          type: 'select',
          label: 'Loại liên kết (khi chọn Liên kết)',
          options: [
            { label: 'Liên kết ngoài / Tự nhập URL', value: 'url' },
            { label: 'Trang trong website', value: 'page' },
          ],
        },
        pageId: createPageExternalField({
          label: 'Chọn trang trong website',
        }),
        url: {
          type: 'text',
          label: 'Đường dẫn liên kết (khi chọn Tự nhập URL)',
        },
        variant: {
          type: 'select',
          label: 'Kiểu nút',
          options: [
            { label: 'Nút đặc (Mặc định)', value: 'solid' },
            { label: 'Nút viền', value: 'outline' },
          ],
        },
      },
    },
    bgColor: {
      type: 'select',
      label: 'Màu nền',
      options: [...QUESTION_BUTTONS_BG_OPTIONS],
    },
    padding: {
      type: 'select',
      label: 'Khoảng đệm (Padding)',
      options: [...PADDING_OPTIONS],
    },
  },
  defaultProps: {
    version: 1,
    question: '[MẪU] Bạn thực sự muốn tìm được lối ra nhưng chưa biết bắt đầu từ đâu?',
    bgColor: 'bright-magenta',
    padding: 'md',
    buttons: [
      {
        text: '[MẪU] Điểm nghẽn Thói quen',
        action: 'link',
        linkType: 'url',
        url: '/habit/chan-doan',
        variant: 'solid',
      },
      {
        text: '[MẪU] Điểm nghẽn Cảm xúc',
        action: 'link',
        linkType: 'url',
        url: '/eq-buddy',
        variant: 'outline',
      },
    ],
  },
  render: ({ puck: _puck, ...props }) => <QuestionButtons {...props} />,
}
