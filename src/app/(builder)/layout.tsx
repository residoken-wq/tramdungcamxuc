import React from 'react'
import type { Metadata } from 'next'
import { Anton, Montserrat, Playfair_Display } from 'next/font/google'
import '@/app/(site)/styles.css'
import '@puckeditor/core/dist/index.css'

const anton = Anton({
  weight: '400',
  subsets: ['vietnamese', 'latin'],
  display: 'swap',
  variable: '--font-display',
})

const montserrat = Montserrat({
  weight: ['400', '600', '700'],
  subsets: ['vietnamese', 'latin'],
  display: 'swap',
  variable: '--font-ui',
})

const playfair = Playfair_Display({
  style: 'italic',
  subsets: ['vietnamese', 'latin'],
  display: 'swap',
  variable: '--font-quote',
})

export const metadata: Metadata = {
  title: 'Trình dựng trang trực quan | Trạm Dừng Cảm Xúc',
  robots: {
    index: false,
    follow: false,
  },
}

export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="vi"
      className={`${anton.variable} ${montserrat.variable} ${playfair.variable}`}
    >
      <body className="m-0 min-h-screen bg-warm-ivory p-0 font-sans text-deep-navy antialiased">
        {children}
      </body>
    </html>
  )
}
