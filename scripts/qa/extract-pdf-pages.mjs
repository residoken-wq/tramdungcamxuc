import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

async function extractPages() {
  const rootDir = process.cwd()
  const pdfPath = path.resolve(rootDir, 'docs/design/cong-dong/source.pdf')
  const outDir = path.resolve(rootDir, 'docs/design/cong-dong/ref')

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const pdfData = fs.readFileSync(pdfPath)
  const pdfBase64 = pdfData.toString('base64')

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  const html = `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
</head>
<body style="margin: 0; background: #000;">
  <canvas id="pdf-canvas"></canvas>
</body>
</html>`

  await page.setContent(html)

  await page.evaluate(async (base64) => {
    // @ts-ignore
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
    const raw = atob(base64)
    const uint8Array = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) {
      uint8Array[i] = raw.charCodeAt(i)
    }
    // @ts-ignore
    window.pdfDoc = await window.pdfjsLib.getDocument({ data: uint8Array }).promise
    // @ts-ignore
    window.numPages = window.pdfDoc.numPages
  }, pdfBase64)

  const numPages = await page.evaluate(() => window.numPages)
  console.log(`Total PDF pages: ${numPages}`)

  for (let pageNum = 47; pageNum <= 57; pageNum++) {
    console.log(`Rendering page ${pageNum}...`)
    const dimensions = await page.evaluate(async (pNum) => {
      const pdfDoc = window.pdfDoc
      const pdfPage = await pdfDoc.getPage(pNum)
      const viewport = pdfPage.getViewport({ scale: 1.0 })
      const scale = 1440 / viewport.width
      const scaledViewport = pdfPage.getViewport({ scale })

      const canvas = document.getElementById('pdf-canvas')
      canvas.width = scaledViewport.width
      canvas.height = scaledViewport.height
      const ctx = canvas.getContext('2d')

      await pdfPage.render({
        canvasContext: ctx,
        viewport: scaledViewport,
      }).promise

      return { width: scaledViewport.width, height: scaledViewport.height }
    }, pageNum)

    const canvasHandle = await page.$('#pdf-canvas')
    if (canvasHandle) {
      const outFile = path.join(outDir, `p-${pageNum}.png`)
      await canvasHandle.screenshot({ path: outFile })
      console.log(`Saved ${outFile} (${dimensions.width}x${dimensions.height})`)
    }
  }

  await browser.close()
  console.log('Extraction complete!')
}

extractPages().catch((err) => {
  console.error(err)
  process.exit(1)
})
