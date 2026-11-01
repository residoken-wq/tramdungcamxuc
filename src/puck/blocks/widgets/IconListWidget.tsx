import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import {
  IconListWidget,
  type IconListItem,
  type IconListWidgetProps,
} from '@/components/site/widgets/IconListWidget'
import { BRAND_ICONS } from '@/lib/brand/icons'
import { vi } from '@/lib/i18n/vi'
import { IconColorField } from '@/puck/editor/IconColorField'
import { createPageExternalField } from '@/puck/page-field'

export type { IconListItem, IconListWidgetProps }

const t = vi.eb06.iconList

export const IconListWidgetBlock: ComponentConfig<IconListWidgetProps> = {
  label: t.label,
  fields: {
    layout: {
      type: 'select',
      label: t.layout,
      options: [
        { label: t.layoutVertical, value: 'vertical' },
        { label: t.layoutHorizontal, value: 'horizontal' },
      ],
    },
    defaultIcon: {
      type: 'select',
      label: t.defaultIcon,
      options: BRAND_ICONS.map((i) => ({ label: i.label, value: i.value })),
    },
    iconColor: {
      type: 'custom',
      label: t.iconColor,
      render: ({ value, onChange }) => (
        <IconColorField value={value} onChange={onChange as (v: string) => void} />
      ),
    },
    items: {
      type: 'array',
      label: t.items,
      getItemSummary: (item, idx) => item.text || `Mục ${Number(idx) + 1}`,
      arrayFields: {
        text: { type: 'text', label: t.itemText },
        icon: {
          type: 'select',
          label: t.itemIcon,
          options: [
            { label: 'Dùng biểu tượng mặc định', value: '' },
            ...BRAND_ICONS.map((i) => ({ label: i.label, value: i.value })),
          ],
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
        href: { type: 'text', label: t.href },
        newTab: {
          type: 'radio',
          label: t.newTab,
          options: [
            { label: 'Không', value: false },
            { label: 'Có', value: true },
          ],
        },
      },
    },
  },
  defaultProps: {
    version: 1,
    layout: 'vertical',
    defaultIcon: 'check',
    iconColor: 'accent-pink',
    items: [
      { text: 'Mục danh sách 1', icon: '', linkType: 'none', pageId: '', href: '', newTab: false },
      { text: 'Mục danh sách 2', icon: '', linkType: 'none', pageId: '', href: '', newTab: false },
      { text: 'Mục danh sách 3', icon: '', linkType: 'none', pageId: '', href: '', newTab: false },
    ],
  },
  render: ({ puck: _puck, ...props }) => <IconListWidget {...props} />,
}
