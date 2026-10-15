import { ValidationError, type CollectionBeforeChangeHook } from 'payload'
import {
  contentCollection,
  date,
  image,
  number,
  relation,
  select,
  text,
  topicOptions,
} from '../fields/content'
import { EMOTIONS } from '../lib/emotions'

const lockPrintedQR: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  if (originalDoc?.printedAt) {
    const errors: { path: string; message: string }[] = []
    if (data.qrSlug !== undefined && data.qrSlug !== originalDoc.qrSlug) {
      errors.push({ path: 'qrSlug', message: 'Thẻ đã in, không được đổi mã QR' })
    }
    if (
      data.printedAt !== undefined &&
      (!data.printedAt ||
        new Date(data.printedAt).getTime() !== new Date(originalDoc.printedAt).getTime())
    ) {
      errors.push({ path: 'printedAt', message: 'Thẻ đã in, không được đổi hoặc xóa ngày in.' })
    }
    if (errors.length) throw new ValidationError({ errors, req }, req?.t)
  }
  return data
}

const validateRequiredOnPublish =
  (label: string, maxLength?: number) =>
  (
    value: unknown,
    {
      data,
      siblingData,
    }: { data?: Record<string, unknown>; siblingData?: Record<string, unknown> },
  ) => {
    const status = data?._status ?? siblingData?._status
    const isSample = data?.isSample ?? siblingData?.isSample
    if (status === 'draft' || isSample) {
      if (typeof value === 'string' && maxLength && value.length > maxLength) {
        return `${label} không được vượt quá ${maxLength} ký tự.`
      }
      return true
    }
    if (typeof value !== 'string' || value.trim().length === 0) {
      return `Vui lòng nhập ${label.toLocaleLowerCase('vi')}.`
    }
    if (maxLength && value.length > maxLength) {
      return `${label} không được vượt quá ${maxLength} ký tự.`
    }
    return true
  }

const baseCollection = contentCollection('eqCards', 'Thẻ EQ Buddy', 'EQ Buddy', 'code', [
  { ...text('code', 'Mã thẻ', true), unique: true },
  {
    name: 'keywordEn',
    label: 'Từ khóa (mặt trước)',
    type: 'text',
    maxLength: 40,
    admin: {
      description: 'Từ khóa tiếng Anh trên mặt trước thẻ (tối đa 40 ký tự). Bắt buộc khi xuất bản.',
    },
    validate: validateRequiredOnPublish('Từ khóa (mặt trước)', 40),
  },
  {
    ...text('keywordVi', 'Từ khóa tiếng Việt'),
    maxLength: 40,
    admin: {
      description: 'Không bắt buộc – bộ thẻ in hiện không có.',
    },
    validate: (value: string | null | undefined) =>
      !value || value.length <= 40 || 'Từ khóa tiếng Việt không được vượt quá 40 ký tự.',
  },
  {
    name: 'message',
    label: 'Thông điệp (mặt trước)',
    type: 'textarea',
    admin: {
      description: 'Câu thông điệp mặt trước thẻ. Bắt buộc khi xuất bản.',
    },
    validate: validateRequiredOnPublish('Thông điệp (mặt trước)'),
  },
  {
    type: 'collapsible',
    label: 'Mặt sau – 3 câu hỏi',
    admin: {
      initCollapsed: false,
    },
    fields: [
      {
        name: 'promptRecall',
        label: 'Gợi nhớ',
        type: 'textarea',
        admin: {
          description: 'Câu hỏi gợi nhớ trên mặt sau thẻ. Bắt buộc khi xuất bản.',
        },
        validate: validateRequiredOnPublish('Gợi nhớ'),
      },
      {
        name: 'promptPack',
        label: 'Gói ghém',
        type: 'textarea',
        admin: {
          description: 'Câu hỏi gói ghém trên mặt sau thẻ. Bắt buộc khi xuất bản.',
        },
        validate: validateRequiredOnPublish('Gói ghém'),
      },
      {
        name: 'promptAcknowledge',
        label: 'Ghi nhận',
        type: 'textarea',
        admin: {
          description: 'Câu hỏi ghi nhận trên mặt sau thẻ. Bắt buộc khi xuất bản.',
        },
        validate: validateRequiredOnPublish('Ghi nhận'),
      },
    ],
  },
  {
    name: 'story',
    label: 'Câu chuyện',
    type: 'richText',
    admin: { description: 'Không bắt buộc – bộ thẻ in hiện không có.' },
  },
  {
    name: 'smallAction',
    label: 'Hành động nhỏ',
    type: 'textarea',
    admin: { description: 'Không bắt buộc – bộ thẻ in hiện không có.' },
  },
  select('topic', 'Chủ đề', topicOptions),
  select(
    'emotionTags',
    'Nhãn cảm xúc',
    EMOTIONS.map((e) => [e.key, `${e.emoji} ${e.label}`]),
    {
      hasMany: true,
      admin: { description: 'Không bắt buộc – bộ thẻ in hiện không có.' },
      validate: (value: unknown) => {
        if (!value) return true
        const validKeys = new Set<string>(EMOTIONS.map((e) => e.key))
        if (Array.isArray(value)) {
          const invalid = value.filter((v) => typeof v !== 'string' || !validKeys.has(v))
          if (invalid.length > 0) {
            return `Nhãn cảm xúc không hợp lệ: ${invalid.join(', ')}`
          }
          return true
        }
        return 'Nhãn cảm xúc phải là danh sách.'
      },
    },
  ),
  relation('relatedProduct', 'Sản phẩm liên quan', 'products'),
  image('image', 'Ảnh thẻ'),
  image('shareImage45', 'Ảnh chia sẻ 4:5'),
  image('shareImage916', 'Ảnh chia sẻ 9:16'),
  {
    ...text('qrSlug', 'Mã đường dẫn QR', true),
    unique: true,
    admin: {
      description: 'Không thể đổi sau khi đánh dấu đã in.',
      condition: (data) => !data?.printedAt,
    },
    validate: (value: string | null | undefined) =>
      (typeof value === 'string' && /^[a-z0-9-]+$/.test(value)) ||
      'Mã QR chỉ dùng chữ thường không dấu, số và dấu -.',
  },
  {
    name: 'printedQrSlug',
    label: 'Mã QR đã in',
    type: 'text',
    virtual: true,
    admin: {
      readOnly: true,
      condition: (data) => Boolean(data?.printedAt),
      description: 'Mã đã in được giữ cố định.',
    },
    hooks: { afterRead: [({ data }) => data?.qrSlug] },
  },
  {
    ...date('printedAt', 'Ngày đã in'),
    admin: { description: 'Sau khi lưu ngày này, mã QR và ngày in được khóa.' },
  },
  number('order', 'Thứ tự', 0),
  {
    name: 'downloadQrPng',
    type: 'ui',
    admin: {
      position: 'sidebar',
      components: {
        Field: '@/components/admin/EqQrDownloadButton#EqQrDownloadButton',
      },
    },
  },
])

export const EqCards = {
  ...baseCollection,
  admin: {
    ...baseCollection.admin,
    defaultColumns: ['code', 'keywordEn', 'qrSlug', 'printedAt', '_status'],
    components: {
      ...baseCollection.admin?.components,
      beforeListTable: ['@/components/admin/EqQrExportButton#EqQrExportButton'],
    },
  },
  hooks: {
    ...baseCollection.hooks,
    beforeChange: [lockPrintedQR],
  },
}
