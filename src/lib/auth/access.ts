import type { Access, FieldAccess, PayloadRequest, Where } from 'payload'

export type AdminRole = 'owner' | 'editor'

type MaybeUser = PayloadRequest['user']

// Customers become an auth collection in GĐ 2 (OTP); until then the type of req.user only knows
// `users`, so the customer branch below compares the slug as a plain string.
const isCustomer = (user: MaybeUser): boolean =>
  (user as { collection?: string } | null | undefined)?.collection === 'customers'

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
    if (isCustomer(req.user)) return { [field]: { equals: req.user!.id } } as Where
    return false
  }

// REVIEW-REQUIRED: Sensitive emotional data (check-in emotion/note, card reflections) is hidden
// from editors; owners and the customer who wrote it can read it.
export const ownerOrSelfCustomerField: FieldAccess = ({ req, doc }) => {
  if (isOwnerUser(req.user)) return true
  if (isCustomer(req.user)) {
    const owner = (doc as { customer?: unknown } | undefined)?.customer
    const ownerId = typeof owner === 'object' && owner ? (owner as { id?: unknown }).id : owner
    return ownerId === req.user!.id
  }
  return false
}

export const nobody: Access & FieldAccess = () => false
