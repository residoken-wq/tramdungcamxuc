import { ImageResponse } from 'next/og'
import { notFound } from 'next/navigation'
import { NextResponse } from 'next/server'
import React from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { vi } from '@/lib/i18n/vi'
import { loadFonts } from '@/lib/og/fonts.server'

export const dynamic = 'force-dynamic'

function calculateMessageStyle(length: number, is45: boolean) {
  if (length > 160) {
    return { fontSize: is45 ? 32 : 36, lineHeight: 1.45 }
  }
  if (length > 110) {
    return { fontSize: is45 ? 38 : 42, lineHeight: 1.4 }
  }
  if (length > 60) {
    return { fontSize: is45 ? 44 : 48, lineHeight: 1.35 }
  }
  return { fontSize: is45 ? 52 : 56, lineHeight: 1.35 }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ qrSlug: string; format: string }> },
) {
  const { qrSlug, format } = await params

  if (format !== '4x5' && format !== '9x16') {
    notFound()
  }

  const is45 = format === '4x5'
  const width = 1080
  const height = is45 ? 1350 : 1920

  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'eqCards',
    where: {
      and: [
        { qrSlug: { equals: qrSlug } },
        { _status: { equals: 'published' } },
      ],
    },
    limit: 1,
    depth: 1,
  })

  const card = result.docs[0]
  if (!card) {
    notFound()
  }

  // Nếu thẻ đã có ảnh tải lên trước trên CMS thì redirect 302
  if (is45 && card.shareImage45 && typeof card.shareImage45 === 'object' && 'url' in card.shareImage45 && card.shareImage45.url) {
    const rawUrl = card.shareImage45.url
    const redirectUrl = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
      ? rawUrl
      : new URL(rawUrl, request.url).toString()
    return NextResponse.redirect(redirectUrl, 302)
  }

  if (!is45 && card.shareImage916 && typeof card.shareImage916 === 'object' && 'url' in card.shareImage916 && card.shareImage916.url) {
    const rawUrl = card.shareImage916.url
    const redirectUrl = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
      ? rawUrl
      : new URL(rawUrl, request.url).toString()
    return NextResponse.redirect(redirectUrl, 302)
  }

  // Tự động sinh ảnh theo chuẩn Brand Book 2026
  const fonts = await loadFonts()
  const message = card.message?.trim() || ''
  const { fontSize, lineHeight } = calculateMessageStyle(message.length, is45)

  const element = (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(145deg, #FAF7F4 0%, #FDE6F6 40%, #E9DDF9 75%, #D9F1EA 100%)',
        padding: is45 ? '64px' : '80px 64px',
        boxSizing: 'border-box',
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
          borderRadius: 36,
          border: '2px solid #E9DDF9',
          boxShadow: '0 20px 48px rgba(40, 10, 96, 0.06)',
          padding: is45 ? '64px 56px' : '96px 64px',
          boxSizing: 'border-box',
        }}
      >
        {/* 1. Header: Badge EQ BUDDY · CODE */}
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
              justifyContent: 'center',
              backgroundColor: '#FDE6F6',
              borderRadius: 9999,
              border: '1.5px solid #BC039E',
              padding: '10px 32px',
            }}
          >
            <span
              style={{
                fontFamily: 'Montserrat',
                fontWeight: 700,
                fontSize: 18,
                color: '#BC039E',
                letterSpacing: 2,
              }}
            >
              {vi.eqBuddy.shareImage.badge(card.code)}
            </span>
          </div>
        </div>

        {/* 2. Body: Thông điệp cảm xúc (Playfair Display Italic) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            padding: '32px 16px',
            maxWidth: 880,
            width: '100%',
          }}
        >
          <div
            style={{
              fontFamily: 'Playfair Display',
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize,
              lineHeight,
              color: '#280A60',
              textAlign: 'center',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {message ? `“${message}”` : ''}
          </div>

          <div
            style={{
              display: 'flex',
              width: 56,
              height: 3,
              borderRadius: 2,
              backgroundColor: '#EF3B83',
              marginTop: is45 ? 28 : 36,
              opacity: 0.8,
            }}
          />
        </div>

        {/* 3. Footer: Logo Trạm Dừng Cảm Xúc & Domain */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'Anton',
              fontSize: 30,
              color: '#280A60',
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            {vi.eqBuddy.shareImage.brandName}
          </span>
          <span
            style={{
              fontFamily: 'Montserrat',
              fontWeight: 700,
              fontSize: 16,
              color: '#BC039E',
              letterSpacing: 1.5,
              marginTop: 6,
            }}
          >
            {vi.eqBuddy.shareImage.domain}
          </span>
        </div>
      </div>
    </div>
  )

  return new ImageResponse(element, {
    width,
    height,
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
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
