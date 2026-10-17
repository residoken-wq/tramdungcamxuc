import React from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Product } from '@/payload-types'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { logoutAction } from '@/lib/auth/actions'
import { getAccess } from '@/lib/entitlements'
import { getEligibleWorkshops } from '@/lib/workshops/eligible.server'
import { vi } from '@/lib/i18n/vi'
import { getToolUrl } from '@/lib/products'
import { Button } from '@/components/ui/Button'
import { WorkshopSchedule } from '@/components/site/account/WorkshopSchedule'
import { AccountDeletionRequest } from '@/components/account/AccountDeletionRequest'
import { getCustomerOrders } from '@/lib/account/orders.server'
import { MyOrders } from '@/components/account/MyOrders'
import { getCustomerSavedCards } from '@/lib/eq/saved.server'
import { SavedCards } from '@/components/account/SavedCards'
import { ReminderEmailToggle } from '@/components/account/ReminderEmailToggle'

export const metadata: Metadata = {
  title: 'Tài khoản của tôi | Trạm Dừng Cảm Xúc',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AccountPage() {
  const customer = await getCurrentCustomer()
  if (!customer) {
    redirect('/tai-khoan/dang-nhap?next=/tai-khoan')
  }

  const payload = await getPayload({ config: await config })

  // Đọc danh sách quyền truy cập (entitlements) của riêng khách hàng hiện tại
  const entitlementsRes = await payload.find({
    collection: 'entitlements',
    where: { customer: { equals: customer.id } },
    depth: 1,
    limit: 100,
    overrideAccess: true,
  })

  // Thu thập các sản phẩm duy nhất được cấp quyền
  const productMap = new Map<number, Product>()
  for (const ent of entitlementsRes.docs) {
    const p = ent.product
    if (p && typeof p === 'object' && p.id) {
      if (!productMap.has(p.id)) {
        productMap.set(p.id, p as Product)
      }
    } else if (typeof p === 'number' && !productMap.has(p)) {
      try {
        const fetchedProduct = (await payload.findByID({
          collection: 'products',
          id: p,
          depth: 1,
          overrideAccess: true,
        })) as Product
        if (fetchedProduct) {
          productMap.set(p, fetchedProduct)
        }
      } catch {
        // bỏ qua nếu không tìm thấy
      }
    }
  }

  // Đánh giá quyền truy cập thời gian thực cho từng sản phẩm qua getAccess
  const coursesWithAccess = await Promise.all(
    Array.from(productMap.values()).map(async (product) => {
      const access = await getAccess(customer.id, product.id, { payload })
      const toolUrl = getToolUrl(product)
      const buyUrl = `/thanh-toan?san-pham=${encodeURIComponent(product.slug)}`

      return {
        product,
        access,
        toolUrl,
        buyUrl,
      }
    }),
  )

  const userCourses = coursesWithAccess.filter((item) => item.access.status !== 'none')

  const displayName = customer.name?.trim() || customer.email
  const [eligibleWorkshops, ordersResult, savedCardsResult] = await Promise.all([
    getEligibleWorkshops(customer.id),
    getCustomerOrders(customer.id)
      .then((orders) => ({ orders, loadError: false }))
      .catch((err) => {
        console.error('[Account] Failed to load customer orders:', err)
        return { orders: [], loadError: true }
      }),
    getCustomerSavedCards(customer.id)
      .then((savedCards) => ({ savedCards, loadError: false }))
      .catch((err) => {
        console.error('[Account] Failed to load customer saved cards:', err)
        return { savedCards: [], loadError: true }
      }),
  ])

  return (
    <div className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      {/* Header with Greeting & Logout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-deep-navy/10">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-bright-magenta mb-1">
            {vi.auth.accountHeading}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-deep-navy">
            {vi.auth.welcomeCustomer(displayName)}
          </h1>
          <p className="font-quote italic text-sm text-deep-navy/70 mt-1">{customer.email}</p>
        </div>

        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="sm" className="w-full sm:w-auto">
            {vi.auth.logoutButton}
          </Button>
        </form>
      </div>

      {/* Grid: Account Info & Empty Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Information Card */}
        <div className="md:col-span-1 bg-white/95 rounded-2xl p-6 border border-lavender-mist shadow-sm space-y-4">
          <h2 className="font-ui text-base font-bold text-deep-navy border-b border-deep-navy/10 pb-3">
            {vi.auth.customerInfo}
          </h2>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs font-semibold uppercase text-deep-navy/50 block">
                {vi.auth.nameLabel}
              </span>
              <span className="font-medium text-deep-navy">
                {customer.name?.trim() || vi.auth.nameNotUpdated}
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase text-deep-navy/50 block">
                {vi.auth.emailLabel}
              </span>
              <span className="font-medium text-deep-navy font-mono text-xs sm:text-sm break-all">
                {customer.email}
              </span>
            </div>
          </div>
        </div>

        {/* Courses, Workshops & Orders Sections */}
        <div className="md:col-span-2 space-y-6">
          {/* Lịch workshop của tôi */}
          <WorkshopSchedule workshops={eligibleWorkshops} />

          {/* Khóa học của tôi */}
          <div className="bg-white/95 rounded-2xl p-6 border border-lavender-mist shadow-sm space-y-4">
            <h2 className="font-ui text-base font-bold text-deep-navy">{vi.auth.myCourses}</h2>
            {userCourses.length === 0 ? (
              <div className="p-8 rounded-xl bg-warm-ivory/50 border border-dashed border-deep-navy/20 text-center">
                <p className="font-sans text-sm text-deep-navy/60">{vi.auth.myCoursesEmpty}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userCourses.map(({ product, access, toolUrl, buyUrl }) => {
                  const statusLabel =
                    vi.entitlement.status[access.status as keyof typeof vi.entitlement.status] ||
                    access.status
                  const statusBadgeStyle =
                    access.status === 'active'
                      ? 'bg-mint-haze text-deep-navy border-mint-haze'
                      : access.status === 'trial'
                        ? 'bg-butter-cream text-deep-navy border-butter-cream'
                        : 'bg-gray-100 text-gray-600 border-gray-200'

                  return (
                    <div
                      key={product.id}
                      data-testid={`course-item-${product.slug}`}
                      className="p-4 rounded-xl border border-lavender-mist bg-warm-ivory/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <h3 className="font-ui font-bold text-deep-navy text-base">
                          {product.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            data-testid="entitlement-status-badge"
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-ui text-xs font-semibold border ${statusBadgeStyle}`}
                          >
                            {statusLabel}
                          </span>
                          {access.status === 'trial' && typeof access.daysLeft === 'number' && (
                            <span
                              data-testid="trial-days-left"
                              className="inline-flex items-center rounded-full px-2.5 py-0.5 font-ui text-xs font-medium bg-soft-pink text-bright-magenta border border-bright-magenta/20"
                            >
                              {vi.entitlement.daysLeft(access.daysLeft)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:self-center">
                        {access.hasAccess && (
                          <Button href={toolUrl} variant="secondary" size="sm">
                            {vi.auth.openTool}
                          </Button>
                        )}
                        {(access.status === 'trial' || access.status === 'expired') &&
                          product.saleStatus === 'on_sale' && (
                            <Button href={buyUrl} variant="primary" size="sm">
                              {vi.auth.buyToContinue}
                            </Button>
                          )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Thẻ đã lưu */}
          <SavedCards
            initialCards={savedCardsResult.savedCards}
            loadError={savedCardsResult.loadError}
          />

          {/* Đơn hàng */}
          <MyOrders orders={ordersResult.orders} loadError={ordersResult.loadError} />

          {/* Tùy chọn email thông báo */}
          <ReminderEmailToggle initialOptOut={customer.reminderEmailsOptOut} />

          <AccountDeletionRequest initialRequestedAt={customer.deletionRequestedAt} />
        </div>
      </div>
    </div>
  )
}
