// Usage: pnpm sample:report
// Read-only: lists the sample records (isSample = true) left in the database, e.g. after moving the
// demo database to production, so Hana can replace or delete them in the admin. Changes nothing.
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { buildSampleReport } from './sample-report-lib'

const payload = await getPayload({ config })
try {
  const report = await buildSampleReport(payload)
  console.table(report.summary)
  for (const row of report.rows) {
    console.log(
      `${row.collection}\t#${row.id}\t${row.status}\t${row.hasSampleText ? 'còn chữ [MẪU]' : 'đã sửa chữ'}\t${row.title}`,
    )
  }
  console.log(
    report.rows.length === 0
      ? 'Không còn dữ liệu mẫu.'
      : `Còn ${report.rows.length} bản ghi mẫu. Mở admin, sửa thành nội dung thật hoặc xóa.`,
  )
} finally {
  await payload.destroy()
}
process.exit(0)
