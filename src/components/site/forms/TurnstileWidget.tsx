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
    onloadTurnstileCallback?: () => void
  }
}

export interface TurnstileWidgetProps {
  onVerify: (token: string) => void
  onError?: () => void
  onExpire?: () => void
  className?: string
}

export function TurnstileWidget({
  onVerify,
  onError,
  onExpire,
  className = '',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  // Forms pass new inline callbacks on every render (every keystroke). Keep the latest ones in a
  // ref so the widget is rendered once per mount instead of being torn down and re-challenged.
  const callbacksRef = useRef({ onVerify, onError, onExpire })
  useEffect(() => {
    callbacksRef.current = { onVerify, onError, onExpire }
  })

  useEffect(() => {
    if (!siteKey || typeof window === 'undefined' || !containerRef.current) {
      return
    }

    let isMounted = true

    function renderWidget() {
      if (!isMounted || !containerRef.current || !window.turnstile || !siteKey) return
      if (widgetIdRef.current) return

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => {
            if (isMounted) callbacksRef.current.onVerify(token)
          },
          'error-callback': () => {
            if (isMounted) callbacksRef.current.onError?.()
          },
          'expired-callback': () => {
            if (isMounted) callbacksRef.current.onExpire?.()
          },
        })
        widgetIdRef.current = id
      } catch {
        // Silently continue if rendering fails
      }
    }

    const scriptId = 'cloudflare-turnstile-script'
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null

    if (window.turnstile) {
      renderWidget()
    } else if (existingScript) {
      existingScript.addEventListener('load', renderWidget)
    } else {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.onload = renderWidget
      document.head.appendChild(script)
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
  }, [siteKey])

  if (!siteKey) {
    return null
  }

  return <div ref={containerRef} className={`my-2 flex justify-center ${className}`} />
}
