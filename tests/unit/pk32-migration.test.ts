// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import config from '@/payload.config'
import {
  up as migrationUp,
  down as migrationDown,
} from '@/migrations/20261108_092111_pk32_site_settings_tiktok'

describe('PK-32: Migration tiktok_url on site_settings', () => {
  it('adds column tiktok_url on up and removes on down', async () => {
    const payload = await getPayload({ config })
    const db = (payload.db as any).drizzle
    const args = { db, payload, req: {} } as any

    const checkColumn = async (): Promise<boolean> => {
      const res = await db.execute(sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'site_settings' AND column_name = 'tiktok_url';
      `)
      const rows = res.rows ?? res
      return Array.isArray(rows) && rows.length > 0
    }

    // Since migrations run at startup, tiktok_url should exist
    const initialExists = await checkColumn()
    expect(initialExists).toBe(true)

    // Run down()
    await migrationDown(args)
    const existsAfterDown = await checkColumn()
    expect(existsAfterDown).toBe(false)

    // Run up()
    await migrationUp(args)
    const existsAfterUp = await checkColumn()
    expect(existsAfterUp).toBe(true)
  })
})

