import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { ProgramWishes, type ProgramWishesProps } from '@/components/site/ProgramWishes'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { vi } from '@/lib/i18n/vi'

export type { ProgramWishesProps }

export const ProgramWishesBlock: ComponentConfig<ProgramWishesProps> = {
  label: vi.pk28?.programWishes?.label || 'Khối mong muốn & xu hướng (Program Wishes & Callout)',
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
    topQuote: { type: 'textarea', label: 'Dòng trích dẫn nghiêng phía trên (Playfair Display)' },
    cards: {
      type: 'array',
      label: '4 thẻ chương trình / giai đoạn',
      getItemSummary: (it: { label?: string; title?: string }) =>
        `${it?.label || ''} · ${it?.title || ''}`.trim() || 'Thẻ',
      arrayFields: {
        tone: {
          type: 'select',
          label: 'Màu nền thẻ',
          options: [
            { label: 'Vàng bơ (Butter Cream)', value: 'butter-cream' },
            { label: 'Hồng phấn (Soft Pink)', value: 'soft-pink' },
            { label: 'Xanh bạc hà (Mint Haze)', value: 'mint-haze' },
            { label: 'Xanh thẫm (Deep Navy, chữ trắng)', value: 'deep-navy' },
          ],
        },
        label: { type: 'text', label: 'Nhãn nhỏ (VD: Chương trình 01, Phase 2)' },
        title: { type: 'text', label: 'Tiêu đề thẻ' },
        text: { type: 'textarea', label: 'Mô tả nội dung thẻ' },
      },
    },
    calloutTitle: { type: 'text', label: 'Tiêu đề dải callout dưới (VD: XU HƯỚNG ĐẾN 2030)' },
    calloutText: { type: 'textarea', label: 'Nội dung dải callout dưới' },
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
    seriesLabel: '[MẪU] 04 · MONG MUỐN THẬT SỰ',
    title: '[MẪU] Bước tiếp cùng AI, mà vẫn là chính mình',
    showAccentBar: true,
    topQuote:
      '[MẪU] “Mình muốn thay đổi — nhưng không muốn đánh mất sự bình an và chính mình.”',
    cards: [
      {
        tone: 'butter-cream',
        label: '[MẪU] Chương trình 01',
        title: '[MẪU] Bền bỉ với mình',
        text: '[MẪU] Học và thích nghi đều đặn bằng những hành động nhỏ, bền bỉ.',
      },
      {
        tone: 'soft-pink',
        label: '[MẪU] Chương trình 02',
        title: '[MẪU] Vững chãi từ bên trong',
        text: '[MẪU] Bình an trước thay đổi, không bị nỗi lo đào thải dẫn dắt.',
      },
      {
        tone: 'mint-haze',
        label: '[MẪU] Chương trình 03',
        title: '[MẪU] Hài hòa với người',
        text: '[MẪU] Lắng nghe, thuyết phục, kết nối — điều AI khó làm thay.',
      },
      {
        tone: 'deep-navy',
        label: '[MẪU] Phase 2',
        title: '[MẪU] Vững vàng với nghề',
        text: '[MẪU] Rõ thế mạnh, giá trị và hướng đi tiếp theo trong sự nghiệp.',
      },
    ],
    calloutTitle: '[MẪU] XU HƯỚNG ĐẾN 2030',
    calloutText:
      '[MẪU] Bên cạnh AI, sự bền bỉ, linh hoạt, tò mò và học suốt đời là những kỹ năng đang tăng tầm quan trọng. — WEF, Future of Jobs 2025',
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: (props) => <ProgramWishes {...props} />,
}
