import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import {
  TabsWidget,
  type TabsWidgetProps,
  type TabItem,
} from '@/components/site/widgets/TabsWidget'
import { CHILD_BLOCK_TYPES } from '../../constants'
import { vi } from '@/lib/i18n/vi'
import { renderItemSlots, SLOT_CLASS } from './slot-items'

export type { TabsWidgetProps, TabItem }

export const TabsWidgetBlock: ComponentConfig<TabsWidgetProps> = {
  label: vi.eb06.tabs.label,
  defaultProps: {
    version: 1,
    orientation: 'horizontal',
    items: [{ title: 'Tab 1' }, { title: 'Tab 2' }],
  },
  fields: {
    orientation: {
      type: 'radio',
      label: vi.eb06.tabs.orientation,
      options: [
        { label: vi.eb06.tabs.horizontal, value: 'horizontal' },
        { label: vi.eb06.tabs.vertical, value: 'vertical' },
      ],
    },
    items: {
      type: 'array',
      label: vi.eb06.tabs.items,
      defaultItemProps: (index: number) => ({
        title: `Tab ${index + 1}`,
      }),
      getItemSummary: (item: TabItem, index?: number) => item?.title || `Tab ${(index ?? 0) + 1}`,
      arrayFields: {
        title: {
          type: 'text',
          label: vi.eb06.tabs.itemTitle,
        },
        content: {
          type: 'slot',
          label: vi.eb06.tabs.itemContent,
          disallow: [...CHILD_BLOCK_TYPES],
        },
      },
    },
  },
  render: ({ puck, items, ...props }) => (
    <TabsWidget
      {...props}
      items={renderItemSlots(items, SLOT_CLASS)}
      isEditing={Boolean(puck?.isEditing)}
    />
  ),
}
