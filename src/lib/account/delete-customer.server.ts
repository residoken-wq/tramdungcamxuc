import 'server-only'

import type { Payload, Where } from 'payload'
import { vi } from '@/lib/i18n/vi'
import type { DeleteCustomerDataResult } from './types'

export interface DeleteCustomerParams {
  customerId: number
  confirmationEmail: string
  actorUserId?: number | string
}

// REVIEW-REQUIRED: Xóa vĩnh viễn dữ liệu cá nhân của khách hàng theo Nghị định 13/2023/NĐ-CP.
// - Chỉ được gọi bởi chủ sở hữu (owner).
// - Kiểm tra xác nhận gõ lại email khách hàng chính xác trước khi thực hiện.
// - Toàn bộ các thao tác xóa và ẩn danh diễn ra trong 1 transaction DB duy nhất.
// - Trình tự xóa: bảng con trước, cha sau (tránh lỗi khóa ngoại).
// - Đơn hàng được giữ lại nhưng ẩn danh hoàn toàn (customer = null, anonymizedAt = now, xóa notes & customerNeed;
//   giữ items, tổng tiền, paymentRef, trạng thái để đối soát).
// - paymentEvents được giữ nguyên làm chứng từ ngân hàng.
// - Ghi auditLogs với target 'customers:<id>' và tally, tuyệt đối KHÔNG ghi tên hoặc email khách hàng.
// - Bất kỳ lỗi nào phát sinh đều rollback toàn bộ transaction và ném lỗi tiếng Việt.
export async function deleteCustomerData(
  payload: Payload,
  params: {
    customerId: number
    confirmationEmail: string
    actorUserId?: number | string
  },
): Promise<DeleteCustomerDataResult> {
  const customer = await payload.findByID({
    collection: 'customers',
    id: params.customerId,
    overrideAccess: true,
  })

  if (!customer) {
    return {
      success: false,
      message: vi.account.adminDeletion.notFound,
    }
  }

  const normalizedInput = params.confirmationEmail.trim().toLowerCase()
  const normalizedActual = customer.email.trim().toLowerCase()
  if (normalizedInput !== normalizedActual) {
    return {
      success: false,
      message: vi.account.adminDeletion.emailMismatch,
    }
  }

  const customerId = customer.id
  const customerEmail = customer.email
  const tally: Record<string, number> = {}

  // 1. Thu thập các ID liên kết của khách hàng
  const habitPlans = await payload.find({
    collection: 'habitPlans',
    where: {
      or: [{ customer: { equals: customerId } }, { leadEmail: { equals: customerEmail } }],
    },
    pagination: false,
    overrideAccess: true,
  })
  const planIds = habitPlans.docs.map((p) => p.id)

  const entitlements = await payload.find({
    collection: 'entitlements',
    where: { customer: { equals: customerId } },
    pagination: false,
    overrideAccess: true,
  })
  const entitlementIds = entitlements.docs.map((e) => e.id)

  const orders = await payload.find({
    collection: 'orders',
    where: { customer: { equals: customerId } },
    pagination: false,
    overrideAccess: true,
  })
  const customerOrders = orders.docs

  // REVIEW-REQUIRED: Chặn xóa khi khách còn đơn hàng 'pending' chưa thanh toán (T2-16b A2, anh Nhân chốt 14/10).
  // Yêu cầu admin/Hana phải hủy đơn trước khi xóa để tránh treo đơn và xung đột với webhook/cron.
  const pendingOrders = customerOrders.filter((o) => o.paymentStatus === 'pending')
  if (pendingOrders.length > 0) {
    return {
      success: false,
      message: vi.account.adminDeletion.pendingOrders(pendingOrders.length),
    }
  }

  let transactionID: null | number | string = null
  if (payload.db && typeof payload.db.beginTransaction === 'function') {
    transactionID = await payload.db.beginTransaction()
  }
  const req: any = {
    ...(transactionID ? { transactionID } : {}),
    context: {
      accountDeletion: true,
    },
  }

  try {
    // 2. Xóa certificates
    const certConditions: Where[] = [{ customer: { equals: customerId } }]
    if (planIds.length > 0) {
      certConditions.push({ plan: { in: planIds } })
    }
    const resCert = await payload.delete({
      collection: 'certificates',
      where: { or: certConditions },
      req,
      overrideAccess: true,
    })
    tally.certificates = resCert.docs?.length ?? 0

    // 3. Xóa habitCheckins
    if (planIds.length > 0) {
      const resCheckins = await payload.delete({
        collection: 'habitCheckins',
        where: { plan: { in: planIds } },
        req,
        overrideAccess: true,
      })
      tally.habitCheckins = resCheckins.docs?.length ?? 0
    } else {
      tally.habitCheckins = 0
    }

    // 4. Xóa trackerNudges
    if (planIds.length > 0) {
      const resNudges = await payload.delete({
        collection: 'trackerNudges',
        where: { plan: { in: planIds } },
        req,
        overrideAccess: true,
      })
      tally.trackerNudges = resNudges.docs?.length ?? 0
    } else {
      tally.trackerNudges = 0
    }

    // 5. Xóa habitPlans
    if (planIds.length > 0) {
      const resPlans = await payload.delete({
        collection: 'habitPlans',
        where: { id: { in: planIds } },
        req,
        overrideAccess: true,
      })
      tally.habitPlans = resPlans.docs?.length ?? 0
    } else {
      tally.habitPlans = 0
    }

    // 6. Xóa workshopReminders
    {
      const resWorkshop = await payload.delete({
        collection: 'workshopReminders',
        where: { customer: { equals: customerId } },
        req,
        overrideAccess: true,
      })
      tally.workshopReminders = resWorkshop.docs?.length ?? 0
    }

    // 7. Xóa trialReminders
    if (entitlementIds.length > 0) {
      const resTrial = await payload.delete({
        collection: 'trialReminders',
        where: { entitlement: { in: entitlementIds } },
        req,
        overrideAccess: true,
      })
      tally.trialReminders = resTrial.docs?.length ?? 0
    } else {
      tally.trialReminders = 0
    }

    // 8. Xóa lessonProgress
    {
      const resLesson = await payload.delete({
        collection: 'lessonProgress',
        where: { customer: { equals: customerId } },
        req,
        overrideAccess: true,
      })
      tally.lessonProgress = resLesson.docs?.length ?? 0
    }

    // 9. Xóa savedCards
    {
      const resCards = await payload.delete({
        collection: 'savedCards',
        where: { customer: { equals: customerId } },
        req,
        overrideAccess: true,
      })
      tally.savedCards = resCards.docs?.length ?? 0
    }

    // 10. Xóa entitlements
    if (entitlementIds.length > 0) {
      const resEnt = await payload.delete({
        collection: 'entitlements',
        where: { id: { in: entitlementIds } },
        req,
        overrideAccess: true,
      })
      tally.entitlements = resEnt.docs?.length ?? 0
    } else {
      tally.entitlements = 0
    }

    // 11. Xóa otpCodes (theo email)
    {
      const resOtp = await payload.delete({
        collection: 'otpCodes',
        where: { email: { equals: customerEmail } },
        req,
        overrideAccess: true,
      })
      tally.otpCodes = resOtp.docs?.length ?? 0
    }

    // 12. Xóa diagnosticResults (theo email)
    {
      const resDiag = await payload.delete({
        collection: 'diagnosticResults',
        where: { email: { equals: customerEmail } },
        req,
        overrideAccess: true,
      })
      tally.diagnosticResults = resDiag.docs?.length ?? 0
    }

    // 13. Xóa leads (theo email)
    {
      const resLeads = await payload.delete({
        collection: 'leads',
        where: { email: { equals: customerEmail } },
        req,
        overrideAccess: true,
      })
      tally.leads = resLeads.docs?.length ?? 0
    }

    const now = new Date().toISOString()

    // 13b. REVIEW-REQUIRED: Chuyển đơn hàng 'failed' sang 'cancelled' và ghi nhật ký thao tác (T2-16b A2, anh Nhân chốt 14/10).
    // Đơn failed (quá hạn) được chuyển sang cancelled trong transaction trước khi ẩn danh để webhook không nhận nhầm tiền.
    const failedOrders = customerOrders.filter((o) => o.paymentStatus === 'failed')
    for (const failedOrder of failedOrders) {
      const resCancel = await payload.update({
        collection: 'orders',
        where: {
          and: [{ id: { equals: failedOrder.id } }, { paymentStatus: { equals: 'failed' } }],
        },
        data: {
          paymentStatus: 'cancelled',
        },
        req,
        context: { paymentAction: true, accountDeletion: true },
        overrideAccess: true,
      })
      if (resCancel.errors?.length) {
        throw new Error(`Không thể hủy đơn hàng thất bại #${failedOrder.id}`)
      }
      await payload.create({
        collection: 'auditLogs',
        data: {
          action: 'order_cancelled_for_deletion',
          target: `orders:${failedOrder.id}`,
          actor: params.actorUserId ? Number(params.actorUserId) : undefined,
          at: now,
        },
        req,
        overrideAccess: true,
      })
    }

    // 14. Ẩn danh hóa đơn hàng của khách hàng
    // REVIEW-REQUIRED: Giữ lại số tiền, paymentRef, paymentStatus, deliveryStatus, paidAt, termsAcceptedAt, items.
    // Xóa customer (gán null), anonymizedAt (now), xóa notes và customerNeed.
    let anonymizedCount = 0
    for (const order of customerOrders) {
      await payload.update({
        collection: 'orders',
        id: order.id,
        data: {
          customer: null,
          anonymizedAt: now,
          notes: null,
          customerNeed: null,
        },
        req,
        overrideAccess: true,
      })
      anonymizedCount++
    }
    tally.orders = anonymizedCount

    // 15. Xóa customers (chỉ thành công khi req.context?.accountDeletion === true)
    await payload.delete({
      collection: 'customers',
      id: customerId,
      req,
      context: { accountDeletion: true },
      overrideAccess: true,
    })
    tally.customers = 1

    // 16. Ghi auditLogs (chỉ ghi ID khách và số bản ghi theo collection, tuyệt đối KHÔNG ghi tên / email)
    await payload.create({
      collection: 'auditLogs',
      data: {
        action: 'customer_data_deleted',
        target: `customers:${customerId}`,
        actor: params.actorUserId ? Number(params.actorUserId) : undefined,
        after: { tally },
        at: now,
      },
      req,
      overrideAccess: true,
    })

    // Hoàn tất transaction thành công
    if (transactionID && typeof payload.db.commitTransaction === 'function') {
      await payload.db.commitTransaction(transactionID)
    }

    return {
      success: true,
      message: vi.account.adminDeletion.deleteSuccess,
      tally,
    }
  } catch (err) {
    if (transactionID && typeof payload.db.rollbackTransaction === 'function') {
      try {
        await payload.db.rollbackTransaction(transactionID)
      } catch (rollbackErr) {
        console.error('[DeleteCustomer] Lỗi rollback transaction:', rollbackErr)
      }
    }
    console.error('[DeleteCustomer] Lỗi trong quá trình xóa dữ liệu khách hàng:', err)
    throw new Error(vi.account.adminDeletion.serverError)
  }
}
