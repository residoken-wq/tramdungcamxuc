import {
  checkbox,
  contentCollection,
  file,
  number,
  relation,
  select,
  stageOptions,
  text,
  textarea,
} from '../fields/content'
import { authenticated } from '../lib/auth/access'

export const Lessons = contentCollection('lessons', 'Bài học', 'Khóa học', 'title', [
  relation('module', 'Nhóm bài học', 'courseModules'),
  text('title', 'Tiêu đề', true),
  textarea('summary', 'Tóm tắt'),
  // REVIEW-REQUIRED: Protect paid video identifiers until entitlement access is implemented.
  {
    ...text('videoId', 'Mã video'),
    access: { read: authenticated },
    admin: { description: 'Mã video trên dịch vụ lưu trữ. Chỉ quản trị viên xem được.' },
  },
  number('durationSec', 'Thời lượng (giây)'),
  select('stage', 'Giai đoạn', [...stageOptions, ['none', 'Không áp dụng']]),
  // REVIEW-REQUIRED: Downloads are admin-only until signed delivery is implemented.
  {
    name: 'downloadables',
    label: 'Tài liệu tải về',
    type: 'array',
    access: { read: authenticated },
    fields: [file('file', 'Tài liệu')],
  },
  number('order', 'Thứ tự', 0),
  checkbox('isFreePreview', 'Cho phép xem thử'),
])
