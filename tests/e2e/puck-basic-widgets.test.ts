import { randomUUID } from 'node:crypto'
import { test, expect, type Response } from './fixtures'

test.describe('EB-06a: Basic widgets (Heading, Text, Image, Button, Icon, IconList)', () => {
  test('basic widgets in Container reach public page with style color, valid links, media alt, and list items', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Bootstrap runs once per database.')
    test.setTimeout(180000)
    page.setDefaultTimeout(20000)

    const email = `eb-06a-${randomUUID()}@example.test`
    const password = randomUUID()
    const slug = `e2e-widgets-${randomUUID()}`
    const containerId = `eb06-con-${randomUUID().slice(0, 8)}`
    const headingId = `eb06-h-${randomUUID().slice(0, 8)}`
    const buttonId = `eb06-b-${randomUUID().slice(0, 8)}`
    const iconListId = `eb06-il-${randomUUID().slice(0, 8)}`
    const textId = `eb06-t-${randomUUID().slice(0, 8)}`
    const headingText = `[MẪU] Tiêu đề kiểm thử EB-06a - ${randomUUID().slice(0, 6)}`
    const buttonText = `[MẪU] Nút bấm EB-06a`
    const mediaAlt = `[MẪU] Ảnh cơ bản E2E - ${randomUUID().slice(0, 8)}`

    let userId: number | undefined
    let pageId: number | undefined
    let mediaId: string | number | undefined

    try {
      // 1. First admin on a clean DB (self-contained).
      const init = await page.request.get('/api/users/init')
      expect(init.ok()).toBe(true)
      const initData = await init.json()
      test.skip(
        !process.env.CI && initData.initialized === true,
        'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
      )
      expect(initData, 'Run on a migrated DB without admin users.').toMatchObject({
        initialized: false,
      })

      await page.goto('/admin/create-first-user')
      await page.locator('#field-email').fill(email)
      await page.locator('#field-password').fill(password)
      await page.locator('#field-confirm-password').fill(password)
      let response: Response | undefined
      await expect(async () => {
        const registration = page.waitForResponse(
          (res) =>
            res.url().includes('/api/users/first-register') && res.request().method() === 'POST',
          { timeout: 5000 },
        )
        await page.locator('button[type="submit"]').click()
        response = await registration
      }).toPass({ timeout: 60000 })
      if (!response) throw new Error('First-user registration request was never sent.')
      expect(response.ok()).toBe(true)
      const registered = await response.json()
      userId = registered.user?.id || registered.doc?.id
      await expect(page).toHaveURL(/\/admin\/?$/)
      if (!userId) userId = (await (await page.request.get('/api/users/me')).json()).user.id

      // 2. Upload sample media via REST.
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lN8AAAAASUVORK5CYII=',
        'base64',
      )
      const uploadRes = await page.request.post('/api/media', {
        multipart: {
          _payload: JSON.stringify({ alt: mediaAlt }),
          file: {
            name: `eb06-test-${randomUUID().slice(0, 8)}.png`,
            mimeType: 'image/png',
            buffer: pngBuffer,
          },
        },
      })
      expect(uploadRes.ok()).toBe(true)
      const uploadData = await uploadRes.json()
      mediaId = uploadData.doc?.id || uploadData.id
      expect(mediaId).toBeDefined()

      // 3. Create draft page with 1 Container containing HeadingWidget, ButtonWidget, IconListWidget.
      const created = await page.request.post('/api/pages?draft=true', {
        data: {
          title: '[MẪU] E2E EB-06a Basic Widgets',
          slug,
          _status: 'draft',
          puckData: {
            content: [
              {
                type: 'Container',
                props: {
                  id: containerId,
                  tag: 'div',
                  width: 'boxed',
                  contentWidth: 'lg',
                  items: [
                    {
                      type: 'HeadingWidget',
                      props: {
                        id: headingId,
                        text: headingText,
                        tag: 'h2',
                      },
                    },
                    {
                      type: 'ButtonWidget',
                      props: {
                        id: buttonId,
                        text: buttonText,
                        linkType: 'url',
                        href: 'https://example.com',
                        variant: 'primary',
                      },
                    },
                    {
                      type: 'TextWidget',
                      props: {
                        id: textId,
                        // Stored HTML with an injection attempt: only the safe markup may reach the page.
                        content:
                          '<p>[MẪU] Đoạn <strong>đậm</strong> an toàn</p><img src="x" onerror="window.__ebXss=1"><p><a href="javascript:window.__ebXss=2">liên kết xấu</a></p>',
                      },
                    },
                    {
                      type: 'IconListWidget',
                      props: {
                        id: iconListId,
                        items: [
                          { text: '[MẪU] Mục thứ nhất', icon: 'check' },
                          { text: '[MẪU] Mục thứ hai', icon: 'star' },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
            root: { props: { title: '[MẪU] E2E EB-06a Basic Widgets' } },
          },
        },
      })
      expect(created.ok()).toBe(true)
      pageId = (await created.json()).doc.id

      // 4. Open the builder and wait for canvas ready.
      await page.goto(`/builder/${pageId}`)
      const canvas = page.frameLocator('iframe')
      await expect(page.locator('[class*="_PuckCanvas--ready_"]')).toHaveCount(1)

      const heading = canvas.locator(`[data-puck-component="${headingId}"]`)
      await expect(heading).toBeVisible()

      // 5. Drag ImageWidget from "Cơ bản" group into Container.
      await page.getByPlaceholder(/Tìm khối/i).fill('anh')
      const imageItem = page.getByRole('button', {
        name: 'Ảnh',
        exact: true,
      })
      await expect(imageItem).toBeVisible()
      const slot = canvas.locator(`.eb-c-${containerId}`)
      const source = await imageItem.boundingBox()
      const target = await slot.boundingBox()
      if (!source || !target) throw new Error('ImageWidget library item or slot not visible.')

      await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2)
      await page.mouse.down()
      await page.mouse.move(source.x + source.width / 2 + 15, source.y + source.height / 2, {
        steps: 5,
      })
      // Drop just below the heading (first block of the slot, always on screen).
      const headingBox = await heading.boundingBox()
      if (!headingBox) throw new Error('Heading not visible.')
      await page.mouse.move(target.x + target.width / 2, headingBox.y + headingBox.height - 4, {
        steps: 30,
      })
      await page.mouse.up()

      // Verify ImageWidget is dropped into the container
      await expect(slot.locator(':scope > [data-puck-component]')).toHaveCount(5)

      // 6. Select the dropped ImageWidget to choose uploaded media.
      const droppedImage = canvas.getByText('Chưa chọn ảnh', { exact: false })
      await expect(async () => {
        await droppedImage.click()
        await expect(page.getByRole('button', { name: /Chọn ảnh từ thư viện/i })).toBeVisible({
          timeout: 1000,
        })
      }).toPass({ timeout: 15000 })

      const contentTab = page.getByRole('tab', { name: 'Nội dung', exact: true })
      await expect(contentTab).toBeVisible()
      await contentTab.click()

      // Click select image button (createMediaExternalField)
      const chooseMediaButton = page.getByRole('button', {
        name: /Chọn ảnh từ thư viện media/i,
      })
      await expect(chooseMediaButton).toBeVisible()
      await chooseMediaButton.click()

      // Select our uploaded media from the modal table
      const mediaRow = page.locator('tbody tr').filter({ hasText: mediaAlt, visible: true })
      await expect(mediaRow.first()).toBeVisible({ timeout: 10000 })
      await mediaRow.first().click()

      // 7. Select HeadingWidget and set textColor on Style tab.
      await heading.click()
      const styleTab = page.getByRole('tab', { name: 'Kiểu', exact: true })
      await expect(styleTab).toBeVisible()
      await styleTab.click()

      const textColorGroup = page.getByRole('group', { name: 'Màu chữ', exact: true })
      await textColorGroup.getByRole('button', { name: /^bright-magenta/ }).click()

      // 8. Publish the page.
      await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
      await expect(
        page.getByRole('status').filter({ hasText: 'Đã xuất bản thành công' }),
      ).toBeVisible({ timeout: 15000 })

      // 9. Verify on public page.
      const publicPage = await page.context().newPage()
      await publicPage.goto(`/${slug}`)

      // Verify heading: h2 tag with text and magenta color
      const headingEl = publicPage.locator('h2', { hasText: headingText })
      await expect(headingEl).toBeVisible()
      // The colour set in the Style tab must reach the heading itself, not only its wrapper.
      await expect(headingEl).toHaveCSS('color', 'rgb(188, 3, 158)')

      // Rich text: safe markup shown, injection removed.
      await expect(publicPage.getByText('[MẪU] Đoạn')).toBeVisible()
      await expect(publicPage.locator('strong', { hasText: 'đậm' })).toBeVisible()
      await expect(publicPage.locator('img[src="x"]')).toHaveCount(0)
      await expect(publicPage.locator('a[href^="javascript:"]')).toHaveCount(0)
      expect(
        await publicPage.evaluate(() => (window as { __ebXss?: number }).__ebXss),
      ).toBeUndefined()

      // Verify button: href is https://example.com and text matches
      const buttonEl = publicPage.locator(`a[href="https://example.com"]`, { hasText: buttonText })
      await expect(buttonEl).toBeVisible()

      // Verify image: img tag with matching alt
      const imageEl = publicPage.locator(`img[alt="${mediaAlt}"]`)
      await expect(imageEl).toBeVisible()

      // Verify icon list: exactly 2 <li> items
      const listEl = publicPage.locator(`[data-eb-id="${iconListId}"] ul, [data-eb-id] ul`).first()
      const listItems = listEl.locator('li')
      await expect(listItems).toHaveCount(2)
      await expect(listItems.first()).toContainText('[MẪU] Mục thứ nhất')
      await expect(listItems.last()).toContainText('[MẪU] Mục thứ hai')

      await publicPage.close()
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      try {
        if (pageId) {
          const deleted = await page.request.delete(`/api/pages/${pageId}`)
          expect(deleted.ok(), 'Temporary test page must be deleted.').toBe(true)
        }
      } finally {
        try {
          if (mediaId) {
            const deletedMedia = await page.request.delete(`/api/media/${mediaId}`)
            expect(deletedMedia.ok(), 'Temporary test media must be deleted.').toBe(true)
          }
        } finally {
          if (userId) {
            const deleted = await page.request.delete(`/api/users/${userId}`)
            expect(deleted.ok(), 'Temporary test user must be deleted.').toBe(true)
          }
        }
      }
    }
  })
})
