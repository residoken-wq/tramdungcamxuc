import 'server-only'
import { vi } from '../i18n/vi'

export class TurnstileError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TurnstileError'
  }
}

export async function verifyTurnstile(
  token?: string,
  clientIp?: string,
): Promise<{ success: boolean }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY
  const isProd = process.env.NODE_ENV === 'production'

  if (!secretKey || secretKey.trim().length === 0) {
    if (isProd) {
      console.error('[Turnstile] Missing TURNSTILE_SECRET_KEY in production environment')
      throw new TurnstileError(vi.forms.turnstileConfigError)
    }
    // In dev / test environments, bypass verification if no secret is configured
    return { success: true }
  }

  if (!token || token.trim().length === 0) {
    throw new TurnstileError(vi.forms.turnstileRequired)
  }

  try {
    const formData = new URLSearchParams()
    formData.append('secret', secretKey)
    formData.append('response', token)
    if (clientIp) {
      formData.append('remoteip', clientIp)
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
    })

    if (!response.ok) {
      throw new TurnstileError(vi.forms.turnstileFailed)
    }

    const data = (await response.json()) as { success?: boolean; 'error-codes'?: string[] }
    if (!data.success) {
      console.warn('[Turnstile] Verification failed with codes:', data['error-codes'])
      throw new TurnstileError(vi.forms.turnstileFailed)
    }

    return { success: true }
  } catch (err) {
    if (err instanceof TurnstileError) throw err
    console.error('[Turnstile] Verification request exception:', err)
    throw new TurnstileError(vi.forms.turnstileFailed)
  }
}
