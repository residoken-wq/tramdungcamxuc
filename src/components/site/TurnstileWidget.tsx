'use client'

import React, { useEffect, useRef } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string
          callback?: (token: string) => void
          'expired-callback'?: () => void
          'error-callback'?: () => void
          theme?: 'light' | 'dark' | 'auto'
          size?: 'normal' | 'flexible' | 'compact'
        },
      ) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
    }
  }
}

export interface TurnstileWidgetProps {
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: () => void
  className?: string
}

const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script'

/**
 * TurnstileWidget client component.
 * Only loads challenges.cloudflare.com script when NEXT_PUBLIC_TURNSTILE_SITE_KEY is provided.
 * When absent, renders nothing (bypassed in local/dev environments).
 */
export function TurnstileWidget({
  onVerify,
  onExpire,
  onError,
  className = '',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey || !containerRef.current) {
      return
    }

    let isMounted = true

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.turnstile) return

      // Clean up previous widget instance if any
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          // ignore
        }
        widgetIdRef.current = null
      }

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            if (isMounted) onVerify(token)
          },
          'expired-callback': () => {
            if (isMounted) onExpire?.()
          },
          'error-callback': () => {
            if (isMounted) onError?.()
          },
          theme: 'light',
        })
        widgetIdRef.current = id
      } catch (err) {
        console.error('[Turnstile] Render error:', err)
      }
    }

    // Load Turnstile script if not already present
    if (!document.getElementById(TURNSTILE_SCRIPT_ID)) {
      const script = document.createElement('script')
      script.id = TURNSTILE_SCRIPT_ID
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.onload = () => {
        if (window.turnstile) renderWidget()
      }
      document.head.appendChild(script)
    } else if (window.turnstile) {
      renderWidget()
    } else {
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval)
          renderWidget()
        }
      }, 100)
      return () => clearInterval(interval)
    }

    return () => {
      isMounted = false
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          // ignore
        }
        widgetIdRef.current = null
      }
    }
  }, [siteKey, onVerify, onExpire, onError])

  if (!siteKey) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={`min-h-[65px] flex justify-center items-center my-3 ${className}`}
      data-testid="turnstile-widget"
    />
  )
}
