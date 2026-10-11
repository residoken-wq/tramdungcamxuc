import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// Các file unit test tương tác trực tiếp với Payload Local API / PostgreSQL.
// Nhóm này cần chạy tuần tự (fileParallelism: false) để tránh xung đột dữ liệu
// (ví dụ: payments xóa thông tin ngân hàng trong siteSettings trong khi package-payment ghi lại).
// Tự nhận diện theo nội dung (file nhắc tới `getPayload`) thay vì danh sách ghi tay, để file test
// DB mới (VD customer-otp của T2-01) tự vào nhóm tuần tự mà không ai phải nhớ cập nhật config.
// File mock `getPayload` cũng vào nhóm này – chậm hơn chút nhưng an toàn.
const unitDir = join(import.meta.dirname, 'tests/unit')
const dbTestFiles = readdirSync(unitDir)
  .filter((f) => /\.test\.tsx?$/.test(f))
  .filter((f) => readFileSync(join(unitDir, f), 'utf8').includes('getPayload'))
  .map((f) => `tests/unit/${f}`)

const sharedTestConfig = {
  environment: 'jsdom' as const,
  env: {
    TZ: 'UTC',
    PGTZ: 'UTC',
  },
  setupFiles: ['./vitest.setup.ts'],
}

const plugins = [tsconfigPaths(), react()]

export default defineConfig({
  plugins,
  test: {
    globalSetup: ['./tests/unit/global-setup.ts'],
    projects: [
      {
        plugins,
        test: {
          name: 'unit',
          ...sharedTestConfig,
          include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
          exclude: [...configDefaults.exclude, ...dbTestFiles],
        },
      },
      {
        plugins,
        test: {
          name: 'db',
          ...sharedTestConfig,
          include: dbTestFiles,
          fileParallelism: false,
        },
      },
    ],
  },
})
