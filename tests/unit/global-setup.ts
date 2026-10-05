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
    await payload.db.migrate({
      migrations: migrations.map((migration) => ({
        name: migration.name,
        up: (args: unknown) => migration.up(args as MigrateUpArgs),
        down: (args: unknown) => migration.down(args as MigrateDownArgs),
      })),
    })
  } finally {
    await payload.destroy()
  }
}
