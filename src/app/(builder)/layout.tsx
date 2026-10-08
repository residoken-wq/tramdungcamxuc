import React from 'react'
import type { Metadata } from 'next'
import { anton, montserrat, playfair } from '@/lib/fonts'
import '@/app/(site)/styles.css'
import '@puckeditor/core/dist/index.css'

export const metadata: Metadata = {
  title: 'Trình dựng trang trực quan | Trạm Dừng Cảm Xúc',
  robots: {
    index: false,
    follow: false,
  },
}

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${anton.variable} ${montserrat.variable} ${playfair.variable}`}>
      <body className="m-0 min-h-screen bg-warm-ivory p-0 font-sans text-deep-navy antialiased">
        {children}
      </body>
    </html>
  )
}
