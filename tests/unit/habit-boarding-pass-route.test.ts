// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { hashRateLimitKey } from '@/lib/forms/ratelimit.server'
import { POST } from '@/app/(site)/habit/boarding-pass/anh/[format]/route'

describe('Habit Boarding Pass Image Route (HB-10)', () => {
  let payload: Payload
  const testIp = '198.51.100.77'
  let publishedTechId: number
  let draftTechId: number

  beforeAll(async () => {
    payload = await getPayload({ config })

    // Tạo 1 kỹ thuật published và 1 kỹ thuật draft để test
    const publishedDoc = await payload.create({
      collection: 'techniques',
      data: {
        name: 'Đặt sách trên gối [TEST]',
        stage: 'cue',
        _status: 'published',
      },
      overrideAccess: true,
    })
    publishedTechId = publishedDoc.id

    const draftDoc = await payload.create({
      collection: 'techniques',
      data: {
        name: 'Kỹ thuật chưa duyệt [TEST]',
        stage: 'cue',
        _status: 'draft',
      },
      overrideAccess: true,
    })
    draftTechId = draftDoc.id
  })

  afterAll(async () => {
    // Dọn dẹp dữ liệu test
    try {
      if (publishedTechId) {
        await payload.delete({
          collection: 'techniques',
          id: publishedTechId,
          overrideAccess: true,
        })
      }
      if (draftTechId) {
        await payload.delete({
          collection: 'techniques',
          id: draftTechId,
          overrideAccess: true,
        })
      }

      // Xóa rate limit hits của testIp
      const testKey = hashRateLimitKey('ip', 'boarding-pass', testIp)
      await payload.delete({
        collection: 'rateLimitHits',
        where: { key: { equals: testKey } },
        overrideAccess: true,
      })
    } catch {
      // noop
    }
  })

  it('trả về 404 nếu format lạ không phải 4x5 hay 9x16', async () => {
    const req = new Request('http://localhost/habit/boarding-pass/anh/square', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identityStatement: 'Test' }),
    })

    await expect(POST(req, { params: Promise.resolve({ format: 'square' }) })).rejects.toThrow()
  })

  it('trả về 400 kèm thông báo tiếng Việt khi body sai hoặc thiếu câu định danh', async () => {
    const req = new Request('http://localhost/habit/boarding-pass/anh/4x5', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '198.51.100.80',
      },
      body: JSON.stringify({
        // Thiếu identityStatement
        anchorHabit: 'Thói quen neo',
      }),
    })

    const res = await POST(req, { params: Promise.resolve({ format: '4x5' }) })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBeDefined()
    expect(typeof json.error).toBe('string')
  })

  it('trả về 200 + image/png cho định dạng 4x5 và 9x16 với dữ liệu hợp lệ', async () => {
    const validBody = {
      identityStatement: 'Tôi sẽ đọc sách 10 trang mỗi ngày để mở mang tri thức',
      anchorHabit: 'Uống cà phê sáng',
      twoMinuteAction: 'Mở trang sách đầu tiên',
      rhythmDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
      techniqueIds: [publishedTechId, draftTechId, 999999], // kỹ thuật draft và ID lạ sẽ bị bỏ qua
    }

    // Test 4x5
    const req45 = new Request('http://localhost/habit/boarding-pass/anh/4x5', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '198.51.100.81',
      },
      body: JSON.stringify(validBody),
    })

    const res45 = await POST(req45, { params: Promise.resolve({ format: '4x5' }) })
    expect(res45.status).toBe(200)
    expect(res45.headers.get('content-type')).toContain('image/png')
    expect(res45.headers.get('cache-control')).toBe('no-store')
    expect(res45.headers.get('content-disposition')).toBe(
      'attachment; filename="tdcx-boarding-pass-4x5.png"',
    )

    // Test 9x16
    const req916 = new Request('http://localhost/habit/boarding-pass/anh/9x16', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '198.51.100.82',
      },
      body: JSON.stringify(validBody),
    })

    const res916 = await POST(req916, { params: Promise.resolve({ format: '9x16' }) })
    expect(res916.status).toBe(200)
    expect(res916.headers.get('content-type')).toContain('image/png')
    expect(res916.headers.get('content-disposition')).toBe(
      'attachment; filename="tdcx-boarding-pass-9x16.png"',
    )
  })

  it('trả về 429 khi vượt quá rate limit theo IP', async () => {
    const rateLimitIp = testIp
    const body = JSON.stringify({
      identityStatement: 'Mục tiêu kiểm tra rate limit',
    })

    // Gửi 20 requests liên tiếp với cùng test IP (ngưỡng maxHits là 20)
    for (let i = 0; i < 20; i++) {
      const req = new Request('http://localhost/habit/boarding-pass/anh/4x5', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': rateLimitIp,
        },
        body,
      })
      const res = await POST(req, { params: Promise.resolve({ format: '4x5' }) })
      expect(res.status).toBe(200)
    }

    // Lần thứ 21 phải bị chặn 429
    const reqBlocked = new Request('http://localhost/habit/boarding-pass/anh/4x5', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': rateLimitIp,
      },
      body,
    })
    const resBlocked = await POST(reqBlocked, { params: Promise.resolve({ format: '4x5' }) })
    expect(resBlocked.status).toBe(429)
    const jsonBlocked = await resBlocked.json()
    expect(jsonBlocked.error).toBeDefined()
  })
})
