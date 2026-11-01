import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { CounterWidget, type CounterWidgetProps } from '@/components/site/widgets/CounterWidget'
import { vi } from '@/lib/i18n/vi'

export type { CounterWidgetProps }

export const CounterWidgetBlock: ComponentConfig<CounterWidgetProps> = {
  label: vi.eb06.counter.label,
  defaultProps: {
    version: 1,
    startNumber: 0,
    endNumber: 100,
    prefix: '',
    suffix: '+',
    thousandSeparator: '.',
    duration: 2000,
    label: 'Chỉ số thống kê',
    align: 'center',
  },
  fields: {
    startNumber: {
      type: 'number',
      label: vi.eb06.counter.startNumber,
    },
    endNumber: {
      type: 'number',
      label: vi.eb06.counter.endNumber,
    },
    prefix: {
      type: 'text',
      label: vi.eb06.counter.prefix,
    },
    suffix: {
      type: 'text',
      label: vi.eb06.counter.suffix,
    },
    thousandSeparator: {
      type: 'select',
      label: vi.eb06.counter.separator,
      options: [
        { label: 'Dấu chấm (1.000 - Kiểu Việt Nam)', value: '.' },
        { label: 'Dấu phẩy (1,000)', value: ',' },
        { label: 'Không phân cách (1000)', value: 'none' },
      ],
    },
    duration: {
      type: 'select',
      label: vi.eb06.counter.duration,
      options: [
        { label: '1 giây', value: 1000 },
        { label: '2 giây', value: 2000 },
        { label: '3 giây', value: 3000 },
      ],
    },
    label: {
      type: 'text',
      label: vi.eb06.counter.textLabel,
    },
    align: {
      type: 'radio',
      label: vi.eb06.counter.align,
      options: [
        { label: 'Căn trái', value: 'left' },
        { label: 'Căn giữa', value: 'center' },
        { label: 'Căn phải', value: 'right' },
      ],
    },
  },
  render: (props) => <CounterWidget {...props} />,
}
