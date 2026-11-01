import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
vi.mock('server-only', () => ({}))

import React from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { AfterJourneyPanel } from '@/components/habit/AfterJourneyPanel'
import { TrackerDashboard } from '@/components/habit/TrackerDashboard'
import { getHabitSiteSettings } from '@/lib/habit/journey-content.server'
import { vi as viStrings } from '@/lib/i18n/vi'
import * as analyticsModule from '@/lib/analytics/track'

vi.mock('@/lib/analytics/track', () => ({
  track: vi.fn(),
  EVENT_ALLOWED_PROPS: {
    booking_clicked: ['productId', 'slug', 'pageSlug'],
  },
}))

vi.mock('@/lib/habit/tracker-actions', () => ({
  checkInDay: vi.fn(),
}))

describe('HB-14: Đồng hành sau 28 ngày & Đặt lịch Habit Coach / Ủng hộ', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('1. AfterJourneyPanel UI & Tương tác', () => {
    it('hiển thị tiêu đề và nội dung tùy biến từ CMS khi được cung cấp', () => {
      render(
        <AfterJourneyPanel
          title="Đồng hành tiếp nối cùng Coach"
          text="Cảm ơn bạn đã bền bỉ. Hãy tiếp tục hành trình chuyển mình."
          journeyDays={28}
        />,
      )

      expect(screen.getByText('Đồng hành tiếp nối cùng Coach')).toBeDefined()
      expect(
        screen.getByText('Cảm ơn bạn đã bền bỉ. Hãy tiếp tục hành trình chuyển mình.'),
      ).toBeDefined()
      expect(screen.getByText(viStrings.hb14.badge)).toBeDefined()
    })

    it('không có link -> không hiển thị nút nào', () => {
      render(
        <AfterJourneyPanel
          title="Tiêu đề mẫu"
          text="Nội dung mẫu"
          coachBookingUrl={null}
          donationUrl={null}
        />,
      )

      expect(screen.queryByTestId('after-journey-coach-button')).toBeNull()
      expect(screen.queryByTestId('after-journey-donation-button')).toBeNull()
    })

    it('nút Đặt lịch với Habit Coach: có link hợp lệ -> hiện nút, mở tab mới, rel đúng, bắn sự kiện booking_clicked', () => {
      render(
        <AfterJourneyPanel coachBookingUrl="https://example.com/dat-lich-coach" journeyDays={28} />,
      )

      const coachBtn = screen.getByTestId('after-journey-coach-button')
      expect(coachBtn).toBeDefined()
      expect(coachBtn.textContent).toContain(viStrings.hb14.coachButton)
      expect(coachBtn.getAttribute('href')).toBe('https://example.com/dat-lich-coach')
      expect(coachBtn.getAttribute('target')).toBe('_blank')
      expect(coachBtn.getAttribute('rel')).toBe('noopener noreferrer')

      fireEvent.click(coachBtn)
      expect(analyticsModule.track).toHaveBeenCalledWith('booking_clicked', {
        pageSlug: 'habit-tracker',
        slug: 'habit-coach',
      })
    })

    it('nút Ủng hộ: có link hợp lệ -> hiện nút, mở tab mới, rel đúng, KHÔNG bắn sự kiện analytics', () => {
      render(<AfterJourneyPanel donationUrl="https://example.com/ung-ho" journeyDays={28} />)

      const donateBtn = screen.getByTestId('after-journey-donation-button')
      expect(donateBtn).toBeDefined()
      expect(donateBtn.textContent).toContain(viStrings.hb14.donateButton)
      expect(donateBtn.getAttribute('href')).toBe('https://example.com/ung-ho')
      expect(donateBtn.getAttribute('target')).toBe('_blank')
      expect(donateBtn.getAttribute('rel')).toBe('noopener noreferrer')

      fireEvent.click(donateBtn)
      expect(analyticsModule.track).not.toHaveBeenCalled()
    })

    it('chặn URL độc hại (javascript:) qua safeHref -> không hiện nút', () => {
      render(
        <AfterJourneyPanel
          title="Kiểm tra bảo mật"
          coachBookingUrl="javascript:alert('xss')"
          donationUrl="javascript:alert('hack')"
        />,
      )

      expect(screen.queryByTestId('after-journey-coach-button')).toBeNull()
      expect(screen.queryByTestId('after-journey-donation-button')).toBeNull()
    })
  })

  describe('2. getHabitSiteSettings: logic bật/tắt công tắc Ủng hộ', () => {
    it('công tắc tắt (habitDonationEnabled = false): luôn trả về habitDonationUrl = null ngay cả khi có URL', async () => {
      const mockPayload = {
        findGlobal: vi.fn().mockResolvedValue({
          habitCoachBookingUrl: 'https://example.com/coach',
          habitDonationEnabled: false,
          habitDonationUrl: 'https://example.com/donate',
        }),
      }

      const settings = await getHabitSiteSettings(mockPayload as any)
      expect(settings.habitCoachBookingUrl).toBe('https://example.com/coach')
      expect(settings.habitDonationEnabled).toBe(false)
      expect(settings.habitDonationUrl).toBeNull()
    })

    it('công tắc bật (habitDonationEnabled = true) nhưng link rỗng: trả về habitDonationUrl = null', async () => {
      const mockPayload = {
        findGlobal: vi.fn().mockResolvedValue({
          habitCoachBookingUrl: null,
          habitDonationEnabled: true,
          habitDonationUrl: '   ',
        }),
      }

      const settings = await getHabitSiteSettings(mockPayload as any)
      expect(settings.habitDonationEnabled).toBe(true)
      expect(settings.habitDonationUrl).toBeNull()
    })

    it('công tắc bật và có link: trả về habitDonationUrl đã trim', async () => {
      const mockPayload = {
        findGlobal: vi.fn().mockResolvedValue({
          habitCoachBookingUrl: ' https://example.com/coach  ',
          habitDonationEnabled: true,
          habitDonationUrl: ' https://example.com/donate  ',
        }),
      }

      const settings = await getHabitSiteSettings(mockPayload as any)
      expect(settings.habitCoachBookingUrl).toBe('https://example.com/coach')
      expect(settings.habitDonationEnabled).toBe(true)
      expect(settings.habitDonationUrl).toBe('https://example.com/donate')
    })
  })

  describe('3. Vị trí khối trên TrackerDashboard theo tiến độ hành trình', () => {
    const baseDashboardProps = {
      planId: 1,
      identityStatement: 'Tôi sẽ rèn luyện mỗi ngày',
      currentDay: 10,
      journeyDays: 28,
      initialCheckins: [],
      buyUrl: '/thanh-toan',
      coachBookingUrl: 'https://example.com/coach',
      donationUrl: 'https://example.com/donate',
      afterJourneyTitle: 'Đồng hành cùng Trạm',
      afterJourneyText: 'Tiếp tục vững bước.',
    }

    it('khi đang trong hành trình (currentDay < journeyDays): khối AfterJourneyPanel nằm dưới "Dữ liệu của bạn"', () => {
      render(<TrackerDashboard {...baseDashboardProps} currentDay={10} />)

      const panels = screen.getAllByTestId('after-journey-panel')
      expect(panels).toHaveLength(1)

      // Kiểm tra vị trí: MyDataPanel nằm trước AfterJourneyPanel
      const myDataHeading = screen.getByRole('heading', { name: viStrings.hb13.heading })
      expect(myDataHeading).toBeDefined()
      expect(panels[0]).toBeDefined()

      // myDataHeading xuất hiện trước panel trong cây DOM
      expect(
        myDataHeading.compareDocumentPosition(panels[0]) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    })

    it('khi ngày cuối hành trình (currentDay >= journeyDays): khối AfterJourneyPanel được đưa lên TRÊN lưới thói quen', () => {
      render(<TrackerDashboard {...baseDashboardProps} currentDay={28} />)

      const panels = screen.getAllByTestId('after-journey-panel')
      expect(panels).toHaveLength(1)

      // Kiểm tra vị trí: AfterJourneyPanel nằm trước ProgressGrid (trong lưới hành trình theo trạm)
      const gridHeading = screen.getByRole('heading', { name: viStrings.tracker.pageTitle })
      expect(gridHeading).toBeDefined()

      // panel xuất hiện trước gridHeading trong cây DOM
      expect(
        panels[0].compareDocumentPosition(gridHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()

      // Khối tổng kết TrackerSummaryCard cũng xuất hiện trên lưới cạnh AfterJourneyPanel
      expect(screen.getByText(viStrings.tracker.summary.title)).toBeDefined()
    })
  })
})
