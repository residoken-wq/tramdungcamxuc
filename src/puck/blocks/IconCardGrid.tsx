import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { IconCardGrid, type IconCardGridProps } from '@/components/site/IconCardGrid'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS, GRID_CARD_ALIGN_OPTIONS } from '../constants'
import { vi } from '@/lib/i18n/vi'

export type { IconCardGridProps }

export const IconCardGridBlock: ComponentConfig<IconCardGridProps> = {
  label: 'Lưới Thẻ Biểu Tượng / Đánh Số (Icon Card Grid)',
  fields: {
    seriesLabel: {
      type: 'text',
      label: vi.eb15a?.seriesLabel || 'Nhãn series',
    },
    titleLine1: {
      type: 'text',
      label: vi.eb15a?.titleLine1 || 'Tiêu đề dòng 1',
    },
    titleLine2: {
      type: 'text',
      label: vi.eb15a?.titleLine2 || 'Tiêu đề dòng 2',
    },
    emotionLine: {
      type: 'textarea',
      label: vi.eb15a?.emotionLine || 'Dòng cảm xúc',
    },
    titleCase: {
      type: 'select',
      label: 'Kiểu chữ tiêu đề',
      options: [
        { label: 'Chữ in hoa (UPPERCASE)', value: 'upper' },
        { label: 'Giữ nguyên chữ thường (Title case)', value: 'none' },
      ],
    },
    showAccentBar: {
      type: 'radio',
      label: 'Vạch hồng gạch dưới tiêu đề',
      options: [
        { label: 'Không', value: false },
        { label: 'Có', value: true },
      ],
    },
    headerAlign: {
      type: 'select',
      label: 'Căn lề tiêu đề',
      options: [
        { label: 'Căn giữa (Center)', value: 'center' },
        { label: 'Căn trái (Left)', value: 'left' },
      ],
    },
    bottomQuote: {
      type: 'textarea',
      label: 'Dòng đúc kết nghiêng cuối (Playfair Display)',
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
        { label: vi.pk26?.iconCardGrid?.columns5 || '5 cột (Desktop)', value: 5 },
        {
          label: vi.pk21?.iconCardGrid?.columns?.carousel || 'Trượt ngang (Carousel)',
          value: 'carousel',
        },
      ],
    },
    connector: {
      type: 'select',
      label: vi.pk26?.iconCardGrid?.connector || 'Đường nối giữa các thẻ',
      options: [
        { label: vi.pk26?.iconCardGrid?.connectorNone || 'Không có đường nối', value: 'none' },
        {
          label: vi.pk26?.iconCardGrid?.connectorArrow || 'Mũi tên sang phải (Desktop)',
          value: 'arrow',
        },
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
    cardAlign: {
      type: 'select',
      label: vi.eb15b?.gridCardAlign || 'Căn lề tất cả thẻ',
      options: [...GRID_CARD_ALIGN_OPTIONS],
    },
    equalHeight: {
      type: 'radio',
      label: vi.cd02?.iconCardGrid?.equalHeight || 'Chiều cao các thẻ bằng nhau',
      options: [
        { label: 'Tự động theo nội dung (Mặc định)', value: false },
        { label: 'Bằng nhau (Đầy đủ hàng)', value: true },
      ],
    },
    arrowPosition: {
      type: 'radio',
      label: vi.cd04?.arrowPosition?.label || 'Vị trí mũi tên',
      options: [
        { label: vi.cd04?.arrowPosition?.top || 'Góc trên (Mặc định)', value: 'top' },
        { label: vi.cd04?.arrowPosition?.sides || 'Hai bên (Giữa hàng)', value: 'sides' },
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
    connector: 'none',
    cardStyle: 'white',
    cardAlign: 'inherit',
    equalHeight: false,
    arrowPosition: 'top',
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
  // `puck` carries functions (renderDropZone) that cannot cross into a client component.
  render: ({ puck, ...props }) => (
    <IconCardGrid {...props} puck={{ isEditing: puck?.isEditing ?? false }} />
  ),
}
