import { ValidationError, type CollectionBeforeValidateHook } from 'payload'
import { contentCollection, image, select, slug, text, textarea } from '../fields/content'

export function normalizePageSlug(value: string): string {
  const trimmed = value.trim()
  const normalized = trimmed === '/' ? '/' : trimmed.replace(/^\/+|\/+$/g, '')
  if (normalized.includes('//')) {
    throw new ValidationError({
      errors: [{ path: 'slug', message: 'Đường dẫn không được chứa hai dấu / liên tiếp.' }],
    })
  }
  return normalized
}

const normalizeSlug: CollectionBeforeValidateHook = ({ data }) => {
  if (typeof data?.slug === 'string') data.slug = normalizePageSlug(data.slug)
  return data
}

export const Pages = {
  ...contentCollection('pages', 'Trang nội dung', 'Nội dung', 'title', [
    text('title', 'Tên trang', true),
    slug(true),
    {
      name: 'puckData',
      label: 'Bố cục trang',
      type: 'json',
      admin: { description: 'Dữ liệu bố cục. Trình chỉnh sửa kéo thả sẽ được bổ sung ở bước sau.' },
    },
    select('template', 'Mẫu trang', [
      ['campaign', 'Landing chiến dịch'],
      ['service', 'Trang dịch vụ'],
      ['workshop', 'Trang workshop'],
      ['event', 'Trang sự kiện'],
    ]),
    {
      name: 'seo',
      label: 'Hiển thị trên công cụ tìm kiếm',
      type: 'group',
      fields: [
        text('title', 'Tiêu đề tìm kiếm'),
        textarea('description', 'Mô tả tìm kiếm'),
        image('ogImage', 'Ảnh khi chia sẻ'),
      ],
    },
  ]),
  hooks: { beforeValidate: [normalizeSlug] },
  versions: { drafts: { autosave: { interval: 30000 } } },
}
