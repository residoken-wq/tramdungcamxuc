import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "habit_coach_booking_url" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "habit_donation_enabled" boolean DEFAULT false;
  ALTER TABLE "site_settings" ADD COLUMN "habit_donation_url" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "one_percent_closing" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "loop_note" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "loop_technique_hint" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "step_quotes_one_percent_text" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "step_quotes_one_percent_author" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "step_quotes_one_percent_source" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "step_quotes_one_percent_source_url" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "step_quotes_mentor_text" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "step_quotes_mentor_author" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "step_quotes_mentor_source" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "step_quotes_mentor_source_url" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "step_quotes_name_text" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "step_quotes_name_author" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "step_quotes_name_source" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "step_quotes_name_source_url" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "step_quotes_loop_text" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "step_quotes_loop_author" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "step_quotes_loop_source" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "step_quotes_loop_source_url" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "step_quotes_boarding_pass_text" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "step_quotes_boarding_pass_author" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "step_quotes_boarding_pass_source" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "step_quotes_boarding_pass_source_url" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "step_quotes_tracker_text" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "step_quotes_tracker_author" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "step_quotes_tracker_source" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "step_quotes_tracker_source_url" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "tracker_after_journey_title" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "tracker_after_journey_text" varchar;`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "habit_coach_booking_url";
  ALTER TABLE "site_settings" DROP COLUMN "habit_donation_enabled";
  ALTER TABLE "site_settings" DROP COLUMN "habit_donation_url";
  ALTER TABLE "habit_journey_content" DROP COLUMN "one_percent_closing";
  ALTER TABLE "habit_journey_content" DROP COLUMN "loop_note";
  ALTER TABLE "habit_journey_content" DROP COLUMN "loop_technique_hint";
  ALTER TABLE "habit_journey_content" DROP COLUMN "step_quotes_one_percent_text";
  ALTER TABLE "habit_journey_content" DROP COLUMN "step_quotes_one_percent_author";
  ALTER TABLE "habit_journey_content" DROP COLUMN "step_quotes_one_percent_source";
  ALTER TABLE "habit_journey_content" DROP COLUMN "step_quotes_one_percent_source_url";
  ALTER TABLE "habit_journey_content" DROP COLUMN "step_quotes_mentor_text";
  ALTER TABLE "habit_journey_content" DROP COLUMN "step_quotes_mentor_author";
  ALTER TABLE "habit_journey_content" DROP COLUMN "step_quotes_mentor_source";
  ALTER TABLE "habit_journey_content" DROP COLUMN "step_quotes_mentor_source_url";
  ALTER TABLE "habit_journey_content" DROP COLUMN "step_quotes_name_text";
  ALTER TABLE "habit_journey_content" DROP COLUMN "step_quotes_name_author";
  ALTER TABLE "habit_journey_content" DROP COLUMN "step_quotes_name_source";
  ALTER TABLE "habit_journey_content" DROP COLUMN "step_quotes_name_source_url";
  ALTER TABLE "habit_journey_content" DROP COLUMN "step_quotes_loop_text";
  ALTER TABLE "habit_journey_content" DROP COLUMN "step_quotes_loop_author";
  ALTER TABLE "habit_journey_content" DROP COLUMN "step_quotes_loop_source";
  ALTER TABLE "habit_journey_content" DROP COLUMN "step_quotes_loop_source_url";
  ALTER TABLE "habit_journey_content" DROP COLUMN "step_quotes_boarding_pass_text";
  ALTER TABLE "habit_journey_content" DROP COLUMN "step_quotes_boarding_pass_author";
  ALTER TABLE "habit_journey_content" DROP COLUMN "step_quotes_boarding_pass_source";
  ALTER TABLE "habit_journey_content" DROP COLUMN "step_quotes_boarding_pass_source_url";
  ALTER TABLE "habit_journey_content" DROP COLUMN "step_quotes_tracker_text";
  ALTER TABLE "habit_journey_content" DROP COLUMN "step_quotes_tracker_author";
  ALTER TABLE "habit_journey_content" DROP COLUMN "step_quotes_tracker_source";
  ALTER TABLE "habit_journey_content" DROP COLUMN "step_quotes_tracker_source_url";
  ALTER TABLE "habit_journey_content" DROP COLUMN "tracker_after_journey_title";
  ALTER TABLE "habit_journey_content" DROP COLUMN "tracker_after_journey_text";`)
}
