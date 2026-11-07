/** DP-03: state of the login gate in front of Habit stage 2 (/habit/5-phut step >= 3). */
export type HabitStageGateStatus = 'login' | 'ok' | 'buy'

export interface HabitStageGateResult {
  status: HabitStageGateStatus
  loginUrl?: string
  trialAvailable?: boolean
  daysLeft?: number | null
  buyUrl?: string
  offerUrl?: string
  price?: number | null
  salePrice?: number | null
  /** The signed-in customer's own details, used to prefill step 6. */
  customer?: {
    id: number
    email: string
    name?: string | null
    hasConsent?: boolean
  }
}

/** Where the gate sends a guest; the login page returns to stage 2 afterwards. */
export const HABIT_GATE_RETURN_PATH = '/habit/5-phut?buoc=3'
export const HABIT_GATE_LOGIN_URL = `/tai-khoan/dang-nhap?next=${encodeURIComponent(HABIT_GATE_RETURN_PATH)}`
