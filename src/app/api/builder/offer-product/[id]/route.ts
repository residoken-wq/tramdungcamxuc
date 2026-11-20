import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getOfferProductById } from '@/lib/habit.server'
import { getJourneyDays } from '@/puck/product-page.server'

/**
 * BX-08: offer data of a product for the builder preview of the "Trang sản phẩm" blocks.
 * Published, non-hidden products only – the same data the public offer page already shows,
 * so no extra access is opened. Drafts are never returned.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  const payload = await getPayload({ config: await config })
  const [offer, journeyDays] = await Promise.all([
    getOfferProductById(id, payload),
    getJourneyDays(payload),
  ])
  if (!offer) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  return NextResponse.json({ offer, journeyDays }, { headers: { 'Cache-Control': 'no-store' } })
}
