import localFont from 'next/font/local'

export const anton = localFont({
  src: '../fonts/anton-400.woff2',
  weight: '400',
  style: 'normal',
  display: 'swap',
  variable: '--font-display',
})

export const montserrat = localFont({
  src: [
    {
      path: '../fonts/montserrat-400.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/montserrat-600.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../fonts/montserrat-700.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
  // Body/UI text is never the LCP; size-adjusted fallback avoids layout shift while it swaps in.
  preload: false,
  variable: '--font-ui',
})

export const playfair = localFont({
  src: '../fonts/playfair-display-italic.woff2',
  weight: '400',
  style: 'italic',
  display: 'swap',
  // Quote lines are never the LCP; skip preload so Anton (hero H1) gets the bandwidth first.
  preload: false,
  variable: '--font-quote',
})
