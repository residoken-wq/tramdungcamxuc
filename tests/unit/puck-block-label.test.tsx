import { describe, it, expect } from 'vitest'
import { cleanBlockLabel, LABEL_FIELD, MAX_BLOCK_LABEL_LENGTH } from '@/puck/style/block-label'
import { fieldTab, isFieldVisible } from '@/puck/style/field-groups'
import { withBlockStyle } from '@/puck/style/with-block-style'
import React from 'react'

describe('EB-07: cleanBlockLabel', () => {
  it('returns undefined for non-strings and empty strings', () => {
    expect(cleanBlockLabel(null)).toBeUndefined()
    expect(cleanBlockLabel(undefined)).toBeUndefined()
    expect(cleanBlockLabel(123)).toBeUndefined()
    expect(cleanBlockLabel({})).toBeUndefined()
    expect(cleanBlockLabel('')).toBeUndefined()
    expect(cleanBlockLabel('   ')).toBeUndefined()
    expect(cleanBlockLabel('\n\t  \r')).toBeUndefined()
  })

  it('trims leading and trailing whitespace', () => {
    expect(cleanBlockLabel('  Khối giới thiệu  ')).toBe('Khối giới thiệu')
  })

  it('collapses multiple whitespace characters to a single space', () => {
    expect(cleanBlockLabel('Khối   giới   thiệu \n  bản   thân')).toBe('Khối giới thiệu bản thân')
  })

  it('strips control characters', () => {
    expect(cleanBlockLabel('Khối\u0000giới\u0008thiệu')).toBe('Khối giới thiệu')
  })

  it('enforces maximum length of 60 characters', () => {
    const longLabel = 'A'.repeat(80)
    const cleaned = cleanBlockLabel(longLabel)
    expect(cleaned).toBeDefined()
    expect(cleaned?.length).toBe(MAX_BLOCK_LABEL_LENGTH)
    expect(cleaned).toBe('A'.repeat(60))
  })
})

describe('EB-07: field-groups integration for _label', () => {
  it('places _label into the advanced tab', () => {
    expect(fieldTab(LABEL_FIELD)).toBe('advanced')
  })

  it('shows _label only when active tab is advanced', () => {
    expect(isFieldVisible(LABEL_FIELD, 'advanced')).toBe(true)
    expect(isFieldVisible(LABEL_FIELD, 'content')).toBe(false)
    expect(isFieldVisible(LABEL_FIELD, 'style')).toBe(false)
  })
})

describe('EB-07: withBlockStyle strips _label on render', () => {
  it('does not pass _label to the component render function', () => {
    let capturedProps: Record<string, unknown> | null = null

    const mockComponent = {
      label: 'Test Block',
      render: (props: Record<string, unknown>) => {
        capturedProps = props
        return <div data-testid="test-block">{String(props.title || '')}</div>
      },
    }

    const wrapped = withBlockStyle(mockComponent)
    expect(wrapped.fields).toHaveProperty(LABEL_FIELD)

    wrapped.render({
      id: 'test-1',
      title: 'Hello',
      _label: 'Custom Block Name',
    } as any)

    expect(capturedProps).not.toBeNull()
    expect(capturedProps).not.toHaveProperty('_label')
    expect(capturedProps).toHaveProperty('title', 'Hello')
  })
})
