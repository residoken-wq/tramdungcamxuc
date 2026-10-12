import { afterEach, describe, expect, it, vi as vitest } from 'vitest'

vitest.mock('@/lib/auth/otp.server', () => ({
  __testLatestOtpCodes: new Map([['hv01@example.com', '654321']]),
}))

import { GET } from '@/app/api/test-otp/route'

const req = () => new Request('http://localhost/api/test-otp?email=hv01@example.com')

describe('/api/test-otp (T2-01c)', () => {
  afterEach(() => {
    vitest.unstubAllEnvs()
  })

  it('returns 404 when E2E_TEST_HOOKS is not set, even under NODE_ENV=test', async () => {
    vitest.stubEnv('E2E_TEST_HOOKS', '')
    expect((await GET(req())).status).toBe(404)
  })

  it('returns 404 for any value other than "1"', async () => {
    vitest.stubEnv('E2E_TEST_HOOKS', 'true')
    expect((await GET(req())).status).toBe(404)
  })

  it('returns the recorded code only when E2E_TEST_HOOKS=1', async () => {
    vitest.stubEnv('E2E_TEST_HOOKS', '1')
    const res = await GET(req())
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ email: 'hv01@example.com', code: '654321' })
  })
})
