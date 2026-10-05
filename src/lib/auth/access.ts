import type { Access, FieldAccess } from 'payload'

// REVIEW-REQUIRED: Temporary admin access; owner/editor permissions belong to T0-07.
export const authenticated: Access & FieldAccess = ({ req }) =>
  Boolean(req.user && req.user.collection === 'users')

// REVIEW-REQUIRED: Public reads must never expose unpublished content.
export const publishedOrAuthenticated: Access = ({ req }) =>
  req.user?.collection === 'users' ? true : { _status: { equals: 'published' } }
