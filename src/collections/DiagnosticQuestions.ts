import { contentCollection, number, richText, select, stageOptions, text } from '../fields/content'

export const DiagnosticQuestions = contentCollection(
  'diagnosticQuestions',
  'Câu hỏi chẩn đoán',
  'Khóa học',
  'statement',
  [
    text('statement', 'Nội dung câu hỏi', true),
    select('stage', 'Giai đoạn', stageOptions),
    richText('suggestion', 'Gợi ý'),
    number('order', 'Thứ tự', 0),
  ],
)
