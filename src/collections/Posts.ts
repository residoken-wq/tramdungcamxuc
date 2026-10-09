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

export const Posts = contentCollection('posts', 'Bài viết và video', 'Nội dung', 'title', [
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

Posts.admin = { ...Posts.admin, livePreview: detailLivePreview('posts') }
