import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "coffee_donation_enabled" boolean DEFAULT false;
  ALTER TABLE "site_settings" ADD COLUMN "coffee_donation_qr_image_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "coffee_donation_title" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "coffee_donation_message" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "coffee_donation_momo_url" varchar;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_coffee_donation_qr_image_id_media_id_fk" FOREIGN KEY ("coffee_donation_qr_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "site_settings_coffee_donation_coffee_donation_qr_image_idx" ON "site_settings" USING btree ("coffee_donation_qr_image_id");`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP CONSTRAINT IF EXISTS "site_settings_coffee_donation_qr_image_id_media_id_fk";
  
  DROP INDEX IF EXISTS "site_settings_coffee_donation_coffee_donation_qr_image_idx";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "coffee_donation_enabled";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "coffee_donation_qr_image_id";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "coffee_donation_title";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "coffee_donation_message";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "coffee_donation_momo_url";`)
}
