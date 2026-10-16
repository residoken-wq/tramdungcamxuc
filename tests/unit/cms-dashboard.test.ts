// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
import { getPayload, type CollectionSlug, type Payload, type PayloadRequest } from 'payload'
import config from '../../src/payload.config'
import { getDashboardStats } from '../../src/lib/cms/dashboard.server'

type AdminUser = NonNullable<PayloadRequest['user']>

describe('CMS Today Dashboard - getDashboardStats (CM-02)', () => {
  let payload: Payload
  let owner: AdminUser
  let editor: AdminUser
  const created: { collection: CollectionSlug; id: number }[] = []

  const track = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
    created.push({ collection, id: doc.id })
    return doc
  }

  const asUser = (doc: { id: number }) => ({ ...doc, collection: 'users' }) as unknown as AdminUser

  beforeAll(async () => {
    payload = await getPayload({ config })

    const makeUser = async (role: 'owner' | 'editor') => {
      const u = await payload.create({
        collection: 'users',
        data: {
          email: `cm02-${role}-${randomUUID()}@example.test`,
          password: randomUUID(),
          role,
        },
        overrideAccess: true,
      })
      track('users', u)
      if (role === 'owner' && u.role !== 'owner') {
        const updated = await payload.update({
          collection: 'users',
          id: u.id,
          data: { role: 'owner' },
          overrideAccess: true,
        })
        return asUser(updated)
      }
      return asUser(u)
    }

    owner = await makeUser('owner')
    editor = await makeUser('editor')
  })

  afterAll(async () => {
    for (const item of created.reverse()) {
      try {
        await payload.delete({
          collection: item.collection,
          id: item.id,
          overrideAccess: true,
        })
      } catch {
        // Ignore cleanup errors
      }
    }
  })

  it('1. Owner có quyền xem thẻ sự kiện thanh toán (paymentIssues); Editor không thấy thẻ này', async () => {
    const ownerStats = await getDashboardStats(payload, owner)
    const editorStats = await getDashboardStats(payload, editor)

    expect(ownerStats.userRole).toBe('owner')
    expect(editorStats.userRole).toBe('editor')

    const ownerHasPaymentIssues = ownerStats.todos.some((t) => t.id === 'paymentIssues')
    const editorHasPaymentIssues = editorStats.todos.some((t) => t.id === 'paymentIssues')

    expect(ownerHasPaymentIssues).toBe(true)
    expect(editorHasPaymentIssues).toBe(false)
  })

  it('2. Tuyệt đối không trả về thông tin cá nhân (PII) trên dashboard', async () => {
    const stats = await getDashboardStats(payload, owner)

    // Duyệt qua toàn bộ object stats để đảm bảo không có trường nhạy cảm
    const jsonString = JSON.stringify(stats).toLowerCase()
    expect(jsonString).not.toContain('@example.test')
    expect(jsonString).not.toContain('phonenumber')
    expect(jsonString).not.toContain('customername')

    // Mỗi todo item chỉ có id, title, description, count, href, visible
    for (const todo of stats.todos) {
      expect(typeof todo.count).toBe('number')
      expect(typeof todo.title).toBe('string')
      expect(typeof todo.href).toBe('string')
      expect(todo).not.toHaveProperty('items')
      expect(todo).not.toHaveProperty('customer')
      expect(todo).not.toHaveProperty('email')
      expect(todo).not.toHaveProperty('phone')
      expect(todo).not.toHaveProperty('amount')
    }
  })

  it('3. Đếm đúng số đơn pending và lead mới', async () => {
    const initialStats = await getDashboardStats(payload, owner)
    const initialPending = initialStats.todos.find((t) => t.id === 'pendingOrders')?.count || 0
    const initialLeads = initialStats.todos.find((t) => t.id === 'newLeads')?.count || 0

    // Tạo 1 customer và 1 product để tạo đơn
    const cust = track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: { email: `cust-${randomUUID()}@example.test`, name: 'Học viên test' },
        overrideAccess: true,
      }),
    )

    const prod = track(
      'products',
      await payload.create({
        collection: 'products',
        data: {
          name: `Test Product ${randomUUID()}`,
          slug: `prod-${randomUUID()}`,
          web: 'habit',
          type: 'digital_tool',
          price: 250000,
          saleStatus: 'on_sale',
          _status: 'published',
        },
        overrideAccess: true,
      }),
    )

    // Tạo 1 đơn pending
    track(
      'orders',
      await payload.create({
        collection: 'orders',
        data: {
          customer: cust.id,
          items: [{ product: prod.id, price: 250000 }],
          total: 250000,
          paymentStatus: 'pending',
        },
        overrideAccess: true,
      }),
    )

    // Tạo 1 lead followUpStatus = 'new'
    track(
      'leads',
      await payload.create({
        collection: 'leads',
        data: {
          email: `lead-${randomUUID()}@example.test`,
          name: 'Lead Test',
          followUpStatus: 'new',
        },
        overrideAccess: true,
      }),
    )

    const updatedStats = await getDashboardStats(payload, owner)
    const updatedPending = updatedStats.todos.find((t) => t.id === 'pendingOrders')?.count || 0
    const updatedLeads = updatedStats.todos.find((t) => t.id === 'newLeads')?.count || 0

    expect(updatedPending).toBe(initialPending + 1)
    expect(updatedLeads).toBe(initialLeads + 1)
  })

  it('4. Đếm đúng khách yêu cầu xóa tài khoản (deletionRequestedAt)', async () => {
    const initialStats = await getDashboardStats(payload, owner)
    const initialDeletion = initialStats.todos.find((t) => t.id === 'deletionRequests')?.count || 0

    // Tạo khách có deletionRequestedAt
    track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: `delete-req-${randomUUID()}@example.test`,
          name: 'Khách yêu cầu xóa',
          deletionRequestedAt: new Date().toISOString(),
        },
        overrideAccess: true,
      }),
    )

    const updatedStats = await getDashboardStats(payload, owner)
    const updatedDeletion = updatedStats.todos.find((t) => t.id === 'deletionRequests')?.count || 0

    expect(updatedDeletion).toBe(initialDeletion + 1)
  })

  it('5. Đếm đúng workshop trong 7 ngày tới (không đếm workshop sau 7 ngày)', async () => {
    const initialStats = await getDashboardStats(payload, owner)
    const initialWorkshops =
      initialStats.todos.find((t) => t.id === 'upcomingWorkshops')?.count || 0

    const now = new Date()
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000)

    // Tạo workshop trong 3 ngày tới
    track(
      'workshops',
      await payload.create({
        collection: 'workshops',
        data: {
          title: `Workshop sắp tới ${randomUUID()}`,
          startsAt: in3Days.toISOString(),
          endsAt: new Date(in3Days.getTime() + 2 * 3600 * 1000).toISOString(),
          _status: 'published',
        },
        overrideAccess: true,
      }),
    )

    // Tạo workshop sau 15 ngày (ngoài cửa sổ 7 ngày)
    track(
      'workshops',
      await payload.create({
        collection: 'workshops',
        data: {
          title: `Workshop xa ${randomUUID()}`,
          startsAt: in15Days.toISOString(),
          endsAt: new Date(in15Days.getTime() + 2 * 3600 * 1000).toISOString(),
          _status: 'published',
        },
        overrideAccess: true,
      }),
    )

    const updatedStats = await getDashboardStats(payload, owner)
    const updatedWorkshops =
      updatedStats.todos.find((t) => t.id === 'upcomingWorkshops')?.count || 0

    expect(updatedWorkshops).toBe(initialWorkshops + 1)
  })

  it('6. Có đầy đủ 5 liên kết tạo nhanh và 5 liên kết hướng dẫn', async () => {
    const stats = await getDashboardStats(payload, owner)

    expect(stats.quickActions.length).toBe(5)
    expect(stats.quickActions.map((a) => a.id)).toEqual([
      'createProduct',
      'createPage',
      'createTestimonial',
      'createWorkshop',
      'createLesson',
    ])

    expect(stats.guides.length).toBe(5)
    expect(stats.guides.map((g) => g.id)).toEqual([
      'products',
      'puck',
      'payments',
      'leads',
      'deletion',
    ])
  })
})
