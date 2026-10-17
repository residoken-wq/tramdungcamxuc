import 'server-only'

import {
  Forbidden,
  type CollectionSlug,
  type Payload,
  type PayloadRequest,
  type Where,
} from 'payload'
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
    href: '/admin/tao-san-pham',
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
    href: '/admin/len-lich-workshop',
  },
  {
    id: 'createLesson',
    title: vi.cms.dashboard.quickActions.createLesson.title,
    description: vi.cms.dashboard.quickActions.createLesson.description,
    href: '/admin/them-bai-hoc',
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

  // null = the user may not read this collection (Forbidden) → hide the card.
  // Any other error is a real failure → show the error state instead of a misleading "0".
  async function countOrNull(collection: CollectionSlug, where: Where): Promise<number | null> {
    try {
      const res = await payload.count({ collection, where, user, overrideAccess: false })
      return res.totalDocs
    } catch (err) {
      if (err instanceof Forbidden) return null
      hasError = true
      console.error(`[cms-dashboard] count ${collection} failed:`, err)
      return null
    }
  }

  // 1. Đơn pending (theo quyền đọc đơn hiện có)
  const pendingOrdersCount = await countOrNull('orders', { paymentStatus: { equals: 'pending' } })
  if (pendingOrdersCount !== null) {
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

  // 2. Sự kiện amount_mismatch / order_cancelled trong 7 ngày qua (chỉ owner).
  // paymentEvents không có cờ "đã xử lý" (chỉ đọc, append-only) → giới hạn 7 ngày để số tự về 0.
  if (isOwner) {
    const sinceIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const paymentIssuesCount = await countOrNull('paymentEvents', {
      or: [
        {
          and: [
            { result: { equals: 'amount_mismatch' } },
            { receivedAt: { greater_than_equal: sinceIso } },
          ],
        },
        {
          and: [
            { result: { equals: 'order_cancelled' } },
            { receivedAt: { greater_than_equal: sinceIso } },
          ],
        },
      ],
    })
    if (paymentIssuesCount !== null) {
      const since = encodeURIComponent(sinceIso)
      todos.push({
        id: 'paymentIssues',
        title: vi.cms.dashboard.todos.paymentIssues.title,
        description: vi.cms.dashboard.todos.paymentIssues.description,
        count: paymentIssuesCount,
        href:
          '/admin/collections/paymentEvents?' +
          `where[or][0][and][0][result][equals]=amount_mismatch&where[or][0][and][1][receivedAt][greater_than_equal]=${since}` +
          `&where[or][1][and][0][result][equals]=order_cancelled&where[or][1][and][1][receivedAt][greater_than_equal]=${since}`,
        visible: true,
        badgeColor: 'accent',
      })
    }
  }

  // 3. Lead mới (followUpStatus = 'new')
  const newLeadsCount = await countOrNull('leads', { followUpStatus: { equals: 'new' } })
  if (newLeadsCount !== null) {
    todos.push({
      id: 'newLeads',
      title: vi.cms.dashboard.todos.newLeads.title,
      description: vi.cms.dashboard.todos.newLeads.description,
      count: newLeadsCount,
      href: '/admin/collections/leads?where[followUpStatus][equals]=new',
      visible: true,
      badgeColor: 'info',
    })
  }

  // 4. Khách có yêu cầu xóa tài khoản (deletionRequestedAt exists)
  const deletionCount = await countOrNull('customers', { deletionRequestedAt: { exists: true } })
  if (deletionCount !== null) {
    todos.push({
      id: 'deletionRequests',
      title: vi.cms.dashboard.todos.deletionRequests.title,
      description: vi.cms.dashboard.todos.deletionRequests.description,
      count: deletionCount,
      href: '/admin/collections/customers?where[deletionRequestedAt][exists]=true',
      visible: true,
      badgeColor: 'warning',
    })
  }

  // 5. Workshop bắt đầu trong 7 ngày tới
  const nowIso = new Date().toISOString()
  const in7DaysIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const upcomingWorkshopsCount = await countOrNull('workshops', {
    and: [
      { startsAt: { greater_than_equal: nowIso } },
      { startsAt: { less_than_equal: in7DaysIso } },
    ],
  })
  if (upcomingWorkshopsCount !== null) {
    todos.push({
      id: 'upcomingWorkshops',
      title: vi.cms.dashboard.todos.upcomingWorkshops.title,
      description: vi.cms.dashboard.todos.upcomingWorkshops.description,
      count: upcomingWorkshopsCount,
      href: `/admin/collections/workshops?where[and][0][startsAt][greater_than_equal]=${encodeURIComponent(nowIso)}&where[and][1][startsAt][less_than_equal]=${encodeURIComponent(in7DaysIso)}`,
      visible: true,
      badgeColor: 'info',
    })
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
    errorMessage: hasError ? vi.cms.dashboard.errorMessage : undefined,
  }
}
