import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { ProductFeature, type ProductFeatureProps } from '@/components/site/ProductFeature'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { createProductExternalField } from '../product-field'

export type { ProductFeatureProps }

export const ProductFeatureBlock: ComponentConfig<ProductFeatureProps> = {
  label: 'Sản phẩm nổi bật (Product Feature)',
  fields: {
    productId: createProductExternalField({ label: 'Chọn sản phẩm nổi bật' }),
    layout: {
      type: 'select',
      label: 'Bố cục hiển thị',
      options: [
        { label: 'Ảnh bên trái, chữ bên phải', value: 'image-left' },
        { label: 'Ảnh bên phải, chữ bên trái', value: 'image-right' },
      ],
    },
    bgColor: {
      type: 'select',
      label: 'Màu nền',
      options: [...BRAND_COLOR_OPTIONS],
    },
    padding: {
      type: 'select',
      label: 'Khoảng đệm (Padding)',
      options: [...PADDING_OPTIONS],
    },
  },
  defaultProps: {
    version: 1,
    productId: '',
    layout: 'image-left',
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  // Pass only serialisable props: Puck's `puck` object holds functions that cannot cross into a client component.
  render: ({ puck, ...props }) => (
    <ProductFeature {...props} puck={{ isEditing: puck?.isEditing ?? false }} />
  ),
}
