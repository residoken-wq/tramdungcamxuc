import type { Field, GlobalConfig } from 'payload'
import { checkbox, relation, select, text, url } from '../fields/content'
import { authenticated } from '../lib/auth/access'

function menu(name: string, label: string): Field {
  return {
    name,
    label,
    type: 'array',
    admin: { description: 'Thêm mục và kéo để đổi thứ tự. Chọn trang hoặc liên kết ngoài.' },
    fields: [
      text('label', 'Tên mục', true),
      select(
        'linkType',
        'Loại liên kết',
        [
          ['page', 'Trang trong website'],
          ['url', 'Liên kết'],
        ],
        { required: true, defaultValue: 'page' },
      ),
      {
        ...relation('page', 'Trang đích', 'pages'),
        admin: { condition: (_, siblingData) => siblingData.linkType === 'page' },
        validate: (value: unknown, { siblingData }: { siblingData: { linkType?: string } }) =>
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
          { siblingData }: { siblingData: { linkType?: string } },
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
      checkbox('highlight', 'Hiển thị nổi bật'),
    ],
  }
}

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Menu điều hướng',
  admin: { group: 'Hệ thống' },
  access: { read: () => true, update: authenticated },
  fields: [menu('mainMenu', 'Menu chính'), menu('footerMenu', 'Menu chân trang')],
}
