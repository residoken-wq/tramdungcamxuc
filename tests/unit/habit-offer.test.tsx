// @vitest-environment jsdom
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HabitOfferClient } from '@/components/habit/HabitOfferClient'
import type { HabitProductData } from '@/lib/habit.server'

describe('HabitOfferClient (T2-03b / A4)', () => {
  it('không bịa giá, trialDays, số lượng video hay CTA khi CMS trống', () => {
    const emptyProduct: HabitProductData = {
      id: 99,
      name: 'Habit Tracker số',
      slug: 'habit-tracker-so',
      price: null,
      salePrice: null,
      trialDays: null,
      saleStatus: 'coming_soon',
      includes: [],
      faq: [],
      cta: null,
      videoCount: 0,
      techniqueCount: 0,
    }

    const { container } = render(<HabitOfferClient product={emptyProduct} />)

    // Không hiện giá tự bịa 250.000 hay 178.000
    expect(screen.queryByText(/250\.000/)).toBeNull()
    expect(screen.queryByText(/178\.000/)).toBeNull()

    // Không hiện trial badge tự bịa
    expect(screen.queryByText(/✨.*dùng thử/)).toBeNull()

    // Không bịa nút CTA link tới /tai-khoan/dang-nhap?redirect=/habit/hoc
    const ctaLinks = container.querySelectorAll('a[href*="/tai-khoan/dang-nhap"]')
    expect(ctaLinks.length).toBe(0)
  })

  it('tôn trọng saleEndsAt qua getEffectivePrice khi ưu đãi đã hết hạn', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString()
    const expiredProduct: HabitProductData = {
      id: 100,
      name: 'Habit Tracker số',
      slug: 'habit-tracker-so',
      price: 300000,
      salePrice: 199000,
      saleEndsAt: pastDate,
      trialDays: 14,
      saleStatus: 'on_sale',
      includes: ['Video 1'],
      faq: [],
      cta: {
        href: '/thanh-toan?san-pham=habit-tracker-so',
        label: 'Mua ngay',
        kind: 'buy',
      },
      videoCount: 15,
      techniqueCount: 8,
    }

    render(<HabitOfferClient product={expiredProduct} />)

    // Giá ưu đãi đã hết hạn nên không hiện 199.000
    expect(screen.queryByText(/199\.000/)).toBeNull()
    // Giá gốc 300.000 vẫn hiển thị
    expect(screen.getAllByText(/300\.000/).length).toBeGreaterThan(0)
    // Trial badge 14 ngày thật từ CMS hiển thị
    expect(screen.getByText(/✨ 14/)).toBeDefined()
  })
})
