import React from 'react'
import { getSiteShellData } from '@/lib/site-shell.server'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { Navbar, Footer, FloatingChat } from '@/components/site'

export default async function SiteShellLayout({ children }: { children: React.ReactNode }) {
  const [shellData, customer] = await Promise.all([getSiteShellData(), getCurrentCustomer()])

  return (
    <div className="min-h-screen flex flex-col bg-warm-ivory text-deep-navy">
      <Navbar
        items={shellData.navbar.items}
        cta={shellData.navbar.cta}
        logo={shellData.logo}
        customer={customer ? { name: customer.name, email: customer.email } : null}
      />
      <main id="noi-dung" className="flex-1">
        {children}
      </main>
      <Footer
        legalLinks={shellData.footer.legalLinks}
        sellerInfo={shellData.footer.sellerInfo}
        socialLinks={shellData.footer.socialLinks}
        tagline={shellData.footer.tagline}
        logo={shellData.logo}
      />
      <FloatingChat
        showFloatingChat={shellData.floatingChat.showFloatingChat}
        zaloChatUrl={shellData.floatingChat.zaloChatUrl}
      />
    </div>
  )
}
