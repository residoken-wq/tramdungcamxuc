import type { CollectionConfig } from 'payload'
import { number, relation, select, stageOptions } from '../fields/content'
import { isEditorOrOwner, isOwner } from '../lib/auth/access'
import { DIAGNOSTIC_SCALE_MAX, DIAGNOSTIC_SCALE_MIN } from '../lib/diagnostic'
import { vi } from '../lib/i18n/vi'

// REVIEW-REQUIRED: Quiz results; the public quiz writes them through server code (T1-14).
export const DiagnosticResults: CollectionConfig = {
  slug: 'diagnosticResults',
  labels: { singular: 'Kết quả chẩn đoán', plural: 'Kết quả chẩn đoán' },
  admin: { group: vi.cms.nav.system, defaultColumns: ['email', 'topStage', 'createdAt'] },
  access: { read: isEditorOrOwner, create: isEditorOrOwner, update: isOwner, delete: isOwner },
  fields: [
    { name: 'email', label: 'Email', type: 'email' },
    {
      name: 'answers',
      label: 'Câu trả lời',
      type: 'array',
      fields: [
        relation('question', 'Câu hỏi', 'diagnosticQuestions'),
        {
          ...number('score', `Mức độ (${DIAGNOSTIC_SCALE_MIN}–${DIAGNOSTIC_SCALE_MAX})`),
          min: DIAGNOSTIC_SCALE_MIN,
          max: DIAGNOSTIC_SCALE_MAX,
        },
      ],
    },
    select('topStage', 'Giai đoạn nổi bật', stageOptions),
  ],
}
