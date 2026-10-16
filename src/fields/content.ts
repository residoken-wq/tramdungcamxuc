import type {
  ArrayField,
  CheckboxField,
  CollectionConfig,
  DateField,
  Field,
  NumberField,
  RelationshipField,
  RichTextField,
  SelectField,
  TextField,
  TextareaField,
  UploadField,
} from 'payload'
import { authenticated, publishedOrAuthenticated } from '../lib/auth/access'

type SingleTextField = TextField & { hasMany?: false }
type SingleNumberField = NumberField & { hasMany?: false }

export const text = (
  name: string,
  label: string,
  required = false,
  extra: Partial<SingleTextField> = {},
): SingleTextField => ({
  name,
  label,
  type: 'text',
  required,
  validate: (value: string | null | undefined) =>
    !required ||
    (typeof value === 'string' && value.trim().length > 0) ||
    'Vui lòng điền thông tin này.',
  ...extra,
  admin: {
    description: `Nhập ${label.toLocaleLowerCase('vi')}.`,
    ...extra.admin,
  },
})

export const richText = (
  name: string,
  label: string,
  extra: Partial<RichTextField> = {},
): RichTextField => ({
  name,
  label,
  type: 'richText',
  ...extra,
  admin: {
    description: `Soạn ${label.toLocaleLowerCase('vi')}.`,
    ...extra.admin,
  },
})

export const textarea = (
  name: string,
  label: string,
  extra: Partial<TextareaField> = {},
): TextareaField => ({
  name,
  label,
  type: 'textarea',
  ...extra,
  admin: {
    description: `Nhập ${label.toLocaleLowerCase('vi')}.`,
    ...extra.admin,
  },
})

export const number = (
  name: string,
  label: string,
  defaultValue?: number,
  extra: Partial<SingleNumberField> = {},
): SingleNumberField => ({
  name,
  label,
  type: 'number',
  min: 0,
  defaultValue,
  ...extra,
  admin: {
    description: 'Nhập số không âm. Giá tiền tính bằng đồng.',
    ...extra.admin,
  },
})

export const date = (name: string, label: string, extra: Partial<DateField> = {}): DateField => ({
  name,
  label,
  type: 'date',
  ...extra,
  admin: {
    description: 'Chọn ngày và giờ áp dụng.',
    date: { pickerAppearance: 'dayAndTime' },
    ...extra.admin,
  },
})

export const checkbox = (
  name: string,
  label: string,
  defaultValue = false,
  extra: Partial<CheckboxField> = {},
): CheckboxField => ({
  name,
  label,
  type: 'checkbox',
  defaultValue,
  ...extra,
  admin: {
    description: `Bật để áp dụng: ${label.toLocaleLowerCase('vi')}.`,
    ...extra.admin,
  },
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
    ...extra,
    admin: {
      description: 'Chọn một mục phù hợp.',
      ...extra.admin,
    },
  }) as SelectField

export const relation = (
  name: string,
  label: string,
  relationTo: RelationshipField['relationTo'],
  hasMany = false,
  extra: Partial<RelationshipField> = {},
): RelationshipField =>
  ({
    name,
    label,
    type: 'relationship',
    relationTo,
    hasMany,
    ...extra,
    admin: {
      description: 'Chọn nội dung đã tạo trong hệ thống.',
      ...extra.admin,
    },
  }) as RelationshipField

export const image = (name: string, label: string, extra: Partial<UploadField> = {}): UploadField =>
  ({
    name,
    label,
    type: 'upload',
    relationTo: 'media',
    ...extra,
    admin: {
      description: 'Chọn ảnh có mô tả để người dùng dễ tiếp cận.',
      ...extra.admin,
    },
  }) as UploadField

export const file = (
  name: string,
  label: string,
  relationTo: 'media' | 'privateFiles' = 'media',
  extra: Partial<UploadField> = {},
): UploadField =>
  ({
    name,
    label,
    type: 'upload',
    relationTo,
    ...extra,
    admin: {
      description: 'Chọn tài liệu (PDF…)',
      ...extra.admin,
    },
  }) as UploadField

export const privateFile = (
  name: string,
  label: string,
  extra: Partial<UploadField> = {},
): UploadField => file(name, label, 'privateFiles', extra)

export const lines = (
  name: string,
  label: string,
  extra: Partial<ArrayField> = {},
): ArrayField => ({
  name,
  label,
  type: 'array',
  fields: [text('text', 'Nội dung', true)],
  ...extra,
  admin: {
    description: 'Thêm từng mục, kéo để đổi thứ tự.',
    ...extra.admin,
  },
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

export const internalOrExternalUrl = (
  name: string,
  label: string,
  extra: Partial<SingleTextField> = {},
): SingleTextField => ({
  ...text(name, label),
  validate: (value: string | null | undefined) => {
    if (!value || typeof value !== 'string' || value.trim().length === 0) return true
    const trimmed = value.trim()
    // Chặn protocol-relative URL
    if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
      return 'Liên kết nội bộ không được bắt đầu bằng // hoặc /\\.'
    }
    // Đường dẫn nội bộ bắt đầu bằng một dấu /
    if (trimmed.startsWith('/')) {
      return true
    }
    // Link ngoài phải bắt đầu bằng https:// hoặc http://
    try {
      const urlObj = new URL(trimmed)
      return (
        ['https:', 'http:'].includes(urlObj.protocol) ||
        'Liên kết phải bắt đầu bằng https:// hoặc đường dẫn trong web bắt đầu bằng /.'
      )
    } catch {
      return 'Vui lòng nhập liên kết hợp lệ (bắt đầu bằng https:// hoặc /).'
    }
  },
  ...extra,
  admin: {
    description:
      'Link Shopee… bắt đầu bằng https://, hoặc trang trong web bắt đầu bằng / (VD: /habit/chan-doan).',
    ...extra.admin,
  },
})

export const slug = (
  allowSlash = false,
  extra: Partial<SingleTextField> = {},
): SingleTextField => ({
  ...text('slug', 'Đường dẫn', true),
  unique: true,
  index: true,
  validate: (value: string | null | undefined) =>
    (typeof value === 'string' && (allowSlash ? /^[a-z0-9/-]+$/ : /^[a-z0-9-]+$/).test(value)) ||
    'Đường dẫn chỉ dùng chữ thường không dấu, số và dấu được cho phép.',
  ...extra,
  admin: {
    description: allowSlash
      ? 'Dùng chữ thường không dấu, số, dấu - và /. Trang chủ dùng /.'
      : 'Dùng chữ thường không dấu, số và dấu -.',
    ...extra.admin,
  },
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
export const saleStatus = (extra?: Partial<SelectField>): SelectField =>
  select(
    'saleStatus',
    'Trạng thái bán',
    [
      ['coming_soon', 'Sắp ra mắt'],
      ['on_sale', 'Đang mở bán'],
      ['free', 'Miễn phí'],
      ['consult', 'Tư vấn'],
      ['hidden', 'Ẩn'],
    ],
    {
      required: true,
      defaultValue: 'coming_soon',
      ...extra,
      admin: {
        description: 'Chọn một mục phù hợp.',
        ...extra?.admin,
      },
    },
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
