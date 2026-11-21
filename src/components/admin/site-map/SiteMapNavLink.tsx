import React from 'react'
import { vi } from '@/lib/i18n/vi'

/** Link to the site map at the top of the CMS side menu. */
export function SiteMapNavLink() {
  return (
    <a href="/admin/so-do-website" className="site-map-nav-link" data-testid="site-map-nav-link">
      <span aria-hidden="true">🗺️</span> {vi.cms.siteMap.navLink}
    </a>
  )
}
