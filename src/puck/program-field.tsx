import React from 'react'
import type { ExternalField } from '@puckeditor/core'
import { RecordSummary } from './record-summary'

export function createProgramExternalField<
  T extends string | number | undefined = string | number | undefined,
>(options?: { label?: string }): ExternalField<T> {
  const { label = 'Chương trình doanh nghiệp' } = options || {}

  return {
    type: 'external',
    label,
    placeholder: 'Chọn chương trình từ hệ thống...',
    showSearch: true,
    fetchList: async ({ query }: { query?: string }) => {
      try {
        const queryParams = [`limit=50`, `depth=0`]
        if (query) {
          queryParams.push(`where[name][like]=${encodeURIComponent(query)}`)
        }

        const res = await fetch(`/api/programs?${queryParams.join('&')}`, {
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
      'Tên chương trình': item.name || '',
      'Trạng thái': item.saleStatus || '',
    }),
    getItemSummary: (id: unknown) =>
      id ? <RecordSummary collection="programs" id={String(id)} /> : 'Chưa chọn',
  }
}
