import type { CollectionConfig } from 'payload'
import { number, relation, select, stageOptions } from '../fields/content'
import { isEditorOrOwner, isOwner } from '../lib/auth/access'

// REVIEW-REQUIRED: Quiz results; the public quiz writes them through server code (T1-14).
export const DiagnosticResults: CollectionConfig = {
  slug: 'diagnosticResults',
  labels: { singular: 'Kết quả chẩn đoán', plural: 'Kết quả chẩn đoán' },
  admin: { group: 'Khóa học', defaultColumns: ['email', 'topStage', 'createdAt'] },
  access: { read: isEditorOrOwner, create: isEditorOrOwner, update: isOwner, delete: isOwner },
  fields: [
    { name: 'email', label: 'Email', type: 'email' },
    {
      name: 'answers',
      label: 'Câu trả lời',
      type: 'array',
      fields: [
        relation('question', 'Câu hỏi', 'diagnosticQuestions'),
        { ...number('score', 'Mức độ (1–4)'), min: 1, max: 4 },
      ],
    },
    select('topStage', 'Giai đoạn nổi bật', stageOptions),
  ],
}
