import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// REVIEW-REQUIRED: Migration thêm trường hướng dẫn, nhãn trạng thái và kết quả thẻ cho eq_buddy_content (AU-02)
export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "eq_buddy_content" ADD COLUMN IF NOT EXISTS "guide_modal_title" varchar DEFAULT 'Hướng dẫn: 3 bước để "dừng" và kết nối nội tâm mỗi ngày';
    ALTER TABLE "eq_buddy_content" ADD COLUMN IF NOT EXISTS "guide_modal_button" varchar DEFAULT 'Trải nghiệm';
    ALTER TABLE "eq_buddy_content" ADD COLUMN IF NOT EXISTS "state_icon1_label" varchar DEFAULT 'Hít thở 3 hơi';
    ALTER TABLE "eq_buddy_content" ADD COLUMN IF NOT EXISTS "state_icon2_label" varchar DEFAULT 'Nghĩ về mong muốn hôm nay';
    ALTER TABLE "eq_buddy_content" ADD COLUMN IF NOT EXISTS "state_icon3_label" varchar DEFAULT 'Gọi tên cảm xúc hiện tại';
    ALTER TABLE "eq_buddy_content" ADD COLUMN IF NOT EXISTS "card_back_prompt_title" varchar DEFAULT '3 câu hỏi kết nối nội tâm';
    ALTER TABLE "eq_buddy_content" ADD COLUMN IF NOT EXISTS "card_back_quote" varchar DEFAULT 'Dừng để vững vàng bước tới.';
  `)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "eq_buddy_content" DROP COLUMN IF EXISTS "guide_modal_title";
    ALTER TABLE "eq_buddy_content" DROP COLUMN IF EXISTS "guide_modal_button";
    ALTER TABLE "eq_buddy_content" DROP COLUMN IF EXISTS "state_icon1_label";
    ALTER TABLE "eq_buddy_content" DROP COLUMN IF EXISTS "state_icon2_label";
    ALTER TABLE "eq_buddy_content" DROP COLUMN IF EXISTS "state_icon3_label";
    ALTER TABLE "eq_buddy_content" DROP COLUMN IF EXISTS "card_back_prompt_title";
    ALTER TABLE "eq_buddy_content" DROP COLUMN IF EXISTS "card_back_quote";
  `)
}

