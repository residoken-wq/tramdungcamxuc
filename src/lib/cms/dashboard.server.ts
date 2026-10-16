import 'server-only'

import type { Payload, PayloadRequest } from 'payload'
import { isAdminUser, isOwnerUser } from '../auth/access'
import { vi } from '../i18n/vi'

export type DashboardTodoId =
  'pendingOrders' | 'paymentIssues' | 'newLeads' | 'deletionRequests' | 'upcomingWorkshops'

export interface DashboardTodoItem {
  id: DashboardTodoId
  title: string
  description: string
  count: number
  href: string
  visible: boolean
  badgeColor?: 'accent' | 'warning' | 'info'
}

export interface DashboardQuickActionItem {
  id: string
  title: string
  description: string
  href: string
}

export interface DashboardGuideItem {
  id: string
  title: string
  description: string
  href: string
}

export interface DashboardStats {
  todos: DashboardTodoItem[]
  quickActions: DashboardQuickActionItem[]
  guides: DashboardGuideItem[]
  totalActionableCount: number
  userRole: 'owner' | 'editor' | 'unknown'
  hasError: boolean
  errorMessage?: string
}

export const CMS_DASHBOARD_QUICK_ACTIONS: DashboardQuickActionItem[] = [
  {
    id: 'createProduct',
    title: vi.cms.dashboard.quickActions.createProduct.title,
    description: vi.cms.dashboard.quickActions.createProduct.description,
    // TODO(CM-04): Chuyển hướng sang /admin/tao-san-pham khi wizard CM-04 hoàn thành.
    href: '/admin/collections/products/create',
  },
  {
    id: 'createPage',
    title: vi.cms.dashboard.quickActions.createPage.title,
    description: vi.cms.dashboard.quickActions.createPage.description,
    href: '/admin/collections/pages',
  },
  {
    id: 'createTestimonial',
    title: vi.cms.dashboard.quickActions.createTestimonial.title,
    description: vi.cms.dashboard.quickActions.createTestimonial.description,
    href: '/admin/collections/testimonials/create',
  },
  {
    id: 'createWorkshop',
    title: vi.cms.dashboard.quickActions.createWorkshop.title,
    description: vi.cms.dashboard.quickActions.createWorkshop.description,
    href: '/admin/collections/workshops/create',
  },
  {
    id: 'createLesson',
    title: vi.cms.dashboard.quickActions.createLesson.title,
    description: vi.cms.dashboard.quickActions.createLesson.description,
    href: '/admin/collections/lessons/create',
  },
]

export const CMS_DASHBOARD_GUIDES: DashboardGuideItem[] = [
  {
    id: 'products',
    title: vi.cms.dashboard.guides.products.title,
    description: vi.cms.dashboard.guides.products.description,
    href: 'https://github.com/residoken-wq/tramdungcamxuc/blob/main/docs/HUONG_DAN_CMS.md#3-qu%E1%BA%A3n-l%C3%BD-s%E1%BA%A3n-ph%E1%BA%A9m-gi%C3%A1-b%C3%A1n-v%C3%A0-t%C3%A0i-nguy%C3%AAn',
  },
  {
    id: 'puck',
    title: vi.cms.dashboard.guides.puck.title,
    description: vi.cms.dashboard.guides.puck.description,
    href: 'https://github.com/residoken-wq/tramdungcamxuc/blob/main/docs/HUONG_DAN_CMS.md#5-d%E1%BB%B1ng-trang-tr%E1%BB%B1c-quan-b%E1%BA%B1ng-c%C3%B4ng-c%E1%BB%A5-k%C3%A9o-th%E1%BA%A3-puck-editor',
  },
  {
    id: 'payments',
    title: vi.cms.dashboard.guides.payments.title,
    description: vi.cms.dashboard.guides.payments.description,
    href: 'https://github.com/residoken-wq/tramdungcamxuc/blob/main/docs/HUONG_DAN_CMS.md#16-kh%C3%A1ch-h%C3%A0ng-t%E1%BB%B1-xem-%C4%91%C6%A1n-h%C3%A0ng-v%C3%A0-link-thanh-to%C3%A1n-t%E1%BA%A1i-tai-khoan',
  },
  {
    id: 'leads',
    title: vi.cms.dashboard.guides.leads.title,
    description: vi.cms.dashboard.guides.leads.description,
    href: 'https://github.com/residoken-wq/tramdungcamxuc/blob/main/docs/HUONG_DAN_CMS.md#8-qu%E1%BA%A3n-l%C3%BD-kh%C3%A1ch-ti%E1%BB%81m-n%C4%83ng-leads-v%C3%A0-xu%E1%BA%A5t-file-csv',
  },
  {
    id: 'deletion',
    title: vi.cms.dashboard.guides.deletion.title,
    description: vi.cms.dashboard.guides.deletion.description,
    href: 'https://github.com/residoken-wq/tramdungcamxuc/blob/main/docs/HUONG_DAN_CMS.md#17-kh%C3%A1ch-h%C3%A0ng-y%C3%AAu-c%E1%BA%A7u-x%C3%B3a-t%C3%A0i-kho%E1%BA%A3n--hana-x%C3%B3a-d%E1%BB%AF-li%E1%BB%87u-kh%C3%A1ch',
  },
]

// REVIEW-REQUIRED: CM-02: Hàm đếm số liệu dashboard chạy trên server.
// - Truyền req.user vào Local API và đặt overrideAccess: false để tuân thủ nghiêm ngặt Access Control.
// - Người dùng chỉ thấy số lượng của những mục họ có quyền đọc (owner thấy đối soát thanh toán; editor không thấy).
// - Nghiêm cấm trả về bất kỳ thông tin nhận dạng cá nhân (PII) nào: không email, không họ tên, không số tiền chi tiết.
export async function getDashboardStats(
  payload: Payload,
  user?: PayloadRequest['user'],
): Promise<DashboardStats> {
  const safeUser = user ?? null
  const isOwner = isOwnerUser(safeUser)
  const isEditor = isAdminUser(safeUser) && !isOwner
  const userRole: 'owner' | 'editor' | 'unknown' = isOwner
    ? 'owner'
    : isEditor
      ? 'editor'
      : 'unknown'

  const todos: DashboardTodoItem[] = []
  let hasError = false
  let errorMessage: string | undefined

  try {
    // 1. Đơn pending
    // Kiểm tra quyền đọc đơn hàng thông qua Access Control hiện có
    let pendingOrdersCount = 0
    let canReadOrders = false
    try {
      const ordersRes = await payload.count({
        collection: 'orders',
        where: {
          paymentStatus: { equals: 'pending' },
        },
        user,
        overrideAccess: false,
      })
      pendingOrdersCount = ordersRes.totalDocs
      canReadOrders = true
    } catch {
      canReadOrders = false
    }

    if (canReadOrders) {
      todos.push({
        id: 'pendingOrders',
        title: vi.cms.dashboard.todos.pendingOrders.title,
        description: vi.cms.dashboard.todos.pendingOrders.description,
        count: pendingOrdersCount,
        href: '/admin/collections/orders?where[paymentStatus][equals]=pending',
        visible: true,
        badgeColor: 'warning',
      })
    }

    // 2. Sự kiện thanh toán amount_mismatch / order_cancelled chưa xử lý (chỉ owner)
    if (isOwner) {
      let paymentIssuesCount = 0
      try {
        const eventsRes = await payload.count({
          collection: 'paymentEvents',
          where: {
            or: [
              { result: { equals: 'amount_mismatch' } },
              { result: { equals: 'order_cancelled' } },
            ],
          },
          user,
          overrideAccess: false,
        })
        paymentIssuesCount = eventsRes.totalDocs
      } catch {
        paymentIssuesCount = 0
      }

      todos.push({
        id: 'paymentIssues',
        title: vi.cms.dashboard.todos.paymentIssues.title,
        description: vi.cms.dashboard.todos.paymentIssues.description,
        count: paymentIssuesCount,
        href: '/admin/collections/paymentEvents?where[or][0][result][equals]=amount_mismatch&where[or][1][result][equals]=order_cancelled',
        visible: true,
        badgeColor: 'accent',
      })
    }

    // 3. Lead mới (followUpStatus = 'new')
    let newLeadsCount = 0
    try {
      const leadsRes = await payload.count({
        collection: 'leads',
        where: {
          followUpStatus: { equals: 'new' },
        },
        user,
        overrideAccess: false,
      })
      newLeadsCount = leadsRes.totalDocs
      todos.push({
        id: 'newLeads',
        title: vi.cms.dashboard.todos.newLeads.title,
        description: vi.cms.dashboard.todos.newLeads.description,
        count: newLeadsCount,
        href: '/admin/collections/leads?where[followUpStatus][equals]=new',
        visible: true,
        badgeColor: 'info',
      })
    } catch {
      // User without read permission on leads
    }

    // 4. Khách có yêu cầu xóa tài khoản (deletionRequestedAt exists)
    let deletionCount = 0
    try {
      const deletionRes = await payload.count({
        collection: 'customers',
        where: {
          deletionRequestedAt: { exists: true },
        },
        user,
        overrideAccess: false,
      })
      deletionCount = deletionRes.totalDocs
      todos.push({
        id: 'deletionRequests',
        title: vi.cms.dashboard.todos.deletionRequests.title,
        description: vi.cms.dashboard.todos.deletionRequests.description,
        count: deletionCount,
        href: '/admin/collections/customers?where[deletionRequestedAt][exists]=true',
        visible: true,
        badgeColor: 'warning',
      })
    } catch {
      // User without read permission on customers
    }

    // 5. Workshop bắt đầu trong 7 ngày tới
    let upcomingWorkshopsCount = 0
    try {
      const now = new Date()
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const nowIso = now.toISOString()
      const in7DaysIso = in7Days.toISOString()

      const workshopsRes = await payload.count({
        collection: 'workshops',
        where: {
          and: [
            { startsAt: { greater_than_equal: nowIso } },
            { startsAt: { less_than_equal: in7DaysIso } },
          ],
        },
        user,
        overrideAccess: false,
      })
      upcomingWorkshopsCount = workshopsRes.totalDocs
      todos.push({
        id: 'upcomingWorkshops',
        title: vi.cms.dashboard.todos.upcomingWorkshops.title,
        description: vi.cms.dashboard.todos.upcomingWorkshops.description,
        count: upcomingWorkshopsCount,
        href: `/admin/collections/workshops?where[and][0][startsAt][greater_than_equal]=${encodeURIComponent(nowIso)}&where[and][1][startsAt][less_than_equal]=${encodeURIComponent(in7DaysIso)}`,
        visible: true,
        badgeColor: 'info',
      })
    } catch {
      // User without read permission on workshops
    }
  } catch (err) {
    hasError = true
    errorMessage = err instanceof Error ? err.message : vi.cms.dashboard.errorMessage
  }

  const visibleTodos = todos.filter((t) => t.visible)
  const totalActionableCount = visibleTodos.reduce((sum, item) => sum + item.count, 0)

  return {
    todos: visibleTodos,
    quickActions: CMS_DASHBOARD_QUICK_ACTIONS,
    guides: CMS_DASHBOARD_GUIDES,
    totalActionableCount,
    userRole,
    hasError,
    errorMessage,
  }
}
