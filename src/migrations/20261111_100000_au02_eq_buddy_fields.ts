import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// REVIEW-REQUIRED: Migration thêm trường hướng dẫn, nhãn trạng thái và kết quả thẻ cho eq_buddy_content (AU-02)
// Cập nhật câu chữ mới cho bản ghi đã tồn tại nhưng CHỈ KHI giá trị còn đúng chữ mặc định cũ (không đè nội dung Hana đã sửa)
export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "eq_buddy_content" ADD COLUMN IF NOT EXISTS "guide_modal_title" varchar DEFAULT 'Hướng dẫn: 3 bước để "dừng" và kết nối nội tâm mỗi ngày';
    ALTER TABLE "eq_buddy_content" ADD COLUMN IF NOT EXISTS "guide_modal_button" varchar DEFAULT 'Trải nghiệm';
    ALTER TABLE "eq_buddy_content" ADD COLUMN IF NOT EXISTS "state_icon1_label" varchar DEFAULT 'Hít thở 3 hơi';
    ALTER TABLE "eq_buddy_content" ADD COLUMN IF NOT EXISTS "state_icon2_label" varchar DEFAULT 'Nghĩ về mong muốn hôm nay';
    ALTER TABLE "eq_buddy_content" ADD COLUMN IF NOT EXISTS "state_icon3_label" varchar DEFAULT 'Gọi tên cảm xúc hiện tại';
    ALTER TABLE "eq_buddy_content" ADD COLUMN IF NOT EXISTS "card_back_prompt_title" varchar DEFAULT '3 câu hỏi kết nối nội tâm';
    ALTER TABLE "eq_buddy_content" ADD COLUMN IF NOT EXISTS "card_back_quote" varchar DEFAULT 'Dừng để vững vàng bước tới.';

    UPDATE "eq_buddy_content" SET
      "badge" = CASE WHEN "badge" = 'Bộ thẻ chánh niệm & Trí tuệ cảm xúc (EQ)' THEN '' ELSE "badge" END,
      "intro1_heading" = CASE WHEN "intro1_heading" = 'Bộ thẻ là gì?' THEN '' ELSE "intro1_heading" END,
      "intro1_description" = CASE WHEN "intro1_description" = 'Công cụ chiêm nghiệm và đối thoại cảm xúc được thiết kế cho phụ nữ hiện đại.' THEN '' ELSE "intro1_description" END,
      "card1_title" = CASE WHEN "card1_title" = 'Tĩnh lặng & Lắng nghe sâu' THEN '' ELSE "card1_title" END,
      "card1_desc" = CASE WHEN "card1_desc" = 'Mỗi thẻ là một từ khóa EQ giúp bạn dừng lại, kết nối với cảm xúc, nhận diện những xao động và tái tạo nguồn năng lượng an yên bên trong.' THEN '' ELSE "card1_desc" END,
      "card2_title" = CASE WHEN "card2_title" = 'Chiêm nghiệm cá nhân' THEN '' ELSE "card2_title" END,
      "card2_desc" = CASE WHEN "card2_desc" = 'Dành cho những ngày cần gỡ rối, tự chữa lành, khai mở góc nhìn mới hoặc đơn giản là tìm kiếm một điểm tựa cảm xúc dịu dàng.' THEN '' ELSE "card2_desc" END,
      "card3_title" = CASE WHEN "card3_title" = 'Kết nối & Thấu hiểu nhóm' THEN '' ELSE "card3_title" END,
      "card3_desc" = CASE WHEN "card3_desc" = 'Phá băng nhóm (Icebreaker), khám phá giá trị đội ngũ, nhắn nhủ chân thành giữa bạn bè hoặc người thân trong một không gian an toàn, cởi mở.' THEN '' ELSE "card3_desc" END,
      "card4_title" = CASE WHEN "card4_title" = '2 Mặt tương tác 3D' THEN '' ELSE "card4_title" END,
      "card4_desc" = CASE WHEN "card4_desc" = 'Mặt trước: Từ khóa EQ + Thông điệp cảm hứng dẫn dắt. Mặt sau: 3 câu hỏi gợi mở suy ngẫm theo cấu trúc Gợi nhớ - Gói ghém - Ghi nhận.' THEN '' ELSE "card4_desc" END,
      "step4_title" = CASE WHEN "step4_title" = '4. Khám phá' THEN '' ELSE "step4_title" END,
      "step4_tag" = CASE WHEN "step4_tag" = 'Mặt sau thẻ' THEN '' ELSE "step4_tag" END,
      "step4_desc" = CASE WHEN "step4_desc" = 'Lật thẻ, trả lời 3 câu hỏi ở mặt sau để đào sâu và kết nối, gói ghém bài học và ghi nhận nỗ lực của bản thân.' THEN '' ELSE "step4_desc" END,
      "quote_top" = CASE WHEN "quote_top" = 'Trạm dừng để lắng nghe ♡' THEN 'Dừng để vững vàng bước tới.' ELSE "quote_top" END,
      "main_title" = CASE WHEN "main_title" = 'TRẠM DỪNG CẢM XÚC' THEN 'BỘ THẺ EQ BUDDY' ELSE "main_title" END,
      "subtitle" = CASE WHEN "subtitle" = '26 thông điệp cùng bạn. Gọi tên - Ghi nhận - Gợi nhớ.' THEN 'Dành cho những ngày chông chênh, mất kết nối với chính mình, hoặc đơn giản là muốn lắng nghe tiếng lòng một cách chân thật nhất.' ELSE "subtitle" END,
      "intro2_heading" = CASE WHEN "intro2_heading" = '4 Bước Sử Dụng Bộ Thẻ' THEN '3 bước kết nối cảm xúc' ELSE "intro2_heading" END,
      "intro2_description" = CASE WHEN "intro2_description" = 'Hãy thả lỏng vai, hít một hơi thật sâu và làm theo 4 chỉ dẫn đơn giản sau:' THEN '' ELSE "intro2_description" END,
      "step1_title" = CASE WHEN "step1_title" = '1. Mở đầu' THEN 'Gọi tên mong muốn và cảm xúc' ELSE "step1_title" END,
      "step1_tag" = CASE WHEN "step1_tag" = 'Đặt ý định' THEN '' ELSE "step1_tag" END,
      "step1_desc" = CASE WHEN "step1_desc" = 'Đặt ý định cho điều gì trong cuộc sống hay công việc hôm nay? Dành 30 giây tĩnh lặng, hít thở sâu để đưa tâm trí về trạng thái hiện diện trọn vẹn.' THEN 'Dành 3 hơi thở để thả lỏng và gọi tên mong muốn cho hôm nay. Chia sẻ cảm xúc bạn đang có ngay lúc này.' ELSE "step1_desc" END,
      "step2_title" = CASE WHEN "step2_title" = '2. Chọn thẻ' THEN 'Chọn thông điệp' ELSE "step2_title" END,
      "step2_tag" = CASE WHEN "step2_tag" = 'Gọi tên cảm xúc' THEN '' ELSE "step2_tag" END,
      "step2_desc" = CASE WHEN "step2_desc" = 'Chia sẻ cảm xúc bạn đang gặp — hoặc để trống và rút ngẫu nhiên thông điệp phù hợp cho khoảnh khắc này.' THEN 'Rút ngẫu nhiên thông điệp phù hợp với mình, đọc và cảm nhận' ELSE "step2_desc" END,
      "step3_title" = CASE WHEN "step3_title" = '3. Thực hiện' THEN 'Khám phá' ELSE "step3_title" END,
      "step3_tag" = CASE WHEN "step3_tag" = 'Mặt trước thẻ' THEN '' ELSE "step3_tag" END,
      "step3_desc" = CASE WHEN "step3_desc" = 'Đọc từ khóa kèm câu diễn giải ở mặt trước → kết nối cảm nhận và lắng nghe phản hồi từ cơ thể và tâm trí.' THEN 'Lật thẻ sang mặt sau để được gợi mở bằng những câu hỏi đào sâu - kết nối. Khuyến khích đào sâu với coach, người thương hoặc có thời gian chất lượng cho bản thân.' ELSE "step3_desc" END,
      "guide_modal_quote" = CASE WHEN "guide_modal_quote" = '“Mỗi thẻ là một tấm gương soi chiếu. Không có lá bài đúng hay sai, chỉ có khoảnh khắc bạn chân thật với chính mình.” ♡' THEN 'Đằng sau mỗi cảm xúc đều là một thông điệp đang chờ đợi bạn khám phá bằng sự chân thành và đón nhận trọn vẹn.' ELSE "guide_modal_quote" END,
      "shopee_url" = CASE WHEN "shopee_url" = 'https://shopee.vn' THEN 'https://tinyurl.com/yc43suhc' ELSE "shopee_url" END;
  `)
}

// REVIEW-REQUIRED: down() xoá các cột mới thêm.
// Không rollback câu chữ cũ vào các cột đã có để bảo toàn dữ liệu nếu hệ thống rollback schema.
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

