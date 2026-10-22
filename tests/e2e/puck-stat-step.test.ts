import { randomUUID } from 'node:crypto'
import { test, expect, type Page, type Response } from './fixtures'

// PK-03: Draggable Stat & Step child blocks with slot in StatsBar & JourneySteps
// E2E test được viết cho Planning chạy; test tự tạo dữ liệu qua REST và tự dọn dẹp.
// KHÔNG CHẠY trong luồng Pair Programming theo quy định task PK-03.

async function bootstrapAdmin(page: Page): Promise<{ userId?: number }> {
  await page.goto('/admin/create-first-user', { waitUntil: 'networkidle' })
  const email = `pk03-${randomUUID()}@example.test`
  const password = randomUUID()
  await page.locator('#field-email').fill(email)
  await page.locator('#field-password').fill(password)
  await page.locator('#field-confirm-password').fill(password)

  let response: Response | undefined
  await expect(async () => {
    const registration = page.waitForResponse(
      (res) => res.url().includes('/api/users/first-register') && res.request().method() === 'POST',
      { timeout: 5000 },
    )
    await page.locator('button[type="submit"]').click()
    response = await registration
  }).toPass({ timeout: 60000 })

  if (!response) throw new Error('First-user registration request was never sent.')
  expect(response.ok()).toBe(true)
  const registered = await response.json()
  await expect(page).toHaveURL(/\/admin\/?$/)
  const userId = registered.user?.id || registered.doc?.id
  return { userId }
}

test.describe('PK-03: Draggable Stat & Step child blocks in StatsBar & JourneySteps', () => {
  test('trang StatsBar v2 + JourneySteps v2 hiển thị đúng khi đọc; builder sửa tên/cỡ bước 4, nhân bản bước 1 và ô số liệu, xuất bản', async ({
    page,
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Bootstrap runs once per database.')
    test.setTimeout(180000)
    page.setDefaultTimeout(20000)

    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )
    expect(init, 'Run on a migrated DB without admin users.').toMatchObject({ initialized: false })

    const marker = randomUUID().slice(0, 8)
    const slug = `e2e-stat-step-${marker}`
    let userId: number | undefined
    let pageId: number | undefined

    const publicContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const publicPage = await publicContext.newPage()

    try {
      const admin = await bootstrapAdmin(page)
      userId = admin.userId

      // 1. Tạo qua REST một trang đã xuất bản, lưu StatsBar v2 (3 ô) + JourneySteps v2 (variant: 'cards', highlightStep: 2, mô tả bước 3 để rỗng)
      const created = await page.request.post('/api/pages', {
        data: {
          title: `[MẪU] E2E Stat Step ${marker}`,
          slug,
          _status: 'published',
          puckData: {
            content: [
              {
                type: 'StatsBar',
                props: {
                  id: 'stats-e2e',
                  version: 2,
                  bgColor: 'warm-ivory',
                  padding: 'md',
                  stats: [
                    { value: '[MẪU] 10+', label: '[MẪU] Năm kinh nghiệm', description: '', icon: '' },
                    { value: '[MẪU] 500+', label: '[MẪU] Học viên', description: '', icon: '' },
                    { value: '[MẪU] 98%', label: '[MẪU] Hài lòng', description: '', icon: '' },
                  ],
                },
              },
              {
                type: 'JourneySteps',
                props: {
                  id: 'journey-e2e',
                  version: 2,
                  variant: 'cards',
                  highlightStep: 2, // Bước 2 (index 2: Name) nổi bật
                  seriesLabel: '[MẪU] Tiến trình',
                  titleLine1: '[MẪU] HÀNH TRÌNH 5 BƯỚC',
                  titleLine2: '[MẪU] CHUYỂN HÓA',
                  emotionLine: '[MẪU] Dòng cảm xúc',
                  step1Subtitle: '',
                  step1Description: '[MẪU] Dừng lại quan sát và nhận diện trạng thái cảm xúc.',
                  step2Subtitle: '',
                  step2Description: '[MẪU] Cảm nhận trọn vẹn những rung động bên trong cơ thể.',
                  step3Subtitle: '',
                  step3Description: '', // rỗng -> fallback chữ mặc định
                  step4Subtitle: '',
                  step4Description: '[MẪU] Lựa chọn phản hồi tích cực và xây dựng góc nhìn mới.',
                  step5Subtitle: '',
                  step5Description: '[MẪU] Thực hành chuyển hóa bền bỉ qua từng hành động nhỏ.',
                  bgColor: 'warm-ivory',
                  padding: 'lg',
                },
              },
            ],
            root: { props: { title: `[MẪU] E2E Stat Step ${marker}` } },
          },
        },
      })
      expect(created.ok()).toBe(true)
      const createdData = await created.json()
      pageId = createdData.doc?.id || createdData.id
      expect(pageId).toBeDefined()

      // 2. Mở trang công khai trước khi mở builder:
      // - 3 số liệu;
      // - 5 tên bước đúng thứ tự;
      // - bước 3 hiện chữ mặc định;
      // - bước 2 có nền navy.
      await publicPage.goto(`/${slug}`, { waitUntil: 'domcontentloaded' })
      const statValues = publicPage.locator('.group\\/stats .font-display')
      await expect(statValues).toHaveText(['[MẪU] 10+', '[MẪU] 500+', '[MẪU] 98%'])

      const stepTitles = publicPage.locator('.group\\/journey h3')
      await expect(stepTitles).toHaveText(['Pause', 'Feel', 'Name', 'Choose', 'Practice'])

      // Bước 3 (Name, index 2) hiện chữ mô tả mặc định [MẪU]...
      const step3Desc = publicPage.locator('.group\\/journey p').nth(2)
      await expect(step3Desc).toContainText('[MẪU]')

      // Bước 2 (Name, index 2) có nền navy (bg-deep-navy)
      const step3Card = publicPage.locator('.group\\/journey [data-step-card]').nth(2)
      await expect(step3Card).toHaveClass(/bg-deep-navy/)

      // 3. Mở builder:
      await page.goto(`/builder/${pageId}`, { waitUntil: 'domcontentloaded' })
      const canvas = page.frameLocator('iframe')

      // Chọn bước 4 (Choose), đổi tên thành "[MẪU] Bước mới" (gõ vào field), cỡ tên "Lớn" (chọn theo nhãn)
      const step4Heading = canvas.getByRole('heading', { name: 'Choose', exact: true })
      await expect(step4Heading).toBeVisible({ timeout: 30000 })

      const stepTitleInput = page.getByRole('textbox', { name: 'Tên bước', exact: true })
      await expect(async () => {
        await step4Heading.click()
        await expect(stepTitleInput).toBeVisible({ timeout: 2000 })
      }).toPass({ timeout: 30000 })

      await stepTitleInput.fill('[MẪU] Bước mới')

      const stepTitleSize = page.getByRole('combobox', { name: 'Cỡ chữ tên bước', exact: true })
      await stepTitleSize.selectOption({ label: 'Lớn' })

      // Nhân bản bước 1 (chọn cách nhân bản bước 1 để đảm bảo độ ổn định trong trình duyệt tự động hóa)
      const step1Heading = canvas.getByRole('heading', { name: 'Pause', exact: true })
      const duplicateStep = canvas.locator('button[title="Nhân bản"]').first()
      await expect(async () => {
        await step1Heading.click()
        await expect(duplicateStep).toBeVisible({ timeout: 2000 })
      }).toPass({ timeout: 30000 })
      await duplicateStep.click()

      // 4. Nhân bản 1 ô số liệu
      const stat1Item = canvas.getByText('[MẪU] 10+').first()
      const duplicateStat = canvas.locator('button[title="Nhân bản"]').first()
      await expect(async () => {
        await stat1Item.click()
        await expect(duplicateStat).toBeVisible({ timeout: 2000 })
      }).toPass({ timeout: 30000 })
      await duplicateStat.click()

      // Xuất bản
      await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
      await expect(
        page
          .getByText(/Đã xuất bản/)
          .filter({ visible: true })
          .first(),
      ).toBeVisible({ timeout: 15000 })

      // 5. Trang công khai (tải lại tới khi bản mới hiện):
      // - 4 số liệu;
      // - thứ tự bước mới;
      // - bước 4 có chữ và class cỡ mới.
      await expect(async () => {
        await publicPage.goto(`/${slug}`, { waitUntil: 'domcontentloaded' })
        const reloadedStats = publicPage.locator('.group\\/stats .font-display')
        await expect(reloadedStats).toHaveCount(4, { timeout: 2000 })
      }).toPass({ timeout: 30000 })

      const updatedStepTitles = publicPage.locator('.group\\/journey h3')
      await expect(updatedStepTitles).toHaveText([
        'Pause',
        'Pause',
        'Feel',
        'Name',
        '[MẪU] Bước mới',
        'Practice',
      ])

      const newStepHeading = updatedStepTitles.filter({ hasText: '[MẪU] Bước mới' })
      await expect(newStepHeading).toHaveClass(/sm:text-2xl/)
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      await publicContext.close()

      try {
        if (pageId) {
          const deleted = await page.request.delete(`/api/pages/${pageId}`)
          expect(deleted.ok(), 'Temporary E2E page must be removed.').toBe(true)
        }
      } finally {
        if (userId) {
          const deleted = await page.request.delete(`/api/users/${userId}`)
          expect(deleted.ok(), 'Temporary E2E user must be removed.').toBe(true)
        }
      }
    }
  })
})
