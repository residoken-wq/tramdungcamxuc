import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { ContactForms, type ContactFormsProps } from '@/components/site/ContactForms'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { vi } from '@/lib/i18n/vi'

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
        {
          label: vi.pk21?.contactForms?.layoutPersonal || 'Cá nhân (1 form)',
          value: 'personal',
        },
        {
          label: vi.pk21?.contactForms?.layoutBusiness || 'Doanh nghiệp (1 form)',
          value: 'business',
        },
      ],
    },
    b2cPurpose: {
      type: 'select',
      label: 'Mục đích form Cá nhân',
      options: [
        { label: 'Tư vấn 1:1 (Mặc định)', value: 'consult' },
        { label: 'Nhận brochure chi tiết', value: 'brochure' },
      ],
    },
    b2cShowPathway: {
      type: 'radio',
      label: 'Hiện ô "Lộ trình bạn quan tâm"',
      options: [
        { label: 'Bật (Mặc định)', value: true },
        { label: 'Tắt (Ẩn)', value: false },
      ],
    },
    b2cShowStatus: {
      type: 'radio',
      label: 'Hiện ô "Tình trạng hiện tại"',
      options: [
        { label: 'Bật (Mặc định)', value: true },
        { label: 'Tắt (Ẩn)', value: false },
      ],
    },
    b2cShowMessage: {
      type: 'radio',
      label: 'Hiện ô "Điều bạn đang trăn trở"',
      options: [
        { label: 'Bật (Mặc định)', value: true },
        { label: 'Tắt (Ẩn)', value: false },
      ],
    },
    b2cPhoneRequired: {
      type: 'radio',
      label: 'Bắt buộc nhập số điện thoại',
      options: [
        { label: 'Tắt (Không bắt buộc)', value: false },
        { label: 'Bật (Bắt buộc)', value: true },
      ],
    },
    b2cShowName: {
      type: 'radio',
      label: 'Hiện ô "Họ và tên"',
      options: [
        { label: 'Bật (Mặc định)', value: true },
        { label: 'Tắt (Ẩn)', value: false },
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
  resolveFields: (data, params) => {
    const fields = { ...params.fields }
    const props = data?.props || {}

    // Khi bố cục là "Doanh nghiệp (1 form)" thì ẩn toàn bộ các ô B2C
    if (props.layout === 'business') {
      delete fields.b2cPurpose
      delete fields.b2cShowPathway
      delete fields.b2cShowStatus
      delete fields.b2cShowMessage
      delete fields.b2cPhoneRequired
      delete fields.b2cShowName
      delete fields.titleB2C
      delete fields.descriptionB2C
      delete fields.submitLabelB2C
      delete fields.successTitleB2C
      delete fields.successMessageB2C
      return fields
    }

    // Khi bố cục là "Cá nhân (1 form)" thì ẩn toàn bộ các ô B2B
    if (props.layout === 'personal') {
      delete fields.titleB2B
      delete fields.descriptionB2B
      delete fields.submitLabelB2B
      delete fields.successTitleB2B
      delete fields.successMessageB2B
    }

    // Khi chế độ Mục đích form = "Nhận brochure"
    if (props.b2cPurpose === 'brochure') {
      delete fields.b2cShowPathway
      delete fields.b2cShowStatus
      delete fields.b2cShowMessage
      delete fields.b2cPhoneRequired
    } else {
      // Khi chế độ Tư vấn (consult)
      delete fields.b2cShowName
    }

    return fields
  },
  defaultProps: {
    version: 1,
    layout: 'columns',
    b2cPurpose: 'consult',
    b2cShowPathway: true,
    b2cShowStatus: true,
    b2cShowMessage: true,
    b2cPhoneRequired: false,
    b2cShowName: true,
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
