import 'server-only'
import fs from 'node:fs/promises'
import path from 'node:path'

export interface FontCache {
  anton: ArrayBuffer
  montserrat400: ArrayBuffer
  montserrat700: ArrayBuffer
  playfairItalic: ArrayBuffer
}

let cachedFonts: FontCache | null = null

export async function loadFonts(): Promise<FontCache> {
  if (cachedFonts) return cachedFonts

  const fontsDir = path.join(process.cwd(), 'src/fonts/og')
  const [antonBuf, mont400Buf, mont700Buf, playfairBuf] = await Promise.all([
    fs.readFile(path.join(fontsDir, 'anton-400.ttf')),
    fs.readFile(path.join(fontsDir, 'montserrat-400.ttf')),
    fs.readFile(path.join(fontsDir, 'montserrat-700.ttf')),
    fs.readFile(path.join(fontsDir, 'playfair-display-italic.ttf')),
  ])

  cachedFonts = {
    anton: antonBuf.buffer.slice(antonBuf.byteOffset, antonBuf.byteOffset + antonBuf.byteLength),
    montserrat400: mont400Buf.buffer.slice(
      mont400Buf.byteOffset,
      mont400Buf.byteOffset + mont400Buf.byteLength,
    ),
    montserrat700: mont700Buf.buffer.slice(
      mont700Buf.byteOffset,
      mont700Buf.byteOffset + mont700Buf.byteLength,
    ),
    playfairItalic: playfairBuf.buffer.slice(
      playfairBuf.byteOffset,
      playfairBuf.byteOffset + playfairBuf.byteLength,
    ),
  }

  return cachedFonts
}
