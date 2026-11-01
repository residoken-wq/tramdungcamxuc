import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import {
  HeadingWidget,
  type HeadingLevel,
  type HeadingWidgetProps,
} from '@/components/site/widgets/HeadingWidget'
import { vi } from '@/lib/i18n/vi'
import { createPageExternalField } from '@/puck/page-field'

export type { HeadingLevel, HeadingWidgetProps }

const t = vi.eb06.heading

export const HeadingWidgetBlock: ComponentConfig<HeadingWidgetProps> = {
  label: t.label,
  fields: {
    text: {
      type: 'text',
      label: t.text,
      contentEditable: true,
    },
    level: {
      type: 'select',
      label: t.level,
      options: [
        { label: 'H1 (Mỗi trang chỉ một H1)', value: 'h1' },
        { label: 'H2 (Mặc định)', value: 'h2' },
        { label: 'H3', value: 'h3' },
        { label: 'H4', value: 'h4' },
        { label: 'H5', value: 'h5' },
        { label: 'H6', value: 'h6' },
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
    href: {
      type: 'text',
      label: t.href,
    },
    newTab: {
      type: 'radio',
      label: t.newTab,
      options: [
        { label: t.newTabNo, value: false },
        { label: t.newTabYes, value: true },
      ],
    },
  },
  defaultProps: {
    version: 1,
    text: 'Tiêu đề mới',
    level: 'h2',
    linkType: 'none',
    pageId: '',
    href: '',
    newTab: false,
  },
  render: ({ puck: _puck, ...props }) => <HeadingWidget {...props} />,
}
