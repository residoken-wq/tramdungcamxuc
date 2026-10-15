// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))

import { randomUUID } from 'node:crypto'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import * as savedActions from '../../src/lib/eq/saved-actions'
import {
  saveEqCardCore,
  deleteSavedCardCore,
  getCustomerSavedCards,
  getSavedCardStatus,
} from '../../src/lib/eq/saved.server'
import { deleteCustomerData } from '../../src/lib/account/delete-customer.server'
import type { Customer, EqCard, User } from '../../src/payload-types'

describe('EQ Buddy Saved Cards & Reflection (T3-04)', () => {
  let payload: Payload

  const createdCardIds: (number | string)[] = []
  const createdCustomerIds: number[] = []
  const createdUserIds: (number | string)[] = []
  const createdSavedCardIds: (number | string)[] = []

  let cardPublished: EqCard
  let cardDraft: EqCard
  let customerA: Customer
  let customerB: Customer
  let editorUser: User
  let ownerUser: User

  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    const suffix = randomUUID().slice(0, 8)

    // 1. Tạo thẻ đã xuất bản và thẻ nháp
    const pubCardDoc = await payload.create({
      collection: 'eqCards',
      data: {
        code: `EQ-TEST-PUB-${suffix}`,
        keywordEn: `Courage ${suffix}`,
        qrSlug: `test-pub-${suffix}`,
        message: 'Dừng lại một nhịp, lắng nghe chính mình trong tĩnh lặng',
        promptRecall: 'Câu hỏi gợi nhớ thử nghiệm',
        promptPack: 'Câu hỏi gói ghém thử nghiệm',
        promptAcknowledge: 'Câu hỏi ghi nhận thử nghiệm',
        order: 9500,
        _status: 'published',
      },
      overrideAccess: true,
    })
    cardPublished = pubCardDoc
    createdCardIds.push(pubCardDoc.id)

    const draftCardDoc = await payload.create({
      collection: 'eqCards',
      data: {
        code: `EQ-TEST-DRAFT-${suffix}`,
        keywordEn: `Draft ${suffix}`,
        qrSlug: `test-draft-${suffix}`,
        message: 'Thẻ nháp thử nghiệm',
        promptRecall: 'Gợi nhớ nháp',
        promptPack: 'Gói ghém nháp',
        promptAcknowledge: 'Ghi nhận nháp',
        order: 9501,
        _status: 'draft',
      },
      overrideAccess: true,
    })
    cardDraft = draftCardDoc
    createdCardIds.push(draftCardDoc.id)

    // 2. Tạo Khách A và Khách B
    const custADoc = await payload.create({
      collection: 'customers',
      data: {
        name: '[TEST] Khách A',
        email: `customer-a-${suffix}@example.test`,
        consentAt: new Date().toISOString(),
      },
      overrideAccess: true,
    })
    customerA = custADoc
    createdCustomerIds.push(custADoc.id)

    const custBDoc = await payload.create({
      collection: 'customers',
      data: {
        name: '[TEST] Khách B',
        email: `customer-b-${suffix}@example.test`,
        consentAt: new Date().toISOString(),
      },
      overrideAccess: true,
    })
    customerB = custBDoc
    createdCustomerIds.push(custBDoc.id)

    // 3. Tạo User Owner trước (nếu là user đầu tiên trong DB thì tự nhận owner)
    const ownerDoc = await payload.create({
      collection: 'users',
      data: {
        email: `owner-${suffix}@example.test`,
        password: `OwnerPass-${suffix}-123`,
        role: 'owner',
      },
      overrideAccess: true,
    })
    ownerUser = ownerDoc
    createdUserIds.push(ownerDoc.id)

    // Tạo User Editor sau (totalDocs > 0 nên giữ vai trò editor)
    const editorDoc = await payload.create({
      collection: 'users',
      data: {
        email: `editor-${suffix}@example.test`,
        password: `EditorPass-${suffix}-123`,
        role: 'editor',
      },
      overrideAccess: true,
    })
    editorUser = editorDoc
    createdUserIds.push(editorDoc.id)
  })

  afterAll(async () => {
    // Dọn dẹp chỉ dữ liệu mình tạo
    for (const id of createdSavedCardIds) {
      try {
        await payload.delete({
          collection: 'savedCards',
          id,
          overrideAccess: true,
        })
      } catch {}
    }

    for (const id of createdCustomerIds) {
      try {
        await payload.delete({
          collection: 'customers',
          id,
          context: { accountDeletion: true },
          overrideAccess: true,
        })
      } catch {}
    }

    for (const id of createdCardIds) {
      try {
        await payload.delete({
          collection: 'eqCards',
          id,
          overrideAccess: true,
        })
      } catch {}
    }

    for (const id of createdUserIds) {
      try {
        await payload.delete({
          collection: 'users',
          id,
          overrideAccess: true,
        })
      } catch {}
    }
  })

  it('1. lưu 2 lần cùng thẻ → 1 bản ghi, reflection cập nhật (upsert theo saveKey)', async () => {
    // Lần 1: Lưu thẻ kèm suy ngẫm ban đầu
    const res1 = await saveEqCardCore(customerA.id, {
      qrSlug: cardPublished.qrSlug!,
      reflection: 'Suy ngẫm lần đầu',
    })
    expect(res1.success).toBe(true)
    expect(res1.savedCardId).toBeDefined()
    if (res1.savedCardId) createdSavedCardIds.push(res1.savedCardId)

    const check1 = await payload.find({
      collection: 'savedCards',
      where: {
        and: [{ customer: { equals: customerA.id } }, { card: { equals: cardPublished.id } }],
      },
      overrideAccess: true,
    })
    expect(check1.docs.length).toBe(1)
    expect(check1.docs[0].reflection).toBe('Suy ngẫm lần đầu')
    expect(check1.docs[0].saveKey).toBe(`${customerA.id}:${cardPublished.id}`)

    // Lần 2: Lưu lại cùng thẻ nhưng cập nhật suy ngẫm
    const res2 = await saveEqCardCore(customerA.id, {
      qrSlug: cardPublished.qrSlug!,
      reflection: '  Suy ngẫm đã cập nhật và được trim  ',
    })
    expect(res2.success).toBe(true)
    expect(res2.savedCardId).toBe(res1.savedCardId)

    const check2 = await payload.find({
      collection: 'savedCards',
      where: {
        and: [{ customer: { equals: customerA.id } }, { card: { equals: cardPublished.id } }],
      },
      overrideAccess: true,
    })
    // Vẫn duy nhất 1 bản ghi, suy ngẫm đã được cập nhật và trim
    expect(check2.docs.length).toBe(1)
    expect(check2.docs[0].reflection).toBe('Suy ngẫm đã cập nhật và được trim')

    // getSavedCardStatus trả về đúng trạng thái
    const status = await getSavedCardStatus(customerA.id, cardPublished.qrSlug!)
    expect(status.isSaved).toBe(true)
    expect(status.reflection).toBe('Suy ngẫm đã cập nhật và được trim')
  })

  it('2. khách A không xóa / đọc được bản của khách B (qua action và qua REST /api/savedCards)', async () => {
    // Khách B lưu thẻ
    const resB = await saveEqCardCore(customerB.id, {
      qrSlug: cardPublished.qrSlug!,
      reflection: 'Suy ngẫm riêng của Khách B',
    })
    expect(resB.success).toBe(true)
    if (resB.savedCardId) createdSavedCardIds.push(resB.savedCardId)

    // Khách A gọi deleteSavedCardCore nhằm xóa bản của khách B -> từ chối
    const deleteAttempt = await deleteSavedCardCore(customerA.id, {
      savedCardId: resB.savedCardId!,
    })
    expect(deleteAttempt.success).toBe(false)
    expect(deleteAttempt.code).toBe('ERROR')

    // Xác minh bản ghi của Khách B vẫn còn nguyên
    const verifyDocB = await payload.findByID({
      collection: 'savedCards',
      id: resB.savedCardId!,
      overrideAccess: true,
    })
    expect(verifyDocB).not.toBeNull()

    // Khách A đọc qua REST (/api/savedCards với user: customerA, overrideAccess: false)
    const userA = { ...customerA, collection: 'customers' as const }
    const restReadA = await payload.find({
      collection: 'savedCards',
      user: userA,
      overrideAccess: false,
    })
    const docIdsA = restReadA.docs.map((d) => d.id)
    expect(docIdsA).not.toContain(resB.savedCardId!)

    // Khách A cố xóa bản ghi của B qua REST -> từ chối
    await expect(
      payload.delete({
        collection: 'savedCards',
        id: resB.savedCardId!,
        user: userA,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('3. editor đọc qua REST không thấy reflection', async () => {
    // Editor truy vấn danh sách thẻ đã lưu qua REST (user: editorUser, overrideAccess: false)
    const editorSession = { ...editorUser, collection: 'users' as const }
    const restEditor = await payload.find({
      collection: 'savedCards',
      user: editorSession,
      overrideAccess: false,
    })

    // Editor có thể thấy bản ghi nhưng trường reflection bị ẩn hoàn toàn (undefined)
    expect(restEditor.docs.length).toBeGreaterThan(0)
    for (const doc of restEditor.docs) {
      expect(doc.reflection).toBeUndefined()
    }
  })

  it('4. thẻ nháp → lỗi', async () => {
    const resDraft = await saveEqCardCore(customerA.id, {
      qrSlug: cardDraft.qrSlug!,
      reflection: 'Thử lưu thẻ nháp',
    })
    expect(resDraft.success).toBe(false)
    expect(resDraft.code).toBe('CARD_NOT_FOUND')
  })

  it('5. chưa đăng nhập → lỗi; trình duyệt gửi kèm id khách khác cũng không giả danh được', async () => {
    const saveNoAuth = await saveEqCardCore(null, {
      qrSlug: cardPublished.qrSlug!,
      reflection: 'Chưa đăng nhập',
    })
    expect(saveNoAuth.success).toBe(false)
    expect(saveNoAuth.code).toBe('UNAUTHENTICATED')

    const deleteNoAuth = await deleteSavedCardCore(null, { savedCardId: 12345 })
    expect(deleteNoAuth.success).toBe(false)
    expect(deleteNoAuth.code).toBe('UNAUTHENTICATED')

    // Server action gọi thẳng (không có phiên) với trường lạ customerIdOverride = id khách B
    const victim = await saveEqCardCore(customerB.id, {
      qrSlug: cardPublished.qrSlug!,
      reflection: 'Suy ngẫm của B – không ai khác được sửa',
    })
    expect(victim.success).toBe(true)
    const forgedSave = await savedActions.saveEqCardAction({
      qrSlug: cardPublished.qrSlug!,
      reflection: 'ghi đè',
      customerIdOverride: customerB.id,
    } as unknown as Parameters<typeof savedActions.saveEqCardAction>[0])
    expect(forgedSave.code).toBe('UNAUTHENTICATED')
    const forgedDelete = await savedActions.deleteSavedCardAction({
      savedCardId: victim.savedCardId!,
      customerIdOverride: customerB.id,
    } as unknown as Parameters<typeof savedActions.deleteSavedCardAction>[0])
    expect(forgedDelete.code).toBe('UNAUTHENTICATED')
    const still = await payload.findByID({
      collection: 'savedCards',
      id: victim.savedCardId!,
      overrideAccess: true,
    })
    expect(still.reflection).toBe('Suy ngẫm của B – không ai khác được sửa')
  })

  it('5b. lưu song song cùng thẻ → 1 bản ghi; lưu lại không kèm suy ngẫm → giữ suy ngẫm cũ', async () => {
    const results = await Promise.all([
      saveEqCardCore(customerB.id, { qrSlug: cardPublished.qrSlug!, reflection: 'song song 1' }),
      saveEqCardCore(customerB.id, { qrSlug: cardPublished.qrSlug!, reflection: 'song song 2' }),
    ])
    expect(results.every((r) => r.success)).toBe(true)
    const rows = await payload.find({
      collection: 'savedCards',
      where: {
        and: [{ customer: { equals: customerB.id } }, { card: { equals: cardPublished.id } }],
      },
      overrideAccess: true,
    })
    expect(rows.totalDocs).toBe(1)
    const kept = rows.docs[0]!.reflection

    const again = await saveEqCardCore(customerB.id, { qrSlug: cardPublished.qrSlug! })
    expect(again.success).toBe(true)
    const after = await payload.findByID({
      collection: 'savedCards',
      id: rows.docs[0]!.id,
      overrideAccess: true,
    })
    expect(after.reflection).toBe(kept)
  })

  it('6. file action chỉ export hàm bọc duy nhất', () => {
    const exportedKeys = Object.keys(savedActions).sort()
    expect(exportedKeys).toEqual(['deleteSavedCardAction', 'saveEqCardAction'])
    expect(typeof savedActions.saveEqCardAction).toBe('function')
    expect(typeof savedActions.deleteSavedCardAction).toBe('function')
  })

  it('7. xóa tài khoản (T2-16) xóa luôn thẻ đã lưu', async () => {
    const suffix = randomUUID().slice(0, 8)
    const custC = await payload.create({
      collection: 'customers',
      data: {
        name: '[TEST] Khách C để xóa',
        email: `customer-c-${suffix}@example.test`,
        consentAt: new Date().toISOString(),
      },
      overrideAccess: true,
    })
    createdCustomerIds.push(custC.id)

    // Khách C lưu thẻ
    const saveC = await saveEqCardCore(custC.id, {
      qrSlug: cardPublished.qrSlug!,
      reflection: 'Ghi chú của C',
    })
    expect(saveC.success).toBe(true)
    if (saveC.savedCardId) createdSavedCardIds.push(saveC.savedCardId)

    // Xác nhận đã có thẻ trong DB
    const beforeCheck = await payload.find({
      collection: 'savedCards',
      where: { customer: { equals: custC.id } },
      overrideAccess: true,
    })
    expect(beforeCheck.docs.length).toBe(1)

    // Thực hiện xóa tài khoản Khách C theo quy trình T2-16
    const deleteRes = await deleteCustomerData(payload, {
      customerId: custC.id,
      confirmationEmail: custC.email,
      actorUserId: ownerUser.id,
    })
    expect(deleteRes.success).toBe(true)

    // Xác minh thẻ đã lưu của Khách C đã bị xóa hoàn toàn khỏi DB
    const afterCheck = await payload.find({
      collection: 'savedCards',
      where: { customer: { equals: custC.id } },
      overrideAccess: true,
    })
    expect(afterCheck.docs.length).toBe(0)
  })

  it('8. getCustomerSavedCards trả về danh sách đã format đúng cho khách', async () => {
    const items = await getCustomerSavedCards(customerA.id)
    expect(items.length).toBeGreaterThan(0)
    const item = items.find((i) => i.code === cardPublished.code)
    expect(item).toBeDefined()
    expect(item?.keywordEn).toBe(cardPublished.keywordEn)
    expect(item?.message).toBe(cardPublished.message)
    expect(item?.qrSlug).toBe(cardPublished.qrSlug)
    expect(item?.reflection).toBe('Suy ngẫm đã cập nhật và được trim')
  })
})
