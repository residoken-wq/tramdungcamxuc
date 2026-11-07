import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { FAQ, type FAQProps } from '@/components/site/FAQ'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { faqGroupOptions } from '@/collections/Faqs'
import { createMediaExternalField } from '../media-field'
import { vi } from '@/lib/i18n/vi'

export type { FAQProps }

export const FAQBlock: ComponentConfig<FAQProps> = {
  label: 'Hỏi & Đáp thường gặp (FAQ Accordion)',
  fields: {
    variant: {
      type: 'select',
      label: vi.pk21?.faq?.variant || 'Biến thể hiển thị FAQ',
      options: [
        {
          label: vi.pk21?.faq?.variantAccordion || 'Hộp thu gọn (Accordion)',
          value: 'accordion',
        },
        {
          label: vi.pk21?.faq?.variantCards || 'Lưới thẻ mở sẵn (Cards)',
          value: 'cards',
        },
        {
          label: vi.pk21?.faq?.variantQuick || 'Danh sách nhanh (Quick)',
          value: 'quick',
        },
      ],
    },
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
    seriesLabelStyle: {
      type: 'select',
      label: 'Kiểu nhãn series',
      options: [
        { label: 'Chữ thường (Mặc định)', value: 'text' },
        { label: 'Viên bo tròn có viền (Pill)', value: 'pill' },
      ],
    },
    titleLine1: { type: 'text', label: 'Tiêu đề dòng 1 (Xanh thẫm / Deep Navy)' },
    titleLine2: { type: 'text', label: 'Tiêu đề dòng 2 (Hồng sen / Bright Magenta)' },
    description: { type: 'textarea', label: 'Đoạn mô tả ngắn dưới tiêu đề' },
    iconStyle: {
      type: 'select',
      label: 'Kiểu biểu tượng đóng/mở',
      options: [
        { label: 'Mũi tên xoay (Chevron)', value: 'chevron' },
        { label: 'Cộng / Trừ (+ / −)', value: 'plusminus' },
      ],
    },
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
        { label: 'Thẻ liên hệ có ảnh (Contact Card)', value: 'contact' },
      ],
    },
    contactMediaId: createMediaExternalField({
      label: 'Ảnh liên hệ (Aside: Thẻ liên hệ)',
      placeholder: 'Chọn ảnh từ thư viện media...',
    }),
    contactBadge: {
      type: 'text',
      label: 'Huy hiệu khối bên cạnh (Badge)',
    },
    bookingAsideTitle: {
      type: 'text',
      label: 'Tiêu đề khối đặt lịch / liên hệ',
    },
    bookingAsideDescription: {
      type: 'textarea',
      label: 'Mô tả khối đặt lịch / liên hệ',
    },
    bookingButtonText: {
      type: 'text',
      label: 'Chữ trên nút đặt lịch / liên hệ',
    },
    bookingButtonLink: {
      type: 'text',
      label: 'Đường dẫn nút (Để trống sẽ dẫn tới /dat-phien-trai-nghiem)',
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
      type: 'slot',
      label: 'Danh sách câu hỏi (khi chọn nguồn thủ công)',
      allow: ['FaqItem'],
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
    version: 6,
    variant: 'accordion',
    source: 'manual',
    group: 'general',
    limit: 5,
    seriesLabel: '[MẪU] Thắc mắc thường gặp',
    seriesLabelStyle: 'text',
    titleLine1: '[MẪU] CÂU HỎI THƯỜNG GẶP',
    titleLine2: '[MẪU] GIẢI ĐÁP BĂN KHOĂN',
    description: '',
    iconStyle: 'chevron',
    numbered: false,
    aside: 'none',
    contactMediaId: '',
    contactBadge: '[MẪU] Trạm Dừng Cảm Xúc',
    bookingAsideTitle: '[MẪU] Đặt phiên trải nghiệm',
    bookingAsideDescription:
      '[MẪU] Trò chuyện 1:1 cùng Hana để thấu hiểu rõ lộ trình phát triển phù hợp nhất.',
    bookingButtonText: '[MẪU] Đặt lịch ngay',
    bookingButtonLink: '',
    showEmail: false,
    seeAllLink: '',
    items: [],
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  // `puck` carries functions (renderDropZone) that cannot cross into a client component.
  render: ({ puck, ...props }) => <FAQ {...props} puck={{ isEditing: puck?.isEditing ?? false }} />,
}
