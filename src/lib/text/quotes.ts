/**
 * Strip wrapping straight or smart quotes from a string if present.
 * Leaves internal quotes intact (e.g. 'A "B" C' -> 'A "B" C').
 */
export function stripWrappingQuotes(text: string | undefined | null): string {
  if (!text) return ''
  const trimmed = text.trim()
  if (trimmed.length < 2) {
    if (trimmed === '"' || trimmed === '“' || trimmed === '”' || trimmed === "'") {
      return ''
    }
    return trimmed
  }

  const startChar = trimmed[0]
  const endChar = trimmed[trimmed.length - 1]

  const isStartQuote =
    startChar === '"' || startChar === '“' || startChar === '”' || startChar === "'"
  const isEndQuote = endChar === '"' || endChar === '“' || endChar === '”' || endChar === "'"

  if (isStartQuote && isEndQuote) {
    return trimmed.slice(1, -1).trim()
  }

  return trimmed
}
