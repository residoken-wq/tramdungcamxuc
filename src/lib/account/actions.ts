'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import {
  checkCustomerPendingOrders,
  deleteCustomerAdmin,
  getOwnerUserId,
  requestAccountDeletion,
} from './deletion.server'
import type { DeleteCustomerDataResult, RequestAccountDeletionResult } from './types'

// Every export here is a public endpoint: no options from the client, auth checked inside.
// Core logic lives in ./deletion.server.ts (server-only).

// REVIEW-REQUIRED: Customer comes from the session inside requestAccountDeletion.
export async function requestAccountDeletionAction(): Promise<RequestAccountDeletionResult> {
  return requestAccountDeletion()
}

// REVIEW-REQUIRED: Owner checked inside deleteCustomerAdmin (no actorUserId from the client).
export async function deleteCustomerAdminAction(
  customerId: number,
  confirmationEmail: string,
): Promise<DeleteCustomerDataResult> {
  return deleteCustomerAdmin(customerId, confirmationEmail)
}

// REVIEW-REQUIRED: Owner only.
export async function checkCustomerPendingOrdersAdminAction(
  customerId: number,
): Promise<{ pendingCount: number }> {
  const payload = await getPayload({ config: await config })
  if (!(await getOwnerUserId(payload))) return { pendingCount: 0 }
  return checkCustomerPendingOrders(customerId, payload)
}
