import React from 'react'
import type { ComponentConfig, Fields, Slot } from '@puckeditor/core'
import { ProductPageSection } from '@/components/habit/offer/ProductPageSection'
import {
  ProductResourceFormBlock as ProductResourceFormSection,
  type ProductResourceResolved,
} from '@/components/site/ProductResourceFormBlock'
import type { OfferSecondaryButton, OfferSectionBg } from '@/components/habit/offer/OfferSections'
import type { OfferListLayout } from '@/components/habit/offer/OfferSections'
import type {
  TitleHighlightAnimation,
  TitleHighlightStyle,
} from '@/components/ui/TwoToneTitle'
import { safeHref } from '@/lib/safe-href'
import { createProductExternalField } from '../product-field'
import { titleHighlightAnimationField, titleHighlightStyleField } from '../title-highlight-field'
import type { ProductPageResolved } from '../product-page-types'

/**
 * BX-08: blocks of the "Trang sản phẩm" group. Each stores ONLY the product id and layout options;
 * texts, prices, lists and buttons are read from the product when the page renders.
 */

/** Small elements that may be dropped into the "Thêm phần tử" area of a section. */
const EXTRA_ALLOW = [
  'HeadingWidget',
  'TextWidget',
  'ButtonWidget',
  'IconListWidget',
  'ImageWidget',
  'QuoteBlock',
  'VideoEmbed',
  'Spacer',
  'Divider',
  'CTAButton',
  'ShopeeButton',
  'ZaloButton',
]

const SECTION_BG_OPTIONS: { label: string; value: OfferSectionBg }[] = [
  { label: 'Trắng ngà (Warm Ivory)', value: 'warm-ivory' },
  { label: 'Trắng', value: 'white' },
  { label: 'Hồng phấn (Soft Pink)', value: 'soft-pink' },
  { label: 'Tím oải hương (Lavender Mist)', value: 'lavender-mist' },
  { label: 'Xanh bạc hà (Mint Haze)', value: 'mint-haze' },
  { label: 'Vàng kem (Butter Cream)', value: 'butter-cream' },
]

const YES_NO = [
  { label: 'Có', value: true },
  { label: 'Không', value: false },
]

const LIST_LAYOUT_OPTIONS: { label: string; value: OfferListLayout }[] = [
  { label: 'Danh sách dọc', value: 'list' },
  { label: 'Lưới 2 cột', value: 'grid-2' },
  { label: 'Lưới 3 cột', value: 'grid-3' },
]

type Base = {
  version?: number
  productId?: string
  _resolved?: ProductPageResolved | null
}

type SecondaryProps = {
  secondaryButton?: 'habitLoop' | 'none' | 'custom'
  secondaryLabel?: string
  secondaryHref?: string
}

function toSecondary(p: SecondaryProps): OfferSecondaryButton {
  if (p.secondaryButton === 'none') return { kind: 'none' }
  if (p.secondaryButton === 'custom') {
    const href = safeHref(p.secondaryHref || '')
    return href && p.secondaryLabel?.trim()
      ? { kind: 'custom', label: p.secondaryLabel.trim(), href }
      : { kind: 'none' }
  }
  return { kind: 'habitLoop' }
}

const productField = createProductExternalField<string | undefined>({ label: 'Sản phẩm' })

const secondaryFields = {
  secondaryButton: {
    type: 'select' as const,
    label: 'Nút phụ',
    options: [
      { label: 'Trải nghiệm Habit Loop 5 phút', value: 'habitLoop' },
      { label: 'Không có nút phụ', value: 'none' },
      { label: 'Nút tự chọn', value: 'custom' },
    ],
  },
  secondaryLabel: { type: 'text' as const, label: 'Chữ trên nút phụ' },
  secondaryHref: {
    type: 'text' as const,
    label: 'Đường dẫn nút phụ (VD /lien-he)',
  },
}

/** Hide the custom-button inputs unless "Nút tự chọn" is selected. */
function withSecondaryResolve<P extends SecondaryProps>(fields: Fields<P>, props: P): Fields<P> {
  if (props.secondaryButton === 'custom') return fields
  const next = { ...fields } as Record<string, unknown>
  delete next.secondaryLabel
  delete next.secondaryHref
  return next as Fields<P>
}

// ---------------------------------------------------------------------------------------------

export type ProductOfferHeroProps = Base &
  SecondaryProps & {
    imagePosition?: 'none' | 'left' | 'right'
    align?: 'center' | 'left'
    showPrice?: boolean
    showIncludes?: boolean
    showPrimaryCta?: boolean
    bg?: OfferSectionBg
    titleHighlightStyle?: TitleHighlightStyle
    titleHighlightAnimation?: TitleHighlightAnimation
    extra?: Slot
  }

export const ProductOfferHeroBlock: ComponentConfig<ProductOfferHeroProps> = {
  label: 'Hero sản phẩm',
  fields: {
    productId: productField,
    imagePosition: {
      type: 'select',
      label: 'Ảnh bìa sản phẩm',
      options: [
        { label: 'Không hiện ảnh', value: 'none' },
        { label: 'Ảnh bên trái', value: 'left' },
        { label: 'Ảnh bên phải', value: 'right' },
      ],
    },
    align: {
      type: 'radio',
      label: 'Căn chữ',
      options: [
        { label: 'Giữa', value: 'center' },
        { label: 'Trái', value: 'left' },
      ],
    },
    showPrice: { type: 'radio', label: 'Hiện giá', options: YES_NO },
    showIncludes: { type: 'radio', label: 'Hiện danh sách ✓', options: YES_NO },
    showPrimaryCta: {
      type: 'radio',
      label: 'Nút chính (Mua / Dùng thử / Nhận)',
      options: YES_NO,
    },
    ...secondaryFields,
    bg: { type: 'select', label: 'Màu nền', options: SECTION_BG_OPTIONS },
    titleHighlightStyle: titleHighlightStyleField,
    titleHighlightAnimation: titleHighlightAnimationField,
    extra: { type: 'slot', label: 'Thêm phần tử (dưới nút)', allow: EXTRA_ALLOW },
  },
  defaultProps: {
    version: 1,
    productId: '',
    imagePosition: 'none',
    align: 'center',
    showPrice: true,
    showIncludes: true,
    showPrimaryCta: true,
    secondaryButton: 'habitLoop',
    bg: 'warm-ivory',
    titleHighlightStyle: 'color',
    titleHighlightAnimation: 'none',
    extra: [],
  },
  resolveFields: (data, { fields }) => withSecondaryResolve(fields, data.props),
  render: ({ puck, extra: Extra, ...p }) => (
    <ProductPageSection
      section="hero"
      productId={p.productId}
      _resolved={p._resolved}
      isEditing={puck?.isEditing ?? false}
      imagePosition={p.imagePosition}
      align={p.align}
      showPrice={p.showPrice}
      showIncludes={p.showIncludes}
      showPrimaryCta={p.showPrimaryCta}
      bg={p.bg}
      titleHighlightStyle={p.titleHighlightStyle}
      titleHighlightAnimation={p.titleHighlightAnimation}
      secondaryButton={toSecondary(p)}
    >
      {Extra ? <Extra /> : null}
    </ProductPageSection>
  ),
}

// ---------------------------------------------------------------------------------------------

export type ProductOfferStatsProps = Base & {
  showVideos?: boolean
  showTechniques?: boolean
  showDays?: boolean
  showUnits?: boolean
  mobileColumns?: 1 | 2
  bg?: OfferSectionBg
}

export const ProductOfferStatsBlock: ComponentConfig<ProductOfferStatsProps> = {
  label: 'Thanh số liệu sản phẩm',
  fields: {
    productId: productField,
    showVideos: { type: 'radio', label: 'Số video bài giảng', options: YES_NO },
    showTechniques: { type: 'radio', label: 'Số kỹ thuật', options: YES_NO },
    showDays: { type: 'radio', label: 'Số ngày hành trình', options: YES_NO },
    showUnits: { type: 'radio', label: 'Số đơn vị lộ trình', options: YES_NO },
    mobileColumns: {
      type: 'radio',
      label: 'Trên điện thoại',
      options: [
        { label: '2 ô một hàng', value: 2 },
        { label: '1 ô một hàng', value: 1 },
      ],
    },
    bg: { type: 'select', label: 'Màu nền', options: SECTION_BG_OPTIONS },
  },
  defaultProps: {
    version: 1,
    productId: '',
    showVideos: true,
    showTechniques: true,
    showDays: true,
    showUnits: true,
    mobileColumns: 2,
    bg: 'white',
  },
  render: ({ puck, ...p }) => (
    <ProductPageSection
      section="stats"
      productId={p.productId}
      _resolved={p._resolved}
      isEditing={puck?.isEditing ?? false}
      items={[
        ...(p.showVideos !== false ? (['videos'] as const) : []),
        ...(p.showTechniques !== false ? (['techniques'] as const) : []),
        ...(p.showDays !== false ? (['days'] as const) : []),
        ...(p.showUnits !== false ? (['units'] as const) : []),
      ]}
      mobileColumns={p.mobileColumns}
      bg={p.bg}
    />
  ),
}

// ---------------------------------------------------------------------------------------------

export type ProductOfferCurriculumProps = Base & {
  layout?: OfferListLayout
  numbered?: boolean
  bg?: OfferSectionBg
}

export const ProductOfferCurriculumBlock: ComponentConfig<ProductOfferCurriculumProps> = {
  label: 'Lộ trình sản phẩm',
  fields: {
    productId: productField,
    layout: { type: 'select', label: 'Bố cục', options: LIST_LAYOUT_OPTIONS },
    numbered: { type: 'radio', label: 'Đánh số 01, 02…', options: YES_NO },
    bg: { type: 'select', label: 'Màu nền', options: SECTION_BG_OPTIONS },
  },
  defaultProps: { version: 1, productId: '', layout: 'list', numbered: true, bg: 'warm-ivory' },
  render: ({ puck, ...p }) => (
    <ProductPageSection
      section="curriculum"
      productId={p.productId}
      _resolved={p._resolved}
      isEditing={puck?.isEditing ?? false}
      layout={p.layout}
      numbered={p.numbered}
      bg={p.bg}
    />
  ),
}

// ---------------------------------------------------------------------------------------------

export type ProductOfferFeaturesProps = Base & {
  layout?: OfferListLayout
  showIcon?: boolean
  bg?: OfferSectionBg
}

export const ProductOfferFeaturesBlock: ComponentConfig<ProductOfferFeaturesProps> = {
  label: 'Khác biệt của sản phẩm',
  fields: {
    productId: productField,
    layout: { type: 'select', label: 'Bố cục', options: LIST_LAYOUT_OPTIONS },
    showIcon: { type: 'radio', label: 'Hiện dấu ✓', options: YES_NO },
    bg: { type: 'select', label: 'Màu nền', options: SECTION_BG_OPTIONS },
  },
  defaultProps: { version: 1, productId: '', layout: 'grid-3', showIcon: true, bg: 'white' },
  render: ({ puck, ...p }) => (
    <ProductPageSection
      section="features"
      productId={p.productId}
      _resolved={p._resolved}
      isEditing={puck?.isEditing ?? false}
      layout={p.layout}
      showIcon={p.showIcon}
      bg={p.bg}
    />
  ),
}

// ---------------------------------------------------------------------------------------------

export type ProductOfferFaqProps = Base & {
  columns?: 1 | 2
  bg?: OfferSectionBg
}

export const ProductOfferFaqBlock: ComponentConfig<ProductOfferFaqProps> = {
  label: 'Câu hỏi của sản phẩm',
  fields: {
    productId: productField,
    columns: {
      type: 'radio',
      label: 'Số cột',
      options: [
        { label: '1 cột', value: 1 },
        { label: '2 cột', value: 2 },
      ],
    },
    bg: { type: 'select', label: 'Màu nền', options: SECTION_BG_OPTIONS },
  },
  defaultProps: { version: 1, productId: '', columns: 1, bg: 'warm-ivory' },
  render: ({ puck, ...p }) => (
    <ProductPageSection
      section="faq"
      productId={p.productId}
      _resolved={p._resolved}
      isEditing={puck?.isEditing ?? false}
      columns={p.columns}
      bg={p.bg}
    />
  ),
}

// ---------------------------------------------------------------------------------------------

export type ProductOfferBottomProps = Base &
  SecondaryProps & {
    bg?: 'gradient' | OfferSectionBg
    extra?: Slot
  }

export const ProductOfferBottomBlock: ComponentConfig<ProductOfferBottomProps> = {
  label: 'Khối cuối sản phẩm',
  fields: {
    productId: productField,
    ...secondaryFields,
    bg: {
      type: 'select',
      label: 'Màu nền',
      options: [{ label: 'Chuyển màu thương hiệu', value: 'gradient' }, ...SECTION_BG_OPTIONS],
    },
    extra: { type: 'slot', label: 'Thêm phần tử (dưới nút)', allow: EXTRA_ALLOW },
  },
  defaultProps: {
    version: 1,
    productId: '',
    secondaryButton: 'habitLoop',
    bg: 'gradient',
    extra: [],
  },
  resolveFields: (data, { fields }) => withSecondaryResolve(fields, data.props),
  render: ({ puck, extra: Extra, ...p }) => (
    <ProductPageSection
      section="bottom"
      productId={p.productId}
      _resolved={p._resolved}
      isEditing={puck?.isEditing ?? false}
      bg={p.bg}
      secondaryButton={toSecondary(p)}
    >
      {Extra ? <Extra /> : null}
    </ProductPageSection>
  ),
}

// ---------------------------------------------------------------------------------------------

export type ProductResourceFormProps = {
  version?: number
  productId?: string
  _resolved?: ProductResourceResolved | null
}

export const ProductResourceFormBlock: ComponentConfig<ProductResourceFormProps> = {
  label: 'Form nhận tài nguyên',
  fields: {
    productId: productField,
  },
  defaultProps: { version: 1, productId: '' },
  render: ({ puck, ...p }) => (
    <ProductResourceFormSection
      productId={p.productId}
      _resolved={p._resolved}
      isEditing={puck?.isEditing ?? false}
    />
  ),
}
