// Usage: pnpm import:habit
// Imports Hana's Habit Hack workbook (16 quiz questions, 11 techniques, 20 lessons in
// 7 modules). Safe to re-run: existing records are kept; only sample records are removed.
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { importHabitHack } from './import/habit-hack'

const payload = await getPayload({ config })
try {
  console.table(await importHabitHack(payload))
  console.log('Đã nhập nội dung Habit Hack thật. Bản ghi đã có được giữ nguyên.')
} finally {
  await payload.destroy()
}
process.exit(0)
