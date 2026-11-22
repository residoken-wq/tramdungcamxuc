import React from 'react'
import { describe, expect, it, vi as vitest } from 'vitest'
import { render, screen } from '@testing-library/react'

let mockPathname = '/'
vitest.mock('next/navigation', () => ({ usePathname: () => mockPathname }))

import { mailtoHref, zaloHref } from '../../src/lib/contact-links'
import { FloatingActions } from '../../src/components/site/FloatingActions'

const coffee = { qrSrc: '/media/qr-mau.png', title: '[MẪU] Ly cà phê' } as never

describe('Contact links from Cài đặt website', () => {
  it('Zalo: CMS link first, else zalo.me/<phone> from the hotline', () => {
    expect(zaloHref('https://zalo.me/g/mau', '0900 000 000')).toBe('https://zalo.me/g/mau')
    expect(zaloHref('', '090.0000.000')).toBe('https://zalo.me/0900000000')
    expect(zaloHref(null, '+84 900 000 000')).toBe('https://zalo.me/0900000000')
    expect(zaloHref(null, '84900000000')).toBe('https://zalo.me/0900000000')
    expect(zaloHref('javascript:alert(1)', null)).toBeNull()
    expect(zaloHref(null, '12345')).toBeNull()
    expect(zaloHref(null, null)).toBeNull()
  })

  it('email: mailto only for a real-looking address', () => {
    expect(mailtoHref(' hana@example.com ')).toBe('mailto:hana@example.com')
    expect(mailtoHref('not an email')).toBeNull()
    expect(mailtoHref(undefined)).toBeNull()
  })
})

describe('FloatingActions: email and Zalo above the coffee cup', () => {
  it('order top to bottom is email, Zalo, coffee', () => {
    mockPathname = '/lien-he'
    const { container } = render(
      <FloatingActions
        floatingCoffee={coffee}
        showFloatingChat
        zaloChatUrl="https://zalo.me/0900000000"
        emailHref="mailto:mau@example.com"
      />,
    )
    const aside = container.querySelector('aside')!
    const order = Array.from(aside.children).map(
      (el) => el.getAttribute('data-testid') || el.tagName.toLowerCase(),
    )
    expect(order).toEqual(['floating-email', 'floating-zalo', 'button'])
    expect(screen.getByTestId('floating-email').getAttribute('href')).toBe('mailto:mau@example.com')
    expect(screen.getByTestId('floating-zalo').getAttribute('target')).toBe('_blank')
  })

  it('switch off or a learning page: only the coffee cup stays', () => {
    mockPathname = '/'
    const { container, unmount } = render(
      <FloatingActions
        floatingCoffee={coffee}
        showFloatingChat={false}
        zaloChatUrl="https://zalo.me/0900000000"
        emailHref="mailto:mau@example.com"
      />,
    )
    expect(container.querySelector('[data-testid="floating-email"]')).toBeNull()
    expect(container.querySelector('[data-testid="floating-zalo"]')).toBeNull()
    unmount()

    mockPathname = '/habit/hoc/3'
    const second = render(
      <FloatingActions
        floatingCoffee={coffee}
        showFloatingChat
        zaloChatUrl="https://zalo.me/0900000000"
        emailHref="mailto:mau@example.com"
      />,
    )
    expect(second.container.querySelector('[data-testid="floating-email"]')).toBeNull()
    expect(second.container.querySelector('button')).not.toBeNull()
  })

  it('email alone (no Zalo link, no hotline) still shows', () => {
    mockPathname = '/'
    render(<FloatingActions showFloatingChat emailHref="mailto:mau@example.com" />)
    expect(screen.getByTestId('floating-email')).toBeTruthy()
    expect(screen.queryByTestId('floating-zalo')).toBeNull()
  })
})
