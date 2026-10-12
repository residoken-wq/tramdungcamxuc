export type EntitlementStatus = 'trial' | 'active' | 'expired' | 'none'

export interface AccessResult {
  hasAccess: boolean
  status: EntitlementStatus
  expiresAt: Date | null
  daysLeft: number | null
}

export type StartTrialErrorCode =
  | 'TRIAL_STARTED'
  | 'ALREADY_HAVE_ACTIVE'
  | 'TRIAL_ACTIVE'
  | 'TRIAL_ALREADY_USED'
  | 'NOT_ELIGIBLE'
  | 'PRODUCT_NOT_FOUND'

export interface StartTrialResult {
  success: boolean
  message: string
  code: StartTrialErrorCode
  entitlementId?: number
  status?: EntitlementStatus
  expiresAt?: Date | null
  daysLeft?: number | null
}

export interface MarkExpiredResult {
  updatedCount: number
}
