import type { TextTargetDef } from './index'

export const PC_TEXT_TARGETS: Record<string, TextTargetDef[]> = {
  IconCardGrid: [
    { key: 'seriesLabel', label: 'Nhãn series' },
    { key: 'titleLine1', label: 'Tiêu đề dòng 1' },
    { key: 'titleLine2', label: 'Tiêu đề dòng 2' },
    { key: 'emotionLine', label: 'Dòng cảm xúc' },
  ],
  Card: [
    { key: 'title', label: 'Tiêu đề thẻ' },
    { key: 'text', label: 'Nội dung mô tả' },
  ],
  PackageCards: [
    { key: 'seriesLabel', label: 'Nhãn series' },
    { key: 'titleLine1', label: 'Tiêu đề dòng 1' },
    { key: 'titleLine2', label: 'Tiêu đề dòng 2' },
    { key: 'emotionLine', label: 'Dòng cảm xúc' },
    { key: 'description', label: 'Đoạn mô tả' },
    { key: 'buttonText', label: 'Chữ trên nút' },
  ],
  ServiceCards: [
    { key: 'seriesLabel', label: 'Nhãn series' },
    { key: 'titleLine1', label: 'Tiêu đề dòng 1' },
    { key: 'titleLine2', label: 'Tiêu đề dòng 2' },
    { key: 'emotionLine', label: 'Dòng cảm xúc' },
  ],
  TwoPathCards: [
    { key: 'seriesLabel', label: 'Nhãn series' },
    { key: 'titleLine1', label: 'Tiêu đề dòng 1' },
    { key: 'titleLine2', label: 'Tiêu đề dòng 2' },
  ],
  PathCard: [
    { key: 'groupLabel', label: 'Nhãn nhóm' },
    { key: 'title', label: 'Tiêu đề' },
    { key: 'description', label: 'Đoạn văn mô tả' },
    { key: 'buttonLabel', label: 'Chữ trên nút' },
  ],
  VisionMission: [
    { key: 'seriesLabel', label: 'Nhãn series' },
    { key: 'titleLine1', label: 'Tiêu đề dòng 1' },
    { key: 'titleLine2', label: 'Tiêu đề dòng 2' },
    { key: 'quote', label: 'Câu trích dẫn' },
  ],
  VisionCard: [
    { key: 'title', label: 'Tiêu đề thẻ' },
    { key: 'content', label: 'Nội dung' },
  ],
  JourneySteps: [
    { key: 'seriesLabel', label: 'Nhãn series' },
    { key: 'titleLine1', label: 'Tiêu đề dòng 1' },
    { key: 'titleLine2', label: 'Tiêu đề dòng 2' },
    { key: 'emotionLine', label: 'Dòng cảm xúc' },
  ],
  Step: [
    { key: 'name', label: 'Tên bước' },
    { key: 'subname', label: 'Nhãn badge' },
    { key: 'subtitle', label: 'Dòng phụ' },
    { key: 'description', label: 'Nội dung mô tả' },
  ],
  Stat: [
    { key: 'value', label: 'Con số / Chỉ số' },
    { key: 'label', label: 'Nhãn mô tả ý nghĩa' },
    { key: 'description', label: 'Mô tả phụ' },
  ],
  EntryCard: [
    { key: 'groupLabel', label: 'Nhãn nhóm' },
    { key: 'label', label: 'Nhãn lối vào' },
    { key: 'description', label: 'Mô tả ngắn' },
    { key: 'buttonText', label: 'Chữ trên nút' },
  ],
  Callout: [
    { key: 'title', label: 'Tiêu đề nổi bật' },
    { key: 'description', label: 'Mô tả thông điệp' },
    { key: 'buttonText', label: 'Chữ trên nút' },
  ],
}
