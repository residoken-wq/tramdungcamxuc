import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type Page, type Response } from './fixtures'
import { expectNoSeriousA11y } from './helpers/a11y'
import * as zip from './helpers/habit-zip'
import { vi } from '@/lib/i18n/vi'
import { getVietnamYmd } from '@/lib/habit/tracker-stats'

/**
 * DP-01a: E2E Habit Journey with ZIP UI & 28-Day Flow
 *
 * Scenarios:
 * 1. Bootstrap Admin on CI / dev if needed.
 * 2. Ensure Habit Tracker product exists and published.
 * 3. Guest visits /habit/5-phut:
 *    - Step 1: Answers 8 diagnose questions (scores 1-5).
 *    - Step 2: 1% principle overview -> Sang giai đoạn 2.
 *    - Step 3: Find Mentor -> adds routine, marks (+), selects mentor.
 *    - Step 4: Identity -> fills identity action, role, minimal action.
 *    - Step 5: Loop design -> selects 3 Cue techniques (1 empty action note, 2 with notes).
 *    - Step 6: Boarding pass -> verifies pass, fills name + email, submits.
 * 4. Completes OTP login via test hook -> enters /habit/tracker.
 * 5. Tracker interactions:
 *    - Check-in Day 1 (Done + Mood 😊).
 *    - Reopen Day 1 -> Reset day check-in -> returns to uncompleted.
 *    - Re-check-in Day 1.
 *    - Download CSV.
 *    - Reload page -> verifies persisted state.
 */

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = `AdminDp01a-${randomUUID()}`
  await page.locator('#field-email').fill(`admin-dp01a-${randomUUID()}@example.test`)
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
  await expect(page).toHaveURL(/\/admin\/?$/)
  return (await (await page.request.get('/api/users/me')).json()).user.id
}

test.describe('DP-01a: Habit Zip Flow & 28-Day Tracker', () => {
  test('khách mới đi qua 6 bước (8 câu hỏi, 3 kỹ thuật Cue gồm 1 rỗng note) -> OTP -> tracker -> check-in -> xóa ngày -> tải CSV -> reload còn dữ liệu', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(240000)

    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )

    let adminId: number | undefined
    let createdProductId: number | undefined
    let createdCustomerId: number | undefined
    let coffeeMediaId: number | string | undefined
    let settingsBefore: Record<string, unknown> | undefined
    const createdTechniqueIds: number[] = []
    const suffix = randomUUID().slice(0, 8)
    const customerEmail = `dp01a-guest-${suffix}@example.test`
    const saveScreenshots = process.env.AU01_SCREENSHOTS === '1'
    const screenshotDir = process.env.AU01_SCREENSHOT_DIR || 'docs/screenshots/au01'
    if (saveScreenshots) {
      mkdirSync(screenshotDir, { recursive: true })
    }
    const saveAu03Screenshots = process.env.AU03_SCREENSHOTS === '1'
    const au03ScreenshotDir =
      process.env.AU03_SCREENSHOT_DIR ||
      join(process.env.TEMP || 'tmp', 'au03-screenshots')
    if (saveAu03Screenshots) {
      mkdirSync(au03ScreenshotDir, { recursive: true })
    }

    const visitor = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: { width: 1440, height: 900 },
      extraHTTPHeaders: { 'x-forwarded-for': `203.0.113.${Math.floor(Math.random() * 254) + 1}` },
    })
    const guestPage = await visitor.newPage()

    try {
      adminId = await bootstrapAdmin(page)

      // 0. Bật coffeeDonation tạm thời để kiểm chứng AU-01 (nút cà phê hiện ở /habit/5-phut nhưng ẩn ở /habit/tracker)
      const settingsRes = await page.request.get('/api/globals/siteSettings?depth=0')
      if (settingsRes.ok()) {
        settingsBefore = await settingsRes.json()
        const pngBuffer = Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lN8AAAAASUVORK5CYII=',
          'base64',
        )
        const uploadRes = await page.request.post('/api/media', {
          multipart: {
            _payload: JSON.stringify({ alt: `[TEST] QR MoMo AU01 - ${suffix}` }),
            file: {
              name: `au01-qr-${suffix}.png`,
              mimeType: 'image/png',
              buffer: pngBuffer,
            },
          },
        })
        if (uploadRes.ok()) {
          const uploadData = await uploadRes.json()
          coffeeMediaId = uploadData.doc?.id || uploadData.id
          await page.request.post('/api/globals/siteSettings', {
            data: {
              coffeeDonation: {
                enabled: true,
                title: 'Mời Trạm một ly cà phê',
                qrImage: coffeeMediaId,
              },
            },
          })
        }
      }

      // 1. Đảm bảo sản phẩm habit-tracker-so đã tồn tại
      const prodQuery = await (
        await page.request.get('/api/products?where[slug][equals]=habit-tracker-so&draft=true')
      ).json()
      // Sản phẩm có sẵn thì dùng lại và không xoá khi dọn dẹp
      if (!prodQuery.docs?.length) {
        const prodRes = await page.request.post('/api/products', {
          data: {
            name: 'Habit Tracker số',
            slug: 'habit-tracker-so',
            web: 'habit',
            type: 'digital_tool',
            trialDays: 28,
            price: 250000,
            salePrice: 178000,
            saleStatus: 'on_sale',
            isSample: true,
            _status: 'published',
          },
        })
        expect(prodRes.ok()).toBe(true)
        createdProductId = (await prodRes.json()).doc?.id
      }

      // 2. Tạo 3 kỹ thuật Cue riêng cho lần chạy này
      const cueNames: string[] = []
      for (let i = 1; i <= 3; i++) {
        const name = `[TEST] Kỹ thuật Cue #${i} - ${suffix}`
        const res = await page.request.post('/api/techniques', {
          data: {
            name,
            stage: 'cue',
            order: i,
            description: `Mô tả kỹ thuật cue ${i}`,
            examples: ['Ví dụ 1', 'Ví dụ 2'],
            applyTemplate: 'Tôi sẽ làm việc này vào buổi sáng',
            _status: 'published',
          },
        })
        expect(res.ok(), await res.text()).toBe(true)
        createdTechniqueIds.push((await res.json()).doc.id)
        cueNames.push(name)
      }

      // 2b. Kiểm tra trang giới thiệu /habit/1-percent-better ẩn phần "khác biệt" khi featureItems trống (AU-03)
      await guestPage.goto('/habit/1-percent-better', { waitUntil: 'domcontentloaded' })
      await expect(guestPage.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 })
      await expect(guestPage.getByText(/Tại sao Habit.*khác biệt/i)).toHaveCount(0)
      if (saveAu03Screenshots) {
        await guestPage.screenshot({
          path: join(au03ScreenshotDir, 'au03-offer-1440.png'),
          fullPage: true,
        })
        await guestPage.setViewportSize({ width: 375, height: 812 })
        await guestPage.screenshot({
          path: join(au03ScreenshotDir, 'au03-offer-375.png'),
          fullPage: true,
        })
        await guestPage.setViewportSize({ width: 1440, height: 900 })
      }

      // 3. Khách đăng nhập và đi 6 bước zip (helpers/habit-zip.ts, DP-03)
      await zip.loginHabitCustomer(guestPage, customerEmail, '/habit/5-phut')

      // AU-03 Mục 2: Ẩn badge mặc định khi CMS trống và bỏ 3 thẻ giai đoạn lớn; có wizard "Bước 1 / 6"
      await expect(guestPage.getByText('CONTENT CREATOR HUB')).toHaveCount(0)
      await expect(guestPage.getByText('GIAI ĐOẠN 1', { exact: true })).toHaveCount(0)
      await expect(guestPage.getByText('Bước 1 / 6')).toBeVisible({ timeout: 15000 })
      await expectNoSeriousA11y(guestPage, '/habit/5-phut Bước 1')

      if (saveAu03Screenshots) {
        await guestPage.screenshot({
          path: join(au03ScreenshotDir, 'au03-tool-top-1440.png'),
          fullPage: false,
        })
        await guestPage.setViewportSize({ width: 375, height: 812 })
        const overflowTool = await guestPage.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        )
        expect(overflowTool).toBe(false)
        await guestPage.screenshot({
          path: join(au03ScreenshotDir, 'au03-tool-top-375.png'),
          fullPage: false,
        })
        await guestPage.setViewportSize({ width: 1440, height: 900 })
      }

      // Bước 1: đúng 8 câu hỏi của bản zip (mặc định hoặc từ CMS)
      const questionGroups = guestPage
        .getByRole('group')
        .filter({ has: guestPage.getByRole('button', { name: '1', exact: true }) })
      await expect(questionGroups.first()).toBeVisible({ timeout: 20000 })
      await expect(questionGroups).toHaveCount(8)
      await zip.answerDiagnose(guestPage)
      await expect(guestPage.getByText('Bước 2 / 6')).toBeVisible()
      // Kiểm tra Back giữ nháp wizard (AU-03)
      await guestPage.getByRole('button', { name: /Quay lại/i }).first().click()
      await expect(guestPage.getByText('Bước 1 / 6')).toBeVisible()
      await guestPage.getByRole('button', { name: /Tiếp · Nguyên lý 1% Better/ }).click()
      await zip.passPercent(guestPage)

      // Bước 3: Kiểm tra ô giờ AM/PM thay thế input[type="time"] (AU-01 Mục 2)
      const firstRoutine = guestPage.getByPlaceholder('Thức dậy, uống một ly nước')
      await expect(firstRoutine).toBeVisible({ timeout: 15000 })
      await firstRoutine.fill('[TEST] Uống nước ấm sáng')
      await guestPage.getByTitle('Có ích (+)').first().click()
      await guestPage.getByRole('button', { name: '[TEST] Uống nước ấm sáng', exact: true }).click()
      await expect(guestPage.getByText(/Mentor của bạn:/)).toBeVisible()
      await expect(guestPage.locator('input[type="time"]')).toHaveCount(0)
      await guestPage.getByLabel('Giờ', { exact: true }).selectOption('6')
      await guestPage.getByLabel('Buổi (AM hoặc PM)', { exact: true }).selectOption('AM')
      await expect(guestPage.getByText(/lúc 6:00 AM/)).toBeVisible()
      if (saveScreenshots) {
        await guestPage.screenshot({ path: join(screenshotDir, 'after-step3-ampm.png') })
      }
      await guestPage.getByRole('button', { name: /Tiếp • Gọi tên thói quen/ }).click()

      await zip.fillIdentity(guestPage, {
        action: 'tập thể dục 15 phút',
        role: 'người khỏe mạnh và kỷ luật',
        atomic: 'Xỏ giày thể thao',
      })
      await zip.setRhythm(guestPage, '5 lần một tuần')

      // Bước 4: Kiểm tra câu Ngày về đích định dạng dd/MM/yyyy, không chứa T00:00 (AU-01 Mục 1)
      const finishSentence = guestPage.getByText(/Bạn sẽ về đích ngày/)
      await expect(finishSentence).toBeVisible()
      const finishText = (await finishSentence.textContent()) ?? ''
      expect(finishText).not.toContain('T00:00')
      expect(finishText).toMatch(/Bạn sẽ về đích ngày \d{2}\/\d{2}\/\d{4}\./)
      if (saveScreenshots) {
        await guestPage.screenshot({ path: join(screenshotDir, 'after-step4-finish-date.png') })
      }

      await zip.nextFromIdentity(guestPage)

      // Bước 5: 3 kỹ thuật Cue (không còn giới hạn 2 / giai đoạn), 1 kỹ thuật để trống ghi chú
      expect(cueNames.length).toBe(3)
      await zip.pickTechniques(guestPage, [
        { name: cueNames[0] },
        { name: cueNames[1], note: '[TEST] Ghi chú áp dụng kỹ thuật 2' },
        { name: cueNames[2], note: '[TEST] Ghi chú áp dụng kỹ thuật 3' },
      ])
      await zip.nextFromLoop(guestPage)

      // AU-03 Mục 3: Kiểm tra Boarding Pass có ghi chú người dùng, AM/PM, trích dẫn mới & 2 nút CTA
      await expect(guestPage.getByText('[TEST] Ghi chú áp dụng kỹ thuật 2')).toBeVisible({
        timeout: 15000,
      })
      await expect(guestPage.getByText(cueNames[0])).toBeVisible()
      await expect(guestPage.getByText(/6:00 AM/)).toBeVisible()
      await expect(
        guestPage.getByText(
          'Mỗi hành động bạn thực hiện là một lá phiếu cho con người bạn muốn trở thành.',
        ),
      ).toBeVisible()
      await expect(
        guestPage.getByText('Để lại email để bắt đầu hành trình 28 ngày hình thành thói quen'),
      ).toBeVisible()
      await expect(guestPage.getByRole('link', { name: /Trở thành VIP Member/i })).toBeVisible()
      await expect(
        guestPage.getByRole('link', { name: /Cần coach đồng hành 1:1/i }),
      ).toBeVisible()
      await expectNoSeriousA11y(guestPage, '/habit/5-phut Boarding Pass')

      if (saveAu03Screenshots) {
        await guestPage.screenshot({
          path: join(au03ScreenshotDir, 'au03-boarding-pass-1440.png'),
          fullPage: true,
        })
        await guestPage.setViewportSize({ width: 375, height: 812 })
        const overflowBoarding = await guestPage.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        )
        expect(overflowBoarding).toBe(false)
        await guestPage.screenshot({
          path: join(au03ScreenshotDir, 'au03-boarding-pass-375.png'),
          fullPage: true,
        })
        await guestPage.setViewportSize({ width: 1440, height: 900 })
      }

      // Bước 6 (DP-03: đã đăng nhập ở đầu): lưu kế hoạch -> dùng thử 28 ngày bắt đầu ngay -> tracker
      await zip.fillBoarding(guestPage, { name: 'Học viên Test DP01', email: customerEmail })
      await zip.submitBoarding(guestPage)
      await guestPage.getByRole('link', { name: /Vào bảng theo dõi 28 ngày/ }).click()
      await expect(guestPage).toHaveURL(/\/habit\/tracker\/?$/, { timeout: 25000 })
      await guestPage.goto('/habit/tracker')
      await expect(guestPage.getByText('Bảng Habit Hack 28 ngày')).toBeVisible({ timeout: 15000 })
      // AU-03 Mục 4: chú giải 4 trạng thái & giờ Mentor AM/PM
      await expect(guestPage.getByText('Đã bỏ phiếu', { exact: true })).toBeVisible()
      await expect(guestPage.getByText('Thực hiện tối thiểu', { exact: true })).toBeVisible()
      await expect(guestPage.getByText('Lỡ nhịp', { exact: true })).toBeVisible()
      await expect(guestPage.getByText('Ngày nghỉ theo nhịp', { exact: true })).toBeVisible()
      await expect(guestPage.getByText(/lúc 6:00 AM/)).toBeVisible()
      await expectNoSeriousA11y(guestPage, '/habit/tracker')

      if (saveAu03Screenshots) {
        await guestPage.screenshot({
          path: join(au03ScreenshotDir, 'au03-tracker-1440.png'),
          fullPage: true,
        })
        await guestPage.setViewportSize({ width: 375, height: 812 })
        const overflowTracker = await guestPage.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        )
        expect(overflowTracker).toBe(false)
        await guestPage.screenshot({
          path: join(au03ScreenshotDir, 'au03-tracker-375.png'),
          fullPage: true,
        })
        await guestPage.setViewportSize({ width: 1440, height: 900 })
      }
      // Z1: Tiêu đề tracker là "28 NGÀY THÀNH {personText}"
      await expect(
        guestPage.getByRole('heading', {
          level: 2,
          name: /28 ngày thành người khỏe mạnh và kỷ luật/i,
        }),
      ).toBeVisible({ timeout: 15000 })

      // AU-01 Mục 3: Trên bảng 28 ngày chỉ có 1 nút nổi góc phải dưới ("Thấy công cụ này hữu ích"), nút cà phê toàn site bị ẩn
      const helpfulFab = guestPage.getByRole('button', { name: /Thấy công cụ này hữu ích/i })
      await expect(helpfulFab).toBeVisible()
      await expect(
        guestPage.locator(`aside[aria-label="${vi.cf01.floatingActions.ariaLabel}"]`),
      ).toHaveCount(0)
      await expect(guestPage.getByRole('button', { name: /Mời Trạm một ly cà phê/i })).toHaveCount(
        0,
      )
      if (saveScreenshots) {
        await guestPage.screenshot({ path: join(screenshotDir, 'after-tracker-fab-1440.png') })
      }
      // Kiểm tra viewport mobile 375px: chỉ 1 nút nổi, không tràn cạnh phải
      await guestPage.setViewportSize({ width: 375, height: 812 })
      await expect(helpfulFab).toBeVisible()
      const fabBoxMobile = await helpfulFab.boundingBox()
      expect(fabBoxMobile).not.toBeNull()
      expect(fabBoxMobile!.x + fabBoxMobile!.width).toBeLessThanOrEqual(375)
      if (saveScreenshots) {
        await guestPage.screenshot({ path: join(screenshotDir, 'after-tracker-fab-375.png') })
      }
      await guestPage.setViewportSize({ width: 1440, height: 900 })

      // Ghi nhận customer ID
      const custQuery = await (
        await page.request.get(
          `/api/customers?where[email][equals]=${encodeURIComponent(customerEmail)}`,
        )
      ).json()
      createdCustomerId = custQuery.docs?.[0]?.id

      // Đảm bảo plan startDate là hôm nay để ô Ngày 1 bật
      if (createdCustomerId) {
        const planRes = await (
          await page.request.get(`/api/habitPlans?where[customer][equals]=${createdCustomerId}`)
        ).json()
        if (planRes.docs?.[0]) {
          // Tracker counts days in Vietnam time (DP-02c): a UTC date is yesterday after 17:00 UTC.
          const todayYmd = getVietnamYmd()
          await page.request.patch(`/api/habitPlans/${planRes.docs[0].id}`, {
            data: { startDate: todayYmd },
          })
          await guestPage.reload()
        }
      }

      // ===== CHECK-IN NGÀY 1 =====
      const day1Btn = guestPage.getByRole('button', { name: /^Ngày 1:/ }).first()
      await expect(day1Btn).toBeEnabled({ timeout: 15000 })
      await day1Btn.click()

      const checkInModal = guestPage.locator('div[role="dialog"]')
      await expect(checkInModal).toBeVisible({ timeout: 10000 })

      // Chọn Đã làm + cảm xúc 😊 (Hơi tự tin)
      const doneBtn = checkInModal.getByRole('button', { name: vi.dp01.statusDone })
      await doneBtn.click()
      await checkInModal.getByRole('button', { name: /Hơi tự tin/ }).click()

      const saveModalBtn = checkInModal.getByRole('button', { name: vi.dp01.save, exact: true })
      await saveModalBtn.click()
      await expect(checkInModal).toBeHidden({ timeout: 10000 })

      // Kiểm tra Ngày 1 đã hoàn thành
      await expect(
        guestPage
          .getByRole('button', { name: /^Ngày 1:.*(Bỏ phiếu|Đã hoàn thành|Đã làm)/i })
          .first(),
      ).toBeVisible()

      // ===== RESET / XÓA NGÀY 1 =====
      await guestPage
        .getByRole('button', { name: /^Ngày 1:/ })
        .first()
        .click()
      await expect(checkInModal).toBeVisible({ timeout: 10000 })

      const deleteBtn = checkInModal.getByRole('button', { name: vi.dp01.deleteCheckinButton })
      await deleteBtn.click()
      await expect(checkInModal).toBeHidden({ timeout: 10000 })

      // Ngày 1 trở về trạng thái chưa hoàn thành
      await expect(
        guestPage.getByRole('button', { name: /^Ngày 1: Bỏ phiếu/i }).first(),
      ).toBeVisible({ timeout: 10000 })

      // Check-in lại Ngày 1
      await guestPage
        .getByRole('button', { name: /^Ngày 1: Bỏ phiếu/i })
        .first()
        .click()
      await expect(checkInModal).toBeVisible({ timeout: 10000 })
      await doneBtn.click()
      await saveModalBtn.click()
      await expect(checkInModal).toBeHidden({ timeout: 10000 })

      // ===== TẢI BẢNG 28 NGÀY (.CSV) =====
      const downloadPromise = guestPage.waitForEvent('download', { timeout: 30000 })
      const csvBtn = guestPage.getByRole('button', { name: /Tải bảng 28 ngày \(\.csv\)/i })
      await expect(csvBtn).toBeVisible()
      await csvBtn.click()

      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/\.csv$/i)

      // ===== TẢI LẠI TRANG (RELOAD) CÒN DỮ LIỆU =====
      await guestPage.reload()
      await expect(
        guestPage
          .getByRole('button', { name: /^Ngày 1:.*(Bỏ phiếu|Đã hoàn thành|Đã làm)/i })
          .first(),
      ).toBeVisible({ timeout: 15000 })

      // ===== KHÔI PHỤC TỪ FILE (CÓ HỘP THOẠI XÁC NHẬN - DP-02) =====
      const backupPayload = JSON.stringify({
        version: 1,
        exportedAt: new Date().toISOString(),
        habitPlan: {
          identityStatement: 'Tôi sẽ tập thể dục 15 phút để trở thành người khỏe mạnh và kỷ luật',
          rhythm: '5_per_week',
        },
        checkins: [
          {
            dayNumber: 1,
            status: 'minimal',
            emotion: 'confident',
            emotionLabel: 'Tự tin',
            note: 'Khôi phục từ file backup zip',
          },
        ],
      })

      await guestPage.locator('input[type="file"][accept*="application/json"]').setInputFiles({
        name: 'backup-dp02.json',
        mimeType: 'application/json',
        buffer: Buffer.from(backupPayload, 'utf-8'),
      })

      const restoreModal = guestPage.locator('div[role="dialog"]').filter({
        hasText: vi.hb13.restoreModal.title,
      })
      await expect(restoreModal).toBeVisible({ timeout: 10000 })
      await expect(restoreModal).toContainText('ghi đè tối đa 1 ngày check-in')

      const confirmRestoreBtn = restoreModal.getByRole('button', {
        name: vi.hb13.restoreModal.confirmButton,
      })
      await confirmRestoreBtn.click()
      await expect(restoreModal).toBeHidden({ timeout: 10000 })
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      if (settingsBefore) {
        await page.request
          .post('/api/globals/siteSettings', {
            data: { coffeeDonation: settingsBefore.coffeeDonation ?? { enabled: false } },
          })
          .catch(() => {})
      }
      if (coffeeMediaId) {
        await page.request.delete(`/api/media/${coffeeMediaId}`).catch(() => {})
      }
      for (const id of createdTechniqueIds) {
        await page.request.delete(`/api/techniques/${id}`).catch(() => {})
      }
      if (createdProductId) {
        await zip.deleteTestProduct(page, createdProductId)
      }
      if (adminId) {
        await page.request.delete(`/api/users/${adminId}`).catch(() => {})
      }
      await visitor.close()
    }
  })
})
