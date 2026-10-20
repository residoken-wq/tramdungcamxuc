import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { FAQ, type FAQProps } from '@/components/site/FAQ'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { faqGroupOptions } from '@/collections/Faqs'

export type { FAQProps }

export const FAQBlock: ComponentConfig<FAQProps> = {
  label: 'Hỏi & Đáp thường gặp (FAQ Accordion)',
  fields: {
    source: {
      type: 'select',
      label: 'Nguồn câu hỏi',
      options: [
        { label: 'Tự nhập danh sách câu hỏi (Thủ công)', value: 'manual' },
        { label: 'Lấy theo nhóm từ Câu hỏi thường gặp (CMS)', value: 'group' },
      ],
    },
    group: {
      type: 'select',
      label: 'Nhóm câu hỏi (Khi chọn nguồn theo nhóm)',
      options: faqGroupOptions.map(([val, label]) => ({
        label: `${label} (${val})`,
        value: val,
      })),
    },
    limit: {
      type: 'number',
      label: 'Số lượng câu hỏi hiển thị (1 - 12)',
      min: 1,
      max: 12,
    },
    seriesLabel: { type: 'text', label: 'Nhãn series (trên cùng)' },
    titleLine1: { type: 'text', label: 'Tiêu đề dòng 1 (Xanh thẫm / Deep Navy)' },
    titleLine2: { type: 'text', label: 'Tiêu đề dòng 2 (Hồng sen / Bright Magenta)' },
    numbered: {
      type: 'select',
      label: 'Đánh số thứ tự câu hỏi',
      options: [
        { label: 'Không đánh số', value: false },
        { label: 'Đánh số thứ tự (01, 02...)', value: true },
      ],
    },
    aside: {
      type: 'select',
      label: 'Khối bên cạnh (Aside)',
      options: [
        { label: 'Không có (Căn giữa trang)', value: 'none' },
        { label: 'Khối đặt lịch (Booking Aside nền Deep Navy)', value: 'booking' },
      ],
    },
    bookingAsideTitle: {
      type: 'text',
      label: 'Tiêu đề khối đặt lịch (Khi bật Booking Aside)',
    },
    bookingAsideDescription: {
      type: 'textarea',
      label: 'Mô tả khối đặt lịch',
    },
    bookingButtonText: {
      type: 'text',
      label: 'Chữ trên nút đặt lịch',
    },
    bookingButtonLink: {
      type: 'text',
      label: 'Đường dẫn nút đặt lịch (Để trống sẽ dẫn tới /dat-phien-trai-nghiem)',
    },
    showEmail: {
      type: 'select',
      label: 'Hiển thị email liên hệ từ Cài đặt trang',
      options: [
        { label: 'Không hiển thị email', value: false },
        { label: 'Hiển thị email liên hệ', value: true },
      ],
    },
    seeAllLink: {
      type: 'text',
      label: 'Liên kết "Xem toàn bộ" (Tùy chọn)',
    },
    items: {
      type: 'array',
      label: 'Danh sách câu hỏi & trả lời (Khi chọn nguồn thủ công)',
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
    version: 3,
    source: 'manual',
    group: 'general',
    limit: 5,
    seriesLabel: '[MẪU] Thắc mắc thường gặp',
    titleLine1: '[MẪU] CÂU HỎI THƯỜNG GẶP',
    titleLine2: '[MẪU] GIẢI ĐÁP BĂN KHOĂN',
    numbered: false,
    aside: 'none',
    bookingAsideTitle: '[MẪU] Đặt phiên trải nghiệm',
    bookingAsideDescription:
      '[MẪU] Trò chuyện 1:1 cùng Hana để thấu hiểu rõ lộ trình phát triển phù hợp nhất.',
    bookingButtonText: '[MẪU] Đặt lịch ngay',
    bookingButtonLink: '',
    showEmail: false,
    seeAllLink: '',
    items: [
      {
        question: '[MẪU] Câu hỏi thường gặp 1',
        answer: '[MẪU] Nội dung giải đáp câu hỏi thường gặp một cách chi tiết và rõ ràng.',
      },
      {
        question: '[MẪU] Câu hỏi thường gặp 2',
        answer: '[MẪU] Nội dung giải đáp câu hỏi thường gặp một cách chi tiết và rõ ràng.',
      },
      {
        question: '[MẪU] Câu hỏi thường gặp 3',
        answer: '[MẪU] Nội dung giải đáp câu hỏi thường gặp một cách chi tiết và rõ ràng.',
      },
    ],
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  // `puck` carries functions (renderDropZone) that cannot cross into a client component.
  render: ({ puck, ...props }) => <FAQ {...props} puck={{ isEditing: puck?.isEditing ?? false }} />,
}
