// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type CollectionSlug, type Payload, type PayloadRequest } from 'payload'
import config from '../../src/payload.config'
import {
  generatePaymentRef,
  generateUniquePaymentRef,
  PAYMENT_REF_PATTERN,
} from '../../src/lib/payments/payment-ref'

type AdminUser = NonNullable<PayloadRequest['user']>

describe('access control (T0-07)', () => {
  let payload: Payload
  let owner: AdminUser
  let editor: AdminUser
  let customerId: number
  let productId: number
  let packageId: number
  const created: { collection: CollectionSlug; id: number }[] = []
  const track = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
    created.push({ collection, id: doc.id })
    return doc
  }
  const asUser = (doc: { id: number }) => ({ ...doc, collection: 'users' }) as unknown as AdminUser

  beforeAll(async () => {
    payload = await getPayload({ config })
    const make = async (role: 'owner' | 'editor') => {
      const u = await payload.create({
        collection: 'users',
        data: {
          email: `t0-07-${role}-${randomUUID()}@example.test`,
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
    customerId = track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: { email: `c-${randomUUID()}@example.test` },
      }),
    ).id
    productId = track(
      'products',
      await payload.create({
        collection: 'products',
        data: {
          name: 'T0-07 tool',
          slug: `t0-07-${randomUUID()}`,
          web: 'habit',
          type: 'digital_tool',
          saleStatus: 'on_sale',
        },
      }),
    ).id
    // Admin-created payment links are for published packages only (T1-13)
    packageId = track(
      'products',
      await payload.create({
        collection: 'products',
        data: {
          name: 'T0-07 package',
          slug: `t0-07-pkg-${randomUUID()}`,
          web: 'site',
          type: 'package',
          saleStatus: 'consult',
          price: 1750000,
          _status: 'published',
        },
      }),
    ).id
  }, 60000)

  afterAll(async () => {
    if (!payload) return
    try {
      for (const entry of created.reverse())
        await payload.delete({ ...entry, overrideAccess: true })
    } finally {
      await payload.destroy()
    }
  }, 30000)

  const order = (user: AdminUser, extra: Record<string, unknown> = {}) =>
    payload.create({
      collection: 'orders',
      user,
      overrideAccess: false,
      data: {
        customer: customerId,
        items: [{ product: productId, price: 178000 }],
        total: 178000,
        termsAcceptedAt: new Date().toISOString(),
        ...extra,
      } as never,
    })

  it('editor cannot promote themselves to owner, and cannot create or delete admins', async () => {
    const updated = await payload.update({
      collection: 'users',
      id: editor.id,
      data: { role: 'owner' },
      user: editor,
      overrideAccess: false,
    })
    expect(updated.role).toBe('editor')
    await expect(
      payload.create({
        collection: 'users',
        data: { email: `x-${randomUUID()}@example.test`, password: randomUUID(), role: 'owner' },
        user: editor,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
    await expect(
      payload.delete({ collection: 'users', id: owner.id, user: editor, overrideAccess: false }),
    ).rejects.toThrow()
  })

  it('orders: server-generated reference, editor cannot mark paid or delete; owner can', async () => {
    const byEditor = track(
      'orders',
      await order(editor, { paymentStatus: 'paid', paymentRef: 'TDCXAAAAA' }),
    )
    expect(byEditor.paymentStatus).toBe('pending')
    expect(byEditor.paymentRef).toMatch(PAYMENT_REF_PATTERN)
    expect(byEditor.paymentRef).not.toBe('TDCXAAAAA')
    expect(byEditor.payToken ?? null).toBeNull()

    const stillPending = await payload.update({
      collection: 'orders',
      id: byEditor.id,
      data: { paymentStatus: 'paid', paymentRef: 'TDCXBBBBB', notes: 'ghi chú' },
      user: editor,
      overrideAccess: false,
    })
    expect(stillPending).toMatchObject({
      paymentStatus: 'pending',
      paymentRef: byEditor.paymentRef,
      notes: 'ghi chú',
    })
    await expect(
      payload.delete({
        collection: 'orders',
        id: byEditor.id,
        user: editor,
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    const paid = await payload.update({
      collection: 'orders',
      id: byEditor.id,
      data: { paymentStatus: 'paid' },
      context: { paymentAction: true },
      user: owner,
      overrideAccess: false,
    })
    expect(paid.paymentStatus).toBe('paid')

    const link = track(
      'orders',
      await order(owner, {
        createdByAdmin: true,
        items: [{ product: packageId, price: 1 }],
      }),
    )
    expect(typeof link.payToken).toBe('string')
    expect((link.payToken as string).length).toBeGreaterThanOrEqual(32)
    expect(link.paymentRef).not.toBe(byEditor.paymentRef)
  })

  it('a customer can use the trial of a product only once (hook + DB unique index)', async () => {
    const data = {
      customer: customerId,
      product: productId,
      source: 'trial' as const,
      status: 'trial' as const,
    }
    track('entitlements', await payload.create({ collection: 'entitlements', data }))
    await expect(payload.create({ collection: 'entitlements', data })).rejects.toMatchObject({
      data: { errors: [{ message: expect.stringMatching(/dùng thử/) }] },
    })
    const paid = { ...data, source: 'order' as const, status: 'active' as const }
    track('entitlements', await payload.create({ collection: 'entitlements', data: paid }))
    track('entitlements', await payload.create({ collection: 'entitlements', data: paid }))
  })

  it('emotion and note of check-ins are hidden from editors; one check-in per plan and day', async () => {
    const plan = track(
      'habitPlans',
      await payload.create({ collection: 'habitPlans', data: { customer: customerId } }),
    )
    const checkin = track(
      'habitCheckins',
      await payload.create({
        collection: 'habitCheckins',
        data: { plan: plan.id, day: 1, done: true, emotion: 'peaceful', note: 'riêng tư' },
      }),
    )
    const asEditor = await payload.findByID({
      collection: 'habitCheckins',
      id: checkin.id,
      user: editor,
      overrideAccess: false,
    })
    expect(asEditor.emotion).toBeUndefined()
    expect(asEditor.note).toBeUndefined()
    const asOwner = await payload.findByID({
      collection: 'habitCheckins',
      id: checkin.id,
      user: owner,
      overrideAccess: false,
    })
    expect(asOwner).toMatchObject({ emotion: 'peaceful', note: 'riêng tư' })
    await expect(
      payload.create({ collection: 'habitCheckins', data: { plan: plan.id, day: 1, done: false } }),
    ).rejects.toMatchObject({
      data: { errors: [{ message: expect.stringMatching(/check-in/) }] },
    })
  })

  it('anonymous visitors read neither drafts nor personal data', async () => {
    const draft = track(
      'products',
      await payload.create({
        collection: 'products',
        draft: true,
        data: {
          name: 'Draft',
          slug: `draft-${randomUUID()}`,
          web: 'site',
          type: 'ebook',
          saleStatus: 'free',
          _status: 'draft',
        },
      }),
    )
    const publicList = await payload.find({
      collection: 'products',
      where: { id: { equals: draft.id } },
      overrideAccess: false,
    })
    expect(publicList.docs).toHaveLength(0)
    for (const collection of [
      'customers',
      'orders',
      'leads',
      'entitlements',
      'habitCheckins',
    ] as CollectionSlug[]) {
      await expect(payload.find({ collection, overrideAccess: false })).rejects.toThrow()
    }
  })

  it('payment logs, audit logs and OTP codes are closed to editors (OTP to everyone)', async () => {
    for (const collection of ['paymentEvents', 'auditLogs'] as CollectionSlug[]) {
      await expect(
        payload.find({ collection, user: editor, overrideAccess: false }),
      ).rejects.toThrow()
      await expect(
        payload.find({ collection, user: owner, overrideAccess: false }),
      ).resolves.toBeDefined()
      await expect(
        payload.create({
          collection,
          data: { provider: 'x', action: 'x' },
          user: owner,
          overrideAccess: false,
        }),
      ).rejects.toThrow()
    }
    await expect(
      payload.find({ collection: 'otpCodes', user: owner, overrideAccess: false }),
    ).rejects.toThrow()
  })

  it('payment settings are owner-only', async () => {
    const before = await payload.findGlobal({ slug: 'siteSettings' })
    try {
      await payload.updateGlobal({
        slug: 'siteSettings',
        data: { bankBin: '970436' },
        user: owner,
        overrideAccess: false,
      })
      const asEditor = await payload.findGlobal({
        slug: 'siteSettings',
        user: editor,
        overrideAccess: false,
      })
      expect(asEditor.bankBin).toBeUndefined()
      await payload.updateGlobal({
        slug: 'siteSettings',
        data: { bankBin: '000000' },
        user: editor,
        overrideAccess: false,
      })
      const asOwner = await payload.findGlobal({
        slug: 'siteSettings',
        user: owner,
        overrideAccess: false,
      })
      expect(asOwner.bankBin).toBe('970436')
    } finally {
      await payload.updateGlobal({
        slug: 'siteSettings',
        data: { bankBin: before.bankBin ?? null },
      })
    }
  })
})

describe('payment reference generator', () => {
  it('uses TDCX + 5 unambiguous characters', () => {
    for (let i = 0; i < 200; i++) {
      const ref = generatePaymentRef()
      expect(ref).toMatch(PAYMENT_REF_PATTERN)
      expect(ref.slice(4)).not.toMatch(/[01OI]/)
    }
  })

  it('retries on collision and gives up with a Vietnamese error', async () => {
    const seen = new Set(['TDCX22222'])
    let calls = 0
    const ref = await generateUniquePaymentRef(
      async (r) => seen.has(r),
      () => (calls++ < 5 ? 0 : 1),
    )
    expect(ref).toBe('TDCX33333')
    await expect(generateUniquePaymentRef(async () => true)).rejects.toThrow(/mã chuyển khoản/)
  })
})
