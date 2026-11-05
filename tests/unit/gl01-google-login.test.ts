import { describe, it, expect } from 'vitest'
import { resolveLoginMethods } from '@/lib/auth/methods'

describe('GL-01 1.1: resolveLoginMethods', () => {
  const completeEnv = {
    GOOGLE_CLIENT_ID: 'test-google-client-id',
    GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
  }

  it('Row 1: Google enabled + env complete, OTP enabled -> both methods active', () => {
    const result = resolveLoginMethods(
      { loginGoogleEnabled: true, loginOtpEnabled: true },
      completeEnv,
    )
    expect(result).toEqual({ google: true, otp: true })
  })

  it('Row 1 (defaults): default settings with complete env -> both methods active', () => {
    const result = resolveLoginMethods({}, completeEnv)
    expect(result).toEqual({ google: true, otp: true })
  })

  it('Row 2: Google enabled + env complete, OTP disabled -> only Google active', () => {
    const result = resolveLoginMethods(
      { loginGoogleEnabled: true, loginOtpEnabled: false },
      completeEnv,
    )
    expect(result).toEqual({ google: true, otp: false })
  })

  it('Row 3: Google enabled but env missing GOOGLE_CLIENT_ID -> falls back to OTP form', () => {
    const result = resolveLoginMethods(
      { loginGoogleEnabled: true, loginOtpEnabled: false },
      { GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: 'secret' },
    )
    expect(result).toEqual({ google: false, otp: true })
  })

  it('Row 3: Google enabled but env missing GOOGLE_CLIENT_SECRET -> falls back to OTP form', () => {
    const result = resolveLoginMethods(
      { loginGoogleEnabled: true, loginOtpEnabled: false },
      { GOOGLE_CLIENT_ID: 'client-id', GOOGLE_CLIENT_SECRET: '' },
    )
    expect(result).toEqual({ google: false, otp: true })
  })

  it('Row 3: Google disabled in settings -> falls back to OTP form regardless of OTP setting', () => {
    const result1 = resolveLoginMethods(
      { loginGoogleEnabled: false, loginOtpEnabled: true },
      completeEnv,
    )
    expect(result1).toEqual({ google: false, otp: true })

    const result2 = resolveLoginMethods(
      { loginGoogleEnabled: false, loginOtpEnabled: false },
      completeEnv,
    )
    expect(result2).toEqual({ google: false, otp: true })
  })
})
