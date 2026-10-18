import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { HeroTwoEntries, type HeroTwoEntriesProps } from '@/components/site/HeroTwoEntries'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { createMediaExternalField } from '../media-field'

export type { HeroTwoEntriesProps }

export const HeroTwoEntriesBlock: ComponentConfig<HeroTwoEntriesProps> = {
  label: 'Hero 2 Lối vào (Cá nhân & Tổ chức)',
  fields: {
    seriesLabel: { type: 'text', label: 'Nhãn series (trên cùng)' },
    titleLine1: { type: 'text', label: 'Tiêu đề dòng 1 (Xanh thẫm / Deep Navy)' },
    titleLine2: { type: 'text', label: 'Tiêu đề dòng 2 (Hồng sen / Bright Magenta)' },
    emotionLine: { type: 'textarea', label: 'Dòng cảm xúc (Playfair Display Italic)' },
    description: { type: 'textarea', label: 'Đoạn mô tả ngắn dưới tiêu đề' },
    mediaId: createMediaExternalField({
      label: 'Ảnh chân dung / minh họa Hero (Thư viện media)',
    }),
    entry1: {
      type: 'object',
      label: 'Lối vào 1 (Cá nhân)',
      objectFields: {
        groupLabel: { type: 'text', label: 'Nhãn nhóm (VD: CHO CÁ NHÂN)' },
        label: { type: 'text', label: 'Nhãn lối vào' },
        description: { type: 'textarea', label: 'Mô tả ngắn' },
        buttonText: { type: 'text', label: 'Chữ trên nút' },
        buttonLink: { type: 'text', label: 'Đường dẫn liên kết' },
        buttonStyle: {
          type: 'select',
          label: 'Kiểu nút',
          options: [
            { label: 'Nút đặc (Solid)', value: 'solid' },
            { label: 'Nút viền (Outline)', value: 'outline' },
          ],
        },
      },
    },
    entry2: {
      type: 'object',
      label: 'Lối vào 2 (Tổ chức / Doanh nghiệp)',
      objectFields: {
        groupLabel: { type: 'text', label: 'Nhãn nhóm (VD: CHO DOANH NGHIỆP)' },
        label: { type: 'text', label: 'Nhãn lối vào' },
        description: { type: 'textarea', label: 'Mô tả ngắn' },
        buttonText: { type: 'text', label: 'Chữ trên nút' },
        buttonLink: { type: 'text', label: 'Đường dẫn liên kết' },
        buttonStyle: {
          type: 'select',
          label: 'Kiểu nút',
          options: [
            { label: 'Nút đặc (Solid)', value: 'solid' },
            { label: 'Nút viền (Outline)', value: 'outline' },
          ],
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
    version: 2,
    seriesLabel: '[MẪU] Series nhãn',
    titleLine1: '[MẪU] DÒNG TIÊU ĐỀ 1',
    titleLine2: '[MẪU] DÒNG TIÊU ĐỀ 2',
    emotionLine: '[MẪU] Dòng cảm xúc trích dẫn ấm áp và chân thành',
    description: '',
    mediaId: '',
    imageUrl: '',
    imageAlt: '',
    bgColor: 'warm-ivory',
    padding: 'md',
    entry1: {
      groupLabel: '',
      label: '[MẪU] Lối vào 1',
      description: '[MẪU] Mô tả ngắn gọn về lối vào dành cho cá nhân',
      buttonText: '[MẪU] Khám phá ngay',
      buttonLink: '#',
      buttonStyle: 'solid',
    },
    entry2: {
      groupLabel: '',
      label: '[MẪU] Lối vào 2',
      description: '[MẪU] Mô tả ngắn gọn về lối vào dành cho tổ chức',
      buttonText: '[MẪU] Tìm hiểu thêm',
      buttonLink: '#',
      buttonStyle: 'outline',
    },
  },
  resolveData: async (data) => {
    const { mediaId } = data.props
    if (!mediaId) {
      return { props: { ...data.props, imageUrl: '', imageAlt: '' } }
    }

    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/media/${encodeURIComponent(mediaId)}`, {
          credentials: 'include',
        })
        if (res.ok) {
          const json = await res.json()
          if (json && json.alt && typeof json.alt === 'string' && json.alt.trim().length > 0) {
            return {
              props: {
                ...data.props,
                imageUrl: json.url || '',
                imageAlt: json.alt.trim(),
              },
            }
          }
        }
      }
    } catch {
      // Fallback
    }

    return { props: { ...data.props, imageUrl: '', imageAlt: '' } }
  },
  render: (props) => <HeroTwoEntries {...props} />,
}
