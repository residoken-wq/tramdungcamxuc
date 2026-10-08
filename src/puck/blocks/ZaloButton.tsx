import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { ZaloButton, type ZaloButtonProps } from '@/components/site/ZaloButton'

export interface ZaloButtonBlockProps extends Omit<
  ZaloButtonProps,
  'zaloChatUrl' | 'zaloGroupUrl'
> {
  _resolved?: {
    zaloChatUrl?: string | null
    zaloGroupUrl?: string | null
  }
}

export const ZaloButtonBlock: ComponentConfig<ZaloButtonBlockProps> = {
  label: 'Nút Kết nối Zalo (Zalo Button)',
  fields: {
    target: {
      type: 'select',
      label: 'Kênh kết nối',
      options: [
        { label: 'Trò chuyện riêng (zaloChatUrl)', value: 'chat' },
        { label: 'Cộng đồng / Nhóm Zalo (zaloGroupUrl)', value: 'group' },
      ],
    },
    label: { type: 'text', label: 'Chữ hiển thị trên nút' },
    variant: {
      type: 'select',
      label: 'Kiểu dáng nút',
      options: [
        { label: 'Chính (Hồng nhấn - Primary)', value: 'primary' },
        { label: 'Phụ (Xanh thẫm - Secondary)', value: 'secondary' },
        { label: 'Viền mảnh (Ghost)', value: 'ghost' },
      ],
    },
    size: {
      type: 'select',
      label: 'Kích thước',
      options: [
        { label: 'Nhỏ (S - 44px)', value: 'sm' },
        { label: 'Vừa (M - 48px)', value: 'md' },
        { label: 'Lớn (L - 56px)', value: 'lg' },
      ],
    },
    align: {
      type: 'select',
      label: 'Căn lề',
      options: [
        { label: 'Căn giữa', value: 'center' },
        { label: 'Căn trái', value: 'left' },
        { label: 'Căn phải', value: 'right' },
      ],
    },
  },
  defaultProps: {
    version: 1,
    target: 'chat',
    label: 'Nhắn tin qua Zalo',
    variant: 'secondary',
    size: 'md',
    align: 'center',
  },
  render: ({ puck, _resolved, ...props }) => (
    <ZaloButton
      {...props}
      zaloChatUrl={_resolved?.zaloChatUrl}
      zaloGroupUrl={_resolved?.zaloGroupUrl}
      puck={{ isEditing: puck?.isEditing ?? false }}
    />
  ),
}
