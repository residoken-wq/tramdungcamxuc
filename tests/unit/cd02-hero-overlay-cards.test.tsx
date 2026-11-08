import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import {
  OVERLAY_CLASSES,
  heroOverlayClass,
  type HeroOverlayStrength,
  type HeroOverlayTone,
} from '@/lib/brand/hero-backdrop'
import { HeroImage } from '@/components/site/HeroImage'

describe('CD-02 §1: Hero backdrop overlay classes', () => {
  it('all 6 overlay classes exist literally in hero-backdrop.ts source for Tailwind scanner', () => {
    const sourcePath = path.resolve(process.cwd(), 'src/lib/brand/hero-backdrop.ts')
    const sourceCode = fs.readFileSync(sourcePath, 'utf-8')

    const tones: HeroOverlayTone[] = ['dark', 'light']
    const strengths: HeroOverlayStrength[] = ['md', 'lg', 'xl']

    for (const tone of tones) {
      for (const strength of strengths) {
        const cls = OVERLAY_CLASSES[tone][strength]
        expect(cls).toBeTruthy()
        // Must appear verbatim in the source file
        expect(sourceCode).toContain(`'${cls}'`)
        // heroOverlayClass returns this exact class
        expect(heroOverlayClass(tone, strength)).toBe(cls)
      }
    }
  })

  it('renders HeroImage with backdrop layout and image having correct overlay class', () => {
    const { container } = render(
      <HeroImage
        titleLine1="Tiêu đề thử nghiệm"
        titleLine2="Dòng 2"
        layout="backdrop"
        overlayTone="dark"
        overlayStrength="lg"
        imageUrl="/brand/sample-cover.svg"
        imageAlt="Ảnh bìa mẫu"
      />,
    )

    // Find overlay element with aria-hidden="true"
    const overlay = container.querySelector('[aria-hidden="true"]')
    expect(overlay).toBeTruthy()
    expect(overlay?.className).toContain('bg-deep-navy/75')
  })
})

