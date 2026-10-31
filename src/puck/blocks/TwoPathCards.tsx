import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { TwoPathCards, type TwoPathCardsProps } from '@/components/site/TwoPathCards'
import { BRAND_COLOR_OPTIONS, FONT_SIZE_OPTIONS, PADDING_OPTIONS } from '../constants'

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
      contentEditable: true,
    },
    titleLine2: {
      type: 'text',
      label: 'Tiêu đề dòng 2 (Hồng sen / Bright Magenta)',
      contentEditable: true,
    },

    titleSize: {
      type: 'select',
      label: 'Cỡ chữ tiêu đề',
      options: [...FONT_SIZE_OPTIONS],
    },
    paths: {
      type: 'slot',
      label: 'Các thẻ lối đi (kéo thả để đổi thứ tự)',
      allow: ['PathCard'],
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
    version: 2,
    seriesLabel: '[MẪU] ĐỒNG HÀNH',
    titleLine1: '[MẪU] CHỌN LỘ TRÌNH',
    titleLine2: '[MẪU] PHÙ HỢP VỚI BẠN',

    titleSize: 'md',
    paths: [
      {
        type: 'PathCard',
        props: {
          version: 1,
          groupLabel: '[MẪU] CHO CÁ NHÂN',
          title: '[MẪU] COACHING 1:1 & PHÁT TRIỂN EQ',
          description:
            '[MẪU] Dành cho cá nhân muốn thấu hiểu cảm xúc, gỡ bỏ rào cản tâm lý và kiến tạo sự nghiệp thăng hoa.',
          buttonLabel: '[MẪU] Khám phá lộ trình cá nhân',
          linkType: 'url',
          pageId: '',
          href: '/coaching',
          buttonStyle: 'solid',
          labelColor: 'deep-navy',
          titleColor: 'deep-navy',
          textColor: 'deep-navy',
          titleSize: 'md',
          textSize: 'md',
          align: 'left',
        },
      },
      {
        type: 'PathCard',
        props: {
          version: 1,
          groupLabel: '[MẪU] CHO DOANH NGHIỆP',
          title: '[MẪU] ĐÀO TẠO & WORKSHOP EQ',
          description:
            '[MẪU] Đồng hành cùng tổ chức xây dựng văn hóa thấu cảm, gắn kết đội ngũ và gia tăng hiệu suất bền vững.',
          buttonLabel: '[MẪU] Giải pháp doanh nghiệp',
          linkType: 'url',
          pageId: '',
          href: '/doanh-nghiep',
          buttonStyle: 'outline',
          labelColor: 'deep-navy',
          titleColor: 'deep-navy',
          textColor: 'deep-navy',
          titleSize: 'md',
          textSize: 'md',
          align: 'left',
        },
      },
    ],

    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: ({ puck: _puck, ...props }) => <TwoPathCards {...props} />,
}
