import { describe, expect, it } from 'vitest'
import { sanitizeAnalyticsProps } from '../../src/lib/analytics/track'

// The component tests mock the track module; this one runs the real whitelist (T3-05c).
describe('card_shared analytics whitelist', () => {
  it('keeps only cardCode, format, platform and drops card content', () => {
    const out = sanitizeAnalyticsProps('card_shared', {
      cardCode: 'TEST-01',
      format: '4x5',
      platform: 'download',
      message: '[TEST] nội dung thẻ',
      note: '[TEST] ghi chú',
    })
    expect(out).toEqual({ cardCode: 'TEST-01', format: '4x5', platform: 'download' })
  })
})
