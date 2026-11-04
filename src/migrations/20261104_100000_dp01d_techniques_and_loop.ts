import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// REVIEW-REQUIRED: Migration thêm trường description, applyTemplate, order, examples vào techniques và luật/cueBox vào habitJourneyContent.loop (B1 / DP-01d)
export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "techniques" ADD COLUMN IF NOT EXISTS "description" varchar;
    ALTER TABLE "techniques" ADD COLUMN IF NOT EXISTS "apply_template" varchar;
    ALTER TABLE "techniques" ADD COLUMN IF NOT EXISTS "order" numeric;
    ALTER TABLE "_techniques_v" ADD COLUMN IF NOT EXISTS "version_description" varchar;
    ALTER TABLE "_techniques_v" ADD COLUMN IF NOT EXISTS "version_apply_template" varchar;
    ALTER TABLE "_techniques_v" ADD COLUMN IF NOT EXISTS "version_order" numeric;

    CREATE TABLE IF NOT EXISTS "techniques_examples" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "text" varchar NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "techniques_examples_order_idx" ON "techniques_examples" ("_order");
    CREATE INDEX IF NOT EXISTS "techniques_examples_parent_id_idx" ON "techniques_examples" ("_parent_id");

    CREATE TABLE IF NOT EXISTS "_techniques_v_version_examples" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "text" varchar NOT NULL,
      "_uuid" varchar
    );
    CREATE INDEX IF NOT EXISTS "_techniques_v_version_examples_order_idx" ON "_techniques_v_version_examples" ("_order");
    CREATE INDEX IF NOT EXISTS "_techniques_v_version_examples_parent_id_idx" ON "_techniques_v_version_examples" ("_parent_id");

    CREATE TABLE IF NOT EXISTS "habit_journey_content_loop_laws" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "stage" varchar NOT NULL,
      "law_chip" varchar,
      "title" varchar NOT NULL,
      "sub_label" varchar,
      "question" varchar,
      "video_url" varchar
    );
    CREATE INDEX IF NOT EXISTS "habit_journey_content_loop_laws_order_idx" ON "habit_journey_content_loop_laws" ("_order");
    CREATE INDEX IF NOT EXISTS "habit_journey_content_loop_laws_parent_id_idx" ON "habit_journey_content_loop_laws" ("_parent_id");

    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "loop_cue_box_bold_text" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "loop_cue_box_text" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "loop_cue_box_button_label" varchar;
  `)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "loop_cue_box_bold_text";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "loop_cue_box_text";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "loop_cue_box_button_label";
    DROP TABLE IF EXISTS "habit_journey_content_loop_laws";
    DROP TABLE IF EXISTS "_techniques_v_version_examples";
    DROP TABLE IF EXISTS "techniques_examples";
    ALTER TABLE "_techniques_v" DROP COLUMN IF EXISTS "version_order";
    ALTER TABLE "_techniques_v" DROP COLUMN IF EXISTS "version_apply_template";
    ALTER TABLE "_techniques_v" DROP COLUMN IF EXISTS "version_description";
    ALTER TABLE "techniques" DROP COLUMN IF EXISTS "order";
    ALTER TABLE "techniques" DROP COLUMN IF EXISTS "apply_template";
    ALTER TABLE "techniques" DROP COLUMN IF EXISTS "description";
  `)
}
