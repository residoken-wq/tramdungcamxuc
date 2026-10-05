import type {
  CollectionConfig,
  Field,
  RelationshipField,
  SelectField,
  TextField,
  NumberField,
  DateField,
  CheckboxField,
} from 'payload'
import { authenticated, publishedOrAuthenticated } from '../lib/auth/access'

type SingleTextField = TextField & { hasMany?: false }
type SingleNumberField = NumberField & { hasMany?: false }

export const text = (name: string, label: string, required = false): SingleTextField => ({
  name,
  label,
  type: 'text',
  required,
  admin: { description: `Nhập ${label.toLocaleLowerCase('vi')}.` },
  validate: (value: string | null | undefined) =>
    !required ||
    (typeof value === 'string' && value.trim().length > 0) ||
    'Vui lòng điền thông tin này.',
})
export const richText = (name: string, label: string): Field => ({
  name,
  label,
  type: 'richText',
  admin: { description: `Soạn ${label.toLocaleLowerCase('vi')}.` },
})
export const textarea = (name: string, label: string): Field => ({
  name,
  label,
  type: 'textarea',
  admin: { description: `Nhập ${label.toLocaleLowerCase('vi')}.` },
})
export const number = (name: string, label: string, defaultValue?: number): SingleNumberField => ({
  name,
  label,
  type: 'number',
  min: 0,
  defaultValue,
  admin: { description: 'Nhập số không âm. Giá tiền tính bằng đồng.' },
})
export const date = (name: string, label: string): DateField => ({
  name,
  label,
  type: 'date',
  admin: { description: 'Chọn ngày và giờ áp dụng.', date: { pickerAppearance: 'dayAndTime' } },
})
export const checkbox = (name: string, label: string, defaultValue = false): CheckboxField => ({
  name,
  label,
  type: 'checkbox',
  defaultValue,
  admin: { description: `Bật để áp dụng: ${label.toLocaleLowerCase('vi')}.` },
})
export const select = (
  name: string,
  label: string,
  options: [string, string][],
  extra: Partial<SelectField> = {},
): SelectField =>
  ({
    name,
    label,
    type: 'select',
    options: options.map(([value, optionLabel]) => ({ value, label: optionLabel })),
    admin: { description: 'Chọn một mục phù hợp.' },
    ...extra,
  }) as SelectField
export const relation = (
  name: string,
  label: string,
  relationTo: RelationshipField['relationTo'],
  hasMany = false,
): RelationshipField =>
  ({
    name,
    label,
    type: 'relationship',
    relationTo,
    hasMany,
    admin: { description: 'Chọn nội dung đã tạo trong hệ thống.' },
  }) as RelationshipField
export const image = (name: string, label: string): Field => ({
  name,
  label,
  type: 'upload',
  relationTo: 'media',
  admin: { description: 'Chọn ảnh có mô tả để người dùng dễ tiếp cận.' },
})
export const file = (name: string, label: string): Field => ({
  name,
  label,
  type: 'upload',
  relationTo: 'media',
  admin: { description: 'Chọn tài liệu (PDF…)' },
})
export const lines = (name: string, label: string): Field => ({
  name,
  label,
  type: 'array',
  admin: { description: 'Thêm từng mục, kéo để đổi thứ tự.' },
  fields: [text('text', 'Nội dung', true)],
})
export const url = (name: string, label: string): SingleTextField => ({
  ...text(name, label),
  admin: { description: 'Nhập liên kết bắt đầu bằng https:// hoặc http://.' },
  validate: (value: string | null | undefined) => {
    if (!value) return true
    try {
      return (
        ['https:', 'http:'].includes(new URL(value).protocol) ||
        'Liên kết phải bắt đầu bằng https:// hoặc http://.'
      )
    } catch {
      return 'Vui lòng nhập liên kết hợp lệ.'
    }
  },
})
export const slug = (allowSlash = false): SingleTextField => ({
  ...text('slug', 'Đường dẫn', true),
  unique: true,
  index: true,
  admin: {
    description: allowSlash
      ? 'Dùng chữ thường không dấu, số, dấu - và /. Trang chủ dùng /.'
      : 'Dùng chữ thường không dấu, số và dấu -.',
  },
  validate: (value: string | null | undefined) =>
    (typeof value === 'string' && (allowSlash ? /^[a-z0-9/-]+$/ : /^[a-z0-9-]+$/).test(value)) ||
    'Đường dẫn chỉ dùng chữ thường không dấu, số và dấu được cho phép.',
})
export const topicOptions: [string, string][] = [
  ['eq', 'Cảm xúc'],
  ['habit', 'Thói quen'],
  ['career', 'Sự nghiệp'],
]
export const stageOptions: [string, string][] = [
  ['cue', 'Tín hiệu'],
  ['craving', 'Khao khát'],
  ['response', 'Phản hồi'],
  ['reward', 'Phần thưởng'],
]
export const saleStatus = (): Field =>
  select(
    'saleStatus',
    'Trạng thái bán',
    [
      ['coming_soon', 'Sắp ra mắt'],
      ['on_sale', 'Đang bán'],
      ['free', 'Miễn phí'],
      ['consult', 'Cần tư vấn'],
      ['hidden', 'Ẩn'],
    ],
    { defaultValue: 'consult', required: true },
  )
export const sampleField = (): Field => ({
  name: 'isSample',
  label: 'Dữ liệu mẫu',
  type: 'checkbox',
  defaultValue: false,
  admin: { hidden: true },
})
export function contentCollection(
  slug: CollectionConfig['slug'],
  label: string,
  group: string,
  useAsTitle: string,
  fields: Field[],
): CollectionConfig {
  return {
    slug,
    labels: { singular: label, plural: label },
    admin: {
      group,
      useAsTitle,
      description: `Quản lý ${label.toLocaleLowerCase('vi')}. Lưu nháp trước khi xuất bản.`,
    },
    access: {
      create: authenticated,
      read: publishedOrAuthenticated,
      update: authenticated,
      delete: authenticated,
      readVersions: authenticated,
    },
    versions: { drafts: true },
    fields: [...fields, sampleField()],
  }
}
