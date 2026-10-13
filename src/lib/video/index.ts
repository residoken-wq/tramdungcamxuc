import { BunnyStreamProvider } from './bunny'
import { SandboxVideoProvider } from './sandbox'
import type { VideoProvider } from './types'

export * from './types'
export * from './sandbox'
export * from './bunny'

/**
 * REVIEW-REQUIRED: Video provider factory.
 * Chọn provider bằng biến môi trường VIDEO_PROVIDER (mặc định 'sandbox').
 * Hỗ trợ 'sandbox' (môi trường dev/test) và 'bunny' (môi trường staging/production).
 */
export function getVideoProvider(): VideoProvider {
  const provider = (process.env.VIDEO_PROVIDER || 'sandbox').trim().toLowerCase()

  if (provider === 'bunny') {
    return new BunnyStreamProvider()
  }

  if (provider === 'sandbox') {
    return new SandboxVideoProvider()
  }

  throw new Error(`Video provider không hợp lệ: "${provider}". Chấp nhận 'sandbox' hoặc 'bunny'.`)
}
