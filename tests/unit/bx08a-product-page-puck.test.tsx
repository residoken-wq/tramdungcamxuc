import React from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { isReservedAppSlug } from '../../src/lib/pages/reserved-slugs'
import { buildProductPageData, productPageTarget } from '../../src/puck/templates/product-page'
import { buildOfferView } from '../../src/lib/habit/offer-view'
import {
  OfferCurriculum,
  OfferFaq,
  OfferHero,
  OfferStats,
} from '../../src/components/habit/offer/OfferSections'
import { ProductPageSection } from '../../src/components/habit/offer/ProductPageSection'
import type { HabitProductData } from '../../src/lib/habit.server'
import { vi } from '../../src/lib/i18n/vi'

const product: HabitProductData = {
  id: 42,
  name: '[MẪU] Habit Tracker số',
  slug: 'habit-tracker-so',
  price: 250000,
  salePrice: 178000,
  saleEndsAt: null,
  trialDays: 28,
  accessDurationDays: null,
  shortDescription: '[MẪU] Bộ tài liệu tự học',
  saleStatus: 'on_sale',
  includes: ['[MẪU] Mục 1', '[MẪU] Mục 2'],
  faq: [{ question: '[MẪU] Câu hỏi?', answer: '[MẪU] Trả lời.' }],
  coverImage: { url: '/media/mau.jpg', alt: '[MẪU] Ảnh bìa' },
  cta: {
    kind: 'trial',
    label: 'Dùng thử 28 ngày miễn phí',
    href: '/dung-thu?san-pham=habit-tracker-so',
  },
  videoCount: 20,
  techniqueCount: 11,
  offerSeriesLabel: '[MẪU] Series',
  offerTitleLine1: '[MẪU] Dòng 1',
  offerTitleLine2: '[MẪU] Dòng 2',
  offerEmotionLine: '[MẪU] Cảm xúc',
  curriculumHeading: '[MẪU] Lộ trình',
  curriculumUnitLabel: 'giai đoạn',
  curriculumSubheading: null,
  curriculumModules: [
    { title: '[MẪU] Giai đoạn 1', description: 'a' },
    { title: '[MẪU] Giai đoạn 2', description: 'b' },
  ],
  featuresHeading: '[MẪU] Khác biệt',
  featuresSubheading: null,
  featureItems: [{ title: '[MẪU] Điểm 1', description: 'x' }],
  bottomTitle: '[MẪU] Bắt đầu {ngay} ngày',
  bottomDescription: null,
  hideOfferIncludes: false,
  hideOfferStats: false,
  hideOfferCurriculum: true,
  hideOfferFeatures: true,
  hideOfferFaq: false,
  hideOfferBottom: false,
  useDefaultCopyHero: false,
  useDefaultCopyIncludes: false,
  useDefaultCopyStats: false,
  useDefaultCopyCurriculum: false,
  useDefaultCopyFeatures: false,
  useDefaultCopyFaq: false,
  useDefaultCopyBottom: false,
} as HabitProductData

describe('BX-08a: product pages editable with the builder', () => {
  it('application screens can never be builder page slugs; product pages can', () => {
    for (const slug of [
      'habit/tracker',
      '/habit/hoc/12',
      'eq-buddy/rut-the',
      'tai-khoan',
      'thanh-toan/abc',
    ]) {
      expect(isReservedAppSlug(slug), slug).toBe(true)
    }
    for (const slug of [
      'habit/1-percent-better',
      'tai-nguyen/ebook-mau',
      'eq-buddy',
      'lien-he',
      '/',
    ]) {
      expect(isReservedAppSlug(slug), slug).toBe(false)
    }
  })

  it('productPageTarget maps products to the coded page they can replace', () => {
    expect(productPageTarget({ slug: 'habit-tracker-so', type: 'digital_tool' })).toEqual({
      kind: 'offer',
      slug: 'habit/1-percent-better',
    })
    expect(productPageTarget({ slug: 'ebook-mau', type: 'ebook', saleStatus: 'free' })).toEqual({
      kind: 'resource',
      slug: 'tai-nguyen/ebook-mau',
    })
    expect(
      productPageTarget({ slug: 'ebook-mau', type: 'ebook', saleStatus: 'on_sale' }),
    ).toBeNull()
    expect(productPageTarget({ slug: 'eq-buddy-so', type: 'digital_tool' })).toBeNull()
    expect(productPageTarget({ slug: '' })).toBeNull()
  })

  it('templates store only the product id – no price, name or text of the product', () => {
    const offer = buildProductPageData('offer', 42, '[MẪU] Trang')
    expect(offer.content.map((b) => b.type)).toEqual([
      'ProductOfferHero',
      'ProductOfferStats',
      'ProductOfferCurriculum',
      'ProductOfferFeatures',
      'ProductOfferFaq',
      'ProductOfferBottom',
    ])
    for (const block of offer.content) expect(block.props.productId).toBe('42')
    const json = JSON.stringify(offer)
    for (const leaked of ['250000', '178000', 'Dùng thử', '[MẪU] Dòng 1', 'Giai đoạn']) {
      expect(json).not.toContain(leaked)
    }
    const resource = buildProductPageData('resource', 7, 'x')
    expect(resource.content.map((b) => b.type)).toEqual(['ProductOfferHero', 'ProductResourceForm'])
    expect(resource.content[0].props.showPrimaryCta).toBe(false)
  })

  it('builder pages ignore the BX-03 hide flags; the coded page keeps them', () => {
    expect(buildOfferView(product).show.curriculum).toBe(false)
    expect(buildOfferView(product, 28, { ignoreHideFlags: true }).show.curriculum).toBe(true)
    expect(buildOfferView(product, 28, { ignoreHideFlags: true }).show.features).toBe(true)
  })

  it('section layout options change the markup; defaults keep the coded layout', () => {
    const view = buildOfferView(product, 28, { ignoreHideFlags: true })
    const plain = renderToStaticMarkup(<OfferHero view={view} />)
    expect(plain).toContain('max-w-4xl mx-auto px-4 sm:px-6 text-center')
    expect(plain).not.toContain('<img')
    const right = renderToStaticMarkup(<OfferHero view={view} imagePosition="right" />)
    expect(right).toContain('lg:grid-cols-2')
    expect(right).toContain('lg:order-2 relative')
    const noButtons = renderToStaticMarkup(
      <OfferHero
        view={view}
        showPrimaryCta={false}
        secondaryButton={{ kind: 'none' }}
        showPrice={false}
      />,
    )
    expect(noButtons).not.toContain('Dùng thử 28 ngày miễn phí')
    expect(noButtons).not.toContain(vi.habit.offer.habitLoopCta)
    expect(noButtons).not.toContain('178.000')

    const stats = renderToStaticMarkup(
      <OfferStats view={view} items={['days']} mobileColumns={1} />,
    )
    expect(stats).toContain('grid-cols-1 md:grid-cols-4')
    expect(stats).not.toContain(vi.habit.offer.stats.videos)

    const grid = renderToStaticMarkup(
      <OfferCurriculum view={view} layout="grid-2" numbered={false} />,
    )
    expect(grid).toContain('md:grid-cols-2')
    expect(grid).not.toContain('>01<')

    const faq2 = renderToStaticMarkup(<OfferFaq view={view} columns={2} bg="mint-haze" />)
    expect(faq2).toContain('bg-mint-haze')
    expect(faq2).toContain('md:grid-cols-2')
  })

  it('block section renders from resolved product data; editor hints only while editing', () => {
    const resolved = { offer: product, journeyDays: 28 }
    const html = renderToStaticMarkup(
      <ProductPageSection section="hero" productId="42" _resolved={resolved} />,
    )
    expect(html).toContain('[MẪU] Dòng 1')
    expect(html).toContain('178.000')

    expect(renderToStaticMarkup(<ProductPageSection section="faq" productId="" />)).toBe('')
    expect(
      renderToStaticMarkup(<ProductPageSection section="faq" productId="" isEditing />),
    ).toContain(vi.bx08.chooseProduct)

    const missing = { offer: null, journeyDays: 28 }
    expect(
      renderToStaticMarkup(
        <ProductPageSection section="stats" productId="9" _resolved={missing} />,
      ),
    ).toBe('')
    expect(
      renderToStaticMarkup(
        <ProductPageSection section="stats" productId="9" _resolved={missing} isEditing />,
      ),
    ).toContain(vi.bx08.productUnavailable)
  })
})
