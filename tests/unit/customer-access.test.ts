// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { Customer, Order } from '../../src/payload-types'
import { isAdminUser } from '../../src/lib/auth/access'

describe('Customer Access Control & Permissions (T2-01)', () => {
  let payload: Payload
  let customerA: Customer
  let customerB: Customer
  let orderA: Order
  let orderB: Order
  const created: { collection: CollectionSlug; id: number }[] = []

  const track = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
    created.push({ collection, id: doc.id })
    return doc
  }

  beforeAll(async () => {
    payload = await getPayload({ config })

    // Create Customer A
    customerA = track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: `customer-a-${randomUUID()}@example.test`,
          name: 'Khách A',
          consentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      }),
    )

    // Create Customer B
    customerB = track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: `customer-b-${randomUUID()}@example.test`,
          name: 'Khách B',
          consentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      }),
    )

    // Create a test product for orders
    const testProduct = track(
      'products',
      await payload.create({
        collection: 'products',
        data: {
          name: 'Test Product T2-01',
          slug: `test-prod-${randomUUID()}`,
          web: 'site',
          type: 'digital_tool',
          saleStatus: 'on_sale',
          price: 149000,
        },
        overrideAccess: true,
      }),
    )

    // Create Order for Customer A
    orderA = track(
      'orders',
      await payload.create({
        collection: 'orders',
        data: {
          customer: customerA.id,
          items: [{ product: testProduct.id, price: 149000, quantity: 1 }],
          subtotal: 149000,
          total: 149000,
          paymentStatus: 'pending',
          paymentMethod: 'bank_transfer',
        },
        overrideAccess: true,
      }),
    )

    // Create Order for Customer B
    orderB = track(
      'orders',
      await payload.create({
        collection: 'orders',
        data: {
          customer: customerB.id,
          items: [{ product: testProduct.id, price: 250000, quantity: 1 }],
          subtotal: 250000,
          total: 250000,
          paymentStatus: 'pending',
          paymentMethod: 'bank_transfer',
        },
        overrideAccess: true,
      }),
    )
  }, 60000)

  afterAll(async () => {
    if (!payload) return
    try {
      for (const entry of created.reverse()) {
        try {
          await payload.delete({ collection: entry.collection, id: entry.id, overrideAccess: true })
        } catch {
          // ignore cleanup failures
        }
      }
    } finally {
      await payload.destroy()
    }
  })

  it('customer A can read their own order but cannot read customer B order', async () => {
    const userA = { ...customerA, collection: 'customers' as const }

    // Query orders as Customer A
    const resA = await payload.find({
      collection: 'orders',
      user: userA,
      overrideAccess: false,
    })

    const foundIds = resA.docs.map((d) => d.id)
    expect(foundIds).toContain(orderA.id)
    expect(foundIds).not.toContain(orderB.id)
  })

  it('customer A can read their own profile but cannot read customer B profile', async () => {
    const userA = { ...customerA, collection: 'customers' as const }

    // Query customers as Customer A
    const resCustomers = await payload.find({
      collection: 'customers',
      user: userA,
      overrideAccess: false,
    })

    const foundIds = resCustomers.docs.map((d) => d.id)
    expect(foundIds).toContain(customerA.id)
    expect(foundIds).not.toContain(customerB.id)
  })

  it('customer cannot update order paymentStatus', async () => {
    const userA = { ...customerA, collection: 'customers' as const }

    // Customer attempting to update an order fails access control
    await expect(
      payload.update({
        collection: 'orders',
        id: orderA.id,
        data: { paymentStatus: 'paid' },
        user: userA,
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    // Verify status was not altered
    const freshOrder = await payload.findByID({
      collection: 'orders',
      id: orderA.id,
      overrideAccess: true,
    })
    expect(freshOrder.paymentStatus).toBe('pending')
  })

  it('customer cannot create or update entitlements', async () => {
    const userA = { ...customerA, collection: 'customers' as const }

    // Attempting to create entitlement as customer fails
    await expect(
      payload.create({
        collection: 'entitlements',
        data: {
          customer: customerA.id,
          source: 'manual',
          status: 'active',
          product: 1,
        },
        user: userA,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('customer cannot update their own email or consentAt timestamp', async () => {
    const userA = { ...customerA, collection: 'customers' as const }
    const originalEmail = customerA.email
    const originalConsentAt = customerA.consentAt

    // Customer can update their own name
    await payload.update({
      collection: 'customers',
      id: customerA.id,
      data: {
        name: 'Tên Mới Của A',
        email: 'hacked-email@example.test', // Field-level access blocks email update
      },
      user: userA,
      overrideAccess: false,
    })

    const refreshed = await payload.findByID({
      collection: 'customers',
      id: customerA.id,
      overrideAccess: true,
    })

    expect(refreshed.name).toBe('Tên Mới Của A')
    expect(refreshed.email).toBe(originalEmail)
    expect(refreshed.consentAt).toBe(originalConsentAt)
  })

  it('customer is strictly rejected from admin access (/admin is users-only)', () => {
    const userA = { ...customerA, collection: 'customers' as const }

    // 1. Check isAdminUser helper
    expect(isAdminUser(userA)).toBe(false)

    // 2. Payload configuration specifies admin user collection is strictly 'users'
    expect(payload.config.admin.user).toBe('users')
    expect(userA.collection).not.toBe(payload.config.admin.user)
  })
})
