import { revalidatePath } from 'next/cache'
import {
  ValidationError,
  type CollectionAfterChangeHook,
  type CollectionBeforeChangeHook,
  type CollectionBeforeValidateHook,
  type PayloadRequest,
} from 'payload'
import { contentCollection, image, select, slug, text, textarea } from '../fields/content'
import { getTemplateData } from '@/puck/templates'
import { validatePageLockedBlocks, validatePageKindBlocks } from '@/puck/locks'
import { guardCustomCodeHook } from '@/puck/custom-code-guard'
import { vi } from '../lib/i18n/vi'
import { isOwnerUser } from '../lib/auth/access'

export function normalizePageSlug(value: string, req?: Partial<PayloadRequest>): string {
  const trimmed = value.trim()
  const normalized = trimmed === '/' ? '/' : trimmed.replace(/^\/+|\/+$/g, '')
  if (normalized.includes('//')) {
    throw new ValidationError(
      {
        errors: [{ path: 'slug', message: 'Đường dẫn không được chứa hai dấu / liên tiếp.' }],
        req,
      },
      req?.t,
    )
  }
  return normalized
}

const guardKindImmutabilityHook: CollectionBeforeValidateHook = ({
  data,
  originalDoc,
  req,
  operation,
}) => {
  if (operation === 'update' && originalDoc?.kind && data?.kind && data.kind !== originalDoc.kind) {
    throw new ValidationError(
      {
        errors: [{ path: 'kind', message: vi.eb10.errorKindImmutable }],
        req,
      },
      req?.t,
    )
  }
  return data
}

const normalizeSlug: CollectionBeforeValidateHook = ({ data, originalDoc, req }) => {
  const effectiveKind = data?.kind ?? originalDoc?.kind ?? 'page'
  if (effectiveKind === 'header' || effectiveKind === 'footer') {
    if (!data?.slug && !originalDoc?.slug) {
      const prefix = effectiveKind === 'header' ? '__dau-trang' : '__chan-trang'
      const suffix = Math.random().toString(36).slice(2, 10)
      if (data) data.slug = `${prefix}-${suffix}`
    } else if (originalDoc?.slug && data && !data.slug) {
      data.slug = originalDoc.slug
    }
  } else if (typeof data?.slug === 'string') {
    data.slug = normalizePageSlug(data.slug, req)
  }
  return data
}

// REVIEW-REQUIRED: Validate page locked blocks and theme builder kind block rules at collection level
const validateLockedBlocksHook: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const effectiveSlug = data?.slug ?? originalDoc?.slug
  const effectiveKind = data?.kind ?? originalDoc?.kind ?? 'page'
  const effectivePuckData = data?.puckData ?? originalDoc?.puckData

  if (effectivePuckData) {
    // 1. Validate block rules according to page kind (header / footer / page)
    const kindResult = validatePageKindBlocks(effectiveKind, effectivePuckData)
    if (!kindResult.valid) {
      throw new ValidationError(
        {
          errors: [
            { path: 'puckData', message: kindResult.error || 'Dữ liệu trang không hợp lệ.' },
          ],
          req,
        },
        req?.t,
      )
    }

    // 2. Validate locked blocks on homepage
    if (effectiveSlug && effectiveKind === 'page') {
      const lockedResult = validatePageLockedBlocks(effectiveSlug, effectivePuckData)
      if (!lockedResult.valid) {
        throw new ValidationError(
          {
            errors: [
              { path: 'puckData', message: lockedResult.error || 'Dữ liệu trang không hợp lệ.' },
            ],
            req,
          },
          req?.t,
        )
      }
    }
  }

  return data
}

// REVIEW-REQUIRED: Initialize page puckData from selected template on create (auto-loads default header/footer)
const applyTemplateOnCreate: CollectionBeforeChangeHook = ({ data, operation }) => {
  if (operation === 'create' && data) {
    const isPuckDataEmpty =
      !data.puckData ||
      !data.puckData.content ||
      (Array.isArray(data.puckData.content) && data.puckData.content.length === 0)
    if (isPuckDataEmpty) {
      if (data.kind === 'header') {
        const headerTpl = getTemplateData('header-default', data.title)
        if (headerTpl) data.puckData = headerTpl
      } else if (data.kind === 'footer') {
        const footerTpl = getTemplateData('footer-default', data.title)
        if (footerTpl) data.puckData = footerTpl
      } else if (typeof data.template === 'string') {
        const templateData = getTemplateData(data.template, data.title)
        if (templateData) {
          data.puckData = templateData
        }
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
  ...contentCollection('pages', 'Trang nội dung', vi.cms.nav.website, 'title', [
    text('title', 'Tên trang', true),
    {
      name: 'kind',
      label: vi.eb10.kindLabel,
      type: 'select',
      defaultValue: 'page',
      options: [
        { label: vi.eb10.kindOptions.page, value: 'page' },
        { label: vi.eb10.kindOptions.header, value: 'header' },
        { label: vi.eb10.kindOptions.footer, value: 'footer' },
      ],
      access: {
        update: () => false,
      },
      admin: {
        description: vi.eb10.kindDesc,
      },
    },
    {
      ...slug(true),
      required: false,
      validate: (
        value: string | null | undefined,
        { siblingData }: { siblingData?: { kind?: string } },
      ) => {
        const kind = siblingData?.kind ?? 'page'
        if (kind === 'header' || kind === 'footer') {
          return true
        }
        if (!value || typeof value !== 'string' || value.trim().length === 0) {
          return 'Vui lòng điền thông tin này.'
        }
        return (
          /^[a-z0-9/-]+$/.test(value) || 'Đường dẫn chỉ dùng chữ thường không dấu, số, dấu - và /.'
        )
      },
      admin: {
        condition: (_, siblingData) => !siblingData?.kind || siblingData?.kind === 'page',
        description: 'Dùng chữ thường không dấu, số, dấu - và /. Trang chủ dùng /.',
      },
    },
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
    {
      ...select('template', 'Mẫu trang', [
        ['home-v2', 'Trang chủ v2'],
        ['journey', 'Trang lộ trình'],
        ['about', 'Trang Về Trạm'],
        ['coach', 'Trang Coach 1:1'],
        ['contact', 'Trang Liên hệ'],
        ['community', 'Trang Cộng đồng'],
        ['business', 'Trang Doanh nghiệp'],
        ['campaign', 'Landing chiến dịch'],
        ['service', 'Trang dịch vụ'],
        ['workshop', 'Trang workshop'],
        ['event', 'Trang sự kiện'],
      ]),
      admin: {
        condition: (_, siblingData) => !siblingData?.kind || siblingData?.kind === 'page',
      },
    },
    {
      name: 'seo',
      label: 'Hiển thị trên công cụ tìm kiếm',
      type: 'group',
      admin: {
        condition: (_, siblingData) => !siblingData?.kind || siblingData?.kind === 'page',
      },
      fields: [
        text('title', 'Tiêu đề tìm kiếm'),
        textarea('description', 'Mô tả tìm kiếm'),
        image('ogImage', 'Ảnh khi chia sẻ'),
      ],
    },
  ]),
  hooks: {
    beforeValidate: [guardKindImmutabilityHook, normalizeSlug, validateLockedBlocksHook],
    beforeChange: [applyTemplateOnCreate, guardCustomCodeHook],
    afterChange: [revalidatePage],
  },
  endpoints: [
    {
      path: '/create-from-template',
      method: 'post',
      // REVIEW-REQUIRED: Chỉ chủ sở hữu (Owner) mới có quyền tạo đầu trang / chân trang từ mẫu
      handler: async (req: PayloadRequest) => {
        if (!isOwnerUser(req.user)) {
          return Response.json({ message: vi.pk33.errorOnlyOwner }, { status: 403 })
        }
        let body: any = {}
        try {
          if (typeof req.json === 'function') {
            body = await req.json()
          }
        } catch {
          // empty body
        }
        const kind = body?.kind
        if (kind !== 'header' && kind !== 'footer') {
          return Response.json({ message: 'Invalid kind' }, { status: 400 })
        }
        const title = kind === 'header' ? vi.pk33.headerTitle : vi.pk33.footerTitle
        const newPage = await req.payload.create({
          collection: 'pages',
          data: {
            title,
            kind,
          },
          draft: true,
          req,
        })
        return Response.json({ id: newPage.id })
      },
    },
  ],
  versions: { drafts: { autosave: { interval: 30000 } } },
}

Pages.admin = {
  ...Pages.admin,
  description: 'Trang tĩnh và landing page dựng bằng kéo thả trực quan Puck.',
  defaultColumns: ['title', 'kind', 'slug', 'template', '_status', 'updatedAt'],
  listSearchableFields: ['title', 'slug', 'kind'],
}
