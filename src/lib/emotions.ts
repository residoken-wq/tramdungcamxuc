import React from 'react'

// PENDING Q14: Default sample emotion list pending final decision from Hana.
// This list contains 6 sample emotions with thin-line SVG icons (strictly no emojis)
// following tdcx-brand and ui-ux-pro-max design guidelines.

export interface Emotion {
  key: string
  label: string
  icon: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element
}

/**
 * Helper to build SVG elements with React.createElement so src/lib/emotions.ts
 * remains a valid .ts file per specification.
 */
function createSvg(
  paths: React.ReactNode[],
  props: React.SVGProps<SVGSVGElement>,
  viewBox = '0 0 24 24'
) {
  return React.createElement(
    'svg',
    {
      viewBox,
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '1.5',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': true,
      ...props,
    },
    ...paths
  )
}

function CalmIcon(props: React.SVGProps<SVGSVGElement>) {
  return createSvg(
    [
      React.createElement('path', { key: '1', d: 'M12 4v2m-6 3l1.5 1.5m10.5-1.5L16.5 10.5' }),
      React.createElement('path', { key: '2', d: 'M8 12a4 4 0 018 0' }),
      React.createElement('path', { key: '3', d: 'M3 17c2 0 3-1 4.5-1s2.5 1 4.5 1 3-1 4.5-1 2.5 1 4.5 1' }),
      React.createElement('path', { key: '4', d: 'M3 20c2 0 3-1 4.5-1s2.5 1 4.5 1 3-1 4.5-1 2.5 1 4.5 1' }),
    ],
    props
  )
}

function GratefulIcon(props: React.SVGProps<SVGSVGElement>) {
  return createSvg(
    [
      React.createElement('path', {
        key: '1',
        d: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
      }),
      React.createElement('path', { key: '2', d: 'M12 8v3m0 0l-1.5-1.5M12 11l1.5-1.5' }),
    ],
    props
  )
}

function EnergizedIcon(props: React.SVGProps<SVGSVGElement>) {
  return createSvg(
    [
      React.createElement('circle', { key: '1', cx: 12, cy: 12, r: 4 }),
      React.createElement('path', {
        key: '2',
        d: 'M12 2v3m0 14v3M2 12h3m14 0h3M4.93 4.93l2.12 2.12m9.9 9.9l2.12 2.12M4.93 19.07l2.12-2.12m9.9-9.9l2.12-2.12',
      }),
    ],
    props
  )
}

function OverwhelmedIcon(props: React.SVGProps<SVGSVGElement>) {
  return createSvg(
    [
      React.createElement('path', { key: '1', d: 'M17.5 19H9a7 7 0 116.71-9h1.79a4.5 4.5 0 110 9z' }),
      React.createElement('path', { key: '2', d: 'M10 13c1-1 3-1 4 0s-1 3-2 3' }),
    ],
    props
  )
}

function TiredIcon(props: React.SVGProps<SVGSVGElement>) {
  return createSvg(
    [
      React.createElement('path', { key: '1', d: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z' }),
      React.createElement('path', { key: '2', d: 'M12 11h2m-1-1v2' }),
    ],
    props
  )
}

function AnxiousIcon(props: React.SVGProps<SVGSVGElement>) {
  return createSvg(
    [
      React.createElement('path', { key: '1', d: 'M12 3v18' }),
      React.createElement('path', { key: '2', d: 'M12 8c3-3 7-2 8 2s-3 6-8 4' }),
      React.createElement('path', { key: '3', d: 'M12 8c-3-3-7-2-8 2s3 6 8 4' }),
      React.createElement('circle', { key: '4', cx: 12, cy: 7, r: 1, fill: 'currentColor' }),
    ],
    props
  )
}

export const EMOTIONS: readonly Emotion[] = [
  {
    key: 'calm',
    label: 'Bình yên',
    icon: CalmIcon,
  },
  {
    key: 'grateful',
    label: 'Biết ơn',
    icon: GratefulIcon,
  },
  {
    key: 'energized',
    label: 'Hào hứng',
    icon: EnergizedIcon,
  },
  {
    key: 'overwhelmed',
    label: 'Quá tải',
    icon: OverwhelmedIcon,
  },
  {
    key: 'tired',
    label: 'Mệt mỏi',
    icon: TiredIcon,
  },
  {
    key: 'anxious',
    label: 'Lo âu',
    icon: AnxiousIcon,
  },
] as const

export type EmotionKey = (typeof EMOTIONS)[number]['key']

/**
 * Retrieve emotion object by key.
 */
export function getEmotion(key: string | null | undefined): Emotion | undefined {
  if (!key) return undefined
  return EMOTIONS.find((e) => e.key === key)
}
