import React from 'react'

/**
 * Clean, lightweight SVG icons for Puck blocks in the Elementor-style LeftPanel.
 * All icons follow a consistent thin-stroke aesthetic (viewBox 0 0 24 24, strokeWidth 1.75, stroke currentColor).
 * Accessible: marked aria-hidden="true" since the block label provides the accessible name.
 * Part of EB-03.
 */

const baseSvgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  className: 'w-5 h-5 shrink-0',
}

// Reusable micro-icons
const GenericBlockIcon = () => (
  <svg {...baseSvgProps}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M3 9h18M9 21V9" />
  </svg>
)

const LayoutColumnsIcon = () => (
  <svg {...baseSvgProps}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M12 4v16" />
  </svg>
)

const SpacerIcon = () => (
  <svg {...baseSvgProps}>
    <path d="M12 3v6m0 6v6M8 6l4-3 4 3M8 18l4 3 4-3M3 12h18" strokeDasharray="2 2" />
  </svg>
)

const DividerIcon = () => (
  <svg {...baseSvgProps}>
    <path d="M3 12h7m4 0h7" />
    <path d="M12 10.5l1.5 1.5-1.5 1.5-1.5-1.5z" />
  </svg>
)

const TextIcon = () => (
  <svg {...baseSvgProps}>
    <path d="M4 6h16M4 12h10M4 18h14" />
  </svg>
)

const HeadingIcon = () => (
  <svg {...baseSvgProps}>
    <path d="M6 5v14M18 5v14M6 12h12" />
  </svg>
)

const TwoToneHeadingIcon = () => (
  <svg {...baseSvgProps}>
    <path d="M4 5h16M4 10h12" />
    <path d="M4 16h8" strokeWidth="2.5" />
    <path d="M4 20h4" />
  </svg>
)

const QuoteIcon = () => (
  <svg {...baseSvgProps}>
    <path d="M3 21c3 0 7-1 7-8V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2 0 4-1 6-1 8zm13 0c3 0 7-1 7-8V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2 0 4-1 6-1 8z" />
  </svg>
)

const ImageIcon = () => (
  <svg {...baseSvgProps}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
)

const ImageTextIcon = () => (
  <svg {...baseSvgProps}>
    <rect x="3" y="5" width="8" height="14" rx="2" />
    <path d="M14 7h7M14 11h7M14 15h5" />
  </svg>
)

const HeroTwoEntriesIcon = () => (
  <svg {...baseSvgProps}>
    <rect x="3" y="4" width="8" height="16" rx="2" />
    <rect x="13" y="4" width="8" height="16" rx="2" />
    <path d="M7 11l-2 2 2 2M17 11l2 2-2 2" />
  </svg>
)

const ButtonIcon = () => (
  <svg {...baseSvgProps}>
    <rect x="3" y="7" width="18" height="10" rx="3" />
    <path d="M8 12h8" />
  </svg>
)

const CardGridIcon = () => (
  <svg {...baseSvgProps}>
    <rect x="3" y="3" width="7" height="8" rx="1.5" />
    <rect x="14" y="3" width="7" height="8" rx="1.5" />
    <rect x="3" y="13" width="7" height="8" rx="1.5" />
    <rect x="14" y="13" width="7" height="8" rx="1.5" />
  </svg>
)

const CardIcon = () => (
  <svg {...baseSvgProps}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M4 10h16M8 15h4" />
  </svg>
)

const VideoIcon = () => (
  <svg {...baseSvgProps}>
    <rect x="2" y="4" width="20" height="16" rx="3" />
    <polygon points="10,8 16,12 10,16" />
  </svg>
)

const FaqIcon = () => (
  <svg {...baseSvgProps}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <circle cx="12" cy="17" r=".5" fill="currentColor" />
  </svg>
)

const StatsIcon = () => (
  <svg {...baseSvgProps}>
    <path d="M18 20V10M12 20V4M6 20v-6" />
  </svg>
)

const JourneyStepsIcon = () => (
  <svg {...baseSvgProps}>
    <circle cx="5" cy="6" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="18" r="2" />
    <path d="M7 7l3 3M14 13l3 3" />
  </svg>
)

const ProductIcon = () => (
  <svg {...baseSvgProps}>
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
)

const PriceTagIcon = () => (
  <svg {...baseSvgProps}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
)

const StarIcon = () => (
  <svg {...baseSvgProps}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const UserStoryIcon = () => (
  <svg {...baseSvgProps}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const TeamIcon = () => (
  <svg {...baseSvgProps}>
    <path d="M17 21v-2a4 4 0 0 0-3-3.87M9 21v-2a4 4 0 0 1 3-3.87M7 21v-2a4 4 0 0 0-4-4H1a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="3" />
    <circle cx="16" cy="7" r="2.5" />
  </svg>
)

const FormIcon = () => (
  <svg {...baseSvgProps}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 8h10M7 12h10M7 16h6" />
  </svg>
)

const CalendarIcon = () => (
  <svg {...baseSvgProps}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <rect x="8" y="14" width="3" height="3" />
  </svg>
)

const HeartEmotionIcon = () => (
  <svg {...baseSvgProps}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

const ChatMessageIcon = () => (
  <svg {...baseSvgProps}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const BooksLibraryIcon = () => (
  <svg {...baseSvgProps}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <path d="M8 7h8M8 11h6" />
  </svg>
)

const TargetVisionIcon = () => (
  <svg {...baseSvgProps}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
)

const PackageComparisonIcon = () => (
  <svg {...baseSvgProps}>
    <rect x="3" y="3" width="8" height="18" rx="2" />
    <rect x="13" y="3" width="8" height="18" rx="2" />
    <path d="M6 8h2M16 8h2M6 12h2M16 12h2" />
  </svg>
)

const FreeSectionIcon = () => (
  <svg {...baseSvgProps}>
    <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 3" />
    <circle cx="8" cy="8" r="1.5" />
    <rect x="13" y="7" width="5" height="2" />
    <rect x="7" y="13" width="10" height="4" rx="1" />
  </svg>
)

// Map component keys to dedicated micro-icons
const blockIconMap: Record<string, React.ComponentType> = {
  // Mở đầu
  HeroTwoEntries: HeroTwoEntriesIcon,
  HeroImage: ImageIcon,
  SectionHeader: TwoToneHeadingIcon,

  // Nội dung
  RichText: TextIcon,
  ImageText: ImageTextIcon,
  QuoteBlock: QuoteIcon,
  StatsBar: StatsIcon,
  IconCardGrid: CardGridIcon,
  Card: CardIcon,
  Stat: StatsIcon,
  Step: JourneyStepsIcon,
  ServiceCard: CardIcon,
  PackageCard: ProductIcon,
  EntryCard: HeroTwoEntriesIcon,
  PathCard: JourneyStepsIcon,
  VisionCard: TargetVisionIcon,
  FaqItem: FaqIcon,
  Callout: ChatMessageIcon,
  JourneySteps: JourneyStepsIcon,
  VisionMission: TargetVisionIcon,
  FAQ: FaqIcon,
  VideoEmbed: VideoIcon,
  ContactInfo: ChatMessageIcon,

  // Bố cục
  Columns: LayoutColumnsIcon,
  Spacer: SpacerIcon,
  Divider: DividerIcon,
  ResourcePostsSlot: BooksLibraryIcon,
  FreeSection: FreeSectionIcon,

  // Phần tử tự do (Free section elements)
  SeriesLabelEl: TextIcon,
  HeadingEl: HeadingIcon,
  ParagraphEl: TextIcon,
  EmotionEl: HeartEmotionIcon,
  ImageEl: ImageIcon,
  ButtonEl: ButtonIcon,

  // Bán hàng
  ProductGrid: ProductIcon,
  ProductFeature: StarIcon,
  PackageCards: CardGridIcon,
  PackageComparison: PackageComparisonIcon,
  ServiceCards: CardGridIcon,
  SolutionEcosystem: TargetVisionIcon,
  PriceTag: PriceTagIcon,
  TrialCTA: StarIcon,

  // Niềm tin
  TestimonialSlider: QuoteIcon,
  TestimonialGrid: StarIcon,
  LogoStrip: CardGridIcon,
  HanaStory: UserStoryIcon,
  TeamGrid: TeamIcon,

  // Chuyển đổi
  CTAButton: ButtonIcon,
  CTASection: ButtonIcon,
  TwoPathCards: HeroTwoEntriesIcon,
  LeadForm: FormIcon,
  BookingCTA: CalendarIcon,
  B2BBriefForm: FormIcon,
  QuizCTA: TargetVisionIcon,
  ShopeeButton: ProductIcon,
  ZaloButton: ChatMessageIcon,
  LibraryPreview: BooksLibraryIcon,
  LeadMagnetCarousel: BooksLibraryIcon,
  NewsletterForm: FormIcon,
  ContactForms: FormIcon,
}

/**
 * Returns an SVG icon element for any block component type.
 * Always returns a valid ReactElement (falls back to GenericBlockIcon).
 */
export function getBlockIcon(componentType: string): React.ReactElement {
  const IconComponent = blockIconMap[componentType] || GenericBlockIcon
  return <IconComponent />
}

