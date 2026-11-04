import { describe, it, expect } from 'vitest'
import { extractIdentityParts, formatIdentityStatement } from '@/lib/habit'

describe('extractIdentityParts (Z1 fallback parsing)', () => {
  it('tách đúng hành động và con người từ câu chuẩn đầy đủ', () => {
    const input = 'Tôi sẽ viết 500 từ mỗi ngày để trở thành tác giả có chiều sâu'
    const result = extractIdentityParts(input)
    expect(result.actionText).toBe('viết 500 từ mỗi ngày')
    expect(result.personText).toBe('tác giả có chiều sâu')
  })

  it('tách đúng khi không có tiền tố "Tôi sẽ"', () => {
    const input = 'chạy bộ 2km mỗi sáng để trở thành người sống khỏe và nhiều năng lượng'
    const result = extractIdentityParts(input)
    expect(result.actionText).toBe('chạy bộ 2km mỗi sáng')
    expect(result.personText).toBe('người sống khỏe và nhiều năng lượng')
  })

  it('tách đúng khi chỉ có "trở thành"', () => {
    const input = 'Tôi sẽ đọc sách 15 phút trở thành người có tri thức'
    const result = extractIdentityParts(input)
    expect(result.actionText).toBe('đọc sách 15 phút')
    expect(result.personText).toBe('người có tri thức')
  })

  it('tách đúng khi chỉ có con người "Để trở thành..."', () => {
    const input = 'Để trở thành người kiên trì và bền bỉ'
    const result = extractIdentityParts(input)
    expect(result.actionText).toBe('')
    expect(result.personText).toBe('người kiên trì và bền bỉ')
  })

  it('tách đúng khi chỉ có hành động "Tôi sẽ..."', () => {
    const input = 'Tôi sẽ tập yoga 30 phút mỗi ngày'
    const result = extractIdentityParts(input)
    expect(result.actionText).toBe('tập yoga 30 phút mỗi ngày')
    expect(result.personText).toBe('')
  })

  it('trả về chuỗi rỗng khi input null hoặc undefined hoặc khoảng trắng', () => {
    expect(extractIdentityParts(null)).toEqual({ actionText: '', personText: '' })
    expect(extractIdentityParts(undefined)).toEqual({ actionText: '', personText: '' })
    expect(extractIdentityParts('')).toEqual({ actionText: '', personText: '' })
    expect(extractIdentityParts('   ')).toEqual({ actionText: '', personText: '' })
  })

  it('tương thích hai chiều với formatIdentityStatement', () => {
    const action = 'viết mỗi sáng 20 phút'
    const person = 'người kể chuyện chân thành'
    const statement = formatIdentityStatement(action, person)
    const extracted = extractIdentityParts(statement)
    expect(extracted.actionText).toBe(action)
    expect(extracted.personText).toBe(person)
  })
})

