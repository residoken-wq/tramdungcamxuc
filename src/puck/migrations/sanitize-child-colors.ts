import type { Data } from '@puckeditor/core'
import {
  allowedTextColors,
  getChildRealBg,
  getCardRealBg,
  type TextColorOption,
} from '@/lib/brand/format-classes'

type PuckItem = {
  type: string
  props: Record<string, unknown>
}

function getDefaultColorForBg(
  role: 'title' | 'text' | 'value' | 'label' | 'question' | 'answer',
  realBg: string,
): TextColorOption {
  if (realBg === 'deep-navy') {
    return role === 'value' ? 'soft-pink' : 'white'
  }
  return role === 'value' ? 'bright-magenta' : 'deep-navy'
}

function sanitizeColorProp(
  childProps: Record<string, unknown>,
  propName: string,
  realBg: string,
  isLarge: boolean,
  role: 'title' | 'text' | 'value' | 'label' | 'question' | 'answer',
): void {
  const currentColor = childProps[propName]
  if (typeof currentColor !== 'string' || currentColor === '') {
    return
  }
  const allowed = allowedTextColors(realBg, isLarge).map((opt) => opt.value)
  if (!allowed.includes(currentColor as TextColorOption)) {
    childProps[propName] = getDefaultColorForBg(role, realBg)
  }
}

function sanitizeChildItem(child: PuckItem, parent: PuckItem): void {
  const childType = child.type
  const childProps = child.props
  if (!childProps) return

  if (childType === 'Card') {
    const cardRealBg = getCardRealBg(parent)
    const isTitleLarge = childProps.titleSize === 'lg'
    sanitizeColorProp(childProps, 'titleColor', cardRealBg, isTitleLarge, 'title')
    sanitizeColorProp(childProps, 'textColor', cardRealBg, false, 'text')
  } else if (childType === 'Stat') {
    const statRealBg = getChildRealBg(parent)
    sanitizeColorProp(childProps, 'valueColor', statRealBg, true, 'value')
    const isLabelLarge = childProps.labelSize === 'lg'
    sanitizeColorProp(childProps, 'labelColor', statRealBg, isLabelLarge, 'label')
  } else if (childType === 'Step') {
    const stepRealBg = getChildRealBg(parent, {
      highlight: Boolean(childProps.highlight),
    })
    const isNameLarge = childProps.nameSize === 'lg'
    sanitizeColorProp(childProps, 'nameColor', stepRealBg, isNameLarge, 'title')
    const isDescLarge = childProps.descSize === 'lg'
    sanitizeColorProp(childProps, 'descColor', stepRealBg, isDescLarge, 'text')
  } else if (childType === 'ServiceCard') {
    const isHighlight = Boolean(childProps.highlight)
    const serviceRealBg = isHighlight ? 'deep-navy' : 'white'
    sanitizeColorProp(childProps, 'nameColor', serviceRealBg, true, 'title')
    const isTextLarge = childProps.textSize === 'lg'
    sanitizeColorProp(childProps, 'textColor', serviceRealBg, isTextLarge, 'text')
  } else if (childType === 'PackageCard') {
    const parentBg = typeof parent.props.bgColor === 'string' ? parent.props.bgColor : 'warm-ivory'
    const packageRealBg = parentBg === 'deep-navy' ? 'deep-navy' : 'white'
    sanitizeColorProp(childProps, 'nameColor', packageRealBg, true, 'title')
    const isTextLarge = childProps.textSize === 'lg'
    sanitizeColorProp(childProps, 'textColor', packageRealBg, isTextLarge, 'text')
  } else if (childType === 'EntryCard') {
    // Entry card text never reaches WCAG "large" size, so always check as normal text.
    const entryRealBg = getChildRealBg(parent, { cardStyle: 'white' })
    sanitizeColorProp(childProps, 'labelColor', entryRealBg, false, 'label')
    sanitizeColorProp(childProps, 'textColor', entryRealBg, false, 'text')
  } else if (childType === 'PathCard') {
    const pathRealBg = getChildRealBg(parent, { cardStyle: 'white' })
    sanitizeColorProp(childProps, 'labelColor', pathRealBg, false, 'label')
    sanitizeColorProp(childProps, 'titleColor', pathRealBg, childProps.titleSize === 'lg', 'title')
    sanitizeColorProp(childProps, 'textColor', pathRealBg, false, 'text')
  } else if (childType === 'VisionCard') {
    const visionRealBg = getChildRealBg(parent, { cardStyle: 'white' })
    sanitizeColorProp(
      childProps,
      'titleColor',
      visionRealBg,
      childProps.titleSize === 'lg',
      'title',
    )
    sanitizeColorProp(childProps, 'textColor', visionRealBg, false, 'text')
  } else if (
    childType === 'SeriesLabelEl' ||
    childType === 'ParagraphEl' ||
    childType === 'EmotionEl'
  ) {
    // PK-13 elements sit straight on the free section background.
    const elementBg = getChildRealBg(parent, { cardStyle: 'outline' })
    sanitizeColorProp(childProps, 'color', elementBg, false, 'text')
  } else if (childType === 'HeadingEl') {
    const elementBg = getChildRealBg(parent, { cardStyle: 'outline' })
    sanitizeColorProp(childProps, 'line1Color', elementBg, true, 'title')
    // Line 2 is the accent line: fall back to the accent (soft-pink on navy), not white.
    sanitizeColorProp(childProps, 'line2Color', elementBg, true, 'value')
  } else if (childType === 'FaqItem') {
    const parentBg = typeof parent.props.bgColor === 'string' ? parent.props.bgColor : 'warm-ivory'
    const faqRealBg = parentBg === 'deep-navy' ? 'deep-navy' : 'white'
    const isQuestionLarge = childProps.questionSize === 'lg'
    sanitizeColorProp(childProps, 'questionColor', faqRealBg, isQuestionLarge, 'question')
    const isAnswerLarge = childProps.answerSize === 'lg'
    sanitizeColorProp(childProps, 'answerColor', faqRealBg, isAnswerLarge, 'answer')
  }
}

function sanitizeChildrenInSlot(children: unknown, parent: PuckItem): void {
  if (!Array.isArray(children)) return
  for (const child of children) {
    if (child && typeof child === 'object' && 'type' in child && 'props' in child) {
      sanitizeChildItem(child as PuckItem, parent)
    }
  }
}

/**
 * Sanitize child colors against real background to ensure WCAG AA contrast.
 * Called in normalizePuckData after all migrations have run.
 * Idempotent: running multiple times produces identical data.
 */
export function sanitizeChildColors(data: Data): Data {
  if (!data || typeof data !== 'object') return data

  const PARENT_SLOTS: Record<string, string[]> = {
    IconCardGrid: ['cards'],
    StatsBar: ['stats'],
    JourneySteps: ['steps'],
    ServiceCards: ['cards'],
    PackageCards: ['cards'],
    FAQ: ['items'],
    HeroTwoEntries: ['entries'],
    TwoPathCards: ['paths'],
    FreeSection: ['col1', 'col2'],
    VisionMission: ['cards'],
    Columns: ['col1', 'col2', 'col3'],
  }

  function walkAndSanitize(item: unknown): void {
    if (!item || typeof item !== 'object') return
    const pItem = item as PuckItem
    if (!pItem.type || !pItem.props) return

    const slotNames = PARENT_SLOTS[pItem.type]
    if (slotNames) {
      const parentId = typeof pItem.props.id === 'string' && pItem.props.id ? pItem.props.id : ''

      for (const slotName of slotNames) {
        // 1. Sanitize slot in props if present
        if (Array.isArray(pItem.props[slotName])) {
          sanitizeChildrenInSlot(pItem.props[slotName], pItem)
        }
        // 2. Sanitize slot in zones if present
        if (parentId && data.zones && typeof data.zones === 'object') {
          const zoneKey = `${parentId}:${slotName}`
          if (Array.isArray(data.zones[zoneKey])) {
            sanitizeChildrenInSlot(data.zones[zoneKey], pItem)
          }
        }
      }
    }

    // Recurse into nested slot arrays (e.g. Columns col1, col2, col3 items)
    for (const val of Object.values(pItem.props)) {
      if (Array.isArray(val)) {
        for (const child of val) {
          walkAndSanitize(child)
        }
      }
    }
  }

  if (Array.isArray(data.content)) {
    for (const item of data.content) {
      walkAndSanitize(item)
    }
  }

  if (data.zones && typeof data.zones === 'object') {
    for (const zoneList of Object.values(data.zones)) {
      if (Array.isArray(zoneList)) {
        for (const item of zoneList) {
          walkAndSanitize(item)
        }
      }
    }
  }

  return data
}
