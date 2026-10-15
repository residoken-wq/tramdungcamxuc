import React from 'react'
import { describe, expect, it, vi as vitest, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  FloatingChat,
  HIDE_FLOATING_CHAT_PREFIXES,
  shouldHideFloatingChat,
} from '@/components/site/FloatingChat'
import { vi } from '@/lib/i18n/vi'
import * as trackModule from '@/lib/analytics/track'

let currentPathname = '/'

vitest.mock('next/navigation', () => ({
  usePathname: () => currentPathname,
}))

describe('FloatingChat Component & Route Hiding', () => {
  beforeEach(() => {
    currentPathname = '/'
    vitest.clearAllMocks()
  })

  it('chứa chính xác danh sách prefix cần ẩn (T1-05 + /eq-buddy/the của T3-01)', () => {
    expect([...HIDE_FLOATING_CHAT_PREFIXES]).toEqual([
      '/habit/hoc',
      '/habit/tracker',
      '/eq-buddy/the',
      '/eq-buddy/rut-the',
    ])
  })

  it('hàm shouldHideFloatingChat xác định chính xác các route cần ẩn', () => {
    // Exact prefix match
    expect(shouldHideFloatingChat('/habit/hoc')).toBe(true)
    expect(shouldHideFloatingChat('/habit/tracker')).toBe(true)
    expect(shouldHideFloatingChat('/eq-buddy/rut-the')).toBe(true)

    // Sub-routes under prefixes
    expect(shouldHideFloatingChat('/habit/hoc/lesson-1')).toBe(true)
    expect(shouldHideFloatingChat('/habit/tracker/day-5')).toBe(true)
    expect(shouldHideFloatingChat('/eq-buddy/rut-the/the-01')).toBe(true)

    // Visible routes
    expect(shouldHideFloatingChat('/')).toBe(false)
    expect(shouldHideFloatingChat('/ve-hana')).toBe(false)
    expect(shouldHideFloatingChat('/habit/chan-doan')).toBe(false)
    expect(shouldHideFloatingChat('/habit/5-phut')).toBe(false)
    expect(shouldHideFloatingChat('/dieu-khoan-su-dung')).toBe(false)
    expect(shouldHideFloatingChat(null)).toBe(false)
    expect(shouldHideFloatingChat(undefined)).toBe(false)
    expect(shouldHideFloatingChat('')).toBe(false)
  })

  it('ẩn khi showFloatingChat = false hoặc không có zaloChatUrl', () => {
    const { container: c1 } = render(
      <FloatingChat showFloatingChat={false} zaloChatUrl="https://zalo.me/123" />,
    )
    expect(c1.firstChild).toBeNull()

    const { container: c2 } = render(<FloatingChat showFloatingChat={true} zaloChatUrl="" />)
    expect(c2.firstChild).toBeNull()

    const { container: c3 } = render(<FloatingChat showFloatingChat={true} zaloChatUrl={null} />)
    expect(c3.firstChild).toBeNull()
  })

  it('ẩn khi ở trên route thuộc danh sách ẩn', () => {
    currentPathname = '/habit/hoc/bai-1'
    const { container } = render(
      <FloatingChat showFloatingChat={true} zaloChatUrl="https://zalo.me/123" />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('hiển thị đầy đủ link an toàn, aria-label tiếng Việt và kích hoạt track sự kiện', () => {
    const trackSpy = vitest.spyOn(trackModule, 'track')

    render(<FloatingChat showFloatingChat={true} zaloChatUrl="https://zalo.me/0900000000" />)

    const link = screen.getByRole('link', {
      name: vi.site.floatingChat.ariaLabel,
    })
    expect(link).toBeDefined()
    expect(link.getAttribute('href')).toBe('https://zalo.me/0900000000')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')

    fireEvent.click(link)
    expect(trackSpy).toHaveBeenCalledWith('zalo_chat_clicked')
  })
})
