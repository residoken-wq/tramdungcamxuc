import type { ExternalField } from '@puckeditor/core'

export function createTestimonialExternalField<
  T extends string | number | undefined = string | number | undefined,
>(options?: { label?: string }): ExternalField<T> {
  const { label = 'Lời chia sẻ' } = options || {}

  return {
    type: 'external',
    label,
    placeholder: 'Chọn lời chia sẻ từ hệ thống...',
    showSearch: true,
    fetchList: async ({ query }: { query?: string }) => {
      try {
        const queryParams = [
          `limit=50`,
          `depth=0`,
          `where[consent][equals]=true`,
          `where[_status][equals]=published`,
        ]
        if (query) {
          queryParams.push(`where[name][like]=${encodeURIComponent(query)}`)
        }

        const res = await fetch(`/api/testimonials?${queryParams.join('&')}`, {
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
    mapRow: (item: { id?: string | number; name?: string; role?: string; quote?: string }) => ({
      'Người chia sẻ': item.name || '',
      'Vai trò': item.role || '',
      'Trích dẫn': item.quote ? item.quote.slice(0, 60) + '...' : '',
    }),
    getItemSummary: (item: unknown) => (item ? `Lời chia sẻ ID: ${String(item)}` : 'Chưa chọn'),
  }
}
