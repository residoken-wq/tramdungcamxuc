export type PackageComponent = {
  quantity?: number | null
  unitValue?: number | null
  retailPrice?: number | null
}

export function computePackageValue({
  components,
  price,
  salePrice,
}: {
  components?: readonly PackageComponent[] | null
  price?: number | null
  salePrice?: number | null
}): { totalValue: number; discountPercent: number | null } {
  const totalValue = (components ?? []).reduce(
    (sum, component) => sum + (component.quantity ?? 0) * (component.unitValue ?? 0),
    0,
  )
  const sellingPrice = salePrice ?? price
  return {
    totalValue,
    discountPercent:
      totalValue === 0 || sellingPrice == null
        ? null
        : Math.max(0, Math.round(((totalValue - sellingPrice) / totalValue) * 100)),
  }
}
