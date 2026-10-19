import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { ContactForms, type ContactFormsProps } from '@/components/site/ContactForms'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'

export type { ContactFormsProps }

export const ContactFormsBlock: ComponentConfig<ContactFormsProps> = {
  label: 'Khung form liên hệ (Contact Forms)',
  fields: {
    layout: {
      type: 'select',
      label: 'Bố cục hiển thị',
      options: [
        { label: 'Hai cột song song (Cá nhân & Doanh nghiệp)', value: 'columns' },
        { label: 'Thẻ Tab chuyển đổi (Dành cho trang chủ / SM-07)', value: 'tabs' },
      ],
    },
    titleB2C: {
      type: 'text',
      label: 'Tiêu đề form Cá nhân (B2C)',
    },
    descriptionB2C: {
      type: 'textarea',
      label: 'Mô tả ngắn form Cá nhân',
    },
    submitLabelB2C: {
      type: 'text',
      label: 'Chữ trên nút gửi form Cá nhân',
    },
    successTitleB2C: {
      type: 'text',
      label: 'Tiêu đề thông báo thành công (Cá nhân)',
    },
    successMessageB2C: {
      type: 'textarea',
      label: 'Nội dung thông báo thành công (Cá nhân)',
    },
    titleB2B: {
      type: 'text',
      label: 'Tiêu đề form Doanh nghiệp (B2B)',
    },
    descriptionB2B: {
      type: 'textarea',
      label: 'Mô tả ngắn form Doanh nghiệp',
    },
    submitLabelB2B: {
      type: 'text',
      label: 'Chữ trên nút gửi form Doanh nghiệp',
    },
    successTitleB2B: {
      type: 'text',
      label: 'Tiêu đề thông báo thành công (Doanh nghiệp)',
    },
    successMessageB2B: {
      type: 'textarea',
      label: 'Nội dung thông báo thành công (Doanh nghiệp)',
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
    layout: 'columns',
    titleB2C: '[MẪU] Dành cho Cá nhân',
    descriptionB2C:
      '[MẪU] Đăng ký tư vấn 1:1 hoặc gửi những trăn trở của bạn về hành trình cảm xúc và thói quen.',
    submitLabelB2C: '[MẪU] Gửi yêu cầu tư vấn',
    successTitleB2C: '[MẪU] Cảm ơn bạn đã kết nối!',
    successMessageB2C:
      '[MẪU] Trạm đã nhận được thông tin và sẽ phản hồi qua email hoặc số điện thoại trong vòng 24 giờ làm việc.',
    titleB2B: '[MẪU] Dành cho Doanh nghiệp',
    descriptionB2B:
      '[MẪU] Cùng Trạm kiến tạo chương trình đào tạo và giải pháp chăm sóc sức khỏe tinh thần cho đội ngũ.',
    submitLabelB2B: '[MẪU] Gửi đề xuất doanh nghiệp',
    successTitleB2B: '[MẪU] Cảm ơn bạn đã kết nối!',
    successMessageB2B:
      '[MẪU] Cảm ơn quý doanh nghiệp đã gửi yêu cầu. Đội ngũ Trạm Dừng Cảm Xúc sẽ liên hệ lại trong thời gian sớm nhất.',
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: ({ puck, ...props }) => (
    <ContactForms {...props} puck={{ isEditing: puck?.isEditing ?? false }} />
  ),
}
