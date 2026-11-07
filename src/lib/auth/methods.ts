export interface LoginSettings {
  loginGoogleEnabled?: boolean | null
  loginOtpEnabled?: boolean | null
}

export interface LoginEnv {
  GOOGLE_CLIENT_ID?: string | null | undefined
  GOOGLE_CLIENT_SECRET?: string | null | undefined
  [key: string]: string | null | undefined
}

/**
 * Mock Google endpoints for e2e. Same gate as /api/test-otp (see test-hooks.ts): CI runs a
 * production build, so only E2E_TEST_HOOKS=1 (set solely in the CI e2e job) can enable it.
 */
export const GOOGLE_MOCK_CLIENT_ID = 'mock-google-client-id'

export function isGoogleMockMode(env: LoginEnv = process.env): boolean {
  return env.E2E_TEST_HOOKS === '1'
}

/**
 * GL-01c: one place for the client id / secret. In mock mode without real credentials the
 * start route, the callback and the mock token all use the same fake client id.
 */
export function googleClientCredentials(env: LoginEnv = process.env): {
  clientId: string
  clientSecret: string
} {
  const clientId = env.GOOGLE_CLIENT_ID?.trim() ?? ''
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim() ?? ''
  if ((!clientId || !clientSecret) && isGoogleMockMode(env)) {
    return { clientId: clientId || GOOGLE_MOCK_CLIENT_ID, clientSecret: clientSecret || 'mock' }
  }
  return { clientId, clientSecret }
}

export interface LoginMethodsResult {
  google: boolean
  otp: boolean
}

/**
 * GL-01 1.1: Resolves active login methods based on CMS siteSettings and environment variables.
 *
 * Rule Table:
 * | Google enabled + env complete | OTP enabled | Page displays |
 * |---|---|---|
 * | true                          | true        | Google button on top, "or" divider, OTP form below ({ google: true, otp: true }) |
 * | true                          | false       | Only Google button ({ google: true, otp: false }) |
 * | false                         | any         | OTP form ({ google: false, otp: true }) - never lock customers out |
 *
 * Note: Never logs or exposes environment variable values; only checks presence.
 */
export function resolveLoginMethods(
  settings?: LoginSettings | null,
  env: LoginEnv = process.env,
): LoginMethodsResult {
  const googleEnabled = settings?.loginGoogleEnabled !== false
  const otpEnabled = settings?.loginOtpEnabled !== false

  const hasGoogleEnv =
    Boolean(
      env.GOOGLE_CLIENT_ID &&
      env.GOOGLE_CLIENT_ID.trim().length > 0 &&
      env.GOOGLE_CLIENT_SECRET &&
      env.GOOGLE_CLIENT_SECRET.trim().length > 0,
    ) || isGoogleMockMode(env)

  const googleReady = googleEnabled && hasGoogleEnv

  if (googleReady) {
    return {
      google: true,
      otp: otpEnabled,
    }
  }

  // Google is not ready (disabled or missing credentials):
  // Fall back to OTP regardless of whether OTP was toggled off (prevent customer lockout)
  return {
    google: false,
    otp: true,
  }
}
