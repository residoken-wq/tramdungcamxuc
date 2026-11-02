import React from 'react'
import type { ComponentConfig, Config, CustomField, Fields, TextField } from '@puckeditor/core'
import { StyleField } from '../editor/StyleField'
import { STYLE_FIELD, LABEL_FIELD } from './field-groups'
import { cleanAnchorId, hasStyleKeys, type BlockStyle } from './style-schema'
import { isSafeBlockId, STYLE_ATTR } from './style-css'
import { vi } from '@/lib/i18n/vi'

/** EB-07: the `_label` field shown in the Advanced tab of every block. */
export const labelField: TextField = {
  type: 'text',
  label: vi.eb07.labelField,
}

/** EB-04b: the `_style` field shown in the Style / Advanced tabs of every block. */
export const styleField: CustomField<BlockStyle | undefined> = {
  type: 'custom',
  label: 'Kiểu',
  render: ({ value, onChange }) => <StyleField value={value} onChange={onChange} />,
}

const withExtraFields = (fields: Fields | undefined): Fields => ({
  ...fields,
  [LABEL_FIELD]: labelField as Fields[string],
  [STYLE_FIELD]: styleField as Fields[string],
})

/**
 * EB-04: wraps a block's render so a block with a `_style` gets one wrapper element the page CSS
 * (`collectPageStyles`) targets. Blocks without `_style` – every page built before EB-04 – return
 * their output untouched: same DOM, no wrapper, no class.
 */
/**
 * EB-05: components that put `data-eb-id` (and the anchor id) on their own root set this flag, so
 * `withBlockStyle` does not add a second wrapper.
 */
export const STYLES_IN_PLACE = 'ebStylesInPlace'
const stylesInPlace = (type: unknown) =>
  typeof type === 'function' &&
  (type as unknown as Record<string, unknown>)[STYLES_IN_PLACE] === true

export function withBlockStyle(component: ComponentConfig): ComponentConfig {
  const render = component.render
  const resolveFields = component.resolveFields
  return {
    ...component,
    fields: withExtraFields(component.fields),
    // Blocks that compute their fields keep both `_label` and `_style` fields too.
    ...(resolveFields
      ? {
          // Keep sync resolvers sync (callers and tests rely on it); add fields either way.
          resolveFields: (data, params) => {
            const result = resolveFields(data, params)
            return result instanceof Promise
              ? result.then(withExtraFields)
              : withExtraFields(result)
          },
        }
      : {}),
    render: (props) => {
      // EB-07: strip _label so it is editor-only and never leaks into public HTML attributes
      const { [LABEL_FIELD]: _label, ...cleanProps } = props as Record<string, unknown>
      const output = render(cleanProps as typeof props)
      const raw = (props as { _style?: unknown })._style
      if (!hasStyleKeys(raw) || !isSafeBlockId(props.id)) return output
      const anchorId = cleanAnchorId(raw.anchorId)

      // EB-05: a block that styles itself in place (Container) gets the anchor id, no wrapper.
      if (React.isValidElement(output) && stylesInPlace(output.type)) {
        return anchorId
          ? React.cloneElement(output as React.ReactElement<{ anchorId?: string }>, { anchorId })
          : output
      }

      return (
        <div {...{ [STYLE_ATTR]: props.id }} id={anchorId}>
          {output}
        </div>
      )
    },
  }
}

/** Applies `withBlockStyle` to every component of a Puck config. */
export function withBlockStyles<C extends Config>(config: C): C {
  const components = Object.fromEntries(
    Object.entries(config.components).map(([name, component]) => [
      name,
      withBlockStyle(component as ComponentConfig),
    ]),
  ) as C['components']
  return { ...config, components }
}
