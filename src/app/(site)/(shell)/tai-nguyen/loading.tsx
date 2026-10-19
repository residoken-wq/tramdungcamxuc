import React from 'react'

export default function Loading() {
  return (
    <div className="w-full bg-warm-ivory min-h-screen py-8 sm:py-12 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="mb-8 sm:mb-12 text-center max-w-xl mx-auto flex flex-col items-center">
          <div className="h-4 w-32 bg-lavender-mist/60 rounded-full mb-3" />
          <div className="h-10 sm:h-12 w-3/4 bg-lavender-mist/80 rounded-xl mb-4" />
          <div className="h-5 w-1/2 bg-lavender-mist/50 rounded-lg" />
        </div>

        {/* Filter Bar Skeleton */}
        <div className="mb-8 sm:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white/70 border border-deep-navy/5 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 w-24 bg-lavender-mist/50 rounded-full" />
            ))}
          </div>
          <div className="h-11 w-full md:w-72 bg-lavender-mist/50 rounded-xl" />
        </div>

        {/* Featured Post Card Skeleton */}
        <div className="mb-10 sm:mb-12 rounded-2xl bg-white border border-deep-navy/5 shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[300px]">
          <div className="lg:col-span-6 bg-lavender-mist/40 min-h-[220px]" />
          <div className="p-6 sm:p-8 lg:col-span-6 flex flex-col justify-center gap-4">
            <div className="h-4 w-28 bg-lavender-mist/60 rounded-full" />
            <div className="h-8 w-4/5 bg-lavender-mist/80 rounded-lg" />
            <div className="h-4 w-full bg-lavender-mist/50 rounded" />
            <div className="h-4 w-3/4 bg-lavender-mist/50 rounded" />
            <div className="mt-4 pt-4 border-t border-deep-navy/5 flex justify-between items-center">
              <div className="h-5 w-24 bg-lavender-mist/60 rounded" />
              <div className="h-4 w-16 bg-lavender-mist/40 rounded" />
            </div>
          </div>
        </div>

        {/* Grid Skeletons (3 cols) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-white border border-deep-navy/5 shadow-xs overflow-hidden flex flex-col"
            >
              <div className="aspect-[16/10] w-full bg-lavender-mist/40" />
              <div className="p-5 flex flex-col gap-3 flex-1">
                <div className="h-3 w-20 bg-lavender-mist/50 rounded-full" />
                <div className="h-6 w-5/6 bg-lavender-mist/80 rounded" />
                <div className="h-4 w-full bg-lavender-mist/40 rounded mt-2" />
                <div className="mt-auto pt-3 border-t border-deep-navy/5 flex justify-between items-center">
                  <div className="h-4 w-20 bg-lavender-mist/50 rounded" />
                  <div className="h-3 w-14 bg-lavender-mist/40 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
