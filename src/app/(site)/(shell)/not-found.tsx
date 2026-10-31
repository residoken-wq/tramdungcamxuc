import React from 'react'
import { Button } from '@/components/ui/Button'
import { vi } from '@/lib/i18n/vi'
import { PATHS } from '@/lib/paths'

export default function ShellNotFound() {
  return (
    <div className="w-full bg-warm-ivory py-16 sm:py-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="max-w-xl mx-auto">
        <span className="font-ui font-bold text-xs uppercase tracking-widest text-bright-magenta mb-3 block">
          404
        </span>

        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl uppercase tracking-tight text-deep-navy mb-4 leading-[1.3]">
          {vi.notFound.title}
        </h1>

        <p className="font-sans text-base sm:text-lg text-deep-navy/80 mb-8 leading-relaxed">
          {vi.notFound.description}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button href="/" variant="primary" size="md" className="w-full sm:w-auto">
            {vi.notFound.homeButton}
          </Button>
          <Button href={PATHS.resources} variant="secondary" size="md" className="w-full sm:w-auto">
            {vi.notFound.libraryButton}
          </Button>
        </div>
      </div>
    </div>
  )
}
