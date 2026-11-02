import { contentCollection, number, richText, select, stageOptions, text } from '../fields/content'
import { vi } from '../lib/i18n/vi'

export const DiagnosticQuestions = contentCollection(
  'diagnosticQuestions',
  'Câu hỏi chẩn đoán',
  vi.cms.nav.habit,
  'statement',
  [
    text('statement', 'Nội dung câu hỏi', true),
    select('stage', 'Giai đoạn', stageOptions),
    richText('suggestion', 'Gợi ý'),
    number('order', 'Thứ tự', 0),
  ],
)

DiagnosticQuestions.admin = {
  ...DiagnosticQuestions.admin,
  description:
    'Câu hỏi cho quiz chẩn đoán /habit/chan-doan. Bước 1 "Khám đúng bệnh" của Habit Loop 5 phút cũng dùng bộ này khi mục "Câu hỏi khảo sát" trong Nội dung hành trình Habit còn trống.',
  defaultColumns: ['statement', 'stage', 'order', 'updatedAt'],
  listSearchableFields: ['statement'],
}
