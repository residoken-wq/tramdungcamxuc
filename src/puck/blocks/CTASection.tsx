import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { CTASection, type CTASectionProps } from '@/components/site/CTASection'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { createPageExternalField } from '../page-field'
import { createTestimonialExternalField } from '../testimonial-field'

export type { CTASectionProps }

export const CTASectionBlock: ComponentConfig<CTASectionProps> = {
  label: 'Khối kêu gọi chuyển đổi lớn (CTA Section)',
  fields: {
    seriesLabel: { type: 'text', label: 'Nhãn series (trên cùng)' },
    titleLine1: { type: 'text', label: 'Tiêu đề dòng 1 (Xanh thẫm / Deep Navy)' },
    titleLine2: { type: 'text', label: 'Tiêu đề dòng 2 (Hồng sen / Bright Magenta)' },
    emotionLine: { type: 'textarea', label: 'Dòng cảm xúc (Playfair Display Italic)' },
    description: { type: 'textarea', label: 'Mô tả chi tiết' },
    buttonText: { type: 'text', label: 'Chữ trên nút hành động' },
    buttonLinkType: {
      type: 'select',
      label: 'Loại liên kết nút',
      options: [
        { label: 'Liên kết ngoài / Tự nhập URL', value: 'url' },
        { label: 'Trang trong website', value: 'page' },
      ],
    },
    buttonPageId: createPageExternalField({
      label: 'Chọn trang trong website',
    }),
    buttonLink: {
      type: 'text',
      label: 'Đường dẫn liên kết (khi chọn Tự nhập URL)',
    },
    proofText: {
      type: 'text',
      label: 'Dòng chữ bảo chứng (Dưới nút, tùy chọn)',
    },
    testimonials: {
      type: 'array',
      label: 'Ảnh đại diện người chia sẻ (Tối đa 3 người)',
      max: 3,
      arrayFields: {
        testimonialId: createTestimonialExternalField({
          label: 'Chọn lời chia sẻ (Chỉ người có ảnh và đồng ý mới hiện)',
        }),
      },
      getItemSummary: (item) =>
        item?.testimonialId ? `Lời chia sẻ ID: ${item.testimonialId}` : 'Chưa chọn',
    },
    bgColor: {
      type: 'select',
      label: 'Màu nền section ngoài',
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
    seriesLabel: '[MẪU] Sẵn sàng cho bước tiếp theo',
    titleLine1: '[MẪU] BẮT ĐẦU HÀNH TRÌNH',
    titleLine2: '[MẪU] CHUYỂN MÌNH CÙNG HANA',
    emotionLine: '[MẪU] Lắng nghe chính mình là bước khởi đầu vững chãi nhất',
    description:
      '[MẪU] Dành cho bạn một khoảng dừng tĩnh lặng để nhận diện và đón nhận trọn vẹn cảm xúc bên trong.',
    buttonText: '[MẪU] Đặt phiên trải nghiệm 149.000đ',
    buttonLinkType: 'url',
    buttonLink: '/dat-phien-trai-nghiem',
    buttonPageId: '',
    proofText: '[MẪU] Đồng hành cùng học viên và chuyên gia trên hành trình chuyển mình',
    testimonials: [],
    bgColor: 'soft-pink',
    padding: 'lg',
  },
  // `puck` carries functions (renderDropZone) that cannot cross into a client component.
  render: ({ puck, ...props }) => (
    <CTASection {...props} puck={{ isEditing: puck?.isEditing ?? false }} />
  ),
}
