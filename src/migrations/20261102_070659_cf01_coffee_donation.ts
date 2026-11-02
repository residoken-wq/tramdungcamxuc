import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_products_icon" ADD VALUE 'check';
  ALTER TYPE "public"."enum_products_icon" ADD VALUE 'arrow-right';
  ALTER TYPE "public"."enum_products_icon" ADD VALUE 'phone';
  ALTER TYPE "public"."enum_products_icon" ADD VALUE 'email';
  ALTER TYPE "public"."enum_products_icon" ADD VALUE 'location';
  ALTER TYPE "public"."enum_products_icon" ADD VALUE 'clock';
  ALTER TYPE "public"."enum_products_icon" ADD VALUE 'calendar';
  ALTER TYPE "public"."enum_products_icon" ADD VALUE 'user';
  ALTER TYPE "public"."enum__products_v_version_icon" ADD VALUE 'check';
  ALTER TYPE "public"."enum__products_v_version_icon" ADD VALUE 'arrow-right';
  ALTER TYPE "public"."enum__products_v_version_icon" ADD VALUE 'phone';
  ALTER TYPE "public"."enum__products_v_version_icon" ADD VALUE 'email';
  ALTER TYPE "public"."enum__products_v_version_icon" ADD VALUE 'location';
  ALTER TYPE "public"."enum__products_v_version_icon" ADD VALUE 'clock';
  ALTER TYPE "public"."enum__products_v_version_icon" ADD VALUE 'calendar';
  ALTER TYPE "public"."enum__products_v_version_icon" ADD VALUE 'user';
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
  
  ALTER TABLE "products" ALTER COLUMN "icon" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum_products_icon";
  CREATE TYPE "public"."enum_products_icon" AS ENUM('target', 'layers', 'star', 'heart', 'butterfly', 'leaf', 'valve', 'compass', 'mask', 'signpost', 'team', 'chat', 'book', 'spark', 'shield', 'mirror');
  ALTER TABLE "products" ALTER COLUMN "icon" SET DATA TYPE "public"."enum_products_icon" USING "icon"::"public"."enum_products_icon";
  ALTER TABLE "_products_v" ALTER COLUMN "version_icon" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum__products_v_version_icon";
  CREATE TYPE "public"."enum__products_v_version_icon" AS ENUM('target', 'layers', 'star', 'heart', 'butterfly', 'leaf', 'valve', 'compass', 'mask', 'signpost', 'team', 'chat', 'book', 'spark', 'shield', 'mirror');
  ALTER TABLE "_products_v" ALTER COLUMN "version_icon" SET DATA TYPE "public"."enum__products_v_version_icon" USING "version_icon"::"public"."enum__products_v_version_icon";
  DROP INDEX IF EXISTS "site_settings_coffee_donation_coffee_donation_qr_image_idx";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "coffee_donation_enabled";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "coffee_donation_qr_image_id";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "coffee_donation_title";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "coffee_donation_message";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "coffee_donation_momo_url";`)
}
