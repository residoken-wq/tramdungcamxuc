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
  description: 'Bộ câu hỏi trắc nghiệm chẩn đoán điểm nghẽn thói quen 5 phút.',
  defaultColumns: ['statement', 'stage', 'order', 'updatedAt'],
  listSearchableFields: ['statement'],
}
