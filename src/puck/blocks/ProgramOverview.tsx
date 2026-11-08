import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { ProgramOverview, type ProgramOverviewProps } from '@/components/site/ProgramOverview'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { vi } from '@/lib/i18n/vi'

export type { ProgramOverviewProps }

export const ProgramOverviewBlock: ComponentConfig<ProgramOverviewProps> = {
  label: vi.pk28?.programOverview?.label || 'Mô hình tổng thể 3 trụ cột (Program Overview)',
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
    topStripLabel: { type: 'text', label: 'Nhãn dải tím trên cùng (VD: NỀN TẢNG CHUNG)' },
    topStripText: { type: 'textarea', label: 'Nội dung dải tím trên cùng' },
    pillars: {
      type: 'array',
      label: '3 thẻ trụ cột',
      getItemSummary: (it: { pillarNumber?: string; title?: string }) =>
        `${it?.pillarNumber || ''} · ${it?.title || ''}`.trim() || 'Trụ cột',
      arrayFields: {
        tone: {
          type: 'select',
          label: 'Màu nền thẻ',
          options: [
            { label: 'Vàng bơ (Butter Cream)', value: 'butter-cream' },
            { label: 'Hồng phấn (Soft Pink)', value: 'soft-pink' },
            { label: 'Xanh bạc hà (Mint Haze)', value: 'mint-haze' },
          ],
        },
        pillarNumber: { type: 'text', label: 'Số thứ tự trụ cột (VD: TRỤ CỘT 01)' },
        title: { type: 'text', label: 'Tiêu đề trụ cột' },
        subtitleItalic: { type: 'text', label: 'Dòng nghiêng hồng (Playfair Display)' },
        stepsText: { type: 'text', label: 'Các bước in hoa (VD: HIỂU → THỬ → SỐNG)' },
      },
    },
    middleStripLabel: { type: 'text', label: 'Nhãn dải viền đứt giữa (VD: NHỊP ĐIỆU TRIỂN KHAI)' },
    middleStripText: { type: 'textarea', label: 'Nội dung dải viền đứt giữa' },
    bottomStripLabel: { type: 'text', label: 'Nhãn dải xanh thẫm dưới (VD: SẴN SÀNG...)' },
    bottomStripText: { type: 'textarea', label: 'Nội dung dải xanh thẫm dưới' },
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
    seriesLabel: '[MẪU] 08 · MÔ HÌNH TỔNG THỂ',
    title: '[MẪU] Một nền tảng chung, ba trụ cột chuyển mình',
    showAccentBar: true,
    topStripLabel: '[MẪU] NỀN TẢNG CHUNG',
    topStripText:
      '[MẪU] Dành cho phụ nữ công sở · Học qua trải nghiệm thật · Cam kết vừa sức · Tôn trọng mức chia sẻ',
    pillars: [
      {
        tone: 'butter-cream',
        pillarNumber: '[MẪU] TRỤ CỘT 01',
        title: '[MẪU] Xây thói quen – Dựng thương hiệu',
        subtitleItalic: '[MẪU] Bền bỉ trong hành động',
        stepsText: '[MẪU] HIỂU → THỬ → SỐNG',
      },
      {
        tone: 'soft-pink',
        pillarNumber: '[MẪU] TRỤ CỘT 02',
        title: '[MẪU] Tập thương cảm xúc',
        subtitleItalic: '[MẪU] Vững chãi từ bên trong',
        stepsText: '[MẪU] HIỂU → GỌI TÊN → ĐÓN NHẬN & ĐIỀU HÒA',
      },
      {
        tone: 'mint-haze',
        pillarNumber: '[MẪU] TRỤ CỘT 03',
        title: '[MẪU] Giao tiếp hài hòa nam tính – nữ tính',
        subtitleItalic: '[MẪU] Hài hòa với người',
        stepsText: '[MẪU] HIỂU → CÂN BẰNG → THỂ HIỆN',
      },
    ],
    middleStripLabel: '[MẪU] NHỊP ĐIỆU TRIỂN KHAI',
    middleStripText:
      '[MẪU] 2 workshop · 28 ngày · 4 lần nhìn lại — giữ thay đổi ở lại sau buổi học',
    bottomStripLabel: '[MẪU] SẴN SÀNG CHO GIAI ĐOẠN 2',
    bottomStripText:
      '[MẪU] Career Clarity – Thông suốt sự nghiệp · định hướng bước tiếp theo trên nền đã vững',
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: (props) => <ProgramOverview {...props} />,
}
