// Usage: DEMO_SEED_ALLOW=true pnpm seed:demo-gd2
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { seedDemoGd2, collectDemoSeedFacts } from './demo-gd2-lib'
import { checkDemoSeedAllowed, checkDemoSeedEnv } from './demo-guard'

const envGuard = checkDemoSeedEnv(process.env)
if (!envGuard.ok) {
  console.error(envGuard.reason)
  process.exit(1)
}

const payload = await getPayload({ config })

try {
  const facts = await collectDemoSeedFacts(payload)
  const guard = checkDemoSeedAllowed(process.env, facts)

  if (!guard.ok) {
    console.error(guard.reason)
    await payload.destroy()
    process.exit(1)
  }

  const result = await seedDemoGd2(payload)

  console.log('\n================== KẾT QUẢ TẠO DỮ LIỆU DEMO GĐ 2 ==================')
  console.table(result.rows)
  console.log('Đã tạo thành công 3 khách demo, 1 đơn chờ, 1 đơn đã mua, 1 workshop demo.')
  console.log('Chạy lại lệnh này bất cứ lúc nào để reset về trạng thái ban đầu.')
  console.log('===================================================================\n')
} catch (error) {
  console.error('Lỗi khi chạy seed dữ liệu demo GĐ 2:', error)
  await payload.destroy()
  process.exit(1)
} finally {
  await payload.destroy()
}

process.exit(0)
