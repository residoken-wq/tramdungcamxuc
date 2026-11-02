import 'dotenv/config'
import { chromium } from '@playwright/test'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { signCustomerToken } from '../src/lib/auth/token'

async function run() {
  const payload = await getPayload({ config })
  const outDir = path.resolve(process.cwd(), 'docs/screenshots/hb26')

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()

  console.log('1. Chụp /habit/5-phut Bước 1...')
  await page.goto('http://localhost:3000/habit/5-phut')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: path.join(outDir, 'step-1-diagnose.png'), fullPage: true })

  console.log('2. Chụp /habit/5-phut Bước 2...')
  const skipBtn = page.getByRole('button', { name: /Bỏ qua phần khám/i })
  if (await skipBtn.isVisible()) {
    await skipBtn.click()
  } else {
    await page.getByRole('button', { name: /Tiếp tục/i }).click()
  }
  await page.waitForSelector('text=Bước 2 / 6')
  await page.screenshot({ path: path.join(outDir, 'step-2-one-percent.png'), fullPage: true })

  console.log('3. Chụp /habit/5-phut Bước 4...')
  // Tiến từ bước 2 sang bước 3
  await page.getByRole('button', { name: /Sang giai đoạn 2/i }).click()
  await page.waitForSelector('text=Bước 3 / 6')
  await page.getByPlaceholder(/Đánh răng|thói quen/i).fill('[MẪU] Uống nước ấm sáng')
  await page.getByRole('button', { name: /Thêm một việc|Thêm thói quen/i }).click()
  await page.getByRole('button', { name: /Có ích \(\+\)|đánh giá tốt/i }).first().click()
  await page.locator('input[type="radio"][name="anchorHabit"]').first().check()
  await page.getByRole('button', { name: /Tiếp tục/i }).click()
  await page.waitForSelector('text=Bước 4 / 6')
  await page.screenshot({ path: path.join(outDir, 'step-4-name.png'), fullPage: true })

  console.log('4. Chụp /habit/tracker (có kế hoạch & quote)...')
  // Tạo hoặc lấy 1 customer test có kế hoạch habitPlan
  const testEmail = 'screenshot-hb26@example.test'
  let customerRes = await payload.find({
    collection: 'customers',
    where: { email: { equals: testEmail } },
    limit: 1,
  })
  let customer: any = customerRes.docs[0]
  if (!customer) {
    customer = await (payload as any).create({
      collection: 'customers',
      data: {
        email: testEmail,
        name: 'Học viên HB26',
        consentPolicy: true,
      },
    })
  }

  // Lấy hoặc tạo sản phẩm habit-tracker-so
  const prodRes = await payload.find({
    collection: 'products',
    where: { slug: { equals: 'habit-tracker-so' } },
    limit: 1,
  })
  const product: any = prodRes.docs[0]

  // Cấp quyền entitlement active cho customer nếu có product
  if (product) {
    const existingEnt = await payload.find({
      collection: 'entitlements',
      where: {
        and: [
          { customer: { equals: customer.id } },
          { product: { equals: product.id } },
        ],
      },
      limit: 1,
    })
    if (existingEnt.docs.length === 0) {
      await (payload as any).create({
        collection: 'entitlements',
        data: {
          customer: customer.id,
          product: product.id,
          source: 'trial',
          status: 'active',
          expiresAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        },
      })
    }
  }

  // Đảm bảo có habitPlan gán cho customer
  const existingPlan = await payload.find({
    collection: 'habitPlans',
    where: { customer: { equals: customer.id } },
    limit: 1,
  })
  if (existingPlan.docs.length === 0) {
    await (payload as any).create({
      collection: 'habitPlans',
      data: {
        customer: customer.id,
        leadEmail: testEmail,
        habitName: 'Uống 1 ly nước ấm mỗi sáng',
        identityStatement: 'người trân quý sức khỏe',
        rhythmDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        rhythmFrequency: 5,
        journeyDays: 28,
        startDate: new Date().toISOString().split('T')[0],
      },
    })
  }

  const token = signCustomerToken(
    { id: customer.id, email: customer.email },
    process.env.PAYLOAD_SECRET || 'payload-secret-for-testing',
  )

  await context.addCookies([
    {
      name: 'tdcx_customer_token',
      value: token,
      domain: 'localhost',
      path: '/',
    },
  ])

  await page.goto('http://localhost:3000/habit/tracker')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: path.join(outDir, 'tracker-dashboard.png'), fullPage: true })

  console.log('✅ Đã lưu đầy đủ 4 ảnh chụp 375px vào docs/screenshots/hb26/')
  await browser.close()
  await payload.destroy()
  process.exit(0)
}

run().catch((err) => {
  console.error('Lỗi khi chụp ảnh:', err)
  process.exit(1)
})
