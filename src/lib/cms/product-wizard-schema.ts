import { z } from 'zod'
import { PRODUCT_TYPES } from './product-form'
import { vi } from '../i18n/vi'

export const productWizardComponentSchema = z.object({
  label: z.string().min(1, 'Tên cấu phần không được để trống'),
  quantity: z.number().int().min(1, 'Số lượng tối thiểu là 1'),
  unitValue: z.number().min(0, 'Đơn giá không được âm'),
  retailPrice: z.number().min(0, 'Giá lẻ không được âm').nullable().optional(),
  grantsProduct: z.union([z.number(), z.string()]).nullable().optional(),
})

export const productWizardIncludeSchema = z.object({
  text: z.string().min(1, 'Nội dung mục không được để trống'),
})

export const productWizardFaqSchema = z.object({
  question: z.string().min(1, 'Câu hỏi không được để trống'),
  answer: z.string().optional().default(''),
})

export const productWizardBaseSchema = z.object({
  // Bước 1: Chọn loại
  type: z.enum(PRODUCT_TYPES, {
    errorMap: () => ({ message: vi.cms.wizard.errors.missingType }),
  }),

  // Bước 2: Thông tin cơ bản
  name: z.string().min(1, vi.cms.wizard.errors.missingName).max(255),
  slug: z
    .string()
    .min(1, vi.cms.wizard.errors.missingSlug)
    .regex(/^[a-z0-9-]+$/, 'Đường dẫn chỉ dùng chữ thường không dấu, số và dấu gạch ngang (-)'),
  web: z.enum(['site', 'habit', 'eq'], {
    errorMap: () => ({ message: 'Vui lòng chọn khu vực web hợp lệ' }),
  }),
  shortDescription: z.string().optional().nullable(),
  journeyStep: z.enum(['pause', 'feel', 'name', 'choose', 'practice']).optional().nullable(),
  coverImage: z.union([z.number(), z.string()]).optional().nullable(),

  // Bước 3: Giá & cách bán
  saleStatus: z.enum(['on_sale', 'free', 'coming_soon', 'consult', 'hidden']).default('on_sale'),
  price: z.number().min(0, 'Giá bán không được âm').optional().nullable(),
  salePrice: z.number().min(0, 'Giá ưu đãi không được âm').optional().nullable(),
  saleEndsAt: z.string().optional().nullable(),
  trialDays: z.number().int().min(0).optional().nullable(),
  accessDurationDays: z.number().int().min(0).optional().nullable(),
  ctaType: z.enum(['buy', 'download', 'book', 'contact', 'external']).optional().nullable(),
  ctaLabel: z.string().optional().nullable(),
  externalUrl: z.string().optional().nullable(),
  externalLabel: z.string().optional().nullable(),
  components: z.array(productWizardComponentSchema).optional().nullable(),

  // Bước 4: Nội dung trang
  includes: z.array(productWizardIncludeSchema).optional().nullable(),
  painPoint: z.string().optional().nullable(),
  outcome: z.string().optional().nullable(),
  faq: z.array(productWizardFaqSchema).optional().nullable(),
})

export type ProductWizardInput = z.infer<typeof productWizardBaseSchema>

/**
 * Validate dữ liệu đầu vào theo loại sản phẩm và chế độ lưu (nháp / xuất bản).
 * Khi `publish: true`, kiểm tra nghiêm ngặt theo các quy tắc của CM-03:
 * - Sản phẩm `on_sale` (trừ Shopee) bắt buộc phải có giá bán (price).
 * - Sản phẩm `on_sale` bắt buộc phải có ảnh bìa (coverImage).
 * - Loại package nếu có components thì từng cấu phần phải hợp lệ.
 */
export function validateProductWizardData(
  data: unknown,
  options: { publish: boolean } = { publish: false },
):
  | { success: true; data: ProductWizardInput }
  | { success: false; error: string; issues?: z.ZodIssue[] } {
  const parseResult = productWizardBaseSchema.safeParse(data)
  if (!parseResult.success) {
    const firstIssue = parseResult.error.issues[0]
    return {
      success: false,
      error: firstIssue?.message || vi.cms.wizard.errors.invalidData,
      issues: parseResult.error.issues,
    }
  }

  const validData = parseResult.data

  if (options.publish) {
    // Kiểm tra giá bán khi xuất bản sản phẩm đang mở bán (on_sale)
    if (validData.saleStatus === 'on_sale' && validData.type !== 'physical_external') {
      if (
        validData.price == null ||
        typeof validData.price !== 'number' ||
        Number.isNaN(validData.price)
      ) {
        return {
          success: false,
          error: vi.cms.productForm.validation.missingPriceOnSale,
        }
      }
    }

    // Kiểm tra ảnh bìa khi xuất bản sản phẩm đang mở bán
    if (validData.saleStatus === 'on_sale') {
      if (!validData.coverImage) {
        return {
          success: false,
          error: vi.cms.productForm.validation.missingCoverImageOnSale,
        }
      }
    }

    // Kiểm tra đường dẫn liên kết ngoài cho sản phẩm Shopee
    if (validData.type === 'physical_external') {
      if (!validData.externalUrl || validData.externalUrl.trim().length === 0) {
        return {
          success: false,
          error: 'Sản phẩm trên Shopee bắt buộc phải có liên kết gian hàng Shopee.',
        }
      }
    }
  }

  return { success: true, data: validData }
}
