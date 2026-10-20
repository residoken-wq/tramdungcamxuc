import { describe, expect, it, vi as vitest, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vitest.mock('server-only', () => ({}))
vitest.mock('payload', async (importOriginal) => {
  const actual = await importOriginal<typeof import('payload')>()
  return {
    ...actual,
    getPayload: vitest.fn(),
  }
})

import {
  getSiteShellData,
  buildSiteShellFromPayloadData,
  DEFAULT_SITE_SHELL_DATA,
} from '@/lib/site-shell.server'
import { Footer } from '@/components/site/Footer'
import { vi } from '@/lib/i18n/vi'
import type { Navigation, SiteSetting, LegalPage } from '@/payload-types'

describe('site-shell.server & Footer empty states', () => {
  beforeEach(() => {
    vitest.clearAllMocks()
  })

  it('site-shell trả về giá trị an toàn rỗng (không throw/500) khi Payload ném lỗi', async () => {
    const { getPayload } = await import('payload')
    vitest.mocked(getPayload).mockRejectedValueOnce(new Error('Database connection failed'))

    const result = await getSiteShellData()
    expect(result).toEqual(DEFAULT_SITE_SHELL_DATA)
    expect(result.navbar.items).toEqual([])
    expect(result.navbar.cta).toEqual({ label: '', href: '' })
    expect(result.footer.legalLinks).toEqual([])
    expect(result.floatingChat.showFloatingChat).toBe(false)
    expect(result.floatingChat.zaloChatUrl).toBeNull()
  })

  it('buildSiteShellFromPayloadData xử lý đúng menu, cta, quiz featured và legalPages', () => {
    const mockNavigation = {
      id: 1,
      mainMenu: [
        {
          label: 'Về Hana',
          linkType: 'page',
          page: { id: 10, title: 'Về Hana', slug: 've-hana' },
        },
        {
          label: 'Test thói quen 5 phút',
          linkType: 'url',
          url: '/habit/chan-doan',
        },
        {
          label: 'Trang chủ',
          linkType: 'page',
          page: { id: 11, title: 'Trang chủ', slug: '/' },
        },
        {
          label: 'Đặt phiên trải nghiệm',
          linkType: 'page',
          page: { id: 12, title: 'Growth Mirror', slug: 'coaching/growth-mirror' },
          highlight: true,
        },
      ],
    } as unknown as Navigation

    const mockSettings = {
      id: 1,
      showFloatingChat: true,
      zaloChatUrl: 'https://zalo.me/0900000000',
      tagline: 'Hiểu mình rõ. Hành động bền bỉ.',
      sellerInfo: {
        name: 'Trạm Dừng Cảm Xúc',
        taxCode: '0123456789',
        address: 'Hà Nội, Việt Nam',
        phone: '0901234567',
        email: 'contact@tramdungcamxuc.com',
      },
    } as unknown as SiteSetting

    const mockLegalPages = [
      { id: 1, title: 'Điều khoản sử dụng', slug: 'dieu-khoan-su-dung', order: 2 },
      { id: 2, title: 'Thông tin pháp lý', slug: 'thong-tin-phap-ly', order: 1 },
    ] as unknown as LegalPage[]

    const result = buildSiteShellFromPayloadData({
      navigation: mockNavigation,
      siteSettings: mockSettings,
      legalPages: mockLegalPages,
    })

    // CTA lấy từ mục highlight
    expect(result.navbar.cta).toEqual({
      label: 'Đặt phiên trải nghiệm',
      href: '/coaching/growth-mirror',
    })

    // Mục highlight được bỏ khỏi items của navbar
    expect(result.navbar.items).toHaveLength(3)

    // Mục quiz chẩn đoán được đánh dấu featured với shortLabel từ vi.site.quizShortLabel
    const quizItem = result.navbar.items.find((item) => item.href === '/habit/chan-doan')
    expect(quizItem).toBeDefined()
    expect(quizItem?.featured).toBe(true)
    expect(quizItem?.shortLabel).toBe(vi.site.quizShortLabel)

    // Mục có chữ "thói quen" nhưng href khác không được nhận diện là quiz
    const nonQuizResult = buildSiteShellFromPayloadData({
      navigation: {
        id: 2,
        mainMenu: [
          {
            label: 'Xây dựng thói quen',
            linkType: 'url',
            url: '/habit/1-percent-better',
          },
        ],
      } as unknown as Navigation,
    })
    expect(nonQuizResult.navbar.items[0].featured).toBeUndefined()
    expect(nonQuizResult.navbar.items[0].shortLabel).toBeUndefined()

    // Trang chủ có slug '/' được ánh xạ thành '/'
    const homeItem = result.navbar.items.find((item) => item.label === 'Trang chủ')
    expect(homeItem?.href).toBe('/')

    // Trang thường có slug 've-hana' được thêm tiền tố '/'
    const veHanaItem = result.navbar.items.find((item) => item.label === 'Về Hana')
    expect(veHanaItem?.href).toBe('/ve-hana')

    // Footer legalLinks
    expect(result.footer.legalLinks).toHaveLength(2)
    expect(result.footer.legalLinks[0].slug).toBe('/dieu-khoan-su-dung')
    expect(result.footer.tagline).toBe('Hiểu mình rõ. Hành động bền bỉ.')

    // FloatingChat
    expect(result.floatingChat.showFloatingChat).toBe(true)
    expect(result.floatingChat.zaloChatUrl).toBe('https://zalo.me/0900000000')
  })

  it('logo: lấy ảnh đã tải trong Cài đặt website, chưa có thì không có logo', () => {
    const withLogo = buildSiteShellFromPayloadData({
      navigation: null,
      siteSettings: {
        logo: { id: 7, alt: 'Logo Trạm', url: '/api/media/file/logo.png' },
      } as unknown as SiteSetting,
    })
    expect(withLogo.logo).toEqual({ src: '/api/media/file/logo.png', alt: 'Logo Trạm' })

    // depth 0 returns only the id: never render a broken image
    const idOnly = buildSiteShellFromPayloadData({
      navigation: null,
      siteSettings: { logo: 7 } as unknown as SiteSetting,
    })
    expect(idOnly.logo).toBeUndefined()

    const none = buildSiteShellFromPayloadData({ navigation: null, siteSettings: null })
    expect(none.logo).toBeUndefined()
  })

  it('Footer hiện ảnh logo khi có, khung chờ khi chưa có', () => {
    const { unmount } = render(
      <Footer logo={{ src: '/api/media/file/logo.png', alt: 'Logo Trạm' }} />,
    )
    expect(screen.getByAltText('Logo Trạm')).toBeTruthy()
    expect(screen.queryByText('LOGO – chờ file từ Hana')).toBeNull()
    unmount()

    render(<Footer />)
    expect(screen.getByText('LOGO – chờ file từ Hana')).toBeTruthy()
  })

  it('Footer ẩn hoàn toàn trường sellerInfo trống hoặc chỉ chứa khoảng trắng', () => {
    // Trường hợp 1: sellerInfo có các trường rỗng / chuỗi trắng -> không hiển thị trường nào
    const { container: c1 } = render(
      <Footer
        sellerInfo={{
          name: '',
          taxCode: '   ',
          address: '',
          phone: '   ',
          email: '',
        }}
      />,
    )

    expect(screen.queryByText(vi.footer.contactHeading)).toBeNull()
    expect(screen.queryByText(new RegExp(vi.footer.seller.taxCode, 'i'))).toBeNull()
    expect(screen.queryByText(new RegExp(vi.footer.seller.address, 'i'))).toBeNull()
    expect(c1.querySelector('a[href^="tel:"]')).toBeNull()
    expect(c1.querySelector('a[href^="mailto:"]')).toBeNull()

    // Trường hợp 2: sellerInfo chỉ có một số trường hợp lệ
    render(
      <Footer
        sellerInfo={{
          name: 'Hộ kinh doanh Hana',
          taxCode: '   ', // rỗng
          address: 'Hà Nội',
          phone: '', // rỗng
          email: 'hana@example.com',
        }}
      />,
    )

    expect(screen.getByText('Hộ kinh doanh Hana')).toBeDefined()
    expect(screen.getByText('Hà Nội')).toBeDefined()
    expect(screen.getByRole('link', { name: 'hana@example.com' })).toBeDefined()

    // Trường taxCode và phone rỗng phải bị ẩn hoàn toàn
    expect(screen.queryByText(new RegExp(`${vi.footer.seller.taxCode}:`, 'i'))).toBeNull()
    expect(screen.queryByText(new RegExp(`${vi.footer.seller.phone}:`, 'i'))).toBeNull()
  })
})
