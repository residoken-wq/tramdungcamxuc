import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { ProductPriceTag, type ProductPriceTagProps } from '@/components/site/ProductPriceTag'
import { createProductExternalField } from '../product-field'

export type { ProductPriceTagProps }

export const PriceTagBlock: ComponentConfig<ProductPriceTagProps> = {
  label: 'Thẻ giá sản phẩm (Price Tag)',
  fields: {
    productId: createProductExternalField({ label: 'Chọn sản phẩm' }),
    size: {
      type: 'select',
      label: 'Kích thước thẻ giá',
      options: [
        { label: 'Nhỏ (S)', value: 'sm' },
        { label: 'Vừa (M)', value: 'md' },
        { label: 'Lớn (L)', value: 'lg' },
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
    productId: '',
    size: 'md',
    align: 'center',
  },
  // Pass only serialisable props: Puck's `puck` object holds functions that cannot cross into a client component.
  render: ({ puck, ...props }) => (
    <ProductPriceTag {...props} puck={{ isEditing: puck?.isEditing ?? false }} />
  ),
}
