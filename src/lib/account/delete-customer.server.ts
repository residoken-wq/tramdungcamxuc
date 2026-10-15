import 'server-only'

import type { Payload, PayloadRequest, Where } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import { hashTrialEmail } from '@/lib/auth/token'
import { vi } from '@/lib/i18n/vi'
import type { DeleteCustomerDataResult } from './types'

export interface DeleteCustomerParams {
  customerId: number
  confirmationEmail: string
  actorUserId?: number | string
}

interface DrizzleDbExecutor {
  execute: (query: unknown) => Promise<unknown>
}

// The drizzle handle bound to this transaction (payload.db.drizzle would run outside it).
function getTransactionDb(
  payload: Payload,
  transactionID: number | string,
): DrizzleDbExecutor | null {
  const sessions = (
    payload.db as unknown as { sessions?: Record<string, { db?: DrizzleDbExecutor }> }
  ).sessions
  const db = sessions?.[String(transactionID)]?.db
  return db && typeof db.execute === 'function' ? db : null
}

function rowsOf<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[]
  return ((result as { rows?: T[] })?.rows ?? []) as T[]
}

// REVIEW-REQUIRED: Xóa vĩnh viễn dữ liệu cá nhân của khách hàng theo Nghị định 13/2023/NĐ-CP.
// - Chỉ được gọi bởi chủ sở hữu (owner).
// - Kiểm tra xác nhận gõ lại email khách hàng chính xác trước khi thực hiện.
// - Toàn bộ các thao tác đọc, xóa, ẩn danh và ghi dấu vết diễn ra trong 1 transaction DB duy nhất.
// - Trình tự xóa: bảng con trước, cha sau (tránh lỗi khóa ngoại).
// - Đơn hàng được giữ lại nhưng ẩn danh hoàn toàn (customer = null, anonymizedAt = now, xóa notes & customerNeed;
//   giữ items, tổng tiền, paymentRef, trạng thái để đối soát).
// - paymentEvents được giữ nguyên làm chứng từ ngân hàng.
// - Lưu dấu vết dùng thử ẩn danh (trialUsage: emailHash + product) trước khi xóa entitlements.
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
  // REVIEW-REQUIRED: Mọi đọc/ghi chạy trên cùng một transaction. Không có transaction → từ chối (không xóa nửa vời).
  if (
    typeof payload.db?.beginTransaction !== 'function' ||
    typeof payload.db.commitTransaction !== 'function' ||
    typeof payload.db.rollbackTransaction !== 'function'
  ) {
    throw new Error(vi.account.adminDeletion.serverError)
  }
  const transactionID = await payload.db.beginTransaction()
  if (!transactionID) throw new Error(vi.account.adminDeletion.serverError)
  const rollback = async () => {
    try {
      await payload.db.rollbackTransaction(transactionID)
    } catch (rollbackErr) {
      console.error('[DeleteCustomer] Lỗi rollback transaction:', rollbackErr)
    }
  }
  // A fresh req per call: Payload's local API merges `context` into the req it is given, so a
  // shared req would leak one call's context into the next.
  const txReq = () =>
    ({ transactionID, context: { accountDeletion: true } }) as unknown as PayloadRequest
  const db = getTransactionDb(payload, transactionID)
  if (!db) {
    await rollback()
    throw new Error(vi.account.adminDeletion.serverError)
  }

  // REVIEW-REQUIRED: Khóa dòng khách (FOR UPDATE) tới khi commit: đơn mới tạo cho khách này (khóa ngoại
  // cần khóa KEY SHARE trên dòng khách) phải chờ, rồi lỗi vì khách đã bị xóa – không lọt đơn chờ mới.
  const lockedResult = await db.execute(
    sql`SELECT "id", "email" FROM "customers" WHERE "id" = ${params.customerId} FOR UPDATE`,
  )
  const locked = rowsOf<{ id: number; email: string }>(lockedResult)[0]
  if (!locked) {
    await rollback()
    return { success: false, message: vi.account.adminDeletion.notFound }
  }

  const normalizedInput = params.confirmationEmail.trim().toLowerCase()
  const normalizedActual = locked.email.trim().toLowerCase()
  if (normalizedInput !== normalizedActual) {
    await rollback()
    return {
      success: false,
      message: vi.account.adminDeletion.emailMismatch,
    }
  }

  const customerId = locked.id
  const customerEmail = locked.email
  const normalizedEmail = customerEmail.trim().toLowerCase()
  const tally: Record<string, number> = {}

  try {
    // 1. Thu thập các bản ghi liên kết của khách hàng bên trong transaction
    const orders = await payload.find({
      collection: 'orders',
      where: { customer: { equals: customerId } },
      pagination: false,
      req: txReq(),
      overrideAccess: true,
    })
    const customerOrders = orders.docs

    // REVIEW-REQUIRED: Chặn xóa khi khách còn đơn hàng 'pending' chưa thanh toán (T2-16b A2, anh Nhân chốt 14/10).
    // Yêu cầu admin/Hana phải hủy đơn trước khi xóa để tránh treo đơn và xung đột với webhook/cron.
    const pendingOrders = customerOrders.filter((o) => o.paymentStatus === 'pending')
    if (pendingOrders.length > 0) {
      await rollback()
      return {
        success: false,
        message: vi.account.adminDeletion.pendingOrders(pendingOrders.length),
      }
    }

    let planIds: number[] = []
    if (db) {
      const planRowsResult = await db.execute(
        sql`SELECT id FROM "habit_plans" WHERE "customer_id" = ${customerId} OR lower("lead_email") = ${normalizedEmail}`,
      )
      const planRows = Array.isArray(planRowsResult)
        ? planRowsResult
        : ((planRowsResult as { rows?: Array<{ id: number }> }).rows ?? [])
      planIds = planRows.map((r: { id: number }) => r.id)
    } else {
      const habitPlans = await payload.find({
        collection: 'habitPlans',
        where: {
          or: [
            { customer: { equals: customerId } },
            { leadEmail: { equals: customerEmail } },
            { leadEmail: { equals: normalizedEmail } },
          ],
        },
        pagination: false,
        req: txReq(),
        overrideAccess: true,
      })
      planIds = habitPlans.docs.map((p) => p.id)
    }

    const entitlements = await payload.find({
      collection: 'entitlements',
      where: { customer: { equals: customerId } },
      pagination: false,
      req: txReq(),
      overrideAccess: true,
    })
    const entitlementIds = entitlements.docs.map((e) => e.id)

    // 2. Xóa certificates
    const certConditions: Where[] = [{ customer: { equals: customerId } }]
    if (planIds.length > 0) {
      certConditions.push({ plan: { in: planIds } })
    }
    const resCert = await payload.delete({
      collection: 'certificates',
      where: { or: certConditions },
      req: txReq(),
      overrideAccess: true,
    })
    if (resCert.errors && resCert.errors.length > 0) {
      throw new Error(
        `Lỗi khi xóa certificates: ${resCert.errors.map((e) => e.message).join(', ')}`,
      )
    }
    tally.certificates = resCert.docs?.length ?? 0

    // 3. Xóa habitCheckins
    if (planIds.length > 0) {
      const resCheckins = await payload.delete({
        collection: 'habitCheckins',
        where: { plan: { in: planIds } },
        req: txReq(),
        overrideAccess: true,
      })
      if (resCheckins.errors && resCheckins.errors.length > 0) {
        throw new Error(
          `Lỗi khi xóa habitCheckins: ${resCheckins.errors.map((e) => e.message).join(', ')}`,
        )
      }
      tally.habitCheckins = resCheckins.docs?.length ?? 0
    } else {
      tally.habitCheckins = 0
    }

    // 4. Xóa trackerNudges
    if (planIds.length > 0) {
      const resNudges = await payload.delete({
        collection: 'trackerNudges',
        where: { plan: { in: planIds } },
        req: txReq(),
        overrideAccess: true,
      })
      if (resNudges.errors && resNudges.errors.length > 0) {
        throw new Error(
          `Lỗi khi xóa trackerNudges: ${resNudges.errors.map((e) => e.message).join(', ')}`,
        )
      }
      tally.trackerNudges = resNudges.docs?.length ?? 0
    } else {
      tally.trackerNudges = 0
    }

    // 5. Xóa habitPlans
    if (planIds.length > 0) {
      const resPlans = await payload.delete({
        collection: 'habitPlans',
        where: { id: { in: planIds } },
        req: txReq(),
        overrideAccess: true,
      })
      if (resPlans.errors && resPlans.errors.length > 0) {
        throw new Error(
          `Lỗi khi xóa habitPlans: ${resPlans.errors.map((e) => e.message).join(', ')}`,
        )
      }
      tally.habitPlans = resPlans.docs?.length ?? 0
    } else {
      tally.habitPlans = 0
    }

    // 6. Xóa workshopReminders
    {
      const resWorkshop = await payload.delete({
        collection: 'workshopReminders',
        where: { customer: { equals: customerId } },
        req: txReq(),
        overrideAccess: true,
      })
      if (resWorkshop.errors && resWorkshop.errors.length > 0) {
        throw new Error(
          `Lỗi khi xóa workshopReminders: ${resWorkshop.errors.map((e) => e.message).join(', ')}`,
        )
      }
      tally.workshopReminders = resWorkshop.docs?.length ?? 0
    }

    // 7. Xóa trialReminders
    if (entitlementIds.length > 0) {
      const resTrial = await payload.delete({
        collection: 'trialReminders',
        where: { entitlement: { in: entitlementIds } },
        req: txReq(),
        overrideAccess: true,
      })
      if (resTrial.errors && resTrial.errors.length > 0) {
        throw new Error(
          `Lỗi khi xóa trialReminders: ${resTrial.errors.map((e) => e.message).join(', ')}`,
        )
      }
      tally.trialReminders = resTrial.docs?.length ?? 0
    } else {
      tally.trialReminders = 0
    }

    // 8. Xóa lessonProgress
    {
      const resLesson = await payload.delete({
        collection: 'lessonProgress',
        where: { customer: { equals: customerId } },
        req: txReq(),
        overrideAccess: true,
      })
      if (resLesson.errors && resLesson.errors.length > 0) {
        throw new Error(
          `Lỗi khi xóa lessonProgress: ${resLesson.errors.map((e) => e.message).join(', ')}`,
        )
      }
      tally.lessonProgress = resLesson.docs?.length ?? 0
    }

    // 9. Xóa savedCards
    {
      const resCards = await payload.delete({
        collection: 'savedCards',
        where: { customer: { equals: customerId } },
        req: txReq(),
        overrideAccess: true,
      })
      if (resCards.errors && resCards.errors.length > 0) {
        throw new Error(
          `Lỗi khi xóa savedCards: ${resCards.errors.map((e) => e.message).join(', ')}`,
        )
      }
      tally.savedCards = resCards.docs?.length ?? 0
    }

    const now = new Date().toISOString()

    // 9b. REVIEW-REQUIRED: Lưu dấu vết dùng thử ẩn danh (trialUsage) trước khi xóa entitlements (T2-16b B6, anh Nhân chốt 14/10).
    const trialEntitlements = entitlements.docs.filter((e) => e.source === 'trial')
    for (const ent of trialEntitlements) {
      const prodId =
        typeof ent.product === 'object' && ent.product !== null
          ? (ent.product as { id: number }).id
          : Number(ent.product)
      if (!prodId) continue

      const emailHash = hashTrialEmail(customerEmail)
      const existingUsage = await payload.find({
        collection: 'trialUsage',
        where: {
          and: [{ emailHash: { equals: emailHash } }, { product: { equals: prodId } }],
        },
        pagination: false,
        req: txReq(),
        overrideAccess: true,
      })

      if (existingUsage.totalDocs === 0) {
        await payload.create({
          collection: 'trialUsage',
          data: {
            emailHash,
            product: prodId,
            usedAt: ent.grantedAt || now,
          },
          req: txReq(),
          overrideAccess: true,
        })
      }
    }

    // 10. Xóa entitlements
    if (entitlementIds.length > 0) {
      const resEnt = await payload.delete({
        collection: 'entitlements',
        where: { id: { in: entitlementIds } },
        req: txReq(),
        overrideAccess: true,
      })
      if (resEnt.errors && resEnt.errors.length > 0) {
        throw new Error(
          `Lỗi khi xóa entitlements: ${resEnt.errors.map((e) => e.message).join(', ')}`,
        )
      }
      tally.entitlements = resEnt.docs?.length ?? 0
    } else {
      tally.entitlements = 0
    }

    // 11. Xóa otpCodes (theo email, không phân biệt hoa thường)
    {
      let otpIds: number[] = []
      if (db) {
        const otpRowsResult = await db.execute(
          sql`SELECT id FROM "otp_codes" WHERE lower("email") = ${normalizedEmail}`,
        )
        const otpRows = Array.isArray(otpRowsResult)
          ? otpRowsResult
          : ((otpRowsResult as { rows?: Array<{ id: number }> }).rows ?? [])
        otpIds = otpRows.map((r: { id: number }) => r.id)
      } else {
        const otps = await payload.find({
          collection: 'otpCodes',
          where: {
            or: [{ email: { equals: customerEmail } }, { email: { equals: normalizedEmail } }],
          },
          pagination: false,
          req: txReq(),
          overrideAccess: true,
        })
        otpIds = otps.docs.map((o) => o.id)
      }

      if (otpIds.length > 0) {
        const resOtp = await payload.delete({
          collection: 'otpCodes',
          where: { id: { in: otpIds } },
          req: txReq(),
          overrideAccess: true,
        })
        if (resOtp.errors && resOtp.errors.length > 0) {
          throw new Error(`Lỗi khi xóa otpCodes: ${resOtp.errors.map((e) => e.message).join(', ')}`)
        }
        tally.otpCodes = resOtp.docs?.length ?? 0
      } else {
        tally.otpCodes = 0
      }
    }

    // 12. Xóa diagnosticResults (theo email, không phân biệt hoa thường)
    {
      let diagIds: number[] = []
      if (db) {
        const diagRowsResult = await db.execute(
          sql`SELECT id FROM "diagnostic_results" WHERE lower("email") = ${normalizedEmail}`,
        )
        const diagRows = Array.isArray(diagRowsResult)
          ? diagRowsResult
          : ((diagRowsResult as { rows?: Array<{ id: number }> }).rows ?? [])
        diagIds = diagRows.map((r: { id: number }) => r.id)
      } else {
        const diags = await payload.find({
          collection: 'diagnosticResults',
          where: {
            or: [{ email: { equals: customerEmail } }, { email: { equals: normalizedEmail } }],
          },
          pagination: false,
          req: txReq(),
          overrideAccess: true,
        })
        diagIds = diags.docs.map((d) => d.id)
      }

      if (diagIds.length > 0) {
        const resDiag = await payload.delete({
          collection: 'diagnosticResults',
          where: { id: { in: diagIds } },
          req: txReq(),
          overrideAccess: true,
        })
        if (resDiag.errors && resDiag.errors.length > 0) {
          throw new Error(
            `Lỗi khi xóa diagnosticResults: ${resDiag.errors.map((e) => e.message).join(', ')}`,
          )
        }
        tally.diagnosticResults = resDiag.docs?.length ?? 0
      } else {
        tally.diagnosticResults = 0
      }
    }

    // 13. Xóa leads (theo email, không phân biệt hoa thường)
    {
      let leadIds: number[] = []
      if (db) {
        const leadRowsResult = await db.execute(
          sql`SELECT id FROM "leads" WHERE lower("email") = ${normalizedEmail}`,
        )
        const leadRows = Array.isArray(leadRowsResult)
          ? leadRowsResult
          : ((leadRowsResult as { rows?: Array<{ id: number }> }).rows ?? [])
        leadIds = leadRows.map((r: { id: number }) => r.id)
      } else {
        const leads = await payload.find({
          collection: 'leads',
          where: {
            or: [{ email: { equals: customerEmail } }, { email: { equals: normalizedEmail } }],
          },
          pagination: false,
          req: txReq(),
          overrideAccess: true,
        })
        leadIds = leads.docs.map((l) => l.id)
      }

      if (leadIds.length > 0) {
        const resLeads = await payload.delete({
          collection: 'leads',
          where: { id: { in: leadIds } },
          req: txReq(),
          overrideAccess: true,
        })
        if (resLeads.errors && resLeads.errors.length > 0) {
          throw new Error(`Lỗi khi xóa leads: ${resLeads.errors.map((e) => e.message).join(', ')}`)
        }
        tally.leads = resLeads.docs?.length ?? 0
      } else {
        tally.leads = 0
      }
    }

    // 13b. REVIEW-REQUIRED: Chuyển đơn hàng 'failed' sang 'cancelled' và ghi nhật ký thao tác (T2-16b A2, anh Nhân chốt 14/10).
    // Đơn failed (quá hạn) được chuyển sang cancelled trong transaction trước khi ẩn danh để webhook không nhận nhầm tiền.
    // UPDATE có điều kiện tại DB (như cancelOrder), trong transaction; chỉ ghi audit cho đơn thật sự đổi.
    const failedOrderIds = customerOrders
      .filter((o) => o.paymentStatus === 'failed')
      .map((o) => o.id)
    for (const failedOrderId of failedOrderIds) {
      const cancelResult = await db.execute(
        sql`UPDATE "orders" SET "payment_status" = 'cancelled', "updated_at" = ${now}::timestamptz WHERE "id" = ${failedOrderId} AND "customer_id" = ${customerId} AND "payment_status" = 'failed' RETURNING "id"`,
      )
      if (rowsOf<{ id: number }>(cancelResult).length === 0) continue
      await payload.create({
        collection: 'auditLogs',
        data: {
          action: 'order_cancelled_for_deletion',
          target: `orders:${failedOrderId}`,
          actor: params.actorUserId ? Number(params.actorUserId) : undefined,
          before: { paymentStatus: 'failed' },
          after: { paymentStatus: 'cancelled' },
          at: now,
        },
        req: txReq(),
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
        req: txReq(),
        overrideAccess: true,
      })
      anonymizedCount++
    }
    tally.orders = anonymizedCount

    // 15. Xóa customers (chỉ thành công khi req.context?.accountDeletion === true)
    await payload.delete({
      collection: 'customers',
      id: customerId,
      req: txReq(),
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
      req: txReq(),
      overrideAccess: true,
    })

    // Hoàn tất transaction thành công
    await payload.db.commitTransaction(transactionID)

    return {
      success: true,
      message: vi.account.adminDeletion.deleteSuccess,
      tally,
    }
  } catch (err) {
    await rollback()
    console.error('[DeleteCustomer] Lỗi trong quá trình xóa dữ liệu khách hàng:', err)
    throw new Error(vi.account.adminDeletion.serverError)
  }
}
