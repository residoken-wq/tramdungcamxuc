import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { JourneyMilestones, type JourneyMilestonesProps } from '@/components/site/JourneyMilestones'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { vi } from '@/lib/i18n/vi'

export type { JourneyMilestonesProps }

export const JourneyMilestonesBlock: ComponentConfig<JourneyMilestonesProps> = {
  label: vi.pk28?.journeyMilestones?.label || 'Hành trình chuyển hóa & Các mốc (Journey Milestones)',
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
    topStats: {
      type: 'array',
      label: '3 thẻ con số lớn hàng trên',
      getItemSummary: (it: { number?: string; title?: string }) =>
        `${it?.number || ''} · ${it?.title || ''}`.trim() || 'Con số',
      arrayFields: {
        number: { type: 'text', label: 'Con số lớn (VD: 2, 28, 4)' },
        title: { type: 'text', label: 'Tiêu đề (in đậm)' },
        description: { type: 'textarea', label: 'Mô tả nội dung' },
      },
    },
    group1Title: { type: 'text', label: 'Tiêu đề nhóm 1 (VD: TRƯỚC NGÀY 1)' },
    group1Cards: {
      type: 'array',
      label: 'Các thẻ nhóm 1 (nền tím sương)',
      getItemSummary: (it: { title?: string }) => it?.title || 'Thẻ',
      arrayFields: {
        title: { type: 'text', label: 'Tiêu đề thẻ' },
        subtitle: { type: 'text', label: 'Dòng phụ (VD: 90 phút · online)' },
      },
    },
    group2Title: { type: 'text', label: 'Tiêu đề nhóm 2 (VD: 28 NGÀY THỰC HÀNH CÓ ĐỒNG HÀNH)' },
    group2Cards: {
      type: 'array',
      label: 'Các thẻ nhóm 2 (nền trắng)',
      getItemSummary: (it: { title?: string }) => it?.title || 'Thẻ',
      arrayFields: {
        title: { type: 'text', label: 'Tiêu đề thẻ (VD: Tuần 1)' },
        subtitle: { type: 'text', label: 'Dòng phụ (VD: Reflection ngày 7)' },
      },
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
    seriesLabel: '[MẪU] 09 · CÁCH TRIỂN KHAI',
    title: '[MẪU] HÀNH TRÌNH CHUYỂN HÓA',
    showAccentBar: true,
    topStats: [
      {
        number: '[MẪU] 2',
        title: '[MẪU] Workshop online',
        description: '[MẪU] 90 phút/buổi, diễn ra trước ngày 1',
      },
      {
        number: '[MẪU] 28',
        title: '[MẪU] Ngày thực hành',
        description: '[MẪU] Theo kế hoạch cá nhân, nhịp của riêng mình',
      },
      {
        number: '[MẪU] 4',
        title: '[MẪU] Lần reflection',
        description: '[MẪU] Hằng tuần, đề xuất 60 phút/buổi',
      },
    ],
    group1Title: '[MẪU] TRƯỚC NGÀY 1',
    group1Cards: [
      { title: '[MẪU] Workshop 1', subtitle: '[MẪU] 90 phút · online' },
      { title: '[MẪU] Workshop 2', subtitle: '[MẪU] 90 phút · online' },
    ],
    group2Title: '[MẪU] 28 NGÀY THỰC HÀNH CÓ ĐỒNG HÀNH',
    group2Cards: [
      { title: '[MẪU] Tuần 1', subtitle: '[MẪU] Reflection ngày 7' },
      { title: '[MẪU] Tuần 2', subtitle: '[MẪU] Reflection ngày 14' },
      { title: '[MẪU] Tuần 3', subtitle: '[MẪU] Reflection ngày 21' },
      { title: '[MẪU] Tuần 4', subtitle: '[MẪU] Ngày 28 · tổng kết' },
    ],
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: (props) => <JourneyMilestones {...props} />,
}
