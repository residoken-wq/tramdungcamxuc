// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '../../src/payload.config'
import { migrations } from '../../src/migrations'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { buildSampleReport } from '../../seed/sample-report-lib'

// Creates its own throwaway products and deletes them afterwards; reads nothing else by id.
describe('Sample data report (GO-01)', () => {
  let payload: Payload
  const marker = randomUUID().slice(0, 8)
  const createdIds: number[] = []

  beforeAll(async () => {
    payload = await getPayload({ config })
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
    for (const id of createdIds) {
      await payload.delete({ collection: 'products', id, overrideAccess: true }).catch(() => {})
    }
  })

  async function createProduct(name: string, isSample: boolean): Promise<number> {
    const doc = await payload.create({
      collection: 'products',
      data: {
        name,
        slug: `sample-report-${createdIds.length}-${marker}`,
        type: 'ebook',
        web: 'site',
        isSample,
      },
      draft: true,
      overrideAccess: true,
    })
    createdIds.push(doc.id)
    return doc.id
  }

  it('lists sample records, flags leftover [MẪU] text and skips real records, without changing data', async () => {
    const sampleId = await createProduct(`[MẪU] Sách thử ${marker}`, true)
    const editedSampleId = await createProduct(`Sách đã sửa ${marker}`, true)
    const realId = await createProduct(`Sách thật ${marker}`, false)

    const report = await buildSampleReport(payload)
    const productRows = report.rows.filter((row) => row.collection === 'products')

    expect(productRows).toContainEqual(
      expect.objectContaining({ id: sampleId, hasSampleText: true, status: 'draft' }),
    )
    expect(productRows).toContainEqual(
      expect.objectContaining({ id: editedSampleId, hasSampleText: false }),
    )
    expect(productRows.some((row) => row.id === realId)).toBe(false)
    expect(
      report.summary.find((row) => row.collection === 'products')?.sample,
    ).toBeGreaterThanOrEqual(2)

    // Read-only: all three products still exist.
    for (const id of [sampleId, editedSampleId, realId]) {
      const doc = await payload.findByID({
        collection: 'products',
        id,
        draft: true,
        overrideAccess: true,
      })
      expect(doc.id).toBe(id)
    }
  })
})
