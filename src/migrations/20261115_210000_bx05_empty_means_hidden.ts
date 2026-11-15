import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// REVIEW-REQUIRED: BX-05 migration adding use_default_copy boolean toggles
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- 1. products & _products_v
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "use_default_copy_hero" boolean DEFAULT false;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "use_default_copy_includes" boolean DEFAULT false;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "use_default_copy_stats" boolean DEFAULT false;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "use_default_copy_curriculum" boolean DEFAULT false;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "use_default_copy_features" boolean DEFAULT false;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "use_default_copy_faq" boolean DEFAULT false;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "use_default_copy_bottom" boolean DEFAULT false;

    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_use_default_copy_hero" boolean DEFAULT false;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_use_default_copy_includes" boolean DEFAULT false;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_use_default_copy_stats" boolean DEFAULT false;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_use_default_copy_curriculum" boolean DEFAULT false;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_use_default_copy_features" boolean DEFAULT false;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_use_default_copy_faq" boolean DEFAULT false;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_use_default_copy_bottom" boolean DEFAULT false;

    -- 2. eq_buddy_content
    ALTER TABLE "eq_buddy_content" ADD COLUMN IF NOT EXISTS "use_default_copy_intro" boolean DEFAULT false;
    ALTER TABLE "eq_buddy_content" ADD COLUMN IF NOT EXISTS "use_default_copy_intro1" boolean DEFAULT false;
    ALTER TABLE "eq_buddy_content" ADD COLUMN IF NOT EXISTS "use_default_copy_guide" boolean DEFAULT false;
    ALTER TABLE "eq_buddy_content" ADD COLUMN IF NOT EXISTS "use_default_copy_state_icons" boolean DEFAULT false;
    ALTER TABLE "eq_buddy_content" ADD COLUMN IF NOT EXISTS "use_default_copy_card_back" boolean DEFAULT false;

    -- 3. habit_journey_content
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "header_use_default_copy_header" boolean DEFAULT false;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step1_use_default_copy_step1" boolean DEFAULT false;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step2_use_default_copy_step2" boolean DEFAULT false;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step3_use_default_copy_step3" boolean DEFAULT false;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step4_use_default_copy_step4" boolean DEFAULT false;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step5_use_default_copy_step5" boolean DEFAULT false;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "step6_use_default_copy_step6" boolean DEFAULT false;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "tracker_use_default_copy_tracker" boolean DEFAULT false;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "check_in_use_default_copy_check_in" boolean DEFAULT false;
    ALTER TABLE "habit_journey_content" ADD COLUMN IF NOT EXISTS "footer_use_default_copy_footer" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- 1. products & _products_v
    ALTER TABLE "products" DROP COLUMN IF EXISTS "use_default_copy_hero";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "use_default_copy_includes";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "use_default_copy_stats";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "use_default_copy_curriculum";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "use_default_copy_features";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "use_default_copy_faq";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "use_default_copy_bottom";

    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_use_default_copy_hero";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_use_default_copy_includes";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_use_default_copy_stats";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_use_default_copy_curriculum";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_use_default_copy_features";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_use_default_copy_faq";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_use_default_copy_bottom";

    -- 2. eq_buddy_content
    ALTER TABLE "eq_buddy_content" DROP COLUMN IF EXISTS "use_default_copy_intro";
    ALTER TABLE "eq_buddy_content" DROP COLUMN IF EXISTS "use_default_copy_intro1";
    ALTER TABLE "eq_buddy_content" DROP COLUMN IF EXISTS "use_default_copy_guide";
    ALTER TABLE "eq_buddy_content" DROP COLUMN IF EXISTS "use_default_copy_state_icons";
    ALTER TABLE "eq_buddy_content" DROP COLUMN IF EXISTS "use_default_copy_card_back";

    -- 3. habit_journey_content
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "header_use_default_copy_header";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step1_use_default_copy_step1";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step2_use_default_copy_step2";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step3_use_default_copy_step3";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step4_use_default_copy_step4";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step5_use_default_copy_step5";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "step6_use_default_copy_step6";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "tracker_use_default_copy_tracker";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "check_in_use_default_copy_check_in";
    ALTER TABLE "habit_journey_content" DROP COLUMN IF EXISTS "footer_use_default_copy_footer";
  `)
}
