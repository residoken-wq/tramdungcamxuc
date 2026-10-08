import { describe, it, expect } from 'vitest'
import { generateDuplicateSlug } from '@/puck/duplicate'

describe('Duplicate Slug Generation (T1-04)', () => {
  it('generates base duplicate slug for normal page', () => {
    const slug = generateDuplicateSlug('gioi-thieu', [])
    expect(slug).toBe('gioi-thieu-ban-sao')
  })

  it('generates base duplicate slug for homepage', () => {
    expect(generateDuplicateSlug('/', [])).toBe('trang-chu-ban-sao')
    expect(generateDuplicateSlug('', [])).toBe('trang-chu-ban-sao')
    expect(generateDuplicateSlug('trang-chu', [])).toBe('trang-chu-ban-sao')
  })

  it('increments counter suffix if base duplicate already exists', () => {
    const existing = ['gioi-thieu', 'gioi-thieu-ban-sao']
    const slug = generateDuplicateSlug('gioi-thieu', existing)
    expect(slug).toBe('gioi-thieu-ban-sao-2')
  })

  it('increments counter suffix further if multiple duplicates exist', () => {
    const existing = ['gioi-thieu', 'gioi-thieu-ban-sao', 'gioi-thieu-ban-sao-2']
    const slug = generateDuplicateSlug('gioi-thieu', existing)
    expect(slug).toBe('gioi-thieu-ban-sao-3')
  })

  it('handles slashes in inputs gracefully', () => {
    const slug = generateDuplicateSlug('/dich-vu/coaching/', ['dich-vu/coaching-ban-sao'])
    expect(slug).toBe('dich-vu/coaching-ban-sao-2')
  })
})
