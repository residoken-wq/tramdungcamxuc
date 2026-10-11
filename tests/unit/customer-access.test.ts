// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { Customer, Order } from '../../src/payload-types'
import { isAdminUser } from '../../src/lib/auth/access'
import { getAuthSecret, signCustomerToken } from '../../src/lib/auth/token'

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
          items: [{ product: testProduct.id, price: 149000 }],
          subtotal: 149000,
          total: 149000,
          paymentStatus: 'pending',
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
          items: [{ product: testProduct.id, price: 250000 }],
          subtotal: 250000,
          total: 250000,
          paymentStatus: 'pending',
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

  const getRealCustomerSession = async (customer: Customer) => {
    const token = signCustomerToken({ id: customer.id, email: customer.email })
    const headers = new Headers({ cookie: `tdcx_customer_token=${token}` })
    const authResult = await payload.auth({ headers })
    if (!authResult.user) throw new Error('Failed to authenticate customer session')
    return authResult.user
  }

  it('authenticates customer via real session cookie and resolves customer identity (A1)', async () => {
    const rawSecret = process.env.PAYLOAD_SECRET || ''
    const tokenA = signCustomerToken({ id: customerA.id, email: customerA.email }, rawSecret)
    const headers = new Headers({ cookie: `tdcx_customer_token=${tokenA}` })
    const authResult = await payload.auth({ headers })

    expect(authResult.user).not.toBeNull()
    expect(authResult.user?.id).toBe(customerA.id)
    expect(authResult.user?.collection).toBe('customers')
  })

  it('throws an error if PAYLOAD_SECRET is unset or empty instead of using a fallback (B5)', () => {
    const originalSecret = process.env.PAYLOAD_SECRET
    try {
      delete process.env.PAYLOAD_SECRET
      expect(() => getAuthSecret()).toThrow(/PAYLOAD_SECRET/)
    } finally {
      process.env.PAYLOAD_SECRET = originalSecret
    }
  })

  it('customer A can read their own order but cannot read customer B order', async () => {
    const userA = await getRealCustomerSession(customerA)

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
    const userA = await getRealCustomerSession(customerA)

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
    const userA = await getRealCustomerSession(customerA)

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
    const userA = await getRealCustomerSession(customerA)

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
    const userA = await getRealCustomerSession(customerA)
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

  it('customer is strictly rejected from admin access (/admin is users-only)', async () => {
    const userA = await getRealCustomerSession(customerA)

    // 1. Check isAdminUser helper
    expect(isAdminUser(userA)).toBe(false)

    // 2. Payload configuration specifies admin user collection is strictly 'users'
    expect(payload.config.admin.user).toBe('users')
    expect(userA.collection).not.toBe(payload.config.admin.user)
  })
})
