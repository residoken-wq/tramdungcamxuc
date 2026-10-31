import 'server-only'
import { cookies } from 'next/headers'

/**
 * HB-13c: "Bắt đầu lại" marker.
 *
 * Wizard plans are saved by `leadEmail`, which the visitor types and nobody verifies. A customer who
 * already has a plan must therefore only adopt a newer orphan plan after they pressed "Bắt đầu lại"
 * in their own browser; otherwise anyone could type their email in the wizard and swap their
 * current plan. The marker is an httpOnly cookie set by `restartJourney()` and only lives for
 * HABIT_RESTART_WINDOW_MS.
 */
export const HABIT_RESTART_COOKIE = 'tdcx_habit_restart'
export const HABIT_RESTART_WINDOW_MS = 6 * 60 * 60 * 1000

export async function markHabitRestart(now: Date = new Date()): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.set(HABIT_RESTART_COOKIE, String(now.getTime()), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(HABIT_RESTART_WINDOW_MS / 1000),
    })
  } catch {
    // Outside a Next.js request (e.g. Vitest): no cookie store, nothing to mark.
  }
}

/** Time the customer pressed "Bắt đầu lại" in this browser, or null when absent / expired. */
export async function readHabitRestartSince(now: Date = new Date()): Promise<Date | null> {
  try {
    const cookieStore = await cookies()
    const raw = Number(cookieStore.get(HABIT_RESTART_COOKIE)?.value)
    if (!Number.isFinite(raw) || raw <= 0) return null
    if (raw > now.getTime() || now.getTime() - raw > HABIT_RESTART_WINDOW_MS) return null
    return new Date(raw)
  } catch {
    return null
  }
}
