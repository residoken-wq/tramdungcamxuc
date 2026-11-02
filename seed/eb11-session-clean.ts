// Usage: pnpm seed:eb11:clean
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { cleanEb11Session } from './eb11-session-lib'

const payload = await getPayload({ config })

try {
  const result = await cleanEb11Session(payload)

  console.log('\n================== KẾT QUẢ DỌN DỮ LIỆU BUỔI THỬ BUILDER EB-11 ==================')
  console.log(`1. Các trang đã xóa (${result.deletedPages.length}):`)
  if (result.deletedPages.length > 0) {
    console.table(result.deletedPages)
  } else {
    console.log('   (Không có trang [MẪU] nào được tạo trong buổi thử)')
  }

  console.log(`\n2. Các mẫu khối đã xóa (${result.deletedTemplates.length}):`)
  if (result.deletedTemplates.length > 0) {
    console.table(result.deletedTemplates)
  } else {
    console.log('   (Không có mẫu khối [MẪU] nào được tạo trong buổi thử)')
  }

  console.log(`\n3. Các ảnh media đã xóa (${result.deletedMedia.length}):`)
  if (result.deletedMedia.length > 0) {
    console.table(result.deletedMedia)
  } else {
    console.log('   (Không có ảnh media [MẪU] nào được tạo trong buổi thử)')
  }

  console.log(
    `\n4. Khôi phục designSystem: ${result.restoredBackup || 'Không tìm thấy file backup'}`,
  )
  console.log('================================================================================\n')
} catch (error) {
  console.error('Lỗi khi dọn dữ liệu buổi thử builder EB-11:', error)
  await payload.destroy()
  process.exit(1)
} finally {
  await payload.destroy()
}

process.exit(0)
