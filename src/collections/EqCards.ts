import { ValidationError, type CollectionBeforeChangeHook } from 'payload'
import {
  contentCollection,
  date,
  image,
  number,
  relation,
  richText,
  select,
  text,
  textarea,
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

const baseCollection = contentCollection('eqCards', 'Thẻ EQ Buddy', 'EQ Buddy', 'code', [
  { ...text('code', 'Mã thẻ', true), unique: true },
  {
    ...text('keywordVi', 'Từ khóa tiếng Việt'),
    maxLength: 40,
    validate: (value: string | null | undefined) =>
      !value || value.length <= 40 || 'Từ khóa tiếng Việt không được vượt quá 40 ký tự.',
  },
  {
    ...text('keywordEn', 'Từ khóa tiếng Anh'),
    maxLength: 40,
    validate: (value: string | null | undefined) =>
      !value || value.length <= 40 || 'Từ khóa tiếng Anh không được vượt quá 40 ký tự.',
  },
  textarea('message', 'Thông điệp'),
  richText('story', 'Câu chuyện'),
  {
    name: 'reflectionPrompts',
    label: 'Câu hỏi suy ngẫm',
    type: 'array',
    minRows: 1,
    maxRows: 3,
    admin: {
      description: 'Thêm 1–3 câu hỏi suy ngẫm cho thẻ.',
    },
    validate: (value: unknown) => {
      if (value === undefined || value === null) return true
      if (Array.isArray(value)) {
        if (value.length < 1) return 'Phải có ít nhất 1 câu hỏi suy ngẫm.'
        if (value.length > 3) return 'Chỉ được có tối đa 3 câu hỏi suy ngẫm.'
        return true
      }
      return 'Dữ liệu câu hỏi suy ngẫm không hợp lệ.'
    },
    fields: [
      {
        ...textarea('prompt', 'Câu hỏi suy ngẫm'),
        required: true,
        validate: (value: string | null | undefined) =>
          (typeof value === 'string' && value.trim().length > 0) ||
          'Vui lòng nhập câu hỏi suy ngẫm.',
      },
    ],
  },
  textarea('smallAction', 'Hành động nhỏ'),
  select('topic', 'Chủ đề', topicOptions),
  select(
    'emotionTags',
    'Nhãn cảm xúc',
    EMOTIONS.map((e) => [e.key, `${e.emoji} ${e.label}`]),
    {
      hasMany: true,
      admin: { description: 'Chọn một hoặc nhiều cảm xúc phù hợp từ bộ 10 cảm xúc.' },
      validate: (value: unknown) => {
        if (!value) return true
        const validKeys = new Set<string>(EMOTIONS.map((e) => e.key))
        if (Array.isArray(value)) {
          const invalid = value.filter((v) => !validKeys.has(String(v)))
          if (invalid.length > 0) {
            return `Cảm xúc không hợp lệ: ${invalid.join(', ')}. Chỉ được chọn trong 10 cảm xúc có sẵn.`
          }
        } else if (!validKeys.has(String(value))) {
          return 'Cảm xúc không hợp lệ.'
        }
        return true
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
])

export const EqCards = {
  ...baseCollection,
  admin: {
    ...baseCollection.admin,
    defaultColumns: ['code', 'keywordVi', 'qrSlug', 'printedAt', '_status'],
  },
  hooks: { beforeChange: [lockPrintedQR] },
}
