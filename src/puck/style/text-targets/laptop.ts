import type { TextTargetDef } from './index'

export const LAPTOP_TEXT_TARGETS: Record<string, TextTargetDef[]> = {
  HeroTwoEntries: [
    { key: 'seriesLabel', label: 'Nhãn series' },
    { key: 'titleLine1', label: 'Tiêu đề dòng 1' },
    { key: 'titleLine2', label: 'Tiêu đề dòng 2' },
    { key: 'emotionLine', label: 'Dòng cảm xúc' },
    { key: 'description', label: 'Đoạn mô tả' },
  ],
  HeroImage: [
    { key: 'seriesLabel', label: 'Nhãn series' },
    { key: 'titleLine1', label: 'Tiêu đề dòng 1' },
    { key: 'titleLine2', label: 'Tiêu đề dòng 2' },
    { key: 'emotionLine', label: 'Dòng cảm xúc' },
    { key: 'buttonText', label: 'Chữ trên nút' },
    { key: 'secondaryButtonText', label: 'Chữ nút thứ 2' },
  ],
  SectionHeader: [
    { key: 'seriesLabel', label: 'Nhãn series' },
    { key: 'titleLine1', label: 'Tiêu đề dòng 1' },
    { key: 'titleLine2', label: 'Tiêu đề dòng 2' },
    { key: 'emotionLine', label: 'Dòng cảm xúc' },
  ],
  HanaStory: [
    { key: 'seriesLabel', label: 'Nhãn series' },
    { key: 'titleLine1', label: 'Tiêu đề dòng 1' },
    { key: 'titleLine2', label: 'Tiêu đề dòng 2' },
    { key: 'jobTitle', label: 'Chức danh / Vai trò' },
    { key: 'greeting', label: 'Lời chào đầu thư' },
    { key: 'signatureName', label: 'Tên người ký' },
    { key: 'storyContent', label: 'Đoạn kể câu chuyện' },
    { key: 'quoteLine', label: 'Dòng cảm xúc trích dẫn' },
  ],
  QuoteBlock: [
    { key: 'quote', label: 'Câu trích dẫn' },
    { key: 'cite', label: 'Tác giả / Người nói' },
    { key: 'roleOrContext', label: 'Vai trò / Ngữ cảnh' },
  ],
  ImageText: [
    { key: 'seriesLabel', label: 'Nhãn series' },
    { key: 'titleLine1', label: 'Tiêu đề dòng 1' },
    { key: 'titleLine2', label: 'Tiêu đề dòng 2' },
    { key: 'content', label: 'Nội dung văn bản' },
    { key: 'quote', label: 'Câu trích dẫn' },
    { key: 'imageLabel', label: 'Nhãn nhỏ góc ảnh' },
    { key: 'buttonText', label: 'Chữ trên nút' },
  ],
  CTASection: [
    { key: 'seriesLabel', label: 'Nhãn series' },
    { key: 'titleLine1', label: 'Tiêu đề dòng 1' },
    { key: 'titleLine2', label: 'Tiêu đề dòng 2' },
    { key: 'emotionLine', label: 'Dòng cảm xúc' },
    { key: 'description', label: 'Mô tả chi tiết' },
    { key: 'buttonText', label: 'Chữ trên nút' },
    { key: 'proofText', label: 'Dòng chữ bảo chứng' },
  ],
  StatsBar: [],
  HeadingWidget: [
    { key: 'text', label: 'Nội dung tiêu đề' },
  ],
  TextWidget: [
    { key: 'content', label: 'Nội dung đoạn văn' },
  ],
  ButtonWidget: [
    { key: 'text', label: 'Chữ trên nút' },
  ],
}

