/**
 * Split a legal markdown file into its title (first "# " heading) and body.
 * The page already shows the CMS title, so the heading is not repeated in the content.
 */
export function legalMarkdownBody(markdown: string): { title: string; body: string } {
  const text = markdown.replace(/^﻿/, '').replace(/\r\n/g, '\n')
  const match = text.match(/^\s*#\s+(.+)\n/)
  if (!match) return { title: '', body: text.trim() }
  return { title: match[1].trim(), body: text.slice(match[0].length).trim() }
}
