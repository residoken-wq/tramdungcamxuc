import React from 'react'

export default function Loading() {
  return (
    <div className="w-full bg-warm-ivory py-12 sm:py-16 animate-pulse">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="mb-10 text-center max-w-2xl mx-auto flex flex-col items-center">
          <div className="h-4 w-32 bg-lavender-mist/60 rounded-full mb-3" />
          <div className="h-10 sm:h-12 w-3/4 bg-lavender-mist/80 rounded-xl mb-4" />
          <div className="h-5 w-4/5 bg-lavender-mist/50 rounded-lg" />
        </div>

        {/* Search Bar Skeleton */}
        <div className="mb-10 max-w-2xl mx-auto">
          <div className="h-12 w-full bg-lavender-mist/50 rounded-full" />
        </div>

        {/* Category Pills Skeleton */}
        <div className="mb-12 flex flex-wrap justify-center gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-24 bg-lavender-mist/50 rounded-full" />
          ))}
        </div>

        {/* FAQ Accordion Skeletons */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="p-5 sm:p-6 rounded-card border bg-white border-deep-navy/10 shadow-soft"
            >
              <div className="h-6 w-3/4 bg-lavender-mist/70 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
