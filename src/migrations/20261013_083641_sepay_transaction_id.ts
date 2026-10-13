import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payment_events" ADD COLUMN IF NOT EXISTS "transaction_id" varchar;
  CREATE UNIQUE INDEX IF NOT EXISTS "payment_events_transaction_id_idx" ON "payment_events" USING btree ("transaction_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "payment_events_transaction_id_idx";
  ALTER TABLE "payment_events" DROP COLUMN IF EXISTS "transaction_id";`)
}

