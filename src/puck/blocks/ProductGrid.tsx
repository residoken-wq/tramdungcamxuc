import React from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { ProductGrid, type ProductGridProps } from '@/components/site/ProductGrid'
import { BRAND_COLOR_OPTIONS, PADDING_OPTIONS } from '../constants'
import { createProductExternalField } from '../product-field'

export type { ProductGridProps }

export const ProductGridBlock: ComponentConfig<ProductGridProps> = {
  label: 'Lưới sản phẩm (Product Grid)',
  fields: {
    mode: {
      type: 'select',
      label: 'Phương thức hiển thị',
      options: [
        { label: 'Chọn tay từng sản phẩm', value: 'manual' },
        { label: 'Theo bộ lọc tự động', value: 'filter' },
      ],
    },
    manualProducts: {
      type: 'array',
      label: 'Danh sách sản phẩm chọn tay',
      arrayFields: {
        productId: createProductExternalField({ label: 'Chọn sản phẩm' }),
      },
      getItemSummary: (item) => (item?.productId ? `Sản phẩm ID: ${item.productId}` : 'Chưa chọn'),
    },
    filterWeb: {
      type: 'select',
      label: 'Khu vực (Theo bộ lọc)',
      options: [
        { label: 'Tất cả khu vực', value: 'all' },
        { label: 'Trang chính (site)', value: 'site' },
        { label: 'Thói quen (habit)', value: 'habit' },
        { label: 'EQ Buddy (eq)', value: 'eq' },
      ],
    },
    filterType: {
      type: 'select',
      label: 'Loại sản phẩm (Theo bộ lọc)',
      options: [
        { label: 'Tất cả loại sản phẩm', value: 'all' },
        { label: 'Sách điện tử (ebook)', value: 'ebook' },
        { label: 'Bộ tài nguyên (toolkit)', value: 'toolkit' },
        { label: 'Công cụ số (digital_tool)', value: 'digital_tool' },
        { label: 'Sản phẩm trên Shopee (physical_external)', value: 'physical_external' },
        { label: 'Workshop', value: 'workshop' },
        { label: 'Cộng đồng (community)', value: 'community' },
        { label: 'Phiên trải nghiệm (coaching_trial)', value: 'coaching_trial' },
        { label: 'Gói đồng hành (package)', value: 'package' },
        { label: 'Doanh nghiệp (b2b)', value: 'b2b' },
      ],
    },
    limit: {
      type: 'select',
      label: 'Số lượng tối đa',
      options: [
        { label: '3 sản phẩm', value: 3 },
        { label: '6 sản phẩm', value: 6 },
        { label: '9 sản phẩm', value: 9 },
      ],
    },
    columns: {
      type: 'select',
      label: 'Số cột hiển thị (Máy tính)',
      options: [
        { label: '2 cột', value: 2 },
        { label: '3 cột', value: 3 },
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
    mode: 'manual',
    manualProducts: [],
    filterWeb: 'all',
    filterType: 'all',
    limit: 6,
    columns: 3,
    bgColor: 'warm-ivory',
    padding: 'md',
  },
  render: (props) => <ProductGrid {...props} />,
}
