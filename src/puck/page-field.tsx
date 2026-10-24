import React from 'react'
import type { ExternalField } from '@puckeditor/core'
import { RecordSummary } from './record-summary'

export function createPageExternalField<
  T extends string | number | undefined = string | number | undefined,
>(options?: { label?: string }): ExternalField<T> {
  const { label = 'Trang trong website' } = options || {}

  return {
    type: 'external',
    label,
    placeholder: 'Chọn trang từ danh sách...',
    showSearch: true,
    fetchList: async ({ query }: { query?: string }) => {
      try {
        const queryParams = [`limit=50`, `depth=0`]
        if (query) {
          queryParams.push(`where[title][like]=${encodeURIComponent(query)}`)
        }

        const res = await fetch(`/api/pages?${queryParams.join('&')}`, {
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
    mapRow: (item: { id?: string | number; title?: string; slug?: string }) => ({
      'Tiêu đề': item.title || '',
      'Đường dẫn (slug)': item.slug || '',
    }),
    getItemSummary: (id: unknown) =>
      id ? <RecordSummary collection="pages" id={String(id)} /> : 'Chưa chọn',
  }
}
