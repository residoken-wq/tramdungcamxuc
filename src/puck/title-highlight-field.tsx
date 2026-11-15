import React from 'react'
import type { CustomField, SelectField } from '@puckeditor/core'
import { TitleHighlightInput } from './editor/TitleHighlightInput'
import { vi } from '@/lib/i18n/vi'
import type { TitleHighlightStyle, TitleHighlightAnimation } from '@/components/ui/TwoToneTitle'

export interface TitleHighlightFieldOptions {
  label?: string
  placeholder?: string
}

export function createTitleHighlightField<
  T extends string | undefined = string | undefined,
>(options?: TitleHighlightFieldOptions): CustomField<T> {
  const {
    label = 'Tiêu đề',
    placeholder = 'Dùng *từ* để tô màu, ~từ~ để gạch ngang',
  } = options || {}

  return {
    type: 'custom',
    label,
    contentEditable: true,
    render: ({ value, onChange, name, id, readOnly }) => (
      <TitleHighlightInput
        label={label}
        name={name}
        id={id}
        value={value ?? ''}
        onChange={(val) => onChange(val as T)}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    ),
  }
}

export const titleHighlightStyleField: SelectField = {
  type: 'select',
  label: vi.bx04?.titleHighlightStyle || 'Kiểu nhấn chữ',
  options: [
    { label: vi.bx04?.styleColor || 'Tô màu (mặc định)', value: 'color' },
    { label: vi.bx04?.styleUnderline || 'Gạch chân', value: 'underline' },
    { label: vi.bx04?.stylePill || 'Nền', value: 'pill' },
  ],
}

export const titleHighlightAnimationField: SelectField = {
  type: 'select',
  label: vi.bx04?.titleHighlightAnimation || 'Hiệu ứng nhấn chữ',
  options: [
    { label: vi.bx04?.animNone || 'Không (mặc định)', value: 'none' },
    { label: vi.bx04?.animDraw || 'Vẽ dần', value: 'draw' },
    { label: vi.bx04?.animPop || 'Nổi lên', value: 'pop' },
  ],
}
