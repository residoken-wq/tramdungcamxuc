import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLegalPageData, getLegalPageMetadata } from '@/lib/site-shell.server'
import { LegalPageView } from '@/components/site/LegalPageView'

export const dynamic = 'force-dynamic'

const SLUG = 'chinh-sach-bao-mat'

export async function generateMetadata(): Promise<Metadata> {
  return getLegalPageMetadata(SLUG)
}

export default async function ChinhSachBaoMatPage() {
  const data = await getLegalPageData(SLUG)
  if (!data) notFound()
  return <LegalPageView page={data.page} />
}
