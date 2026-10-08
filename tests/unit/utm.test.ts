import { describe, expect, it } from 'vitest'
import { appendUtmParams } from '@/lib/utm'

describe('appendUtmParams helper', () => {
  it('handles empty and special links gracefully', () => {
    expect(appendUtmParams('', { source: 'tramdungcamxuc' })).toBe('')
    expect(appendUtmParams('#', { source: 'tramdungcamxuc' })).toBe('#')
    expect(appendUtmParams('javascript:void(0)', { source: 'tramdungcamxuc' })).toBe(
      'javascript:void(0)',
    )
  })

  it('appends UTM parameters to an absolute URL without existing query', () => {
    const result = appendUtmParams('https://shopee.vn/product/123456', {
      source: 'tramdungcamxuc',
      medium: 'website',
      campaign: 'gioi-thieu',
    })
    expect(result).toBe(
      'https://shopee.vn/product/123456?utm_source=tramdungcamxuc&utm_medium=website&utm_campaign=gioi-thieu',
    )
  })

  it('appends UTM parameters while preserving existing queries', () => {
    const result = appendUtmParams('https://shopee.vn/product/123456?ref=homepage&sp_atk=abc', {
      source: 'tramdungcamxuc',
      medium: 'website',
      campaign: 'growth-mirror',
    })
    expect(result).toBe(
      'https://shopee.vn/product/123456?ref=homepage&sp_atk=abc&utm_source=tramdungcamxuc&utm_medium=website&utm_campaign=growth-mirror',
    )
  })

  it('does not duplicate or overwrite existing UTM parameters', () => {
    const result = appendUtmParams(
      'https://shopee.vn/shop/hana?utm_source=custom_source&utm_campaign=special',
      {
        source: 'tramdungcamxuc',
        medium: 'website',
        campaign: 'growth-mirror',
      },
    )
    expect(result).toBe(
      'https://shopee.vn/shop/hana?utm_source=custom_source&utm_campaign=special&utm_medium=website',
    )
  })

  it('preserves hash fragments after appended UTM parameters', () => {
    const result = appendUtmParams('https://example.com/details#section-reviews', {
      source: 'tramdungcamxuc',
      medium: 'website',
      campaign: 'home',
    })
    expect(result).toBe(
      'https://example.com/details?utm_source=tramdungcamxuc&utm_medium=website&utm_campaign=home#section-reviews',
    )
  })

  it('supports relative paths correctly', () => {
    const result = appendUtmParams('/san-pham/the-eq', {
      source: 'tramdungcamxuc',
      medium: 'website',
      campaign: 'eq-buddy',
    })
    expect(result).toBe(
      '/san-pham/the-eq?utm_source=tramdungcamxuc&utm_medium=website&utm_campaign=eq-buddy',
    )
  })
})
