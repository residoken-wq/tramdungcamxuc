import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

async function run() {
  const outDir = path.resolve(process.cwd(), 'docs/screenshots/hb19')
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const browser = await chromium.launch({ headless: true })

  // 1. Mobile viewport 375px
  const contextMobile = await browser.newContext({
    viewport: { width: 375, height: 812 },
  })
  const page = await contextMobile.newPage()

  await page.goto('http://localhost:3000/habit/5-phut', { waitUntil: 'networkidle' })

  // Step 1 -> Step 2
  await page.getByRole('button', { name: 'Bỏ qua phần khám' }).click()
  await page.waitForTimeout(400)

  // Step 2 -> Step 3
  await page.getByRole('button', { name: /Sang giai đoạn 2/i }).click()
  await page.waitForTimeout(400)

  // Verify at Step 3
  await page.getByText(/Bước 3 \/ 6/i).waitFor({ state: 'visible' })

  // Add 4 tasks
  const tasks = [
    'Uống 1 ly nước ấm',
    'Tập thể dục 15 phút',
    'Lướt mạng xã hội',
    'Đọc sách 10 trang',
  ]

  const input = page.getByPlaceholder(/Đánh răng|thói quen/i)
  const addBtn = page.getByRole('button', { name: '+ Thêm một việc' })

  for (const t of tasks) {
    await input.fill(t)
    await addBtn.click()
    await page.waitForTimeout(200)
  }

  // Mark ratings
  await page.getByRole('button', { name: 'Uống 1 ly nước ấm – đánh dấu Có ích (+)' }).click()
  await page.getByRole('button', { name: 'Tập thể dục 15 phút – đánh dấu Có ích (+)' }).click()
  await page.getByRole('button', { name: 'Lướt mạng xã hội – đánh dấu Không có ích (−)' }).click()
  await page.getByRole('button', { name: 'Đọc sách 10 trang – đánh dấu Trung tính (=)' }).click()

  await page.waitForTimeout(400)

  // In Part 2: Select "Uống 1 ly nước ấm" as Mentor
  const mentorRadios = page.locator('input[type="radio"][name="anchorHabit"]')
  await mentorRadios.first().check()

  // Enter time
  const timeInput = page.locator('input[type="time"]')
  await timeInput.fill('07:00')

  await page.waitForTimeout(400)

  // Capture screenshot 1: Mentor selected at 375px
  await page.screenshot({
    path: path.join(outDir, '01-step3-mentor-selected-375.png'),
    fullPage: true,
  })
  console.log('Saved 01-step3-mentor-selected-375.png')

  // Change "Uống 1 ly nước ấm" rating from + to −
  await page.getByRole('button', { name: 'Uống 1 ly nước ấm – đánh dấu Không có ích (−)' }).click()
  await page.waitForTimeout(400)

  // Notice should appear
  const notice = page.locator('[role="status"]')
  const noticeText = await notice.innerText()
  console.log('Notice after unselecting mentor:', noticeText)

  // Also change "Tập thể dục 15 phút" to −
  await page
    .getByRole('button', { name: 'Tập thể dục 15 phút – đánh dấu Không có ích (−)' })
    .click()
  await page.waitForTimeout(400)

  // Verify next button is disabled
  const nextBtn = page.getByRole('button', { name: /Tiếp tục/i })
  const isDisabled = await nextBtn.isDisabled()
  console.log('Next button disabled when no + tasks:', isDisabled)

  // Capture screenshot 2: Unselected & disabled at 375px
  await page.screenshot({
    path: path.join(outDir, '02-step3-mentor-unselected-disabled-375.png'),
    fullPage: true,
  })
  console.log('Saved 02-step3-mentor-unselected-disabled-375.png')

  await contextMobile.close()

  // 2. Desktop viewport 1440px
  const contextDesktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  const deskPage = await contextDesktop.newPage()
  await deskPage.goto('http://localhost:3000/habit/5-phut', { waitUntil: 'networkidle' })

  // Step 1 -> Step 2
  await deskPage.getByRole('button', { name: 'Bỏ qua phần khám' }).click()
  await deskPage.waitForTimeout(400)

  // Step 2 -> Step 3
  await deskPage.getByRole('button', { name: /Sang giai đoạn 2/i }).click()
  await deskPage.waitForTimeout(400)

  // Add tasks
  const deskInput = deskPage.getByPlaceholder(/Đánh răng|thói quen/i)
  const deskAddBtn = deskPage.getByRole('button', { name: '+ Thêm một việc' })

  for (const t of tasks) {
    await deskInput.fill(t)
    await deskAddBtn.click()
    await deskPage.waitForTimeout(200)
  }

  await deskPage.getByRole('button', { name: 'Uống 1 ly nước ấm – đánh dấu Có ích (+)' }).click()
  await deskPage.getByRole('button', { name: 'Tập thể dục 15 phút – đánh dấu Có ích (+)' }).click()
  await deskPage
    .getByRole('button', { name: 'Lướt mạng xã hội – đánh dấu Không có ích (−)' })
    .click()
  await deskPage
    .getByRole('button', { name: 'Đọc sách 10 trang – đánh dấu Trung tính (=)' })
    .click()
  await deskPage.waitForTimeout(400)

  // Select Mentor
  await deskPage.locator('input[type="radio"][name="anchorHabit"]').first().check()
  await deskPage.locator('input[type="time"]').fill('07:00')
  await deskPage.waitForTimeout(400)

  // Capture screenshot 3: Desktop 1440px
  await deskPage.screenshot({
    path: path.join(outDir, '03-step3-desktop-1440.png'),
    fullPage: true,
  })
  console.log('Saved 03-step3-desktop-1440.png')

  await contextDesktop.close()
  await browser.close()
  console.log('All screenshots captured successfully!')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
