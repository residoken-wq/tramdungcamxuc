import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS "trial_usage" ALTER COLUMN "product_id" DROP NOT NULL;
    ALTER TABLE IF EXISTS "customers" ADD COLUMN IF NOT EXISTS "session_version" numeric DEFAULT 0;
  `)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "trial_usage" WHERE "product_id" IS NULL;
    ALTER TABLE IF EXISTS "trial_usage" ALTER COLUMN "product_id" SET NOT NULL;
    ALTER TABLE IF EXISTS "customers" DROP COLUMN IF EXISTS "session_version";
  `)
}
