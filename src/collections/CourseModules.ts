import { contentCollection, number, select, text } from '../fields/content'

export const CourseModules = contentCollection(
  'courseModules',
  'Nhóm bài học',
  'Khóa học',
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
