import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// REVIEW-REQUIRED: GL-01 Add google_sub column to customers table and login method flags to site_settings
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "google_sub" varchar;
    CREATE UNIQUE INDEX IF NOT EXISTS "customers_google_sub_idx" ON "customers" USING btree ("google_sub");
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "login_google_enabled" boolean DEFAULT true;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "login_otp_enabled" boolean DEFAULT true;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "customers_google_sub_idx";
    ALTER TABLE "customers" DROP COLUMN IF EXISTS "google_sub";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "login_google_enabled";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "login_otp_enabled";
  `)
}
