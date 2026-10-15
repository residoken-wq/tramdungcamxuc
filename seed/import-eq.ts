// Usage: EQ_CARDS_FILE=/path/to/cards.json pnpm import:eq
import fs from 'node:fs'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { importEqCards, validateEqCardsFilePath } from './import/eq-cards'

const filePath = validateEqCardsFilePath(process.env.EQ_CARDS_FILE)
const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

const payload = await getPayload({ config })
try {
  const report = await importEqCards(payload, raw)
  console.table(report)
  console.log('Đã nhập dữ liệu thẻ EQ thật thành công.')
} finally {
  await payload.destroy()
}
process.exit(0)
