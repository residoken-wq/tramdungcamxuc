import { ValidationError, type CollectionBeforeChangeHook } from 'payload'
import {
  contentCollection,
  date,
  image,
  lines,
  number,
  relation,
  richText,
  select,
  text,
  textarea,
  topicOptions,
} from '../fields/content'

const lockPrintedQR: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (
    originalDoc?.printedAt &&
    ((data.qrSlug !== undefined && data.qrSlug !== originalDoc.qrSlug) ||
      (data.printedAt !== undefined && data.printedAt !== originalDoc.printedAt))
  ) {
    throw new ValidationError({
      errors: [{ path: 'qrSlug', message: 'Thẻ đã in, không được đổi mã QR' }],
    })
  }
  return data
}

export const EqCards = {
  ...contentCollection('eqCards', 'Thẻ EQ Buddy', 'EQ Buddy', 'code', [
    { ...text('code', 'Mã thẻ', true), unique: true },
    textarea('message', 'Thông điệp'),
    richText('story', 'Câu chuyện'),
    textarea('reflectionPrompt', 'Câu hỏi suy ngẫm'),
    textarea('smallAction', 'Hành động nhỏ'),
    select('topic', 'Chủ đề', topicOptions),
    lines('emotionTags', 'Nhãn cảm xúc'),
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
  ]),
  hooks: { beforeChange: [lockPrintedQR] },
}
