// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import config from '@/payload.config'
import {
  up as migrationUp,
  down as migrationDown,
} from '@/migrations/20261116_120000_bx07_youtube_lessons'

describe('BX-07: Migration video_source and youtube_url on lessons', () => {
  it('adds columns on up, removes on down, and defaults old lessons to bunny', async () => {
    const payload = await getPayload({ config })
    const db = (payload.db as any).drizzle
    const args = { db, payload, req: {} } as any

    const checkColumns = async (): Promise<{
      lessonsVideoSource: boolean
      lessonsYoutubeUrl: boolean
      lessonsVVideoSource: boolean
      lessonsVYoutubeUrl: boolean
    }> => {
      const res = await db.execute(sql`
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE (table_name = 'lessons' AND column_name IN ('video_source', 'youtube_url'))
           OR (table_name = '_lessons_v' AND column_name IN ('version_video_source', 'version_youtube_url'));
      `)
      const rows = (res.rows ?? res) as Array<{ table_name: string; column_name: string }>
      return {
        lessonsVideoSource: rows.some(
          (r) => r.table_name === 'lessons' && r.column_name === 'video_source',
        ),
        lessonsYoutubeUrl: rows.some(
          (r) => r.table_name === 'lessons' && r.column_name === 'youtube_url',
        ),
        lessonsVVideoSource: rows.some(
          (r) => r.table_name === '_lessons_v' && r.column_name === 'version_video_source',
        ),
        lessonsVYoutubeUrl: rows.some(
          (r) => r.table_name === '_lessons_v' && r.column_name === 'version_youtube_url',
        ),
      }
    }

    // 1. Initial state (migrations have run)
    const initial = await checkColumns()
    expect(initial.lessonsVideoSource).toBe(true)
    expect(initial.lessonsYoutubeUrl).toBe(true)
    expect(initial.lessonsVVideoSource).toBe(true)
    expect(initial.lessonsVYoutubeUrl).toBe(true)

    // 2. Run down()
    await migrationDown(args)
    const afterDown = await checkColumns()
    expect(afterDown.lessonsVideoSource).toBe(false)
    expect(afterDown.lessonsYoutubeUrl).toBe(false)
    expect(afterDown.lessonsVVideoSource).toBe(false)
    expect(afterDown.lessonsVYoutubeUrl).toBe(false)

    // 3. Run up()
    const start = performance.now()
    await migrationUp(args)
    const durationMs = performance.now() - start
    expect(durationMs).toBeLessThan(10000) // Migration chạy < 10s

    const afterUp = await checkColumns()
    expect(afterUp.lessonsVideoSource).toBe(true)
    expect(afterUp.lessonsYoutubeUrl).toBe(true)
    expect(afterUp.lessonsVVideoSource).toBe(true)
    expect(afterUp.lessonsVYoutubeUrl).toBe(true)

    // 4. Test default 'bunny' for lesson without videoSource specified
    const created = await payload.create({
      collection: 'lessons',
      data: {
        title: 'Bài học kiểm tra migration',
        videoId: 'test-guid',
      },
      overrideAccess: true,
    })

    try {
      expect(created.videoSource).toBe('bunny')
    } finally {
      await payload.delete({
        collection: 'lessons',
        id: created.id,
        overrideAccess: true,
      })
    }
  })
})
