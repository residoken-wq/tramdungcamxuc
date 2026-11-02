// Usage:
// Dry-run (mặc định - chỉ in diff):
//   pnpm payload run scripts/hb26-habit-content.ts
// Ghi vào database (kèm tạo file backup trong backups/):
//   pnpm payload run scripts/hb26-habit-content.ts apply
//   (hoặc pnpm payload run scripts/hb26-habit-content.ts -- --apply hoặc cross-env APPLY=true ...)
import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import {
  buildHabitContentPatch,
  formatHabitContentDiff,
} from '../src/lib/habit/hb26-content-patch'

export { buildHabitContentPatch } from '../src/lib/habit/hb26-content-patch'

const isApply =
  process.argv.includes('--apply') ||
  process.argv.includes('apply') ||
  process.env.APPLY === 'true' ||
  process.env.npm_config_apply === 'true'
const payload = await getPayload({ config })

try {
  const current = await payload.findGlobal({
    slug: 'habitJourneyContent',
    depth: 0,
  })

  const patch = buildHabitContentPatch(current)

  if (!patch) {
    console.log('✅ Dữ liệu habitJourneyContent đã hoàn toàn khớp bản mới v2 (0 diff). Không cần cập nhật.')
  } else {
    const diffOutput = formatHabitContentDiff(current, patch)

    if (!isApply) {
      console.log('======================================================================')
      console.log('🔍 [DRY-RUN] HB-26 HABIT CONTENT PATCH - CHƯA GHI VÀO DATABASE')
      console.log('======================================================================\n')
      console.log(diffOutput)
      console.log('\n======================================================================')
      console.log('👉 Để ghi bản vá này vào database, chạy lại kèm cờ --apply:')
      console.log('   pnpm payload run scripts/hb26-habit-content.ts --apply')
      console.log('======================================================================')
    } else {
      // 1. Sao lưu bản global hiện tại vào backups/
      const backupDir = path.resolve(process.cwd(), 'backups')
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupPath = path.join(backupDir, `habitJourneyContent-${timestamp}.json`)
      fs.writeFileSync(backupPath, JSON.stringify(current, null, 2), 'utf-8')
      console.log(`📦 Đã lưu bản sao lưu an toàn tại: ${backupPath}`)

      // 2. Ghi bản vá vào global
      await payload.updateGlobal({
        slug: 'habitJourneyContent',
        data: patch,
      })

      console.log('======================================================================')
      console.log('✅ ĐÃ ÁP DỤNG THÀNH CÔNG BẢN VÁ NỘI DUNG HABIT V2 VÀO DATABASE!')
      console.log('======================================================================\n')
      console.log(diffOutput)
      console.log('\n======================================================================')
    }
  }
} catch (error) {
  console.error('❌ Lỗi khi thực hiện hb26-habit-content:', error)
  process.exit(1)
} finally {
  await payload.destroy()
}
process.exit(0)
