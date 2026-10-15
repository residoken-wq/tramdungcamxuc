import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { buildCardQrUrl, generateCardQrPng, getQrPngFilename } from '@/lib/eq/qr'
import { vi } from '@/lib/i18n/vi'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const payload = await getPayload({ config })
  let requestHeaders: Headers

  try {
    requestHeaders = await headers()
    if (Array.from(requestHeaders.keys()).length === 0) {
      requestHeaders = new Headers(request.headers)
    }
  } catch {
    requestHeaders = new Headers(request.headers)
  }

  // REVIEW-REQUIRED: Downloading single card QR PNG for printing. Only owner and editor users are authorized.
  const { user } = await payload.auth({ headers: requestHeaders })
  if (!user) {
    return new Response(vi.eqBuddy.qrExport.unauthenticated, { status: 401 })
  }

  if (user.collection !== 'users' || (user.role !== 'owner' && user.role !== 'editor')) {
    return new Response(vi.eqBuddy.qrExport.forbidden, { status: 403 })
  }

  const { id } = await params
  let card
  try {
    card = await payload.findByID({
      collection: 'eqCards',
      id,
      draft: false,
      overrideAccess: true,
    })
  } catch {
    card = null
  }

  if (!card || !card.qrSlug) {
    return new Response(vi.eqBuddy.qrExport.cardNotFound, { status: 404 })
  }

  const qrUrl = buildCardQrUrl(card.qrSlug)
  const pngBuffer = await generateCardQrPng(qrUrl)
  const filename = getQrPngFilename(card.code || 'card')

  return new Response(new Uint8Array(pngBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
