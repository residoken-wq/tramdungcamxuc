import type { ProductType } from './product-form'

export interface ProductTypeTemplate {
  type: ProductType
  web: 'site' | 'habit' | 'eq'
  saleStatus: 'on_sale' | 'free' | 'coming_soon' | 'consult' | 'hidden'
  trialDays?: number | null
  accessDurationDays?: number | null
  ctaType?: 'buy' | 'download' | 'book' | 'contact' | 'external'
  ctaLabel?: string
  externalUrl?: string
  externalLabel?: string
  /**
   * Lưu ý quan trọng: Mọi loại sản phẩm TUYỆT ĐỐI KHÔNG điền sẵn giá (price / salePrice)
   * Giá bán do Hana tự quyết định và nhập tay theo AGENTS.md mục 2.3.
   */
  price?: undefined
  salePrice?: undefined
}

export const PRODUCT_TYPE_TEMPLATES: Record<ProductType, ProductTypeTemplate> = {
  digital_tool: {
    type: 'digital_tool',
    web: 'habit',
    saleStatus: 'on_sale',
    trialDays: 21,
    accessDurationDays: null, // Vĩnh viễn (đã chốt 10/10/2026)
    ctaType: 'buy',
    ctaLabel: 'Mua ngay',
  },
  ebook: {
    type: 'ebook',
    web: 'site',
    saleStatus: 'free',
    trialDays: null,
    accessDurationDays: null,
    ctaType: 'download',
    ctaLabel: 'Tải sách miễn phí',
  },
  toolkit: {
    type: 'toolkit',
    web: 'site',
    saleStatus: 'free',
    trialDays: null,
    accessDurationDays: null,
    ctaType: 'download',
    ctaLabel: 'Nhận tài nguyên',
  },
  package: {
    type: 'package',
    web: 'site',
    saleStatus: 'on_sale',
    trialDays: null,
    accessDurationDays: null,
    ctaType: 'buy',
    ctaLabel: 'Đăng ký gói',
  },
  physical_external: {
    type: 'physical_external',
    web: 'eq',
    saleStatus: 'on_sale',
    trialDays: null,
    accessDurationDays: null,
    ctaType: 'external',
    ctaLabel: 'Xem trên Shopee',
    externalLabel: 'Mua trên Shopee',
    externalUrl: '',
  },
  coaching_trial: {
    type: 'coaching_trial',
    web: 'site',
    saleStatus: 'on_sale',
    trialDays: null,
    accessDurationDays: null,
    ctaType: 'book',
    ctaLabel: 'Đặt lịch trải nghiệm',
    externalLabel: 'Đặt lịch hẹn',
  },
  workshop: {
    type: 'workshop',
    web: 'habit',
    saleStatus: 'on_sale',
    trialDays: null,
    accessDurationDays: null,
    ctaType: 'buy',
    ctaLabel: 'Đăng ký tham gia',
    externalLabel: 'Đăng ký tham gia',
  },
  community: {
    type: 'community',
    web: 'site',
    saleStatus: 'on_sale',
    trialDays: null,
    accessDurationDays: null,
    ctaType: 'buy',
    ctaLabel: 'Tham gia cộng đồng',
    externalLabel: 'Tham gia ngay',
  },
  b2b: {
    type: 'b2b',
    web: 'site',
    saleStatus: 'consult',
    trialDays: null,
    accessDurationDays: null,
    ctaType: 'external',
    ctaLabel: 'Liên hệ tư vấn',
    externalLabel: 'Liên hệ hợp tác',
  },
}

/**
 * Lấy mẫu thiết lập mặc định theo loại sản phẩm.
 * Hàm này luôn trả về bản sao mới (shallow clone) để tránh đột biến mẫu gốc.
 */
export function getProductTemplate(type: ProductType): ProductTypeTemplate {
  const template = PRODUCT_TYPE_TEMPLATES[type]
  if (!template) {
    throw new Error(`Loại sản phẩm không hợp lệ: "${type}"`)
  }
  return { ...template }
}
