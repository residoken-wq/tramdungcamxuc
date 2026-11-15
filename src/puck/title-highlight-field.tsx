import React from 'react'
import type { ComponentConfig, CustomField, Field, Fields, SelectField } from '@puckeditor/core'
import { TitleHighlightInput } from './editor/TitleHighlightInput'
import { vi } from '@/lib/i18n/vi'
import { hasTitleHighlight } from '@/components/ui/TwoToneTitle'

export interface TitleHighlightFieldOptions {
  label?: string
  placeholder?: string
}

export function createTitleHighlightField<T extends string | undefined = string | undefined>(
  options?: TitleHighlightFieldOptions,
): CustomField<T> {
  const { label = 'Tiêu đề', placeholder = 'Dùng *từ* để tô màu, ~từ~ để gạch ngang' } =
    options || {}

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

const TITLE_KEYS = ['titleLine1', 'titleLine2'] as const

/**
 * Gives any block with a two-tone title the BX-04 title tools, without touching its own config:
 * - `titleLine1` / `titleLine2` become the chip field (same label, so tests and the "Aa" button
 *   keep matching);
 * - "Kiểu nhấn chữ" + "Hiệu ứng nhấn chữ" are inserted right after the title fields and only shown
 *   when a title has `*…*` / `~…~` (the block's own `resolveFields` still runs first).
 * Stored data does not change (titles stay strings; the two new props are optional and default
 * to 'color' / 'none' in the components), so no Puck data migration is needed.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- any block config, kept as-is
type AnyBlockConfig = ComponentConfig<any>

export function withTitleHighlight<T extends AnyBlockConfig>(block: T): T {
  const source = (block.fields ?? {}) as Record<string, Field>
  if (!TITLE_KEYS.some((key) => source[key]) || source.titleHighlightStyle) return block

  const fields: Record<string, Field> = {}
  const lastTitleKey = source.titleLine2 ? 'titleLine2' : 'titleLine1'
  for (const [key, field] of Object.entries(source)) {
    const isTitle = (TITLE_KEYS as readonly string[]).includes(key)
    const isPlainText = field.type === 'text' || field.type === 'textarea'
    fields[key] =
      isTitle && isPlainText
        ? (createTitleHighlightField({
            label: typeof field.label === 'string' ? field.label : undefined,
          }) as Field)
        : field
    if (key === lastTitleKey) {
      fields.titleHighlightStyle = titleHighlightStyleField
      fields.titleHighlightAnimation = titleHighlightAnimationField
    }
  }

  const ownResolveFields = block.resolveFields
  const resolveFields: AnyBlockConfig['resolveFields'] = async (data, params) => {
    const props = ((data as { props?: Record<string, unknown> })?.props ?? {}) as Record<
      string,
      unknown
    >
    const resolved = (
      ownResolveFields ? await ownResolveFields(data, params) : params.fields
    ) as Record<string, Field>
    if (hasTitleHighlight(props.titleLine1) || hasTitleHighlight(props.titleLine2)) {
      return resolved as Fields
    }
    const next = { ...resolved }
    delete next.titleHighlightStyle
    delete next.titleHighlightAnimation
    return next as Fields
  }

  return { ...block, fields: fields as Fields, resolveFields }
}
