import { contentCollection, number, select, text } from '../fields/content'
import { vi } from '../lib/i18n/vi'

export const CourseModules = contentCollection(
  'courseModules',
  'Nhóm bài học',
  vi.cms.nav.habit,
  'title',
  [
    text('title', 'Tên nhóm bài học', true),
    select('group', 'Nhóm nội dung', [
      ['insight', 'Hiểu mình'],
      ['principle', 'Nguyên tắc'],
      ['technique', 'Kỹ thuật'],
    ]),
    number('order', 'Thứ tự', 0),
  ],
)
