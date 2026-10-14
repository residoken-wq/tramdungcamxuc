// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { randomUUID } from 'node:crypto'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import { getCustomerOrders } from '../../src/lib/account/orders.server'
import { verifyDownloadToken } from '../../src/lib/downloads/token'

describe('Customer Account Orders & Downloads (T2-17)', () => {
  let payload: Payload
  let customerAId: number
  let customerBId: number
  let productWithFileId: number
  let productWithoutFileId: number
  let privateFileId: number
  let tempFilePath: string

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

  it('khách A không thấy đơn của khách B và ngược lại', async () => {
    const ordersA = await getCustomerOrders(customerAId, { payload })
    const ordersB = await getCustomerOrders(customerBId, { payload })

    // Khách A có đúng 3 đơn
    expect(ordersA).toHaveLength(3)
    // Khách B có đúng 1 đơn
    expect(ordersB).toHaveLength(1)

    // Khách A không có đơn của khách B
    const bOrderRawTotals = ordersB.map((o) => o.rawTotal)
    expect(bOrderRawTotals).toEqual([250000])

    // Truy vấn với ID không hợp lệ -> trả về rỗng
    expect(await getCustomerOrders(0, { payload })).toEqual([])
    expect(await getCustomerOrders(-1, { payload })).toEqual([])
    expect(await getCustomerOrders(999999, { payload })).toEqual([])
  })

  it('đơn pending có payToken, đơn cancelled không lộ paymentRef và không lộ ID nội bộ', async () => {
    const ordersA = await getCustomerOrders(customerAId, { payload })

    const pendingOrder = ordersA.find((o) => o.paymentStatus === 'pending')
    expect(pendingOrder).toBeDefined()
    expect(pendingOrder!.payToken).toBeDefined()
    expect(typeof pendingOrder!.payToken).toBe('string')
    expect(pendingOrder!.payToken!.length).toBeGreaterThan(0)
    // Đơn pending có paymentRef
    expect(pendingOrder!.paymentRef).toBeDefined()

    const cancelledOrder = ordersA.find((o) => o.paymentStatus === 'cancelled')
    expect(cancelledOrder).toBeDefined()
    // Không hiện paymentRef của đơn đã hủy
    expect(cancelledOrder!.paymentRef).toBeNull()
    // Không có payToken cho đơn đã hủy
    expect(cancelledOrder!.payToken).toBeNull()

    // Kiểm tra không lộ id nội bộ hay email/customer
    for (const o of ordersA) {
      const orderRecord = o as unknown as Record<string, unknown>
      expect(orderRecord.id).toBeUndefined()
      expect(orderRecord.customer).toBeUndefined()
      expect(orderRecord.email).toBeUndefined()
    }
  })

  it('link tải chỉ sinh cho đơn paid có file; đơn không có file không sinh link tải', async () => {
    const ordersA = await getCustomerOrders(customerAId, { payload })

    // Đơn A2: paid và sản phẩm có file
    const paidOrderWithFile = ordersA.find(
      (o) => o.paymentStatus === 'paid' && o.productName.includes('Ebook'),
    )
    expect(paidOrderWithFile).toBeDefined()
    expect(paidOrderWithFile!.downloadFiles).toBeDefined()
    expect(paidOrderWithFile!.downloadFiles!.length).toBe(1)

    const downloadItem = paidOrderWithFile!.downloadFiles![0]
    expect(downloadItem.fileId).toBe(privateFileId)
    expect(downloadItem.downloadUrl).toMatch(/^\/api\/download\//)

    // Token hợp lệ khi kiểm tra bằng verifyDownloadToken
    const token = downloadItem.downloadUrl.replace('/api/download/', '')
    const verifyRes = verifyDownloadToken(token)
    expect(verifyRes.valid).toBe(true)
    if (verifyRes.valid) {
      expect(String(verifyRes.payload.fileId)).toBe(String(privateFileId))
      expect(String(verifyRes.payload.productId)).toBe(String(productWithFileId))
    }

    // Đơn pending hoặc cancelled không có link tải
    const pendingOrder = ordersA.find((o) => o.paymentStatus === 'pending')
    expect(pendingOrder!.downloadFiles).toBeUndefined()

    const cancelledOrder = ordersA.find((o) => o.paymentStatus === 'cancelled')
    expect(cancelledOrder!.downloadFiles).toBeUndefined()
  })

  it('đơn paid nhưng sản phẩm không có file -> không sinh downloadFiles', async () => {
    // Tạo thêm 1 đơn paid cho sản phẩm không có file
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

    expect(matched).toBeDefined()
    expect(matched!.downloadFiles).toBeUndefined()
  })
})
