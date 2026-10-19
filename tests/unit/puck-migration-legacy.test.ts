import { describe, it, expect } from 'vitest'
import { applyPuckMigrations } from '@/puck/migrations'
import type { Data } from '@puckeditor/core'

describe('Puck Legacy Block Migrations (T1-04)', () => {
  it('migrates legacy page with CTAButton v1 and T1-01 blocks without data loss', () => {
    const legacyPageData: Data = {
      root: { props: { title: 'Trang cũ v1' } },
      content: [
        {
          type: 'HeroImage',
          props: {
            id: 'hero-1',
            version: 1,
            seriesLabel: 'Nhãn series gốc',
            titleLine1: 'TIÊU ĐỀ 1',
            titleLine2: 'TIÊU ĐỀ 2',
            emotionLine: 'Dòng cảm xúc nhẹ nhàng',
            mediaId: 'media-123',
            imageUrl: 'https://example.com/hero.jpg',
            imageAlt: 'Hero alt text',
            buttonText: 'Tìm hiểu ngay',
            buttonLink: '/about',
            bgColor: 'lavender-mist',
            padding: 'lg',
          },
        },
        {
          type: 'QuoteBlock',
          props: {
            id: 'quote-1',
            version: 1,
            quoteText: 'Mỗi cảm xúc đều mang một thông điệp quý giá.',
            authorName: 'Tác giả',
            authorTitle: 'Chuyên gia khai vấn',
            bgColor: 'warm-ivory',
            padding: 'md',
          },
        },
        {
          type: 'StatsBar',
          props: {
            id: 'stats-1',
            version: 1,
            stats: [
              { value: '10+', label: 'Năm đồng hành' },
              { value: '500+', label: 'Giờ khai vấn' },
            ],
            bgColor: 'warm-ivory',
            padding: 'sm',
          },
        },
        {
          type: 'JourneySteps',
          props: {
            id: 'journey-1',
            version: 1,
            seriesLabel: '5 Bước',
            titleLine1: 'HÀNH TRÌNH',
            titleLine2: 'CHUYỂN HÓA',
            emotionLine: 'Từng bước thấu hiểu bản thân',
            step1Description: 'Bước 1 mô tả',
            step2Description: 'Bước 2 mô tả',
            step3Description: 'Bước 3 mô tả',
            step4Description: 'Bước 4 mô tả',
            step5Description: 'Bước 5 mô tả',
            bgColor: 'warm-ivory',
            padding: 'md',
          },
        },
        {
          type: 'FAQ',
          props: {
            id: 'faq-1',
            version: 1,
            seriesLabel: 'Giải đáp',
            titleLine1: 'CÂU HỎI',
            titleLine2: 'THƯỜNG GẶP',
            items: [{ question: 'Câu hỏi 1?', answer: 'Trả lời 1' }],
            bgColor: 'warm-ivory',
            padding: 'md',
          },
        },
        {
          type: 'VideoEmbed',
          props: {
            id: 'video-1',
            version: 1,
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            title: 'Video giới thiệu',
            bgColor: 'warm-ivory',
            padding: 'md',
          },
        },
        {
          type: 'Columns',
          props: {
            id: 'columns-1',
            version: 1,
            columnCount: 2,
            bgColor: 'warm-ivory',
            padding: 'md',
            col1: [
              {
                type: 'CTAButton',
                props: {
                  id: 'cta-nested',
                  label: 'Nút trong cột',
                  href: '/dang-ky-col',
                  variant: 'secondary',
                  size: 'sm',
                  align: 'center',
                },
              },
            ],
            col2: [],
            col3: [],
          },
        },
        {
          type: 'Spacer',
          props: {
            id: 'spacer-1',
            version: 1,
            height: 32,
          },
        },
        {
          type: 'Divider',
          props: {
            id: 'divider-1',
            version: 1,
            variant: 'heart',
            padding: 'md',
          },
        },
        // Legacy root CTAButton without version 2, linkType, or pageId
        {
          type: 'CTAButton',
          props: {
            id: 'cta-root',
            label: 'Đăng ký ngay',
            href: '/dang-ky',
            variant: 'primary',
            size: 'lg',
            align: 'center',
          },
        },
      ],
    }

    const migrated = applyPuckMigrations(legacyPageData)

    // 1. Root CTAButton is updated to v2 with defaults, retaining all previous properties
    const rootCta = migrated.content.find((item) => item.props.id === 'cta-root')
    expect(rootCta).toBeDefined()
    expect(rootCta?.props.version).toBe(2)
    expect(rootCta?.props.linkType).toBe('url')
    expect(rootCta?.props.pageId).toBe('')
    expect(rootCta?.props.label).toBe('Đăng ký ngay')
    expect(rootCta?.props.href).toBe('/dang-ky')
    expect(rootCta?.props.variant).toBe('primary')
    expect(rootCta?.props.size).toBe('lg')

    // 2. Nested CTAButton inside Columns.col1 is also updated to v2
    const cols = migrated.content.find((item) => item.props.id === 'columns-1')
    expect(cols).toBeDefined()
    const nestedCta = (
      cols?.props.col1 as Array<{ type: string; props: Record<string, unknown> }>
    )?.[0]
    expect(nestedCta).toBeDefined()
    expect(nestedCta?.props.version).toBe(2)
    expect(nestedCta?.props.linkType).toBe('url')
    expect(nestedCta?.props.pageId).toBe('')
    expect(nestedCta?.props.label).toBe('Nút trong cột')
    expect(nestedCta?.props.href).toBe('/dang-ky-col')
    expect(nestedCta?.props.variant).toBe('secondary')

    // 3. All legacy blocks retain their original props without any data loss and have new v2 defaults
    const hero = migrated.content.find((item) => item.props.id === 'hero-1')
    expect(hero?.props).toMatchObject({
      seriesLabel: 'Nhãn series gốc',
      titleLine1: 'TIÊU ĐỀ 1',
      titleLine2: 'TIÊU ĐỀ 2',
      emotionLine: 'Dòng cảm xúc nhẹ nhàng',
      mediaId: 'media-123',
      imageUrl: 'https://example.com/hero.jpg',
      imageAlt: 'Hero alt text',
      buttonText: 'Tìm hiểu ngay',
      buttonLink: '/about',
      bgColor: 'lavender-mist',
      padding: 'lg',
      version: 2,
    })

    const quote = migrated.content.find((item) => item.props.id === 'quote-1')
    expect(quote?.props).toMatchObject({
      quoteText: 'Mỗi cảm xúc đều mang một thông điệp quý giá.',
      authorName: 'Tác giả',
      authorTitle: 'Chuyên gia khai vấn',
      bgColor: 'warm-ivory',
      padding: 'md',
      version: 2,
    })

    const stats = migrated.content.find((item) => item.props.id === 'stats-1')
    expect(stats?.props).toMatchObject({
      version: 2,
      bgColor: 'warm-ivory',
      padding: 'sm',
    })
    expect(stats?.props.stats).toEqual([
      { value: '10+', label: 'Năm đồng hành', description: '', icon: '' },
      { value: '500+', label: 'Giờ khai vấn', description: '', icon: '' },
    ])

    const journey = migrated.content.find((item) => item.props.id === 'journey-1')
    expect(journey?.props).toEqual(legacyPageData.content[3].props)

    const faq = migrated.content.find((item) => item.props.id === 'faq-1')
    expect(faq?.props).toMatchObject({
      seriesLabel: 'Giải đáp',
      titleLine1: 'CÂU HỎI',
      titleLine2: 'THƯỜNG GẶP',
      items: [{ question: 'Câu hỏi 1?', answer: 'Trả lời 1' }],
      bgColor: 'warm-ivory',
      padding: 'md',
      version: 2,
    })

    const video = migrated.content.find((item) => item.props.id === 'video-1')
    expect(video?.props).toEqual(legacyPageData.content[5].props)

    const spacer = migrated.content.find((item) => item.props.id === 'spacer-1')
    expect(spacer?.props).toEqual(legacyPageData.content[7].props)

    const divider = migrated.content.find((item) => item.props.id === 'divider-1')
    expect(divider?.props).toEqual(legacyPageData.content[8].props)
  })
})
