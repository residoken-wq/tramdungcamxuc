import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_design_system_title_spacing_title_line_height" AS ENUM('normal', 'airy', 'very-airy');
  CREATE TYPE "public"."enum_design_system_title_spacing_eyebrow_gap" AS ENUM('tight', 'normal', 'airy');
  CREATE TYPE "public"."enum_design_system_title_spacing_emotion_gap" AS ENUM('tight', 'normal', 'airy');
  ALTER TABLE "design_system" ADD COLUMN "title_spacing_title_line_height" "enum_design_system_title_spacing_title_line_height" DEFAULT 'normal' NOT NULL;
  ALTER TABLE "design_system" ADD COLUMN "title_spacing_eyebrow_gap" "enum_design_system_title_spacing_eyebrow_gap" DEFAULT 'normal' NOT NULL;
  ALTER TABLE "design_system" ADD COLUMN "title_spacing_emotion_gap" "enum_design_system_title_spacing_emotion_gap" DEFAULT 'normal' NOT NULL;`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "design_system" DROP COLUMN IF EXISTS "title_spacing_title_line_height";
  ALTER TABLE "design_system" DROP COLUMN IF EXISTS "title_spacing_eyebrow_gap";
  ALTER TABLE "design_system" DROP COLUMN IF EXISTS "title_spacing_emotion_gap";
  DROP TYPE IF EXISTS "public"."enum_design_system_title_spacing_title_line_height";
  DROP TYPE IF EXISTS "public"."enum_design_system_title_spacing_eyebrow_gap";
  DROP TYPE IF EXISTS "public"."enum_design_system_title_spacing_emotion_gap";`)
}
