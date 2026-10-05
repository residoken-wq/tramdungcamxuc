// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPayload, ValidationError, type CollectionSlug, type Payload } from 'payload'
import config from '../../src/payload.config'
import { migrations } from '../../src/migrations'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

describe('content collections with PostgreSQL', () => {
  let payload: Payload
  const created: { collection: CollectionSlug; id: number }[] = []
  const unique = () => randomUUID()
  const track = (collection: CollectionSlug, doc: { id: number }) => {
    created.push({ collection, id: doc.id })
    return doc.id
  }

  beforeAll(async () => {
    payload = await getPayload({ config })
    // CI runs unit tests before its migration step. Apply checked-in migrations only.
    await payload.db.migrate({
      migrations: migrations.map((migration) => ({
        name: migration.name,
        up: (args: unknown) => migration.up(args as MigrateUpArgs),
        down: (args: unknown) => migration.down(args as MigrateDownArgs),
      })),
    })
  }, 60000)

  afterAll(async () => {
    if (!payload) return
    try {
      for (const entry of created.reverse()) await payload.delete(entry)
    } finally {
      await payload.destroy()
    }
  }, 30000)

  it('overwrites submitted package totals and recalculates partial updates', async () => {
    const product = await payload.create({
      collection: 'products',
      data: {
        name: '[MẪU] Gói kiểm thử',
        slug: unique(),
        web: 'site',
        type: 'package',
        saleStatus: 'consult',
        price: 1750000,
        components: [
          { label: 'Công cụ số', quantity: 2, unitValue: 250000 },
          { label: 'Workshop', quantity: 2, unitValue: 500000 },
          { label: 'Đồng hành', quantity: 1, unitValue: 1000000, retailPrice: 2200000 },
        ],
        totalValue: 1,
        discountPercent: 99,
        isSample: true,
        _status: 'published',
      },
    })
    track('products', product)
    expect(product).toMatchObject({ totalValue: 2500000, discountPercent: 30 })
    const updated = await payload.update({
      collection: 'products',
      id: product.id,
      data: { salePrice: 1250000, totalValue: 1, discountPercent: 99 },
    })
    expect(updated).toMatchObject({ totalValue: 2500000, discountPercent: 50 })
    const cleared = await payload.update({
      collection: 'products',
      id: product.id,
      data: { salePrice: null, components: [] },
    })
    expect(cleared).toMatchObject({ totalValue: 0, discountPercent: null })
  })

  it('locks printed QR slugs, including attempts to clear the print date', async () => {
    const card = await payload.create({
      collection: 'eqCards',
      data: {
        code: unique(),
        qrSlug: unique(),
        isSample: true,
        _status: 'published',
      },
    })
    track('eqCards', card)
    const qrSlug = unique()
    await payload.update({ collection: 'eqCards', id: card.id, data: { qrSlug } })
    await payload.update({
      collection: 'eqCards',
      id: card.id,
      data: { printedAt: '2026-10-05T00:00:00.000Z' },
    })
    for (const data of [
      { qrSlug: unique() },
      { printedAt: null },
      { printedAt: null, qrSlug: unique() },
    ]) {
      await expect(
        payload.update({ collection: 'eqCards', id: card.id, data }),
      ).rejects.toMatchObject({
        data: { errors: [{ message: 'Thẻ đã in, không được đổi mã QR' }] },
      })
    }
    const updated = await payload.update({
      collection: 'eqCards',
      id: card.id,
      data: { message: '[MẪU] Thông điệp kiểm thử', qrSlug },
    })
    expect(updated.qrSlug).toBe(qrSlug)
  })

  it('blocks publication without consent and allows a draft without consent', async () => {
    const testimonial = await payload.create({
      collection: 'testimonials',
      draft: true,
      data: { name: '[MẪU] Kiểm thử đồng ý', consent: false, isSample: true },
    })
    track('testimonials', testimonial)
    await expect(
      payload.update({
        collection: 'testimonials',
        id: testimonial.id,
        data: { _status: 'published' },
      }),
    ).rejects.toMatchObject({
      data: {
        errors: [{ path: 'consent', message: 'Cần có sự đồng ý trước khi xuất bản lời chia sẻ.' }],
      },
    })
    const published = await payload.update({
      collection: 'testimonials',
      id: testimonial.id,
      data: { _status: 'published', consent: true },
    })
    expect(published._status).toBe('published')
    await expect(
      payload.update({ collection: 'testimonials', id: testimonial.id, data: { consent: false } }),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('rejects an uploaded image without alt, including whitespace-only alt', async () => {
    // A real 1x1 PNG exercises upload validation without fixture files on disk.
    const data = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aH9sAAAAASUVORK5CYII=',
      'base64',
    )
    for (const alt of ['', '   ']) {
      await expect(
        payload.create({
          collection: 'media',
          data: { alt, isSample: true },
          file: { data, mimetype: 'image/png', name: `test-${unique()}.png`, size: data.length },
        }),
      ).rejects.toMatchObject({
        data: { errors: [{ path: 'alt', message: 'Vui lòng nhập mô tả ảnh hoặc tài liệu.' }] },
      })
    }
  })

  it('keeps page drafts private and preserves the published revision', async () => {
    const page = await payload.create({
      collection: 'pages',
      data: {
        title: '[MẪU] Bản công khai',
        slug: `/${unique()}`,
        isSample: true,
        puckData: { content: [] },
        _status: 'published',
      },
    })
    track('pages', page)
    await payload.update({
      collection: 'pages',
      id: page.id,
      draft: true,
      data: { title: '[MẪU] Bản nháp', _status: 'draft' },
    })
    const publicPage = await payload.findByID({
      collection: 'pages',
      id: page.id,
      overrideAccess: false,
    })
    expect(publicPage.title).toBe('[MẪU] Bản công khai')
    const draft = await payload.create({
      collection: 'pages',
      draft: true,
      data: { title: '[MẪU] Chưa xuất bản', slug: `/${unique()}`, isSample: true },
    })
    track('pages', draft)
    const publicResults = await payload.find({
      collection: 'pages',
      overrideAccess: false,
      where: { id: { equals: draft.id } },
    })
    expect(publicResults.docs).toEqual([])
    await expect(
      payload.create({
        collection: 'pages',
        overrideAccess: false,
        data: { title: '[MẪU] Không được phép', slug: `/${unique()}` },
      }),
    ).rejects.toThrow()
  })
})
