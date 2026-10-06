import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    env: {
      TZ: 'UTC',
      PGTZ: 'UTC',
    },
    setupFiles: ['./vitest.setup.ts'],
    globalSetup: ['./tests/unit/global-setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
  },
})
