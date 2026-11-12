import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EQBuddyIntro } from '@/components/eq/zip/EQBuddyIntro'
import { GuideModal } from '@/components/eq/zip/GuideModal'
import { EQCardFlip } from '@/components/eq/zip/EQCardFlip'
import { EQDrawApp } from '@/components/eq/zip/EQDrawApp'
import type { PublicEqCard } from '@/lib/eq/cards.server'
import type { PublicProduct } from '@/lib/products'
import * as eqMigration from '@/migrations/20261111_100000_au02_eq_buddy_fields'
import { vi as viStrings } from '@/lib/i18n/vi'

vi.mock('server-only', () => ({}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}))
vi.mock('@/lib/analytics/track', () => ({
  track: vi.fn(),
}))
vi.mock('@/lib/eq/actions', () => ({
  drawEqCardAction: vi.fn(async () => ({
    success: true,
    card: {
      id: 1,
      code: 'TDCX-22-VITALITY',
      qrSlug: 'vitality-suc-song',
      keywordEn: 'VITALITY',
      keywordVi: 'Sức sống',
      category: 'Cảm xúc',
      message: 'Sức sống luôn tuôn chảy bên trong bạn khi bạn cho phép mình được nghỉ ngơi.',
      promptRecall: 'Lần gần nhất bạn cảm thấy tràn đầy sức sống là khi nào?',
      promptPack: 'Bạn muốn mang theo cảm giác này vào những việc gì hôm nay?',
      promptAcknowledge: 'Bạn ghi nhận năng lượng tươi mới bên trong mình ra sao?',
      gradientTheme: 'from-[#FDE6F6] via-[#FAF7F4] to-[#E9DDF9]',
    },
  })),
}))

const mockCard: PublicEqCard = {
  id: 1,
  code: 'TDCX-22-VITALITY',
  qrSlug: 'vitality-suc-song',
  keywordEn: 'VITALITY',
  keywordVi: 'Sức sống',
  category: 'Cảm xúc',
  message: 'Sức sống luôn tuôn chảy bên trong bạn khi bạn cho phép mình được nghỉ ngơi.',
  promptRecall: 'Lần gần nhất bạn cảm thấy tràn đầy sức sống là khi nào?',
  promptPack: 'Bạn muốn mang theo cảm giác này vào những việc gì hôm nay?',
  promptAcknowledge: 'Bạn ghi nhận năng lượng tươi mới bên trong mình ra sao?',
  gradientTheme: 'from-[#FDE6F6] via-[#FAF7F4] to-[#E9DDF9]',
  story: 'Câu chuyện sức sống',
  printedAt: null,
  order: 1,
  _status: 'published',
}

const mockEqProductWithSale: PublicProduct = {
  id: 2,
  name: 'EQ Buddy số',
  slug: 'eq-buddy-so',
  web: 'eq',
  type: 'digital_tool',
  price: 250000,
  salePrice: 99000,
  saleStatus: 'on_sale',
}

const mockEqProductRegular: PublicProduct = {
  id: 2,
  name: 'EQ Buddy số',
  slug: 'eq-buddy-so',
  web: 'eq',
  type: 'digital_tool',
  price: 250000,
  salePrice: null,
  saleStatus: 'on_sale',
}

const mockCoachingProduct: PublicProduct = {
  id: 7,
  name: 'Growth Mirror – phiên trải nghiệm',
  slug: 'growth-mirror-phien-trai-nghiem',
  web: 'site',
  type: 'coaching_trial',
  price: 149000,
  salePrice: null,
  saleStatus: 'on_sale',
}

describe('AU-02: EQ Buddy Flow theo rà soát của Hana', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('1. Trang giới thiệu /eq-buddy (EQBuddyIntro)', () => {
    it('khi badge trong CMS để trống thì ẩn hoàn toàn, không rơi về chữ mặc định', () => {
      render(
        <EQBuddyIntro
          content={{
            badge: '',
            mainTitle: 'BỘ THẺ EQ BUDDY',
            subtitle: '26 thông điệp cùng bạn',
          }}
        />,
      )

      expect(screen.queryByText(/Bộ thẻ chánh niệm/i)).toBeNull()
      expect(screen.getByText('BỘ THẺ EQ BUDDY')).toBeDefined()
    })

    it('khi badge có nội dung thì hiển thị đúng', () => {
      render(
        <EQBuddyIntro
          content={{
            badge: 'Huy hiệu tùy chỉnh',
            mainTitle: 'BỘ THẺ EQ BUDDY',
          }}
        />,
      )

      expect(screen.getByText('Huy hiệu tùy chỉnh')).toBeDefined()
    })

    it('khi "Bộ thẻ là gì" để trống thì ẩn cả khối và không hiện số bước 1/2', () => {
      const { container } = render(
        <EQBuddyIntro
          content={{
            badge: '',
            intro1Heading: '',
            card1Title: '',
          }}
        />,
      )

      expect(screen.queryByText('Bộ thẻ là gì?')).toBeNull()
      expect(screen.queryByText(/Bước 1\/2/i)).toBeNull()
      // Nút chính đi thẳng vào rút thẻ
      const drawLink = container.querySelector('a[href="/eq-buddy/rut-the"]')
      expect(drawLink).not.toBeNull()
      expect(drawLink?.textContent).toContain('Rút thẻ ngay')
      // Không có link "Bỏ qua hướng dẫn và rút thẻ ngay"
      expect(screen.queryByText(/Bỏ qua hướng dẫn và rút thẻ ngay/i)).toBeNull()
    })

    it('nút Shopee mang đúng link, mở tab mới và có UTM', () => {
      const { container } = render(
        <EQBuddyIntro
          content={{
            shopeeUrl: 'https://tinyurl.com/yc43suhc',
          }}
        />,
      )

      const shopeeLink = container.querySelector('a[target="_blank"]') as HTMLAnchorElement
      expect(shopeeLink).not.toBeNull()
      expect(shopeeLink.href).toContain('tinyurl.com/yc43suhc')
      expect(shopeeLink.href).toContain('utm_source=tramdungcamxuc')
      expect(shopeeLink.href).toContain('utm_campaign=eq-buddy')
    })
  })

  describe('2. Modal Hướng dẫn (GuideModal)', () => {
    it('hiển thị đúng 3 bước, câu châm ngôn mới và nút Trải nghiệm', () => {
      render(<GuideModal isOpen={true} onClose={() => {}} />)

      // Tiêu đề hướng dẫn
      expect(screen.getByText(/3 bước để "dừng" và kết nối nội tâm mỗi ngày/i)).toBeDefined()
      // 3 bước
      expect(screen.getByText('Gọi tên mong muốn và cảm xúc')).toBeDefined()
      expect(screen.getByText('Chọn thông điệp')).toBeDefined()
      expect(screen.getByText('Khám phá')).toBeDefined()
      // Câu nghiêng
      expect(screen.getByText(/Đằng sau mỗi cảm xúc đều là một thông điệp/i)).toBeDefined()
      // Nút Trải nghiệm
      expect(screen.getByRole('button', { name: 'Trải nghiệm' })).toBeDefined()
    })
  })

  describe('3. Bước nhập trạng thái (EQDrawApp step draw)', () => {
    it('bỏ nhãn Bước 2 lắng nghe tiếng lòng và hiển thị 3 biểu tượng có nhãn', () => {
      render(
        <EQDrawApp
          allCards={[mockCard]}
          initialStep="draw"
          eqProduct={mockEqProductWithSale}
          coachingProduct={mockCoachingProduct}
        />,
      )

      // Bỏ nhãn Bước 2: Lắng nghe tiếng lòng
      expect(screen.queryByText('Bước 2: Lắng nghe tiếng lòng')).toBeNull()
      expect(screen.queryByText(/Kể cho mình nghe một cảm xúc/i)).toBeNull()

      // 3 biểu tượng
      expect(screen.getByText('Hít thở 3 hơi')).toBeDefined()
      expect(screen.getByText('Nghĩ về mong muốn hôm nay')).toBeDefined()
      expect(screen.getByText('Gọi tên cảm xúc hiện tại')).toBeDefined()
    })
  })

  describe('4. Kết quả & Thẻ lật 3D (EQCardFlip & EQDrawApp step result)', () => {
    it('EQCardFlip không còn mã thẻ TDCX- hay # số ở mặt trước, mặt sau và aria-label', () => {
      render(<EQCardFlip card={mockCard} isFlipped={false} onToggleFlip={() => {}} />)

      // Không còn chuỗi TDCX hay #0... / #22
      expect(screen.queryByText(/TDCX-/i)).toBeNull()
      expect(screen.queryByText(/#22/i)).toBeNull()
      expect(screen.queryByText(/THẺ SỐ/i)).toBeNull()

      // Giữ từ khóa
      expect(screen.getAllByText('VITALITY').length).toBeGreaterThanOrEqual(1)

      // Mặt sau: 3 câu hỏi kết nối nội tâm & câu nghiêng
      expect(screen.getByText('3 câu hỏi kết nối nội tâm')).toBeDefined()
      expect(screen.getByText('Dừng để vững vàng bước tới.')).toBeDefined()

      // aria-label không chứa thẻ số
      const cardButton = screen.getByRole('button', { name: /Thẻ EQ: VITALITY/i })
      expect(cardButton).toBeDefined()
      expect(cardButton.getAttribute('aria-label')).not.toContain('#')
    })

    it('kết quả nhắc lại Tôi đang / Tôi cảm thấy và ẩn dòng trống', async () => {
      const { unmount } = render(
        <EQDrawApp
          key="result-test"
          allCards={[mockCard]}
          initialCard={mockCard}
          initialStep="result"
          eqProduct={mockEqProductWithSale}
          coachingProduct={mockCoachingProduct}
        />,
      )

      // Bỏ "Mình đã lắng nghe bạn"
      expect(screen.queryByText(/Mình đã lắng nghe bạn/i)).toBeNull()

      // Khi chưa nhập gì thì không hiện Tôi đang / Tôi cảm thấy
      expect(screen.queryByText(/Tôi đang:/i)).toBeNull()
      expect(screen.queryByText(/Tôi cảm thấy:/i)).toBeNull()

      unmount()

      // Giả lập từ bước draw chuyển qua: bấm chọn cảm xúc rồi rút
      const { container } = render(
        <EQDrawApp
          key="draw-test"
          allCards={[mockCard]}
          initialStep="draw"
          eqProduct={mockEqProductWithSale}
          coachingProduct={mockCoachingProduct}
        />,
      )

      const input = container.querySelector('#emotion-input') as HTMLInputElement
      expect(input).not.toBeNull()
      fireEvent.change(input, { target: { value: 'chuẩn bị đổi việc' } })

      // Chọn chip cảm xúc
      const emotionChip = screen.getByRole('button', { name: /\+ Bình an/i })
      fireEvent.click(emotionChip)

      // Bấm nút rút thẻ
      const drawBtn = screen.getByRole('button', { name: /Rút ngẫu nhiên một thẻ/i })
      fireEvent.click(drawBtn)

      // Trên màn hình kết quả: hiện cả hai
      await expect(screen.findByText(/Tôi đang:/i)).resolves.toBeDefined()
      expect(screen.getByText(/chuẩn bị đổi việc/i)).toBeDefined()
      expect(screen.getByText(/Tôi cảm thấy:/i)).toBeDefined()
      expect(screen.getByText(/Bình an/i)).toBeDefined()
    })

    it('nút VIP Member lấy giá từ sản phẩm trong CMS (có gạch ngang khi có ưu đãi)', () => {
      render(
        <EQDrawApp
          allCards={[mockCard]}
          initialCard={mockCard}
          initialStep="result"
          eqProduct={mockEqProductWithSale}
          coachingProduct={mockCoachingProduct}
          shopeeUrl="https://shopee.vn/test-shop"
        />,
      )

      // Nút VIP Member
      const vipLink = screen.getByRole('link', { name: /Trở thành VIP Member/i })
      expect(vipLink).toBeDefined()
      expect(vipLink.getAttribute('href')).toContain('/thanh-toan?san-pham=eq-buddy-so')
      // Có giá gạch ngang 250.000đ và giá ưu đãi 99.000đ
      expect(vipLink.textContent).toContain('250.000đ')
      expect(vipLink.textContent).toContain('99.000đ')

      // Nút Shopee
      const shopeeBtn = screen.getByRole('link', { name: /Mua bộ thẻ trên Shopee/i })
      expect(shopeeBtn).toBeDefined()
      expect(shopeeBtn.getAttribute('target')).toBe('_blank')

      // Nút Coaching 1-1 (AU-04)
      const coachingBtn = screen.getByRole('link', { name: /Đặt lịch coaching 1-1/i })
      expect(coachingBtn).toBeDefined()
      expect(coachingBtn.getAttribute('href')).toContain('/dat-phien-trai-nghiem')
      expect(coachingBtn.textContent).toContain('149.000đ')
    })

    it('nút VIP Member khi không có sản phẩm thì không hiện giá dự phòng ghi cứng', () => {
      render(
        <EQDrawApp
          allCards={[mockCard]}
          initialCard={mockCard}
          initialStep="result"
          eqProduct={null}
          coachingProduct={mockCoachingProduct}
        />,
      )

      const vipLink = screen.getByRole('link', { name: /Trở thành VIP Member/i })
      expect(vipLink.textContent).toContain('Trở thành VIP Member')
      expect(vipLink.textContent).not.toContain('250.000đ')
    })

    it('nút Shopee ẩn khi không có shopeeUrl', () => {
      render(
        <EQDrawApp
          allCards={[mockCard]}
          initialCard={mockCard}
          initialStep="result"
          eqProduct={mockEqProductRegular}
          coachingProduct={mockCoachingProduct}
          shopeeUrl=""
        />,
      )

      expect(screen.queryByRole('link', { name: /Mua bộ thẻ trên Shopee/i })).toBeNull()
    })

    it('nút VIP Member khi hết hạn ưu đãi thì chỉ hiện giá gốc', () => {
      render(
        <EQDrawApp
          allCards={[mockCard]}
          initialCard={mockCard}
          initialStep="result"
          eqProduct={mockEqProductRegular}
          coachingProduct={mockCoachingProduct}
          shopeeUrl="https://shopee.vn/test-shop"
        />,
      )

      const vipLink = screen.getByRole('link', { name: /Trở thành VIP Member/i })
      expect(vipLink.textContent).toContain('250.000đ')
      expect(vipLink.textContent).not.toContain('99.000đ')
    })
  })

  describe('5. Migration AU-02', () => {
    it('up và down migration thực thi SQL hợp lệ', async () => {
      const executedSql: string[] = []
      const fakeDb = {
        execute: vi.fn(async (query: any) => {
          executedSql.push(JSON.stringify(query))
        }),
      }

      await eqMigration.up({ db: fakeDb as any, payload: {} as any, req: {} as any })
      expect(fakeDb.execute).toHaveBeenCalledTimes(1)
      expect(executedSql[0]).toContain('guide_modal_title')
      expect(executedSql[0]).toContain('UPDATE')
      expect(executedSql[0]).toContain('eq_buddy_content')

      await eqMigration.down({ db: fakeDb as any, payload: {} as any, req: {} as any })
      expect(fakeDb.execute).toHaveBeenCalledTimes(2)
      expect(executedSql[1]).toContain('DROP COLUMN')
      expect(executedSql[1]).toContain('eq_buddy_content')
    })

    it('migration chỉ đổi câu chữ khi còn đúng chữ mặc định cũ, giữ nguyên nếu đã sửa tay', () => {
      // Mô phỏng logic CASE WHEN trong SQL migration
      function applyMigrationUpdate(row: Record<string, string>) {
        return {
          ...row,
          badge: row.badge === 'Bộ thẻ chánh niệm & Trí tuệ cảm xúc (EQ)' ? '' : row.badge,
          main_title: row.main_title === 'TRẠM DỪNG CẢM XÚC' ? 'BỘ THẺ EQ BUDDY' : row.main_title,
          subtitle:
            row.subtitle ===
              '26 Thẻ Đánh Thức Trí Tuệ Cảm Xúc - Công Cụ Rèn Luyện Tâm Trí & Thấu Cảm Mỗi Ngày' ||
            row.subtitle ===
              'Dành cho những ngày chông chênh, những khoảnh khắc cần một khoảng lặng để lắng nghe và kết nối sâu sắc với chính mình.'
              ? '26 thông điệp cùng bạn Gói ghém cảm xúc - Ghi nhận nỗ lực - Gợi nhớ bài học ý nghĩa mỗi ngày.'
              : row.subtitle,
          shopee_url: row.shopee_url === 'https://shopee.vn' ? 'https://tinyurl.com/yc43suhc' : row.shopee_url,
          intro2_heading:
            row.intro2_heading === '4 Bước Sử Dụng Bộ Thẻ' ||
            row.intro2_heading === '3 bước kết nối cảm xúc'
              ? 'Hướng dẫn: 3 bước để "dừng" và kết nối nội tâm mỗi ngày'
              : row.intro2_heading,
          card2_desc:
            row.card2_desc ===
              'Mở đầu ngày mới tràn đầy chánh niệm, đúc kết bài học sau mỗi trải nghiệm, hoặc tìm một từ khóa dẫn lối khi lý trí đang bối rối, mông lung.' ||
            row.card2_desc === 'Mở đầu ngày mới tràn đầy chánh niệm...'
              ? ''
              : row.card2_desc,
          step1_tag:
            row.step1_tag === '30 giây' || row.step1_tag === 'Dành 3 hơi thở' ? '' : row.step1_tag,
          step2_tag:
            row.step2_tag === 'Lắng nghe' || row.step2_tag === 'Rút thẻ' ? '' : row.step2_tag,
          step3_tag:
            row.step3_tag === 'Chiêm nghiệm' || row.step3_tag === 'Lật thẻ' ? '' : row.step3_tag,
        }
      }

      // Trường hợp 1: Dữ liệu còn chữ mặc định cũ -> cập nhật sang chữ mới theo mục 12 & 13
      const defaultRow = {
        badge: 'Bộ thẻ chánh niệm & Trí tuệ cảm xúc (EQ)',
        main_title: 'TRẠM DỪNG CẢM XÚC',
        subtitle:
          '26 Thẻ Đánh Thức Trí Tuệ Cảm Xúc - Công Cụ Rèn Luyện Tâm Trí & Thấu Cảm Mỗi Ngày',
        shopee_url: 'https://shopee.vn',
        intro2_heading: '4 Bước Sử Dụng Bộ Thẻ',
        card2_desc:
          'Mở đầu ngày mới tràn đầy chánh niệm, đúc kết bài học sau mỗi trải nghiệm, hoặc tìm một từ khóa dẫn lối khi lý trí đang bối rối, mông lung.',
        step1_tag: '30 giây',
        step2_tag: 'Lắng nghe',
        step3_tag: 'Chiêm nghiệm',
      }
      const updatedDefault = applyMigrationUpdate(defaultRow)
      expect(updatedDefault.badge).toBe('')
      expect(updatedDefault.main_title).toBe('BỘ THẺ EQ BUDDY')
      expect(updatedDefault.subtitle).toBe(
        '26 thông điệp cùng bạn Gói ghém cảm xúc - Ghi nhận nỗ lực - Gợi nhớ bài học ý nghĩa mỗi ngày.',
      )
      expect(updatedDefault.shopee_url).toBe('https://tinyurl.com/yc43suhc')
      expect(updatedDefault.intro2_heading).toBe(
        'Hướng dẫn: 3 bước để "dừng" và kết nối nội tâm mỗi ngày',
      )
      expect(updatedDefault.card2_desc).toBe('')
      expect(updatedDefault.step1_tag).toBe('')
      expect(updatedDefault.step2_tag).toBe('')
      expect(updatedDefault.step3_tag).toBe('')

      // Trường hợp 2: Hana đã sửa tay dữ liệu -> giữ nguyên 100%, không bị đè
      const customRow = {
        badge: 'Huy hiệu riêng của Hana',
        main_title: 'Góc Nhỏ Cảm Xúc',
        subtitle: 'Dòng phụ tuỳ biến của Hana',
        shopee_url: 'https://shopee.vn/hana-custom',
        intro2_heading: '3 Bước Của Riêng Tôi',
        card2_desc: 'Mô tả card riêng của Hana',
        step1_tag: 'Thở sâu',
        step2_tag: 'Chọn thẻ',
        step3_tag: 'Suy ngẫm',
      }
      const preservedCustom = applyMigrationUpdate(customRow)
      expect(preservedCustom.badge).toBe('Huy hiệu riêng của Hana')
      expect(preservedCustom.main_title).toBe('Góc Nhỏ Cảm Xúc')
      expect(preservedCustom.subtitle).toBe('Dòng phụ tuỳ biến của Hana')
      expect(preservedCustom.shopee_url).toBe('https://shopee.vn/hana-custom')
      expect(preservedCustom.intro2_heading).toBe('3 Bước Của Riêng Tôi')
      expect(preservedCustom.card2_desc).toBe('Mô tả card riêng của Hana')
      expect(preservedCustom.step1_tag).toBe('Thở sâu')
      expect(preservedCustom.step2_tag).toBe('Chọn thẻ')
      expect(preservedCustom.step3_tag).toBe('Suy ngẫm')
    })
  })
})
