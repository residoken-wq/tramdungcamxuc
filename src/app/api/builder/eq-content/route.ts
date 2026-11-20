import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getEqIntroData } from '@/lib/eq/intro-data.server'

/**
 * BX-08b: intro data of /eq-buddy for the builder preview of the "EQ Buddy" blocks.
 * Same public fields the /eq-buddy page already shows (the global is publicly readable);
 * the access mode and other settings are not returned.
 */
export async function GET() {
  const payload = await getPayload({ config: await config })
  const { content } = await getEqIntroData(payload)
  return NextResponse.json({ eqContent: content }, { headers: { 'Cache-Control': 'no-store' } })
}
