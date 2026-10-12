// REVIEW-REQUIRED: Test-only OTP readout for the Playwright E2E run in CI.
// The CI e2e job runs a production build (`pnpm start`), so NODE_ENV cannot gate this.
// Enabled ONLY when E2E_TEST_HOOKS=1, which is set solely in .github/workflows/ci.yml
// (e2e step). It must never be set in the Dockerfile, compose files or a server .env
// (RUNBOOK). When unset, no code is kept in memory and /api/test-otp returns 404.
export function e2eTestHooksEnabled(): boolean {
  return process.env.E2E_TEST_HOOKS === '1'
}
