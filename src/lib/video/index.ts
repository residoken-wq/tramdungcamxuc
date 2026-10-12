import { SandboxVideoProvider } from './sandbox'
import type { VideoProvider } from './types'

export * from './types'
export * from './sandbox'

/**
 * REVIEW-REQUIRED: Video provider factory.
 * Chọn provider bằng biến môi trường VIDEO_PROVIDER (mặc định 'sandbox').
 * Giá trị 'bunny' hiện ném lỗi 'Chưa cấu hình Bunny (T2-05b)'.
 *
 * Lưu ý: T2-05b sẽ thêm BunnyStreamProvider ký link có hạn theo docs chính thức của Bunny.
 */
export function getVideoProvider(): VideoProvider {
  const provider = (process.env.VIDEO_PROVIDER || 'sandbox').trim().toLowerCase()

  if (provider === 'bunny') {
    throw new Error('Chưa cấu hình Bunny (T2-05b)')
  }

  if (provider === 'sandbox') {
    return new SandboxVideoProvider()
  }

  throw new Error(`Video provider không hợp lệ: "${provider}". Chấp nhận 'sandbox' hoặc 'bunny'.`)
}
