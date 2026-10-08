import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPublicOrderView } from '@/lib/payments/orders.server'
import { OrderPaymentView } from '@/components/site/OrderPaymentView'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Thông tin thanh toán đơn hàng | Trạm Dừng Cảm Xúc',
  robots: {
    index: false,
    follow: false,
  },
}

interface PageProps {
  params: Promise<{
    token: string
  }>
}

export default async function OrderPaymentPage({ params }: PageProps) {
  const { token } = await params

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    notFound()
  }

  let orderView
  try {
    orderView = await getPublicOrderView(token)
  } catch {
    notFound()
  }

  if (!orderView) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-warm-ivory py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <OrderPaymentView order={orderView} />
      </div>
    </main>
  )
}
