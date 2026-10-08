import { revalidatePath } from 'next/cache'
import {
  ValidationError,
  type CollectionAfterChangeHook,
  type CollectionBeforeChangeHook,
  type CollectionBeforeValidateHook,
} from 'payload'
import { contentCollection, image, select, slug, text, textarea } from '../fields/content'
import { getTemplateData } from '@/puck/templates'
import { validatePageLockedBlocks } from '@/puck/locks'

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

const validateLockedBlocksHook: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  const effectiveSlug = data?.slug ?? originalDoc?.slug
  const effectivePuckData = data?.puckData ?? originalDoc?.puckData
  if (effectiveSlug && effectivePuckData) {
    const result = validatePageLockedBlocks(effectiveSlug, effectivePuckData)
    if (!result.valid) {
      throw new ValidationError({
        errors: [{ path: 'puckData', message: result.error || 'Dữ liệu trang không hợp lệ.' }],
      })
    }
  }
  return data
}

// REVIEW-REQUIRED: Initialize page puckData from selected template on create
const applyTemplateOnCreate: CollectionBeforeChangeHook = ({ data, operation }) => {
  if (operation === 'create' && data) {
    const isPuckDataEmpty =
      !data.puckData ||
      !data.puckData.content ||
      (Array.isArray(data.puckData.content) && data.puckData.content.length === 0)
    if (isPuckDataEmpty && typeof data.template === 'string') {
      const templateData = getTemplateData(data.template, data.title)
      if (templateData) {
        data.puckData = templateData
      }
    }
  }
  return data
}

export const revalidatePage: CollectionAfterChangeHook = ({ doc, previousDoc }) => {
  if (doc._status === 'published' || previousDoc?._status === 'published') {
    try {
      const targetPath = doc.slug === '/' ? '/' : `/${doc.slug}`
      revalidatePath(targetPath)

      if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
        const prevPath = previousDoc.slug === '/' ? '/' : `/${previousDoc.slug}`
        revalidatePath(prevPath)
      }
    } catch {
      // Ignore when running outside Next.js request context (e.g. CLI migrations, seeds)
    }
  }
  return doc
}

export const Pages = {
  ...contentCollection('pages', 'Trang nội dung', 'Nội dung', 'title', [
    text('title', 'Tên trang', true),
    slug(true),
    {
      name: 'visualEditor',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/components/admin/VisualBuilderButton#VisualBuilderButton',
        },
      },
    },
    {
      name: 'puckData',
      label: 'Bố cục trang',
      type: 'json',
      admin: { description: 'Dữ liệu bố cục lưu từ trình dựng trang Puck.' },
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
  hooks: {
    beforeValidate: [normalizeSlug, validateLockedBlocksHook],
    beforeChange: [applyTemplateOnCreate],
    afterChange: [revalidatePage],
  },
  versions: { drafts: { autosave: { interval: 30000 } } },
}
