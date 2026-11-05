export interface LoginSettings {
  loginGoogleEnabled?: boolean | null
  loginOtpEnabled?: boolean | null
}

export interface LoginEnv {
  GOOGLE_CLIENT_ID?: string | null | undefined
  GOOGLE_CLIENT_SECRET?: string | null | undefined
  [key: string]: string | null | undefined
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

  const hasGoogleEnv = Boolean(
    env.GOOGLE_CLIENT_ID &&
      env.GOOGLE_CLIENT_ID.trim().length > 0 &&
      env.GOOGLE_CLIENT_SECRET &&
      env.GOOGLE_CLIENT_SECRET.trim().length > 0,
  )

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
