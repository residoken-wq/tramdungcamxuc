import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import {
  ButtonWidget,
  type ButtonAlign,
  type ButtonWidgetProps,
} from '@/components/site/widgets/ButtonWidget'
import { type ButtonSize, type ButtonVariant } from '@/components/ui/Button'
import { BRAND_ICONS } from '@/lib/brand/icons'
import { vi } from '@/lib/i18n/vi'
import { createPageExternalField } from '@/puck/page-field'

export type { ButtonAlign, ButtonSize, ButtonVariant, ButtonWidgetProps }

const t = vi.eb06.button

export const ButtonWidgetBlock: ComponentConfig<ButtonWidgetProps> = {
  label: t.label,
  fields: {
    text: {
      type: 'text',
      label: t.text,
      contentEditable: true,
    },
    linkType: {
      type: 'select',
      label: t.linkType,
      options: [
        { label: t.linkUrl, value: 'url' },
        { label: t.linkPage, value: 'page' },
      ],
    },
    pageId: createPageExternalField({ label: t.pageId }),
    href: {
      type: 'text',
      label: t.href,
    },
    newTab: {
      type: 'radio',
      label: t.newTab,
      options: [
        { label: 'Không', value: false },
        { label: 'Có', value: true },
      ],
    },
    variant: {
      type: 'select',
      label: t.variant,
      options: [
        { label: 'Chính (Hồng nhấn)', value: 'primary' },
        { label: 'Phụ (Xanh thẫm)', value: 'secondary' },
        { label: 'Viền mảnh', value: 'ghost' },
      ],
    },
    buttonSize: {
      type: 'select',
      label: t.buttonSize,
      options: [
        { label: 'Nhỏ', value: 'sm' },
        { label: 'Vừa', value: 'md' },
        { label: 'Lớn', value: 'lg' },
      ],
    },
    align: {
      type: 'select',
      label: t.align,
      options: [
        { label: 'Căn trái', value: 'left' },
        { label: 'Căn giữa', value: 'center' },
        { label: 'Căn phải', value: 'right' },
        { label: 'Kéo hết (Toàn chiều rộng)', value: 'justify' },
      ],
    },
    icon: {
      type: 'select',
      label: t.icon,
      options: [
        { label: 'Không có icon', value: 'none' },
        ...BRAND_ICONS.map((i) => ({ label: i.label, value: i.value })),
      ],
    },
    iconPosition: {
      type: 'select',
      label: t.iconPosition,
      options: [
        { label: t.iconBefore, value: 'before' },
        { label: t.iconAfter, value: 'after' },
      ],
    },
  },
  defaultProps: {
    version: 1,
    text: 'Bấm vào đây',
    linkType: 'url',
    pageId: '',
    href: '#',
    newTab: false,
    variant: 'primary',
    buttonSize: 'md',
    align: 'left',
    icon: 'none',
    iconPosition: 'after',
  },
  render: ({ puck: _puck, ...props }) => <ButtonWidget {...props} />,
}
