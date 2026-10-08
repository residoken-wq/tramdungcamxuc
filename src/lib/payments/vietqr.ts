import QRCode from 'qrcode'
import { vi } from '../i18n/vi'

/**
 * Thuật toán CRC16/CCITT-FALSE dùng cho đặc tả QR thanh toán VietQR (EMVCo MPM).
 * - Polynomial: 0x1021
 * - Initial value: 0xFFFF
 * - RefIn: false, RefOut: false
 * - XorOut: 0x0000
 *
 * Tính toán trên chuỗi ký tự theo mã ASCII/UTF-8.
 */
export function crc16CcittFalse(data: string): string {
  let crc = 0xffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff
      } else {
        crc = (crc << 1) & 0xffff
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/**
 * Định dạng một trường dữ liệu TLV (Tag - Length - Value) theo chuẩn EMVCo.
 * - Tag: 2 ký tự số.
 * - Length: 2 chữ số biểu diễn độ dài byte/ký tự của value (01-99).
 * - Value: Giá trị chuỗi.
 */
export function formatTlv(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0')
  return `${tag}${len}${value}`
}

export interface BuildVietQrPayloadInput {
  /** Mã định danh ngân hàng (BIN 6 số do Ngân hàng Nhà nước cấp, VD: 970422). */
  bin: string
  /** Số tài khoản thụ hưởng. */
  accountNumber: string
  /** Số tiền (VND, số nguyên không âm). Nếu > 0 sẽ xuất hiện ở Tag 54. */
  amount?: number
  /** Nội dung thanh toán (addInfo, thường là paymentRef). Xuất hiện ở Tag 62 - Sub 08. */
  addInfo?: string
}

/**
 * Sinh chuỗi payload VietQR theo chuẩn EMVCo Merchant-Presented Mode (NAPAS 247).
 * Hàm thuần (pure function) không phụ thuộc DB hay API ngoài.
 *
 * Cấu trúc:
 * - 00: Payload Format Indicator ("01")
 * - 01: Point of Initiation Method ("11" tĩnh, "12" động khi có số tiền)
 * - 38: Merchant Account Information
 *   - 00: GUID Napas ("A000000727")
 *   - 01: Tổ chức thụ hưởng (00: BIN, 01: Số tài khoản)
 *   - 02: Mã dịch vụ ("QRIBFTTA" - chuyển khoản đến tài khoản)
 * - 53: Transaction Currency ("704" - VND)
 * - 54: Transaction Amount (nếu > 0, số nguyên)
 * - 58: Country Code ("VN")
 * - 62: Additional Data Field Template (08: Purpose of Transaction - addInfo)
 * - 63: CRC16 Checksum (4 ký tự hex viết hoa)
 */
export function buildVietQrPayload({
  bin,
  accountNumber,
  amount,
  addInfo,
}: BuildVietQrPayloadInput): string {
  const cleanBin = bin.trim()
  const cleanAccount = accountNumber.trim()
  const cleanAmount = typeof amount === 'number' && amount > 0 ? Math.round(amount) : 0
  const cleanAddInfo = addInfo?.trim() || ''

  // Tag 00: Phiên bản
  const tag00 = formatTlv('00', '01')

  // Tag 01: 12 nếu có số tiền (động), 11 nếu không có số tiền (tĩnh)
  const tag01 = formatTlv('01', cleanAmount > 0 ? '12' : '11')

  // Tag 38: Thông tin tài khoản thụ hưởng
  const sub38_00 = formatTlv('00', 'A000000727')
  const sub38_01_bank = formatTlv('00', cleanBin)
  const sub38_01_acc = formatTlv('01', cleanAccount)
  const sub38_01 = formatTlv('01', `${sub38_01_bank}${sub38_01_acc}`)
  const sub38_02 = formatTlv('02', 'QRIBFTTA')
  const tag38 = formatTlv('38', `${sub38_00}${sub38_01}${sub38_02}`)

  // Tag 53: Mã tiền tệ VND (704)
  const tag53 = formatTlv('53', '704')

  // Tag 54: Số tiền (chỉ khi > 0)
  const tag54 = cleanAmount > 0 ? formatTlv('54', cleanAmount.toString()) : ''

  // Tag 58: Mã quốc gia VN
  const tag58 = formatTlv('58', 'VN')

  // Tag 62: Thông tin bổ sung (nội dung chuyển khoản)
  let tag62 = ''
  if (cleanAddInfo.length > 0) {
    const sub62_08 = formatTlv('08', cleanAddInfo)
    tag62 = formatTlv('62', sub62_08)
  }

  // Tag 63: CRC16
  const dataBeforeCrc = `${tag00}${tag01}${tag38}${tag53}${tag54}${tag58}${tag62}6304`
  const crc = crc16CcittFalse(dataBeforeCrc)

  return `${dataBeforeCrc}${crc}`
}

/**
 * Sinh mã QR dạng SVG phía server với màu sắc nhận diện thương hiệu (#280A60 deep-navy).
 */
export async function generateVietQrSvg(payload: string): Promise<string> {
  return QRCode.toString(payload, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    color: {
      dark: '#280A60', // deep-navy thương hiệu Trạm Dừng Cảm Xúc
      light: '#FFFFFF',
    },
  })
}

export interface BankConfig {
  bankBin?: string | null
  bankName?: string | null
  accountNumber?: string | null
  accountName?: string | null
  transferPrefix?: string | null
}

export type ValidatedBankConfig = {
  bankBin: string
  bankName?: string | null
  accountNumber: string
  accountName: string
  transferPrefix?: string | null
}

/**
 * Kiểm tra tính hợp lệ của cấu hình ngân hàng trong SiteSettings.
 * Thiếu thông tin bắt buộc (BIN, số tài khoản, tên tài khoản) sẽ ném lỗi tiếng Việt.
 */
export function assertValidBankConfig(
  config: BankConfig | null | undefined,
): asserts config is ValidatedBankConfig {
  if (
    !config ||
    !config.bankBin?.trim() ||
    !config.accountNumber?.trim() ||
    !config.accountName?.trim()
  ) {
    throw new Error(vi.payment.errors.bankConfigMissing)
  }
}
