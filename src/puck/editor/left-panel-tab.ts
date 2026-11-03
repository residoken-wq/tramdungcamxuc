/**
 * EB-13bc: tab-switch event kept apart from LeftPanel.tsx so light editor
 * pieces (Container's empty placeholder, toolbar) can switch tabs without
 * importing LeftPanel and, through it, the server actions and full Puck config
 * (that import loop left Container undefined when config.tsx was built).
 */
export const SWITCH_TAB_EVENT = 'eb03:switch-tab'

export type LeftPanelTab = 'blocks' | 'outline' | 'templates'

/**
 * Dispatches a global event to switch the LeftPanel tab (e.g. from the bottom toolbar or container).
 */
export function switchLeftPanelTab(tab: LeftPanelTab) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SWITCH_TAB_EVENT, { detail: tab }))
    if (window.parent && window.parent !== window) {
      window.parent.dispatchEvent(new CustomEvent(SWITCH_TAB_EVENT, { detail: tab }))
    }
  }
}
