import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { TextWidget, type TextWidgetProps } from '@/components/site/widgets/TextWidget'
import { vi } from '@/lib/i18n/vi'

export type { TextWidgetProps }

const t = vi.eb06.text

export const TextWidgetBlock: ComponentConfig<TextWidgetProps> = {
  label: t.label,
  fields: {
    content: {
      type: 'richtext',
      label: t.content,
    },
  },
  defaultProps: {
    version: 1,
    content: '<p>Nhập đoạn văn bản của bạn tại đây...</p>',
  },
  render: ({ puck: _puck, ...props }) => <TextWidget {...props} />,
}
