// Usage: pnpm seed:eb11
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { seedEb11Session } from './eb11-session-lib'

const payload = await getPayload({ config })

try {
  const result = await seedEb11Session(payload)

  console.log('\n================== KẾT QUẢ CHUẨN BỊ BUỔI THỬ BUILDER EB-11 ==================')
  console.log(`- Trang thử: ${result.pageTitle} (ID: ${result.pageId})`)
  console.log(
    `- Ảnh mẫu tải lên: ${result.mediaIds.length} ảnh (IDs: ${result.mediaIds.join(', ')})`,
  )
  console.log(`- Sao lưu designSystem: ${result.backupPath}`)
  console.log(`- Mốc thời gian bắt đầu: ${result.startedAt}`)
  console.log(
    `- Trạng thái: ${result.alreadySeeded ? 'Đã chuẩn bị từ trước (không tạo thêm)' : 'Đã tạo mới thành công'}`,
  )
  console.log('=============================================================================\n')
} catch (error) {
  console.error('Lỗi khi chuẩn bị dữ liệu buổi thử builder EB-11:', error)
  await payload.destroy()
  process.exit(1)
} finally {
  await payload.destroy()
}

process.exit(0)
