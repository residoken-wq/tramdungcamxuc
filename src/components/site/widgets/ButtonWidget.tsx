'use client'

import React from 'react'
import { BrandIcon } from '@/components/brand/BrandIcon'
import { Button, type ButtonSize, type ButtonVariant } from '@/components/ui/Button'
import { useClientPageSlug } from '@/puck/client-preview'
import { getSafeLink, type WidgetLinkProps } from './link-helper'
import { textTarget } from '@/puck/style/text-target'

export type ButtonAlign = 'left' | 'center' | 'right' | 'justify'

export interface ButtonWidgetProps extends WidgetLinkProps {
  version?: number
  text?: React.ReactNode
  variant?: ButtonVariant
  buttonSize?: ButtonSize
  icon?: string
  iconPosition?: 'before' | 'after'
  align?: ButtonAlign
}

const ALIGN_WRAPPER: Record<ButtonAlign, string> = {
  left: 'flex justify-start',
  center: 'flex justify-center',
  right: 'flex justify-end',
  justify: 'flex w-full',
}

export function ButtonWidget({
  id,
  text = 'Bấm vào đây',
  linkType = 'url',
  pageId,
  href = '#',
  newTab = false,
  variant = 'primary',
  buttonSize = 'md',
  icon = 'none',
  iconPosition = 'after',
  align = 'left',
  _resolved,
}: ButtonWidgetProps & { id?: string }) {
  const { slug: clientSlug } = useClientPageSlug(pageId, _resolved?.pageSlug)

  if (!text) return null

  const linkProps = getSafeLink(linkType, href, _resolved?.pageSlug ?? clientSlug, newTab)
  const wrapperClass = ALIGN_WRAPPER[align] || ALIGN_WRAPPER.left
  const isFull = align === 'justify'

  const iconElement =
    icon && icon !== 'none' ? (
      <BrandIcon
        name={icon}
        size={buttonSize === 'sm' ? 16 : buttonSize === 'lg' ? 22 : 18}
        className={iconPosition === 'before' ? 'mr-2 shrink-0' : 'ml-2 shrink-0'}
        aria-hidden="true"
      />
    ) : null

  const innerContent = (
    <span className="inline-flex items-center justify-center">
      {iconPosition === 'before' ? iconElement : null}
      <span {...textTarget(id, 'text')}>{text}</span>
      {iconPosition === 'after' ? iconElement : null}
    </span>
  )

  const buttonClass = isFull ? 'w-full justify-center text-center' : ''

  return (
    <div className={`w-full ${wrapperClass}`}>
      {linkProps ? (
        <Button
          href={linkProps.href}
          target={linkProps.target}
          rel={linkProps.rel}
          variant={variant}
          size={buttonSize}
          className={buttonClass}
        >
          {innerContent}
        </Button>
      ) : (
        <Button variant={variant} size={buttonSize} className={buttonClass}>
          {innerContent}
        </Button>
      )}
    </div>
  )
}
