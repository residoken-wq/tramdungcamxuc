import React from 'react'
import Link from 'next/link'
import { safeHref } from '@/lib/safe-href'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonBaseProps {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

export type ButtonAsButton = ButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & {
    href?: undefined
  }

export type ButtonAsLink = ButtonBaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps> & {
    href: string
  }

export type ButtonProps = ButtonAsButton | ButtonAsLink

/**
 * Tập trung logic màu nút và cỡ chữ để phục vụ Q13 (WCAG AA Contrast Rule).
 * Quy tắc:
 * - Chữ trắng trên accent-pink chỉ đạt 3.73:1 (đạt WCAG AA khi là chữ lớn ≥ 18.66px đậm).
 * - Ở size 'sm', variant 'primary' tự động chuyển sang 'secondary' (deep-navy, 15.11:1) để bảo đảm tương phản.
 * - Khi Hana chốt Q13 (ví dụ chuyển sang bright-magenta hoặc giữ nguyên), chỉ cần sửa tại bảng này.
 */
export const BUTTON_STYLES = {
  variants: {
    primary: 'bg-accent-pink text-white hover:opacity-95 active:opacity-90',
    secondary: 'bg-deep-navy text-white hover:opacity-95 active:opacity-90',
    ghost:
      'border border-deep-navy/30 bg-transparent text-deep-navy hover:bg-deep-navy/5 active:bg-deep-navy/10',
  },
  sizes: {
    // Size sm: nếu là secondary hoặc ghost thì dùng text-sm. Nếu là primary thì đã fallback sang secondary.
    sm: 'min-h-[44px] min-w-[44px] px-4 py-2 text-sm font-semibold',
    // Size md & lg: dùng text-[19px] / text-[20px] đậm (≥ 18.66px) đạt chuẩn WCAG AA cho primary
    md: 'min-h-[48px] min-w-[48px] px-6 py-2.5 text-[19px] font-bold tracking-tight',
    lg: 'min-h-[56px] min-w-[56px] px-8 py-3.5 text-[20px] font-bold tracking-tight',
  },
} as const

export function resolveButtonClasses({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  disabled?: boolean
  className?: string
}): string {
  // Q13 Guardrail: size 'sm' không dùng variant 'primary' (fallback sang 'secondary')
  const effectiveVariant: ButtonVariant =
    size === 'sm' && variant === 'primary' ? 'secondary' : variant

  const variantClass = BUTTON_STYLES.variants[effectiveVariant]
  const sizeClass = BUTTON_STYLES.sizes[size]

  const baseClasses =
    'relative inline-flex items-center justify-center rounded-xl font-ui transition-all duration-200 ' +
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-navy ' +
    'select-none cursor-pointer'

  const stateClasses =
    disabled || isLoading
      ? 'opacity-60 cursor-not-allowed pointer-events-none'
      : ''

  return [baseClasses, variantClass, sizeClass, stateClasses, className]
    .filter(Boolean)
    .join(' ')
}

function LoadingSpinner() {
  return (
    <svg
      className="mr-2 h-5 w-5 animate-spin text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  )
}

export const Button = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(function Button(props, ref) {
  const {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    className = '',
    children,
    ...rest
  } = props

  const classes = resolveButtonClasses({
    variant,
    size,
    isLoading,
    disabled,
    className,
  })

  // Nếu có href: render dạng thẻ Link của Next.js (không lồng button vào trong a hoặc ngược lại)
  if ('href' in rest && typeof rest.href === 'string') {
    const { href, ...anchorProps } = rest as ButtonAsLink
    const validatedHref = safeHref(href)
    if (!validatedHref) {
      return null
    }
    return (
      <Link
        href={validatedHref}
        ref={ref as React.Ref<HTMLAnchorElement>}
        className={classes}
        aria-disabled={disabled || isLoading ? 'true' : undefined}
        tabIndex={disabled || isLoading ? -1 : undefined}
        {...anchorProps}
      >
        {isLoading && <LoadingSpinner />}
        <span>{children}</span>
      </Link>
    )
  }

  // Mặc định: render dạng thẻ <button>
  const buttonProps = rest as ButtonAsButton
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={buttonProps.type || 'button'}
      className={classes}
      disabled={disabled || isLoading}
      aria-busy={isLoading ? 'true' : undefined}
      {...buttonProps}
    >
      {isLoading && <LoadingSpinner />}
      <span>{children}</span>
    </button>
  )
})
