import { describe, expect, it } from 'vitest'
import {
  LEGACY_PAGE_SLUGS,
  LEGACY_REDIRECTS,
  PATHS,
  reverseMapping,
  rewriteLink,
  rewriteLinks,
} from '../../src/lib/paths'

describe('sitemap v2 paths (SM-02)', () => {
  it('rewrites whole legacy links, keeping query and anchor', () => {
    expect(rewriteLink('/thu-vien')).toBe('/tai-nguyen')
    expect(rewriteLink('/thu-vien?tab=noi-dung&topic=habit')).toBe(
      '/tai-nguyen?tab=noi-dung&topic=habit',
    )
    expect(rewriteLink('/ve-hana')).toBe('/ve-tram')
    expect(rewriteLink('/coaching/growth-mirror#dat-phien')).toBe('/lo-trinh-chuyen-minh#dat-phien')
  })

  it('leaves sentences, deeper paths and other links alone', () => {
    expect(rewriteLink('Xem /thu-vien để biết thêm')).toBe('Xem /thu-vien để biết thêm')
    expect(rewriteLink('/thu-vien-cu')).toBe('/thu-vien-cu')
    expect(rewriteLink('/coaching/growth-mirror-1-1')).toBe('/coaching/growth-mirror-1-1')
    expect(rewriteLink('/coaching/thinking-mirror')).toBe('/coaching/thinking-mirror')
    expect(rewriteLink('https://example.com/thu-vien')).toBe('https://example.com/thu-vien')
  })

  it('rewrites nested JSON, counts changes and is idempotent', () => {
    const data = {
      root: { props: { title: '/ve-hana' } },
      content: [
        {
          type: 'HeroTwoEntries',
          props: {
            entry1: { buttonLink: '/coaching/growth-mirror', label: 'Cá nhân' },
            entry2: { buttonLink: '/doanh-nghiep' },
            stats: [1, null, true],
          },
        },
        { type: 'RichText', props: { text: 'Đọc thêm ở /thu-vien' } },
      ],
    }
    const first = rewriteLinks(data)
    expect(first.changed).toBe(2)
    expect(first.value.root.props.title).toBe('/ve-tram')
    expect(first.value.content[0]!.props.entry1).toEqual({
      buttonLink: '/lo-trinh-chuyen-minh',
      label: 'Cá nhân',
    })
    expect(first.value.content[0]!.props.stats).toEqual([1, null, true])
    expect(first.value.content[1]!.props.text).toBe('Đọc thêm ở /thu-vien')
    expect(data.root.props.title).toBe('/ve-hana') // input not mutated
    expect(rewriteLinks(first.value).changed).toBe(0)
  })

  it('reverses the mapping for rollback', () => {
    const back = rewriteLinks(
      { a: '/tai-nguyen?tab=khoa-hoc', b: '/tai-nguyen/ebook' },
      reverseMapping(LEGACY_REDIRECTS),
    )
    expect(back.value).toEqual({ a: '/thu-vien?tab=khoa-hoc', b: '/tai-nguyen/ebook' })
  })

  it('has no redirect loops or chains', () => {
    const sources = new Set<string>(LEGACY_REDIRECTS.map((r) => r.from))
    for (const { from, to } of LEGACY_REDIRECTS) {
      expect(from).not.toBe(to)
      expect(sources.has(to)).toBe(false)
    }
    expect(Object.values(PATHS)).toEqual(expect.arrayContaining(LEGACY_REDIRECTS.map((r) => r.to)))
    for (const { from, to } of LEGACY_PAGE_SLUGS) {
      expect(LEGACY_REDIRECTS.some((r) => r.from === `/${from}` && r.to === `/${to}`)).toBe(true)
    }
  })
})
