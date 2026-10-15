import {
  contentCollection,
  relation,
  richText,
  select,
  stageOptions,
  text,
} from '../fields/content'
import { vi } from '../lib/i18n/vi'

export const Techniques = contentCollection(
  'techniques',
  'Kỹ thuật thực hành',
  vi.cms.nav.habit,
  'name',
  [
    text('name', 'Tên kỹ thuật', true),
    select('stage', 'Giai đoạn', stageOptions),
    richText('howTo', 'Cách thực hiện'),
    richText('example', 'Ví dụ'),
    relation('lesson', 'Bài học liên quan', 'lessons'),
  ],
)

Techniques.admin = {
  ...Techniques.admin,
  description: 'Kỹ thuật Atomic Habits thực chiến ứng dụng vào 4 mắt xích thói quen.',
  defaultColumns: ['name', 'stage', 'lesson', 'updatedAt'],
  listSearchableFields: ['name'],
}
