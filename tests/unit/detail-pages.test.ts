import { describe, it, expect } from 'vitest'
import {
  SERVICE_PUBLIC_SELECT,
  PROGRAM_PUBLIC_SELECT,
  POST_PUBLIC_SELECT,
  TESTIMONIAL_PUBLIC_SELECT,
  buildServiceWhere,
  buildProgramWhere,
  buildPostWhere,
  buildPublishedPuckPageWhere,
  cleanStringList,
  formatServicePrice,
  decideDetailSource,
  toPublicTestimonial,
  toPublicService,
  toPublicProgram,
  toPublicPost,
} from '@/lib/detail-pages'
import { vi } from '@/lib/i18n/vi'

describe('Detail Pages Pure Logic & DTOs (T1-10)', () => {
  describe('Query Builders & Select Objects (Anti-data-leak)', () => {
    it('buildServiceWhere queries by slug and enforces published status', () => {
      const where = buildServiceWhere('growth-mirror')
      expect(where).toEqual({
        and: [{ slug: { equals: 'growth-mirror' } }, { _status: { equals: 'published' } }],
      })
    })

    it('buildProgramWhere queries by slug and enforces published status', () => {
      const where = buildProgramWhere('eq-lanh-dao')
      expect(where).toEqual({
        and: [{ slug: { equals: 'eq-lanh-dao' } }, { _status: { equals: 'published' } }],
      })
    })

    it('buildPostWhere queries by slug and enforces published status', () => {
      const where = buildPostWhere('doc-sach-cung-ban-so-1')
      expect(where).toEqual({
        and: [{ slug: { equals: 'doc-sach-cung-ban-so-1' } }, { _status: { equals: 'published' } }],
      })
    })

    it('buildPublishedPuckPageWhere queries pages by slug and published status', () => {
      const where = buildPublishedPuckPageWhere('coaching/growth-mirror')
      expect(where).toEqual({
        and: [{ slug: { equals: 'coaching/growth-mirror' } }, { _status: { equals: 'published' } }],
      })
    })

    it('SERVICE_PUBLIC_SELECT selects only required public fields', () => {
      expect(SERVICE_PUBLIC_SELECT).toHaveProperty('name', true)
      expect(SERVICE_PUBLIC_SELECT).toHaveProperty('slug', true)
      expect(SERVICE_PUBLIC_SELECT).toHaveProperty('priceMode', true)
      expect(SERVICE_PUBLIC_SELECT).toHaveProperty('price', true)
      expect(SERVICE_PUBLIC_SELECT).toHaveProperty('bookingUrl', true)
      expect(SERVICE_PUBLIC_SELECT).toHaveProperty('testimonials', true)
      expect(SERVICE_PUBLIC_SELECT).toHaveProperty('_status', true)
      // Không chọn trường nhạy cảm
      expect(SERVICE_PUBLIC_SELECT).not.toHaveProperty('isSample')
    })

    it('PROGRAM_PUBLIC_SELECT selects only required public fields', () => {
      expect(PROGRAM_PUBLIC_SELECT).toHaveProperty('name', true)
      expect(PROGRAM_PUBLIC_SELECT).toHaveProperty('targetBehaviors', true)
      expect(PROGRAM_PUBLIC_SELECT).toHaveProperty('deliverables', true)
      expect(PROGRAM_PUBLIC_SELECT).toHaveProperty('caseStudies', true)
      expect(PROGRAM_PUBLIC_SELECT).toHaveProperty('ctaLabel', true)
    })

    it('POST_PUBLIC_SELECT selects only required public fields without leaking files', () => {
      expect(POST_PUBLIC_SELECT).toHaveProperty('title', true)
      expect(POST_PUBLIC_SELECT).toHaveProperty('content', true)
      expect(POST_PUBLIC_SELECT).toHaveProperty('videoUrl', true)
      expect(POST_PUBLIC_SELECT).toHaveProperty('ctaProduct', true)
      expect(POST_PUBLIC_SELECT).not.toHaveProperty('files')
    })

    it('TESTIMONIAL_PUBLIC_SELECT selects consent and attribution only', () => {
      expect(TESTIMONIAL_PUBLIC_SELECT).toHaveProperty('consent', true)
      expect(TESTIMONIAL_PUBLIC_SELECT).toHaveProperty('quote', true)
      expect(TESTIMONIAL_PUBLIC_SELECT).toHaveProperty('name', true)
      expect(TESTIMONIAL_PUBLIC_SELECT).toHaveProperty('role', true)
    })
  })

  describe('formatServicePrice', () => {
    it('returns "Liên hệ báo giá" and NEVER displays numbers when priceMode = quote', () => {
      const formatted = formatServicePrice('quote', 2500000)
      expect(formatted).toBe(vi.detail.service.quotePrice)
      expect(formatted).toBe('Liên hệ báo giá')
      expect(/\d/.test(formatted!)).toBe(false)
    })

    it('returns "Liên hệ báo giá" when priceMode = quote even if price is null or 0', () => {
      expect(formatServicePrice('quote', null)).toBe('Liên hệ báo giá')
      expect(formatServicePrice('quote', 0)).toBe('Liên hệ báo giá')
    })

    it('formats VND currency when priceMode = fixed and price is valid number', () => {
      expect(formatServicePrice('fixed', 1500000)).toBe('1.500.000đ')
      expect(formatServicePrice('fixed', 250000)).toBe('250.000đ')
    })

    it('returns null when priceMode = fixed and price is null or undefined', () => {
      expect(formatServicePrice('fixed', null)).toBeNull()
      expect(formatServicePrice('fixed', undefined)).toBeNull()
    })
  })

  describe('decideDetailSource (Puck Page Priority)', () => {
    it('prioritizes puck page when both puck page and collection document exist', () => {
      expect(decideDetailSource(true, true)).toBe('puck')
    })

    it('returns puck when only puck page exists', () => {
      expect(decideDetailSource(true, false)).toBe('puck')
    })

    it('returns collection when only collection document exists', () => {
      expect(decideDetailSource(false, true)).toBe('collection')
    })

    it('returns not_found when neither exists', () => {
      expect(decideDetailSource(false, false)).toBe('not_found')
    })
  })

  describe('cleanStringList (Empty state filtering)', () => {
    it('extracts strings and ignores empty / whitespace items', () => {
      const items = ['Mục 1', '', '   ', 'Mục 2']
      expect(cleanStringList(items)).toEqual(['Mục 1', 'Mục 2'])
    })

    it('extracts objects with text property from Payload array fields', () => {
      const items = [
        { text: 'Bước 1: Lắng nghe' },
        { text: '' },
        { text: '   ' },
        { text: 'Bước 2: Phản hồi' },
      ]
      expect(cleanStringList(items)).toEqual(['Bước 1: Lắng nghe', 'Bước 2: Phản hồi'])
    })

    it('returns empty array for invalid input', () => {
      expect(cleanStringList(null)).toEqual([])
      expect(cleanStringList(undefined)).toEqual([])
      expect(cleanStringList([])).toEqual([])
    })
  })

  describe('toPublicTestimonial (Consent Enforcement)', () => {
    it('rejects testimonial when consent is false', () => {
      const res = toPublicTestimonial({
        id: 1,
        name: 'Học viên Test 01',
        quote: 'Dịch vụ tuyệt vời!',
        consent: false,
        _status: 'published',
      })
      expect(res).toBeNull()
    })

    it('rejects testimonial when status is draft even if consent is true', () => {
      const res = toPublicTestimonial({
        id: 2,
        name: 'Trần Thị B',
        quote: 'Rất bổ ích!',
        consent: true,
        _status: 'draft',
      })
      expect(res).toBeNull()
    })

    it('accepts testimonial when consent is true and status is published', () => {
      const res = toPublicTestimonial({
        id: 3,
        name: 'Lê Văn C',
        role: 'Quản lý Nhân sự',
        quote: 'Thay đổi tư duy tích cực.',
        consent: true,
        _status: 'published',
      })
      expect(res).not.toBeNull()
      expect(res?.name).toBe('Lê Văn C')
      expect(res?.role).toBe('Quản lý Nhân sự')
      expect(res?.quote).toBe('Thay đổi tư duy tích cực.')
      expect(res?.consent).toBe(true)
    })

    it('omits role when role is empty or missing', () => {
      const res = toPublicTestimonial({
        id: 4,
        name: 'Phạm Thị D',
        role: '   ',
        quote: 'Rất hài lòng.',
        consent: true,
        _status: 'published',
      })
      expect(res?.role).toBeNull()
    })
  })

  describe('toPublicService & toPublicProgram & toPublicPost DTO transformations', () => {
    it('transforms Service doc and filters out unconsented testimonials', () => {
      const service = toPublicService(
        {
          id: 10,
          name: 'Coaching Vững Vàng',
          slug: 'vung-vang',
          audience: 'Người đang chuyển mình',
          situations: [{ text: 'Mất định hướng' }],
          outcomes: [{ text: 'Tìm lại cân bằng' }],
          process: [{ text: 'Khám phá' }, { text: 'Thực hành' }],
          priceMode: 'quote',
          price: 3000000,
          bookingUrl: 'https://cal.com/hana/coaching',
          ctaLabel: 'Đặt phiên 1:1',
          saleStatus: 'consult',
        },
        [
          { id: 1, name: 'Khách A', quote: 'Tốt', consent: true, _status: 'published' },
          { id: 2, name: 'Khách B', quote: 'Chưa duyệt', consent: false, _status: 'published' },
        ],
      )

      expect(service.name).toBe('Coaching Vững Vàng')
      expect(service.displayPrice).toBe('Liên hệ báo giá')
      expect(service.testimonials).toHaveLength(1)
      expect(service.testimonials[0].name).toBe('Khách A')
      expect(service.bookingUrl).toBe('https://cal.com/hana/coaching')
    })

    it('sanitizes bookingUrl and blocks unsafe javascript links', () => {
      const service = toPublicService({
        id: 11,
        name: 'Test Safe',
        slug: 'test-safe',
        bookingUrl: 'javascript:alert(1)',
        saleStatus: 'consult',
      })
      expect(service.bookingUrl).toBeNull()
    })

    it('transforms Program doc correctly', () => {
      const program = toPublicProgram({
        id: 20,
        name: 'Văn hóa thấu cảm',
        slug: 'van-hoa-thau-cam',
        learnerGroup: 'Quản lý cấp trung',
        targetBehaviors: [{ text: 'Lắng nghe chủ động' }],
        deliverables: [{ text: 'Báo cáo tổng kết' }],
        caseStudies: [{ text: 'Dự án tại TechCorp' }],
        format: 'Trực tiếp tại doanh nghiệp',
        duration: '2 ngày',
        followUp: 'Hỗ trợ 30 ngày',
        measurement: 'Khảo sát 360 độ',
        ctaLabel: 'Gửi yêu cầu đào tạo',
      })

      expect(program.name).toBe('Văn hóa thấu cảm')
      expect(program.targetBehaviors).toEqual(['Lắng nghe chủ động'])
      expect(program.deliverables).toEqual(['Báo cáo tổng kết'])
      expect(program.caseStudies).toEqual(['Dự án tại TechCorp'])
      expect(program.format).toBe('Trực tiếp tại doanh nghiệp')
    })

    it('transforms Post doc and parses videoUrl', () => {
      const post = toPublicPost({
        id: 30,
        title: '3 Bước xây dựng thói quen',
        slug: '3-buoc-xay-dung-thoi-quen',
        format: 'video',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        ctaProduct: {
          id: 101,
          name: 'Habit Tracker Số',
          slug: 'habit-tracker-so',
          saleStatus: 'on_sale',
          price: 250000,
          trialDays: 21,
        },
      })

      expect(post.title).toBe('3 Bước xây dựng thói quen')
      expect(post.parsedVideo.isValid).toBe(true)
      expect(post.parsedVideo.provider).toBe('youtube')
      expect(post.parsedVideo.embedUrl).toContain('dQw4w9WgXcQ')
      expect(post.ctaProduct?.name).toBe('Habit Tracker Số')
    })
  })
})
