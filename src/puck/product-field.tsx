import type { ExternalField } from '@puckeditor/core'

export function createProductExternalField<
  T extends string | number | undefined = string | number | undefined,
>(options?: {
  label?: string
  filterType?: string
}): ExternalField<T> {
  const { label = 'Sản phẩm', filterType } = options || {}

  return {
    type: 'external',
    label,
    placeholder: 'Chọn sản phẩm từ hệ thống...',
    showSearch: true,
    fetchList: async ({ query }: { query?: string }) => {
      try {
        const queryParams = [`limit=50`, `depth=0`]
        if (query) {
          queryParams.push(`where[name][like]=${encodeURIComponent(query)}`)
        }
        if (filterType) {
          queryParams.push(`where[type][equals]=${encodeURIComponent(filterType)}`)
        }

        const res = await fetch(`/api/products?${queryParams.join('&')}`, {
          credentials: 'include',
        })
        if (!res.ok) return []
        const data = await res.json()
        return data.docs || []
      } catch {
        return []
      }
    },
    mapProp: (item: { id?: string | number }): T =>
      (item?.id != null ? String(item.id) : '') as T,
    mapRow: (item: {
      id?: string | number
      name?: string
      type?: string
      saleStatus?: string
    }) => ({
      'Tên sản phẩm': item.name || '',
      'Phân loại': item.type || '',
      'Trạng thái': item.saleStatus || '',
    }),
    getItemSummary: (item: unknown) => (item ? `Sản phẩm ID: ${String(item)}` : 'Chưa chọn'),
  }
}
