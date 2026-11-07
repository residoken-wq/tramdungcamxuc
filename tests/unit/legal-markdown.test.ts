import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { legalMarkdownBody } from '@/lib/legal-markdown'

describe('legalMarkdownBody', () => {
  it('drops the first # heading (the page shows the CMS title) and keeps the rest verbatim', () => {
    const { title, body } = legalMarkdownBody('# Chính sách bảo mật\n\n**Trạm**  \nNội dung\n')
    expect(title).toBe('Chính sách bảo mật')
    expect(body).toBe('**Trạm**  \nNội dung')
  })

  it('returns the whole text when there is no title', () => {
    expect(legalMarkdownBody('Không có tiêu đề').body).toBe('Không có tiêu đề')
  })

  it.each(['chinh-sach-bao-mat', 'dieu-khoan-su-dung'])(
    'content/legal/%s.md has a title and body',
    (slug) => {
      const md = fs.readFileSync(path.join(process.cwd(), 'content/legal', `${slug}.md`), 'utf8')
      const { title, body } = legalMarkdownBody(md)
      expect(title.length).toBeGreaterThan(0)
      expect(body.startsWith('#')).toBe(false)
      expect(body).toContain('## 1.')
    },
  )
})
