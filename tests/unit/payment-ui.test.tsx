// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { BOOKING_PATH, getBookingPath, type PublicProduct } from '@/lib/products'
import { BookingCTA } from '@/components/site/BookingCTA'
import { experienceOrderSchema } from '@/lib/forms/schemas'
import { vi as viStrings } from '@/lib/i18n/vi'
import { getPublicOrderView } from '@/lib/payments/orders.server'
import { confirmManualPaymentAdminAction, cancelOrderAdminAction } from '@/lib/payments/actions'
import * as payloadModule from 'payload'

describe('Payment UI & Admin Action Guardrails (T1-12b)', () => {
  describe('BOOKING_PATH & BookingCTA with Product ID', () => {
    it('BOOKING_PATH points to /dat-phien-trai-nghiem', () => {
      expect(BOOKING_PATH).toBe('/dat-phien-trai-nghiem')
    })

    it('getBookingPath appends ?san-pham=<id> when product ID is provided', () => {
      expect(getBookingPath(42)).toBe('/dat-phien-trai-nghiem?san-pham=42')
      expect(getBookingPath('105')).toBe('/dat-phien-trai-nghiem?san-pham=105')
      expect(getBookingPath(null)).toBe('/dat-phien-trai-nghiem')
      expect(getBookingPath(undefined)).toBe('/dat-phien-trai-nghiem')
    })

    it('BookingCTA renders button href with product ID query param', () => {
      const productWithId: PublicProduct = {
        id: 42,
        name: 'Phiên trải nghiệm 1:1 Growth Mirror',
        slug: 'growth-mirror-trial',
        price: 250000,
        salePrice: 149000,
        saleStatus: 'on_sale',
      }

      const markup = renderToStaticMarkup(
        <BookingCTA
          title="Đặt phiên trải nghiệm"
          buttonLabel="Đặt phiên ngay"
          product={productWithId}
        />,
      )

      expect(markup).toContain('href="/dat-phien-trai-nghiem?san-pham=42"')
      expect(markup).toContain(BOOKING_PATH)
    })

    it('BookingCTA falls back to BOOKING_PATH when product has no ID', () => {
      const markup = renderToStaticMarkup(
        <BookingCTA title="Đặt phiên trải nghiệm" buttonLabel="Đặt phiên ngay" product={null} />,
      )

      expect(markup).toContain(`href="${BOOKING_PATH}"`)
    })
  })

  describe('Form Validation: Terms Acceptance Checkbox', () => {
    const validBaseInput = {
      productId: 10,
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@example.com',
      phone: '0901234567',
      need: 'Cần hiểu rõ về cảm xúc trì hoãn',
      turnstileToken: 'test-turnstile-token',
    }

    it('từ chối khi thiếu ô tick đồng ý điều khoản với lỗi tiếng Việt chuẩn', () => {
      // 1. Không truyền trường termsAccepted
      const missingTerms = experienceOrderSchema.safeParse(validBaseInput)
      expect(missingTerms.success).toBe(false)
      if (!missingTerms.success) {
        const termsError = missingTerms.error.errors.find((e) => e.path.includes('termsAccepted'))
        expect(termsError).toBeDefined()
        expect(termsError?.message).toBe(viStrings.payment.validation.termsAcceptedRequired)
      }

      // 2. termsAccepted = false
      const falseTerms = experienceOrderSchema.safeParse({
        ...validBaseInput,
        termsAccepted: false,
      })
      expect(falseTerms.success).toBe(false)
      if (!falseTerms.success) {
        const termsError = falseTerms.error.errors.find((e) => e.path.includes('termsAccepted'))
        expect(termsError).toBeDefined()
        expect(termsError?.message).toBe(viStrings.payment.validation.termsAcceptedRequired)
      }
    })

    it('hợp lệ khi termsAccepted = true', () => {
      const valid = experienceOrderSchema.safeParse({
        ...validBaseInput,
        termsAccepted: true,
      })
      expect(valid.success).toBe(true)
    })
  })

  describe('Order View: Token Sai / Không Tồn Tại', () => {
    it('trả về null (dẫn tới 404 trang công khai) khi token không tồn tại', async () => {
      const view = await getPublicOrderView('token-hoan-toan-khong-ton-tai-xyz')
      expect(view).toBeNull()
    })

    it('trả về null khi token là chuỗi rỗng', async () => {
      const view = await getPublicOrderView('   ')
      expect(view).toBeNull()
    })
  })

  describe('Admin Server Actions: Phân Quyền Bảo Mật Chặt Chẽ', () => {
    it('từ chối confirmManualPaymentAdminAction khi khách chưa đăng nhập', async () => {
      const result = await confirmManualPaymentAdminAction(999999)
      expect(result.success).toBe(false)
      expect(result.message).toBe(viStrings.payment.errors.unauthorized)
    })

    it('từ chối cancelOrderAdminAction khi khách chưa đăng nhập', async () => {
      const result = await cancelOrderAdminAction(999999, 'Hủy test')
      expect(result.success).toBe(false)
      expect(result.message).toBe(viStrings.payment.errors.unauthorized)
    })

    it('từ chối confirmManualPaymentAdminAction khi tài khoản là editor (chỉ owner được duyệt)', async () => {
      const mockPayloadEditor = {
        auth: vi.fn().mockResolvedValue({
          user: {
            id: 2,
            collection: 'users',
            role: 'editor',
            email: 'editor@tramdungcamxuc.com',
          },
        }),
      } as unknown as payloadModule.Payload

      const result = await confirmManualPaymentAdminAction(12345, { payload: mockPayloadEditor })
      expect(result.success).toBe(false)
      expect(result.message).toBe(viStrings.payment.errors.unauthorized)
    })

    it('từ chối cancelOrderAdminAction khi tài khoản là editor (chỉ owner được hủy)', async () => {
      const mockPayloadEditor = {
        auth: vi.fn().mockResolvedValue({
          user: {
            id: 2,
            collection: 'users',
            role: 'editor',
            email: 'editor@tramdungcamxuc.com',
          },
        }),
      } as unknown as payloadModule.Payload

      const result = await cancelOrderAdminAction(12345, 'Editor muốn hủy', {
        payload: mockPayloadEditor,
      })
      expect(result.success).toBe(false)
      expect(result.message).toBe(viStrings.payment.errors.unauthorized)
    })

    it('vượt qua xác thực quyền khi là owner và báo lỗi không tìm thấy đơn nếu ID sai', async () => {
      const mockPayloadOwner = {
        auth: vi.fn().mockResolvedValue({
          user: {
            id: 1,
            collection: 'users',
            role: 'owner',
            email: 'owner@tramdungcamxuc.com',
          },
        }),
        findByID: vi.fn().mockResolvedValue(null),
      } as unknown as payloadModule.Payload

      const result = await confirmManualPaymentAdminAction(999999, {
        payload: mockPayloadOwner,
      })
      // Không bị chặn bởi unauthorized mà báo không tìm thấy đơn
      expect(result.success).toBe(false)
      expect(result.message).toBe(viStrings.payment.errors.orderNotFound)
    })
  })
})
