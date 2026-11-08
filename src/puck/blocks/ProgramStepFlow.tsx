import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { ProgramStepFlow, type ProgramStepFlowProps } from '@/components/site/ProgramStepFlow'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { vi } from '@/lib/i18n/vi'

export type { ProgramStepFlowProps }

export const ProgramStepFlowBlock: ComponentConfig<ProgramStepFlowProps> = {
  label: vi.pk28?.programStepFlow?.label || 'Lộ trình chặng có mũi tên & Mang về (Program Step Flow)',
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
    takeawayTone: {
      type: 'select',
      label: 'Tông màu hộp Mang về',
      options: [
        { label: 'Vàng bơ (Butter Cream)', value: 'butter-cream' },
        { label: 'Hồng phấn (Soft Pink)', value: 'soft-pink' },
        { label: 'Xanh bạc hà (Mint Haze)', value: 'mint-haze' },
      ],
    },
    steps: {
      type: 'array',
      label: '3 thẻ chặng lộ trình',
      getItemSummary: (it: { eyebrow?: string; title?: string }) =>
        `${it?.eyebrow || ''} · ${it?.title || ''}`.trim() || 'Chặng',
      arrayFields: {
        eyebrow: { type: 'text', label: 'Nhãn chặng (VD: CHẶNG 1 · HIỂU)' },
        title: { type: 'text', label: 'Tiêu đề chặng' },
        subtitle: { type: 'text', label: 'Phụ đề / Dòng nhỏ' },
        chip: { type: 'text', label: 'Huy hiệu chip (VD: Workshop 1)' },
        description: { type: 'textarea', label: 'Đoạn văn mô tả' },
        bullets: {
          type: 'array',
          label: 'Các gạch đầu dòng (nếu có)',
          getItemSummary: (it: string) => it || 'Mục',
          arrayFields: {
            text: { type: 'text', label: 'Nội dung' },
          },
        },
        takeawayTitle: { type: 'text', label: 'Tiêu đề hộp mang về (mặc định: Mang về)' },
        takeawayText: { type: 'textarea', label: 'Nội dung hộp mang về' },
      },
    },
    bottomStripLeftLabel: { type: 'text', label: 'Nhãn dải dưới bên trái' },
    bottomStripLeftText: { type: 'textarea', label: 'Nội dung dải dưới bên trái' },
    bottomStripRightText: { type: 'textarea', label: 'Nội dung dải dưới bên phải (viền nét đứt)' },
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
    seriesLabel: '[MẪU] CHƯƠNG TRÌNH 01 · HABIT FORMATION',
    title: '[MẪU] Xây thói quen - Dựng thương hiệu',
    showAccentBar: true,
    emotionLine: '[MẪU] Sống điều mình muốn được biết đến · lộ trình HIỂU – THỬ – SỐNG',
    takeawayTone: 'butter-cream',
    steps: [
      {
        eyebrow: '[MẪU] CHẶNG 1 · HIỂU',
        title: '[MẪU] Workshop 1 · 90 phút',
        subtitle: '[MẪU] Habit Loop & bốn quy luật',
        bullets: [
          '[MẪU] Tín hiệu → làm cho rõ ràng',
          '[MẪU] Khao khát → làm cho hấp dẫn',
          '[MẪU] Hành động → làm cho dễ dàng',
          '[MẪU] Phần thưởng → làm cho thỏa mãn',
        ],
        takeawayTitle: '[MẪU] Mang về',
        takeawayText:
          '[MẪU] Hiểu cách thói quen vận hành và hướng dẫn tự trải nghiệm xây dựng thói quen',
      },
      {
        eyebrow: '[MẪU] CHẶNG 2 · THỬ',
        title: '[MẪU] Workshop 2 · 90 phút',
        subtitle: '[MẪU] NAME – MATCH – ACT – REFINE',
        bullets: [
          '[MẪU] Gọi tên hành vi, mức tối thiểu',
          '[MẪU] Chọn công cụ hợp điểm kẹt',
          '[MẪU] Điền Habit Plan, làm thử',
          '[MẪU] Chỉnh khi bận hoặc mệt',
        ],
        takeawayTitle: '[MẪU] Mang về',
        takeawayText: '[MẪU] Bản Habit Plan và công cụ theo dõi trong 28 ngày',
      },
      {
        eyebrow: '[MẪU] CHẶNG 3 · SỐNG',
        title: '[MẪU] 28 ngày + 4 reflection',
        subtitle: '[MẪU] Thực hành có đồng hành',
        bullets: [
          '[MẪU] Tuần 1: bắt đầu, quan sát',
          '[MẪU] Tuần 2: chỉnh cho hợp mình',
          '[MẪU] Tuần 3: giữ nhịp, quay lại',
          '[MẪU] Tuần 4: nhận diện giá trị',
        ],
        takeawayTitle: '[MẪU] Mang về',
        takeawayText: '[MẪU] Một thói quen của riêng mình và cách tiếp nối',
      },
    ],
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: (props) => <ProgramStepFlow {...props} />,
}
