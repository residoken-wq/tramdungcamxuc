import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { CTASection, type CTASectionProps } from '@/components/site/CTASection'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { createPageExternalField } from '../page-field'
import { createTestimonialExternalField } from '../testimonial-field'
import { sizeField } from '../format-fields'
import { vi } from '@/lib/i18n/vi'

export type { CTASectionProps }

export const CTASectionBlock: ComponentConfig<CTASectionProps> = {
  label: 'Khối kêu gọi chuyển đổi lớn (CTA Section)',
  fields: {
    variant: {
      type: 'select',
      label: vi.cd01?.cta?.variant || 'Bố cục phần kêu gọi hành động',
      options: [
        { label: vi.cd01?.cta?.variantCard || 'Dạng hộp thẻ trắng (Mặc định)', value: 'card' },
        {
          label: vi.cd01?.cta?.variantSolid || 'Dạng nền tràn khối màu (Không đóng hộp)',
          value: 'solid',
        },
      ],
    },
    seriesLabel: { type: 'text', label: vi.eb15a.seriesLabel, contentEditable: true },
    titleLine1: {
      type: 'text',
      label: vi.eb15a.titleLine1,
      contentEditable: true,
    },
    titleLine2: {
      type: 'text',
      label: vi.eb15a.titleLine2,
      contentEditable: true,
    },
    titleSize: sizeField('Cỡ chữ tiêu đề'),
    emotionLine: {
      type: 'textarea',
      label: vi.eb15a.emotionLine,
      contentEditable: true,
    },
    description: { type: 'textarea', label: vi.eb15a.description, contentEditable: true },
    textSize: sizeField('Cỡ chữ mô tả'),
    buttonText: { type: 'text', label: vi.eb15a.buttonText, contentEditable: true },
    buttonAction: {
      type: 'select',
      label: 'Hành động của nút chính',
      options: [
        { label: 'Chuyển hướng liên kết (Mặc định)', value: 'link' },
        { label: 'Đặt lịch phiên trải nghiệm', value: 'booking' },
        { label: 'Mở form tham gia / nhận brochure (Modal)', value: 'form' },
      ],
    },
    formType: {
      type: 'select',
      label: 'Loại form mở khi bấm nút chính',
      options: [
        { label: 'Tham gia ME TIME', value: 'community-me-time' },
        { label: 'Tham gia YOGA BUDDY', value: 'community-yoga-buddy' },
        { label: 'Đăng ký nhận brochure chi tiết', value: 'brochure-chuyen-minh' },
      ],
    },
    formTitle: {
      type: 'text',
      label: 'Tiêu đề form modal (nút chính - để trống dùng mặc định)',
    },
    formSuccessMessage: {
      type: 'text',
      label: 'Câu cảm ơn sau khi gửi (nút chính - để trống dùng mặc định)',
    },
    buttonLinkType: {
      type: 'select',
      label: 'Loại liên kết nút',
      options: [
        { label: 'Liên kết ngoài / Tự nhập URL', value: 'url' },
        { label: 'Trang trong website', value: 'page' },
        { label: 'Đặt lịch phiên trải nghiệm', value: 'booking' },
      ],
    },
    buttonPageId: createPageExternalField({
      label: 'Chọn trang trong website',
    }),
    buttonLink: {
      type: 'text',
      label: 'Đường dẫn liên kết (khi chọn Tự nhập URL)',
    },
    buttonVariant: {
      type: 'select',
      label: vi.cd01?.cta?.buttonVariant || 'Kiểu nút chính',
      options: [
        { label: 'Mặc định (Hồng nhấn)', value: 'primary' },
        { label: 'Hồng sen (Bright Magenta)', value: 'magenta' },
        { label: 'Hồng nhấn (Accent Pink)', value: 'pink' },
      ],
    },
    buttonShape: {
      type: 'radio',
      label: 'Hình dạng nút',
      options: [
        { label: 'Bo tròn nhẹ (Mặc định)', value: 'normal' },
        { label: 'Viên thuốc (Pill bo tròn hoàn toàn)', value: 'pill' },
      ],
    },
    secondaryButtonText: {
      type: 'text',
      label: vi.cd01?.cta?.secondaryButtonText || 'Chữ nút phụ',
    },
    secondaryButtonAction: {
      type: 'select',
      label: 'Hành động của nút phụ',
      options: [
        { label: 'Chuyển hướng liên kết (Mặc định)', value: 'link' },
        { label: 'Mở form tham gia / nhận brochure (Modal)', value: 'form' },
      ],
    },
    secondaryFormType: {
      type: 'select',
      label: 'Loại form mở khi bấm nút phụ',
      options: [
        { label: 'Tham gia YOGA BUDDY', value: 'community-yoga-buddy' },
        { label: 'Tham gia ME TIME', value: 'community-me-time' },
        { label: 'Đăng ký nhận brochure chi tiết', value: 'brochure-chuyen-minh' },
      ],
    },
    secondaryFormTitle: {
      type: 'text',
      label: 'Tiêu đề form modal (nút phụ - để trống dùng mặc định)',
    },
    secondaryFormSuccessMessage: {
      type: 'text',
      label: 'Câu cảm ơn sau khi gửi (nút phụ - để trống dùng mặc định)',
    },
    secondaryButtonLink: {
      type: 'text',
      label: vi.cd01?.cta?.secondaryButtonLink || 'Đường dẫn nút phụ',
    },
    secondaryButtonVariant: {
      type: 'select',
      label: vi.cd01?.cta?.secondaryButtonVariant || 'Kiểu nút phụ',
      options: [
        { label: 'Mặc định (Hồng nhấn)', value: 'primary' },
        { label: 'Hồng sen (Bright Magenta)', value: 'magenta' },
        { label: 'Hồng nhấn (Accent Pink)', value: 'pink' },
      ],
    },
    proofText: {
      type: 'text',
      label: vi.eb15a.proofText,
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
    variant: 'card',
    buttonShape: 'normal',
    buttonVariant: 'primary',
    secondaryButtonText: '',
    secondaryButtonLink: '',
    secondaryButtonVariant: 'primary',
    titleSize: 'md',
    textSize: 'md',
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
