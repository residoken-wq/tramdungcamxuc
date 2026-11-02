import { describe, it, expect, vi as vitest } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { NavMenuView } from '@/components/site/nav/NavMenuView'
import { SiteLogoBlock } from '@/puck/blocks/site/SiteLogo'
import { NavMenuBlock } from '@/puck/blocks/site/NavMenu'
import { HeaderCTABlock } from '@/puck/blocks/site/HeaderCTA'
import { AccountLinkBlock } from '@/puck/blocks/site/AccountLink'
import { vi as i18nVi } from '@/lib/i18n/vi'

vitest.mock('next/navigation', () => ({
  usePathname: () => '/ve-tram',
}))

describe('EB-10: Header blocks and NavMenuView', () => {
  const sampleItems = [
    { label: 'Trang chủ', href: '/' },
    {
      label: 'Khóa học',
      href: '',
      groups: [
        {
          label: 'Nhóm 1',
          items: [{ label: 'Habit Hack', href: '/habit' }],
        },
      ],
    },
    { label: 'Về Trạm', href: '/ve-tram' },
  ]

  it('NavMenuView renders desktop links with active state and handles mobile drawer', () => {
    render(
      <NavMenuView
        items={sampleItems}
        showAccountLink
        showCta
        cta={{ label: 'Khám phá', href: '/kham-pha' }}
        customer={null}
      />,
    )

    // Desktop nav
    const desktopNav = screen.getByRole('navigation', { name: i18nVi.navbar.mainNav })
    expect(desktopNav).toBeTruthy()

    // Active path
    const activeLink = desktopNav.querySelector('a[href="/ve-tram"]')
    expect(activeLink?.getAttribute('aria-current')).toBe('page')

    // Mobile toggle button
    const toggleBtn = screen.getByRole('button', { name: i18nVi.navbar.openMenu })
    expect(toggleBtn).toBeTruthy()
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('false')

    // Open mobile drawer
    fireEvent.click(toggleBtn)
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('true')
    const mobileDrawer = document.getElementById('mobile-nav-drawer')
    expect(mobileDrawer).toBeTruthy()

    // Close on Escape
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('false')
  })

  it('SiteLogoBlock renders link to home and enforces minimum 120px logo', () => {
    // When image src is provided
    const { container: smContainer } = render(
      SiteLogoBlock.render({
        id: 'logo-sm',
        size: 'sm',
        align: 'left',
        src: '/api/media/file/logo.png',
        alt: 'Trạm Dừng Cảm Xúc',
        puck: {} as any,
      }),
    )
    const smImg = smContainer.querySelector('img')
    expect(smImg?.getAttribute('width')).toBe('120')

    // When no src (placeholder brand box with minimum width)
    const { container: placeholderContainer } = render(
      SiteLogoBlock.render({
        id: 'logo-ph',
        size: 'sm',
        align: 'left',
        puck: {} as any,
      }),
    )
    const placeholder = placeholderContainer.querySelector('[role="img"]')
    expect(placeholder?.getAttribute('style')).toContain('120px')

    const link = smContainer.querySelector('a')
    expect(link?.getAttribute('href')).toBe('/')
  })

  it('NavMenuBlock renders NavMenuView with provided items', () => {
    render(
      NavMenuBlock.render({
        id: 'nav-menu-1',
        items: sampleItems,
        align: 'center',
        breakpoint: 'lg',
        puck: {} as any,
      }),
    )
    expect(screen.getByRole('navigation', { name: i18nVi.navbar.mainNav })).toBeTruthy()
  })

  it('HeaderCTABlock renders button with label and href', () => {
    render(
      HeaderCTABlock.render({
        id: 'header-cta-1',
        label: 'Đăng ký ngay',
        href: '/dang-ky',
        variant: 'primary',
        puck: {} as any,
      }),
    )
    const btn = screen.getByRole('link', { name: 'Đăng ký ngay' })
    expect(btn).toBeTruthy()
    expect(btn.getAttribute('href')).toBe('/dang-ky')
  })

  it('AccountLinkBlock reads customer strictly from puck.metadata', () => {
    // Anonymous
    const { unmount } = render(
      AccountLinkBlock.render({
        id: 'account-link-anon',
        showIcon: true,
        puck: { metadata: {} } as any,
      }),
    )
    const anonLink = screen.getByRole('link', { name: i18nVi.auth.accountNavLabel })
    expect(anonLink.getAttribute('href')).toBe('/tai-khoan/dang-nhap')
    unmount()

    // Logged in
    render(
      AccountLinkBlock.render({
        id: 'account-link-auth',
        showIcon: true,
        puck: {
          metadata: {
            customer: { name: 'Hana Lương', email: 'hana@example.com' },
          },
        } as any,
      }),
    )
    const loggedInLink = screen.getByRole('link', { name: 'Hana Lương' })
    expect(loggedInLink.getAttribute('href')).toBe('/tai-khoan')
  })
})
