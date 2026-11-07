import React from 'react'
import { describe, it, expect, vi as vitest, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

vitest.mock('next/navigation', () => ({
  useRouter: () => ({ push: vitest.fn(), refresh: vitest.fn(), replace: vitest.fn() }),
}))
vitest.mock('@/puck/actions', async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>()
  return { ...original, listTemplatesAction: vitest.fn(async () => ({ success: true, docs: [] })) }
})

import { vi } from '@/lib/i18n/vi'
import { puckConfig } from '@/puck/config'
import { getTemplateData, getTemplatesForKind } from '@/puck/templates'
import {
  TemplateModal,
  formatTemplateBlockSummary,
} from '@/app/(builder)/builder/[pageId]/PuckEditorClient'

/** Every string leaf of a nested object (functions are called with a sample argument). */
function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (typeof value === 'function') {
    const out = (value as (arg: string) => unknown)('1')
    return typeof out === 'string' ? [out] : []
  }
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings)
  return []
}

const config = puckConfig.components as Record<string, { label?: string }>

describe('EB-16 1.2: Container labels have no English in brackets', () => {
  it('vi.eb05 keeps only the HTML tag names (div / section) in brackets', () => {
    const english = /\((?:[A-Z][a-z]+)(?: [a-z]+)*\)/
    const offenders = strings(vi.eb05).filter((s) => english.test(s))
    expect(offenders).toEqual([])
    expect(vi.eb05.layout.directions.row).toBe('Hàng ngang')
    expect(vi.eb05.layout.tagOptions.div).toBe('Hộp chung (div)')
  })
})

describe('EB-16 1.1: "Gồm: …" summary of a built-in template', () => {
  it('lists the top-level block labels of the template data, without the English part', () => {
    for (const tpl of getTemplatesForKind('page')) {
      const data = getTemplateData(tpl.key, '[MẪU] Trang thử')
      const summary = formatTemplateBlockSummary(tpl.key, config, '[MẪU] Trang thử')
      if (!data?.content?.length) {
        expect(summary).toBeNull()
        continue
      }
      expect(summary, tpl.key).toMatch(/^Gồm: /)
      const first = config[data.content[0].type]?.label?.replace(/\s*\([^)]*\)$/, '').trim()
      expect(summary, tpl.key).toContain(first ?? data.content[0].type)
      const shown = summary!
        .replace(/^Gồm: /, '')
        .replace(/ \+\d+ khối$/, '')
        .split(' · ')
      expect(shown.length, tpl.key).toBe(Math.min(5, data.content.length))
      if (data.content.length > 5) {
        expect(summary, tpl.key).toContain(`+${data.content.length - 5} khối`)
      } else {
        expect(summary, tpl.key).not.toMatch(/\+\d+ khối/)
      }
    }
  })
})

describe('EB-16 1.1: confirm inside the template picker', () => {
  let confirmSpy: ReturnType<typeof vitest.spyOn>
  beforeEach(() => {
    confirmSpy = vitest.spyOn(window, 'confirm').mockReturnValue(true)
  })
  afterEach(() => {
    confirmSpy.mockRestore()
    cleanup()
  })

  const setup = () => {
    const onApply = vitest.fn()
    const onClose = vitest.fn()
    render(
      <TemplateModal
        onClose={onClose}
        pageTitle="[MẪU] Trang thử"
        pageKind="page"
        onApplyTemplate={onApply}
      />,
    )
    const first = getTemplatesForKind('page')[0]
    const card = screen
      .getByRole('heading', { name: first.label })
      .closest('div.rounded-xl') as HTMLElement
    return { onApply, onClose, card }
  }

  it('asks inside the card, never window.confirm; "Quay lại" cancels', () => {
    const { onApply, card } = setup()
    fireEvent.click(
      Array.from(card.querySelectorAll('button')).find(
        (b) => b.textContent === vi.eb08.useThisTemplate,
      )!,
    )
    expect(card.textContent).toContain(vi.builder.confirmApplyTemplate)
    const back = screen.getByRole('button', { name: vi.eb16.back })
    expect(document.activeElement).toBe(back)
    fireEvent.click(back)
    expect(onApply).not.toHaveBeenCalled()
    expect(card.textContent).not.toContain(vi.builder.confirmApplyTemplate)
    expect(confirmSpy).not.toHaveBeenCalled()
  })

  it('"Thay toàn bộ trang" applies; Esc while confirming only cancels the confirm', () => {
    const { onApply, onClose, card } = setup()
    const useBtn = () =>
      Array.from(card.querySelectorAll('button')).find(
        (b) => b.textContent === vi.eb08.useThisTemplate,
      )!
    fireEvent.click(useBtn())
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
    expect(card.textContent).not.toContain(vi.builder.confirmApplyTemplate)

    fireEvent.click(useBtn())
    const apply = screen.getByRole('button', { name: vi.eb16.replaceEntirePage })
    expect(apply.getAttribute('aria-describedby')).toBeTruthy()
    fireEvent.click(apply)
    expect(onApply).toHaveBeenCalledTimes(1)
    expect(confirmSpy).not.toHaveBeenCalled()
  })
})

describe('EB-16 1.3: quick title field on Tabs / Accordion', () => {
  it('both widgets put the quick title field first, items stay in `items`', () => {
    const tabs = puckConfig.components.TabsWidget as unknown as {
      fields: Record<string, { type: string; label?: string }>
    }
    const accordion = puckConfig.components.AccordionWidget as unknown as {
      fields: Record<string, { type: string; label?: string }>
    }
    expect(Object.keys(tabs.fields)[0]).toBe('quickTitles')
    expect(tabs.fields.quickTitles.type).toBe('custom')
    expect(tabs.fields.quickTitles.label).toBe(vi.eb16.tabTitlesLabel)
    expect(tabs.fields.items.type).toBe('array')
    expect(Object.keys(accordion.fields)[0]).toBe('quickTitles')
    expect(accordion.fields.quickTitles.label).toBe(vi.eb16.accordionTitlesLabel)
  })
})
