import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi as vitest } from 'vitest'

vitest.mock('server-only', () => ({}))

import { ImageText } from '@/components/site/ImageText'
import { HanaStory } from '@/components/site/HanaStory'
import { StoryHighlights } from '@/components/site/StoryHighlights'
import { puckConfig } from '@/puck/config'

describe('PK-34: ImageText highlights and box quote style', () => {
  const sampleHighlights = [
    { title: 'Điểm chạm đầu tiên', text: 'Nhận diện cảm xúc thật sự của chính mình.' },
    { title: 'Không gian an toàn', text: 'Lắng nghe không phán xét, đón nhận mọi khía cạnh.' },
    { title: 'Chuyển hóa bền vững', text: 'Hành động nhỏ mỗi ngày tạo nên thay đổi lớn.' },
  ]

  describe('1. Default backward compatibility (no new fields)', () => {
    it('renders identical HTML when quoteStyle is line and highlights is empty', () => {
      const markupDefault = renderToStaticMarkup(
        <ImageText
          titleLine1="Tại sao lại là"
          titleLine2="Trạm Dừng?"
          content={'Đoạn văn thứ nhất.\n\nĐoạn văn thứ hai.'}
          quote="Một nơi để bạn dừng lại và thấu hiểu chính mình."
          quoteStyle="callout"
          highlights={[]}
        />,
      )

      const markupOmitted = renderToStaticMarkup(
        <ImageText
          titleLine1="Tại sao lại là"
          titleLine2="Trạm Dừng?"
          content={'Đoạn văn thứ nhất.\n\nĐoạn văn thứ hai.'}
          quote="Một nơi để bạn dừng lại và thấu hiểu chính mình."
        />,
      )

      expect(markupDefault).toBe(markupOmitted)
      expect(markupDefault).toMatchSnapshot()
    })

    it('ensures puck config for ImageText defaults to quoteStyle line and highlights []', () => {
      const comp = puckConfig.components.ImageText
      expect(comp).toBeDefined()
      expect(comp?.defaultProps?.version).toBe(2) // Prop version not bumped
      expect(comp?.defaultProps?.quoteStyle).toBe('callout') // CD-01 default kept
      expect(comp?.defaultProps?.highlights).toEqual([])
      expect(comp?.fields?.quoteStyle).toBeDefined()
      expect(comp?.fields?.highlights).toBeDefined()
    })
  })

  describe('2. Highlights (3 numbered cards)', () => {
    it('renders 3 cards numbered 01, 02, 03 placed after the content paragraphs', () => {
      const html = renderToStaticMarkup(
        <ImageText
          titleLine1="Tại sao lại là"
          titleLine2="Trạm Dừng?"
          content="Đoạn văn nội dung giới thiệu."
          highlights={sampleHighlights}
        />,
      )

      expect(html).toContain('01')
      expect(html).toContain('02')
      expect(html).toContain('03')
      expect(html).toContain('Điểm chạm đầu tiên')
      expect(html).toContain('Không gian an toàn')
      expect(html).toContain('Chuyển hóa bền vững')

      // Content paragraph comes before highlights
      const contentIndex = html.indexOf('Đoạn văn nội dung giới thiệu.')
      const highlight1Index = html.indexOf('Điểm chạm đầu tiên')
      expect(contentIndex).toBeLessThan(highlight1Index)
    })

    it('limits to maximum 4 highlight cards', () => {
      const fourPlus = [
        ...sampleHighlights,
        { title: 'Thẻ thứ 4', text: 'Mô tả thẻ 4' },
        { title: 'Thẻ thứ 5 (vượt quá)', text: 'Mô tả thẻ 5' },
      ]
      const html = renderToStaticMarkup(
        <ImageText titleLine1="Test" content="Content" highlights={fourPlus} />,
      )
      expect(html).toContain('04')
      expect(html).toContain('Thẻ thứ 4')
      expect(html).not.toContain('Thẻ thứ 5 (vượt quá)')
    })
  })

  describe('3. Quote style: box vs callout', () => {
    it('renders box quote placed before the content paragraphs', () => {
      const html = renderToStaticMarkup(
        <ImageText
          titleLine1="Brand Story"
          content="Nội dung tự sự đặt bên dưới hộp trích dẫn."
          quote="Trích dẫn nổi bật cần gây ấn tượng trước."
          quoteStyle="box"
        />,
      )

      // Box quote has soft-pink background and bright-magenta text
      expect(html).toContain('bg-soft-pink')
      expect(html).toContain('text-bright-magenta')

      // Box quote appears before content paragraph
      const quoteIndex = html.indexOf('Trích dẫn nổi bật cần gây ấn tượng trước.')
      const contentIndex = html.indexOf('Nội dung tự sự đặt bên dưới hộp trích dẫn.')
      expect(quoteIndex).toBeLessThan(contentIndex)
    })

    it('renders line quote placed after the content paragraphs', () => {
      const html = renderToStaticMarkup(
        <ImageText
          titleLine1="Brand Story"
          content="Nội dung tự sự đặt bên trên trích dẫn."
          quote="Trích dẫn kẻ dọc nằm ở cuối văn bản."
          quoteStyle="callout"
        />,
      )

      expect(html).toContain('border-l-2 border-accent-pink')

      const contentIndex = html.indexOf('Nội dung tự sự đặt bên trên trích dẫn.')
      const quoteIndex = html.indexOf('Trích dẫn kẻ dọc nằm ở cuối văn bản.')
      expect(contentIndex).toBeLessThan(quoteIndex)
    })
  })

  describe('3b. QA PK-34: quote typed with its own quote marks', () => {
    it.each(['callout', 'box'] as const)('does not double the quote marks (%s)', (style) => {
      const html = renderToStaticMarkup(
        <ImageText
          titleLine1="Tại sao lại là"
          content="Đoạn văn."
          quote={'"Những điều đẹp đẽ luôn bắt đầu khi bạn cho phép mình dừng lại."'}
          quoteStyle={style}
        />,
      )
      expect(html).toContain('“Những điều đẹp đẽ luôn bắt đầu khi bạn cho phép mình dừng lại.”')
      expect(html).not.toContain('“&quot;')
    })
  })

  describe('4. Dark theme (deep-navy background) contrast & styling', () => {
    it('uses soft-pink text and white/10 card backgrounds on deep-navy', () => {
      const html = renderToStaticMarkup(
        <ImageText
          bgColor="deep-navy"
          titleLine1="Brand Story"
          content="Nội dung trên nền tối."
          quote="Trích dẫn trên nền tối."
          quoteStyle="box"
          highlights={sampleHighlights}
        />,
      )

      // Box quote on dark theme
      expect(html).toContain('bg-white/10')
      expect(html).toContain('text-soft-pink')

      // Highlights cards on dark theme
      expect(html).toContain('text-soft-pink') // Numbers
      expect(html).toContain('bg-white/10 border-white/20 text-white')
    })
  })

  describe('5. StoryHighlights shared component and HanaStory integration', () => {
    it('renders standalone StoryHighlights correctly', () => {
      const html = renderToStaticMarkup(<StoryHighlights items={sampleHighlights} isDark={false} />)
      expect(html).toContain('grid grid-cols-1 lg:grid-cols-3')
      expect(html).toContain('01')
      expect(html).toContain('Điểm chạm đầu tiên')
    })

    it('renders HanaStory with shared StoryHighlights cleanly', () => {
      const html = renderToStaticMarkup(
        <HanaStory
          titleLine1="Hana Story"
          storyContent="Nội dung câu chuyện."
          highlights={sampleHighlights}
        />,
      )
      expect(html).toContain('01')
      expect(html).toContain('Điểm chạm đầu tiên')
      expect(html).toContain('02')
      expect(html).toContain('03')
    })
  })

  describe('6. Layout variations: image-right and imageBleed', () => {
    it('supports image-right layout with box quote and highlights', () => {
      const html = renderToStaticMarkup(
        <ImageText
          layout="image-right"
          imageUrl="/brand/story.jpg"
          imageAlt="Ảnh câu chuyện"
          titleLine1="Tại sao là Trạm Dừng"
          content="Văn bản tự sự."
          quote="Câu trích dẫn."
          quoteStyle="box"
          highlights={sampleHighlights}
        />,
      )
      expect(html).toContain('md:order-1')
      expect(html).toContain('01')
      expect(html).toContain('bg-soft-pink')
    })

    it('supports imageBleed layout with box quote and highlights', () => {
      const html = renderToStaticMarkup(
        <ImageText
          imageBleed={true}
          imageUrl="/brand/story.jpg"
          imageAlt="Ảnh câu chuyện"
          titleLine1="Tại sao là Trạm Dừng"
          content="Văn bản tự sự."
          quote="Câu trích dẫn."
          quoteStyle="box"
          highlights={sampleHighlights}
        />,
      )
      expect(html).toContain('overflow-hidden')
      expect(html).toContain('01')
    })
  })
})
