import React from 'react'
import { redirect } from 'next/navigation'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import type { AdminViewServerProps } from 'payload'
import config from '@/payload.config'
import { isAdminUser } from '@/lib/auth/access'
import { loadSiteMap } from '@/lib/cms/site-map.server'
import { SiteMapExplorer } from './SiteMapExplorer'

// REVIEW-REQUIRED: custom admin view /admin/so-do-website. Signed-in admins (owner / editor) only;
// everyone else is sent to /admin/login. Reads with the user's own access (overrideAccess: false)
// and shows only page titles / addresses, product ids and the menu – no customer data.
export async function SiteMapView(props: AdminViewServerProps) {
  const payload = await getPayload({ config: await config })

  let user = props.initPageResult?.req?.user
  if (!user) {
    const headers = await getHeaders()
    user = (await payload.auth({ headers })).user
  }
  if (!user || !isAdminUser(user)) {
    redirect('/admin/login')
  }

  const data = await loadSiteMap(payload, user)
  return <SiteMapExplorer data={data} />
}
