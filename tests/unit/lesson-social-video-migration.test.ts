// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import config from '@/payload.config'
import { up, down } from '@/migrations/20261123_090000_lesson_social_video'

describe('Migration: lessons.social_video_url', () => {
  it('adds the columns on up, removes them on down, and up is safe to re-run', async () => {
    const payload = await getPayload({ config })
    const db = (payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } })
      .drizzle
    const args = { db, payload, req: {} } as never
    const columns = async () => {
      const res = (await db.execute(sql`
        SELECT table_name, column_name FROM information_schema.columns
        WHERE (table_name = 'lessons' AND column_name = 'social_video_url')
           OR (table_name = '_lessons_v' AND column_name = 'version_social_video_url');
      `)) as { rows?: unknown[] } | unknown[]
      return (Array.isArray(res) ? res : (res.rows ?? [])).length
    }
    expect(await columns()).toBe(2)
    await down(args)
    expect(await columns()).toBe(0)
    await up(args)
    await up(args)
    expect(await columns()).toBe(2)
  })
})
