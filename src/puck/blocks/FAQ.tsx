import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { FAQ, type FAQProps } from '@/components/site/FAQ'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '@/puck/config'

export type { FAQProps }

export const FAQBlock: ComponentConfig<FAQProps> = {
  label: 'Hỏi & Đáp thường gặp (FAQ Accordion)',
  fields: {
    seriesLabel: { type: 'text', label: 'Nhãn series (trên cùng)' },
    titleLine1: { type: 'text', label: 'Tiêu đề dòng 1 (Xanh thẫm / Deep Navy)' },
    titleLine2: { type: 'text', label: 'Tiêu đề dòng 2 (Hồng sen / Bright Magenta)' },
    items: {
      type: 'array',
      label: 'Danh sách câu hỏi & trả lời',
      arrayFields: {
        question: {
          type: 'text',
          label: 'Câu hỏi',
        },
        answer: {
          type: 'textarea',
          label: 'Câu trả lời chi tiết',
        },
      },
      defaultItemProps: {
        question: '[MẪU] Câu hỏi thắc mắc mới?',
        answer: '[MẪU] Câu trả lời chi tiết, tận tâm và ấm áp từ Hana.',
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
    seriesLabel: '[MẪU] Thắc mắc thường gặp',
    titleLine1: '[MẪU] CÂU HỎI THƯỜNG GẶP',
    titleLine2: '[MẪU] GIẢI ĐÁP BĂN KHOĂN',
    items: [
      {
        question: '[MẪU] Tôi có cần kiến thức tâm lý trước khi tham gia không?',
        answer:
          '[MẪU] Không cần bất kỳ nền tảng nào trước đó. Các phương pháp đều được thiết kế đơn giản, gần gũi và đi từ chính trải nghiệm đời sống của bạn.',
      },
      {
        question: '[MẪU] Phiên trải nghiệm Growth Mirror diễn ra như thế nào?',
        answer:
          '[MẪU] Phiên trải nghiệm 1:1 diễn ra trong 60 phút qua không gian trực tuyến ấm áp, bảo mật tuyệt đối, giúp bạn nhìn nhận rõ bức tranh cảm xúc hiện tại.',
      },
      {
        question: '[MẪU] Nếu tôi lỡ nhịp thực hành 1 ngày thì có sao không?',
        answer:
          '[MẪU] Lỡ nhịp một ngày là hoàn toàn bình thường. Điều quan trọng không phải là sự hoàn hảo liên tục, mà là sự kiên nhẫn dịu dàng quay trở lại vào ngày hôm sau.',
      },
    ],
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: (props) => <FAQ {...props} />,
}
