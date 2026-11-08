import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { PillarCardGrid, type PillarCardGridProps } from '@/components/site/PillarCardGrid'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { vi } from '@/lib/i18n/vi'

export type { PillarCardGridProps }

export const PillarCardGridBlock: ComponentConfig<PillarCardGridProps> = {
  label: vi.pk28?.pillarCardGrid?.label || 'Lưới thẻ trụ cột pastel (Pillar Cards Grid)',
  fields: {
    seriesLabel: { type: 'text', label: 'Nhãn series' },
    title: { type: 'text', label: 'Tiêu đề chính' },
    showAccentBar: {
      type: 'radio',
      label: 'Vạch hồng gạch dưới tiêu đề',
      options: [
        { label: 'Không', value: false },
        { label: 'Có', value: true },
      ],
    },
    emotionLine: { type: 'textarea', label: 'Dòng cảm xúc dưới tiêu đề (Playfair Display)' },
    cards: {
      type: 'array',
      label: 'Danh sách thẻ',
      getItemSummary: (it: { label?: string }) => it?.label || 'Thẻ',
      arrayFields: {
        tone: {
          type: 'select',
          label: 'Màu nền thẻ',
          options: [
            { label: 'Vàng bơ (Butter Cream)', value: 'butter-cream' },
            { label: 'Hồng phấn (Soft Pink)', value: 'soft-pink' },
            { label: 'Xanh bạc hà (Mint Haze)', value: 'mint-haze' },
            { label: 'Tím nhạt (Lavender Mist)', value: 'lavender-mist' },
          ],
        },
        label: { type: 'text', label: 'Nhãn thẻ (VD: TRONG HÀNH ĐỘNG, 01 · HÀNH ĐỘNG)' },
        hasAccentBar: {
          type: 'radio',
          label: 'Vạch hồng bên trái nhãn',
          options: [
            { label: 'Không', value: false },
            { label: 'Có', value: true },
          ],
        },
        items: {
          type: 'array',
          label: 'Các mục (Tiêu đề đậm & Mô tả)',
          getItemSummary: (it: { title?: string }) => it?.title || 'Mục',
          arrayFields: {
            title: { type: 'text', label: 'Tiêu đề mục (In đậm)' },
            text: { type: 'textarea', label: 'Mô tả mục' },
          },
        },
      },
    },
    bottomQuote: {
      type: 'textarea',
      label: 'Dòng đúc kết nghiêng cuối (Playfair Display)',
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
    seriesLabel: '[MẪU] 03 · NỖI ĐAU',
    title: '[MẪU] Ba kiểu chênh vênh khi AI đổi luật chơi',
    showAccentBar: true,
    emotionLine: '',
    cards: [
      {
        tone: 'butter-cream',
        label: '[MẪU] TRONG HÀNH ĐỘNG',
        hasAccentBar: false,
        items: [
          {
            title: '[MẪU] Học lại mà không duy trì nổi',
            text: '[MẪU] Khóa học mua rồi để đó; việc và nhà cuốn đi hết.',
          },
          {
            title: '[MẪU] Giá trị của mình mờ đi',
            text: '[MẪU] Việc mình giỏi, AI làm nhanh hơn — mình còn khác biệt ở đâu?',
          },
          {
            title: '[MẪU] Thấy người khác bứt tốc',
            text: '[MẪU] Đồng nghiệp đã dùng AI, đã có tiếng nói riêng; mình đứng yên.',
          },
        ],
      },
      {
        tone: 'soft-pink',
        label: '[MẪU] TRONG CẢM XÚC',
        hasAccentBar: false,
        items: [
          {
            title: '[MẪU] Lo bị đào thải',
            text: '[MẪU] Mỗi tin cắt giảm, mỗi công cụ mới lại một lần chao đảo.',
          },
          {
            title: '[MẪU] So sánh, tự nghi ngờ',
            text: '[MẪU] “Mình có đang tụt lại không?” vang lên mỗi lần lướt mạng.',
          },
          {
            title: '[MẪU] Mệt mà không dám dừng',
            text: '[MẪU] Sợ dừng lại là bị bỏ lại, nên cứ gồng.',
          },
        ],
      },
      {
        tone: 'mint-haze',
        label: '[MẪU] TRONG GIAO TIẾP',
        hasAccentBar: false,
        items: [
          {
            title: '[MẪU] Khó nói ra giá trị mình',
            text: '[MẪU] Khi AI viết thay báo cáo, cách mình nói và kết nối mới là khác biệt.',
          },
          {
            title: '[MẪU] Lúc quá cứng, lúc quá mềm',
            text: '[MẪU] Chưa tìm được giọng vừa rõ vừa ấm.',
          },
          {
            title: '[MẪU] Ngại lên tiếng, đề xuất',
            text: '[MẪU] Không dám hỏi, đàm phán hay xin một vai trò mới.',
          },
        ],
      },
    ],
    bottomQuote:
      '[MẪU] Gốc chung: luật chơi đổi nhanh hơn NỘI LỰC bên trong mỗi chúng ta.',
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: (props) => <PillarCardGrid {...props} />,
}
