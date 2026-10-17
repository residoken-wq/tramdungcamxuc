'use client'

import { useCallback, useEffect, useState } from 'react'
import { vi } from '@/lib/i18n/vi'

interface UseWizardStorageOptions<T> {
  key: string
  initialData: T
}

export function useWizardStorage<T>({ key, initialData }: UseWizardStorageOptions<T>) {
  // Đọc từ localStorage an toàn với try / catch
  const [data, setData] = useState<T>(() => {
    if (typeof window === 'undefined') return initialData
    try {
      const stored = window.localStorage.getItem(key)
      if (stored) {
        return { ...initialData, ...JSON.parse(stored) }
      }
    } catch {
      // Bỏ qua lỗi trong chế độ ẩn danh hoặc khi cookie/storage bị chặn
    }
    return initialData
  })

  const [isDirty, setIsDirty] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Lưu vào localStorage an toàn
  const updateData = useCallback(
    (updater: Partial<T> | ((prev: T) => T)) => {
      setData((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(key, JSON.stringify(next))
          } catch {
            // QuotaExceededError hoặc Storage disabled
          }
        }
        setIsDirty(true)
        return next
      })
    },
    [key],
  )

  // Xóa nháp tạm khỏi localStorage
  const clearStorage = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(key)
      } catch {
        // ignore
      }
    }
    setData(initialData)
    setIsDirty(false)
  }, [key, initialData])

  // Đánh dấu đã submit thành công để không cảnh báo rời trang
  const markSubmitted = useCallback(() => {
    setIsSubmitted(true)
    setIsDirty(false)
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(key)
      } catch {
        // ignore
      }
    }
  }, [key])

  // Cảnh báo rời trang khi có dữ liệu chưa lưu
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty && !isSubmitted) {
        event.preventDefault()
        event.returnValue = vi.cms.wizard.confirm.unsavedChanges
        return vi.cms.wizard.confirm.unsavedChanges
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isDirty, isSubmitted])

  return {
    data,
    updateData,
    clearStorage,
    markSubmitted,
    isDirty,
  }
}
