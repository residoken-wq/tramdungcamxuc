import { vi } from '@/lib/i18n/vi'

export function useDefaultCopyField() {
  return {
    type: 'select' as const,
    label: vi.bx05.useDefaultCopyLabel,
    options: [
      { label: 'Tắt (ô để trống thì ẩn)', value: false },
      { label: 'Bật (dùng chữ mặc định)', value: true },
    ],
  }
}
