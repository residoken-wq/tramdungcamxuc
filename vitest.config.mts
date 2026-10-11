import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// Các file unit test tương tác trực tiếp với Payload Local API / PostgreSQL.
// Nhóm này cần chạy tuần tự (fileParallelism: false) để tránh xung đột dữ liệu
// (ví dụ: payments xóa thông tin ngân hàng trong siteSettings trong khi package-payment ghi lại).
// Tách bằng danh sách tường minh thay vì quy ước tên file để không cần đổi tên
// file test hiện có trong repo (tuân thủ luật T2-00: không sửa nội dung test).
const dbTestFiles = [
  'tests/unit/access.test.ts',
  'tests/unit/content-collections.test.ts',
  'tests/unit/downloads.test.ts',
  'tests/unit/forms.test.ts',
  'tests/unit/leads-export.test.ts',
  'tests/unit/live-preview.test.ts',
  'tests/unit/package-payment.test.ts',
  'tests/unit/payments.test.ts',
  'tests/unit/puck-conversion.test.tsx',
  'tests/unit/puck-sales.test.tsx',
  'tests/unit/puck-trust.test.tsx',
  'tests/unit/resource.test.ts',
  'tests/unit/seed.test.ts',
  'tests/unit/site-shell.test.tsx',
]

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
