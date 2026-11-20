import { vi } from '@/lib/i18n/vi'
import { pickCopy } from '@/lib/copy'
import { appendUtmParams } from '@/lib/utm'
import { safeHref } from '@/lib/safe-href'

/** Fields of the "Nội dung EQ Buddy" global used by the /eq-buddy intro (no access settings). */
export interface EqIntroContent {
  useDefaultCopyIntro?: boolean | null
  useDefaultCopyIntro1?: boolean | null
  useDefaultCopyGuide?: boolean | null
  useDefaultCopyStateIcons?: boolean | null
  useDefaultCopyCardBack?: boolean | null
  tagline?: string | null
  quoteTop?: string | null
  badge?: string | null
  mainTitle?: string | null
  subtitle?: string | null
  shopeeUrl?: string | null
  intro1Heading?: string | null
  intro1Description?: string | null
  card1Title?: string | null
  card1Desc?: string | null
  card2Title?: string | null
  card2Desc?: string | null
  card3Title?: string | null
  card3Desc?: string | null
  card4Title?: string | null
  card4Desc?: string | null
  intro2Heading?: string | null
  intro2Description?: string | null
  step1Title?: string | null
  step1Tag?: string | null
  step1Desc?: string | null
  step2Title?: string | null
  step2Tag?: string | null
  step2Desc?: string | null
  step3Title?: string | null
  step3Tag?: string | null
  step3Desc?: string | null
  step4Title?: string | null
  step4Tag?: string | null
  step4Desc?: string | null
  guideModalTitle?: string | null
  guideModalQuote?: string | null
  guideModalButton?: string | null
}

export const EQ_INTRO_CONTENT_KEYS = [
  'useDefaultCopyIntro',
  'useDefaultCopyIntro1',
  'useDefaultCopyGuide',
  'tagline',
  'quoteTop',
  'badge',
  'mainTitle',
  'subtitle',
  'shopeeUrl',
  'intro1Heading',
  'intro1Description',
  'card1Title',
  'card1Desc',
  'card2Title',
  'card2Desc',
  'card3Title',
  'card3Desc',
  'card4Title',
  'card4Desc',
  'step1Title',
  'step1Desc',
  'step2Title',
  'step2Desc',
  'step3Title',
  'step3Desc',
  'guideModalTitle',
  'guideModalQuote',
  'guideModalButton',
] as const satisfies readonly (keyof EqIntroContent)[]

export interface EqIntroCard {
  title: string
  desc: string | null
}

/** Props of the 3-step guide (modal or inline), straight from the global. */
export interface EqGuideCopy {
  useDefaultCopy: boolean
  title?: string | null
  quote?: string | null
  buttonText?: string | null
  step1Title?: string | null
  step1Desc?: string | null
  step2Title?: string | null
  step2Desc?: string | null
  step3Title?: string | null
  step3Desc?: string | null
}

export interface EqIntroView {
  tagline: string | null
  quoteTop: string | null
  badge: string | null
  mainTitle: string | null
  subtitle: string | null
  intro1Heading: string | null
  intro1Description: string | null
  /** Four info cards in order; an empty title means the card is hidden. */
  cards: EqIntroCard[]
  hasIntro1: boolean
  /** Shopee link with UTM (AGENTS §8.3), or '' when no link is set. */
  shopeeUrl: string
  guide: EqGuideCopy
}

/**
 * Everything the /eq-buddy intro shows, from the "Nội dung EQ Buddy" global (BX-05 rules).
 * Shared by the coded page (`EQBuddyIntro`) and the "EQ Buddy" builder blocks (BX-08b).
 */
export function buildEqIntroView(content: EqIntroContent | null | undefined): EqIntroView {
  const useDefaultIntro = content ? Boolean(content.useDefaultCopyIntro) : true
  const useDefaultIntro1 = content ? Boolean(content.useDefaultCopyIntro1) : true
  const useDefaultGuide = content ? Boolean(content.useDefaultCopyGuide) : true

  const tagline = pickCopy(content?.tagline, vi.bx08.eq.defaultTagline, useDefaultIntro)
  const quoteTop = pickCopy(content?.quoteTop, vi.bx08.eq.defaultQuoteTop, useDefaultIntro)
  const badge = pickCopy(content?.badge, '', useDefaultIntro)
  const mainTitle = pickCopy(content?.mainTitle, vi.au02.introTitle, useDefaultIntro)
  const subtitle = pickCopy(content?.subtitle, vi.au02.introSubtitle, useDefaultIntro)

  const intro1Heading = pickCopy(content?.intro1Heading, '', useDefaultIntro1)
  const intro1Description = pickCopy(content?.intro1Description, '', useDefaultIntro1)
  const cards: EqIntroCard[] = (
    [
      [content?.card1Title, content?.card1Desc],
      [content?.card2Title, content?.card2Desc],
      [content?.card3Title, content?.card3Desc],
      [content?.card4Title, content?.card4Desc],
    ] as const
  ).map(([title, desc]) => ({
    title: pickCopy(title, '', useDefaultIntro1) || '',
    desc: pickCopy(desc, '', useDefaultIntro1) || null,
  }))

  const rawShopeeUrl = content?.shopeeUrl?.trim() || ''
  // Same UTM + event as ShopeeButton (AGENTS §8.3, §9: Shopee link carries UTM, logs external_clicked)
  const shopeeUrl = rawShopeeUrl
    ? safeHref(
        appendUtmParams(rawShopeeUrl, {
          source: 'tramdungcamxuc',
          medium: 'website',
          campaign: 'eq-buddy',
        }),
      ) || rawShopeeUrl
    : ''

  // Hana's review: the "Bộ thẻ là gì" part and its 4 cards are hidden when left empty
  const hasIntro1 = Boolean(intro1Heading || cards.some((c) => c.title))

  return {
    tagline: tagline || null,
    quoteTop: quoteTop || null,
    badge: badge && badge.trim().length > 0 ? badge : null,
    mainTitle: mainTitle || null,
    subtitle: subtitle || null,
    intro1Heading: intro1Heading || null,
    intro1Description: intro1Description || null,
    cards,
    hasIntro1,
    shopeeUrl,
    guide: {
      useDefaultCopy: useDefaultGuide,
      title: content?.guideModalTitle,
      quote: content?.guideModalQuote,
      buttonText: content?.guideModalButton,
      step1Title: content?.step1Title,
      step1Desc: content?.step1Desc,
      step2Title: content?.step2Title,
      step2Desc: content?.step2Desc,
      step3Title: content?.step3Title,
      step3Desc: content?.step3Desc,
    },
  }
}
