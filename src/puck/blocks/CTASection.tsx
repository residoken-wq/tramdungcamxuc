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
      label: vi.au04.cta.buttonAction,
      options: [
        { label: vi.au04.cta.actionLink, value: 'link' },
        { label: vi.au04.cta.actionBooking, value: 'booking' },
        { label: vi.au04.cta.actionForm, value: 'form' },
      ],
    },
    formType: {
      type: 'select',
      label: vi.au04.cta.formType,
      options: [
        { label: vi.au04.cta.formMeTime, value: 'community-me-time' },
        { label: vi.au04.cta.formYogaBuddy, value: 'community-yoga-buddy' },
        { label: vi.au04.cta.formBrochure, value: 'brochure-chuyen-minh' },
      ],
    },
    formTitle: {
      type: 'text',
      label: vi.au04.cta.formTitle,
    },
    formSuccessMessage: {
      type: 'text',
      label: vi.au04.cta.formSuccessMessage,
    },
    buttonLinkType: {
      type: 'select',
      label: 'Loại liên kết nút',
      options: [
        { label: 'Liên kết ngoài / Tự nhập URL', value: 'url' },
        { label: 'Trang trong website', value: 'page' },
        { label: vi.au04.cta.actionBooking, value: 'booking' },
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
      label: vi.au04.cta.secondaryButtonAction,
      options: [
        { label: vi.au04.cta.actionLink, value: 'link' },
        { label: vi.au04.cta.actionForm, value: 'form' },
      ],
    },
    secondaryFormType: {
      type: 'select',
      label: vi.au04.cta.secondaryFormType,
      options: [
        { label: vi.au04.cta.formYogaBuddy, value: 'community-yoga-buddy' },
        { label: vi.au04.cta.formMeTime, value: 'community-me-time' },
        { label: vi.au04.cta.formBrochure, value: 'brochure-chuyen-minh' },
      ],
    },
    secondaryFormTitle: {
      type: 'text',
      label: vi.au04.cta.secondaryFormTitle,
    },
    secondaryFormSuccessMessage: {
      type: 'text',
      label: vi.au04.cta.secondaryFormSuccessMessage,
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
      options: [
        ...BRAND_COLOR_OPTIONS,
        { label: 'Hồng sen (Bright Magenta)', value: 'bright-magenta' },
      ],
    },
    padding: {
      type: 'select',
      label: 'Khoảng đệm (Padding)',
      options: [...PADDING_OPTIONS],
    },
  },
  resolveFields: (data, params) => {
    const fields = { ...params.fields }
    const props = data?.props || {}

    // Dạng "hộp thẻ trắng" và "nền tràn" chỉ hiện ô áp dụng cho dạng đó
    if (props.variant === 'solid') {
      delete fields.proofText
      delete fields.testimonials
    }

    // Hành động của nút chính
    const buttonAction = props.buttonAction || 'link'
    if (buttonAction === 'booking') {
      delete fields.buttonLinkType
      delete fields.buttonPageId
      delete fields.buttonLink
      delete fields.formType
      delete fields.formTitle
      delete fields.formSuccessMessage
    } else if (buttonAction === 'form') {
      delete fields.buttonLinkType
      delete fields.buttonPageId
      delete fields.buttonLink
    } else {
      // buttonAction === 'link'
      delete fields.formType
      delete fields.formTitle
      delete fields.formSuccessMessage
      const linkType = props.buttonLinkType || 'url'
      if (linkType === 'page') {
        delete fields.buttonLink
      } else if (linkType === 'url') {
        delete fields.buttonPageId
      } else if (linkType === 'booking') {
        delete fields.buttonPageId
        delete fields.buttonLink
      }
    }

    // Nút phụ: Chữ nút phụ trống -> ẩn mọi ô nút phụ còn lại
    const hasSecondaryText = Boolean(
      props.secondaryButtonText && props.secondaryButtonText.trim().length > 0,
    )
    if (!hasSecondaryText) {
      delete fields.secondaryButtonAction
      delete fields.secondaryButtonLink
      delete fields.secondaryButtonVariant
      delete fields.secondaryFormType
      delete fields.secondaryFormTitle
      delete fields.secondaryFormSuccessMessage
    } else {
      const secondaryAction = props.secondaryButtonAction || 'link'
      if (secondaryAction === 'form') {
        delete fields.secondaryButtonLink
      } else {
        // secondaryAction === 'link'
        delete fields.secondaryFormType
        delete fields.secondaryFormTitle
        delete fields.secondaryFormSuccessMessage
      }
    }

    return fields
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
