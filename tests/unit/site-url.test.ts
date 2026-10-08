// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { DEFAULT_SITE_URL, getSiteUrl } from '@/lib/site-url'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getSiteUrl', () => {
  it('defaults to https://tramdungcamxuc.com when no env variable is set', () => {
    vi.stubEnv('SITE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    expect(getSiteUrl()).toBe(DEFAULT_SITE_URL)
    expect(getSiteUrl()).toBe('https://tramdungcamxuc.com')
  })

  it('prioritizes SITE_URL over NEXT_PUBLIC_SITE_URL', () => {
    vi.stubEnv('SITE_URL', 'http://192.168.1.50:3400')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://tramdungcamxuc.com')
    expect(getSiteUrl()).toBe('http://192.168.1.50:3400')
  })

  it('falls back to NEXT_PUBLIC_SITE_URL when SITE_URL is not set or empty', () => {
    vi.stubEnv('SITE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://staging.example.com')
    expect(getSiteUrl()).toBe('https://staging.example.com')
  })

  it('adds https:// when protocol is missing', () => {
    vi.stubEnv('SITE_URL', 'demo.tramdungcamxuc.com')
    expect(getSiteUrl()).toBe('https://demo.tramdungcamxuc.com')

    vi.stubEnv('SITE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'fallback.example.org')
    expect(getSiteUrl()).toBe('https://fallback.example.org')
  })

  it('preserves http:// protocol if provided', () => {
    vi.stubEnv('SITE_URL', 'http://localhost:3000')
    expect(getSiteUrl()).toBe('http://localhost:3000')
  })

  it('removes trailing slashes', () => {
    vi.stubEnv('SITE_URL', 'https://tramdungcamxuc.com/')
    expect(getSiteUrl()).toBe('https://tramdungcamxuc.com')

    vi.stubEnv('SITE_URL', 'http://10.0.0.1:3400///')
    expect(getSiteUrl()).toBe('http://10.0.0.1:3400')
  })

  it('trims whitespace', () => {
    vi.stubEnv('SITE_URL', '   https://tramdungcamxuc.com/   ')
    expect(getSiteUrl()).toBe('https://tramdungcamxuc.com')
  })
})
