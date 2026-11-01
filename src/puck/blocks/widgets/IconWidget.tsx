import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import {
  IconWidget,
  type IconSize,
  type IconStyle,
  type IconWidgetProps,
} from '@/components/site/widgets/IconWidget'
import { vi } from '@/lib/i18n/vi'
import { IconColorField } from '@/puck/editor/IconColorField'
import { IconPickerField } from '@/puck/editor/IconPickerField'
import { createPageExternalField } from '@/puck/page-field'

export type { IconSize, IconStyle, IconWidgetProps }

const t = vi.eb06.icon

export const IconWidgetBlock: ComponentConfig<IconWidgetProps> = {
  label: t.label,
  fields: {
    icon: {
      type: 'custom',
      label: t.icon,
      render: ({ value, onChange }) => (
        <IconPickerField value={value} onChange={onChange as (v: string) => void} />
      ),
    },
    linkType: {
      type: 'select',
      label: t.linkType,
      options: [
        { label: t.linkNone, value: 'none' },
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
    ariaLabel: {
      type: 'text',
      label: t.ariaLabel,
    },
    iconColor: {
      type: 'custom',
      label: t.iconColor,
      render: ({ value, onChange }) => (
        <IconColorField value={value} onChange={onChange as (v: string) => void} />
      ),
    },
    iconSize: {
      type: 'select',
      label: t.iconSize,
      options: [
        { label: 'Nhỏ (20px)', value: 'sm' },
        { label: 'Vừa (32px)', value: 'md' },
        { label: 'Lớn (48px)', value: 'lg' },
        { label: 'Rất lớn (64px)', value: 'xl' },
      ],
    },
    iconStyle: {
      type: 'select',
      label: t.iconStyle,
      options: [
        { label: t.stylePlain, value: 'plain' },
        { label: t.styleCircleBg, value: 'circle-bg' },
        { label: t.styleCircleBorder, value: 'circle-border' },
      ],
    },
  },
  defaultProps: {
    version: 1,
    icon: 'star',
    iconColor: 'deep-navy',
    iconSize: 'md',
    iconStyle: 'plain',
    linkType: 'none',
    pageId: '',
    href: '',
    newTab: false,
    ariaLabel: '',
  },
  render: ({ puck: _puck, ...props }) => <IconWidget {...props} />,
}
