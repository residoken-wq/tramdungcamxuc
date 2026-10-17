'use server'

import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { isAdminUser } from '@/lib/auth/access'
import { vi } from '@/lib/i18n/vi'
import { validateProductWizardData, type ProductWizardInput } from './product-wizard-schema'

export interface CreateProductWizardResult {
  success: boolean
  docId?: number | string
  error?: string
}

export interface MediaOption {
  id: number | string
  url: string
  alt: string
  filename?: string
}

export interface ProductOption {
  id: number | string
  name: string
  type: string
}

// REVIEW-REQUIRED: Server action tạo sản phẩm từ wizard.
// Kiểm tra nghiêm ngặt phiên admin (chỉ editor hoặc owner mới được phép tạo sản phẩm).
// Xác thực schema Zod theo từng loại sản phẩm.
// Gọi payload.create / payload.update với user và KHÔNG dùng overrideAccess để kích hoạt
// toàn bộ hook tính toán (computePackageValue) và kiểm tra nghiệp vụ của CM-03 (validatePriceOnSale, validateCoverImageOnSale).
export async function createProductFromWizard(
  data: ProductWizardInput,
  options: { publish: boolean; docId?: number | string } = { publish: false },
): Promise<CreateProductWizardResult> {
  try {
    const headers = await getHeaders()
    const payload = await getPayload({ config: await config })

    // Xác thực người dùng trên server
    const { user } = await payload.auth({ headers })
    if (!user || !isAdminUser(user)) {
      return {
        success: false,
        error: vi.cms.wizard.errors.unauthorized,
      }
    }

    // Validate dữ liệu theo Zod
    const validation = validateProductWizardData(data, { publish: options.publish })
    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
      }
    }

    const validData = validation.data

    // Chuẩn bị payload data tương thích với schema collection 'products'
    const payloadData: Record<string, unknown> = {
      name: validData.name.trim(),
      slug: validData.slug.trim(),
      type: validData.type,
      web: validData.web,
      saleStatus: validData.saleStatus,
      isSample: validData.isSample ?? false,
    }

    if (validData.shortDescription !== undefined && validData.shortDescription !== null) {
      payloadData.shortDescription = validData.shortDescription.trim()
    }
    if (validData.journeyStep) {
      payloadData.journeyStep = validData.journeyStep
    }
    if (validData.coverImage) {
      payloadData.coverImage = validData.coverImage
    }
    if (validData.price != null && !Number.isNaN(validData.price)) {
      payloadData.price = Number(validData.price)
    }
    if (validData.salePrice != null && !Number.isNaN(validData.salePrice)) {
      payloadData.salePrice = Number(validData.salePrice)
    }
    if (validData.saleEndsAt) {
      payloadData.saleEndsAt = validData.saleEndsAt
    }
    if (validData.trialDays != null) {
      payloadData.trialDays = Number(validData.trialDays)
    }
    if (validData.accessDurationDays != null) {
      payloadData.accessDurationDays = Number(validData.accessDurationDays)
    }
    if (validData.ctaType) {
      payloadData.ctaType = validData.ctaType
    }
    if (validData.ctaLabel) {
      payloadData.ctaLabel = validData.ctaLabel.trim()
    }
    if (validData.externalUrl) {
      payloadData.externalUrl = validData.externalUrl.trim()
    }
    if (validData.externalLabel) {
      payloadData.externalLabel = validData.externalLabel.trim()
    }
    if (validData.painPoint) {
      payloadData.painPoint = validData.painPoint.trim()
    }
    if (validData.outcome) {
      payloadData.outcome = validData.outcome.trim()
    }

    if (Array.isArray(validData.includes) && validData.includes.length > 0) {
      payloadData.includes = validData.includes
        .filter((inc) => inc.text && inc.text.trim().length > 0)
        .map((inc) => ({ text: inc.text.trim() }))
    }

    if (Array.isArray(validData.faq) && validData.faq.length > 0) {
      payloadData.faq = validData.faq
        .filter((f) => f.question && f.question.trim().length > 0)
        .map((f) => ({
          question: f.question.trim(),
          answer: f.answer ? f.answer.trim() : '',
        }))
    }

    if (validData.type === 'package' && Array.isArray(validData.components)) {
      payloadData.components = validData.components.map((c) => ({
        label: c.label.trim(),
        quantity: Number(c.quantity),
        unitValue: Number(c.unitValue),
        retailPrice: c.retailPrice != null ? Number(c.retailPrice) : undefined,
        grantsProduct: c.grantsProduct || undefined,
      }))
    }

    // Nếu đã có docId (đã lưu nháp trước đó), gọi update; ngược lại gọi create
    const isDraft = !options.publish
    if (options.docId) {
      const updatedDoc = isDraft
        ? await payload.update({
            collection: 'products',
            id: options.docId,
            data: payloadData as any,
            draft: true,
            user,
            overrideAccess: false,
          })
        : await payload.update({
            collection: 'products',
            id: options.docId,
            data: payloadData as any,
            draft: false,
            user,
            overrideAccess: false,
          })
      return {
        success: true,
        docId: updatedDoc.id,
      }
    } else {
      const createdDoc = isDraft
        ? await payload.create({
            collection: 'products',
            data: payloadData as any,
            draft: true,
            user,
            overrideAccess: false,
          })
        : await payload.create({
            collection: 'products',
            data: payloadData as any,
            draft: false,
            user,
            overrideAccess: false,
          })
      return {
        success: true,
        docId: createdDoc.id,
      }
    }
  } catch (error: unknown) {
    const err = error as {
      message?: string
      data?: { errors?: Array<{ message?: string }> }
    }
    let errorMessage = err?.message || vi.cms.wizard.errors.createFailed
    if (err?.data?.errors && err.data.errors.length > 0) {
      errorMessage = err.data.errors
        .map((e) => e.message)
        .filter(Boolean)
        .join('. ')
    }
    return {
      success: false,
      error: errorMessage,
    }
  }
}

// REVIEW-REQUIRED: Server action lưu nháp tạm từ wizard (dùng cho bước 5 xem trước).
export async function saveProductDraftFromWizard(
  data: ProductWizardInput,
  existingDocId?: number | string,
): Promise<CreateProductWizardResult> {
  return createProductFromWizard(data, { publish: false, docId: existingDocId })
}

// REVIEW-REQUIRED: Server action lấy danh sách sản phẩm để chọn cấp quyền trong gói đồng hành.
export async function getProductListForWizard(): Promise<{
  success: boolean
  products: ProductOption[]
  error?: string
}> {
  try {
    const headers = await getHeaders()
    const payload = await getPayload({ config: await config })
    const { user } = await payload.auth({ headers })
    if (!user || !isAdminUser(user)) {
      return { success: false, products: [], error: vi.cms.wizard.errors.unauthorized }
    }

    const result = await payload.find({
      collection: 'products',
      limit: 100,
      sort: 'name',
      draft: true,
      user,
      overrideAccess: false,
      select: {
        id: true,
        name: true,
        type: true,
      },
    })

    const products: ProductOption[] = result.docs.map((doc) => ({
      id: doc.id,
      name: String(doc.name || ''),
      type: String(doc.type || ''),
    }))

    return { success: true, products }
  } catch (err: unknown) {
    return { success: false, products: [], error: (err as Error).message }
  }
}

// REVIEW-REQUIRED: Server action lấy danh sách media để chọn ảnh bìa.
export async function getMediaListForWizard(): Promise<{
  success: boolean
  media: MediaOption[]
  error?: string
}> {
  try {
    const headers = await getHeaders()
    const payload = await getPayload({ config: await config })
    const { user } = await payload.auth({ headers })
    if (!user || !isAdminUser(user)) {
      return { success: false, media: [], error: vi.cms.wizard.errors.unauthorized }
    }

    const result = await payload.find({
      collection: 'media',
      limit: 50,
      sort: '-createdAt',
      user,
      overrideAccess: false,
    })

    const media: MediaOption[] = result.docs
      .filter((doc) => doc.url)
      .map((doc) => ({
        id: doc.id,
        url: String(doc.url || ''),
        alt: String(doc.alt || ''),
        filename: doc.filename ? String(doc.filename) : undefined,
      }))

    return { success: true, media }
  } catch (err: unknown) {
    return { success: false, media: [], error: (err as Error).message }
  }
}
