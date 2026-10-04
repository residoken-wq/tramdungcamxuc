import React from 'react'
import Link from 'next/link'
import { Logo, HeartLine } from '@/components/brand'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-brand-gradient p-6 text-center">
      <div className="flex max-w-md flex-col items-center rounded-card border border-deep-navy/10 bg-warm-ivory/85 p-8 shadow-soft backdrop-blur-sm">
        <Logo width={160} />

        <h1 className="mt-6 font-display text-3xl uppercase tracking-tight text-deep-navy sm:text-4xl">
          Trạm Dừng Cảm Xúc
        </h1>

        <HeartLine className="my-4 text-accent-pink" width={72} height={28} />

        <p className="font-quote text-lg italic text-deep-navy/85">
          Hiểu mình rõ. Hành động bền bỉ. Tỏa sáng bằng thế mạnh riêng.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/styleguide"
            className="rounded-lg bg-deep-navy px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Xem Brand Styleguide
          </Link>
          <Link
            href="/admin"
            className="rounded-lg border border-deep-navy/25 bg-transparent px-4 py-2 text-sm font-semibold text-deep-navy transition-colors hover:bg-deep-navy/5"
          >
            Quản trị CMS
          </Link>
        </div>
      </div>
    </main>
  )
}
