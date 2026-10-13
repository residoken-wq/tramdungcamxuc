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
  planId?: number
  hasCertificate?: boolean
  certificate?: PublicCertificateData | null
  reason?: 'NO_PLAN' | 'NOT_YET_DAY_21' | 'NOT_ENOUGH_DAYS'
  message?: string
}
