export interface PublicCertificateData {
  code: string
  customerName: string
  identityStatement: string
  daysCompleted: number
  issuedAt: string
  isPublic: boolean
  isOwner?: boolean
}

export interface CertificateEligibility {
  eligible: boolean
  currentDay: number
  completedDays: number
  minDays: number
  certificateMinDays?: number
  planId?: number
  hasCertificate?: boolean
  certificate?: PublicCertificateData | null
  existingCertificate?: PublicCertificateData | null
  reason?:
    | 'NO_PLAN'
    | 'NOT_YET_DAY_21'
    | 'NOT_ENOUGH_DAYS'
    | 'before_day_21'
    | 'not_enough_completed_days'
    | 'no_customer'
    | 'no_plan'
  message?: string
}
