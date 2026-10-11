import type { Access, FieldAccess, PayloadRequest, Where } from 'payload'

export type AdminRole = 'owner' | 'editor'

type MaybeUser = PayloadRequest['user']

// REVIEW-REQUIRED: Only documents of the `customers` collection are customers (GĐ 2 OTP).
export function isCustomerUser(user: MaybeUser): boolean {
  return Boolean(user && user.collection === 'customers')
}

export const isCustomer: Access & FieldAccess = ({ req }) => isCustomerUser(req.user)

// REVIEW-REQUIRED: Only documents of the `users` collection are admins; customers (GĐ 2 OTP)
// authenticate through a different collection and must never pass these checks.
export function isAdminUser(user: MaybeUser): boolean {
  return Boolean(user && user.collection === 'users')
}

// REVIEW-REQUIRED: Owner = full rights (payments, settings, deleting orders, audit logs).
export function isOwnerUser(user: MaybeUser): boolean {
  return isAdminUser(user) && (user as { role?: AdminRole }).role === 'owner'
}

// REVIEW-REQUIRED: Any signed-in admin (owner or editor) – content editing rights.
export const authenticated: Access & FieldAccess = ({ req }) => isAdminUser(req.user)

export const isEditorOrOwner = authenticated

// REVIEW-REQUIRED: Owner-only operations and fields.
export const isOwner: Access & FieldAccess = ({ req }) => isOwnerUser(req.user)

// REVIEW-REQUIRED: Public reads must never expose unpublished content.
export const publishedOrAuthenticated: Access = ({ req }) =>
  isAdminUser(req.user) ? true : { _status: { equals: 'published' } }

// REVIEW-REQUIRED: Admins see everything; a signed-in customer (GĐ 2) only rows whose
// `field` points to themselves; anonymous visitors see nothing.
export const adminOrSelfCustomer =
  (field = 'customer'): Access =>
  ({ req }) => {
    if (isAdminUser(req.user)) return true
    if (isCustomerUser(req.user)) return { [field]: { equals: req.user!.id } } as Where
    return false
  }

// REVIEW-REQUIRED: Admins see everything; a signed-in customer only rows whose
// relation 'plan' points to a plan owned by themselves.
export const adminOrSelfCustomerPlan: Access = ({ req }) => {
  if (isAdminUser(req.user)) return true
  if (isCustomerUser(req.user)) return { 'plan.customer': { equals: req.user!.id } } as Where
  return false
}

// REVIEW-REQUIRED: Sensitive emotional data (check-in emotion/note, card reflections) is hidden
// from editors; owners and the customer who wrote it can read it.
export const ownerOrSelfCustomerField: FieldAccess = ({ req, doc }) => {
  if (isOwnerUser(req.user)) return true
  if (isCustomerUser(req.user)) {
    const owner = (doc as { customer?: unknown } | undefined)?.customer
    if (owner !== undefined) {
      const ownerId = typeof owner === 'object' && owner ? (owner as { id?: unknown }).id : owner
      return ownerId === req.user!.id
    }
    const plan = (doc as { plan?: unknown } | undefined)?.plan
    if (plan && typeof plan === 'object' && 'customer' in plan) {
      const planCustomer = (plan as { customer?: unknown }).customer
      const planCustomerId =
        typeof planCustomer === 'object' && planCustomer
          ? (planCustomer as { id?: unknown }).id
          : planCustomer
      return planCustomerId === req.user!.id
    }
  }
  return false
}

export const nobody: Access & FieldAccess = () => false
