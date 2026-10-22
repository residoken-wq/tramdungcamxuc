import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { IconCardGrid, type IconCardGridProps } from '@/components/site/IconCardGrid'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'

export type { IconCardGridProps }

export const IconCardGridBlock: ComponentConfig<IconCardGridProps> = {
  label: 'Lưới Thẻ Biểu Tượng / Đánh Số (Icon Card Grid)',
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
    emotionLine: {
      type: 'textarea',
      label: 'Dòng cảm xúc (Playfair Display Italic)',
    },
    marker: {
      type: 'select',
      label: 'Kiểu đánh dấu thẻ',
      options: [
        { label: 'Biểu tượng thương hiệu (Icon)', value: 'icon' },
        { label: 'Đánh số thứ tự (01, 02...)', value: 'number' },
      ],
    },
    columns: {
      type: 'select',
      label: 'Số cột hiển thị (Desktop)',
      options: [
        { label: '1 cột', value: 1 },
        { label: '2 cột', value: 2 },
        { label: '3 cột', value: 3 },
        { label: '4 cột', value: 4 },
      ],
    },
    cardStyle: {
      type: 'select',
      label: 'Kiểu dáng thẻ',
      options: [
        { label: 'Nền trắng (White)', value: 'white' },
        { label: 'Nền hồng phấn (Soft Pink)', value: 'soft' },
        { label: 'Viền nét (Outline)', value: 'outline' },
      ],
    },
    cards: {
      type: 'slot',
      label: 'Danh sách thẻ',
      allow: ['Card'],
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
    seriesLabel: '[MẪU] DÀNH CHO BẠN',
    titleLine1: '[MẪU] BẠN ĐANG Ở GIAI ĐOẠN NÀO',
    titleLine2: '[MẪU] TRONG HÀNH TRÌNH CẢM XÚC?',
    emotionLine: '[MẪU] Mỗi bước đi đều là một nhịp chuyển mình đáng quý.',
    marker: 'icon',
    columns: 3,
    cardStyle: 'white',
    cards: [
      {
        type: 'Card',
        props: {
          icon: 'target',
          title: '[MẪU] Nhận diện & Gọi tên',
          text: '[MẪU] Dừng lại để nhận diện rõ cảm xúc hiện tại mà không phán xét hay né tránh.',
          titleColor: 'deep-navy',
          textColor: 'deep-navy',
          titleSize: 'md',
          textSize: 'md',
          align: 'left',
        },
      },
      {
        type: 'Card',
        props: {
          icon: 'star',
          title: '[MẪU] Thấu hiểu căn nguyên',
          text: '[MẪU] Lắng nghe nhu cầu ẩn sau cảm xúc để tìm ra nguyên nhân sâu xa cốt lõi.',
          titleColor: 'deep-navy',
          textColor: 'deep-navy',
          titleSize: 'md',
          textSize: 'md',
          align: 'left',
        },
      },
      {
        type: 'Card',
        props: {
          icon: 'heart',
          title: '[MẪU] Chuyển mình bền bỉ',
          text: '[MẪU] Thiết lập hành động nhỏ hàng ngày để nuôi dưỡng sự bình an và tự tin.',
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
  render: (props) => <IconCardGrid {...props} />,
}
