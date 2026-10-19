import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { TwoPathCards, type TwoPathCardsProps } from '@/components/site/TwoPathCards'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { createPageExternalField } from '../page-field'

export type { TwoPathCardsProps }

export const TwoPathCardsBlock: ComponentConfig<TwoPathCardsProps> = {
  label: 'Hai lối đi Cá nhân / Doanh nghiệp (Two Path Cards)',
  fields: {
    seriesLabel: {
      type: 'text',
      label: 'Nhãn series (Tùy chọn)',
    },
    titleLine1: {
      type: 'text',
      label: 'Tiêu đề dòng 1 (Xanh thẫm / Deep Navy)',
    },
    titleLine2: {
      type: 'text',
      label: 'Tiêu đề dòng 2 (Hồng sen / Bright Magenta)',
    },

    path1GroupLabel: {
      type: 'text',
      label: 'Thẻ 1: Nhãn nhóm (VD: CHO CÁ NHÂN)',
    },
    path1Title: {
      type: 'text',
      label: 'Thẻ 1: Tiêu đề',
    },
    path1Description: {
      type: 'textarea',
      label: 'Thẻ 1: Đoạn văn mô tả',
    },
    path1ButtonLabel: {
      type: 'text',
      label: 'Thẻ 1: Chữ trên nút',
    },
    path1LinkType: {
      type: 'select',
      label: 'Thẻ 1: Loại liên kết',
      options: [
        { label: 'Liên kết ngoài / Tự nhập URL', value: 'url' },
        { label: 'Trang trong website', value: 'page' },
      ],
    },
    path1PageId: createPageExternalField({
      label: 'Thẻ 1: Chọn trang trong website',
    }),
    path1Href: {
      type: 'text',
      label: 'Thẻ 1: Đường dẫn liên kết (khi chọn Tự nhập URL)',
    },
    path1ButtonStyle: {
      type: 'select',
      label: 'Thẻ 1: Kiểu nút bấm',
      options: [
        { label: 'Màu khối nổi bật (Solid / Primary)', value: 'solid' },
        { label: 'Viền nét thanh thoát (Outline / Ghost)', value: 'outline' },
      ],
    },

    path2GroupLabel: {
      type: 'text',
      label: 'Thẻ 2: Nhãn nhóm (VD: CHO DOANH NGHIỆP)',
    },
    path2Title: {
      type: 'text',
      label: 'Thẻ 2: Tiêu đề',
    },
    path2Description: {
      type: 'textarea',
      label: 'Thẻ 2: Đoạn văn mô tả',
    },
    path2ButtonLabel: {
      type: 'text',
      label: 'Thẻ 2: Chữ trên nút',
    },
    path2LinkType: {
      type: 'select',
      label: 'Thẻ 2: Loại liên kết',
      options: [
        { label: 'Liên kết ngoài / Tự nhập URL', value: 'url' },
        { label: 'Trang trong website', value: 'page' },
      ],
    },
    path2PageId: createPageExternalField({
      label: 'Thẻ 2: Chọn trang trong website',
    }),
    path2Href: {
      type: 'text',
      label: 'Thẻ 2: Đường dẫn liên kết (khi chọn Tự nhập URL)',
    },
    path2ButtonStyle: {
      type: 'select',
      label: 'Thẻ 2: Kiểu nút bấm',
      options: [
        { label: 'Màu khối nổi bật (Solid / Primary)', value: 'solid' },
        { label: 'Viền nét thanh thoát (Outline / Ghost)', value: 'outline' },
      ],
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
    seriesLabel: '[MẪU] ĐỒNG HÀNH',
    titleLine1: '[MẪU] CHỌN LỘ TRÌNH',
    titleLine2: '[MẪU] PHÙ HỢP VỚI BẠN',

    path1GroupLabel: '[MẪU] CHO CÁ NHÂN',
    path1Title: '[MẪU] COACHING 1:1 & PHÁT TRIỂN EQ',
    path1Description:
      '[MẪU] Dành cho cá nhân muốn thấu hiểu cảm xúc, gỡ bỏ rào cản tâm lý và kiến tạo sự nghiệp thăng hoa.',
    path1ButtonLabel: '[MẪU] Khám phá lộ trình cá nhân',
    path1LinkType: 'url',
    path1PageId: '',
    path1Href: '/coaching',
    path1ButtonStyle: 'solid',

    path2GroupLabel: '[MẪU] CHO DOANH NGHIỆP',
    path2Title: '[MẪU] ĐÀO TẠO & WORKSHOP EQ',
    path2Description:
      '[MẪU] Đồng hành cùng tổ chức xây dựng văn hóa thấu cảm, gắn kết đội ngũ và gia tăng hiệu suất bền vững.',
    path2ButtonLabel: '[MẪU] Giải pháp doanh nghiệp',
    path2LinkType: 'url',
    path2PageId: '',
    path2Href: '/doanh-nghiep',
    path2ButtonStyle: 'outline',

    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: ({ puck: _puck, ...props }) => <TwoPathCards {...props} />,
}
