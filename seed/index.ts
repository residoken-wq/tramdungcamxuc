// Usage: pnpm seed                        (refuses when NODE_ENV=production)
//        SEED_ALLOW_PROD=true pnpm seed   (demo server; still only touches isSample = true records)
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { canSeed } from './guard'
import { seed } from './seed'

if (!canSeed(process.env, process.argv)) {
  console.error(
    'Từ chối chạy seed khi NODE_ENV=production. Đặt SEED_ALLOW_PROD=true nếu đây là server demo.',
  )
  process.exit(1)
}

const payload = await getPayload({ config })
try {
  const report = await seed(payload)
  console.table(report)
  console.log('Seed dữ liệu MẪU xong. Chỉ bản ghi isSample = true được tạo/cập nhật.')
} finally {
  await payload.destroy()
}
process.exit(0)
