// Enforce UTC timezone before anything else loads, matching CI and Vercel environments.
process.env.TZ = 'UTC'
process.env.PGTZ = 'UTC'

// Load .env before payload.config reads PAYLOAD_SECRET (globalSetup runs before setupFiles).
import 'dotenv/config'
import { getPayload } from 'payload'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import config from '../../src/payload.config'
import { migrations } from '../../src/migrations'

// Migrate once before any test file runs. Several files use the Local API against the
// same database; letting each migrate a fresh DB in parallel races on CREATE TABLE.
export async function setup() {
  const payload = await getPayload({ config })
  try {
    // 08/11: a database once run with `pnpm dev` (schema push) has a payload-migrations row with
    // batch -1. Payload then asks "you've run Payload in dev mode … proceed?" and waits for a key
    // press forever (check:fast hung for an hour on PK-30). Fail fast with a clear message.
    const devPushed = await payload
      .find({ collection: 'payload-migrations', where: { batch: { equals: -1 } }, limit: 1 })
      .then((r) => r.totalDocs > 0)
      .catch(() => false) // no migrations table yet: a fresh database
    if (devPushed) {
      throw new Error(
        'DB unit test đã từng chạy `pnpm dev` (dev mode push), migration sẽ dừng chờ hỏi. ' +
          'Dùng DB riêng cho test: tạo DB trống rồi chạy với DATABASE_URI trỏ vào DB đó ' +
          '(xem docs/tasks/QUY_TRINH_TEST.md, mục DB test riêng).',
      )
    }
    await payload.db.migrate({
      migrations: migrations.map((migration) => ({
        name: migration.name,
        up: (args: unknown) => migration.up(args as MigrateUpArgs),
        down: (args: unknown) => migration.down(args as MigrateDownArgs),
      })),
    })
  } finally {
    const pool = payload.db.pool
    await payload.destroy()
    await closePool(pool)
  }
}

// Payload's Postgres adapter checks out one pool client on connect and never releases it,
// and payload.destroy() does not end the pool. That open socket keeps the Vitest main
// process alive after the run: Linux exits only after Vitest's 10s close timeout, Windows
// hangs forever after "Tests closed successfully but something prevents the main process
// from exiting". End the pool (closes idle clients) and the leaked client directly.
// pool.end() is not awaited: it only settles once the leaked client is released, which
// never happens, and awaiting a promise that never settles lets Node exit mid-setup.
type PayloadPool = Awaited<ReturnType<typeof getPayload>>['db']['pool']
type PoolWithClients = PayloadPool & { _clients?: Array<{ end: () => Promise<void> }> }

async function closePool(pool: PayloadPool | undefined) {
  if (!pool) return
  const clients = [...((pool as PoolWithClients)._clients ?? [])]
  pool.end().catch(() => undefined)
  await Promise.all(clients.map((client) => client.end().catch(() => undefined)))
}
