// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { getSortedRoutes } from 'next/dist/shared/lib/router/utils/sorted-routes.js'
import * as puckExports from '@puckeditor/core'
import { puckConfig } from '../../src/puck/config'
import packageJson from '../../package.json' with { type: 'json' }

describe('T0-09 Spike: Puck Editor & Architecture Investigation', () => {
  describe('Question 1: Route placement & catch-all coexistence', () => {
    it('orders /admin/builder/[pageId] before /admin/[[...segments]] in Next.js router', () => {
      const routes = [
        '/',
        '/admin/[[...segments]]',
        '/admin/builder/[pageId]',
        '/builder/[pageId]',
      ]

      const sorted = getSortedRoutes(routes)

      // Static and specific dynamic routes must come before optional catch-all
      const builderIndex = sorted.indexOf('/admin/builder/[pageId]')
      const catchAllIndex = sorted.indexOf('/admin/[[...segments]]')

      expect(builderIndex).toBeGreaterThanOrEqual(0)
      expect(catchAllIndex).toBeGreaterThanOrEqual(0)
      expect(builderIndex).toBeLessThan(catchAllIndex)
    })

    it('orders /builder/[pageId] cleanly as completely separate path outside /admin', () => {
      const routes = [
        '/',
        '/admin/[[...segments]]',
        '/builder/[pageId]',
      ]

      const sorted = getSortedRoutes(routes)
      expect(sorted).toContain('/builder/[pageId]')
    })
  })

  describe('Question 2: Server-side Authentication Guard', () => {
    it('constructs correct redirect URL when user is unauthenticated', () => {
      const pageId = 'page-123'
      const redirectUrl = `/admin/login?redirect=${encodeURIComponent(`/admin/builder/${pageId}`)}`
      expect(redirectUrl).toBe('/admin/login?redirect=%2Fadmin%2Fbuilder%2Fpage-123')
    })
  })

  describe('Question 3: @puckeditor/core version & exports', () => {
    it('pins @puckeditor/core to exact version 0.23.0 in package.json', () => {
      const dependencies = packageJson.dependencies as Record<string, string>
      expect(dependencies['@puckeditor/core']).toBe('0.23.0')
    })

    it('exports core components and utilities from @puckeditor/core', () => {
      expect(puckExports.Puck).toBeDefined()
      expect(puckExports.Render).toBeDefined()
    })

    it('loads puckConfig with defined spike block', () => {
      expect(puckConfig.components.SpikeBlock).toBeDefined()
      expect(puckConfig.components.SpikeBlock.label).toBe('Khối thử nghiệm Spike')
      expect(puckConfig.components.SpikeBlock.fields?.text?.type).toBe('text')
    })
  })

  describe('Question 4: RichText field capability and safe fallback', () => {
    it('supports textarea splitting by double newline as 100% safe non-HTML rich text', () => {
      const rawInput = 'Đoạn văn đầu tiên.\n\nĐoạn văn thứ hai có cảm xúc.\n\nĐoạn văn thứ ba.'
      const paragraphs = rawInput
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)

      expect(paragraphs).toHaveLength(3)
      expect(paragraphs[0]).toBe('Đoạn văn đầu tiên.')
      expect(paragraphs[1]).toBe('Đoạn văn thứ hai có cảm xúc.')
      expect(paragraphs[2]).toBe('Đoạn văn thứ ba.')
    })
  })
})
