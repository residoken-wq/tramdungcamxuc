import { randomUUID } from 'node:crypto'
import { test, expect, type Response } from './fixtures'

test.describe('EB-06b: Interactive widgets (Tabs, Accordion, Counter)', () => {
  test('tabs, accordion, and counter widgets reach public page with full interactivity', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Bootstrap runs once per database.')
    test.setTimeout(180000)
    page.setDefaultTimeout(20000)

    const email = `eb-06b-${randomUUID()}@example.test`
    const password = randomUUID()
    const slug = `e2e-interactive-${randomUUID()}`
    const tabsId = `eb06-tabs-${randomUUID().slice(0, 8)}`
    const heading1Id = `eb06-h1-${randomUUID().slice(0, 8)}`
    const heading2Id = `eb06-h2-${randomUUID().slice(0, 8)}`
    const accordionId = `eb06-acc-${randomUUID().slice(0, 8)}`
    const accH1Id = `eb06-ah1-${randomUUID().slice(0, 8)}`
    const accH2Id = `eb06-ah2-${randomUUID().slice(0, 8)}`
    const counterId = `eb06-cnt-${randomUUID().slice(0, 8)}`

    const tab1HeadingText = `[MẪU] Tiêu đề Tab 1 - ${randomUUID().slice(0, 6)}`
    const tab2HeadingText = `[MẪU] Tiêu đề Tab 2 - ${randomUUID().slice(0, 6)}`
    const acc1HeadingText = `[MẪU] Câu trả lời 1 - ${randomUUID().slice(0, 6)}`
    const acc2HeadingText = `[MẪU] Câu trả lời 2 - ${randomUUID().slice(0, 6)}`

    let userId: number | undefined
    let pageId: number | undefined

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

      // 2. Create draft page via REST with TabsWidget, AccordionWidget, and CounterWidget.
      const created = await page.request.post('/api/pages?draft=true', {
        data: {
          title: '[MẪU] E2E EB-06b Interactive Widgets',
          slug,
          _status: 'draft',
          puckData: {
            content: [
              {
                type: 'TabsWidget',
                props: {
                  id: tabsId,
                  orientation: 'horizontal',
                  items: [
                    {
                      title: 'Tab Thứ Nhất',
                      content: [
                        {
                          type: 'HeadingWidget',
                          props: {
                            id: heading1Id,
                            text: tab1HeadingText,
                            level: 'h3',
                          },
                        },
                      ],
                    },
                    {
                      title: 'Tab Thứ Hai',
                      content: [
                        {
                          type: 'HeadingWidget',
                          props: {
                            id: heading2Id,
                            text: tab2HeadingText,
                            level: 'h3',
                          },
                        },
                      ],
                    },
                  ],
                },
              },
              {
                type: 'AccordionWidget',
                props: {
                  id: accordionId,
                  expandMode: 'single',
                  defaultExpanded: 'first',
                  items: [
                    {
                      title: 'Mục Hỏi 1',
                      content: [
                        {
                          type: 'HeadingWidget',
                          props: {
                            id: accH1Id,
                            text: acc1HeadingText,
                            level: 'h4',
                          },
                        },
                      ],
                    },
                    {
                      title: 'Mục Hỏi 2',
                      content: [
                        {
                          type: 'HeadingWidget',
                          props: {
                            id: accH2Id,
                            text: acc2HeadingText,
                            level: 'h4',
                          },
                        },
                      ],
                    },
                  ],
                },
              },
              {
                type: 'CounterWidget',
                props: {
                  id: counterId,
                  startNumber: 0,
                  endNumber: 500,
                  suffix: '+',
                  thousandSeparator: '.',
                  label: '[MẪU] Khách hàng đồng hành',
                  align: 'center',
                },
              },
            ],
            root: { props: { title: '[MẪU] E2E EB-06b Interactive Widgets' } },
          },
        },
      })
      expect(created.ok()).toBe(true)
      pageId = (await created.json()).doc.id

      // 3. Open the builder and wait for canvas ready.
      await page.goto(`/builder/${pageId}`)
      const canvas = page.frameLocator('iframe')
      await expect(page.locator('[class*="_PuckCanvas--ready_"]')).toHaveCount(1)

      // 4. Click Tab 2 in canvas to view its slot and panel.
      const tab2Button = canvas.getByRole('tab', { name: 'Tab Thứ Hai', exact: true })
      await expect(tab2Button).toBeVisible()
      await tab2Button.click()
      await expect(tab2Button).toHaveAttribute('aria-selected', 'true')

      // Verify Tab 2 heading is visible
      const tab2Heading = canvas.locator(`[data-puck-component="${heading2Id}"]`)
      await expect(tab2Heading).toBeVisible()

      // 5. Drag TextWidget from "Cơ bản" group into Tab 2's panel slot.
      await page.getByPlaceholder(/Tìm khối/i).fill('van ban')
      const textItem = page.getByRole('button', {
        name: 'Văn bản (Text Widget)',
        exact: true,
      })
      await expect(textItem).toBeVisible()

      const source = await textItem.boundingBox()
      const target = await tab2Heading.boundingBox()
      if (!source || !target)
        throw new Error('TextWidget library item or Tab 2 target not visible.')

      await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2)
      await page.mouse.down()
      await page.mouse.move(source.x + source.width / 2 + 15, source.y + source.height / 2, {
        steps: 5,
      })
      // Drop immediately below the heading in Tab 2
      await page.mouse.move(target.x + target.width / 2, target.y + target.height + 20, {
        steps: 30,
      })
      await page.mouse.up()

      // 6. Publish the page.
      await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
      await expect(
        page.getByRole('status').filter({ hasText: 'Đã xuất bản thành công' }),
      ).toBeVisible({ timeout: 15000 })

      // 7. Verify on public page.
      const publicPage = await page.context().newPage()
      await publicPage.goto(`/${slug}`)

      // A. Verify Counter: displays 500+ and label
      const counterEl = publicPage.locator(`[data-eb-id="${counterId}"]`)
      await expect(counterEl).toContainText('500+')
      await expect(counterEl).toContainText('[MẪU] Khách hàng đồng hành')

      // B. Verify Tabs: initially Tab 1 is active, Tab 2 is hidden
      const publicTab1Heading = publicPage.getByText(tab1HeadingText)
      const publicTab2Heading = publicPage.getByText(tab2HeadingText)
      await expect(publicTab1Heading).toBeVisible()
      await expect(publicTab2Heading).not.toBeVisible()

      // Click Tab 2 on public page
      const publicTab2Btn = publicPage.getByRole('tab', { name: 'Tab Thứ Hai', exact: true })
      await publicTab2Btn.click()
      await expect(publicTab2Heading).toBeVisible()
      await expect(publicTab1Heading).not.toBeVisible()

      // Verify the added text widget content in Tab 2 is visible
      await expect(publicPage.getByText('Nhập đoạn văn bản của bạn tại đây...')).toBeVisible()

      // C. Verify Accordion: Item 1 open, Item 2 hidden
      const publicAcc1Heading = publicPage.getByText(acc1HeadingText)
      const publicAcc2Heading = publicPage.getByText(acc2HeadingText)
      await expect(publicAcc1Heading).toBeVisible()
      await expect(publicAcc2Heading).not.toBeVisible()

      // Click Item 2 button to open Item 2
      const publicAcc2Btn = publicPage.getByRole('button', { name: 'Mục Hỏi 2', exact: true })
      await publicAcc2Btn.click()
      await expect(publicAcc2Heading).toBeVisible()
      // In single mode, Item 1 is now closed
      await expect(publicAcc1Heading).not.toBeVisible()

      await publicPage.close()
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      try {
        if (pageId) {
          const deleted = await page.request.delete(`/api/pages/${pageId}`)
          expect(deleted.ok(), 'Temporary test page must be deleted.').toBe(true)
        }
      } finally {
        if (userId) {
          const deleted = await page.request.delete(`/api/users/${userId}`)
          expect(deleted.ok(), 'Temporary test user must be deleted.').toBe(true)
        }
      }
    }
  })
})
