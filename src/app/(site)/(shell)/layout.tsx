import React from 'react'
import { getSiteShellData } from '@/lib/site-shell.server'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { Navbar, Footer, FloatingActions } from '@/components/site'
import { StyledRender } from '@/components/design/StyledRender'
import { headerPuckConfig, footerPuckConfig } from '@/puck/config'
import { LegalFooterView } from '@/puck/blocks/site/LegalFooter'

export default async function SiteShellLayout({ children }: { children: React.ReactNode }) {
  const [shellData, customer] = await Promise.all([getSiteShellData(), getCurrentCustomer()])
  const customerMeta = customer ? { name: customer.name, email: customer.email } : null

  return (
    <div className="min-h-screen flex flex-col bg-warm-ivory text-deep-navy">
      {shellData.headerSource === 'builder' && shellData.headerData ? (
        <StyledRender
          config={headerPuckConfig}
          data={shellData.headerData}
          disableEntranceAnimation
          scopeAttr="data-eb-header"
          metadata={{ customer: customerMeta }}
        />
      ) : (
        <Navbar
          items={shellData.navbar.items}
          cta={shellData.navbar.cta}
          logo={shellData.logo}
          customer={customerMeta}
        />
      )}
      <main id="noi-dung" className="flex-1">
        {children}
      </main>
      {shellData.footerSource === 'builder' && shellData.footerData ? (
        <>
          <StyledRender
            config={footerPuckConfig}
            data={shellData.footerData}
            disableEntranceAnimation
            scopeAttr="data-eb-footer"
            metadata={{ customer: customerMeta }}
          />
          {!shellData.footerHasLegal && (
            <LegalFooterView
              showLegalLinks={true}
              showSellerInfo={true}
              legalLinks={shellData.footer.legalLinks}
              sellerInfo={shellData.footer.sellerInfo}
            />
          )}
        </>
      ) : (
        <Footer
          legalLinks={shellData.footer.legalLinks}
          sellerInfo={shellData.footer.sellerInfo}
          socialLinks={shellData.footer.socialLinks}
          tagline={shellData.footer.tagline}
          logo={shellData.logo}
        />
      )}
      <FloatingActions
        floatingCoffee={shellData.floatingCoffee}
        showFloatingChat={shellData.floatingChat.showFloatingChat}
        zaloChatUrl={shellData.floatingChat.zaloChatUrl}
      />
    </div>
  )
}
