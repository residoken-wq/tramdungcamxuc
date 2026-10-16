// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

let mockCustomerCookieToken: string | null = null

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      name === 'tdcx_customer_token'
        ? mockCustomerCookieToken
          ? { value: mockCustomerCookieToken }
          : undefined
        : undefined,
    set: vi.fn(),
    delete: vi.fn(() => {
      mockCustomerCookieToken = null
    }),
  })),
  headers: vi.fn(async () => new Headers()),
}))

import { createHmac, randomUUID } from 'node:crypto'
import { getPayload, type CollectionSlug, type Payload } from 'payload'
import config from '../../src/payload.config'
import {
  CUSTOMER_TOKEN_COOKIE,
  getAuthSecret,
  hashTrialEmail,
  signCustomerToken,
  verifyCustomerToken,
} from '../../src/lib/auth/token'
import { customerAuthStrategy } from '../../src/lib/auth/strategy'
import { getCurrentCustomer, revokeCustomerSession } from '../../src/lib/auth/session.server'

describe('Customer Session Management & Isolation (T2-20)', () => {
  let payload: Payload
  const created: { collection: CollectionSlug; id: number }[] = []

  const track = <T extends { id: number }>(collection: CollectionSlug, doc: T): T => {
    created.push({ collection, id: doc.id })
    return doc
  }

  beforeAll(async () => {
    payload = await getPayload({ config })
  }, 60000)

  afterAll(async () => {
    if (!payload) return
    // Clean up only our created records in reverse order
    for (const entry of created.reverse()) {
      try {
        await payload.delete({
          collection: entry.collection,
          id: entry.id,
          overrideAccess: true,
          context: { accountDeletion: true },
        })
      } catch {
        // ignore already deleted items
      }
    }
  })

  // 1. Đăng xuất -> token cũ bị từ chối (strategy lẫn getCurrentCustomer)
  it('đăng xuất -> token cũ bị từ chối ở cả strategy lẫn getCurrentCustomer', async () => {
    const suffix = randomUUID().slice(0, 8)
    const customer = track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: `test-logout-${suffix}@example.test`,
          name: `[TEST] Customer Logout ${suffix}`,
          consentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      }),
    )

    const token = signCustomerToken({
      id: customer.id,
      email: customer.email,
      sessionVersion: customer.sessionVersion ?? 0,
    })

    const headers = new Headers({
      Cookie: `${CUSTOMER_TOKEN_COOKIE}=${token}`,
    })

    // Before logout: Strategy accepts customer
    const authBefore = await customerAuthStrategy.authenticate({
      headers,
      payload,
    })
    expect(authBefore.user).toBeDefined()
    expect(authBefore.user?.id).toBe(customer.id)

    // Before logout: getCurrentCustomer accepts customer
    mockCustomerCookieToken = token
    const currentBefore = await getCurrentCustomer(payload)
    expect(currentBefore).toBeDefined()
    expect(currentBefore?.id).toBe(customer.id)

    // Revoke session server-side (as logoutAction does via UPDATE session_version + 1)
    await revokeCustomerSession(customer.id, payload)

    // After revocation: Strategy rejects old token
    const authAfter = await customerAuthStrategy.authenticate({
      headers,
      payload,
    })
    expect(authAfter.user).toBeNull()

    // After revocation: getCurrentCustomer rejects old token even if cookie is still sent
    const currentAfter = await getCurrentCustomer(payload)
    expect(currentAfter).toBeNull()
  })

  // 2. Token không có sv vẫn hợp lệ khi sessionVersion = 0
  it('token không có sv vẫn hợp lệ khi sessionVersion = 0 (tương thích token cũ)', async () => {
    const suffix = randomUUID().slice(0, 8)
    const customer = track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: `test-legacy-${suffix}@example.test`,
          name: `[TEST] Customer Legacy ${suffix}`,
          consentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      }),
    )

    expect(customer.sessionVersion).toBe(0)

    // Sign legacy token WITHOUT sv field
    const secret = getAuthSecret()
    const now = Math.floor(Date.now() / 1000)
    const header = { alg: 'HS256', typ: 'JWT' }
    const legacyPayload = {
      id: customer.id,
      email: customer.email,
      exp: now + 3600,
      iat: now,
      collection: 'customers',
    }
    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url')
    const payloadB64 = Buffer.from(JSON.stringify(legacyPayload)).toString('base64url')
    const message = `${headerB64}.${payloadB64}`
    const signature = createHmac('sha256', secret).update(message).digest('base64url')
    const legacyToken = `${message}.${signature}`

    // verifyCustomerToken should default sv to 0
    const verified = verifyCustomerToken(legacyToken, secret)
    expect(verified).toBeDefined()
    expect(verified?.sv).toBe(0)

    // Strategy accepts legacy token
    const headers = new Headers({
      Cookie: `${CUSTOMER_TOKEN_COOKIE}=${legacyToken}`,
    })
    const authRes = await customerAuthStrategy.authenticate({
      headers,
      payload,
    })
    expect(authRes.user).toBeDefined()
    expect(authRes.user?.id).toBe(customer.id)

    // getCurrentCustomer accepts legacy token
    mockCustomerCookieToken = legacyToken
    const current = await getCurrentCustomer(payload)
    expect(current).toBeDefined()
    expect(current?.id).toBe(customer.id)
  })

  // 3. Admin đổi email -> token cũ bị từ chối
  it('admin đổi email khách -> sessionVersion tự động tăng và token cũ bị từ chối', async () => {
    const suffix = randomUUID().slice(0, 8)
    const oldEmail = `test-email-old-${suffix}@example.test`
    const newEmail = `test-email-new-${suffix}@example.test`

    const customer = track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: oldEmail,
          name: `[TEST] Customer Email Change ${suffix}`,
          consentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      }),
    )

    expect(customer.sessionVersion).toBe(0)

    // Sign token with old email & sv = 0
    const oldToken = signCustomerToken({
      id: customer.id,
      email: oldEmail,
      sessionVersion: 0,
    })

    const headers = new Headers({
      Cookie: `${CUSTOMER_TOKEN_COOKIE}=${oldToken}`,
    })

    // Valid with old email before update
    const authBefore = await customerAuthStrategy.authenticate({
      headers,
      payload,
    })
    expect(authBefore.user).toBeDefined()
    expect(authBefore.user?.id).toBe(customer.id)

    // Admin updates email (same casing or trimmed differences should be detected)
    const updated = await payload.update({
      collection: 'customers',
      id: customer.id,
      data: {
        email: newEmail,
      },
      overrideAccess: true,
    })

    // sessionVersion must have been incremented by the beforeChange hook
    expect(updated.sessionVersion).toBe(1)

    // Old token has sv: 0, which does not match DB sessionVersion: 1 -> rejected!
    const authAfter = await customerAuthStrategy.authenticate({
      headers,
      payload,
    })
    expect(authAfter.user).toBeNull()

    mockCustomerCookieToken = oldToken
    const currentAfter = await getCurrentCustomer(payload)
    expect(currentAfter).toBeNull()

    // Token signed with new sessionVersion (1) and new email works
    const newToken = signCustomerToken({
      id: customer.id,
      email: newEmail,
      sessionVersion: 1,
    })
    const newHeaders = new Headers({
      Cookie: `${CUSTOMER_TOKEN_COOKIE}=${newToken}`,
    })
    const authWithNew = await customerAuthStrategy.authenticate({
      headers: newHeaders,
      payload,
    })
    expect(authWithNew.user).toBeDefined()
    expect(authWithNew.user?.id).toBe(customer.id)
  })

  // 4. Khách gửi PATCH /api/customers/:id với sessionVersion -> không đổi
  it('khách gửi PATCH cập nhật sessionVersion -> không bị đổi (chỉ admin có quyền)', async () => {
    const suffix = randomUUID().slice(0, 8)
    const customer = track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: `test-patch-${suffix}@example.test`,
          name: `[TEST] Customer Patch ${suffix}`,
          consentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      }),
    )

    expect(customer.sessionVersion).toBe(0)

    // Customer attempts to modify sessionVersion
    const patchResult = await payload.update({
      collection: 'customers',
      id: customer.id,
      data: {
        sessionVersion: 99,
        name: `[TEST] Customer Renamed ${suffix}`,
      },
      user: {
        ...customer,
        collection: 'customers',
      },
      overrideAccess: false,
    })

    // Name was updated, but sessionVersion is stripped from output for customer (read access: admin only)
    expect(patchResult.name).toBe(`[TEST] Customer Renamed ${suffix}`)
    expect(patchResult.sessionVersion).toBeUndefined()

    // Read doc directly from DB to verify sessionVersion remained 0
    const docInDb = await payload.findByID({
      collection: 'customers',
      id: customer.id,
      overrideAccess: true,
    })
    expect(docInDb.sessionVersion).toBe(0)
  })

  // 5. Strategy khách trả null khi request có JWT admin hợp lệ
  it('strategy khách trả null khi request có JWT admin hợp lệ (không đè phiên admin)', async () => {
    const suffix = randomUUID().slice(0, 8)
    const adminEmail = `admin-dual-${suffix}@example.test`
    const adminPassword = `AdminPass-${suffix}`

    // Create an admin user
    track(
      'users',
      await payload.create({
        collection: 'users',
        data: {
          email: adminEmail,
          password: adminPassword,
          role: 'owner',
        },
        overrideAccess: true,
      }),
    )

    // Log in as admin to get valid admin JWT token
    const loginRes = await payload.login({
      collection: 'users',
      data: {
        email: adminEmail,
        password: adminPassword,
      },
    })
    const adminToken = loginRes.token
    expect(adminToken).toBeDefined()

    // Create a customer and sign customer token
    const customer = track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: `test-dual-${suffix}@example.test`,
          name: `[TEST] Customer Dual ${suffix}`,
          consentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      }),
    )

    const customerToken = signCustomerToken({
      id: customer.id,
      email: customer.email,
      sessionVersion: 0,
    })

    // Request containing BOTH customer cookie AND admin cookie:
    // Cookie header has payload-token AND tdcx_customer_token
    const dualCookieHeaders = new Headers({
      Cookie: `payload-token=${adminToken}; ${CUSTOMER_TOKEN_COOKIE}=${customerToken}`,
    })

    // customerAuthStrategy must yield and return { user: null }
    const authResultWithDualCookie = await customerAuthStrategy.authenticate({
      headers: dualCookieHeaders,
      payload,
    })
    expect(authResultWithDualCookie.user).toBeNull()

    // Request containing customer cookie AND admin Authorization Bearer header:
    const dualBearerHeaders = new Headers({
      Authorization: `Bearer ${adminToken}`,
      Cookie: `${CUSTOMER_TOKEN_COOKIE}=${customerToken}`,
    })
    const authResultWithDualBearer = await customerAuthStrategy.authenticate({
      headers: dualBearerHeaders,
      payload,
    })
    expect(authResultWithDualBearer.user).toBeNull()

    // If admin token is NOT present (only customer cookie), customerAuthStrategy authenticates customer:
    const customerOnlyHeaders = new Headers({
      Cookie: `${CUSTOMER_TOKEN_COOKIE}=${customerToken}`,
    })
    const authResultCustomerOnly = await customerAuthStrategy.authenticate({
      headers: customerOnlyHeaders,
      payload,
    })
    expect(authResultCustomerOnly.user).toBeDefined()
    expect(authResultCustomerOnly.user?.id).toBe(customer.id)
    expect(authResultCustomerOnly.user?.collection).toBe('customers')
  })

  // 6. Xóa sản phẩm có trialUsage -> xóa được
  it('xóa sản phẩm có trialUsage -> xóa thành công không bị lỗi khóa ngoại NOT NULL', async () => {
    const suffix = randomUUID().slice(0, 8)

    // Create digital_tool product
    const product = track(
      'products',
      await payload.create({
        collection: 'products',
        data: {
          name: `[TEST] Product Trial ${suffix}`,
          slug: `test-prod-trial-${suffix}`,
          web: 'habit',
          type: 'digital_tool',
          price: 150000,
          saleStatus: 'on_sale',
          _status: 'published',
        },
        overrideAccess: true,
      }),
    )

    // Create anonymous trialUsage entry pointing to product
    const emailHash = hashTrialEmail(`test-trial-user-${suffix}@example.test`)
    const usage = track(
      'trialUsage',
      await payload.create({
        collection: 'trialUsage',
        data: {
          emailHash,
          product: product.id,
        },
        overrideAccess: true,
      }),
    )

    expect(usage.id).toBeDefined()

    // Delete the product: In PostgreSQL, FK has ON DELETE SET NULL.
    // Now that product is nullable in schema & migration, this deletion must succeed!
    await expect(
      payload.delete({
        collection: 'products',
        id: product.id,
        overrideAccess: true,
      }),
    ).resolves.toBeDefined()

    // Find the trialUsage record: it must still exist, with product set to null
    const usageAfter = await payload.findByID({
      collection: 'trialUsage',
      id: usage.id,
      overrideAccess: true,
    })
    expect(usageAfter).toBeDefined()
    expect(usageAfter.product).toBeNull()
  })
})
