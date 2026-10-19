import type { ExternalField } from '@puckeditor/core'

export function createServiceExternalField<
  T extends string | number | undefined = string | number | undefined,
>(options?: { label?: string }): ExternalField<T> {
  const { label = 'Dịch vụ đồng hành' } = options || {}

  return {
    type: 'external',
    label,
    placeholder: 'Chọn dịch vụ từ hệ thống...',
    showSearch: true,
    fetchList: async ({ query }: { query?: string }) => {
      try {
        const queryParams = [`limit=50`, `depth=0`]
        if (query) {
          queryParams.push(`where[name][like]=${encodeURIComponent(query)}`)
        }

        const res = await fetch(`/api/services?${queryParams.join('&')}`, {
          credentials: 'include',
        })
        if (!res.ok) return []
        const data = await res.json()
        return data.docs || []
      } catch {
        return []
      }
    },
    mapProp: (item: { id?: string | number }): T => (item?.id != null ? String(item.id) : '') as T,
    mapRow: (item: { id?: string | number; name?: string; saleStatus?: string }) => ({
      'Tên dịch vụ': item.name || '',
      'Trạng thái': item.saleStatus || '',
    }),
    getItemSummary: (item: unknown) => (item ? `Dịch vụ ID: ${String(item)}` : 'Chưa chọn'),
  }
}
