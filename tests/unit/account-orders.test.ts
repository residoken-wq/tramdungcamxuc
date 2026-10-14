// @vitest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { randomUUID } from 'node:crypto'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import type { Customer } from '../../src/payload-types'
import { getCustomerOrders } from '../../src/lib/account/orders.server'
import { requestOrderFileDownloadAction } from '../../src/lib/account/download-actions'
import { signDownloadToken } from '../../src/lib/downloads/token'
import * as sessionServer from '../../src/lib/auth/session.server'
import { GET as downloadRoute } from '../../src/app/(site)/api/download/[token]/route'

describe('Customer Account Orders & Downloads (T2-17)', () => {
  let payload: Payload
  let customerAId: number
  let customerBId: number
  let productWithFileId: number
  let productWithoutFileId: number
  let privateFileId: number
  let tempFilePath: string
  let freeProductId: number
  let orderA1Id: number
  let orderA2Id: number
  let orderB1Id: number
  let customerA: Customer
  let customerB: Customer

  const createdOrders: number[] = []
  const createdCustomers: number[] = []
  const createdProducts: number[] = []
  const createdPrivateFiles: number[] = []

  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    // 1. Tạo file tạm và bản ghi privateFiles
    const testFileName = `test-account-${randomUUID().slice(0, 8)}.pdf`
    tempFilePath = path.resolve(os.tmpdir(), testFileName)
    fs.writeFileSync(
      tempFilePath,
      Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\nstartxref\n9\n%%EOF\n'),
    )

    const privateFileDoc = await payload.create({
      collection: 'privateFiles',
      data: {
        description: 'Tài liệu test đính kèm đơn hàng',
      },
      filePath: tempFilePath,
      overrideAccess: true,
    })
    privateFileId = privateFileDoc.id
    createdPrivateFiles.push(privateFileId)

    // 2. Tạo 2 sản phẩm: 1 có file, 1 không có file
    const prodWithFile = await payload.create({
      collection: 'products',
      data: {
        name: 'Ebook Hướng Dẫn Thói Quen Test',
        slug: `ebook-test-${randomUUID().slice(0, 8)}`,
        web: 'site',
        type: 'ebook',
        price: 250000,
        salePrice: 178000,
        saleStatus: 'on_sale',
        files: [{ file: privateFileId }],
        _status: 'published',
      },
      overrideAccess: true,
    })
    productWithFileId = prodWithFile.id
    createdProducts.push(productWithFileId)

    const prodWithoutFile = await payload.create({
      collection: 'products',
      data: {
        name: 'Gói Đồng Hành Test',
        slug: `goi-dong-hanh-test-${randomUUID().slice(0, 8)}`,
        web: 'site',
        type: 'package',
        price: 1750000,
        saleStatus: 'on_sale',
        files: [],
        _status: 'published',
      },
      overrideAccess: true,
    })
    productWithoutFileId = prodWithoutFile.id
    createdProducts.push(productWithoutFileId)

    const freeProduct = await payload.create({
      collection: 'products',
      data: {
        name: 'Toolkit Miễn Phí Test',
        slug: `toolkit-free-test-${randomUUID().slice(0, 8)}`,
        web: 'site',
        type: 'toolkit',
        saleStatus: 'free',
        files: [{ file: privateFileId }],
        _status: 'published',
      },
      overrideAccess: true,
    })
    freeProductId = freeProduct.id
    createdProducts.push(freeProductId)

    // 3. Tạo 2 khách hàng test: Học viên Test 01 và Học viên Test 02
    const custA = await payload.create({
      collection: 'customers',
      data: {
        email: `hoc-vien-01-${randomUUID().slice(0, 8)}@example.test`,
        name: 'Học viên Test 01',
      },
      overrideAccess: true,
    })
    customerAId = custA.id
    customerA = custA as Customer
    createdCustomers.push(customerAId)

    const custB = await payload.create({
      collection: 'customers',
      data: {
        email: `hoc-vien-02-${randomUUID().slice(0, 8)}@example.test`,
        name: 'Học viên Test 02',
      },
      overrideAccess: true,
    })
    customerBId = custB.id
    customerB = custB as Customer
    createdCustomers.push(customerBId)

    // 4. Tạo các đơn hàng cho Khách A
    // Đơn A1: pending (chờ thanh toán), sản phẩm không có file
    const orderA1 = await payload.create({
      collection: 'orders',
      data: {
        customer: customerAId,
        items: [{ product: productWithoutFileId, price: 178000 }],
        subtotal: 178000,
        total: 178000,
        paymentStatus: 'pending',
      },
      context: { paymentAction: true },
      overrideAccess: true,
    })
    createdOrders.push(orderA1.id)
    orderA1Id = orderA1.id

    // Đơn A2: paid (đã thanh toán), sản phẩm CÓ file
    const orderA2 = await payload.create({
      collection: 'orders',
      data: {
        customer: customerAId,
        items: [{ product: productWithFileId, price: 250000 }],
        subtotal: 250000,
        total: 250000,
        paymentStatus: 'paid',
        paidAt: new Date().toISOString(),
      },
      context: { paymentAction: true },
      overrideAccess: true,
    })
    createdOrders.push(orderA2.id)
    orderA2Id = orderA2.id

    // Đơn A3: cancelled (đã hủy)
    const orderA3 = await payload.create({
      collection: 'orders',
      data: {
        customer: customerAId,
        items: [{ product: productWithoutFileId, price: 500000 }],
        subtotal: 500000,
        total: 500000,
        paymentStatus: 'cancelled',
      },
      context: { paymentAction: true },
      overrideAccess: true,
    })
    createdOrders.push(orderA3.id)

    // 5. Tạo đơn hàng cho Khách B (paid)
    const orderB1 = await payload.create({
      collection: 'orders',
      data: {
        customer: customerBId,
        items: [{ product: productWithFileId, price: 250000 }],
        subtotal: 250000,
        total: 250000,
        paymentStatus: 'paid',
        paidAt: new Date().toISOString(),
      },
      context: { paymentAction: true },
      overrideAccess: true,
    })
    createdOrders.push(orderB1.id)
    orderB1Id = orderB1.id
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  afterAll(async () => {
    // Dọn sạch dữ liệu theo thứ tự FK: orders -> customers -> products -> privateFiles
    for (const orderId of createdOrders) {
      try {
        await payload.delete({ collection: 'orders', id: orderId, overrideAccess: true })
      } catch {
        // bỏ qua
      }
    }

    for (const custId of createdCustomers) {
      try {
        await payload.delete({ collection: 'customers', id: custId, overrideAccess: true })
      } catch {
        // bỏ qua
      }
    }

    for (const prodId of createdProducts) {
      try {
        await payload.delete({ collection: 'products', id: prodId, overrideAccess: true })
      } catch {
        // bỏ qua
      }
    }

    for (const fileId of createdPrivateFiles) {
      try {
        await payload.delete({ collection: 'privateFiles', id: fileId, overrideAccess: true })
      } catch {
        // bỏ qua
      }
    }

    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath)
      } catch {
        // bỏ qua
      }
    }
  })

  const callRoute = (token: string) =>
    downloadRoute(new Request(`http://localhost/api/download/${token}`), {
      params: Promise.resolve({ token }),
    })

  const loginAs = (customer: Customer | null) =>
    vi.spyOn(sessionServer, 'getCurrentCustomer').mockResolvedValue(customer)

  it('khách A không thấy đơn của khách B và ngược lại', async () => {
    const ordersA = await getCustomerOrders(customerAId, { payload })
    const ordersB = await getCustomerOrders(customerBId, { payload })

    expect(ordersA).toHaveLength(3)
    expect(ordersB).toHaveLength(1)
    expect(ordersB.map((o) => o.rawTotal)).toEqual([250000])

    expect(await getCustomerOrders(0, { payload })).toEqual([])
    expect(await getCustomerOrders(-1, { payload })).toEqual([])

    // Khách vừa tạo rồi xóa (không dùng id cứng) -> rỗng
    const temp = await payload.create({
      collection: 'customers',
      data: { email: `tam-${randomUUID().slice(0, 8)}@example.test`, name: 'Học viên Test 03' },
      overrideAccess: true,
    })
    await payload.delete({ collection: 'customers', id: temp.id, overrideAccess: true })
    expect(await getCustomerOrders(temp.id, { payload })).toEqual([])
  })

  it('đơn pending có payToken; không lộ paymentRef, email, khách; id đơn chỉ ở đơn paid có file', async () => {
    const ordersA = await getCustomerOrders(customerAId, { payload })

    const pendingOrder = ordersA.find((o) => o.paymentStatus === 'pending')
    expect(pendingOrder!.payToken).toEqual(expect.any(String))
    expect(pendingOrder!.orderId).toBeUndefined()

    const cancelledOrder = ordersA.find((o) => o.paymentStatus === 'cancelled')
    expect(cancelledOrder!.payToken).toBeNull()
    expect(cancelledOrder!.orderId).toBeUndefined()

    for (const o of ordersA) {
      const record = o as unknown as Record<string, unknown>
      expect(record.paymentRef).toBeUndefined()
      expect(record.id).toBeUndefined()
      expect(record.customer).toBeUndefined()
      expect(record.email).toBeUndefined()
    }

    const paidWithFile = ordersA.find((o) => o.paymentStatus === 'paid')
    expect(paidWithFile!.orderId).toBe(orderA2Id)
    expect(paidWithFile!.downloadFiles).toEqual([
      expect.objectContaining({ fileId: privateFileId }),
    ])
  })

  it('đơn paid nhưng sản phẩm không có file -> không có downloadFiles', async () => {
    const paidNoFileOrder = await payload.create({
      collection: 'orders',
      data: {
        customer: customerAId,
        items: [{ product: productWithoutFileId, price: 1750000 }],
        subtotal: 1750000,
        total: 1750000,
        paymentStatus: 'paid',
        paidAt: new Date().toISOString(),
      },
      context: { paymentAction: true },
      overrideAccess: true,
    })
    createdOrders.push(paidNoFileOrder.id)

    const ordersA = await getCustomerOrders(customerAId, { payload })
    const matched = ordersA.find(
      (o) => o.paymentStatus === 'paid' && o.productName.includes('Gói Đồng Hành'),
    )
    expect(matched!.downloadFiles).toBeUndefined()
    expect(matched!.orderId).toBeUndefined()
  })

  it('chủ đơn bấm Tải lại -> nhận link, route trả file sản phẩm trả phí', async () => {
    loginAs(customerA)
    const res = await requestOrderFileDownloadAction({ orderId: orderA2Id, fileId: privateFileId })
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.url).toMatch(/^\/api\/download\//)

    const download = await callRoute(res.url.replace('/api/download/', ''))
    expect(download.status).toBe(200)
    expect(download.headers.get('Cache-Control')).toContain('no-store')
    const body = Buffer.from(await download.arrayBuffer()).toString('utf8')
    expect(body).toContain('%PDF')
  })

  it('action từ chối: chưa đăng nhập, đơn của khách khác, đơn pending, file không thuộc sản phẩm', async () => {
    loginAs(null)
    expect(
      (await requestOrderFileDownloadAction({ orderId: orderA2Id, fileId: privateFileId })).ok,
    ).toBe(false)

    loginAs(customerA)
    expect(
      (await requestOrderFileDownloadAction({ orderId: orderB1Id, fileId: privateFileId })).ok,
    ).toBe(false)
    expect(
      (await requestOrderFileDownloadAction({ orderId: orderA1Id, fileId: privateFileId })).ok,
    ).toBe(false)
    expect(
      (await requestOrderFileDownloadAction({ orderId: orderA2Id, fileId: privateFileId + 999999 }))
        .ok,
    ).toBe(false)
    expect((await requestOrderFileDownloadAction({ orderId: 'x', fileId: privateFileId })).ok).toBe(
      false,
    )
  })

  it('route: người khác cầm link -> 403; chưa đăng nhập -> 403; hết hạn -> 410', async () => {
    const token = signDownloadToken({
      productId: productWithFileId,
      fileId: privateFileId,
      orderId: orderA2Id,
      customerId: customerAId,
      expiresAt: Date.now() + 10 * 60 * 1000,
    })

    loginAs(customerB)
    expect((await callRoute(token)).status).toBe(403)

    loginAs(null)
    expect((await callRoute(token)).status).toBe(403)

    const expired = signDownloadToken({
      productId: productWithFileId,
      fileId: privateFileId,
      orderId: orderA2Id,
      customerId: customerAId,
      expiresAt: Date.now() - 1000,
    })
    loginAs(customerA)
    expect((await callRoute(expired)).status).toBe(410)

    // Token gắn đơn của khách B nhưng khách B đăng nhập với đơn A -> không khớp đơn -> 404
    const mismatched = signDownloadToken({
      productId: productWithFileId,
      fileId: privateFileId,
      orderId: orderA2Id,
      customerId: customerBId,
      expiresAt: Date.now() + 60_000,
    })
    loginAs(customerB)
    expect((await callRoute(mismatched)).status).toBe(404)
  })

  it('tên file có dấu tiếng Việt không làm route lỗi 500', async () => {
    const viName = `Tài-liệu-đọc-${randomUUID().slice(0, 6)}.pdf`
    const viPath = path.resolve(os.tmpdir(), viName)
    fs.writeFileSync(
      viPath,
      Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\nstartxref\n9\n%%EOF\n'),
    )
    const viFile = await payload.create({
      collection: 'privateFiles',
      data: { description: 'Tài liệu test tên có dấu' },
      filePath: viPath,
      overrideAccess: true,
    })
    createdPrivateFiles.push(viFile.id)
    fs.unlinkSync(viPath)
    expect(viFile.filename).toMatch(/[^\x00-\x7f]/)
    const freeVi = await payload.create({
      collection: 'products',
      data: {
        name: 'Toolkit Tiếng Việt Test',
        slug: `toolkit-vi-test-${randomUUID().slice(0, 8)}`,
        web: 'site',
        type: 'toolkit',
        saleStatus: 'free',
        files: [{ file: viFile.id }],
        _status: 'published',
      },
      overrideAccess: true,
    })
    createdProducts.push(freeVi.id)
    loginAs(null)
    const res = await callRoute(signDownloadToken({ productId: freeVi.id, fileId: viFile.id }))
    expect(res.status).toBe(200)
  })

  it('link tài nguyên miễn phí cũ (không gắn đơn) vẫn tải được; link không gắn đơn cho đồ trả phí -> 410', async () => {
    loginAs(null)
    const freeToken = signDownloadToken({ productId: freeProductId, fileId: privateFileId })
    expect((await callRoute(freeToken)).status).toBe(200)

    const paidWithoutOrder = signDownloadToken({
      productId: productWithFileId,
      fileId: privateFileId,
    })
    expect((await callRoute(paidWithoutOrder)).status).toBe(410)
  })
})
