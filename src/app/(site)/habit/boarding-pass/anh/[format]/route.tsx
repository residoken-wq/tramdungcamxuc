import { ImageResponse } from 'next/og'
import { notFound } from 'next/navigation'
import React from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { vi } from '@/lib/i18n/vi'
import { loadFonts } from '@/lib/og/fonts.server'
import { getClientIp } from '@/lib/payments/ip'
import { checkAndRecordRateLimit, RateLimitError } from '@/lib/forms/ratelimit.server'
import { boardingPassInputSchema } from '@/lib/habit/boarding-pass'
import { resolveBoardingPassData } from '@/lib/habit/boarding-pass.server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ format: string }> }) {
  const { format } = await params

  if (format !== '4x5' && format !== '9x16') {
    notFound()
  }

  const is45 = format === '4x5'
  const width = 1080
  const height = is45 ? 1350 : 1920

  const payload = await getPayload({ config })
  const ip = getClientIp(request)

  // 1. Rate limit theo IP: 20 lần / 10 phút (vẽ ảnh tốn CPU)
  try {
    await checkAndRecordRateLimit(payload, {
      form: 'boarding-pass',
      ip,
      windowMinutes: 10,
      maxHits: 20,
    })
  } catch (err) {
    if (err instanceof RateLimitError) {
      return Response.json({ error: vi.hb10.rateLimited }, { status: 429 })
    }
    return Response.json({ error: vi.hb10.errorGenerating }, { status: 500 })
  }

  // 2. Đọc và kiểm tra dữ liệu đầu vào bằng Zod
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: vi.hb10.invalidInput }, { status: 400 })
  }

  const parseResult = boardingPassInputSchema.safeParse(body)
  if (!parseResult.success) {
    return Response.json({ error: vi.hb10.invalidInput }, { status: 400 })
  }

  // 3. Giải quyết dữ liệu hiển thị (đọc siteSettings và techniques đã xuất bản)
  const data = await resolveBoardingPassData(parseResult.data, payload)
  const fonts = await loadFonts()

  // 4. Dựng giao diện thẻ Boarding Pass theo Brand Book 2026
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
        padding: is45 ? 40 : 54,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#FAF7F4',
          backgroundImage:
            'linear-gradient(155deg, #FAF7F4 0%, #FAF7F4 30%, #FDE6F6 70%, #E9DDF9 100%)',
          border: '4px solid #280A60',
          borderRadius: 32,
          padding: is45 ? '36px 40px' : '56px 44px',
          boxShadow: '0 24px 48px rgba(40, 10, 96, 0.08)',
        }}
      >
        {/* HEADER SECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {/* Top badges */}
          <div
            style={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#FDE6F6',
                borderRadius: 9999,
                border: '1.5px solid #BC039E',
                padding: '6px 20px',
              }}
            >
              <span
                style={{
                  fontFamily: 'Montserrat',
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#BC039E',
                  letterSpacing: 2,
                }}
              >
                {vi.hb10.seriesLabel}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#D9F1EA',
                borderRadius: 9999,
                border: '1.5px solid #280A60',
                padding: '6px 20px',
              }}
            >
              <span
                style={{
                  fontFamily: 'Montserrat',
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#280A60',
                  letterSpacing: 1,
                }}
              >
                {vi.hb10.journeyBadge(data.journeyDays).toUpperCase()} ·{' '}
                {vi.hb10.startDatePrefix.toUpperCase()} {data.startDateStr}
              </span>
            </div>
          </div>

          {/* Tiêu đề 2 tầng */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontFamily: 'Anton',
                fontSize: is45 ? 64 : 76,
                color: '#280A60',
                letterSpacing: 3,
                lineHeight: 1,
                marginRight: 16,
              }}
            >
              {vi.hb10.titleLine1.toUpperCase()}
            </span>
            <span
              style={{
                fontFamily: 'Anton',
                fontSize: is45 ? 40 : 48,
                color: '#BC039E',
                letterSpacing: 2,
                lineHeight: 1,
              }}
            >
              {vi.hb10.titleLine2.toUpperCase()}
            </span>
          </div>

          <div
            style={{
              fontFamily: 'Montserrat',
              fontWeight: 400,
              fontSize: 16,
              color: '#280A60',
              opacity: 0.85,
            }}
          >
            {vi.hb10.previewSubtitle}
          </div>

          {/* Đường kẻ mảnh brand */}
          <div
            style={{
              width: '100%',
              height: 2,
              backgroundColor: '#EF3B83',
              borderRadius: 9999,
              marginTop: 14,
              opacity: 0.6,
            }}
          />
        </div>

        {/* 1. MỤC TIÊU ĐỊNH DANH */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            border: '2px solid #280A60',
            borderRadius: 22,
            padding: is45 ? '18px 24px' : '26px 30px',
            boxShadow: '0 8px 20px rgba(40, 10, 96, 0.04)',
          }}
        >
          <div
            style={{
              fontFamily: 'Montserrat',
              fontWeight: 700,
              fontSize: 13,
              color: '#BC039E',
              letterSpacing: 1.5,
              marginBottom: 8,
              textTransform: 'uppercase',
            }}
          >
            {vi.hb10.identityLabel}
          </div>

          <div
            style={{
              fontFamily: 'Playfair Display',
              fontStyle: 'italic',
              fontSize: is45 ? 24 : 28,
              color: '#280A60',
              lineHeight: 1.45,
            }}
          >
            {`“${data.identityStatement}”`}
          </div>
        </div>

        {/* 2. THÓI QUEN NEO / BẢN TỐI GIẢN (nếu có) */}
        {data.anchorFormula || data.twoMinuteAction ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'rgba(253, 230, 246, 0.55)',
              border: '1.5px solid #EF3B83',
              borderRadius: 20,
              padding: is45 ? '14px 22px' : '20px 26px',
            }}
          >
            <div
              style={{
                fontFamily: 'Montserrat',
                fontWeight: 700,
                fontSize: 12,
                color: '#EF3B83',
                letterSpacing: 1.5,
                marginBottom: 6,
                textTransform: 'uppercase',
              }}
            >
              {data.anchorFormula ? vi.hb10.anchorLabel : vi.hb10.twoMinuteLabel}
            </div>

            <div
              style={{
                fontFamily: 'Montserrat',
                fontWeight: 600,
                fontSize: is45 ? 17 : 20,
                color: '#280A60',
                lineHeight: 1.4,
              }}
            >
              {data.anchorFormula ? data.anchorFormula : data.twoMinuteAction}
            </div>
          </div>
        ) : null}

        {/* 3. NHỊP TUẦN (7 Ô T2...CN) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #E9DDF9',
            borderRadius: 22,
            padding: is45 ? '16px 20px' : '22px 26px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontFamily: 'Montserrat',
                fontWeight: 700,
                fontSize: 13,
                color: '#280A60',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              {vi.hb10.rhythmLabel}
            </span>

            <span
              style={{
                fontFamily: 'Montserrat',
                fontWeight: 700,
                fontSize: 13,
                color: '#BC039E',
                backgroundColor: '#FDE6F6',
                borderRadius: 9999,
                padding: '4px 14px',
              }}
            >
              {vi.hb10.rhythmDaysCount(data.activeRhythmCount)}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            {data.rhythmDays.map((dayItem) => (
              <div
                key={dayItem.day}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: is45 ? 124 : 124,
                  height: is45 ? 54 : 64,
                  borderRadius: 14,
                  backgroundColor: dayItem.isActive ? '#D9F1EA' : 'rgba(233, 221, 249, 0.3)',
                  border: dayItem.isActive
                    ? '2px solid #280A60'
                    : '1.5px dashed rgba(40, 10, 96, 0.25)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Montserrat',
                    fontWeight: dayItem.isActive ? 700 : 400,
                    fontSize: is45 ? 18 : 20,
                    color: dayItem.isActive ? '#280A60' : 'rgba(40, 10, 96, 0.35)',
                  }}
                >
                  {dayItem.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. KỸ THUẬT THEO 4 GIAI ĐOẠN */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontFamily: 'Montserrat',
              fontWeight: 700,
              fontSize: 13,
              color: '#280A60',
              letterSpacing: 1.5,
              marginBottom: 10,
              textTransform: 'uppercase',
            }}
          >
            {vi.hb10.techniquesHeading}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            {data.techniquesByStage.map((stageItem) => (
              <div
                key={stageItem.stage}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #E9DDF9',
                  borderRadius: 16,
                  padding: is45 ? '12px 14px' : '16px 18px',
                  marginRight: stageItem.stage !== 'reward' ? 12 : 0,
                  minHeight: is45 ? 108 : 124,
                }}
              >
                <div
                  style={{
                    fontFamily: 'Montserrat',
                    fontWeight: 700,
                    fontSize: 12,
                    color: '#BC039E',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                  }}
                >
                  {stageItem.stageTitle}
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {stageItem.techniqueNames.length === 0 ? (
                    <span
                      style={{
                        fontFamily: 'Montserrat',
                        fontStyle: 'italic',
                        fontSize: 13,
                        color: 'rgba(40, 10, 96, 0.45)',
                      }}
                    >
                      {vi.hb10.noTechniquesForStage}
                    </span>
                  ) : (
                    stageItem.techniqueNames.map((name, i) => (
                      <span
                        key={i}
                        style={{
                          fontFamily: 'Montserrat',
                          fontWeight: 500,
                          fontSize: 13,
                          color: '#280A60',
                          lineHeight: 1.35,
                          marginBottom: 3,
                        }}
                      >
                        • {name}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. FOOTER */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1.5px solid rgba(40, 10, 96, 0.15)',
            paddingTop: is45 ? 14 : 20,
          }}
        >
          <span
            style={{
              fontFamily: 'Montserrat',
              fontWeight: 400,
              fontSize: 14,
              color: 'rgba(40, 10, 96, 0.7)',
            }}
          >
            Trạm Dừng Cảm Xúc · Cùng bạn vững vàng thói quen
          </span>

          <span
            style={{
              fontFamily: 'Montserrat',
              fontWeight: 700,
              fontSize: 16,
              color: '#BC039E',
              letterSpacing: 1,
            }}
          >
            {vi.hb10.footerUrl}
          </span>
        </div>
      </div>
    </div>
  )

  return new ImageResponse(element, {
    width,
    height,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Disposition': `attachment; filename="tdcx-boarding-pass-${format}.png"`,
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
