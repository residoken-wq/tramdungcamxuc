import React from 'react'
import type { Config } from '@puckeditor/core'
import { HeroTwoEntriesBlock, type HeroTwoEntriesProps } from './blocks/HeroTwoEntries'
import { ImageText, type ImageTextProps } from '@/components/site/ImageText'
import { RichText, type RichTextProps } from '@/components/site/RichText'
import { SectionHeader, type SectionHeaderProps } from '@/components/ui/SectionHeader'
import { vi } from '@/lib/i18n/vi'

import { HeroImageBlock, type HeroImageProps } from './blocks/HeroImage'
import { QuoteBlockConfig, type QuoteBlockProps } from './blocks/QuoteBlock'
import { StatsBarBlock, type StatsBarProps } from './blocks/StatsBar'
import { JourneyStepsBlock, type JourneyStepsProps } from './blocks/JourneySteps'
import { FAQBlock, type FAQProps } from './blocks/FAQ'
import { VideoEmbedBlock, type VideoEmbedProps } from './blocks/VideoEmbed'
import { ColumnsBlock, type ColumnsProps } from './blocks/Columns'
import { SpacerBlock, type SpacerProps } from './blocks/Spacer'
import { DividerBlock, type DividerProps } from './blocks/Divider'
import { ProductGridBlock, type ProductGridProps } from './blocks/ProductGrid'
import { ProductFeatureBlock, type ProductFeatureProps } from './blocks/ProductFeature'
import { PackageComparisonBlock, type PackageComparisonProps } from './blocks/PackageComparison'
import { PriceTagBlock, type ProductPriceTagProps } from './blocks/PriceTag'
import { TrialCTABlock, type TrialCTAProps } from './blocks/TrialCTA'
import { TestimonialGridBlock, type TestimonialGridProps } from './blocks/TestimonialGrid'
import { TestimonialSliderBlock, type TestimonialSliderProps } from './blocks/TestimonialSlider'
import { LogoStripBlock, type LogoStripProps } from './blocks/LogoStrip'
import { HanaStoryBlock, type HanaStoryProps } from './blocks/HanaStory'
import { IconCardGridBlock, type IconCardGridProps } from './blocks/IconCardGrid'
import { CalloutBlock, type CalloutProps } from './blocks/Callout'
import { PackageCardsBlock, type PackageCardsProps } from './blocks/PackageCards'
import { SolutionEcosystemBlock, type SolutionEcosystemProps } from './blocks/SolutionEcosystem'
import { CTASectionBlock, type CTASectionProps } from './blocks/CTASection'

// Khối Chuyển đổi (Conversion Blocks)
import { CTAButtonBlock, type CTAButtonBlockProps } from './blocks/CTAButton'
import { LeadFormBlock, type LeadFormBlockProps } from './blocks/LeadForm'
import {
  BookingCTABlock,
  type BookingCTAProps,
  type BookingCTABlockProps,
} from './blocks/BookingCTA'
import { B2BBriefFormBlock, type B2BBriefFormProps } from './blocks/B2BBriefForm'
import { QuizCTABlock, type QuizCTAProps } from './blocks/QuizCTA'
import { ShopeeButtonBlock, type ShopeeButtonBlockProps } from './blocks/ShopeeButton'
import { ZaloButtonBlock, type ZaloButtonBlockProps } from './blocks/ZaloButton'
import { LibraryPreviewBlock, type LibraryPreviewBlockProps } from './blocks/LibraryPreview'

import { SECTION_BG_COLOR_OPTIONS, BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from './constants'
import { getLockedComponentPermissions } from './locks'

export { SECTION_BG_COLOR_OPTIONS, BRAND_COLOR_OPTIONS, PADDING_OPTIONS }
export type {
  CTAButtonBlockProps,
  LeadFormBlockProps,
  BookingCTAProps,
  B2BBriefFormProps,
  QuizCTAProps,
  ShopeeButtonBlockProps,
  ZaloButtonBlockProps,
  LibraryPreviewBlockProps,
}

export type PageComponentsProps = {
  // Mở đầu
  HeroTwoEntries: HeroTwoEntriesProps
  HeroImage: HeroImageProps
  SectionHeader: SectionHeaderProps
  // Nội dung
  RichText: RichTextProps
  ImageText: ImageTextProps
  QuoteBlock: QuoteBlockProps
  StatsBar: StatsBarProps
  IconCardGrid: IconCardGridProps
  Callout: CalloutProps
  JourneySteps: JourneyStepsProps
  FAQ: FAQProps
  VideoEmbed: VideoEmbedProps
  // Bố cục
  Columns: ColumnsProps
  Spacer: SpacerProps
  Divider: DividerProps
  // Bán hàng
  ProductGrid: ProductGridProps
  ProductFeature: ProductFeatureProps
  PackageCards: PackageCardsProps
  PackageComparison: PackageComparisonProps
  SolutionEcosystem: SolutionEcosystemProps
  PriceTag: ProductPriceTagProps
  TrialCTA: TrialCTAProps
  // Niềm tin
  TestimonialSlider: TestimonialSliderProps
  TestimonialGrid: TestimonialGridProps
  LogoStrip: LogoStripProps
  HanaStory: HanaStoryProps
  // Chuyển đổi
  CTAButton: CTAButtonBlockProps
  CTASection: CTASectionProps
  LeadForm: LeadFormBlockProps
  BookingCTA: BookingCTABlockProps
  B2BBriefForm: B2BBriefFormProps
  QuizCTA: QuizCTAProps
  ShopeeButton: ShopeeButtonBlockProps
  ZaloButton: ZaloButtonBlockProps
  LibraryPreview: LibraryPreviewBlockProps
}

export const puckConfig: Config<PageComponentsProps> = {
  categories: {
    intro: {
      title: 'Mở đầu',
      components: ['HeroTwoEntries', 'HeroImage', 'SectionHeader'],
    },
    content: {
      title: 'Nội dung',
      components: [
        'RichText',
        'ImageText',
        'QuoteBlock',
        'StatsBar',
        'IconCardGrid',
        'Callout',
        'JourneySteps',
        'FAQ',
        'VideoEmbed',
      ],
    },
    layout: {
      title: 'Bố cục',
      components: ['Columns', 'Spacer', 'Divider'],
    },
    sales: {
      title: 'Bán hàng',
      components: [
        'ProductGrid',
        'ProductFeature',
        'PackageCards',
        'PackageComparison',
        'SolutionEcosystem',
        'PriceTag',
        'TrialCTA',
      ],
    },
    trust: {
      title: 'Niềm tin',
      components: ['TestimonialSlider', 'TestimonialGrid', 'LogoStrip', 'HanaStory'],
    },
    conversion: {
      title: 'Chuyển đổi',
      components: [
        'CTAButton',
        'CTASection',
        'LeadForm',
        'BookingCTA',
        'B2BBriefForm',
        'QuizCTA',
        'ShopeeButton',
        'ZaloButton',
        'LibraryPreview',
      ],
    },
  },
  root: {
    label: vi.builder.pageLabel,
    fields: {
      title: {
        type: 'text',
        label: vi.builder.pageTitle,
      },
    },
    render: ({ children }) => (
      <div className="min-h-screen bg-warm-ivory font-sans text-deep-navy antialiased">
        {children}
      </div>
    ),
  },
  components: {
    HeroTwoEntries: HeroTwoEntriesBlock,

    SectionHeader: {
      label: 'Tiêu đề mục (Hai tầng màu)',
      fields: {
        seriesLabel: { type: 'text', label: 'Nhãn series (trên cùng)' },
        titleLine1: { type: 'text', label: 'Tiêu đề dòng 1 (Xanh thẫm)' },
        titleLine2: { type: 'text', label: 'Tiêu đề dòng 2 (Hồng sen)' },
        emotionLine: { type: 'textarea', label: 'Dòng cảm xúc (Playfair Display)' },
        align: {
          type: 'select',
          label: 'Căn lề',
          options: [
            { label: 'Căn giữa', value: 'center' },
            { label: 'Căn trái', value: 'left' },
          ],
        },
        as: {
          type: 'select',
          label: 'Thẻ ngữ nghĩa (Heading Level)',
          options: [
            { label: 'H1 (Tiêu đề chính trang)', value: 'h1' },
            { label: 'H2 (Tiêu đề mục)', value: 'h2' },
            { label: 'H3 (Tiêu đề con)', value: 'h3' },
          ],
        },
      },
      defaultProps: {
        version: 1,
        seriesLabel: '[MẪU] Series',
        titleLine1: '[MẪU] TIÊU ĐỀ DÒNG 1',
        titleLine2: '[MẪU] TIÊU ĐỀ DÒNG 2',
        emotionLine: '[MẪU] Dòng cảm xúc trích dẫn nhẹ nhàng',
        align: 'center',
        as: 'h2',
      },
      render: ({ seriesLabel, titleLine1, titleLine2, emotionLine, align, as }) => (
        <div className="py-6 px-4">
          <div className="mx-auto max-w-5xl">
            <SectionHeader
              seriesLabel={seriesLabel}
              titleLine1={titleLine1}
              titleLine2={titleLine2}
              emotionLine={emotionLine}
              align={align}
              as={as}
            />
          </div>
        </div>
      ),
    },

    RichText: {
      label: 'Đoạn văn bản (Rich Text phân đoạn)',
      fields: {
        content: {
          type: 'textarea',
          label: 'Nội dung văn bản (các đoạn phân tách bằng 2 lần xuống dòng)',
        },
        bgColor: {
          type: 'select',
          label: 'Màu nền',
          options: [...BRAND_COLOR_OPTIONS],
        },
        padding: {
          type: 'select',
          label: 'Khoảng đệm (Padding)',
          options: [...PADDING_OPTIONS],
        },
      },
      defaultProps: {
        version: 1,
        content:
          '[MẪU] Đoạn văn bản thứ nhất chia sẻ những chiêm nghiệm sâu sắc.\n\n[MẪU] Đoạn văn bản thứ hai tiếp nối câu chuyện một cách tự nhiên và ấm áp.',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
      render: (props) => <RichText {...props} />,
    },

    ImageText: {
      label: 'Ảnh & Chữ (Song hành)',
      fields: {
        layout: {
          type: 'select',
          label: 'Bố cục hiển thị',
          options: [
            { label: 'Ảnh bên trái, chữ bên phải', value: 'image-left' },
            { label: 'Ảnh bên phải, chữ bên trái', value: 'image-right' },
          ],
        },
        seriesLabel: { type: 'text', label: 'Nhãn series' },
        titleLine1: { type: 'text', label: 'Tiêu đề dòng 1' },
        titleLine2: { type: 'text', label: 'Tiêu đề dòng 2' },
        content: {
          type: 'textarea',
          label: 'Nội dung văn bản (các đoạn phân tách bằng 2 lần xuống dòng)',
        },
        quote: {
          type: 'textarea',
          label: 'Câu trích dẫn (Playfair Display Italic, tùy chọn)',
        },
        mediaId: {
          type: 'external',
          label: 'Ảnh minh họa (Thư viện media)',
          placeholder: 'Chọn ảnh từ thư viện media...',
          showSearch: true,
          fetchList: async ({ query }) => {
            try {
              const searchParam = query ? `&where[alt][like]=${encodeURIComponent(query)}` : ''
              const res = await fetch(`/api/media?limit=50&depth=0${searchParam}`, {
                credentials: 'include',
              })
              if (!res.ok) return []
              const data = await res.json()
              const docs = (data.docs || []).filter(
                (doc: { alt?: string }) =>
                  doc.alt && typeof doc.alt === 'string' && doc.alt.trim().length > 0,
              )
              return docs
            } catch {
              return []
            }
          },
          mapProp: (item: { id?: string }) => item?.id || '',
          mapRow: (item: {
            url?: string
            thumbnailURL?: string
            alt?: string
            filename?: string
          }) => ({
            'Hình ảnh': (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.url || item.thumbnailURL || ''}
                alt={item.alt || ''}
                style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }}
              />
            ),
            'Mô tả (alt)': item.alt || '',
            'Tên file': item.filename || '',
          }),
          getItemSummary: (id: string) => (id ? `Media ID: ${id}` : 'Chưa chọn ảnh'),
        },
        imageLabel: {
          type: 'text',
          label: 'Nhãn nhỏ góc ảnh (Tùy chọn)',
        },
        buttonText: { type: 'text', label: 'Chữ trên nút (tùy chọn)' },
        buttonLink: { type: 'text', label: 'Đường dẫn liên kết (tùy chọn)' },
        bgColor: {
          type: 'select',
          label: 'Màu nền',
          options: [...BRAND_COLOR_OPTIONS],
        },
        padding: {
          type: 'select',
          label: 'Khoảng đệm (Padding)',
          options: [...PADDING_OPTIONS],
        },
      },
      defaultProps: {
        version: 2,
        layout: 'image-left',
        seriesLabel: '[MẪU] Câu chuyện',
        titleLine1: '[MẪU] DÒNG TIÊU ĐỀ 1',
        titleLine2: '[MẪU] DÒNG TIÊU ĐỀ 2',
        content:
          '[MẪU] Nội dung đoạn thứ nhất kể về hành trình và cảm xúc.\n\n[MẪU] Nội dung đoạn thứ hai làm rõ hơn giá trị mang lại.',
        quote: '',
        mediaId: '',
        imageUrl: '',
        imageAlt: '',
        imageLabel: '',
        buttonText: '[MẪU] Đọc tiếp câu chuyện',
        buttonLink: '#',
        bgColor: 'warm-ivory',
        padding: 'md',
      },
      resolveData: async (data) => {
        const { mediaId } = data.props
        if (!mediaId) {
          return { props: { ...data.props, imageUrl: '', imageAlt: '' } }
        }

        try {
          if (typeof window !== 'undefined') {
            const res = await fetch(`/api/media/${encodeURIComponent(mediaId)}`, {
              credentials: 'include',
            })
            if (res.ok) {
              const json = await res.json()
              if (json && json.alt && typeof json.alt === 'string' && json.alt.trim().length > 0) {
                return {
                  props: {
                    ...data.props,
                    imageUrl: json.url || '',
                    imageAlt: json.alt.trim(),
                  },
                }
              }
            }
          }
        } catch {
          // If media resolution fails, preserve props without throwing
        }

        return { props: { ...data.props, imageUrl: '', imageAlt: '' } }
      },
      // ImageText is a client component: never forward Puck's `puck` object (it holds functions,
      // which cannot be serialised into a client component on the public page).
      render: ({ puck: _puck, ...props }) => <ImageText {...props} />,
    },

    // Chuyển đổi
    CTAButton: CTAButtonBlock,
    CTASection: CTASectionBlock,
    LeadForm: LeadFormBlock,
    BookingCTA: BookingCTABlock,
    B2BBriefForm: B2BBriefFormBlock,
    QuizCTA: QuizCTABlock,
    ShopeeButton: ShopeeButtonBlock,
    ZaloButton: ZaloButtonBlock,
    LibraryPreview: LibraryPreviewBlock,

    HeroImage: HeroImageBlock,
    QuoteBlock: QuoteBlockConfig,
    StatsBar: StatsBarBlock,
    IconCardGrid: IconCardGridBlock,
    Callout: CalloutBlock,
    JourneySteps: JourneyStepsBlock,
    FAQ: FAQBlock,
    VideoEmbed: VideoEmbedBlock,
    Columns: ColumnsBlock,
    Spacer: SpacerBlock,
    Divider: DividerBlock,

    ProductGrid: ProductGridBlock,
    ProductFeature: ProductFeatureBlock,
    PackageCards: PackageCardsBlock,
    PackageComparison: PackageComparisonBlock,
    SolutionEcosystem: SolutionEcosystemBlock,
    PriceTag: PriceTagBlock,
    TrialCTA: TrialCTABlock,

    TestimonialSlider: TestimonialSliderBlock,
    TestimonialGrid: TestimonialGridBlock,
    LogoStrip: LogoStripBlock,
    HanaStory: HanaStoryBlock,
  },
}

/**
 * Lấy cấu hình Puck phù hợp với từng trang, gắn các quyền khóa khối tự động (VD: HeroTwoEntries trên trang chủ).
 */
export function getPuckConfig(options?: { pageSlug?: string }): Config<PageComponentsProps> {
  const pageSlug = options?.pageSlug || '/'
  const heroPermissions = getLockedComponentPermissions('HeroTwoEntries', pageSlug)

  if (!heroPermissions) {
    return puckConfig
  }

  return {
    ...puckConfig,
    components: {
      ...puckConfig.components,
      HeroTwoEntries: {
        ...puckConfig.components.HeroTwoEntries,
        permissions: heroPermissions,
      },
    },
  }
}

export default puckConfig
