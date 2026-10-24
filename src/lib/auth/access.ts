import type { Access, ClientUser, FieldAccess, PayloadRequest, Where } from 'payload'

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

// REVIEW-REQUIRED: CM-01: Ẩn các collection kỹ thuật khỏi menu admin đối với vai trò editor.
// Chỉ chủ sở hữu (owner) mới thấy nhóm Hệ thống trong sidebar admin.
// Hàm này chỉ tác động UI admin (admin.hidden), không thay đổi quyền truy cập API (access).
export function isHiddenFromEditor({
  user,
}: {
  user?: ClientUser | Record<string, unknown> | null
}): boolean {
  return (user as { role?: string } | null | undefined)?.role !== 'owner'
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

// REVIEW-REQUIRED: Sensitive private habit plan fields (privateReason, companionName).
// ONLY the learner (customer) who owns the plan can read, create, or update these fields.
// Owner / editor / other customers / anonymous users -> false.
export const selfCustomerOnlyField: FieldAccess = ({ req, id, doc, data }) => {
  if (!isCustomerUser(req.user)) return false
  const customerId = req.user!.id

  const hasDocId = Boolean(id || (doc as { id?: unknown })?.id)
  const owner = (doc as { customer?: unknown } | undefined)?.customer

  if (hasDocId || (owner !== undefined && owner !== null)) {
    // Existing document (read or update)
    if (owner !== undefined && owner !== null) {
      const ownerId =
        typeof owner === 'object' && owner && 'id' in (owner as { id?: unknown })
          ? (owner as { id?: unknown }).id
          : owner
      return ownerId === customerId
    }
    // Existing doc without a customer (e.g. leadEmail plan): nobody can read/update private fields via API
    return false
  }

  // Create operation (doc has no id and owner is not set yet)
  const targetCustomer = (data as { customer?: unknown } | undefined)?.customer
  if (targetCustomer !== undefined && targetCustomer !== null) {
    const targetId =
      typeof targetCustomer === 'object' &&
      targetCustomer &&
      'id' in (targetCustomer as { id?: unknown })
        ? (targetCustomer as { id?: unknown }).id
        : targetCustomer
    return targetId === customerId
  }

  return true
}

export const nobody: Access & FieldAccess = () => false
