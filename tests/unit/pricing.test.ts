import { describe, expect, it } from 'vitest'
import { computePackageValue } from '../../src/lib/pricing'

describe('computePackageValue', () => {
  it.each([
    ['CLEAR', 1, 0, 0, 1750000, 2500000, 30],
    ['BUILD', 3, 1, 1, 2900000, 5800000, 50],
    ['SHINE', 6, 3, 1, 4320000, 10800000, 60],
  ] as const)(
    '%s matches the approved package',
    (_, coaching, career, community, price, totalValue, discountPercent) => {
      const components = [
        { quantity: 2, unitValue: 250000 },
        { quantity: 2, unitValue: 500000 },
        { quantity: coaching, unitValue: 1000000, retailPrice: 2200000 },
        { quantity: career, unitValue: 1000000, retailPrice: 1500000 },
        { quantity: community, unitValue: 300000 },
      ]
      expect(computePackageValue({ components, price })).toEqual({ totalValue, discountPercent })
      expect(
        computePackageValue({
          components: [
            { quantity: 1, unitValue: 250000 },
            { quantity: 1, unitValue: 250000 },
            ...components.slice(1),
          ],
          price,
        }),
      ).toEqual({ totalValue, discountPercent })
    },
  )

  it('uses salePrice, including zero, and rounds the discount', () => {
    const components = [{ quantity: 3, unitValue: 100 }]
    expect(computePackageValue({ components, price: 250, salePrice: 200 }).discountPercent).toBe(33)
    expect(computePackageValue({ components, price: 250, salePrice: 0 }).discountPercent).toBe(100)
    expect(computePackageValue({ components, price: 200, salePrice: null }).discountPercent).toBe(
      33,
    )
  })

  it('handles missing prices, empty components, zero value and higher prices', () => {
    expect(computePackageValue({})).toEqual({ totalValue: 0, discountPercent: null })
    expect(computePackageValue({ components: [], price: 10 })).toEqual({
      totalValue: 0,
      discountPercent: null,
    })
    expect(
      computePackageValue({ components: [{ quantity: 1, unitValue: 100 }] }).discountPercent,
    ).toBeNull()
    expect(
      computePackageValue({ components: [{ quantity: 1, unitValue: 100 }], price: 200 })
        .discountPercent,
    ).toBe(0)
    expect(computePackageValue({ components: [{ quantity: null, unitValue: 100 }, {}] })).toEqual({
      totalValue: 0,
      discountPercent: null,
    })
  })

  it('does not mutate its input', () => {
    const input = Object.freeze({
      components: Object.freeze([Object.freeze({ quantity: 2, unitValue: 100 })]),
      price: 100,
    })
    expect(computePackageValue(input)).toEqual({ totalValue: 200, discountPercent: 50 })
  })
})
