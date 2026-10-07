import React from 'react'
import type { ExternalField } from '@puckeditor/core'

export function createMediaExternalField<
  T extends string | number | undefined = string | number | undefined,
>(options?: { label?: string; placeholder?: string }): ExternalField<T> {
  const { label = 'Ảnh (Thư viện media)', placeholder = 'Chọn ảnh từ thư viện media...' } =
    options || {}

  return {
    type: 'external',
    label,
    placeholder,
    showSearch: true,
    fetchList: async ({ query }: { query?: string }) => {
      try {
        const searchParam = query ? `&where[alt][like]=${encodeURIComponent(query)}` : ''
        const res = await fetch(`/api/media?limit=50&depth=0${searchParam}`, {
          credentials: 'include',
        })
        if (!res.ok) return []
        const data = await res.json()
        const docs = (data.docs || []).filter(
          (doc: { alt?: string }) =>
            doc.alt && typeof doc.alt === 'string' && doc.alt.trim().length > 0,
        )
        return docs
      } catch {
        return []
      }
    },
    mapProp: (item: { id?: string | number }): T => (item?.id != null ? String(item.id) : '') as T,
    mapRow: (item: { url?: string; thumbnailURL?: string; alt?: string; filename?: string }) => ({
      'Hình ảnh': (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.url || item.thumbnailURL || ''}
          alt={item.alt || ''}
          style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }}
        />
      ),
      'Mô tả (alt)': item.alt || '',
      'Tên file': item.filename || '',
    }),
    getItemSummary: (id: unknown) => (id ? `Media ID: ${String(id)}` : 'Chưa chọn ảnh'),
  }
}
