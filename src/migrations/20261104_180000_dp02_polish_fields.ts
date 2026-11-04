import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// REVIEW-REQUIRED: Migration thêm actionText, personText vào habit_plans và bổ sung trường nội dung vào habit_journey_content (DP-02: Z1, Z3, Mục 1)
export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "habit_plans" ADD COLUMN IF NOT EXISTS "action_text" varchar;
    ALTER TABLE "habit_plans" ADD COLUMN IF NOT EXISTS "person_text" varchar;

    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step1_cue_diagnosis" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step1_craving_diagnosis" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step1_response_diagnosis" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step1_reward_diagnosis" varchar;

    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step4_lead_in_emphasis" varchar;

    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step5_theory_title" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step5_theory_desc" varchar;

    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "tracker_my_data_title" varchar;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "tracker_my_data_desc" varchar;
  `)

  // QA DP-02c: step 4 lead-in is now split in two (plain + bold). A lead-in still holding the
  // full DP-01d default would show the bold sentence twice, so trim it to the plain half.
  await db.execute(sql`
    UPDATE "habit_journey_content"
    SET "step4_lead_in" = 'Bắt đầu từ con người bạn muốn trở thành, rồi mới đến hành động.'
    WHERE "step4_lead_in" = 'Bắt đầu từ con người bạn muốn trở thành, rồi mới đến hành động. Thương hiệu cá nhân không phải việc làm thêm — nó là kết quả của hành động bạn lặp lại mỗi ngày.';
  `)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "habit_plans" DROP COLUMN IF EXISTS "action_text";
    ALTER TABLE "habit_plans" DROP COLUMN IF EXISTS "person_text";

    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step1_cue_diagnosis";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step1_craving_diagnosis";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step1_response_diagnosis";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step1_reward_diagnosis";

    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step4_lead_in_emphasis";

    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step5_theory_title";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step5_theory_desc";

    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "tracker_my_data_title";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "tracker_my_data_desc";
  `)
}
