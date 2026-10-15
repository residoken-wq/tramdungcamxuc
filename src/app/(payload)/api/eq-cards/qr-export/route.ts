import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getSiteUrl } from '@/lib/site-url'
import { buildCardQrUrl, escapeCsvCell } from '@/lib/eq/qr'
import { vi } from '@/lib/i18n/vi'

export async function GET(request: Request): Promise<Response> {
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

  // REVIEW-REQUIRED: Exporting QR codes for printing. Only owner and editor users are authorized.
  const { user } = await payload.auth({ headers: requestHeaders })
  if (!user) {
    return new Response(vi.eqBuddy.qrExport.unauthenticated, { status: 401 })
  }

  if (user.collection !== 'users' || (user.role !== 'owner' && user.role !== 'editor')) {
    return new Response(vi.eqBuddy.qrExport.forbidden, { status: 403 })
  }

  const result = await payload.find({
    collection: 'eqCards',
    limit: 1000,
    sort: 'order',
    draft: true,
    overrideAccess: true,
  })

  const headerRow = [
    vi.eqBuddy.qrExport.csvHeaders.code,
    vi.eqBuddy.qrExport.csvHeaders.qrSlug,
    vi.eqBuddy.qrExport.csvHeaders.url,
    vi.eqBuddy.qrExport.csvHeaders.status,
    vi.eqBuddy.qrExport.csvHeaders.printedAt,
    vi.eqBuddy.qrExport.csvHeaders.pngUrl,
  ]

  const siteUrl = getSiteUrl()
  const dataRows = result.docs.map((card) => {
    const isPublished = card._status === 'published'
    const statusText = isPublished
      ? vi.eqBuddy.qrExport.statusPublished
      : vi.eqBuddy.qrExport.statusDraft
    const qrUrl = buildCardQrUrl(card.qrSlug || '', siteUrl)
    const pngUrl = `${siteUrl}/api/eq-cards/${card.id}/qr`
    const printedAtText = card.printedAt ? String(card.printedAt) : ''

    return [card.code || '', card.qrSlug || '', qrUrl, statusText, printedAtText, pngUrl]
  })

  const csvRows = [
    headerRow.map(escapeCsvCell).join(','),
    ...dataRows.map((row) => row.map(escapeCsvCell).join(',')),
  ]

  // Prepend UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility + CRLF line breaks
  const csvContent = '\uFEFF' + csvRows.join('\r\n')
  const dateStr = new Date().toISOString().slice(0, 10)

  return new Response(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="eq-qr-${dateStr}.csv"`,
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
