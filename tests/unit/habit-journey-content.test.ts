// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { Customer, HabitJourneyContent, Technique, User } from '../../src/payload-types'
import {
  getHabitJourneyContent,
  splitJourneyIntoStations,
} from '../../src/lib/habit/journey-content.server'
import { isValidExampleVideoUrl } from '../../src/collections/Techniques'

describe('HB-07: Global nội dung hành trình Habit & Video ví dụ kỹ thuật', () => {
  let payload: Payload
  let journeyContentBefore: HabitJourneyContent | null = null
  const created: { collection: CollectionSlug; id: number }[] = []

  let customerUser: Customer
  let asCustomer: unknown

  let ownerUser: User
  let editorUser: User
  let asOwner: unknown
  let asEditor: unknown

  const track = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
    created.push({ collection, id: doc.id })
    return doc
  }

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    const suffix = randomUUID().slice(0, 8)

    // Lưu bản ghi global cũ trước khi test để khôi phục ở afterAll
    journeyContentBefore = (await payload.findGlobal({
      slug: 'habitJourneyContent',
      depth: 0,
    })) as HabitJourneyContent

    // Tạo Customer
    customerUser = track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: `cust-${suffix}@example.test`,
          name: 'Học viên Test HB07',
        },
        overrideAccess: true,
      }),
    )
    asCustomer = { ...customerUser, collection: 'customers' }

    // Tạo Owner và Editor
    ownerUser = track(
      'users',
      await payload.create({
        collection: 'users',
        data: {
          email: `owner-${suffix}@example.test`,
          password: `OwnerPass-${suffix}-123`,
          role: 'owner',
        },
        overrideAccess: true,
      }),
    )
    asOwner = { ...ownerUser, collection: 'users' }

    editorUser = track(
      'users',
      await payload.create({
        collection: 'users',
        data: {
          email: `editor-${suffix}@example.test`,
          password: `EditorPass-${suffix}-123`,
          role: 'editor',
        },
        overrideAccess: true,
      }),
    )
    asEditor = { ...editorUser, collection: 'users' }
  })

  afterAll(async () => {
    // 1. Khôi phục global habitJourneyContent nguyên trạng
    if (journeyContentBefore && payload) {
      try {
        await payload.updateGlobal({
          slug: 'habitJourneyContent',
          data: {
            stations: journeyContentBefore.stations ?? [],
            quotes: journeyContentBefore.quotes ?? [],
            onePercent: journeyContentBefore.onePercent ?? {
              dailyPercent: 1,
              maxDays: 365,
              facts: [],
            },
          },
          overrideAccess: true,
        })
      } catch (err) {
        console.error('Không thể khôi phục global habitJourneyContent:', err)
      }
    }

    // 2. Dọn dẹp bản ghi test tạo
    for (const item of created.reverse()) {
      try {
        await payload.delete({
          collection: item.collection,
          id: item.id,
          overrideAccess: true,
          context: { accountDeletion: true },
        })
      } catch {
        // Bỏ qua lỗi dọn dẹp
      }
    }
  })

  describe('1. Phân quyền truy cập Global habitJourneyContent', () => {
    it('khách vãng lai và customer có thể đọc global', async () => {
      // Khách vãng lai (không đăng nhập)
      const anonRead = await payload.findGlobal({
        slug: 'habitJourneyContent',
        overrideAccess: false,
      })
      expect(anonRead).toBeDefined()

      // Customer
      const custRead = await payload.findGlobal({
        slug: 'habitJourneyContent',
        user: asCustomer as never,
        overrideAccess: false,
      })
      expect(custRead).toBeDefined()
    })

    it('khách vãng lai và customer KHÔNG được ghi global (overrideAccess: false)', async () => {
      // Khách vãng lai
      await expect(
        payload.updateGlobal({
          slug: 'habitJourneyContent',
          data: {
            stations: [{ name: 'Trạm Hacker' }],
          },
          overrideAccess: false,
        }),
      ).rejects.toThrow()

      // Customer
      await expect(
        payload.updateGlobal({
          slug: 'habitJourneyContent',
          user: asCustomer as never,
          data: {
            stations: [{ name: 'Trạm Hacker' }],
          },
          overrideAccess: false,
        }),
      ).rejects.toThrow()
    })

    it('editor và owner ghi được global (overrideAccess: false)', async () => {
      // Editor cập nhật
      const updatedByEditor = await payload.updateGlobal({
        slug: 'habitJourneyContent',
        user: asEditor as never,
        data: {
          stations: [{ name: 'Trạm Khởi Động Test Editor' }],
        },
        overrideAccess: false,
      })
      expect(updatedByEditor.stations?.[0]?.name).toBe('Trạm Khởi Động Test Editor')

      // Owner cập nhật
      const updatedByOwner = await payload.updateGlobal({
        slug: 'habitJourneyContent',
        user: asOwner as never,
        data: {
          stations: [{ name: 'Trạm Khởi Động Test Owner' }],
        },
        overrideAccess: false,
      })
      expect(updatedByOwner.stations?.[0]?.name).toBe('Trạm Khởi Động Test Owner')
    })
  })

  describe('2. Bắt buộc nguồn kiểm chứng (không được thiếu nguồn)', () => {
    it('lưu câu trích thiếu source -> lỗi validate', async () => {
      await expect(
        payload.updateGlobal({
          slug: 'habitJourneyContent',
          data: {
            quotes: [
              {
                text: 'Hành động nhỏ tạo nên khác biệt lớn',
                author: 'James Clear',
                source: '', // Thiếu nguồn
              },
            ],
          },
          overrideAccess: true,
        }),
      ).rejects.toThrow()
    })

    it('lưu số liệu dẫn chứng thiếu sourceLabel -> lỗi validate', async () => {
      await expect(
        payload.updateGlobal({
          slug: 'habitJourneyContent',
          data: {
            onePercent: {
              facts: [
                {
                  statement: 'Cải thiện 1% mỗi ngày tốt hơn 37 lần sau một năm',
                  sourceLabel: '', // Thiếu nguồn
                },
              ],
            },
          },
          overrideAccess: true,
        }),
      ).rejects.toThrow()
    })

    it('lưu câu trích và số liệu có đầy đủ nguồn -> thành công', async () => {
      const result = await payload.updateGlobal({
        slug: 'habitJourneyContent',
        data: {
          quotes: [
            {
              text: 'Chúng ta là những gì chúng ta lặp lại.',
              author: 'Will Durant',
              source: 'The Story of Philosophy (1926)',
              sourceUrl: 'https://example.test/durant-1926',
              isActive: true,
            },
          ],
          onePercent: {
            title: 'Nguyên lý cải thiện 1%',
            dailyPercent: 1,
            maxDays: 365,
            facts: [
              {
                statement: 'Cải thiện 1% mỗi ngày: 1.01^365 = 37.78 lần.',
                sourceLabel: 'Atomic Habits (James Clear, 2018)',
                sourceUrl: 'https://jamesclear.com/continuous-improvement',
              },
            ],
          },
        },
        overrideAccess: true,
      })
      expect(result.quotes?.[0]?.source).toBe('The Story of Philosophy (1926)')
      expect(result.onePercent?.facts?.[0]?.sourceLabel).toBe('Atomic Habits (James Clear, 2018)')
    })
  })

  describe('3. Validation exampleVideoUrl trong Techniques', () => {
    it('hàm thuần isValidExampleVideoUrl nhận diện đúng YouTube, Vimeo, Bunny', () => {
      // Hợp lệ: trống / null
      expect(isValidExampleVideoUrl(null)).toBe(true)
      expect(isValidExampleVideoUrl('')).toBe(true)
      expect(isValidExampleVideoUrl('   ')).toBe(true)

      // YouTube
      expect(isValidExampleVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
      expect(isValidExampleVideoUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true)
      expect(isValidExampleVideoUrl('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe(
        true,
      )

      // Vimeo
      expect(isValidExampleVideoUrl('https://vimeo.com/123456789')).toBe(true)
      expect(isValidExampleVideoUrl('https://player.vimeo.com/video/123456789')).toBe(true)

      // Bunny Stream
      expect(
        isValidExampleVideoUrl(
          'https://iframe.mediadelivery.net/embed/12345/a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        ),
      ).toBe(true)
      expect(
        isValidExampleVideoUrl(
          'https://iframe.mediadelivery.net/play/12345/a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        ),
      ).toBe(true)
      expect(
        isValidExampleVideoUrl(
          'https://video.bunnycdn.com/play/12345/a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        ),
      ).toBe(true)

      // Không hợp lệ
      expect(isValidExampleVideoUrl('https://example.com/video.mp4')).toBe(false)
      expect(isValidExampleVideoUrl('https://not-a-video-platform.test/watch')).toBe(false)
      expect(isValidExampleVideoUrl('not-a-url')).toBe(false)
    })

    it('tạo và cập nhật Technique qua Payload API với các loại URL', async () => {
      const suffix = randomUUID().slice(0, 8)

      // 1. YouTube hợp lệ
      const tech = track(
        'techniques',
        await payload.create({
          collection: 'techniques',
          data: {
            name: `Kỹ thuật Test Video ${suffix}`,
            exampleVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          },
          overrideAccess: true,
        }),
      )
      expect(tech.exampleVideoUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')

      // 2. Vimeo hợp lệ
      const updatedVimeo = await payload.update({
        collection: 'techniques',
        id: tech.id,
        data: {
          exampleVideoUrl: 'https://vimeo.com/123456789',
        },
        overrideAccess: true,
      })
      expect(updatedVimeo.exampleVideoUrl).toBe('https://vimeo.com/123456789')

      // 3. Bunny hợp lệ
      const updatedBunny = await payload.update({
        collection: 'techniques',
        id: tech.id,
        data: {
          exampleVideoUrl:
            'https://iframe.mediadelivery.net/embed/12345/a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        },
        overrideAccess: true,
      })
      expect(updatedBunny.exampleVideoUrl).toBe(
        'https://iframe.mediadelivery.net/embed/12345/a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      )

      // 4. Link lạ -> lỗi validate
      await expect(
        payload.update({
          collection: 'techniques',
          id: tech.id,
          data: {
            exampleVideoUrl: 'https://example.com/video.mp4',
          },
          overrideAccess: true,
        }),
      ).rejects.toThrow()
    })
  })

  describe('4. getHabitJourneyContent đọc và làm sạch dữ liệu server', () => {
    it('lọc dòng tắt (isActive: false) và áp dụng mặc định 1% và 365 ngày qua DB', async () => {
      await payload.updateGlobal({
        slug: 'habitJourneyContent',
        data: {
          stations: [
            {
              name: 'Trạm 1: Khởi động',
              tagline: 'Bước đi đầu tiên',
              reflectionQuestions: [{ question: 'Bạn cảm thấy thế nào hôm nay?' }],
            },
          ],
          quotes: [
            {
              text: 'Câu trích hợp lệ và kích hoạt',
              author: 'Tác giả A',
              source: 'Nguồn A',
              isActive: true,
            },
            {
              text: 'Câu trích bị tắt',
              author: 'Tác giả B',
              source: 'Nguồn B',
              isActive: false, // Bị lọc vì isActive = false
            },
          ],
          onePercent: {
            title: 'Tiêu đề 1%',
            dailyPercent: null, // Sẽ lấy mặc định 1
            maxDays: null, // Sẽ lấy mặc định 365
            facts: [
              {
                statement: 'Số liệu chuẩn',
                sourceLabel: 'Nguồn chuẩn',
              },
            ],
          },
        },
        overrideAccess: true,
      })

      const content = await getHabitJourneyContent(payload)

      // Stations
      expect(content.stations).toHaveLength(1)
      expect(content.stations[0]?.name).toBe('Trạm 1: Khởi động')
      expect(content.stations[0]?.reflectionQuestions).toHaveLength(1)
      expect(content.stations[0]?.reflectionQuestions[0]?.question).toBe(
        'Bạn cảm thấy thế nào hôm nay?',
      )

      // Quotes: chỉ còn câu kích hoạt
      expect(content.quotes).toHaveLength(1)
      expect(content.quotes[0]?.text).toBe('Câu trích hợp lệ và kích hoạt')

      // One percent: mặc định 1% và 365 ngày
      expect(content.onePercent.dailyPercent).toBe(1)
      expect(content.onePercent.maxDays).toBe(365)
      expect(content.onePercent.facts).toHaveLength(1)
      expect(content.onePercent.facts[0]?.statement).toBe('Số liệu chuẩn')
    })

    it('lọc dòng thiếu trường / rỗng khi dữ liệu trả về từ server thiếu', async () => {
      const mockPayload = {
        findGlobal: vi.fn().mockResolvedValue({
          stations: [
            {
              name: 'Trạm hợp lệ',
              reflectionQuestions: [{ question: 'Câu hỏi' }, { question: '   ' }],
            },
            { name: '   ' }, // thiếu tên
          ],
          quotes: [
            { text: 'Quote 1', author: 'Author 1', source: 'Source 1', isActive: true },
            { text: '', author: 'Author 2', source: 'Source 2', isActive: true }, // thiếu text
            { text: 'Quote 3', author: '', source: 'Source 3', isActive: true }, // thiếu author
            { text: 'Quote 4', author: 'Author 4', source: '  ', isActive: true }, // thiếu source
            { text: 'Quote 5', author: 'Author 5', source: 'Source 5', isActive: false }, // tắt
          ],
          onePercent: {
            title: 'Tiêu đề',
            dailyPercent: undefined,
            maxDays: undefined,
            facts: [
              { statement: 'Fact 1', sourceLabel: 'Source 1' },
              { statement: '  ', sourceLabel: 'Source 2' }, // thiếu statement
              { statement: 'Fact 3', sourceLabel: '' }, // thiếu sourceLabel
            ],
          },
        }),
      } as unknown as Payload

      const content = await getHabitJourneyContent(mockPayload)

      expect(content.stations).toHaveLength(1)
      expect(content.stations[0]?.name).toBe('Trạm hợp lệ')
      expect(content.stations[0]?.reflectionQuestions).toHaveLength(1)
      expect(content.stations[0]?.reflectionQuestions[0]?.question).toBe('Câu hỏi')

      expect(content.quotes).toHaveLength(1)
      expect(content.quotes[0]?.text).toBe('Quote 1')

      expect(content.onePercent.dailyPercent).toBe(1)
      expect(content.onePercent.maxDays).toBe(365)
      expect(content.onePercent.facts).toHaveLength(1)
      expect(content.onePercent.facts[0]?.statement).toBe('Fact 1')
    })

    it('global trống -> trả về cấu trúc rỗng an toàn', async () => {
      await payload.updateGlobal({
        slug: 'habitJourneyContent',
        data: {
          stations: [],
          quotes: [],
          onePercent: {
            title: '',
            dailyPercent: null,
            maxDays: null,
            facts: [],
          },
        },
        overrideAccess: true,
      })

      const content = await getHabitJourneyContent(payload)
      expect(content.stations).toEqual([])
      expect(content.quotes).toEqual([])
      expect(content.onePercent.dailyPercent).toBe(1)
      expect(content.onePercent.maxDays).toBe(365)
      expect(content.onePercent.facts).toEqual([])
    })
  })

  describe('5. splitJourneyIntoStations chia đều ngày cho các trạm', () => {
    it('28 ngày / 4 trạm -> 7-7-7-7', () => {
      const result = splitJourneyIntoStations(28, 4)
      expect(result).toEqual([
        { index: 0, fromDay: 1, toDay: 7 },
        { index: 1, fromDay: 8, toDay: 14 },
        { index: 2, fromDay: 15, toDay: 21 },
        { index: 3, fromDay: 22, toDay: 28 },
      ])
    })

    it('30 ngày / 4 trạm -> 8-8-7-7 (phần dư dồn trạm đầu)', () => {
      const result = splitJourneyIntoStations(30, 4)
      expect(result).toEqual([
        { index: 0, fromDay: 1, toDay: 8 },
        { index: 1, fromDay: 9, toDay: 16 },
        { index: 2, fromDay: 17, toDay: 23 },
        { index: 3, fromDay: 24, toDay: 30 },
      ])
    })

    it('21 ngày / 4 trạm -> 6-5-5-5 (phần dư dồn trạm đầu)', () => {
      const result = splitJourneyIntoStations(21, 4)
      expect(result).toEqual([
        { index: 0, fromDay: 1, toDay: 6 },
        { index: 1, fromDay: 7, toDay: 11 },
        { index: 2, fromDay: 12, toDay: 16 },
        { index: 3, fromDay: 17, toDay: 21 },
      ])
    })

    it('7 ngày / 6 trạm -> 2-1-1-1-1-1', () => {
      const result = splitJourneyIntoStations(7, 6)
      expect(result).toEqual([
        { index: 0, fromDay: 1, toDay: 2 },
        { index: 1, fromDay: 3, toDay: 3 },
        { index: 2, fromDay: 4, toDay: 4 },
        { index: 3, fromDay: 5, toDay: 5 },
        { index: 4, fromDay: 6, toDay: 6 },
        { index: 5, fromDay: 7, toDay: 7 },
      ])
    })

    it('3 ngày / 4 trạm -> bớt trạm thành 3 trạm (1-1-1)', () => {
      const result = splitJourneyIntoStations(3, 4)
      expect(result).toEqual([
        { index: 0, fromDay: 1, toDay: 1 },
        { index: 1, fromDay: 2, toDay: 2 },
        { index: 2, fromDay: 3, toDay: 3 },
      ])
    })

    it('tham số <= 0 -> trả về mảng rỗng', () => {
      expect(splitJourneyIntoStations(0, 4)).toEqual([])
      expect(splitJourneyIntoStations(28, 0)).toEqual([])
      expect(splitJourneyIntoStations(-5, 4)).toEqual([])
    })
  })
})
