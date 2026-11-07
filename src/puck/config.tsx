import React from 'react'
import type { Config } from '@puckeditor/core'
import { HeroTwoEntriesBlock, type HeroTwoEntriesProps } from './blocks/HeroTwoEntries'
import { ImageText, type ImageTextProps } from '@/components/site/ImageText'
import { RichText, type RichTextProps } from '@/components/site/RichText'
import { SectionHeader, type SectionHeaderProps } from '@/components/ui/SectionHeader'
import { vi } from '@/lib/i18n/vi'
import { isOpen, type CleanDesignSystem } from '@/lib/design/design-system'
import { PageCustomCssControl } from './editor/PageCustomCssControl'

import { withBlockStyles } from './style/with-block-style'
import { getSingleChildSlots } from './child-slots'
import { AddChildField } from './editor/AddChildField'
import { HeroImageBlock, type HeroImageProps } from './blocks/HeroImage'
import { QuoteBlockConfig, type QuoteBlockProps } from './blocks/QuoteBlock'
import { StatsBarBlock, type StatsBarProps } from './blocks/StatsBar'
import { JourneyStepsBlock, type JourneyStepsProps } from './blocks/JourneySteps'
import { FAQBlock, type FAQProps } from './blocks/FAQ'
import { VideoEmbedBlock, type VideoEmbedProps } from './blocks/VideoEmbed'
import { HeadingWidgetBlock, type HeadingWidgetProps } from './blocks/widgets/HeadingWidget'
import { TextWidgetBlock, type TextWidgetProps } from './blocks/widgets/TextWidget'
import { ImageWidgetBlock, type ImageWidgetProps } from './blocks/widgets/ImageWidget'
import { ButtonWidgetBlock, type ButtonWidgetProps } from './blocks/widgets/ButtonWidget'
import { IconWidgetBlock, type IconWidgetProps } from './blocks/widgets/IconWidget'
import { IconListWidgetBlock, type IconListWidgetProps } from './blocks/widgets/IconListWidget'
import { TabsWidgetBlock, type TabsWidgetProps } from './blocks/widgets/TabsWidget'
import { AccordionWidgetBlock, type AccordionWidgetProps } from './blocks/widgets/AccordionWidget'
import { CounterWidgetBlock, type CounterWidgetProps } from './blocks/widgets/CounterWidget'
import { HtmlWidgetBlock, type HtmlWidgetProps } from './blocks/widgets/HtmlWidget'
import { ContainerBlock, type ContainerProps } from './blocks/Container'
import { ColumnsBlock, type ColumnsProps } from './blocks/Columns'
import { SpacerBlock, type SpacerProps } from './blocks/Spacer'
import { DividerBlock, type DividerProps } from './blocks/Divider'
import { ResourcePostsSlotBlock, type ResourcePostsSlotProps } from './blocks/ResourcePostsSlot'
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
import { CardBlock, type CardProps } from './blocks/Card'
import { StatBlock, type StatProps } from './blocks/Stat'
import { StepBlock, type StepProps } from './blocks/Step'
import { ServiceCardBlock, type ServiceCardProps } from './blocks/ServiceCard'
import { PackageCardBlock, type PackageCardProps } from './blocks/PackageCard'
import { EntryCardBlock, type EntryCardProps } from './blocks/EntryCard'
import { PathCardBlock, type PathCardProps } from './blocks/PathCard'
import { VisionCardBlock, type VisionCardProps } from './blocks/VisionCard'
import {
  FreeSectionBlock,
  SeriesLabelElBlock,
  HeadingElBlock,
  ParagraphElBlock,
  EmotionElBlock,
  ImageElBlock,
  ButtonElBlock,
  type FreeSectionProps,
  type SeriesLabelElProps,
  type HeadingElProps,
  type ParagraphElProps,
  type EmotionElProps,
  type ImageElProps,
  type ButtonElProps,
} from './blocks/FreeSection'
import { FaqItemBlock, type FaqItemProps } from './blocks/FaqItem'
import { CalloutBlock, type CalloutProps } from './blocks/Callout'
import { PackageCardsBlock, type PackageCardsProps } from './blocks/PackageCards'
import { SolutionEcosystemBlock, type SolutionEcosystemProps } from './blocks/SolutionEcosystem'
import { CTASectionBlock, type CTASectionProps } from './blocks/CTASection'
import { createMediaExternalField } from './media-field'
import {
  createBrandImageFields,
  brandImageDefaultProps,
  resolveBrandImageAvatars,
} from './brand-image-fields'

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
import { VisionMissionBlock, type VisionMissionProps } from './blocks/VisionMission'
import { ServiceCardsBlock, type ServiceCardsProps } from './blocks/ServiceCards'
import { TwoPathCardsBlock, type TwoPathCardsProps } from './blocks/TwoPathCards'
import { TeamGridBlock, type TeamGridProps } from './blocks/TeamGrid'
import { LeadMagnetCarouselBlock, type LeadMagnetCarouselProps } from './blocks/LeadMagnetCarousel'
import { NewsletterFormBlock, type NewsletterFormProps } from './blocks/NewsletterForm'
import { ContactInfoBlock, type ContactInfoProps } from './blocks/ContactInfo'
import { ContactFormsBlock, type ContactFormsProps } from './blocks/ContactForms'
import { PhotoGalleryBlock, type PhotoGalleryProps } from './blocks/PhotoGallery'

// EB-10: Khối đầu trang / chân trang (Site Theme Blocks)
import { SiteLogoBlock, type SiteLogoProps } from './blocks/site/SiteLogo'
import { NavMenuBlock, type NavMenuProps } from './blocks/site/NavMenu'
import { HeaderCTABlock, type HeaderCTAProps } from './blocks/site/HeaderCTA'
import { AccountLinkBlock, type AccountLinkProps } from './blocks/site/AccountLink'
import { LegalFooterBlock, type LegalFooterProps } from './blocks/site/LegalFooter'
import { SocialLinksBlock, type SocialLinksProps } from './blocks/site/SocialLinks'
import { TaglineBlock, type TaglineProps } from './blocks/site/Tagline'

import {
  SECTION_BG_COLOR_OPTIONS,
  BRAND_COLOR_OPTIONS,
  PADDING_OPTIONS,
  FONT_SIZE_OPTIONS,
  ALIGN_OPTIONS,
  CHILD_BLOCK_TYPES,
  ELEMENT_BLOCK_TYPES,
  ROOT_DISALLOW,
  ROOT_DROP_ZONE,
  type FontSizeOption,
} from './constants'
import { allowedTextColors } from '@/lib/brand/format-classes'
import { BUTTON_BG_OPTIONS, buttonTextOptions } from '@/lib/brand/button-colors'
import { alignField, colorField, sizeField } from './format-fields'
import { getLockedComponentPermissions, resolveComponentPermissions } from './locks'

export {
  SECTION_BG_COLOR_OPTIONS,
  BRAND_COLOR_OPTIONS,
  PADDING_OPTIONS,
  FONT_SIZE_OPTIONS,
  ALIGN_OPTIONS,
}

export type {
  CTAButtonBlockProps,
  LeadFormBlockProps,
  BookingCTAProps,
  B2BBriefFormProps,
  QuizCTAProps,
  ShopeeButtonBlockProps,
  ZaloButtonBlockProps,
  LibraryPreviewBlockProps,
  VisionMissionProps,
  ServiceCardsProps,
  TwoPathCardsProps,
  TeamGridProps,
  ResourcePostsSlotProps,
  HeadingWidgetProps,
  TextWidgetProps,
  HtmlWidgetProps,
  ImageWidgetProps,
  ButtonWidgetProps,
  IconWidgetProps,
  IconListWidgetProps,
  ContainerProps,
  LeadMagnetCarouselProps,
  NewsletterFormProps,
  PhotoGalleryProps,
  ContactInfoProps,
  ContactFormsProps,
  CardProps,
  StatProps,
  StepProps,
  ServiceCardProps,
  PackageCardProps,
  FaqItemProps,
  SiteLogoProps,
  NavMenuProps,
  HeaderCTAProps,
  AccountLinkProps,
  LegalFooterProps,
  SocialLinksProps,
  TaglineProps,
}

export type PageComponentsProps = {
  // EB-10: Thành phần đầu trang & chân trang
  SiteLogo: SiteLogoProps
  NavMenu: NavMenuProps
  HeaderCTA: HeaderCTAProps
  AccountLink: AccountLinkProps
  LegalFooter: LegalFooterProps
  SocialLinks: SocialLinksProps
  Tagline: TaglineProps
  // Cơ bản (EB-06a)
  HeadingWidget: HeadingWidgetProps
  TextWidget: TextWidgetProps
  HtmlWidget: HtmlWidgetProps
  ImageWidget: ImageWidgetProps
  ButtonWidget: ButtonWidgetProps
  IconWidget: IconWidgetProps
  IconListWidget: IconListWidgetProps
  TabsWidget: TabsWidgetProps
  AccordionWidget: AccordionWidgetProps
  CounterWidget: CounterWidgetProps
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
  Card: CardProps
  Stat: StatProps
  Step: StepProps
  ServiceCard: ServiceCardProps
  PackageCard: PackageCardProps
  EntryCard: EntryCardProps
  PathCard: PathCardProps
  VisionCard: VisionCardProps
  FreeSection: FreeSectionProps
  SeriesLabelEl: SeriesLabelElProps
  HeadingEl: HeadingElProps
  ParagraphEl: ParagraphElProps
  EmotionEl: EmotionElProps
  ImageEl: ImageElProps
  ButtonEl: ButtonElProps
  FaqItem: FaqItemProps
  Callout: CalloutProps
  JourneySteps: JourneyStepsProps
  VisionMission: VisionMissionProps
  FAQ: FAQProps
  VideoEmbed: VideoEmbedProps
  ContactInfo: ContactInfoProps
  PhotoGallery: PhotoGalleryProps
  // Bố cục
  Container: ContainerProps
  Columns: ColumnsProps
  Spacer: SpacerProps
  Divider: DividerProps
  ResourcePostsSlot: ResourcePostsSlotProps
  // Bán hàng
  ProductGrid: ProductGridProps
  ProductFeature: ProductFeatureProps
  PackageCards: PackageCardsProps
  PackageComparison: PackageComparisonProps
  ServiceCards: ServiceCardsProps
  SolutionEcosystem: SolutionEcosystemProps
  PriceTag: ProductPriceTagProps
  TrialCTA: TrialCTAProps
  // Niềm tin
  TestimonialSlider: TestimonialSliderProps
  TestimonialGrid: TestimonialGridProps
  LogoStrip: LogoStripProps
  HanaStory: HanaStoryProps
  TeamGrid: TeamGridProps
  // Chuyển đổi
  CTAButton: CTAButtonBlockProps
  CTASection: CTASectionProps
  TwoPathCards: TwoPathCardsProps
  LeadForm: LeadFormBlockProps
  BookingCTA: BookingCTABlockProps
  B2BBriefForm: B2BBriefFormProps
  QuizCTA: QuizCTAProps
  ShopeeButton: ShopeeButtonBlockProps
  ZaloButton: ZaloButtonBlockProps
  LibraryPreview: LibraryPreviewBlockProps
  LeadMagnetCarousel: LeadMagnetCarouselProps
  NewsletterForm: NewsletterFormProps
  ContactForms: ContactFormsProps
}

const basePuckConfig: Config<PageComponentsProps> = {
  categories: {
    basic: {
      title: 'Cơ bản',
      components: [
        'HeadingWidget',
        'TextWidget',
        'ImageWidget',
        'ButtonWidget',
        'IconWidget',
        'IconListWidget',
        'Divider',
        'Spacer',
        'VideoEmbed',
        'TabsWidget',
        'AccordionWidget',
        'CounterWidget',
        'HtmlWidget',
      ],
    },
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
        'VisionMission',
        'FAQ',
        'ContactInfo',
        'PhotoGallery',
      ],
    },
    layout: {
      title: 'Bố cục',
      components: ['Container', 'Columns', 'ResourcePostsSlot'],
    },
    sales: {
      title: 'Bán hàng',
      components: [
        'ProductGrid',
        'ProductFeature',
        'PackageCards',
        'PackageComparison',
        'ServiceCards',
        'SolutionEcosystem',
        'PriceTag',
        'TrialCTA',
      ],
    },
    trust: {
      title: 'Niềm tin',
      components: ['TestimonialSlider', 'TestimonialGrid', 'LogoStrip', 'HanaStory', 'TeamGrid'],
    },
    conversion: {
      title: 'Chuyển đổi',
      components: [
        'CTAButton',
        'CTASection',
        'TwoPathCards',
        'LeadForm',
        'BookingCTA',
        'B2BBriefForm',
        'QuizCTA',
        'ShopeeButton',
        'ZaloButton',
        'LibraryPreview',
        'LeadMagnetCarousel',
        'NewsletterForm',
        'ContactForms',
      ],
    },
    // PK-13: free section + its elements (elements only drop into a free section's columns).
    // EB-13b: Hidden from library drawer, but blocks stay registered so existing pages render normally.
    freeSection: {
      title: 'Section tự do (kéo thả từng phần tử)',
      visible: false,
      components: ['FreeSection', ...ELEMENT_BLOCK_TYPES] as (keyof PageComponentsProps)[],
    },
    // PK-11: child cards, droppable only into their own parent block (slot `allow` lists).
    children: {
      title: 'Thẻ con (kéo vào khối cha)',
      components: [...CHILD_BLOCK_TYPES] as (keyof PageComponentsProps)[],
      defaultExpanded: false,
    },
    other: {
      visible: false,
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
    render: ({ children, puck }) => {
      // In the editor, render the root zone ourselves so it can refuse child blocks (PK-07).
      // Puck passes its DropZone component here; the public render keeps `children`.
      const RootZone = puck?.isEditing ? puck.renderDropZone : undefined
      return (
        <div
          data-eb-page=""
          className="min-h-screen bg-warm-ivory font-sans text-deep-navy antialiased"
        >
          {RootZone ? <RootZone zone={ROOT_DROP_ZONE} disallow={ROOT_DISALLOW} /> : children}
        </div>
      )
    },
  },
  components: {
    HeroTwoEntries: HeroTwoEntriesBlock,

    SectionHeader: {
      label: 'Tiêu đề mục (Hai tầng màu)',
      fields: {
        seriesLabel: { type: 'text', label: vi.eb15a.seriesLabel, contentEditable: true },
        eyebrowColor: {
          type: 'select',
          label: 'Màu nhãn series',
          options: allowedTextColors('warm-ivory', 'sm'),
        },
        titleLine1: { type: 'text', label: vi.eb15a.titleLine1, contentEditable: true },
        line1Color: {
          type: 'select',
          label: 'Màu tiêu đề dòng 1',
          options: allowedTextColors('warm-ivory', 'md'),
        },
        titleLine2: { type: 'text', label: vi.eb15a.titleLine2, contentEditable: true },
        line2Color: {
          type: 'select',
          label: 'Màu tiêu đề dòng 2',
          options: allowedTextColors('warm-ivory', 'md'),
        },
        titleSize: {
          type: 'select',
          label: 'Cỡ chữ tiêu đề',
          options: FONT_SIZE_OPTIONS,
        },
        emotionLine: {
          type: 'textarea',
          label: vi.eb15a.emotionLine,
          contentEditable: true,
        },
        emotionColor: {
          type: 'select',
          label: 'Màu dòng cảm xúc',
          options: allowedTextColors('warm-ivory', 'md'),
        },
        emotionSize: {
          type: 'select',
          label: 'Cỡ chữ cảm xúc',
          options: FONT_SIZE_OPTIONS,
        },
        align: {
          type: 'select',
          label: 'Căn lề',
          options: ALIGN_OPTIONS,
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
      resolveFields: (data, { parent }) => {
        const bg =
          (data.props as Record<string, unknown>)?.bgColor ||
          (parent?.props as Record<string, unknown>)?.bgColor ||
          'warm-ivory'
        const currentBg = typeof bg === 'string' ? bg : 'warm-ivory'

        const titleSize =
          ((data.props as Record<string, unknown>)?.titleSize as FontSizeOption) || 'md'

        const titleColors = allowedTextColors(currentBg, titleSize)
        const eyebrowColors = allowedTextColors(currentBg, 'sm')
        // The emotion line is Playfair italic, regular weight, at most 20px even at 'lg': WCAG
        // treats it as normal text at every size, so accent-pink (< 4.5:1) is never offered.
        const emotionColors = allowedTextColors(currentBg, 'md')

        return {
          seriesLabel: { type: 'text', label: vi.eb15a.seriesLabel, contentEditable: true },
          eyebrowColor: {
            type: 'select',
            label: 'Màu nhãn series',
            options: eyebrowColors,
          },
          titleLine1: { type: 'text', label: vi.eb15a.titleLine1, contentEditable: true },
          line1Color: {
            type: 'select',
            label: 'Màu tiêu đề dòng 1',
            options: titleColors,
          },
          titleLine2: { type: 'text', label: vi.eb15a.titleLine2, contentEditable: true },
          line2Color: {
            type: 'select',
            label: 'Màu tiêu đề dòng 2',
            options: titleColors,
          },
          titleSize: {
            type: 'select',
            label: 'Cỡ chữ tiêu đề',
            options: FONT_SIZE_OPTIONS,
          },
          emotionLine: {
            type: 'textarea',
            label: vi.eb15a.emotionLine,
            contentEditable: true,
          },
          emotionColor: {
            type: 'select',
            label: 'Màu dòng cảm xúc',
            options: emotionColors,
          },
          emotionSize: {
            type: 'select',
            label: 'Cỡ chữ cảm xúc',
            options: FONT_SIZE_OPTIONS,
          },
          align: {
            type: 'select',
            label: 'Căn lề',
            options: ALIGN_OPTIONS,
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
        }
      },
      defaultProps: {
        version: 2,
        seriesLabel: '[MẪU] Series',
        titleLine1: '[MẪU] TIÊU ĐỀ DÒNG 1',
        titleLine2: '[MẪU] TIÊU ĐỀ DÒNG 2',
        emotionLine: '[MẪU] Dòng cảm xúc trích dẫn nhẹ nhàng',
        align: 'center',
        as: 'h2',
        titleSize: 'md',
        line1Color: 'deep-navy',
        line2Color: 'bright-magenta',
        eyebrowColor: 'bright-magenta',
        emotionColor: 'deep-navy',
        emotionSize: 'md',
      },
      render: ({
        id,
        seriesLabel,
        titleLine1,
        titleLine2,
        emotionLine,
        align,
        as,
        line1Color,
        line2Color,
        eyebrowColor,
        emotionColor,
        titleSize,
        emotionSize,
      }) => (
        <div className="py-6 px-4">
          <div className="mx-auto max-w-5xl">
            <SectionHeader
              id={id}
              seriesLabel={seriesLabel}
              titleLine1={titleLine1}
              titleLine2={titleLine2}
              emotionLine={emotionLine}
              align={align}
              as={as}
              line1Color={line1Color}
              line2Color={line2Color}
              eyebrowColor={eyebrowColor}
              emotionColor={emotionColor}
              titleSize={titleSize}
              emotionSize={emotionSize}
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
        textSize: sizeField('Cỡ chữ'),
        textColor: colorField('Màu chữ', 'warm-ivory'),
        align: alignField(),
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
        ...createBrandImageFields(),
      },
      resolveFields: (data, params) => ({
        ...params.fields,
        textColor: colorField('Màu chữ', data.props?.bgColor || 'warm-ivory'),
      }),
      defaultProps: {
        version: 1,
        textSize: 'md',
        textColor: 'deep-navy',
        align: 'left',
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
        seriesLabel: { type: 'text', label: vi.eb15a.seriesLabel, contentEditable: true },
        titleLine1: { type: 'text', label: vi.eb15a.titleLine1, contentEditable: true },
        titleLine2: { type: 'text', label: vi.eb15a.titleLine2, contentEditable: true },
        titleSize: sizeField('Cỡ chữ tiêu đề'),
        content: {
          type: 'textarea',
          label: 'Nội dung văn bản (các đoạn phân tách bằng 2 lần xuống dòng)',
        },
        textSize: sizeField('Cỡ chữ nội dung'),
        textColor: colorField('Màu chữ nội dung', 'warm-ivory'),
        quote: {
          type: 'textarea',
          label: 'Câu trích dẫn (Playfair Display Italic, tùy chọn)',
        },
        mediaId: createMediaExternalField({
          label: 'Ảnh minh họa (Thư viện media)',
        }),
        imageLabel: {
          type: 'text',
          label: 'Nhãn nhỏ góc ảnh (Tùy chọn)',
        },
        buttonText: { type: 'text', label: vi.eb15a.buttonText },
        buttonLink: { type: 'text', label: 'Đường dẫn liên kết (tùy chọn)' },
        buttonBgColor: { type: 'select', label: vi.pk15.buttonBgColor, options: BUTTON_BG_OPTIONS },
        buttonTextColor: {
          type: 'select',
          label: vi.pk15.buttonTextColor,
          options: buttonTextOptions(''),
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
        ...createBrandImageFields(),
      },
      resolveFields: (data, params) => ({
        ...params.fields,
        textColor: colorField('Màu chữ nội dung', data.props?.bgColor || 'warm-ivory'),
        // PK-15: only label colours readable on the chosen button fill.
        buttonTextColor: {
          type: 'select',
          label: vi.pk15.buttonTextColor,
          options: buttonTextOptions(data.props?.buttonBgColor),
        },
      }),
      defaultProps: {
        version: 2,
        layout: 'image-left',
        titleSize: 'md',
        textSize: 'md',
        textColor: 'deep-navy',
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
        ...brandImageDefaultProps,
      },
      resolveData: async (data) => {
        const avatars = await resolveBrandImageAvatars(data.props.imageCaptionAvatars)
        const baseProps = { ...data.props, imageCaptionAvatars: avatars }

        const { mediaId } = data.props
        if (!mediaId) {
          return { props: { ...baseProps, imageUrl: '', imageAlt: '' } }
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
                    ...baseProps,
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

        return { props: { ...baseProps, imageUrl: '', imageAlt: '' } }
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
    LeadMagnetCarousel: LeadMagnetCarouselBlock,
    NewsletterForm: NewsletterFormBlock,
    ContactForms: ContactFormsBlock,

    // Cơ bản (EB-06)
    HeadingWidget: HeadingWidgetBlock,
    TextWidget: TextWidgetBlock,
    ImageWidget: ImageWidgetBlock,
    ButtonWidget: ButtonWidgetBlock,
    IconWidget: IconWidgetBlock,
    IconListWidget: IconListWidgetBlock,
    TabsWidget: TabsWidgetBlock,
    AccordionWidget: AccordionWidgetBlock,
    CounterWidget: CounterWidgetBlock,
    HtmlWidget: HtmlWidgetBlock,

    HeroImage: HeroImageBlock,
    QuoteBlock: QuoteBlockConfig,
    StatsBar: StatsBarBlock,
    IconCardGrid: IconCardGridBlock,
    Card: CardBlock,
    Stat: StatBlock,
    Step: StepBlock,
    ServiceCard: ServiceCardBlock,
    PackageCard: PackageCardBlock,
    EntryCard: EntryCardBlock,
    PathCard: PathCardBlock,
    VisionCard: VisionCardBlock,
    FreeSection: FreeSectionBlock,
    SeriesLabelEl: SeriesLabelElBlock,
    HeadingEl: HeadingElBlock,
    ParagraphEl: ParagraphElBlock,
    EmotionEl: EmotionElBlock,
    ImageEl: ImageElBlock,
    ButtonEl: ButtonElBlock,
    FaqItem: FaqItemBlock,
    Callout: CalloutBlock,
    JourneySteps: JourneyStepsBlock,
    FAQ: FAQBlock,
    VideoEmbed: VideoEmbedBlock,
    ContactInfo: ContactInfoBlock,
    PhotoGallery: PhotoGalleryBlock,
    Container: ContainerBlock,
    Columns: ColumnsBlock,
    Spacer: SpacerBlock,
    Divider: DividerBlock,
    ResourcePostsSlot: ResourcePostsSlotBlock,

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

    VisionMission: VisionMissionBlock,
    ServiceCards: ServiceCardsBlock,
    TwoPathCards: TwoPathCardsBlock,
    TeamGrid: TeamGridBlock,

    // EB-10: Site theme blocks
    SiteLogo: SiteLogoBlock,
    NavMenu: NavMenuBlock,
    HeaderCTA: HeaderCTABlock,
    AccountLink: AccountLinkBlock,
    LegalFooter: LegalFooterBlock,
    SocialLinks: SocialLinksBlock,
    Tagline: TaglineBlock,
  },
}

/**
 * PK-14: Automatically appends an `_addChild` custom field to the 9 parent blocks
 * that take a single child card type.
 *
 * The field renders a "+ Thêm {childLabel}" button and count indicator, never calls
 * onChange, and therefore writes nothing to page data and requires no migrations.
 */
export function withAddChildFields<C extends Config>(config: C): C {
  const singleChildSlots = getSingleChildSlots(config)
  if (!singleChildSlots.length) return config

  const updatedComponents = { ...config.components }

  for (const { parentType, slotName, childType } of singleChildSlots) {
    const comp = updatedComponents[parentType]
    if (!comp) continue

    const addChildCustomField = {
      type: 'custom' as const,
      render: () => (
        <AddChildField parentType={parentType} slotName={slotName} childType={childType} />
      ),
    }

    updatedComponents[parentType] = {
      ...comp,
      fields: {
        ...comp.fields,
        _addChild: addChildCustomField,
      },
    }
  }

  return {
    ...config,
    components: updatedComponents as C['components'],
  }
}

// EB-04: every block may carry an optional `_style` (Style / Advanced tabs); blocks without it
// render exactly as before.
// PK-14: single-child parent blocks carry an `_addChild` field at the end of fields.
export const puckConfig: Config<PageComponentsProps> = withAddChildFields(
  withBlockStyles(basePuckConfig),
)

export type PageKind = 'page' | 'header' | 'footer'

/**
 * Lấy cấu hình Puck phù hợp với từng trang, gắn các quyền khóa khối tự động (VD: HeroTwoEntries trên trang chủ)
 * và quyền chỉnh sửa CSS tuỳ chỉnh (khi lock mở và user là owner).
 * EB-10: hỗ trợ kind ('page' | 'header' | 'footer') với danh mục và root riêng biệt.
 */
export function getPuckConfig(options?: {
  pageSlug?: string
  isOwner?: boolean
  designSystem?: CleanDesignSystem
  kind?: PageKind
  isBlockUnlocked?: (id: string) => boolean
}): Config<PageComponentsProps> {
  const kind = options?.kind || 'page'
  const canEditCustomCss = Boolean(
    options?.isOwner && options?.designSystem && isOpen(options.designSystem, 'customCss'),
  )
  const htmlLocked = Boolean(options?.designSystem && !isOpen(options.designSystem, 'customCss'))

  if (kind === 'header') {
    const rootConfig = {
      label: vi.eb10.headerRootLabel,
      fields: {
        sticky: {
          type: 'radio' as const,
          label: vi.eb10.stickyHeaderLabel,
          options: [
            { label: vi.eb10.stickyNone, value: 'none' },
            { label: vi.eb10.stickySticky, value: 'sticky' },
          ],
        },
        ...(canEditCustomCss
          ? {
              customCss: {
                type: 'custom' as const,
                label: vi.eb09.customCssLabel,
                render: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
                  <PageCustomCssControl value={value} onChange={onChange} />
                ),
              },
            }
          : {}),
      },
      render: ({
        children,
        puck,
        sticky,
      }: {
        children: React.ReactNode
        puck?: {
          isEditing?: boolean
          renderDropZone?: React.ComponentType<{
            zone: string
            disallow?: readonly string[] | string[]
          }>
        }
        sticky?: 'none' | 'sticky'
      }) => {
        const RootZone = puck?.isEditing ? puck.renderDropZone : undefined
        const isSticky = sticky === 'sticky'
        return (
          <div className="w-full">
            <header data-eb-header="" className={isSticky ? 'sticky top-0 z-30' : undefined}>
              {RootZone ? <RootZone zone={ROOT_DROP_ZONE} disallow={ROOT_DISALLOW} /> : children}
            </header>
            {puck?.isEditing && (
              <div
                aria-hidden="true"
                className="pointer-events-none select-none opacity-40 p-8 space-y-4 max-w-5xl mx-auto border-t border-dashed border-gray-300 mt-6"
              >
                <div className="h-8 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-32 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-400">
                  {vi.eb10.dummyPageCanvas}
                </div>
              </div>
            )}
          </div>
        )
      },
    }

    const categories = {
      site: {
        title: vi.eb10.siteBlocksCategory,
        components: [
          'SiteLogo',
          'NavMenu',
          'HeaderCTA',
          'AccountLink',
        ] as (keyof PageComponentsProps)[],
      },
      layout: {
        title: 'Bố cục',
        components: ['Container', 'Spacer', 'Divider'] as (keyof PageComponentsProps)[],
      },
      basic: {
        title: 'Cơ bản',
        components: [
          'HeadingWidget',
          'TextWidget',
          'ImageWidget',
          'ButtonWidget',
          'IconWidget',
          'IconListWidget',
          'HtmlWidget',
        ] as (keyof PageComponentsProps)[],
      },
    }

    const allowedKeys = new Set<string>([
      'SiteLogo',
      'NavMenu',
      'HeaderCTA',
      'AccountLink',
      'Container',
      'Spacer',
      'Divider',
      'HeadingWidget',
      'TextWidget',
      'ImageWidget',
      'ButtonWidget',
      'IconWidget',
      'IconListWidget',
      'HtmlWidget',
    ])
    const components = {} as Config<PageComponentsProps>['components']
    for (const key of allowedKeys) {
      const compKey = key as keyof PageComponentsProps
      if (puckConfig.components[compKey]) {
        ;(components as Record<string, unknown>)[compKey] = puckConfig.components[compKey]
      }
    }

    if (htmlLocked && components.HtmlWidget) {
      const htmlBlock = components.HtmlWidget
      components.HtmlWidget = {
        ...htmlBlock,
        permissions: getLockedComponentPermissions('HtmlWidget', '', {
          kind: 'header',
          htmlLocked,
        }),
        render: (props) => htmlBlock.render({ ...props, isLocked: true }),
      }
    }

    return {
      ...puckConfig,
      root: rootConfig as unknown as Config<PageComponentsProps>['root'],
      categories,
      components,
    }
  }

  if (kind === 'footer') {
    const rootConfig = {
      label: vi.eb10.footerRootLabel,
      fields: {
        ...(canEditCustomCss
          ? {
              customCss: {
                type: 'custom' as const,
                label: vi.eb09.customCssLabel,
                render: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
                  <PageCustomCssControl value={value} onChange={onChange} />
                ),
              },
            }
          : {}),
      },
      render: ({
        children,
        puck,
      }: {
        children: React.ReactNode
        puck?: {
          isEditing?: boolean
          renderDropZone?: React.ComponentType<{
            zone: string
            disallow?: readonly string[] | string[]
          }>
        }
      }) => {
        const RootZone = puck?.isEditing ? puck.renderDropZone : undefined
        return (
          <div className="w-full">
            {puck?.isEditing && (
              <div
                aria-hidden="true"
                className="pointer-events-none select-none opacity-40 p-8 space-y-4 max-w-5xl mx-auto border-b border-dashed border-gray-300 mb-6"
              >
                <div className="h-8 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-32 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-400">
                  {vi.eb10.dummyPageCanvas}
                </div>
              </div>
            )}
            <footer data-eb-footer="">
              {RootZone ? <RootZone zone={ROOT_DROP_ZONE} disallow={ROOT_DISALLOW} /> : children}
            </footer>
          </div>
        )
      },
    }

    const categories = {
      site: {
        title: vi.eb10.siteBlocksCategory,
        components: [
          'SiteLogo',
          'Tagline',
          'SocialLinks',
          'LegalFooter',
        ] as (keyof PageComponentsProps)[],
      },
      layout: {
        title: 'Bố cục',
        components: ['Container', 'Spacer', 'Divider'] as (keyof PageComponentsProps)[],
      },
      basic: {
        title: 'Cơ bản',
        components: [
          'HeadingWidget',
          'TextWidget',
          'ImageWidget',
          'ButtonWidget',
          'IconWidget',
          'IconListWidget',
          'HtmlWidget',
        ] as (keyof PageComponentsProps)[],
      },
    }

    const allowedKeys = new Set<string>([
      'SiteLogo',
      'Tagline',
      'SocialLinks',
      'LegalFooter',
      'Container',
      'Spacer',
      'Divider',
      'HeadingWidget',
      'TextWidget',
      'ImageWidget',
      'ButtonWidget',
      'IconWidget',
      'IconListWidget',
      'HtmlWidget',
    ])
    const components = {} as Config<PageComponentsProps>['components']
    for (const key of allowedKeys) {
      const compKey = key as keyof PageComponentsProps
      if (puckConfig.components[compKey]) {
        ;(components as Record<string, unknown>)[compKey] = puckConfig.components[compKey]
      }
    }

    // REVIEW-REQUIRED: Quyền thao tác khối LegalFooter trong chân trang
    if (components.LegalFooter) {
      const legalFooterPerms = getLockedComponentPermissions('LegalFooter', '', { kind: 'footer' })
      components.LegalFooter = {
        ...components.LegalFooter,
        permissions: legalFooterPerms,
        resolvePermissions: (data) => {
          const id = data?.props?.id ? String(data.props.id) : undefined
          return (
            resolveComponentPermissions({
              type: 'LegalFooter',
              id,
              pageSlug: '',
              kind: 'footer',
              htmlLocked,
              isOwner: options?.isOwner,
              unlockedBlockIds: id && options?.isBlockUnlocked?.(id) ? [id] : [],
            }) ??
            legalFooterPerms ??
            {}
          )
        },
      }
    }

    if (htmlLocked && components.HtmlWidget) {
      const htmlBlock = components.HtmlWidget
      components.HtmlWidget = {
        ...htmlBlock,
        permissions: getLockedComponentPermissions('HtmlWidget', '', {
          kind: 'footer',
          htmlLocked,
        }),
        render: (props) => htmlBlock.render({ ...props, isLocked: true }),
      }
    }

    return {
      ...puckConfig,
      root: rootConfig as unknown as Config<PageComponentsProps>['root'],
      categories,
      components,
    }
  }

  // Regular page: kind === 'page'
  const pageSlug = options?.pageSlug || '/'
  const heroPermissions = getLockedComponentPermissions('HeroTwoEntries', pageSlug)

  const rootConfig = canEditCustomCss
    ? {
        ...puckConfig.root,
        fields: {
          ...puckConfig.root?.fields,
          customCss: {
            type: 'custom' as const,
            label: vi.eb09.customCssLabel,
            render: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
              <PageCustomCssControl value={value} onChange={onChange} />
            ),
          },
        },
      }
    : puckConfig.root

  const components = { ...puckConfig.components }
  // Exclude site blocks from regular page components
  const compRecord = components as Record<string, unknown>
  delete compRecord.SiteLogo
  delete compRecord.NavMenu
  delete compRecord.HeaderCTA
  delete compRecord.AccountLink
  delete compRecord.LegalFooter
  delete compRecord.SocialLinks
  delete compRecord.Tagline
  delete (components as any).AccountLink
  delete (components as any).LegalFooter
  delete (components as any).SocialLinks
  delete (components as any).Tagline

  // REVIEW-REQUIRED: Quyền thao tác khối HeroTwoEntries trên trang chủ
  if (heroPermissions) {
    components.HeroTwoEntries = {
      ...components.HeroTwoEntries,
      permissions: heroPermissions,
      resolvePermissions: (data) => {
        const id = data?.props?.id ? String(data.props.id) : undefined
        return (
          resolveComponentPermissions({
            type: 'HeroTwoEntries',
            id,
            pageSlug,
            kind: 'page',
            htmlLocked,
            isOwner: options?.isOwner,
            unlockedBlockIds: id && options?.isBlockUnlocked?.(id) ? [id] : [],
          }) ??
          heroPermissions ??
          {}
        )
      },
    }
  }
  if (htmlLocked) {
    const htmlBlock = components.HtmlWidget
    components.HtmlWidget = {
      ...htmlBlock,
      permissions: getLockedComponentPermissions('HtmlWidget', pageSlug, {
        kind: 'page',
        htmlLocked,
      }),
      render: (props) => htmlBlock.render({ ...props, isLocked: true }),
    }
  }

  return { ...puckConfig, root: rootConfig, components }
}

export const headerPuckConfig: Config<PageComponentsProps> = getPuckConfig({ kind: 'header' })
export const footerPuckConfig: Config<PageComponentsProps> = getPuckConfig({ kind: 'footer' })

export default puckConfig
