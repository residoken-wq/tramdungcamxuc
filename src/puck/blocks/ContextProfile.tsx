import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { ContextProfile, type ContextProfileProps } from '@/components/site/ContextProfile'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { vi } from '@/lib/i18n/vi'

export type { ContextProfileProps }

export const ContextProfileBlock: ComponentConfig<ContextProfileProps> = {
  label: vi.pk28?.contextProfile?.label || 'Khối bối cảnh & chân dung (Context & Profile)',
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
    statCards: {
      type: 'array',
      label: 'Danh sách thẻ con số (cột trái)',
      getItemSummary: (it: { stat?: string }) => it?.stat || 'Con số',
      arrayFields: {
        stat: { type: 'text', label: 'Con số lớn (VD: 39%, 3X)' },
        text: { type: 'textarea', label: 'Mô tả con số (hỗ trợ **in đậm**)' },
      },
    },
    italicQuoteLeft: {
      type: 'textarea',
      label: 'Dòng nghiêng kết cột trái (Playfair Display)',
    },
    profileCard: {
      type: 'object',
      label: 'Thẻ chân dung (cột phải)',
      objectFields: {
        eyebrow: { type: 'text', label: 'Nhãn nhỏ (VD: CÔ ẤY LÀ AI)' },
        quote: { type: 'textarea', label: 'Trích dẫn nghiêng' },
        items: {
          type: 'array',
          label: 'Các gạch đầu dòng mô tả',
          getItemSummary: (it: string) => it || 'Mục',
          arrayFields: {
            text: { type: 'text', label: 'Nội dung' },
          },
        },
      },
    },
    sourceNote: {
      type: 'textarea',
      label: 'Ghi chú nguồn dữ liệu (chân trang)',
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
    seriesLabel: '[MẪU] 02 · BỐI CẢNH & CHÂN DUNG',
    title: '[MẪU] Phụ nữ thời đại AI đứng trước một bước chuyển mình lớn',
    showAccentBar: true,
    statCards: [
      {
        stat: '[MẪU] 39%',
        text: '[MẪU] kỹ năng cốt lõi của người lao động được dự báo sẽ **thay đổi đến năm 2030**.',
      },
      {
        stat: '[MẪU] 3X',
        text: '[MẪU] Ở các nước thu nhập cao, việc làm của nữ có nguy cơ bị AI tự động hóa cao nhất chiếm **9,6% — gần gấp ba nam giới**.',
      },
    ],
    italicQuoteLeft:
      '[MẪU] Luật chơi đang đổi — và phụ nữ công sở chịu sức ép thích nghi lớn hơn.',
    profileCard: {
      eyebrow: '[MẪU] CÔ ẤY LÀ AI',
      quote:
        '[MẪU] “Mình có năng lực, có kinh nghiệm — nhưng chưa đủ tự tin để thể hiện mình và luôn sợ bị đào thải.”',
      items: [
        '[MẪU] Giỏi chuyên môn, nhưng nhiều việc quen tay giờ AI làm nhanh hơn',
        '[MẪU] Biết mình cần đổi, chưa rõ đổi theo hướng nào',
        '[MẪU] Vừa giữ việc, vừa lo gia đình, vừa phải học lại',
        '[MẪU] Luôn trong trạng thái "overthinking"',
      ],
    },
    sourceNote:
      '[MẪU] Nguồn: WEF, Future of Jobs Report 2025 · ILO–NASK, chỉ số tác động của GenAI tới việc làm, 2025',
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: (props) => <ContextProfile {...props} />,
}
