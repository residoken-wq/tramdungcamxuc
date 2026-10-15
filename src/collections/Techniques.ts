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
