import React from 'react'
import { getSiteShellData } from '@/lib/site-shell.server'
import { Navbar, Footer, FloatingChat } from '@/components/site'

export default async function SiteShellLayout({ children }: { children: React.ReactNode }) {
  const shellData = await getSiteShellData()

  return (
    <div className="min-h-screen flex flex-col bg-warm-ivory text-deep-navy">
      <Navbar items={shellData.navbar.items} cta={shellData.navbar.cta} />
      <main id="noi-dung" className="flex-1">
        {children}
      </main>
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
    </div>
  )
}
