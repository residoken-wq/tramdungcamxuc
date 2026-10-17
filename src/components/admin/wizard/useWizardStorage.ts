'use client'

import { useEffect, useState } from 'react'
import { vi } from '@/lib/i18n/vi'

interface UseWizardStorageOptions<T> {
  key: string
  initialData: T
}

export function useWizardStorage<T>({ key, initialData }: UseWizardStorageOptions<T>) {
  const [data, setData] = useState<T>(initialData)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // 1. Khôi phục nháp từ localStorage an toàn sau khi mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(key)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed && typeof parsed === 'object') {
            setData((prev) => ({ ...prev, ...parsed }))
            setIsDirty(true)
          }
        }
      } catch {
        // Bỏ qua lỗi trong chế độ ẩn danh hoặc khi cookie/storage bị chặn
      } finally {
        setIsLoaded(true)
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [key])

  // Lưu vào localStorage an toàn
  const updateData = (updater: Partial<T> | ((prev: T) => T)) => {
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
  }

  // Xóa nháp tạm khỏi localStorage
  const clearStorage = () => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(key)
      } catch {
        // ignore
      }
    }
    setData(initialData)
    setIsDirty(false)
  }

  // Đánh dấu đã submit thành công để không cảnh báo rời trang
  const markSubmitted = () => {
    setIsSubmitted(true)
    setIsDirty(false)
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(key)
      } catch {
        // ignore
      }
    }
  }

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
    isLoaded,
  }
}
