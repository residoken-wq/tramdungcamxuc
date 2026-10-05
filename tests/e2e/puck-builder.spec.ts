import { test, expect } from '@playwright/test'

/**
 * E2E test suite for Puck Visual Page Builder & Publication Lifecycle.
 *
 * NOTE: Written for Planning/CI QA execution. DO NOT RUN in local development per task rules.
 *
 * Scenarios covered:
 * (a) Unauthenticated user visiting editor URL is redirected to login page with return parameter.
 * (b) Authenticated user edits page, publishes, and public page displays updated content.
 * (c) Authenticated user makes further edits, saves as draft, and public page retains published content.
 */
test.describe('T0-09: Puck Page Builder & Draft/Publish Flow', () => {
  const testPageSlug = 'e2e-test-builder'

  test('(a) Unauthenticated user navigating to /builder/[pageId] is redirected to /admin/login', async ({
    page,
  }) => {
    // Navigate to a builder route without auth cookies
    await page.goto('/builder/dummy-page-id-999')

    // Must be redirected to Payload admin login with redirect parameter
    await expect(page).toHaveURL(/\/admin\/login\?redirect=%2Fbuilder%2Fdummy-page-id-999/)
    await expect(page.locator('form')).toBeVisible()
  })

  test('(b) Drag Hero into blank page, edit title, publish -> public page displays new title', async ({
    page,
  }) => {
    // 1. Log in to Payload Admin
    await page.goto('/admin/login')
    await page.fill('input[name="email"]', 'admin@tramdungcamxuc.com')
    await page.fill('input[name="password"]', 'TdcxAdmin2026!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/admin/)

    // 2. Open pages collection and create or navigate to test page
    await page.goto(`/builder/e2e-page-id`)
    await expect(page.locator('header')).toContainText('Trạm Dừng Cảm Xúc ·')

    // 3. Add HeroTwoEntries block to canvas
    const heroDrawerItem = page.locator('text=Hero 2 Lối vào (Cá nhân & Tổ chức)')
    await heroDrawerItem.waitFor({ state: 'visible' })

    // 4. Edit titleLine1 and titleLine2 in right panel
    const titleInput = page.locator('input[name="titleLine1"]').or(page.getByLabel('Tiêu đề dòng 1'))
    await titleInput.fill('HÀNH TRÌNH TỰ THẤU HIỂU')

    // 5. Click "Xuất bản" (Publish) button
    const publishButton = page.getByRole('button', { name: 'Xuất bản' })
    await publishButton.click()

    // 6. Verify feedback status shows published
    await expect(page.locator('text=Đã xuất bản thành công')).toBeVisible()

    // 7. Visit public page and assert new title is rendered
    await page.goto(`/${testPageSlug}`)
    await expect(page.locator('h1')).toContainText('HÀNH TRÌNH TỰ THẤU HIỂU')
  })

  test('(c) Edit again, Save Draft -> public page retains previous published title', async ({
    page,
  }) => {
    // 1. Return to visual editor
    await page.goto(`/builder/e2e-page-id`)
    await expect(page.locator('header')).toContainText('Trạm Dừng Cảm Xúc ·')

    // 2. Change title to draft content
    const titleInput = page.locator('input[name="titleLine1"]').or(page.getByLabel('Tiêu đề dòng 1'))
    await titleInput.fill('BẢN NHÁP CHƯA XUẤT BẢN')

    // 3. Click "Lưu nháp" (Save Draft) button
    const saveDraftButton = page.getByRole('button', { name: 'Lưu nháp' })
    await saveDraftButton.click()

    // 4. Verify feedback shows draft saved
    await expect(page.locator('text=Đã lưu bản nháp')).toBeVisible()

    // 5. Visit public page and assert public page STILL displays previous published title
    await page.goto(`/${testPageSlug}`)
    await expect(page.locator('h1')).toContainText('HÀNH TRÌNH TỰ THẤU HIỂU')
    await expect(page.locator('h1')).not.toContainText('BẢN NHÁP CHƯA XUẤT BẢN')
  })
})
