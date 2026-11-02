import { describe, expect, it } from 'vitest'
import { extractCustomCode, hasCustomCodeChanged } from '@/puck/custom-code-guard'

describe('EB-09: custom code guard & permissions (REVIEW-REQUIRED)', () => {
  describe('extractCustomCode', () => {
    it('extracts root customCss, block customCss, and HtmlWidget content', () => {
      const data = {
        root: { props: { title: 'Home', customCss: 'h1 { color: red; }' } },
        content: [
          {
            type: 'HeadingWidget',
            props: {
              id: 'h1',
              _style: { customCss: 'selector { font-size: 20px; }' },
            },
          },
          {
            type: 'HtmlWidget',
            props: {
              id: 'hw1',
              html: '<div>Safe HTML</div>',
            },
          },
          {
            type: 'Container',
            props: {
              id: 'c1',
              items: [
                {
                  type: 'HtmlWidget',
                  props: {
                    id: 'hw2',
                    html: '<p>Nested HTML</p>',
                  },
                },
              ],
            },
          },
        ],
        zones: {
          sidebar: [
            {
              type: 'HeadingWidget',
              props: {
                id: 'side-h1',
                _style: { customCss: 'selector { margin: 0; }' },
              },
            },
          ],
        },
      }

      const extracted = extractCustomCode(data)
      expect(extracted.rootCss).toBe('h1 { color: red; }')
      expect(extracted.blockCss.get('h1')).toBe('selector { font-size: 20px; }')
      expect(extracted.blockCss.get('side-h1')).toBe('selector { margin: 0; }')
      expect(extracted.widgetHtml.get('hw1')).toBe('<div>Safe HTML</div>')
      expect(extracted.widgetHtml.get('hw2')).toBe('<p>Nested HTML</p>')
    })
  })

  describe('hasCustomCodeChanged', () => {
    const baseSaved = {
      root: { props: { title: 'Trang mẫu', customCss: 'body { color: black; }' } },
      content: [
        {
          type: 'HeadingWidget',
          props: {
            id: 'h1',
            title: 'Tiêu đề cũ',
            _style: { customCss: 'selector { color: blue; }' },
          },
        },
        {
          type: 'HtmlWidget',
          props: {
            id: 'hw1',
            html: '<p>Nội dung cũ</p>',
          },
        },
      ],
    }

    it('returns false when only non-custom-code properties change (editor edit allowed)', () => {
      const incoming = {
        root: { props: { title: 'Trang mới đã đổi', customCss: 'body { color: black; }' } },
        content: [
          {
            type: 'HeadingWidget',
            props: {
              id: 'h1',
              title: 'Tiêu đề mới đã đổi',
              _style: {
                padding: { desktop: { top: 'lg' } },
                customCss: 'selector { color: blue; }', // unchanged!
              },
            },
          },
          {
            type: 'HtmlWidget',
            props: {
              id: 'hw1',
              html: '<p>Nội dung cũ</p>', // unchanged!
            },
          },
        ],
      }

      expect(hasCustomCodeChanged(baseSaved, incoming)).toBe(false)
    })

    it('returns true when root customCss is modified', () => {
      const incoming = {
        ...baseSaved,
        root: { props: { customCss: 'body { color: red; }' } },
      }
      expect(hasCustomCodeChanged(baseSaved, incoming)).toBe(true)
    })

    it('returns true when block customCss is modified', () => {
      const incoming = {
        ...baseSaved,
        content: [
          {
            type: 'HeadingWidget',
            props: {
              id: 'h1',
              _style: { customCss: 'selector { color: red; }' }, // modified!
            },
          },
          baseSaved.content[1],
        ],
      }
      expect(hasCustomCodeChanged(baseSaved, incoming)).toBe(true)
    })

    it('returns true when a new block with customCss is introduced', () => {
      const incoming = {
        ...baseSaved,
        content: [
          ...baseSaved.content,
          {
            type: 'HeadingWidget',
            props: {
              id: 'h2',
              _style: { customCss: 'selector { font-size: 30px; }' },
            },
          },
        ],
      }
      expect(hasCustomCodeChanged(baseSaved, incoming)).toBe(true)
    })

    it('returns true when HtmlWidget html is modified', () => {
      const incoming = {
        ...baseSaved,
        content: [
          baseSaved.content[0],
          {
            type: 'HtmlWidget',
            props: {
              id: 'hw1',
              html: '<p>Nội dung đã sửa bởi editor</p>',
            },
          },
        ],
      }
      expect(hasCustomCodeChanged(baseSaved, incoming)).toBe(true)
    })

    it('returns true when a new HtmlWidget is introduced', () => {
      const incoming = {
        ...baseSaved,
        content: [
          ...baseSaved.content,
          {
            type: 'HtmlWidget',
            props: {
              id: 'hw2',
              html: '<script>alert(1)</script>',
            },
          },
        ],
      }
      expect(hasCustomCodeChanged(baseSaved, incoming)).toBe(true)
    })

    it('returns true when customCss or HtmlWidget is deleted', () => {
      const incoming = {
        root: { props: { title: 'Trang' } }, // customCss removed!
        content: [baseSaved.content[0]], // hw1 removed!
      }
      expect(hasCustomCodeChanged(baseSaved, incoming)).toBe(true)
    })
  })
})
