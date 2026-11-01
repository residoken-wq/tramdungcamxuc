import React from 'react'
import type { ComponentConfig, Config, CustomField, Fields } from '@puckeditor/core'
import { StyleField } from '../editor/StyleField'
import { STYLE_FIELD } from './field-groups'
import { cleanAnchorId, hasStyleKeys, type BlockStyle } from './style-schema'
import { isSafeBlockId, STYLE_ATTR } from './style-css'

/** EB-04b: the `_style` field shown in the Style / Advanced tabs of every block. */
export const styleField: CustomField<BlockStyle | undefined> = {
  type: 'custom',
  label: 'Kiểu',
  render: ({ value, onChange }) => <StyleField value={value} onChange={onChange} />,
}

const withStyleField = (fields: Fields | undefined): Fields => ({
  ...fields,
  [STYLE_FIELD]: styleField as Fields[string],
})

/**
 * EB-04: wraps a block's render so a block with a `_style` gets one wrapper element the page CSS
 * (`collectPageStyles`) targets. Blocks without `_style` – every page built before EB-04 – return
 * their output untouched: same DOM, no wrapper, no class.
 */
export function withBlockStyle(component: ComponentConfig): ComponentConfig {
  const render = component.render
  const resolveFields = component.resolveFields
  return {
    ...component,
    fields: withStyleField(component.fields),
    // Blocks that compute their fields keep the `_style` field too.
    ...(resolveFields
      ? {
          // Keep sync resolvers sync (callers and tests rely on it); add `_style` either way.
          resolveFields: (data, params) => {
            const result = resolveFields(data, params)
            return result instanceof Promise ? result.then(withStyleField) : withStyleField(result)
          },
        }
      : {}),
    render: (props) => {
      const output = render(props)
      const raw = (props as { _style?: unknown })._style
      if (!hasStyleKeys(raw) || !isSafeBlockId(props.id)) return output
      const anchorId = cleanAnchorId(raw.anchorId)

      // Avoid double wrapper if output root or direct child already handles STYLE_ATTR (e.g. Container)
      if (React.isValidElement(output)) {
        const rootProps = output.props as Record<string, unknown>
        if (rootProps[STYLE_ATTR]) {
          return anchorId && !rootProps.id
            ? React.cloneElement(output, { id: anchorId } as never)
            : output
        }
        const children = React.Children.toArray(
          (output.props as { children?: React.ReactNode }).children,
        )
        const hasChildStyle = children.some(
          (c) =>
            React.isValidElement(c) && Boolean((c.props as Record<string, unknown>)[STYLE_ATTR]),
        )
        if (hasChildStyle) {
          return anchorId && !rootProps.id
            ? React.cloneElement(output, { id: anchorId } as never)
            : output
        }
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
