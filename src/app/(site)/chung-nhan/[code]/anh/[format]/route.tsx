import { ImageResponse } from 'next/og'
import { notFound } from 'next/navigation'
import fs from 'node:fs/promises'
import path from 'node:path'
import React from 'react'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { getCertificateByCode } from '@/lib/habit/certificate.server'

export const dynamic = 'force-dynamic'

interface FontCache {
  anton: ArrayBuffer
  montserrat400: ArrayBuffer
  montserrat700: ArrayBuffer
  playfairItalic: ArrayBuffer
}

let cachedFonts: FontCache | null = null

async function loadFonts(): Promise<FontCache> {
  if (cachedFonts) return cachedFonts

  const fontsDir = path.join(process.cwd(), 'src/fonts/og')
  const [antonBuf, mont400Buf, mont700Buf, playfairBuf] = await Promise.all([
    fs.readFile(path.join(fontsDir, 'anton-400.ttf')),
    fs.readFile(path.join(fontsDir, 'montserrat-400.ttf')),
    fs.readFile(path.join(fontsDir, 'montserrat-700.ttf')),
    fs.readFile(path.join(fontsDir, 'playfair-display-italic.ttf')),
  ])

  cachedFonts = {
    anton: antonBuf.buffer.slice(antonBuf.byteOffset, antonBuf.byteOffset + antonBuf.byteLength),
    montserrat400: mont400Buf.buffer.slice(
      mont400Buf.byteOffset,
      mont400Buf.byteOffset + mont400Buf.byteLength,
    ),
    montserrat700: mont700Buf.buffer.slice(
      mont700Buf.byteOffset,
      mont700Buf.byteOffset + mont700Buf.byteLength,
    ),
    playfairItalic: playfairBuf.buffer.slice(
      playfairBuf.byteOffset,
      playfairBuf.byteOffset + playfairBuf.byteLength,
    ),
  }

  return cachedFonts
}

function formatDateVN(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d)
  } catch {
    return dateStr
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string; format: string }> },
) {
  const { code, format } = await params

  if (format !== '4x5' && format !== '9x16') {
    notFound()
  }

  const is45 = format === '4x5'
  const width = 1080
  const height = is45 ? 1350 : 1920

  const customer = await getCurrentCustomer()
  const cert = await getCertificateByCode(code, {
    currentCustomerId: customer?.id ?? null,
  })

  // Nếu không tìm thấy hoặc private mà người xem không phải chủ sở hữu -> 404
  if (!cert) {
    notFound()
  }

  const fonts = await loadFonts()
  const formattedDate = formatDateVN(cert.issuedAt)

  const element = (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FAF7F4',
        padding: is45 ? 56 : 72,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FAF7F4',
          backgroundImage:
            'linear-gradient(150deg, #FFFFFF 0%, #FAF7F4 35%, #FDE6F6 75%, #E9DDF9 100%)',
          border: '4px solid #280A60',
          borderRadius: 28,
          padding: is45 ? '48px 44px' : '80px 48px',
          boxShadow: '0 20px 40px rgba(40, 10, 96, 0.08)',
        }}
      >
        {/* 1. Header: Logo, Tiêu đề 2 tầng */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#FDE6F6',
              borderRadius: 9999,
              border: '1.5px solid #BC039E',
              padding: '6px 24px',
              marginBottom: is45 ? 14 : 24,
            }}
          >
            <span
              style={{
                fontFamily: 'Montserrat',
                fontWeight: 700,
                fontSize: 16,
                color: '#BC039E',
                letterSpacing: 2,
              }}
            >
              TRẠM DỪNG CẢM XÚC
            </span>
          </div>

          <div
            style={{
              fontFamily: 'Anton',
              fontSize: is45 ? 68 : 76,
              color: '#280A60',
              letterSpacing: 4,
              lineHeight: 1.1,
            }}
          >
            CHỨNG NHẬN
          </div>

          <div
            style={{
              fontFamily: 'Anton',
              fontSize: is45 ? 32 : 36,
              color: '#BC039E',
              letterSpacing: 1.5,
              marginTop: 6,
              textAlign: 'center',
            }}
          >
            HÀNH TRÌNH 21 NGÀY RÈN LUYỆN THÓI QUEN
          </div>
        </div>

        {/* 2. Recipient: Tên học viên */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontFamily: 'Montserrat',
              fontWeight: 400,
              fontSize: 20,
              color: '#280A60',
              opacity: 0.8,
              marginBottom: 8,
            }}
          >
            Được trân trọng trao cho
          </div>

          <div
            style={{
              fontFamily: 'Montserrat',
              fontWeight: 700,
              fontSize: is45 ? 44 : 50,
              color: '#280A60',
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              textAlign: 'center',
              maxWidth: 880,
            }}
          >
            {cert.customerName}
          </div>

          <div
            style={{
              width: 180,
              height: 3,
              backgroundColor: '#EF3B83',
              borderRadius: 9999,
              marginTop: 14,
            }}
          />
        </div>

        {/* 3. Câu định danh (Quote Block) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #E9DDF9',
            borderRadius: 20,
            padding: is45 ? '22px 36px' : '32px 48px',
            maxWidth: 880,
          }}
        >
          <div
            style={{
              fontFamily: 'Playfair Display',
              fontStyle: 'italic',
              fontSize: is45 ? 24 : 28,
              color: '#280A60',
              textAlign: 'center',
              lineHeight: 1.45,
            }}
          >
            {`“${cert.identityStatement || 'Tôi chọn đồng hành và thấu hiểu cảm xúc mỗi ngày.'}”`}
          </div>
        </div>

        {/* 4. Thống kê hoàn thành */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#D9F1EA',
            border: '2px solid #280A60',
            borderRadius: 9999,
            padding: is45 ? '10px 32px' : '14px 40px',
          }}
        >
          <span
            style={{
              fontFamily: 'Montserrat',
              fontWeight: 700,
              fontSize: is45 ? 22 : 25,
              color: '#280A60',
              letterSpacing: 1,
            }}
          >
            {`ĐÃ HOÀN THÀNH ${cert.daysCompleted}/21 NGÀY`}
          </span>
        </div>

        {/* 5. Footer: Ngày cấp, mã xác minh, website */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1.5px solid rgba(40, 10, 96, 0.2)',
            paddingTop: is45 ? 16 : 24,
            paddingLeft: 8,
            paddingRight: 8,
          }}
        >
          <span
            style={{
              fontFamily: 'Montserrat',
              fontWeight: 700,
              fontSize: 16,
              color: '#280A60',
            }}
          >
            {`NGÀY CẤP: ${formattedDate}`}
          </span>

          <span
            style={{
              fontFamily: 'Montserrat',
              fontWeight: 700,
              fontSize: 16,
              color: '#280A60',
              letterSpacing: 1,
            }}
          >
            {`MÃ XÁC MINH: ${cert.code}`}
          </span>

          <span
            style={{
              fontFamily: 'Montserrat',
              fontWeight: 700,
              fontSize: 16,
              color: '#BC039E',
            }}
          >
            tramdungcamxuc.com
          </span>
        </div>
      </div>
    </div>
  )

  const cacheHeader = cert.isPublic
    ? 'public, max-age=86400, stale-while-revalidate=604800'
    : 'private, no-cache, no-store, must-revalidate'

  return new ImageResponse(element, {
    width,
    height,
    headers: {
      'Cache-Control': cacheHeader,
    },
    fonts: [
      {
        name: 'Anton',
        data: fonts.anton,
        weight: 400,
        style: 'normal',
      },
      {
        name: 'Montserrat',
        data: fonts.montserrat400,
        weight: 400,
        style: 'normal',
      },
      {
        name: 'Montserrat',
        data: fonts.montserrat700,
        weight: 700,
        style: 'normal',
      },
      {
        name: 'Playfair Display',
        data: fonts.playfairItalic,
        weight: 400,
        style: 'italic',
      },
    ],
  })
}
