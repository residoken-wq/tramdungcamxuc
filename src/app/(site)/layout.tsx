import React from 'react'
import type { Metadata } from 'next'
import { Anton, Montserrat, Playfair_Display } from 'next/font/google'
import './styles.css'

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
  title: {
    template: '%s | Trạm Dừng Cảm Xúc',
    default: 'Trạm Dừng Cảm Xúc',
  },
  description: 'Hiểu mình rõ. Hành động bền bỉ. Tỏa sáng bằng thế mạnh riêng.',
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${anton.variable} ${montserrat.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-warm-ivory font-sans text-deep-navy antialiased">
        {children}
      </body>
    </html>
  )
}
