import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// REVIEW-REQUIRED: Migration thêm trường category, gradientTheme vào eqCards và tạo bảng global eq_buddy_content (E1, E3, E4)
export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "eq_cards" ADD COLUMN IF NOT EXISTS "category" varchar;
    ALTER TABLE "eq_cards" ADD COLUMN IF NOT EXISTS "gradient_theme" varchar DEFAULT 'from-[#FDE6F6] via-[#FAF7F4] to-[#E9DDF9]';
    ALTER TABLE "_eq_cards_v" ADD COLUMN IF NOT EXISTS "version_category" varchar;
    ALTER TABLE "_eq_cards_v" ADD COLUMN IF NOT EXISTS "version_gradient_theme" varchar DEFAULT 'from-[#FDE6F6] via-[#FAF7F4] to-[#E9DDF9]';

    CREATE TABLE IF NOT EXISTS "eq_buddy_content" (
      "id" serial PRIMARY KEY NOT NULL,
      "eq_access_mode" varchar DEFAULT 'trial',
      "tagline" varchar,
      "quote_top" varchar,
      "badge" varchar,
      "main_title" varchar,
      "subtitle" varchar,
      "suggested_emotions" varchar,
      "shopee_url" varchar,
      "intro1_heading" varchar,
      "intro1_description" varchar,
      "card1_title" varchar,
      "card1_desc" varchar,
      "card2_title" varchar,
      "card2_desc" varchar,
      "card3_title" varchar,
      "card3_desc" varchar,
      "card4_title" varchar,
      "card4_desc" varchar,
      "intro2_heading" varchar,
      "intro2_description" varchar,
      "step1_title" varchar,
      "step1_tag" varchar,
      "step1_desc" varchar,
      "step2_title" varchar,
      "step2_tag" varchar,
      "step2_desc" varchar,
      "step3_title" varchar,
      "step3_tag" varchar,
      "step3_desc" varchar,
      "step4_title" varchar,
      "step4_tag" varchar,
      "step4_desc" varchar,
      "guide_modal_quote" varchar,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );
  `)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "eq_buddy_content";
    ALTER TABLE "eq_cards" DROP COLUMN IF EXISTS "category";
    ALTER TABLE "eq_cards" DROP COLUMN IF EXISTS "gradient_theme";
    ALTER TABLE "_eq_cards_v" DROP COLUMN IF EXISTS "version_category";
    ALTER TABLE "_eq_cards_v" DROP COLUMN IF EXISTS "version_gradient_theme";
  `)
}
