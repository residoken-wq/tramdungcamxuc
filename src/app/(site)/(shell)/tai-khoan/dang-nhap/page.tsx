import React from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getCurrentCustomer } from '@/lib/auth/session.server'
import { getSafeRedirectUrl } from '@/lib/auth/redirect'
import { resolveLoginMethods } from '@/lib/auth/methods'
import { LoginForm } from '@/components/site/account/LoginForm'

export const metadata: Metadata = {
  title: 'Đăng nhập | Trạm Dừng Cảm Xúc',
  robots: {
    index: false,
    follow: false,
  },
}

interface LoginPageProps {
  searchParams: Promise<{ next?: string; loi?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedParams = await searchParams
  const safeNext = getSafeRedirectUrl(resolvedParams.next)

  // If customer is already authenticated, redirect to destination
  const existingCustomer = await getCurrentCustomer()
  if (existingCustomer) {
    redirect(safeNext)
  }

  const payload = await getPayload({ config })
  const settings = await payload.findGlobal({ slug: 'siteSettings', overrideAccess: true })
  const methods = resolveLoginMethods(settings)

  return (
    <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-16rem)] flex items-center justify-center">
      <div className="w-full max-w-md">
        <LoginForm
          initialNext={safeNext}
          methods={methods}
          initialError={resolvedParams.loi}
        />
      </div>
    </section>
  )
}
