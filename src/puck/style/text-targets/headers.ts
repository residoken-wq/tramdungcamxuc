import type { TextTargetDef } from './index'

/**
 * Per-text colour / size (EB-15a) for blocks whose section header was not wired yet
 * (Hana 22/11: "một số khối chưa có tính năng chỉnh màu, cỡ chữ").
 */
const header = (extra: TextTargetDef[] = []): TextTargetDef[] => [
  { key: 'seriesLabel', label: 'Nhãn series' },
  { key: 'titleLine1', label: 'Tiêu đề dòng 1' },
  { key: 'titleLine2', label: 'Tiêu đề dòng 2' },
  { key: 'emotionLine', label: 'Dòng cảm xúc' },
  ...extra,
]

const L: Record<string, string> = {
  seriesLabel: 'Nhãn series',
  title: 'Tiêu đề',
  titleLine1: 'Tiêu đề dòng 1',
  titleLine2: 'Tiêu đề dòng 2',
  emotionLine: 'Dòng cảm xúc',
  content: 'Đoạn nội dung',
  bottomQuote: 'Câu trích cuối',
  bottomQuoteLeft: 'Câu trích cuối',
  italicQuoteLeft: 'Câu trích nghiêng',
  sourceNote: 'Ghi chú nguồn',
  topQuote: 'Câu trích đầu',
  calloutTitle: 'Tiêu đề khung',
  calloutText: 'Nội dung khung',
}
const keys = (...k: string[]): TextTargetDef[] => k.map((key) => ({ key, label: L[key] ?? key }))

export const HEADER_TEXT_TARGETS: Record<string, TextTargetDef[]> = {
  TestimonialGrid: header(),
  TeamGrid: header(),
  PhotoGallery: header(),
  Columns: header(),
  LibraryPreview: header(),
  LeadMagnetCarousel: header(),
  TrialCTA: header(),
  QuizCTA: header(),
  ContactInfo: header(),
  MatrixTable: header(),
  LoopDiagram: header(),
  SolutionEcosystem: header([{ key: 'description', label: 'Đoạn mô tả' }]),
  FAQ: [
    { key: 'seriesLabel', label: 'Nhãn series' },
    { key: 'titleLine1', label: 'Tiêu đề dòng 1' },
    { key: 'titleLine2', label: 'Tiêu đề dòng 2' },
    { key: 'description', label: 'Đoạn mô tả' },
  ],
  // Trang Chuyển mình (PK-28) blocks
  StoryLead: keys('seriesLabel', 'titleLine1', 'titleLine2', 'emotionLine', 'content'),
  ContextProfile: keys('seriesLabel', 'title', 'italicQuoteLeft', 'sourceNote'),
  PillarCardGrid: keys('seriesLabel', 'title', 'emotionLine', 'bottomQuote'),
  ProgramWishes: keys('seriesLabel', 'title', 'topQuote', 'calloutTitle', 'calloutText'),
  PhaseArchitecture: keys('seriesLabel', 'title', 'bottomQuote'),
  ProgramOverview: keys('seriesLabel', 'title'),
  JourneyMilestones: keys('seriesLabel', 'title'),
  ProgramStepFlow: keys('seriesLabel', 'title', 'emotionLine'),
  BrandFormula: keys('seriesLabel', 'title', 'bottomQuoteLeft'),
  NumberedStepsStrip: keys('seriesLabel', 'title', 'bottomQuote'),
}
