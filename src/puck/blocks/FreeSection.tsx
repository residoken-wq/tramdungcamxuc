import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { FreeSection, type FreeSectionProps } from '@/components/site/free-section/FreeSection'
import {
  EmotionEl,
  HeadingEl,
  ImageEl,
  ParagraphEl,
  SeriesLabelEl,
  type EmotionElProps,
  type HeadingElProps,
  type ImageElProps,
  type ParagraphElProps,
  type SeriesLabelElProps,
} from '@/components/site/free-section/elements'
import { ButtonEl, type ButtonElProps } from '@/components/site/free-section/ButtonEl'
import { ELEMENT_SIZE_OPTIONS } from '@/components/site/free-section/sizes'
import { allowedTextColors, getChildRealBg } from '@/lib/brand/format-classes'
import {
  ALIGN_OPTIONS,
  BRAND_COLOR_OPTIONS,
  ELEMENT_BLOCK_TYPES,
  PADDING_OPTIONS,
} from '../constants'
import { createMediaExternalField } from '../media-field'
import { createPageExternalField } from '../page-field'

export type {
  FreeSectionProps,
  SeriesLabelElProps,
  HeadingElProps,
  ParagraphElProps,
  EmotionElProps,
  ImageElProps,
  ButtonElProps,
}

const sizeField = (label: string) => ({
  type: 'select' as const,
  label,
  options: [...ELEMENT_SIZE_OPTIONS],
})

const colorField = (label: string, bg: string, large: boolean) => ({
  type: 'select' as const,
  label,
  options: allowedTextColors(bg, large),
})

// Elements sit straight on the section background: offer only colours that pass WCAG AA there.
const sectionBg = (parent: Parameters<typeof getChildRealBg>[0]) =>
  getChildRealBg(parent, { cardStyle: 'outline' })

const SLOT_ALLOW = [...ELEMENT_BLOCK_TYPES, 'Spacer']

/** PK-13: a brand section whose content is built from small draggable elements. */
export const FreeSectionBlock: ComponentConfig<FreeSectionProps> = {
  label: 'Section tự do (kéo thả từng phần tử)',
  fields: {
    columns: {
      type: 'select',
      label: 'Số cột',
      options: [
        { label: '1 cột', value: '1' },
        { label: '2 cột (VD: chữ trái, ảnh phải)', value: '2' },
      ],
    },
    col1: { type: 'slot', label: 'Cột 1 (kéo phần tử vào đây)', allow: SLOT_ALLOW },
    col2: { type: 'slot', label: 'Cột 2 (khi chọn 2 cột)', allow: SLOT_ALLOW },
    align: { type: 'select', label: 'Căn lề', options: [...ALIGN_OPTIONS] },
    bgColor: { type: 'select', label: 'Màu nền', options: [...BRAND_COLOR_OPTIONS] },
    padding: { type: 'select', label: 'Khoảng đệm (Padding)', options: [...PADDING_OPTIONS] },
  },
  defaultProps: {
    version: 1,
    columns: '1',
    align: 'left',
    bgColor: 'warm-ivory',
    padding: 'md',
    col1: [
      {
        type: 'SeriesLabelEl',
        props: { version: 1, text: '[MẪU] Nhãn series', color: 'deep-navy', size: 'md' },
      },
      {
        type: 'HeadingEl',
        props: {
          version: 1,
          line1: '[MẪU] TIÊU ĐỀ DÒNG 1',
          line2: '[MẪU] TIÊU ĐỀ DÒNG 2',
          level: 'h2',
          line1Color: 'deep-navy',
          line2Color: 'bright-magenta',
          size: 'md',
        },
      },
      {
        type: 'EmotionEl',
        props: { version: 1, text: '[MẪU] Dòng cảm xúc ấm áp', color: 'deep-navy', size: 'md' },
      },
      {
        type: 'ParagraphEl',
        props: {
          version: 1,
          content: '[MẪU] Đoạn văn mô tả ngắn.',
          color: 'deep-navy',
          size: 'md',
        },
      },
      {
        type: 'ButtonEl',
        props: {
          version: 1,
          text: '[MẪU] Tìm hiểu thêm',
          linkType: 'url',
          pageId: '',
          href: '#',
          variant: 'primary',
          size: 'md',
        },
      },
    ],
    col2: [],
  } as unknown as FreeSectionProps,
  render: ({ puck: _puck, ...props }) => <FreeSection {...props} />,
}

export const SeriesLabelElBlock: ComponentConfig<SeriesLabelElProps> = {
  label: 'Nhãn series',
  fields: {
    text: { type: 'text', label: 'Nội dung nhãn', contentEditable: true },
    size: sizeField('Cỡ chữ'),
    color: colorField('Màu chữ', 'warm-ivory', false),
  },
  defaultProps: { version: 1, text: '[MẪU] Nhãn series', color: 'deep-navy', size: 'md' },
  resolveFields: (_data, params) => ({
    ...params.fields,
    color: colorField('Màu chữ', sectionBg(params?.parent), false),
  }),
  render: ({ puck: _puck, ...props }) => <SeriesLabelEl {...props} />,
}

export const HeadingElBlock: ComponentConfig<HeadingElProps> = {
  label: 'Tiêu đề 2 tầng',
  fields: {
    line1: { type: 'text', label: 'Dòng 1', contentEditable: true },
    line2: { type: 'text', label: 'Dòng 2 (màu nhấn)', contentEditable: true },
    size: sizeField('Cỡ chữ'),
    level: {
      type: 'select',
      label: 'Cấp tiêu đề (SEO)',
      options: [
        { label: 'H1 – tiêu đề chính của trang (mỗi trang 1 lần)', value: 'h1' },
        { label: 'H2 – tiêu đề mục', value: 'h2' },
        { label: 'H3 – tiêu đề nhỏ', value: 'h3' },
      ],
    },
    line1Color: colorField('Màu dòng 1', 'warm-ivory', true),
    line2Color: colorField('Màu dòng 2', 'warm-ivory', true),
  },
  defaultProps: {
    version: 1,
    line1: '[MẪU] TIÊU ĐỀ DÒNG 1',
    line2: '[MẪU] TIÊU ĐỀ DÒNG 2',
    level: 'h2',
    line1Color: 'deep-navy',
    line2Color: 'bright-magenta',
    size: 'md',
  },
  resolveFields: (_data, params) => {
    const bg = sectionBg(params?.parent)
    return {
      ...params.fields,
      line1Color: colorField('Màu dòng 1', bg, true),
      line2Color: colorField('Màu dòng 2', bg, true),
    }
  },
  render: ({ puck: _puck, ...props }) => <HeadingEl {...props} />,
}

export const ParagraphElBlock: ComponentConfig<ParagraphElProps> = {
  label: 'Đoạn văn',
  fields: {
    content: {
      type: 'textarea',
      label: 'Nội dung (các đoạn phân tách bằng 2 lần xuống dòng)',
      contentEditable: true,
    },
    size: sizeField('Cỡ chữ'),
    color: colorField('Màu chữ', 'warm-ivory', false),
  },
  defaultProps: {
    version: 1,
    content: '[MẪU] Đoạn văn mô tả ngắn.',
    color: 'deep-navy',
    size: 'md',
  },
  resolveFields: (_data, params) => ({
    ...params.fields,
    color: colorField('Màu chữ', sectionBg(params?.parent), false),
  }),
  render: ({ puck: _puck, ...props }) => <ParagraphEl {...props} />,
}

export const EmotionElBlock: ComponentConfig<EmotionElProps> = {
  label: 'Dòng cảm xúc (chữ nghiêng)',
  fields: {
    text: { type: 'textarea', label: 'Nội dung', contentEditable: true },
    size: sizeField('Cỡ chữ'),
    color: colorField('Màu chữ', 'warm-ivory', false),
  },
  defaultProps: { version: 1, text: '[MẪU] Dòng cảm xúc ấm áp', color: 'deep-navy', size: 'md' },
  resolveFields: (_data, params) => ({
    ...params.fields,
    color: colorField('Màu chữ', sectionBg(params?.parent), false),
  }),
  render: ({ puck: _puck, ...props }) => <EmotionEl {...props} />,
}

export const ImageElBlock: ComponentConfig<ImageElProps> = {
  label: 'Ảnh',
  fields: {
    mediaId: createMediaExternalField({ label: 'Ảnh (Thư viện media, bắt buộc có mô tả alt)' }),
    width: {
      type: 'select',
      label: 'Độ rộng ảnh',
      options: [
        { label: 'Nhỏ', value: 'sm' },
        { label: 'Vừa', value: 'md' },
        { label: 'Lớn', value: 'lg' },
        { label: 'Hết cột', value: 'full' },
      ],
    },
  },
  defaultProps: { version: 1, mediaId: '', imageUrl: '', imageAlt: '', width: 'full' },
  resolveData: async (data) => {
    const { mediaId } = data.props
    if (!mediaId) return { props: { ...data.props, imageUrl: '', imageAlt: '' } }
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/media/${encodeURIComponent(String(mediaId))}`, {
          credentials: 'include',
        })
        if (res.ok) {
          const json = await res.json()
          if (json && typeof json.alt === 'string' && json.alt.trim().length > 0) {
            return { props: { ...data.props, imageUrl: json.url || '', imageAlt: json.alt.trim() } }
          }
        }
      }
    } catch {
      // Keep the props; the image just does not show.
    }
    return { props: { ...data.props, imageUrl: '', imageAlt: '' } }
  },
  render: ({ puck: _puck, ...props }) => <ImageEl {...props} />,
}

export const ButtonElBlock: ComponentConfig<ButtonElProps> = {
  label: 'Nút',
  fields: {
    text: { type: 'text', label: 'Chữ trên nút', contentEditable: true },
    linkType: {
      type: 'select',
      label: 'Loại liên kết',
      options: [
        { label: 'Liên kết ngoài / Tự nhập URL', value: 'url' },
        { label: 'Trang trong website', value: 'page' },
      ],
    },
    pageId: createPageExternalField({ label: 'Chọn trang trong website' }),
    href: { type: 'text', label: 'Đường dẫn liên kết (khi chọn Tự nhập URL)' },
    variant: {
      type: 'select',
      label: 'Kiểu nút',
      options: [
        { label: 'Chính (Hồng nhấn)', value: 'primary' },
        { label: 'Phụ (Xanh thẫm)', value: 'secondary' },
        { label: 'Viền mảnh', value: 'ghost' },
      ],
    },
    size: {
      type: 'select',
      label: 'Cỡ nút',
      options: [
        { label: 'Nhỏ', value: 'sm' },
        { label: 'Vừa', value: 'md' },
        { label: 'Lớn', value: 'lg' },
      ],
    },
  },
  defaultProps: {
    version: 1,
    text: '[MẪU] Tìm hiểu thêm',
    linkType: 'url',
    pageId: '',
    href: '#',
    variant: 'primary',
    size: 'md',
  },
  render: ({ puck: _puck, ...props }) => <ButtonEl {...props} />,
}
