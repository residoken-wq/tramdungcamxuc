import React from 'react'
import type { ComponentConfig, Slot } from '@puckeditor/core'
import { EqPageSection } from '@/components/eq/intro/EqPageSection'
import type { EqAlign, EqFrameBg } from '@/components/eq/intro/EqIntroSections'
import type { EqPageResolved } from '../eq-page-types'

/**
 * BX-08b: blocks of the "EQ Buddy" group for the /eq-buddy page. They store ONLY layout options;
 * every text and the Shopee link come from the "Nội dung EQ Buddy" global when the page renders.
 * The draw button always goes to /eq-buddy/rut-the, where the trial / entitlement rules apply.
 */

type Base = {
  version?: number
  _resolved?: EqPageResolved | null
}

const YES_NO = [
  { label: 'Có', value: true },
  { label: 'Không', value: false },
]

const IN_CARD_FIELD = {
  type: 'radio' as const,
  label: 'Tự đóng khung (khi đặt ngoài "Khung EQ Buddy")',
  options: YES_NO,
}

/** What may be dropped inside "Khung EQ Buddy". */
const FRAME_ALLOW = [
  'EqBuddyWhatIs',
  'EqBuddyDrawButton',
  'EqBuddyGuide',
  'HeadingWidget',
  'TextWidget',
  'ButtonWidget',
  'IconListWidget',
  'ImageWidget',
  'QuoteBlock',
  'VideoEmbed',
  'Spacer',
  'Divider',
  'ShopeeButton',
  'ZaloButton',
]

// ---------------------------------------------------------------------------------------------

export type EqBuddyFrameProps = Base & {
  showSeriesBar?: boolean
  showGuideButton?: boolean
  showHeader?: boolean
  align?: EqAlign
  bg?: EqFrameBg
  content?: Slot
}

export const EqBuddyFrameBlock: ComponentConfig<EqBuddyFrameProps> = {
  label: 'Khung EQ Buddy (đầu trang)',
  fields: {
    showSeriesBar: { type: 'radio', label: 'Thanh tên series + câu châm ngôn', options: YES_NO },
    showGuideButton: { type: 'radio', label: 'Nút "Hướng dẫn" trên thanh', options: YES_NO },
    showHeader: { type: 'radio', label: 'Nhãn, tiêu đề, dòng phụ', options: YES_NO },
    align: {
      type: 'select',
      label: 'Căn tiêu đề',
      options: [
        { label: 'Tự động (giữa trên điện thoại, trái trên máy tính)', value: 'auto' },
        { label: 'Giữa', value: 'center' },
        { label: 'Trái', value: 'left' },
      ],
    },
    bg: {
      type: 'select',
      label: 'Màu nền khung',
      options: [
        { label: 'Trắng ngà (Warm Ivory)', value: 'warm-ivory' },
        { label: 'Trắng', value: 'white' },
        { label: 'Hồng phấn (Soft Pink)', value: 'soft-pink' },
        { label: 'Tím oải hương (Lavender Mist)', value: 'lavender-mist' },
      ],
    },
    content: { type: 'slot', label: 'Nội dung trong khung', allow: FRAME_ALLOW },
  },
  defaultProps: {
    version: 1,
    showSeriesBar: true,
    showGuideButton: true,
    showHeader: true,
    align: 'auto',
    bg: 'warm-ivory',
    content: [],
  },
  render: ({ puck, content: Content, ...p }) => (
    <EqPageSection
      section="frame"
      _resolved={p._resolved}
      isEditing={puck?.isEditing ?? false}
      showSeriesBar={p.showSeriesBar}
      showGuideButton={p.showGuideButton}
      showHeader={p.showHeader}
      align={p.align}
      bg={p.bg}
    >
      {Content ? <Content /> : null}
    </EqPageSection>
  ),
}

// ---------------------------------------------------------------------------------------------

export type EqBuddyWhatIsProps = Base & {
  columns?: 1 | 2 | 4
  showIcons?: boolean
  inCard?: boolean
}

export const EqBuddyWhatIsBlock: ComponentConfig<EqBuddyWhatIsProps> = {
  label: 'Bộ thẻ là gì (4 ô thông tin)',
  fields: {
    columns: {
      type: 'select',
      label: 'Số cột trên máy tính',
      options: [
        { label: '1 cột', value: 1 },
        { label: '2 cột', value: 2 },
        { label: '4 cột', value: 4 },
      ],
    },
    showIcons: { type: 'radio', label: 'Hiện biểu tượng', options: YES_NO },
    inCard: IN_CARD_FIELD,
  },
  defaultProps: { version: 1, columns: 2, showIcons: true, inCard: false },
  render: ({ puck, ...p }) => (
    <EqPageSection
      section="whatIs"
      _resolved={p._resolved}
      isEditing={puck?.isEditing ?? false}
      columns={p.columns}
      showIcons={p.showIcons}
      inCard={p.inCard}
    />
  ),
}

// ---------------------------------------------------------------------------------------------

export type EqBuddyDrawButtonProps = Base & {
  size?: 'auto' | 'large' | 'compact'
  showGuideButton?: boolean
  inCard?: boolean
}

export const EqBuddyDrawButtonBlock: ComponentConfig<EqBuddyDrawButtonProps> = {
  label: 'Nút rút thẻ',
  fields: {
    size: {
      type: 'select',
      label: 'Cỡ nút',
      options: [
        { label: 'Tự động (như trang mặc định)', value: 'auto' },
        { label: 'Lớn', value: 'large' },
        { label: 'Gọn', value: 'compact' },
      ],
    },
    showGuideButton: { type: 'radio', label: 'Kèm nút "Hướng dẫn"', options: YES_NO },
    inCard: IN_CARD_FIELD,
  },
  defaultProps: { version: 1, size: 'auto', showGuideButton: true, inCard: false },
  render: ({ puck, ...p }) => (
    <EqPageSection
      section="draw"
      _resolved={p._resolved}
      isEditing={puck?.isEditing ?? false}
      size={p.size}
      showGuideButton={p.showGuideButton}
      inCard={p.inCard}
    />
  ),
}

// ---------------------------------------------------------------------------------------------

export type EqBuddyGuideProps = Base & {
  mode?: 'inline' | 'button'
  inCard?: boolean
}

export const EqBuddyGuideBlock: ComponentConfig<EqBuddyGuideProps> = {
  label: 'Hướng dẫn 3 bước',
  fields: {
    mode: {
      type: 'radio',
      label: 'Cách hiện',
      options: [
        { label: 'Hiện thẳng trên trang', value: 'inline' },
        { label: 'Nút mở cửa sổ hướng dẫn', value: 'button' },
      ],
    },
    inCard: IN_CARD_FIELD,
  },
  defaultProps: { version: 1, mode: 'inline', inCard: false },
  render: ({ puck, ...p }) => (
    <EqPageSection
      section="guide"
      _resolved={p._resolved}
      isEditing={puck?.isEditing ?? false}
      mode={p.mode}
      inCard={p.inCard}
    />
  ),
}

// ---------------------------------------------------------------------------------------------

export type EqBuddyShopeeProps = Base

export const EqBuddyShopeeBlock: ComponentConfig<EqBuddyShopeeProps> = {
  label: 'Nút mua bộ thẻ trên Shopee (EQ Buddy)',
  fields: {},
  defaultProps: { version: 1 },
  render: ({ puck, ...p }) => (
    <EqPageSection section="shopee" _resolved={p._resolved} isEditing={puck?.isEditing ?? false} />
  ),
}
