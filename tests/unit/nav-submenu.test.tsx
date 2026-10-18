import { describe, expect, it, vi as vitest } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

vitest.mock('server-only', () => ({}))
vitest.mock('next/navigation', () => ({ usePathname: () => '/eq-buddy' }))

import { buildSiteShellFromPayloadData } from '../../src/lib/site-shell.server'
import { Navbar, type NavItem } from '../../src/components/site/Navbar'
import { isLegacySeedMenu } from '../../seed/seed'
import type { Navigation } from '../../src/payload-types'

const page = (id: number, slug: string) => ({ id, slug }) as never

describe('navbar submenu data (SM-02)', () => {
  it('maps groups, resolves child links, keeps "submenu only" parents without a link', () => {
    const navigation = {
      mainMenu: [
        {
          label: 'Sản phẩm',
          linkType: 'none',
          highlight: true, // ignored: a submenu-only parent cannot be the CTA
          children: [
            {
              groupLabel: 'Dành cho Cá nhân',
              items: [
                { label: 'Lộ trình', linkType: 'page', page: page(1, 'lo-trinh-chuyen-minh') },
                { label: 'EQ Buddy', description: 'Công cụ', linkType: 'url', url: '/eq-buddy' },
              ],
            },
            { groupLabel: 'Rỗng', items: [] },
          ],
        },
        {
          label: 'Tài nguyên',
          linkType: 'none',
          children: [{ items: [{ label: 'Test', linkType: 'url', url: '/habit/chan-doan' }] }],
        },
      ],
    } as unknown as Navigation
    const { navbar } = buildSiteShellFromPayloadData({ navigation })
    expect(navbar.cta).toEqual({ label: '', href: '' })
    expect(navbar.items[0]).toMatchObject({ label: 'Sản phẩm', href: '' })
    expect(navbar.items[0]!.groups).toEqual([
      {
        label: 'Dành cho Cá nhân',
        items: [
          { label: 'Lộ trình', href: '/lo-trinh-chuyen-minh', description: undefined },
          { label: 'EQ Buddy', href: '/eq-buddy', description: 'Công cụ' },
        ],
      },
    ])
    // The quiz stays marked as featured inside a submenu (shown on the mobile bar).
    expect(navbar.items[1]!.groups![0]!.items[0]).toMatchObject({ featured: true })
  })
})

describe('Navbar submenu rendering (SM-02)', () => {
  const items: NavItem[] = [
    {
      label: 'Sản phẩm',
      href: '',
      groups: [{ label: 'Cá nhân', items: [{ label: 'EQ Buddy', href: '/eq-buddy' }] }],
    },
    { label: 'Về Trạm', href: '/ve-tram' },
  ]

  it('toggles the desktop panel, marks the current page and hides an empty CTA', () => {
    render(<Navbar items={items} cta={{ label: '', href: '' }} />)
    const nav = screen.getByRole('navigation', { name: 'Điều hướng chính' })
    const trigger = nav.querySelector('button[aria-expanded]') as HTMLButtonElement
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    const link = nav.querySelector('a[href="/eq-buddy"]')!
    expect(link.getAttribute('aria-current')).toBe('page')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger)
    expect(screen.queryByRole('link', { name: '' })).toBeNull()
  })
})

describe('isLegacySeedMenu (SM-02 seed guard)', () => {
  const pageIds = new Map([
    ['ve-tram', 11],
    ['lo-trinh-chuyen-minh', 12],
    ['doanh-nghiep', 13],
  ])
  type Item = { label: string; linkType: string; page?: number; url?: string; highlight?: boolean }
  const legacy = (): Item[] => [
    { label: 'Về Hana', linkType: 'page', page: 11 },
    { label: 'Thư viện', linkType: 'url', url: '/tai-nguyen' },
    { label: 'Test thói quen 5 phút', linkType: 'url', url: '/habit/chan-doan' },
    { label: 'Growth Mirror', linkType: 'page', page: 12 },
    { label: 'Doanh nghiệp', linkType: 'page', page: 13 },
    { label: 'Đặt phiên trải nghiệm', linkType: 'page', page: 12, highlight: true },
  ]

  it('recognises the old seed menu after the SM-02 migration', () => {
    expect(isLegacySeedMenu(legacy(), pageIds)).toBe(true)
    const beforeMigration = legacy().map((item) =>
      item.url === '/tai-nguyen' ? { ...item, url: '/thu-vien' } : item,
    )
    expect(isLegacySeedMenu(beforeMigration, pageIds)).toBe(true)
  })

  it('treats any edit by Hana as a real menu', () => {
    const renamed = legacy()
    renamed[0] = { ...renamed[0]!, label: 'Về chúng tôi' }
    expect(isLegacySeedMenu(renamed, pageIds)).toBe(false)
    expect(isLegacySeedMenu(legacy().slice(1), pageIds)).toBe(false)
    const moved = legacy()
    moved[4] = { ...moved[4]!, page: 99 }
    expect(isLegacySeedMenu(moved, pageIds)).toBe(false)
  })
})
