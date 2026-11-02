// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type CollectionSlug, type Payload, type PayloadRequest } from 'payload'
import config from '../../src/payload.config'
import { vi } from '../../src/lib/i18n/vi'
import type { SiteSetting } from '../../src/payload-types'

type AdminUser = NonNullable<PayloadRequest['user']>

interface PayloadValidationError {
  data?: {
    errors?: Array<{ message: string; path: string }>
  }
}

describe('CF-01: coffeeDonation access & validation (DB)', () => {
  let payload: Payload
  let owner: AdminUser
  let editor: AdminUser
  let mediaId: number
  let originalSettings: SiteSetting
  const created: { collection: CollectionSlug; id: number }[] = []

  const track = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
    created.push({ collection, id: doc.id })
    return doc
  }
  const asUser = (doc: { id: number }) => ({ ...doc, collection: 'users' }) as unknown as AdminUser

  beforeAll(async () => {
    payload = await getPayload({ config })

    originalSettings = (await payload.findGlobal({ slug: 'siteSettings', depth: 0 })) as SiteSetting

    const make = async (role: 'owner' | 'editor') => {
      const u = await payload.create({
        collection: 'users',
        data: {
          email: `cf01-${role}-${randomUUID()}@example.test`,
          password: randomUUID(),
          role,
        },
        overrideAccess: true,
      })
      track('users', u)
      if (role === 'owner' && u.role !== 'owner') {
        const updated = await payload.update({
          collection: 'users',
          id: u.id,
          data: { role: 'owner' },
          overrideAccess: true,
        })
        return asUser(updated)
      }
      return asUser(u)
    }

    owner = await make('owner')
    editor = await make('editor')
    owner = asUser(await payload.findByID({ collection: 'users', id: owner.id }))
    editor = asUser(await payload.findByID({ collection: 'users', id: editor.id }))

    const mediaDoc = await payload.create({
      collection: 'media',
      data: {
        alt: '[MẪU] Ảnh mã QR MoMo CF-01',
      },
      file: {
        data: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          'base64',
        ),
        mimetype: 'image/png',
        name: 'cf01-qr.png',
        size: 68,
      },
      overrideAccess: true,
    })
    mediaId = track('media', mediaDoc).id
  }, 60000)

  afterAll(async () => {
    if (!payload) return
    try {
      // Khôi phục siteSettings
      await payload.updateGlobal({
        slug: 'siteSettings',
        data: {
          coffeeDonation: originalSettings?.coffeeDonation ?? {
            enabled: false,
            qrImage: null,
            title: null,
            message: null,
            momoUrl: null,
          },
        },
        overrideAccess: true,
      })

      for (const entry of created.reverse()) {
        await payload.delete({ ...entry, overrideAccess: true })
      }
    } finally {
      await payload.destroy()
    }
  }, 30000)

  it('owner sửa được coffeeDonation trong siteSettings', async () => {
    const updated = await payload.updateGlobal({
      slug: 'siteSettings',
      data: {
        coffeeDonation: {
          enabled: true,
          qrImage: mediaId,
          title: 'Mời Trạm một ly cà phê',
          message: 'Sự đồng hành của bạn là động lực lớn.',
          momoUrl: 'https://me.momo.vn/tramdungcamxuc',
        },
      },
      user: owner,
      overrideAccess: false,
    })

    expect(updated.coffeeDonation?.enabled).toBe(true)
    expect(updated.coffeeDonation?.title).toBe('Mời Trạm một ly cà phê')
    expect(updated.coffeeDonation?.momoUrl).toBe('https://me.momo.vn/tramdungcamxuc')
  })

  it('editor KHÔNG sửa được coffeeDonation', async () => {
    // Thử cập nhật coffeeDonation bằng editor
    try {
      await payload.updateGlobal({
        slug: 'siteSettings',
        data: {
          coffeeDonation: {
            title: 'Tiêu đề do editor đổi trái phép',
          },
        },
        user: editor,
        overrideAccess: false,
      })
    } catch {
      // Nếu Payload ném lỗi quyền truy cập thì hợp lệ
    }

    // Kiểm tra lại bằng owner: giá trị title không bị editor đổi
    const check = (await payload.findGlobal({
      slug: 'siteSettings',
      user: owner,
      overrideAccess: false,
    })) as SiteSetting
    expect(check.coffeeDonation?.title).toBe('Mời Trạm một ly cà phê')
  })

  it('REST công khai đọc được coffeeDonation nhưng KHÔNG đọc được bankBin / accountNumber', async () => {
    const publicSettings = (await payload.findGlobal({
      slug: 'siteSettings',
      user: undefined,
      overrideAccess: false,
    })) as unknown as Record<string, unknown>

    // coffeeDonation có quyền đọc công khai
    expect(publicSettings.coffeeDonation).toBeDefined()
    expect((publicSettings.coffeeDonation as { title?: string })?.title).toBe(
      'Mời Trạm một ly cà phê',
    )

    // Các field nhạy cảm ngân hàng không được lộ ra ngoài
    expect(publicSettings.bankBin).toBeUndefined()
    expect(publicSettings.bankName).toBeUndefined()
    expect(publicSettings.accountNumber).toBeUndefined()
  })

  it('bật enabled mà không có ảnh -> lỗi validate tiếng Việt', async () => {
    let thrownError: PayloadValidationError | null = null
    try {
      await payload.updateGlobal({
        slug: 'siteSettings',
        data: {
          coffeeDonation: {
            enabled: true,
            qrImage: null,
          },
        },
        user: owner,
        overrideAccess: false,
      })
    } catch (err: unknown) {
      thrownError = err as PayloadValidationError
    }
    expect(thrownError).not.toBeNull()
    const messages = (thrownError?.data?.errors || []).map((e) => e.message)
    expect(messages).toContain(vi.cf01.errors.requiredQrImage)
  })

  it('nhập momoUrl không phải https:// -> lỗi validate tiếng Việt', async () => {
    let thrownError: PayloadValidationError | null = null
    try {
      await payload.updateGlobal({
        slug: 'siteSettings',
        data: {
          coffeeDonation: {
            enabled: false,
            momoUrl: 'http://insecure.test',
          },
        },
        user: owner,
        overrideAccess: false,
      })
    } catch (err: unknown) {
      thrownError = err as PayloadValidationError
    }
    expect(thrownError).not.toBeNull()
    const messages = (thrownError?.data?.errors || []).map((e) => e.message)
    expect(messages).toContain(vi.cf01.errors.invalidMomoUrl)
  })
})
