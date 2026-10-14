export interface RequestAccountDeletionResult {
  success: boolean
  message: string
  alreadyRequested?: boolean
  requestedAt?: string | null
}

export interface DeleteCustomerDataResult {
  success: boolean
  message: string
  tally?: Record<string, number>
}
