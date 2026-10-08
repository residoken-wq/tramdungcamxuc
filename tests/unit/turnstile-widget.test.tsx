import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import { TurnstileWidget } from '@/components/site/forms/TurnstileWidget'

type RenderOptions = { callback?: (token: string) => void }

describe('TurnstileWidget', () => {
  let renderSpy: ReturnType<typeof vi.fn>
  let lastOptions: RenderOptions | undefined

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '1x00000000000000000000AA')
    lastOptions = undefined
    renderSpy = vi.fn((_el: HTMLElement, options: RenderOptions) => {
      lastOptions = options
      return 'widget-1'
    })
    window.turnstile = {
      render: renderSpy as unknown as NonNullable<Window['turnstile']>['render'],
      reset: vi.fn(),
      remove: vi.fn(),
    }
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllEnvs()
    delete window.turnstile
  })

  it('renders the challenge once even when the parent passes new callbacks on every render', () => {
    const { rerender } = render(<TurnstileWidget onVerify={() => {}} />)
    for (let i = 0; i < 5; i++) {
      // Inline arrows are new on each render, exactly like the forms do on every keystroke.
      rerender(<TurnstileWidget onVerify={() => {}} />)
    }
    expect(renderSpy).toHaveBeenCalledTimes(1)
  })

  it('calls the latest onVerify callback', () => {
    const first = vi.fn()
    const latest = vi.fn()
    const { rerender } = render(<TurnstileWidget onVerify={first} />)
    rerender(<TurnstileWidget onVerify={latest} />)
    act(() => lastOptions?.callback?.('token-123'))
    expect(latest).toHaveBeenCalledWith('token-123')
    expect(first).not.toHaveBeenCalled()
  })

  it('renders nothing without a site key', () => {
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '')
    const { container } = render(<TurnstileWidget onVerify={() => {}} />)
    expect(container.innerHTML).toBe('')
    expect(renderSpy).not.toHaveBeenCalled()
  })
})
