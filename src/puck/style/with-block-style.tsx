import React from 'react'
import type { ComponentConfig, Config } from '@puckeditor/core'
import { cleanAnchorId, hasStyleKeys } from './style-schema'
import { isSafeBlockId, STYLE_ATTR } from './style-css'

/**
 * EB-04: wraps a block's render so a block with a `_style` gets one wrapper element the page CSS
 * (`collectPageStyles`) targets. Blocks without `_style` – every page built before EB-04 – return
 * their output untouched: same DOM, no wrapper, no class.
 */
export function withBlockStyle(component: ComponentConfig): ComponentConfig {
  const render = component.render
  return {
    ...component,
    render: (props) => {
      const output = render(props)
      const raw = (props as { _style?: unknown })._style
      if (!hasStyleKeys(raw) || !isSafeBlockId(props.id)) return output
      const anchorId = cleanAnchorId(raw.anchorId)
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
