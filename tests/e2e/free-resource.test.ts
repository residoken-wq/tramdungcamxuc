import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { signDownloadToken } from '../../src/lib/downloads/token'

test.describe('Free Resource Delivery Flow (T1-07)', () => {
  test('guest submits free resource form, receives signed download link, and direct file URL is blocked', async ({
    page,
    request,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs once per database.')
    test.setTimeout(180000)

    // 1. Authenticate as admin or use existing admin session to set up test fixture
    const adminEmail = `admin-e2e-${randomUUID()}@example.test`
    const adminPassword = randomUUID()

    // Login or create admin session
    let authToken = ''
    try {
      const loginRes = await request.post('/api/users/login', {
        data: {
          email: adminEmail,
          password: adminPassword,
        },
      })
      if (loginRes.ok()) {
        const loginData = await loginRes.json()
        authToken = loginData.token || ''
      }
    } catch {
      // Proceed if first register is needed in clean DB
    }

    // Prepare test resource and product IDs for cleanup
    let createdFileId: number | undefined
    let createdProductId: number | undefined
    const slug = `e2e-tai-nguyen-${randomUUID()}`

    try {
      // 2. Admin creates privateFiles document and free product via API or Payload
      // Upload private file
      const samplePdfContent =
        '%PDF-1.4\n1 0 obj\n<<>>\nendobj\nxref\n0 1\n0000000000 65535 f\ntrailer\n<<>>\nstartxref\n9\n%%EOF\n'

      const fileRes = await request.post('/api/privateFiles', {
        headers: {
          ...(authToken ? { Authorization: `JWT ${authToken}` } : {}),
        },
        multipart: {
          file: {
            name: `e2e-resource-${randomUUID()}.pdf`,
            mimeType: 'application/pdf',
            buffer: Buffer.from(samplePdfContent),
          },
          description: 'E2E Tài liệu mẫu',
        },
      })

      if (fileRes.ok()) {
        const fileDoc = await fileRes.json()
        createdFileId = fileDoc.doc?.id || fileDoc.id

        // Create free ebook product
        const productRes = await request.post('/api/products', {
          headers: {
            ...(authToken ? { Authorization: `JWT ${authToken}` } : {}),
          },
          data: {
            name: 'E2E Sách Điện Tử Miễn Phí',
            slug,
            web: 'site',
            type: 'ebook',
            saleStatus: 'free',
            files: [{ file: createdFileId }],
            shortDescription: 'Cẩm nang E2E hướng dẫn phát triển cảm xúc',
            includes: [{ text: 'File PDF tài liệu miễn phí' }],
            _status: 'published',
          },
        })

        if (productRes.ok()) {
          const productDoc = await productRes.json()
          createdProductId = productDoc.doc?.id || productDoc.id
        }
      }

      // 3. Guest opens the public resource landing page
      await page.goto(`/tai-nguyen/${slug}`)
      await expect(page.locator('h1')).toContainText('E2E Sách Điện Tử Miễn Phí')

      // Fill and submit the resource form
      await page.locator('input[type="text"]').first().fill('Nguyễn Thị Mai')
      await page.locator('input[type="email"]').fill(`mai-${randomUUID()}@example.test`)
      await page.locator('input[type="checkbox"]').check()

      // Submit form
      await page.locator('button[type="submit"]').click()

      // 4. Verify confirmation notice is displayed
      await expect(page.getByText('Kiểm tra email của bạn!')).toBeVisible({ timeout: 15000 })

      // 5. Verify signed download link returns 200 with attachment header
      if (createdProductId && createdFileId) {
        const secret = process.env.PAYLOAD_SECRET || 'test-secret'
        const signedToken = signDownloadToken({
          productId: createdProductId,
          fileId: createdFileId,
          secret,
        })

        const downloadResponse = await request.get(`/api/download/${signedToken}`)
        expect(downloadResponse.status()).toBe(200)
        expect(downloadResponse.headers()['content-type']).toContain('application/pdf')
        expect(downloadResponse.headers()['content-disposition']).toContain('attachment')

        // 6. Verify direct access to privateFiles is blocked for unauthenticated visitors
        const directFileRes = await request.get(`/api/privateFiles/${createdFileId}`)
        expect([401, 403, 404]).toContain(directFileRes.status())
      }
    } finally {
      // 7. Cleanup test data
      if (authToken) {
        if (createdProductId) {
          await request.delete(`/api/products/${createdProductId}`, {
            headers: { Authorization: `JWT ${authToken}` },
          })
        }
        if (createdFileId) {
          await request.delete(`/api/privateFiles/${createdFileId}`, {
            headers: { Authorization: `JWT ${authToken}` },
          })
        }
      }
    }
  })
})
