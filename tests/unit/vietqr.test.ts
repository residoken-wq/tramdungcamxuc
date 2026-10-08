// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  assertValidBankConfig,
  buildVietQrPayload,
  crc16CcittFalse,
  generateVietQrSvg,
} from '../../src/lib/payments/vietqr'
import { getPaymentProvider, ManualPaymentProvider } from '../../src/lib/payments/provider'
import { vi } from '../../src/lib/i18n/vi'

describe('VietQR & Payment Provider (T1-12a)', () => {
  describe('CRC16 / CCITT-FALSE', () => {
    /**
     * Mẫu chuẩn lấy từ tài liệu NAPAS "VietQR – Đặc tả QR thanh toán"
     * và bộ test vector kiểm thử chuẩn của thư viện tham chiếu github.com/subiz/vietqr (TestCrc).
     */
    it('khớp chính xác các vector kiểm thử chuẩn của NAPAS/VietQR', () => {
      expect(crc16CcittFalse('00')).toBe('2EC9')
      expect(crc16CcittFalse('01')).toBe('3EE8')

      // Mẫu chuẩn thẻ tĩnh Napas (Service QRIBFTTC)
      const napasStaticSample =
        '00020101021138600010A00000072701300006970403011697040311012345670208QRIBFTTC53037045802VN6304'
      expect(crc16CcittFalse(napasStaticSample)).toBe('4F52')

      // Mẫu chuẩn tài khoản động Napas (Service QRIBFTTA - 180.000đ)
      const napasDynamicSample =
        '00020101021238570010A00000072701270006970403011300110123456780208QRIBFTTA530370454061800005802VN62340107NPS68690819thanh toan don hang6304'
      expect(crc16CcittFalse(napasDynamicSample)).toBe('2E2E')

      // Mẫu chuẩn tài khoản động 40.123đ kèm ghi chú "test text string" (CRC: D9C6)
      const subizDynamicSample =
        '00020101021238570010A00000072701270006970422011300234579234420208QRIBFTTA53037045405401235802VN62200816test text string6304'
      expect(crc16CcittFalse(subizDynamicSample)).toBe('D9C6')
    })
  })

  describe('buildVietQrPayload', () => {
    it('đặt số tiền 149000 ở tag 54 và addInfo ở tag 62 chuẩn EMVCo', () => {
      const payload = buildVietQrPayload({
        bin: '970422',
        accountNumber: '0023457923442',
        amount: 149000,
        addInfo: 'TDCX8F3K2',
      })

      // Kiểm tra tag 00 và 01
      expect(payload.startsWith('000201010212')).toBe(true)

      // Kiểm tra thông tin thụ hưởng Napas tag 38
      expect(payload).toContain('0010A000000727')
      expect(payload).toContain('0208QRIBFTTA')
      expect(payload).toContain('0006970422')
      expect(payload).toContain('01130023457923442')

      // Tag 53 tiền tệ VND
      expect(payload).toContain('5303704')

      // REVIEW-REQUIRED: Số tiền 149000 nằm đúng tag 54 (Tag 54, độ dài 06, giá trị 149000)
      expect(payload).toContain('5406149000')

      // Tag 58 quốc gia
      expect(payload).toContain('5802VN')

      // REVIEW-REQUIRED: addInfo (paymentRef) nằm đúng trong tag 62 sub-tag 08
      expect(payload).toContain('62130809TDCX8F3K2')

      // Tag 63 chứa 4 ký tự checksum hợp lệ ở cuối
      const crcPrefixIndex = payload.lastIndexOf('6304')
      expect(crcPrefixIndex).toBeGreaterThan(0)
      const dataBeforeCrc = payload.substring(0, crcPrefixIndex + 4)
      const expectedCrc = crc16CcittFalse(dataBeforeCrc)
      expect(payload.endsWith(expectedCrc)).toBe(true)
    })

    it('tạo payload tĩnh khi amount = 0 hoặc không truyền amount', () => {
      const payload = buildVietQrPayload({
        bin: '970423',
        accountNumber: '0099999999',
      })

      // 010211: Static QR
      expect(payload.startsWith('000201010211')).toBe(true)
      // Không có tag 54 (tag 53 nối thẳng vào tag 58)
      expect(payload).toContain('53037045802VN')
      expect(payload).toContain('5802VN')
    })
  })

  describe('generateVietQrSvg', () => {
    it('sinh chuỗi SVG hợp lệ chứa màu thương hiệu deep-navy (#280A60)', async () => {
      const payload = buildVietQrPayload({
        bin: '970422',
        accountNumber: '123456789',
        amount: 149000,
        addInfo: 'TDCXTEST1',
      })

      const svg = await generateVietQrSvg(payload)
      expect(svg).toContain('<svg')
      expect(svg).toContain('</svg>')
      expect(svg.toLowerCase()).toContain('#280a60')
    })
  })

  describe('assertValidBankConfig', () => {
    it('chấp nhận cấu hình ngân hàng đầy đủ', () => {
      expect(() =>
        assertValidBankConfig({
          bankBin: '970422',
          bankName: 'MB Bank',
          accountNumber: '0123456789',
          accountName: 'LUONG THI THU HUYEN',
        }),
      ).not.toThrow()
    })

    it('ném lỗi tiếng Việt khi thiếu mã BIN, số tài khoản hoặc tên chủ tài khoản', () => {
      expect(() =>
        assertValidBankConfig({
          bankBin: '',
          accountNumber: '0123456789',
          accountName: 'LUONG THI THU HUYEN',
        }),
      ).toThrow(vi.payment.errors.bankConfigMissing)

      expect(() =>
        assertValidBankConfig({
          bankBin: '970422',
          accountNumber: '   ',
          accountName: 'LUONG THI THU HUYEN',
        }),
      ).toThrow(vi.payment.errors.bankConfigMissing)

      expect(() =>
        assertValidBankConfig({
          bankBin: '970422',
          accountNumber: '0123456789',
          accountName: '',
        }),
      ).toThrow(vi.payment.errors.bankConfigMissing)
    })
  })

  describe('ManualPaymentProvider', () => {
    const provider = new ManualPaymentProvider()

    it('createPayment trả về đầy đủ thông tin thanh toán và chuỗi VietQR', async () => {
      const result = await provider.createPayment(
        {
          paymentRef: 'TDCX23456',
          total: 149000,
        },
        {
          bankBin: '970422',
          bankName: 'MB Bank',
          accountNumber: '0123456789',
          accountName: 'LUONG THI THU HUYEN',
        },
      )

      expect(result.paymentRef).toBe('TDCX23456')
      expect(result.amount).toBe(149000)
      expect(result.bankInfo.bankBin).toBe('970422')
      expect(result.bankInfo.accountNumber).toBe('0123456789')
      expect(result.qrPayload).toContain('5406149000')
      expect(result.qrPayload).toContain('TDCX23456')
      expect(result.qrSvg).toContain('<svg')
    })

    it('verifyWebhook và parseWebhook ném lỗi rõ ràng trong Giai đoạn 1', async () => {
      await expect(provider.verifyWebhook({})).rejects.toThrow(
        /chưa được hỗ trợ trong Giai đoạn 1/i,
      )
      await expect(provider.parseWebhook({})).rejects.toThrow(/chưa được hỗ trợ trong Giai đoạn 1/i)
    })

    it('getPaymentProvider khởi tạo đúng provider theo môi trường', () => {
      const manual = getPaymentProvider('manual')
      expect(manual.name).toBe('manual')

      expect(() => getPaymentProvider('unknown_gateway')).toThrow(/chưa được hỗ trợ/)
    })
  })
})
