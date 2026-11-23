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
import { parseYoutubeVideoId } from '../lib/video/youtube'
import { parseSocialVideoUrl } from '../lib/video/social'
import { vi } from '../lib/i18n/vi'
import { collectionLivePreview } from '../lib/live-preview'

export const Lessons = contentCollection('lessons', 'Bài học', vi.cms.nav.habit, 'title', [
  relation('module', 'Nhóm bài học', 'courseModules'),
  text('title', 'Tiêu đề', true),
  textarea('summary', 'Tóm tắt'),
  select(
    'videoSource',
    'Nguồn video',
    [
      ['bunny', 'Bunny Stream'],
      ['youtube', 'YouTube (tạm thời)'],
    ],
    {
      defaultValue: 'bunny',
      admin: {
        description:
          'Chọn nguồn video bài giảng (mặc định Bunny Stream; YouTube tạm thời khi chưa có Bunny).',
      },
    },
  ),
  // REVIEW-REQUIRED: Protect YouTube URLs for paid lessons until entitlement access is verified.
  {
    ...text('youtubeUrl', 'Link YouTube (tạm thời)', false, {
      validate: (value: string | null | undefined) => {
        if (!value || typeof value !== 'string' || !value.trim()) {
          return true
        }
        const id = parseYoutubeVideoId(value)
        if (!id) {
          return 'Vui lòng nhập link YouTube hợp lệ (chấp nhận youtube.com/watch, youtu.be, embed, shorts).'
        }
        return true
      },
    }),
    access: { read: authenticated },
    admin: {
      description:
        "Tạm thời khi chưa có Bunny. Video YouTube ai có link cũng xem được – để chế độ **Không công khai**, **không** để Công khai. Khi có Bunny: chọn lại 'Bunny Stream' và nhập Mã video.",
      condition: (_, siblingData) => siblingData?.videoSource === 'youtube',
    },
  },
  // REVIEW-REQUIRED: Protect paid video identifiers until entitlement access is implemented.
  {
    ...text('videoId', 'Mã video'),
    access: { read: authenticated },
    admin: {
      description: 'Mã video trên dịch vụ lưu trữ. Chỉ quản trị viên xem được.',
      condition: (_, siblingData) =>
        !siblingData?.videoSource || siblingData?.videoSource === 'bunny',
    },
  },
  // REVIEW-REQUIRED: like the YouTube link, only signed-in admins read it; the lesson page gives it
  // to customers who may watch the lesson.
  {
    ...text('socialVideoUrl', 'Link video Facebook / TikTok', false, {
      validate: (value: string | null | undefined) =>
        !value?.trim() ||
        Boolean(parseSocialVideoUrl(value)) ||
        'Dán link https video trên Facebook (facebook.com, fb.watch) hoặc TikTok (tiktok.com, vt.tiktok.com).',
    }),
    access: { read: authenticated },
    admin: {
      description:
        'Không bắt buộc. Bài học hiện nút "Xem video trên Facebook / TikTok" (mở tab mới). Dùng khi video bài nằm trên trang của Hana; video Facebook / TikTok công khai thì ai có link cũng xem được. Bài không có link video nào thì khung video tự ẩn.',
    },
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

Lessons.admin = {
  ...Lessons.admin,
  description: 'Bài giảng video và tài liệu thực hành trong khóa Habit.',
  defaultColumns: ['title', 'module', 'videoSource', 'stage', 'isFreePreview', 'order'],
  listSearchableFields: ['title', 'summary'],
  livePreview: collectionLivePreview('lessons'),
  components: {
    beforeListTable: ['@/components/admin/lesson-wizard/CreateLessonButton#CreateLessonButton'],
  },
}
