import { vi } from '@/lib/i18n/vi'
import { getEffectivePrice } from '@/lib/products'
import { pickCopy, pickCopyList } from '@/lib/copy'
import type { HabitProductData } from '@/lib/habit.server'

export type OfferBg = 'warm-ivory' | 'white'

export interface OfferListItem {
  title: string
  desc: string
}

/**
 * Everything the offer page shows, computed once from the product (PK-30 / BX-03 / BX-05 rules).
 * Shared by the coded page (`HabitOfferClient`) and the builder blocks of the "Trang sản phẩm"
 * group (BX-08), so both render the same content from the same product fields.
 */
export interface OfferView {
  product: HabitProductData | null
  journeyDays: number
  pricing: { price: number | null; salePrice: number | null }
  hasPrice: boolean
  trialDays: number | null
  isLifetime: boolean
  cta: HabitProductData['cta'] | null
  videoCount: number
  techniqueCount: number
  seriesLabel: string | null
  titleLine1: string
  titleLine2: string | null
  emotionLine: string | null
  coverImage: { url?: string | null; alt?: string | null } | null
  includesHeading: string | null
  includes: readonly string[]
  curriculumHeading: string | null
  curriculumSubheading: string | null
  curriculumModules: readonly OfferListItem[]
  curriculumUnitStatLabel: string
  featuresHeading: string | null
  featuresSubheading: string | null
  featureItems: readonly OfferListItem[]
  faq: readonly { question: string; answer?: string | null }[]
  bottomTitle: string | null
  bottomDescription: string | null
  useDefaultStats: boolean
  show: {
    includes: boolean
    stats: boolean
    curriculum: boolean
    features: boolean
    faq: boolean
    bottom: boolean
  }
}

export interface BuildOfferViewOptions {
  /**
   * Builder pages (BX-08) ignore the BX-03 "Ẩn phần này" flags: Hana removes a block instead.
   * Empty-content hiding (AU-03 / BX-05) still applies.
   */
  ignoreHideFlags?: boolean
  now?: Date
}

export function buildOfferView(
  product: HabitProductData | null,
  journeyDays = 28,
  options: BuildOfferViewOptions = {},
): OfferView {
  const pricing = product
    ? getEffectivePrice(
        {
          price: product.price ?? null,
          salePrice: product.salePrice ?? null,
          saleEndsAt: product.saleEndsAt ?? null,
        },
        options.now ?? new Date(),
      )
    : { price: null, salePrice: null }

  const hasPrice = pricing.price != null || pricing.salePrice != null
  const trialDays =
    typeof product?.trialDays === 'number' && product.trialDays > 0 ? product.trialDays : null
  const cta = product?.cta || null

  const videoCount = typeof product?.videoCount === 'number' ? product.videoCount : 0
  const techniqueCount = typeof product?.techniqueCount === 'number' ? product.techniqueCount : 0
  const isLifetime = !product?.accessDurationDays || product.accessDurationDays <= 0

  // BX-05: "Dùng chữ mặc định cho ô để trống" per section
  const useDefaultHero = Boolean(product?.useDefaultCopyHero)
  const useDefaultIncludes = Boolean(product?.useDefaultCopyIncludes)
  const useDefaultStats = Boolean(product?.useDefaultCopyStats)
  const useDefaultCurriculum = Boolean(product?.useDefaultCopyCurriculum)
  const useDefaultFeatures = Boolean(product?.useDefaultCopyFeatures)
  const useDefaultFaq = Boolean(product?.useDefaultCopyFaq)
  const useDefaultBottom = Boolean(product?.useDefaultCopyBottom)

  const seriesLabel = pickCopy(product?.offerSeriesLabel, vi.habit.offer.badge, useDefaultHero)
  const rawTitle1 = pickCopy(product?.offerTitleLine1, vi.habit.offer.titleLine1, useDefaultHero)
  const titleLine2 = pickCopy(product?.offerTitleLine2, vi.habit.offer.titleLine2, useDefaultHero)
  const titleLine1 =
    rawTitle1 || (!titleLine2 ? product?.name || vi.habit.offer.titleLine1 : '')
  const emotionLine = pickCopy(
    product?.offerEmotionLine,
    vi.habit.offer.emotionalLine,
    useDefaultHero,
  )

  const rawIncludes = product?.includes && product.includes.length > 0 ? product.includes : []
  const defaultIncludes = [
    '20 video bài giảng chuyên sâu',
    '11 kỹ thuật bẻ gãy trì hoãn',
    `Habit Tracker ${journeyDays} ngày tương tác`,
    'Lộ trình 5 giai đoạn rõ ràng',
  ]
  const includes = pickCopyList(rawIncludes, defaultIncludes, useDefaultIncludes)
  const includesHeading = pickCopy(
    product?.shortDescription,
    vi.habit.offer.includesHeading,
    useDefaultIncludes,
  )

  const rawModules =
    product?.curriculumModules && product.curriculumModules.length > 0
      ? product.curriculumModules.map((m) => ({ title: m.title, desc: m.description || '' }))
      : []
  const curriculumModules = pickCopyList(
    rawModules,
    vi.habit.offer.curriculum.modules,
    useDefaultCurriculum,
  )
  const modulesCount = curriculumModules.length
  const curriculumUnitLabel = product?.curriculumUnitLabel?.trim() || ''
  const defaultCurriculumHeading = curriculumUnitLabel
    ? vi.habit.offer.curriculum.headingWithUnit(modulesCount, curriculumUnitLabel)
    : vi.habit.offer.curriculum.heading
  const curriculumHeading = pickCopy(
    product?.curriculumHeading,
    defaultCurriculumHeading,
    useDefaultCurriculum,
  )
  const curriculumSubheading = pickCopy(
    product?.curriculumSubheading,
    vi.habit.offer.curriculum.subheading,
    useDefaultCurriculum,
  )
  const curriculumUnitStatLabel = curriculumUnitLabel || vi.habit.offer.stats.modules

  const rawFeatures =
    product?.featureItems && product.featureItems.length > 0
      ? product.featureItems.map((f) => ({ title: f.title, desc: f.description || '' }))
      : []
  const featureItems = pickCopyList(rawFeatures, vi.habit.offer.features.items, useDefaultFeatures)
  const featuresHeading = pickCopy(
    product?.featuresHeading,
    vi.habit.offer.features.heading,
    useDefaultFeatures,
  )
  const featuresSubheading = pickCopy(
    product?.featuresSubheading,
    vi.habit.offer.features.subheading,
    useDefaultFeatures,
  )

  const rawFaq = product?.faq && product.faq.length > 0 ? product.faq : []
  const defaultFaq = vi.habit.offer.faq.items.map((item) => ({ question: item.q, answer: item.a }))
  const faq = pickCopyList(rawFaq, defaultFaq, useDefaultFaq)

  const defaultBottomTitle = vi.habit.offer.bottomTitle(journeyDays)
  const rawBottomTitle = product?.bottomTitle?.trim()
    ? product.bottomTitle.replace(/{ngay}/g, String(journeyDays))
    : null
  const bottomTitle = pickCopy(rawBottomTitle, defaultBottomTitle, useDefaultBottom)
  const defaultBottomDescription = vi.habit.offer.bottomDesc(videoCount, techniqueCount)
  const bottomDescription = pickCopy(
    product?.bottomDescription,
    defaultBottomDescription,
    useDefaultBottom,
  )

  const hide = (flag: boolean | null | undefined) => !options.ignoreHideFlags && Boolean(flag)

  return {
    product,
    journeyDays,
    pricing: { price: pricing.price ?? null, salePrice: pricing.salePrice ?? null },
    hasPrice,
    trialDays,
    isLifetime,
    cta,
    videoCount,
    techniqueCount,
    seriesLabel: seriesLabel ?? null,
    titleLine1: titleLine1 ?? '',
    titleLine2: titleLine2 ?? null,
    emotionLine: emotionLine ?? null,
    coverImage: product?.coverImage ?? null,
    includesHeading: includesHeading ?? null,
    includes,
    curriculumHeading: curriculumHeading ?? null,
    curriculumSubheading: curriculumSubheading ?? null,
    curriculumModules,
    curriculumUnitStatLabel,
    featuresHeading: featuresHeading ?? null,
    featuresSubheading: featuresSubheading ?? null,
    featureItems,
    faq,
    bottomTitle: bottomTitle ?? null,
    bottomDescription: bottomDescription ?? null,
    useDefaultStats,
    show: {
      includes: !hide(product?.hideOfferIncludes) && includes.length > 0,
      stats:
        !hide(product?.hideOfferStats) &&
        (useDefaultStats ||
          videoCount > 0 ||
          techniqueCount > 0 ||
          journeyDays > 0 ||
          modulesCount > 0),
      curriculum: !hide(product?.hideOfferCurriculum) && curriculumModules.length > 0,
      features: !hide(product?.hideOfferFeatures) && featureItems.length > 0,
      faq: !hide(product?.hideOfferFaq) && faq.length > 0,
      bottom:
        !hide(product?.hideOfferBottom) && (Boolean(bottomTitle || bottomDescription) || Boolean(cta)),
    },
  }
}

/**
 * Coded page: section backgrounds alternate warm-ivory / white, skipping hidden sections, so
 * two sections of the same colour never touch (BX-03).
 */
export function alternateOfferBackgrounds(show: OfferView['show']): {
  stats: OfferBg
  curriculum: OfferBg
  features: OfferBg
  faq: OfferBg
} {
  let current: OfferBg = 'warm-ivory'
  const next = (visible: boolean, fallback: OfferBg): OfferBg => {
    if (!visible) return fallback
    current = current === 'warm-ivory' ? 'white' : 'warm-ivory'
    return current
  }
  const stats = next(show.stats, 'white')
  const curriculum = next(show.curriculum, 'warm-ivory')
  const features = next(show.features, 'white')
  const faq = next(show.faq, 'warm-ivory')
  return { stats, curriculum, features, faq }
}
