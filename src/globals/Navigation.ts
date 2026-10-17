import type { Field, GlobalConfig } from 'payload'
import { checkbox, relation, select, text, url } from '../fields/content'
import { authenticated } from '../lib/auth/access'
import { vi } from '../lib/i18n/vi'
import { globalLivePreview } from '../lib/live-preview'

type LinkSibling = { linkType?: string }

// Shared link fields for menu items and submenu items. `allowNone` lets a parent item only
// open its submenu (e.g. "Sản phẩm") without a destination of its own.
function linkFields(allowNone: boolean): Field[] {
  const options: [string, string][] = [
    ['page', 'Trang trong website'],
    ['url', 'Liên kết'],
  ]
  if (allowNone) options.push(['none', 'Chỉ mở menu con'])
  return [
    select('linkType', 'Loại liên kết', options, { required: true, defaultValue: 'page' }),
    {
      ...relation('page', 'Trang đích', 'pages'),
      admin: { condition: (_, siblingData) => siblingData.linkType === 'page' },
      validate: (value: unknown, { siblingData }: { siblingData: LinkSibling }) =>
        siblingData?.linkType !== 'page' || Boolean(value) || 'Vui lòng chọn trang đích.',
    },
    {
      ...url('url', 'Liên kết đích'),
      admin: {
        description: 'Nhập đường dẫn /habit/chan-doan hoặc liên kết https://.',
        condition: (_, siblingData) => siblingData.linkType === 'url',
      },
      validate: (
        value: string | null | undefined,
        { siblingData }: { siblingData: LinkSibling },
      ) => {
        if (siblingData?.linkType !== 'url') return true
        if (!value) return 'Vui lòng nhập liên kết đích.'
        if (/^\/(?!\/)/.test(value)) return true
        try {
          return ['https:', 'http:'].includes(new URL(value).protocol) || 'Liên kết không hợp lệ.'
        } catch {
          return 'Liên kết không hợp lệ.'
        }
      },
    },
  ]
}

const submenu: Field = {
  name: 'children',
  label: 'Menu con',
  type: 'array',
  maxRows: 4,
  // Custom validate replaces Payload's array check, so maxRows is enforced here too. A parent
  // that only opens its submenu must actually have one.
  validate: (value: unknown, { siblingData }: { siblingData: LinkSibling }) => {
    const groups = Array.isArray(value) ? (value as Array<{ items?: unknown[] | null }>) : []
    if (groups.length > 4) return 'Tối đa 4 nhóm menu con.'
    if (
      siblingData?.linkType === 'none' &&
      !groups.some((group) => (group?.items?.length ?? 0) > 0)
    ) {
      return 'Mục "Chỉ mở menu con" cần có ít nhất 1 mục con.'
    }
    return true
  },
  admin: {
    description:
      'Không bắt buộc. Mỗi nhóm có tên (VD: "Dành cho Cá nhân") và các mục con; kéo để đổi thứ tự.',
    initCollapsed: true,
  },
  fields: [
    text('groupLabel', 'Tên nhóm', false, {
      admin: { description: 'Không bắt buộc. VD: Dành cho Cá nhân.' },
    }),
    {
      name: 'items',
      label: 'Mục con',
      type: 'array',
      maxRows: 8,
      minRows: 1,
      fields: [
        text('label', 'Tên mục', true),
        text('description', 'Mô tả ngắn', false, {
          maxLength: 60,
          admin: { description: 'Không bắt buộc, tối đa 60 ký tự. VD: Công cụ hỗ trợ cảm xúc.' },
        }),
        ...linkFields(false),
      ],
    },
  ],
}

function menu(name: string, label: string, withSubmenu: boolean): Field {
  return {
    name,
    label,
    type: 'array',
    admin: { description: 'Thêm mục và kéo để đổi thứ tự. Chọn trang hoặc liên kết ngoài.' },
    fields: [
      text('label', 'Tên mục', true),
      ...linkFields(withSubmenu),
      checkbox('highlight', 'Hiển thị nổi bật'),
      ...(withSubmenu ? [submenu] : []),
    ],
  }
}

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Menu điều hướng',
  admin: {
    group: vi.cms.nav.website,
    description: 'Quản lý các liên kết trong menu chính và menu chân trang.',
    livePreview: globalLivePreview('navigation'),
  },
  access: { read: () => true, update: authenticated },
  fields: [menu('mainMenu', 'Menu chính', true), menu('footerMenu', 'Menu chân trang', false)],
}
