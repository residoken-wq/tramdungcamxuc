import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { BrandFormula, type BrandFormulaProps } from '@/components/site/BrandFormula'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { vi } from '@/lib/i18n/vi'

export type { BrandFormulaProps }

export const BrandFormulaBlock: ComponentConfig<BrandFormulaProps> = {
  label: vi.pk28?.brandFormula?.label || 'Công thức thương hiệu cá nhân (Brand Formula)',
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
      label: '3 bước số lớn bên trái',
      getItemSummary: (it: { number?: string; title?: string }) =>
        `${it?.number || ''} · ${it?.title || ''}`.trim() || 'Bước',
      arrayFields: {
        number: { type: 'text', label: 'Con số lớn (VD: 1, 2, 3)' },
        title: { type: 'text', label: 'Tiêu đề bước (in đậm)' },
        description: { type: 'textarea', label: 'Mô tả nội dung' },
      },
    },
    bottomQuoteLeft: {
      type: 'textarea',
      label: 'Dòng đúc kết nghiêng cột trái (Playfair Display)',
    },
    planCardEyebrow: { type: 'text', label: 'Nhãn thẻ bên phải (VD: HABIT PLAN MINH HỌA)' },
    planCardSubtitle: { type: 'text', label: 'Dòng phụ (VD: Mong muốn: chia sẻ kinh nghiệm...)' },
    planCardQuote: { type: 'textarea', label: 'Trích dẫn kế hoạch nghiêng lớn' },
    planItem1Title: { type: 'text', label: 'Tiêu đề mục 1 (VD: Ngày ít năng lượng)' },
    planItem1Text: { type: 'textarea', label: 'Nội dung mục 1' },
    planItem2Title: { type: 'text', label: 'Tiêu đề mục 2 (VD: Nếu bỏ lỡ)' },
    planItem2Text: { type: 'textarea', label: 'Nội dung mục 2' },
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
    seriesLabel: '[MẪU] CHƯƠNG TRÌNH 01 · CÁCH HIỂU THƯƠNG HIỆU',
    title: '[MẪU] Thương hiệu cá nhân bắt đầu từ giá trị thật',
    showAccentBar: true,
    steps: [
      {
        number: '[MẪU] 1',
        title: '[MẪU] Điều mình đại diện',
        description: '[MẪU] Phẩm chất và năng lực mình muốn tiếp tục nuôi dưỡng.',
      },
      {
        number: '[MẪU] 2',
        title: '[MẪU] Giá trị mình tạo ra',
        description: '[MẪU] Một nhóm người cụ thể nhận được điều hữu ích từ mình.',
      },
      {
        number: '[MẪU] 3',
        title: '[MẪU] Minh chứng họ nhìn thấy',
        description: '[MẪU] Cách làm việc, sản phẩm hoặc trải nghiệm có thể chia sẻ.',
      },
    ],
    bottomQuoteLeft:
      '[MẪU] Thói quen là cầu nối: biến lời giới thiệu thành điều người khác trải nghiệm được.',
    planCardEyebrow: '[MẪU] HABIT PLAN MINH HỌA',
    planCardSubtitle:
      '[MẪU] Mong muốn: chia sẻ kinh nghiệm nghề nghiệp có ích cho người mới',
    planCardQuote:
      '[MẪU] “Sau khi đóng máy làm việc vào thứ Ba và thứ Sáu, mình dành 5 phút ghi lại một tình huống và một bài học.”',
    planItem1Title: '[MẪU] Ngày ít năng lượng',
    planItem1Text: '[MẪU] Ghi một câu để giữ lại ý chính.',
    planItem2Title: '[MẪU] Nếu bỏ lỡ',
    planItem2Text:
      '[MẪU] Quay lại ở buổi kế tiếp đã lên lịch và xem điều gì cần đổi.',
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: (props) => <BrandFormula {...props} />,
}
