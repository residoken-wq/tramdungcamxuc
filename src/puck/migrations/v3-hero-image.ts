import type { Data } from '@puckeditor/core'
import { walkPuckItemsSync } from '@/puck/walk'

/**
 * Migration v2 -> v3 for HeroImage:
 * Adds layout ('split') and backdrop defaults (overlayTone, overlayStrength, imageBlur,
 * imagePosition, contentAlign, minHeight) without altering any existing content or props.
 * Uses walkPuckItemsSync to traverse root content, zones, and all nested containers.
 */
export function migrateHeroImageV2ToV3(data: Data): Data {
  if (!data || typeof data !== 'object') return data

  const cloned = structuredClone(data)
  walkPuckItemsSync(cloned, (item) => {
    if (item.type === 'HeroImage') {
      const props = (item.props || {}) as Record<string, unknown>
      const version = typeof props.version === 'number' ? props.version : 1
      if (version < 3) {
        item.props = {
          ...props,
          version: 3,
          layout: typeof props.layout === 'string' ? props.layout : 'split',
          overlayTone: typeof props.overlayTone === 'string' ? props.overlayTone : 'dark',
          overlayStrength: typeof props.overlayStrength === 'string' ? props.overlayStrength : 'lg',
          imageBlur: typeof props.imageBlur === 'string' ? props.imageBlur : 'none',
          imagePosition: typeof props.imagePosition === 'string' ? props.imagePosition : 'center',
          contentAlign: typeof props.contentAlign === 'string' ? props.contentAlign : 'center',
          minHeight: typeof props.minHeight === 'string' ? props.minHeight : 'lg',
        }
      }
    }
  })

  return cloned
}
