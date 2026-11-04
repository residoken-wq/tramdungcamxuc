import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// REVIEW-REQUIRED: Migration thêm các trường chữ nội dung từng màn vào habitJourneyContent (B2 / DP-01d)
export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "header_badge_text" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "header_title_line1" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "header_title_line2" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "header_series_badge" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "header_tagline" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "header_intro_text" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "header_stage1_title" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "header_stage1_desc" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "header_stage2_title" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "header_stage2_desc" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "header_stage3_title" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "header_stage3_desc" varchar;

    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step1_lead_in" varchar;

    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step2_lead_in" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step2_chart_title" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step2_chart_subtitle" varchar;

    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step3_lead_in" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step3_scorecard_title" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step3_scorecard_desc" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step3_mentor_title" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step3_mentor_desc" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step3_empty_mentor_hint" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step3_mentor_time_label" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step3_mentor_success_hint" varchar;

    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step4_lead_in" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step4_statement_title" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step4_statement_desc" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step4_suggested_roles" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step4_rhythm_title" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step4_rhythm_desc" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step4_rhythm_note" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step4_atomic_habit_title" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step4_atomic_habit_desc" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step4_suggested_atomic_habits" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step4_commitment_title" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step4_why_important_label" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step4_why_important_placeholder" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step4_why_important_note" varchar;

    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step5_lead_in" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step5_custom_action_placeholder" varchar;

    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step6_lead_in" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step6_pass_title" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step6_pass_subtitle" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step6_terms_text" varchar;

    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "check_in_post_day_hint" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "check_in_rest_day_hint" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "check_in_note_placeholder" varchar;

    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "footer_slogan" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "footer_author_info" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "footer_book_credits" varchar;
  `)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "header_badge_text";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "header_title_line1";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "header_title_line2";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "header_series_badge";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "header_tagline";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "header_intro_text";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "header_stage1_title";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "header_stage1_desc";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "header_stage2_title";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "header_stage2_desc";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "header_stage3_title";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "header_stage3_desc";

    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step1_lead_in";

    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step2_lead_in";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step2_chart_title";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step2_chart_subtitle";

    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step3_lead_in";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step3_scorecard_title";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step3_scorecard_desc";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step3_mentor_title";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step3_mentor_desc";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step3_empty_mentor_hint";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step3_mentor_time_label";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step3_mentor_success_hint";

    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step4_lead_in";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step4_statement_title";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step4_statement_desc";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step4_suggested_roles";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step4_rhythm_title";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step4_rhythm_desc";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step4_rhythm_note";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step4_atomic_habit_title";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step4_atomic_habit_desc";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step4_suggested_atomic_habits";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step4_commitment_title";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step4_why_important_label";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step4_why_important_placeholder";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step4_why_important_note";

    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step5_lead_in";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step5_custom_action_placeholder";

    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step6_lead_in";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step6_pass_title";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step6_pass_subtitle";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step6_terms_text";

    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "check_in_post_day_hint";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "check_in_rest_day_hint";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "check_in_note_placeholder";

    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "footer_slogan";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "footer_author_info";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "footer_book_credits";
  `)
}
