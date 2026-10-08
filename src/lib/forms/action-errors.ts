import { ZodError } from 'zod'
import { RateLimitError } from './ratelimit.server'
import { TurnstileError } from './turnstile.server'
import { vi } from '../i18n/vi'

export interface ActionResponse {
  success: boolean
  message?: string
  error?: string
  fieldErrors?: Record<string, string>
}

export function handleActionError(err: unknown): ActionResponse {
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of err.issues) {
      const field = issue.path.join('.')
      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message
      }
    }
    return {
      success: false,
      error: err.issues[0]?.message || 'Dữ liệu không hợp lệ',
      fieldErrors,
    }
  }

  if (err instanceof RateLimitError) {
    return {
      success: false,
      error: err.message,
    }
  }

  if (err instanceof TurnstileError) {
    return {
      success: false,
      error: err.message,
    }
  }

  // REVIEW-REQUIRED: Never leak internal database, server, or unhandled errors to browser client.
  console.error('[Forms] Unhandled server action error:', err)
  return {
    success: false,
    error: vi.forms.serverError,
  }
}
