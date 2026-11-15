export type WordHighlightState = 'none' | 'highlight' | 'strike'

export interface TitleWordItem {
  word: string
  state: WordHighlightState
  index: number
}

interface ParsedWordToken {
  type: 'word'
  leadingPunct: string
  cleanWord: string
  trailingPunct: string
  state: WordHighlightState
}

interface WhitespaceToken {
  type: 'whitespace'
  raw: string
}

type Token = ParsedWordToken | WhitespaceToken

/**
 * Phân tích chuỗi tiêu đề thành danh sách từ và trạng thái nhấn/gạch ngang.
 */
export function parseTitleWords(text: unknown): {
  words: TitleWordItem[]
  tokens: Token[]
} {
  if (typeof text !== 'string' || !text.trim()) {
    return { words: [], tokens: [] }
  }

  // 1. Tìm các vùng đã được bao bởi *...* hoặc ~...~ (hỗ trợ nhiều từ bên trong)
  const ranges: Array<{ start: number; end: number; state: WordHighlightState }> = []
  const markerRegex = /(\*([^*]+)\*|~([^~]+)~)/g
  let m: RegExpExecArray | null
  while ((m = markerRegex.exec(text)) !== null) {
    ranges.push({
      start: m.index,
      end: markerRegex.lastIndex,
      state: m[2] !== undefined ? 'highlight' : 'strike',
    })
  }

  // 2. Tách chuỗi theo các khoảng trắng trong khi giữ nguyên các khoảng trắng đó
  const parts = text.split(/(\s+)/)
  const tokens: Token[] = []
  const words: TitleWordItem[] = []
  let cursor = 0
  let wordIndex = 0

  for (const part of parts) {
    if (!part) continue

    if (/^\s+$/.test(part)) {
      tokens.push({ type: 'whitespace', raw: part })
      cursor += part.length
      continue
    }

    const startPos = cursor
    const endPos = cursor + part.length
    cursor = endPos

    // Kiểm tra trực tiếp xem token có bao bởi *...* hoặc ~...~ kèm dấu câu không
    const hlDirect = part.match(/^([^\w\s*~]*)\*([^*~]+)\*([^\w\s*~]*)$/)
    const strikeDirect = part.match(/^([^\w\s*~]*)\~([^~*]+)\~([^\w\s*~]*)$/)

    let state: WordHighlightState = 'none'
    let leadingPunct = ''
    let cleanWord = ''
    let trailingPunct = ''

    if (hlDirect) {
      state = 'highlight'
      leadingPunct = hlDirect[1]
      cleanWord = hlDirect[2]
      trailingPunct = hlDirect[3]
    } else if (strikeDirect) {
      state = 'strike'
      leadingPunct = strikeDirect[1]
      cleanWord = strikeDirect[2]
      trailingPunct = strikeDirect[3]
    } else {
      // Kiểm tra xem token có nằm trong vùng nhiều từ của range không
      const matchingRange = ranges.find((r) => startPos < r.end && endPos > r.start)
      if (matchingRange) {
        state = matchingRange.state
      }

      const stripped = part.replace(/[*~]/g, '')
      const punctMatch = stripped.match(/^([^\w\s\u00C0-\u1EF9]*)(.*?)([^\w\s\u00C0-\u1EF9]*)$/)
      leadingPunct = punctMatch ? punctMatch[1] : ''
      cleanWord = punctMatch && punctMatch[2] ? punctMatch[2] : stripped
      trailingPunct = punctMatch ? punctMatch[3] : ''
    }

    const wordItem: TitleWordItem = {
      word: cleanWord || part,
      state,
      index: wordIndex,
    }

    words.push(wordItem)
    tokens.push({
      type: 'word',
      leadingPunct,
      cleanWord: cleanWord || part,
      trailingPunct,
      state,
    })

    wordIndex++
  }

  return { words, tokens }
}

/**
 * Xoay vòng trạng thái của một từ: none -> highlight (*) -> strike (~) -> none.
 * Trả về chuỗi tiêu đề mới đã được cập nhật.
 */
export function toggleTitleWordAt(text: unknown, targetWordIndex: number): string {
  if (typeof text !== 'string') return ''
  const { words, tokens } = parseTitleWords(text)
  if (!words[targetWordIndex]) return text

  const currentWordState = words[targetWordIndex].state
  const nextState: WordHighlightState =
    currentWordState === 'none'
      ? 'highlight'
      : currentWordState === 'highlight'
        ? 'strike'
        : 'none'

  // Cập nhật trạng thái của từ tương ứng trong tokens
  let currentWordCounter = 0
  for (const token of tokens) {
    if (token.type === 'word') {
      if (currentWordCounter === targetWordIndex) {
        token.state = nextState
        break
      }
      currentWordCounter++
    }
  }

  // Tái tạo lại chuỗi hoàn chỉnh
  let result = ''
  for (const token of tokens) {
    if (token.type === 'whitespace') {
      result += token.raw
    } else {
      const { leadingPunct, cleanWord, trailingPunct, state } = token
      if (state === 'highlight') {
        result += `${leadingPunct}*${cleanWord}*${trailingPunct}`
      } else if (state === 'strike') {
        result += `${leadingPunct}~${cleanWord}~${trailingPunct}`
      } else {
        result += `${leadingPunct}${cleanWord}${trailingPunct}`
      }
    }
  }

  return result
}
