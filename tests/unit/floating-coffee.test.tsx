import React from 'react'
import { describe, expect, it, vi as vitest, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FloatingCoffee, FloatingActions } from '@/components/site'
import { vi } from '@/lib/i18n/vi'
import * as trackModule from '@/lib/analytics/track'

let currentPathname = '/'

vitest.mock('next/navigation', () => ({
  usePathname: () => currentPathname,
}))

const sampleCoffee = {
  qrSrc: '/media/sample-qr.png',
  qrAlt: 'Mã QR MoMo ủng hộ Trạm',
  title: 'Mời Trạm một ly cà phê ấm áp',
  message: 'Sự đồng hành của bạn giúp Trạm tiếp tục lan tỏa.',
  momoUrl: 'https://me.momo.vn/tramdungcamxuc',
}

describe('FloatingCoffee & FloatingActions (CF-01)', () => {
  beforeEach(() => {
    currentPathname = '/'
    vitest.clearAllMocks()
  })

  it('ẩn FloatingCoffee khi disabled hoặc không có ảnh qrSrc', () => {
    const { container: c1 } = render(<FloatingCoffee coffeeDonation={null} />)
    expect(c1.firstChild).toBeNull()

    const { container: c2 } = render(
      <FloatingCoffee coffeeDonation={{ ...sampleCoffee, qrSrc: '' }} />,
    )
    expect(c2.firstChild).toBeNull()
  })

  it('CF-02: ly cà phê hiện ở mọi trang (kể cả học, tracker, rút thẻ, thanh toán, dùng thử); Zalo vẫn ẩn theo danh sách cũ', () => {
    for (const path of [
      '/',
      '/habit/hoc',
      '/habit/tracker',
      '/eq-buddy/the/abc',
      '/eq-buddy/rut-the',
      '/thanh-toan',
      '/dung-thu',
    ]) {
      currentPathname = path
      const { unmount } = render(
        <FloatingActions
          floatingCoffee={sampleCoffee}
          showFloatingChat={true}
          zaloChatUrl="https://zalo.me/0900000000"
        />,
      )
      expect(screen.getByRole('button', { name: sampleCoffee.title }), path).toBeDefined()
      const zaloHidden = ['/habit/hoc', '/habit/tracker', '/eq-buddy/the/abc', '/eq-buddy/rut-the']
      expect(
        screen.queryByRole('link', { name: vi.site.floatingChat.ariaLabel }) === null,
        path,
      ).toBe(zaloHidden.includes(path))
      unmount()
    }
  })

  it('mở modal hiển thị đúng tiêu đề, lời nhắn, ảnh có alt và kích hoạt track không có props', () => {
    const trackSpy = vitest.spyOn(trackModule, 'track')

    render(<FloatingCoffee coffeeDonation={sampleCoffee} />)

    const button = screen.getByRole('button', {
      name: sampleCoffee.title,
    })
    expect(button).toBeDefined()

    fireEvent.click(button)

    expect(trackSpy).toHaveBeenCalledWith('coffee_opened')
    expect(trackSpy).toHaveBeenCalledTimes(1)

    // Tiêu đề modal
    expect(screen.getByRole('dialog').textContent).toContain(sampleCoffee.title)
    // Lời nhắn
    expect(screen.getByText(sampleCoffee.message)).toBeDefined()
    // Ảnh QR có alt
    const img = screen.getByAltText(sampleCoffee.qrAlt)
    expect(img).toBeDefined()
    expect(img.getAttribute('src')).toContain('sample-qr.png')
    // CF-03: QR is served as the original file (no /_next/image resize or re-encode) and shown large
    expect(img.getAttribute('src')).toBe(sampleCoffee.qrSrc)
    expect(img.getAttribute('src')).not.toContain('/_next/image')
    const fullQr = screen.getByRole('link', { name: vi.cf01.floatingCoffee.openFullQr })
    expect(fullQr.getAttribute('href')).toBe(sampleCoffee.qrSrc)
    expect(fullQr.getAttribute('target')).toBe('_blank')
    // Dòng hướng dẫn quét
    expect(screen.getByText(vi.cf01.floatingCoffee.scanGuide)).toBeDefined()
  })

  it('hiển thị nút "Mở MoMo" an toàn và track sự kiện coffee_momo_clicked', () => {
    const trackSpy = vitest.spyOn(trackModule, 'track')

    render(<FloatingCoffee coffeeDonation={sampleCoffee} />)
    const button = screen.getByRole('button', {
      name: sampleCoffee.title,
    })
    fireEvent.click(button)

    const momoLink = screen.getByRole('link', {
      name: vi.cf01.floatingCoffee.openMomo,
    })
    expect(momoLink).toBeDefined()
    expect(momoLink.getAttribute('href')).toBe('https://me.momo.vn/tramdungcamxuc')
    expect(momoLink.getAttribute('target')).toBe('_blank')
    expect(momoLink.getAttribute('rel')).toBe('noopener noreferrer')

    fireEvent.click(momoLink)
    expect(trackSpy).toHaveBeenCalledWith('coffee_momo_clicked')
  })

  it('chặn javascript: và link không an toàn, không hiển thị nút "Mở MoMo"', () => {
    render(
      <FloatingCoffee
        coffeeDonation={{
          ...sampleCoffee,
          momoUrl: 'javascript:alert(1)',
        }}
      />,
    )
    const button = screen.getByRole('button', {
      name: sampleCoffee.title,
    })
    fireEvent.click(button)

    expect(screen.queryByRole('link', { name: vi.cf01.floatingCoffee.openMomo })).toBeNull()
  })

  it('không có momoUrl thì không hiển thị nút "Mở MoMo"', () => {
    render(
      <FloatingCoffee
        coffeeDonation={{
          ...sampleCoffee,
          momoUrl: null,
        }}
      />,
    )
    const button = screen.getByRole('button', {
      name: sampleCoffee.title,
    })
    fireEvent.click(button)

    expect(screen.queryByRole('link', { name: vi.cf01.floatingCoffee.openMomo })).toBeNull()
  })

  it('FloatingActions: render cả hai nút trong cùng một cột flex-col gap-3, ly cà phê ở trên, Zalo ở dưới', () => {
    const { container } = render(
      <FloatingActions
        floatingCoffee={sampleCoffee}
        showFloatingChat={true}
        zaloChatUrl="https://zalo.me/0900000000"
      />,
    )

    const aside = container.querySelector('aside')
    expect(aside).not.toBeNull()
    expect(aside?.className).toContain('flex')
    expect(aside?.className).toContain('flex-col')
    expect(aside?.className).toContain('gap-3')
    expect(aside?.className).toContain('fixed')
    expect(aside?.className).toContain('right-4')

    // Nút cà phê ở trên (con thứ nhất)
    const coffeeBtn = aside?.querySelector('button')
    expect(coffeeBtn).not.toBeNull()
    expect(coffeeBtn?.getAttribute('aria-label')).toBe(sampleCoffee.title)

    // Nút Zalo ở dưới (con thứ hai)
    const zaloLink = aside?.querySelector('a')
    expect(zaloLink).not.toBeNull()
    expect(zaloLink?.getAttribute('href')).toBe('https://zalo.me/0900000000')
  })

  it('FloatingActions: khi tắt Zalo, chỉ hiển thị nút cà phê và không bị rỗng', () => {
    const { container } = render(
      <FloatingActions floatingCoffee={sampleCoffee} showFloatingChat={false} zaloChatUrl={null} />,
    )

    const aside = container.querySelector('aside')
    expect(aside).not.toBeNull()
    expect(aside?.querySelector('button')).not.toBeNull()
    expect(aside?.querySelector('a')).toBeNull()
  })

  it('FloatingActions: khi tắt cà phê, chỉ hiển thị nút Zalo', () => {
    const { container } = render(
      <FloatingActions
        floatingCoffee={null}
        showFloatingChat={true}
        zaloChatUrl="https://zalo.me/0900000000"
      />,
    )

    const aside = container.querySelector('aside')
    expect(aside).not.toBeNull()
    expect(aside?.querySelector('button')).toBeNull()
    expect(aside?.querySelector('a')).not.toBeNull()
  })

  it('FloatingActions: khi cả hai cùng tắt, trả về null', () => {
    const { container } = render(
      <FloatingActions floatingCoffee={null} showFloatingChat={false} zaloChatUrl={null} />,
    )

    expect(container.firstChild).toBeNull()
  })

  it('CF-01c: hộp thoại QR nằm NGOÀI cột nút nổi (fixed z-30) để không bị navbar z-40 đè', () => {
    const { container } = render(
      <FloatingActions
        floatingCoffee={sampleCoffee}
        showFloatingChat={true}
        zaloChatUrl="https://zalo.me/0900000000"
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: sampleCoffee.title }))
    const dialog = screen.getByRole('dialog')
    const aside = container.querySelector('aside')
    expect(aside?.contains(dialog)).toBe(false)
  })
})

describe('Coffee button label comes from the CMS "Tiêu đề" (08/11)', () => {
  it('shows the CMS title next to the cup, and the default label when the title is empty', () => {
    currentPathname = '/'
    const { unmount } = render(<FloatingCoffee coffeeDonation={sampleCoffee} />)
    const btn = screen.getByRole('button', { name: sampleCoffee.title })
    expect(btn.querySelector('[data-coffee-label]')?.textContent).toBe(sampleCoffee.title)
    unmount()
    render(<FloatingCoffee coffeeDonation={{ ...sampleCoffee, title: '  ' }} />)
    expect(screen.getByRole('button', { name: vi.cf01.floatingCoffee.ariaLabel })).toBeTruthy()
  })
})
