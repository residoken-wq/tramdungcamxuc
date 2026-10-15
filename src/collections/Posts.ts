import { vi } from '../lib/i18n/vi'
import { detailLivePreview } from '@/lib/live-preview'
import {
  contentCollection,
  image,
  relation,
  richText,
  select,
  slug,
  text,
  topicOptions,
  url,
} from '../fields/content'

export const Posts = contentCollection('posts', 'Bài viết và video', vi.cms.nav.website, 'title', [
  text('title', 'Tiêu đề', true),
  slug(),
  text('series', 'Chuỗi nội dung'),
  select('topic', 'Chủ đề', topicOptions),
  select(
    'format',
    'Định dạng',
    [
      ['article', 'Bài viết'],
      ['video', 'Video'],
    ],
    { defaultValue: 'article' },
  ),
  image('thumbnail', 'Ảnh đại diện'),
  url('videoUrl', 'Liên kết video'),
  richText('content', 'Nội dung'),
  relation('ctaProduct', 'Sản phẩm giới thiệu', 'products'),
  relation('leadMagnet', 'Tài nguyên tặng', 'products'),
])

Posts.admin = {
  ...Posts.admin,
  description: 'Bài viết chuyên môn và video truyền cảm hứng trong thư viện.',
  defaultColumns: ['title', 'format', 'topic', '_status', 'updatedAt'],
  listSearchableFields: ['title', 'slug'],
  livePreview: detailLivePreview('posts'),
}
