import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_kind" AS ENUM('page', 'header', 'footer');
  CREATE TYPE "public"."enum__pages_v_version_kind" AS ENUM('page', 'header', 'footer');
  CREATE TYPE "public"."enum_navigation_header_source" AS ENUM('code', 'builder');
  CREATE TYPE "public"."enum_navigation_footer_source" AS ENUM('code', 'builder');
  ALTER TABLE "pages" ADD COLUMN "kind" "enum_pages_kind" DEFAULT 'page';
  ALTER TABLE "_pages_v" ADD COLUMN "version_kind" "enum__pages_v_version_kind" DEFAULT 'page';
  ALTER TABLE "navigation" ADD COLUMN "header_source" "enum_navigation_header_source" DEFAULT 'code' NOT NULL;
  ALTER TABLE "navigation" ADD COLUMN "header_page_id" integer;
  ALTER TABLE "navigation" ADD COLUMN "footer_source" "enum_navigation_footer_source" DEFAULT 'code' NOT NULL;
  ALTER TABLE "navigation" ADD COLUMN "footer_page_id" integer;
  ALTER TABLE "navigation" ADD CONSTRAINT "navigation_header_page_id_pages_id_fk" FOREIGN KEY ("header_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation" ADD CONSTRAINT "navigation_footer_page_id_pages_id_fk" FOREIGN KEY ("footer_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "navigation_header_page_idx" ON "navigation" USING btree ("header_page_id");
  CREATE INDEX "navigation_footer_page_idx" ON "navigation" USING btree ("footer_page_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "navigation" DROP CONSTRAINT IF EXISTS "navigation_header_page_id_pages_id_fk";
  ALTER TABLE "navigation" DROP CONSTRAINT IF EXISTS "navigation_footer_page_id_pages_id_fk";
  DROP INDEX IF EXISTS "navigation_header_page_idx";
  DROP INDEX IF EXISTS "navigation_footer_page_idx";
  ALTER TABLE "pages" DROP COLUMN IF EXISTS "kind";
  ALTER TABLE "_pages_v" DROP COLUMN IF EXISTS "version_kind";
  ALTER TABLE "navigation" DROP COLUMN IF EXISTS "header_source";
  ALTER TABLE "navigation" DROP COLUMN IF EXISTS "header_page_id";
  ALTER TABLE "navigation" DROP COLUMN IF EXISTS "footer_source";
  ALTER TABLE "navigation" DROP COLUMN IF EXISTS "footer_page_id";
  DROP TYPE IF EXISTS "public"."enum_pages_kind";
  DROP TYPE IF EXISTS "public"."enum__pages_v_version_kind";
  DROP TYPE IF EXISTS "public"."enum_navigation_header_source";
  DROP TYPE IF EXISTS "public"."enum_navigation_footer_source";`)
}
