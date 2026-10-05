// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest'
import { proxy } from '@/proxy'
import robots from '@/app/robots'

afterEach(() => vi.unstubAllEnvs())

test('demo indexing policy follows runtime configuration in both directions', () => {
  vi.stubEnv('SITE_NOINDEX', 'true')
  expect(proxy().headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
  expect(robots().rules).toEqual({ userAgent: '*', disallow: '/' })
  vi.stubEnv('SITE_NOINDEX', '')
  expect(proxy().headers.has('X-Robots-Tag')).toBe(false)
  expect(robots().rules).toEqual({ userAgent: '*', allow: '/' })
})
