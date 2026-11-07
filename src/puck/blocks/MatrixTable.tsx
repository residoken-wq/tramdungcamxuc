import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { MatrixTable, type MatrixTableProps } from '@/components/site/MatrixTable'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { vi } from '@/lib/i18n/vi'

export type { MatrixTableProps }

export const MatrixTableBlock: ComponentConfig<MatrixTableProps> = {
  label: vi.pk26?.matrixTable?.label || 'Bảng lưới (Matrix Table)',
  fields: {
    variant: {
      type: 'radio',
      label: vi.pk26?.matrixTable?.variant || 'Kiểu hiển thị',
      options: [
        { label: vi.pk26?.matrixTable?.variantGrid || 'Bảng ma trận (Grid)', value: 'grid' },
        { label: vi.pk26?.matrixTable?.variantList || 'Danh sách dòng đối sánh (List)', value: 'list' },
      ],
    },
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
    chipsTitle: {
      type: 'text',
      label: 'Tiêu đề hàng mốc / chip',
    },
    chips: {
      type: 'array',
      label: vi.pk26?.matrixTable?.chips || 'Hàng mốc / chip phía trên',
      getItemSummary: (item: { label?: string }) => item?.label || 'Chip',
      arrayFields: {
        label: { type: 'text', label: 'Tên mốc' },
      },
    },
    columns: {
      type: 'array',
      label: vi.pk26?.matrixTable?.columns || 'Cột bảng',
      getItemSummary: (col: { label?: string }) => col?.label || 'Cột',
      arrayFields: {
        label: { type: 'text', label: vi.pk26?.matrixTable?.colLabel || 'Tên cột' },
        color: {
          type: 'select',
          label: vi.pk26?.matrixTable?.colColor || 'Màu cột',
          options: [
            { label: 'Vàng bơ (Butter Cream)', value: 'butter-cream' },
            { label: 'Hồng phấn (Soft Pink)', value: 'soft-pink' },
            { label: 'Xanh bạc hà (Mint Haze)', value: 'mint-haze' },
            { label: 'Tím nhạt (Lavender Mist)', value: 'lavender-mist' },
            { label: 'Trắng ngà (Warm Ivory)', value: 'warm-ivory' },
          ],
        },
      },
    },
    rows: {
      type: 'array',
      label: vi.pk26?.matrixTable?.rows || 'Hàng bảng / Danh sách dòng',
      getItemSummary: (row: { label?: string }) => row?.label || 'Hàng',
      arrayFields: {
        label: { type: 'text', label: vi.pk26?.matrixTable?.rowLabel || 'Tên hàng / Nhãn dòng' },
        text: { type: 'textarea', label: vi.pk26?.matrixTable?.listText || 'Mô tả dòng (kiểu List)' },
        color: {
          type: 'select',
          label: vi.pk26?.matrixTable?.listColor || 'Màu nền dòng',
          options: [
            { label: 'Mặc định', value: '' },
            { label: 'Vàng bơ (Butter Cream)', value: 'butter-cream' },
            { label: 'Hồng phấn (Soft Pink)', value: 'soft-pink' },
            { label: 'Xanh bạc hà (Mint Haze)', value: 'mint-haze' },
            { label: 'Tím nhạt (Lavender Mist)', value: 'lavender-mist' },
            { label: 'Trắng ngà (Warm Ivory)', value: 'warm-ivory' },
            { label: 'Xanh thẫm (Deep Navy)', value: 'deep-navy' },
          ],
        },
        hasAccentBar: {
          type: 'radio',
          label: vi.pk26?.matrixTable?.listAccentBar || 'Vạch hồng nhấn bên trái',
          options: [
            { label: 'Có vạch hồng', value: true },
            { label: 'Không có vạch', value: false },
          ],
        },
        cells: {
          type: 'array',
          label: 'Các ô theo cột (kiểu Grid)',
          getItemSummary: (cell: { title?: string }) => cell?.title || 'Ô',
          arrayFields: {
            title: { type: 'text', label: vi.pk26?.matrixTable?.cellTitle || 'Tiêu đề ô' },
            text: { type: 'text', label: vi.pk26?.matrixTable?.cellText || 'Nội dung ô' },
          },
        },
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
    variant: 'grid',
    seriesLabel: '[MẪU] 11 · BẢN ĐỒ 28 NGÀY',
    titleLine1: '[MẪU] NHỊP THỰC HÀNH',
    titleLine2: '',
    emotionLine: '[MẪU] Mỗi bước đi đều là một nhịp chuyển mình đáng quý.',
    chipsTitle: '',
    chips: [],
    columns: [
      { label: '[MẪU] 01 · Thói quen', color: 'butter-cream' },
      { label: '[MẪU] 02 · Cảm xúc', color: 'soft-pink' },
      { label: '[MẪU] 03 · Giao tiếp', color: 'mint-haze' },
    ],
    rows: [
      {
        label: '[MẪU] Tuần 1',
        cells: [
          { title: '[MẪU] Bắt đầu, quan sát', text: '[MẪU] Điều gì khác với dự tính?' },
          { title: '[MẪU] Quan sát tín hiệu', text: '[MẪU] Cơ thể báo hiệu cảm xúc ra sao?' },
          { title: '[MẪU] Quan sát cách nói', text: '[MẪU] Mình nghiêng về năng lượng nào?' },
        ],
      },
    ],
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: (props) => <MatrixTable {...props} />,
}
