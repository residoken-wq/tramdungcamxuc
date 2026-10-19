import { test as base } from '@playwright/test'

export * from '@playwright/test'

/**
 * Every e2e test imports `test` from here. Before and after each test it asks the server
 * (test hook, CI only) to delete admin users created by the suite, so a test that dies
 * mid-way cannot leave its first admin behind and fail every later "create first user"
 * test in a cascade. Outside CI the endpoint returns 404 and this is a no-op.
 */
export const test = base.extend<{ resetE2eAdmins: void }>({
  resetE2eAdmins: [
    async ({ request }, use) => {
      await request.post('/api/test-reset-admins').catch(() => {})
      await use()
      await request.post('/api/test-reset-admins').catch(() => {})
    },
    { auto: true },
  ],
})
