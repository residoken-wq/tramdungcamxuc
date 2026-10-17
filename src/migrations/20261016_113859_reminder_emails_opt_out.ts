import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE IF EXISTS "customers" ADD COLUMN IF NOT EXISTS "reminder_emails_opt_out" boolean DEFAULT false;`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE IF EXISTS "customers" DROP COLUMN IF EXISTS "reminder_emails_opt_out";`)
}
