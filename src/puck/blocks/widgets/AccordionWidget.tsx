import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import {
  AccordionWidget,
  type AccordionWidgetProps,
  type AccordionItem,
} from '@/components/site/widgets/AccordionWidget'
import { CHILD_BLOCK_TYPES } from '../../constants'
import { vi } from '@/lib/i18n/vi'
import { renderItemSlots, SLOT_CLASS } from './slot-items'
import { ItemTitlesField } from '@/puck/editor/ItemTitlesField'

export type { AccordionWidgetProps, AccordionItem }

export const AccordionWidgetBlock: ComponentConfig<AccordionWidgetProps> = {
  label: vi.eb06.accordion.label,
  defaultProps: {
    version: 1,
    expandMode: 'single',
    defaultExpanded: 'first',
    items: [{ title: 'Mục câu hỏi 1' }, { title: 'Mục câu hỏi 2' }],
  },
  fields: {
    quickTitles: {
      type: 'custom',
      label: vi.eb16.accordionTitlesLabel,
      render: () => <ItemTitlesField type="accordion" />,
    },
    expandMode: {
      type: 'radio',
      label: vi.eb06.accordion.expandMode,
      options: [
        { label: vi.eb06.accordion.single, value: 'single' },
        { label: vi.eb06.accordion.multiple, value: 'multiple' },
      ],
    },
    defaultExpanded: {
      type: 'select',
      label: vi.eb06.accordion.defaultExpanded,
      options: [
        { label: vi.eb06.accordion.expandedFirst, value: 'first' },
        { label: vi.eb06.accordion.expandedNone, value: 'none' },
        { label: vi.eb06.accordion.expandedAll, value: 'all' },
      ],
    },
    items: {
      type: 'array',
      label: vi.eb06.accordion.items,
      defaultItemProps: (index: number) => ({
        title: `Mục câu hỏi ${index + 1}`,
      }),
      getItemSummary: (item: AccordionItem, index?: number) =>
        item?.title || `Mục ${(index ?? 0) + 1}`,
      arrayFields: {
        title: {
          type: 'text',
          label: vi.eb06.accordion.itemTitle,
        },
        content: {
          type: 'slot',
          label: vi.eb06.accordion.itemContent,
          disallow: [...CHILD_BLOCK_TYPES],
        },
      },
    },
  },
  render: ({ puck, items, ...props }) => (
    <AccordionWidget
      {...props}
      items={renderItemSlots(items, SLOT_CLASS)}
      isEditing={Boolean(puck?.isEditing)}
    />
  ),
}
