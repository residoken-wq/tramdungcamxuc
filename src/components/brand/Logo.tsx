import React from 'react'
import Image from 'next/image'

export interface LogoProps {
  variant?: 'default' | 'light' | 'dark' | 'monochrome'
  className?: string
  width?: number
  height?: number
  src?: string
}

/**
 * Component Logo Trạm Dừng Cảm Xúc
 * Tuân thủ Brand Book 2026:
 * - Không đổi màu, không xoay, không kéo giãn
 * - Kích thước tối thiểu 120px chiều ngang
 * - Khi public/brand/ chưa có file ảnh gốc: hiển thị khung placeholder
 *   chuẩn "LOGO – chờ file từ Hana" (không tự ý vẽ hay lấy ảnh ngoài).
 */
export function Logo({
  variant = 'default',
  className = '',
  width = 140,
  height = 40,
  src,
}: LogoProps) {
  const minWidth = Math.max(120, width)

  // Nếu có đường dẫn ảnh thật truyền vào hoặc tồn tại
  if (src) {
    return (
      <div
        className={`inline-block ${className}`}
        style={{ minWidth: `${minWidth}px` }}
      >
        <Image
          src={src}
          alt="Trạm Dừng Cảm Xúc"
          width={width}
          height={height}
          className="h-auto w-full object-contain"
        />
      </div>
    )
  }

  // Placeholder chuẩn theo quy định Brand Book khi chưa nhận file PNG gốc
  const variantStyles = {
    default: 'border-deep-navy/30 bg-warm-ivory text-deep-navy',
    dark: 'border-white/40 bg-deep-navy text-warm-ivory',
    light: 'border-deep-navy/20 bg-white text-deep-navy',
    monochrome: 'border-current bg-transparent text-current',
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded border border-dashed px-2 py-1 text-xs font-semibold tracking-wider uppercase transition-colors overflow-hidden flex-shrink-0 ${variantStyles[variant]} ${className}`}
      role="img"
      aria-label="Logo Trạm Dừng Cảm Xúc"
      style={{ width: `${minWidth}px`, height: height ? `${height}px` : 'auto' }}
    >
      <span className="truncate">LOGO – chờ file từ Hana</span>
    </div>
  )
}
