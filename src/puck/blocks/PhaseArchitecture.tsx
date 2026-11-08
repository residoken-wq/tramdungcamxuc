import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { PhaseArchitecture, type PhaseArchitectureProps } from '@/components/site/PhaseArchitecture'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { vi } from '@/lib/i18n/vi'

export type { PhaseArchitectureProps }

export const PhaseArchitectureBlock: ComponentConfig<PhaseArchitectureProps> = {
  label: vi.pk28?.phaseArchitecture?.label || 'Kiến trúc hai giai đoạn (Phase 1 → Phase 2)',
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
    phase1Label: { type: 'text', label: 'Nhãn khối Phase 1' },
    phase1Title: { type: 'text', label: 'Tiêu đề khối Phase 1' },
    phase1Items: {
      type: 'array',
      label: 'Các dòng màu trong Phase 1',
      getItemSummary: (it: { title?: string }) => it?.title || 'Dòng',
      arrayFields: {
        tone: {
          type: 'select',
          label: 'Màu nền dòng',
          options: [
            { label: 'Vàng bơ (Butter Cream)', value: 'butter-cream' },
            { label: 'Hồng phấn (Soft Pink)', value: 'soft-pink' },
            { label: 'Xanh bạc hà (Mint Haze)', value: 'mint-haze' },
          ],
        },
        title: { type: 'text', label: 'Tiêu đề dòng (in đậm)' },
        text: { type: 'textarea', label: 'Mô tả dòng' },
      },
    },
    phase2Label: { type: 'text', label: 'Nhãn khối Phase 2' },
    phase2Title: { type: 'text', label: 'Tiêu đề khối Phase 2' },
    phase2Subtitle: { type: 'text', label: 'Phụ đề nghiêng Phase 2 (Playfair Display)' },
    phase2Text: { type: 'textarea', label: 'Mô tả nội dung Phase 2' },
    phase2Chip: { type: 'text', label: 'Huy hiệu viền nét đứt (VD: Thông qua lộ trình...)' },
    noteBoxLabel: { type: 'text', label: 'Nhãn hộp ghi chú dưới (VD: VÌ SAO...)' },
    noteBoxText: { type: 'textarea', label: 'Nội dung hộp ghi chú dưới' },
    bottomQuote: { type: 'textarea', label: 'Dòng đúc kết nghiêng cuối (Playfair Display)' },
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
    seriesLabel: '[MẪU] 05 · KIẾN TRÚC CHƯƠNG TRÌNH',
    title: '[MẪU] Hai phase: xây nền trước, định hướng sau',
    showAccentBar: true,
    phase1Label: '[MẪU] PHASE 1 · HÔM NAY',
    phase1Title: '[MẪU] Nền tảng chuyển mình',
    phase1Items: [
      {
        tone: 'butter-cream',
        title: '[MẪU] 01 · Xây thói quen – Dựng thương hiệu',
        text: '[MẪU] Bền bỉ trong hành động · Tự tin với mình',
      },
      {
        tone: 'soft-pink',
        title: '[MẪU] 02 · Tập thương cảm xúc',
        text: '[MẪU] Vững chãi từ bên trong',
      },
      {
        tone: 'mint-haze',
        title: '[MẪU] 03 · Giao tiếp hài hòa nam tính – nữ tính',
        text: '[MẪU] Hài hòa với người',
      },
    ],
    phase2Label: '[MẪU] PHASE 2 · TIẾP THEO',
    phase2Title: '[MẪU] Career Clarity',
    phase2Subtitle: '[MẪU] Thông suốt sự nghiệp · Vững vàng với nghề',
    phase2Text:
      '[MẪU] Hiểu mình rõ hơn, nhận ra thế mạnh và định hướng rõ bước tiếp theo trong sự nghiệp.',
    phase2Chip: '[MẪU] Thông qua lộ trình Hướng nghiệp và Khai vấn 1:1',
    noteBoxLabel: '[MẪU] VÌ SAO CAREER CLARITY ĐI SAU',
    noteBoxText:
      '[MẪU] Khi đã có nhịp hành động, nền cảm xúc vững và cách giao tiếp hài hòa, lựa chọn nghề nghiệp mới đủ rõ để bước và đủ bền để đi tiếp.',
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: (props) => <PhaseArchitecture {...props} />,
}
