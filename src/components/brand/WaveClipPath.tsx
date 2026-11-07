import React from 'react'

/**
 * PK-20: Shared SVG clipPath definition for wave-shaped brand images.
 * Uses objectBoundingBox coordinates (0..1) so it smoothly scales to any image aspect ratio.
 */
export function WaveClipPath() {
  return (
    <svg
      width="0"
      height="0"
      className="absolute pointer-events-none overflow-hidden"
      style={{ position: 'absolute', width: 0, height: 0 }}
      aria-hidden="true"
    >
      <defs>
        <clipPath id="tdcx-brand-image-wave" clipPathUnits="objectBoundingBox">
          <path d="M 0,0.04 C 0.22,0 0.48,0.06 0.72,0.02 C 0.86,-0.01 0.95,0.02 1,0.04 L 1,0.96 C 0.82,0.99 0.62,0.94 0.42,0.98 C 0.22,1.01 0.08,0.97 0,0.96 Z" />
        </clipPath>
      </defs>
    </svg>
  )
}
