import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { ShopeeButton, type ShopeeButtonProps } from '@/components/site/ShopeeButton'
import { createProductExternalField } from '../product-field'

export interface ShopeeButtonBlockProps extends Omit<
  ShopeeButtonProps,
  'externalUrl' | 'shopeeStoreUrl'
> {
  productId?: string | number
  _resolved?: {
    externalUrl?: string | null
    shopeeStoreUrl?: string | null
  }
}

export const ShopeeButtonBlock: ComponentConfig<ShopeeButtonBlockProps> = {
  label: 'Nút Mua trên Shopee (Shopee Button)',
  fields: {
    mode: {
      type: 'select',
      label: 'Liên kết tới',
      options: [
        { label: 'Sản phẩm vật lý (dùng link Shopee của sản phẩm)', value: 'product' },
        { label: 'Gian hàng Shopee của Trạm (trong Cài đặt)', value: 'store' },
      ],
    },
    productId: createProductExternalField({
      label: 'Chọn sản phẩm vật lý (bộ thẻ cảm xúc...)',
      filterType: 'physical_external',
    }),
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
    mode: 'product',
    productId: '',
    label: 'Mua bộ thẻ trên Shopee',
    variant: 'primary',
    size: 'md',
    align: 'center',
  },
  render: ({ puck, _resolved, ...props }) => (
    <ShopeeButton
      {...props}
      externalUrl={_resolved?.externalUrl}
      shopeeStoreUrl={_resolved?.shopeeStoreUrl}
      puck={{ isEditing: puck?.isEditing ?? false }}
    />
  ),
}
