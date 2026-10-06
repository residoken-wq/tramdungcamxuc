import React from 'react'
import type { Metadata } from 'next'
import { Anton, Montserrat, Playfair_Display } from 'next/font/google'
import { getSiteShellData } from '@/lib/site-shell.server'
import { Navbar, Footer, FloatingChat } from '@/components/site'
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

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const shellData = await getSiteShellData()

  return (
    <html lang="vi" className={`${anton.variable} ${montserrat.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-warm-ivory font-sans text-deep-navy antialiased flex flex-col">
        <Navbar items={shellData.navbar.items} cta={shellData.navbar.cta} />
        <div className="flex-1">{children}</div>
        <Footer
          legalLinks={shellData.footer.legalLinks}
          sellerInfo={shellData.footer.sellerInfo}
          socialLinks={shellData.footer.socialLinks}
          tagline={shellData.footer.tagline}
        />
        <FloatingChat
          showFloatingChat={shellData.floatingChat.showFloatingChat}
          zaloChatUrl={shellData.floatingChat.zaloChatUrl}
        />
      </body>
    </html>
  )
}
