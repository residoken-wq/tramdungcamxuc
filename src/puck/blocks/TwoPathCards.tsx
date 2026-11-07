import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { TwoPathCards, type TwoPathCardsProps } from '@/components/site/TwoPathCards'
import { PATHS_GRID } from '@/components/site/two-path-cards-grid'
import {
  BRAND_COLOR_OPTIONS,
  FONT_SIZE_OPTIONS,
  PADDING_OPTIONS,
  GRID_CARD_ALIGN_OPTIONS,
} from '../constants'
import { vi } from '@/lib/i18n/vi'

export type { TwoPathCardsProps }

export const TwoPathCardsBlock: ComponentConfig<TwoPathCardsProps> = {
  label: 'Hai lối đi Cá nhân / Doanh nghiệp (Two Path Cards)',
  fields: {
    seriesLabel: {
      type: 'text',
      label: vi.eb15a?.seriesLabel || 'Nhãn series',
    },
    titleLine1: {
      type: 'text',
      label: vi.eb15a?.titleLine1 || 'Tiêu đề dòng 1',
      contentEditable: true,
    },
    titleLine2: {
      type: 'text',
      label: vi.eb15a?.titleLine2 || 'Tiêu đề dòng 2',
      contentEditable: true,
    },

    titleSize: {
      type: 'select',
      label: 'Cỡ chữ tiêu đề',
      options: [...FONT_SIZE_OPTIONS],
    },
    cardAlign: {
      type: 'select',
      label: vi.eb15b?.gridCardAlign || 'Căn lề tất cả thẻ',
      options: [...GRID_CARD_ALIGN_OPTIONS],
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
    cardAlign: 'inherit',
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
  // `puck` carries functions (renderDropZone) that cannot cross into a client component.
  // On public pages the `paths` slot is a function too: render it here (server side) and pass
  // the result, otherwise the page fails with "Functions cannot be passed directly to Client
  // Components" (500 on /ve-tram, 07/11). In the editor everything runs on the client.
  render: ({ puck, paths, ...props }) => {
    const isEditing = puck?.isEditing ?? false
    const pathsNode =
      !isEditing && typeof paths === 'function'
        ? React.createElement(paths as React.ComponentType<{ className?: string }>, {
            className: PATHS_GRID,
          })
        : undefined
    return (
      <TwoPathCards
        {...props}
        paths={pathsNode ? undefined : paths}
        pathsNode={pathsNode}
        puck={{ isEditing }}
      />
    )
  },
}
