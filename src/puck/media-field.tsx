import React from 'react'
import type { CustomField } from '@puckeditor/core'
import { RecordSummary } from './record-summary'
import { MediaPickerField } from './editor/MediaPickerField'

export type MediaFieldValue = string | number | undefined

export interface MediaFieldOptions {
  label?: string
  placeholder?: string
}

export type MediaCustomField<T extends MediaFieldValue = MediaFieldValue> = CustomField<T> & {
  getItemSummary?: (id: unknown) => React.ReactNode | string
  label?: string
  placeholder?: string
}

export function createMediaExternalField<
  T extends string | number | undefined = string | number | undefined,
>(options?: MediaFieldOptions): MediaCustomField<T> {
  const { label = 'Ảnh (Thư viện media)', placeholder = 'Chọn ảnh từ thư viện media...' } =
    options || {}

  return {
    type: 'custom',
    label,
    placeholder,
    render: ({ value, onChange }) => (
      <MediaPickerField
        value={value}
        onChange={(id) => onChange(id as T)}
        label={label}
        placeholder={placeholder}
      />
    ),
    getItemSummary: (id: unknown) =>
      id ? <RecordSummary collection="media" id={String(id)} /> : 'Chưa chọn ảnh',
  }
}
