import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// REVIEW-REQUIRED: Migration bổ sung các trường tiêu đề và câu trích bước 1-5 vào habit_journey_content (DP-02d)
export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step1_title" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step1_quote_text" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step1_quote_author" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step1_survey_title" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step1_survey_desc" varchar;

    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step3_title" varchar;

    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step4_title" varchar;

    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step5_title" varchar;
  `)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step1_title";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step1_quote_text";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step1_quote_author";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step1_survey_title";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step1_survey_desc";

    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step3_title";

    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step4_title";

    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step5_title";
  `)
}

