import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { HtmlWidget, type HtmlWidgetProps } from '@/components/site/widgets/HtmlWidget'
import { vi } from '@/lib/i18n/vi'
import { HtmlFieldControl } from './HtmlFieldControl'

export type { HtmlWidgetProps }

export const HtmlWidgetBlock: ComponentConfig<HtmlWidgetProps> = {
  label: vi.eb09.htmlWidgetLabel,
  fields: {
    html: {
      type: 'custom',
      label: vi.eb09.htmlContentLabel,
      render: ({ value, onChange }) => <HtmlFieldControl value={value} onChange={onChange} />,
    },
  },
  defaultProps: {
    version: 1,
    html: '<p>Nội dung HTML tuỳ chỉnh...</p>',
  },
  render: ({ puck, ...props }) => <HtmlWidget isEditing={Boolean(puck?.isEditing)} {...props} />,
}
