// Usage: DEMO_SEED_ALLOW=true pnpm seed:demo-gd2:clean
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { cleanDemoGd2, collectDemoSeedFacts } from './demo-gd2-lib'
import { checkDemoSeedAllowed } from './demo-guard'

const payload = await getPayload({ config })

try {
  const facts = await collectDemoSeedFacts(payload)
  const guard = checkDemoSeedAllowed(process.env, facts)

  if (!guard.ok) {
    console.error(guard.reason)
    await payload.destroy()
    process.exit(1)
  }

  const tally = await cleanDemoGd2(payload)

  console.log('\n================== KẾT QUẢ XÓA DỮ LIỆU DEMO GĐ 2 ==================')
  const report = Object.entries(tally).map(([collection, deleted]) => ({
    collection,
    deleted,
  }))
  console.table(report)
  const total = Object.values(tally).reduce((acc, curr) => acc + curr, 0)
  console.log(`Đã xóa sạch toàn bộ ${total} bản ghi demo GĐ 2.`)
  console.log('===================================================================\n')
} catch (error) {
  console.error('Lỗi khi chạy lệnh xóa dữ liệu demo GĐ 2:', error)
  await payload.destroy()
  process.exit(1)
} finally {
  await payload.destroy()
}

process.exit(0)
