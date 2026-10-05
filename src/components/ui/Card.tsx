import React from 'react'

export type CardVariant = 'white' | 'soft-pink' | 'lavender-mist'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  as?: 'div' | 'article' | 'section'
  children: React.ReactNode
  className?: string
}

export const CARD_BG_VARIANTS: Record<CardVariant, string> = {
  white: 'bg-white',
  'soft-pink': 'bg-soft-pink',
  'lavender-mist': 'bg-lavender-mist',
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    variant = 'white',
    as: Component = 'div',
    children,
    className = '',
    ...rest
  },
  ref
) {
  const bgClass = CARD_BG_VARIANTS[variant]
  const cardClasses = [
    'rounded-card border border-deep-navy/10 shadow-soft transition-all duration-200 p-6',
    bgClass,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Component ref={ref} className={cardClasses} {...rest}>
      {children}
    </Component>
  )
})
