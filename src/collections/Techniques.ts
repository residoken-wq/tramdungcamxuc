import {
  contentCollection,
  relation,
  richText,
  select,
  stageOptions,
  text,
} from '../fields/content'

export const Techniques = contentCollection(
  'techniques',
  'Kỹ thuật thực hành',
  'Khóa học',
  'name',
  [
    text('name', 'Tên kỹ thuật', true),
    select('stage', 'Giai đoạn', stageOptions),
    richText('howTo', 'Cách thực hiện'),
    richText('example', 'Ví dụ'),
    relation('lesson', 'Bài học liên quan', 'lessons'),
  ],
)
