import { describe, expect, it } from 'vitest'
import { toPublicSiteSettings } from '@/lib/site-public'

describe('toPublicSiteSettings DTO extraction & Anti-data-leak', () => {
  it('extracts public social and external links correctly', () => {
    const rawDoc = {
      shopeeStoreUrl: 'https://shopee.vn/tramdungcamxuc',
      zaloChatUrl: 'https://zalo.me/0901234567',
      zaloGroupUrl: 'https://zalo.me/g/community123',
    }

    const result = toPublicSiteSettings(rawDoc)

    expect(result).toEqual({
      shopeeStoreUrl: 'https://shopee.vn/tramdungcamxuc',
      zaloChatUrl: 'https://zalo.me/0901234567',
      zaloGroupUrl: 'https://zalo.me/g/community123',
    })
  })

  it('strictly strips sensitive banking information and private seller/admin emails', () => {
    const rawDocWithSensitiveFields = {
      shopeeStoreUrl: 'https://shopee.vn/shop',
      zaloChatUrl: 'https://zalo.me/chat',
      zaloGroupUrl: null,
      // SENSITIVE BANKING FIELDS
      bankBin: '970422',
      bankName: 'MB Bank',
      accountNumber: '0987654321',
      accountName: 'LUONG THI HUYEN TRANG',
      transferPrefix: 'TDCX',
      trialCreditApplies: true,
      // SENSITIVE INTERNAL CONTACTS & ADMIN EMAILS
      email: 'admin-private@tramdungcamxuc.com',
      sellerInfo: {
        name: 'Hana Luong Private',
        taxCode: '8888999911',
        email: 'hana-secret@gmail.com',
        phone: '0909999999',
      },
      // SYSTEM FIELDS
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-05T00:00:00.000Z',
    }

    const sanitized = toPublicSiteSettings(rawDocWithSensitiveFields)

    // Should only have 3 keys: shopeeStoreUrl, zaloChatUrl, zaloGroupUrl
    expect(Object.keys(sanitized).sort()).toEqual(
      ['shopeeStoreUrl', 'zaloChatUrl', 'zaloGroupUrl'].sort(),
    )

    // Verify none of the sensitive fields leaked
    const asRecord = sanitized as unknown as Record<string, unknown>
    expect(asRecord.bankBin).toBeUndefined()
    expect(asRecord.accountNumber).toBeUndefined()
    expect(asRecord.accountName).toBeUndefined()
    expect(asRecord.transferPrefix).toBeUndefined()
    expect(asRecord.email).toBeUndefined()
    expect(asRecord.sellerInfo).toBeUndefined()
  })

  it('handles null, non-objects, or empty string values safely', () => {
    expect(toPublicSiteSettings(null)).toEqual({
      shopeeStoreUrl: null,
      zaloChatUrl: null,
      zaloGroupUrl: null,
    })

    expect(toPublicSiteSettings('not-an-object')).toEqual({
      shopeeStoreUrl: null,
      zaloChatUrl: null,
      zaloGroupUrl: null,
    })

    expect(
      toPublicSiteSettings({
        shopeeStoreUrl: '   ',
        zaloChatUrl: '',
        zaloGroupUrl: '  https://zalo.me/g/test  ',
      }),
    ).toEqual({
      shopeeStoreUrl: null,
      zaloChatUrl: null,
      zaloGroupUrl: 'https://zalo.me/g/test',
    })
  })
})
