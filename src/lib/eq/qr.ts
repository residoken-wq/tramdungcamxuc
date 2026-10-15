import QRCode from 'qrcode'
import { DEFAULT_SITE_URL } from '../site-url'

/**
 * Link printed on a physical card's QR: /eq-buddy/the/[qrSlug], no query string.
 * Always the production domain (not getSiteUrl()): a QR exported from the demo admin would
 * otherwise encode the demo host forever, and printed cards cannot be changed (T3-03c).
 */
export function buildCardQrUrl(qrSlug: string, baseUrl?: string): string {
  const base = (baseUrl !== undefined ? baseUrl : DEFAULT_SITE_URL).trim().replace(/\/+$/, '')
  const cleanSlug = (qrSlug || '').trim()
  return `${base}/eq-buddy/the/${cleanSlug}`
}

/**
 * Chuẩn hóa tên file PNG sang ký tự ASCII thuần túy để dùng an toàn trong header Content-Disposition.
 */
export function getQrPngFilename(code: string): string {
  const sanitized = (code || 'card').replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^_+|_+$/g, '')
  return `qr-${sanitized || 'card'}.png`
}

/**
 * Sinh ảnh QR PNG chất lượng cao cho file in ấn:
 * - Kích thước: 1200×1200 px
 * - Mức sửa lỗi: 'Q' (25% phục hồi, tối ưu cho quét thực tế khi in)
 * - Vùng trắng an toàn (quiet zone): margin 4 ô
 * - Màu điểm: #280A60 (deep-navy thương hiệu Trạm Dừng Cảm Xúc)
 * - Nền: #FFFFFF
 */
export async function generateCardQrPng(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    width: 1200,
    errorCorrectionLevel: 'Q',
    margin: 4,
    color: {
      dark: '#280A60',
      light: '#FFFFFF',
    },
  })
}

/**
 * Thoát ký tự ô CSV và chống tấn công CSV Injection (OWASP).
 * Vô hiệu hóa công thức bắt đầu bằng =, +, -, @, \t, \r bằng cách thêm dấu nháy đơn (').
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  let str = String(value)
  if (str.length > 0 && ['=', '+', '-', '@', '\t', '\r'].includes(str.charAt(0))) {
    str = `'${str}`
  }
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}
