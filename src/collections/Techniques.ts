import { parseVideoUrl } from '../components/site/VideoEmbed'
import {
  contentCollection,
  relation,
  richText,
  select,
  stageOptions,
  text,
  url,
} from '../fields/content'
import { vi } from '../lib/i18n/vi'

export function isValidExampleVideoUrl(value?: string | null): boolean {
  if (!value || typeof value !== 'string') return true
  const trimmed = value.trim()
  if (!trimmed) return true

  const parsed = parseVideoUrl(trimmed)
  if (parsed.isValid) return true

  try {
    const urlObj = new URL(trimmed)
    const hostname = urlObj.hostname
      .toLowerCase()
      .replace(/^www\./, '')
      .replace(/^m\./, '')
    if (hostname === 'iframe.mediadelivery.net' || hostname === 'video.bunnycdn.com') {
      const parts = urlObj.pathname.split('/').filter(Boolean)
      if (parts.length >= 2) {
        return true
      }
    }
  } catch {
    return false
  }

  return false
}

export function validateExampleVideoUrl(value: string | null | undefined): true | string {
  if (isValidExampleVideoUrl(value)) return true
  return vi.hb07.errors.invalidExampleVideoUrl
}

export const Techniques = contentCollection(
  'techniques',
  'Kỹ thuật thực hành',
  vi.cms.nav.habit,
  'name',
  [
    text('name', 'Tên kỹ thuật', true),
    select('stage', 'Giai đoạn', stageOptions),
    richText('howTo', 'Cách thực hiện'),
    richText('example', 'Ví dụ'),
    relation('lesson', 'Bài học liên quan', 'lessons'),
    {
      ...url('exampleVideoUrl', vi.hb07.technique.exampleVideoUrl),
      admin: {
        description: vi.hb07.technique.exampleVideoUrlDesc,
      },
      validate: validateExampleVideoUrl,
    },
  ],
)

Techniques.admin = {
  ...Techniques.admin,
  description: 'Kỹ thuật Atomic Habits thực chiến ứng dụng vào 4 mắt xích thói quen.',
  defaultColumns: ['name', 'stage', 'lesson', 'updatedAt'],
  listSearchableFields: ['name'],
}
