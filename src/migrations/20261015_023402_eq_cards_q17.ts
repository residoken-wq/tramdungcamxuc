import { randomUUID } from 'node:crypto'
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import {
  migrateEmotionTags,
  migrateReflectionPromptToPrompts,
  rollbackReflectionPromptsToPrompt,
} from '../lib/eq/migration'
import { getEmotion } from '../lib/emotions'

function getRows<T>(result: unknown): T[] {
  if (!result) return []
  if (Array.isArray((result as { rows?: T[] }).rows)) {
    return (result as { rows: T[] }).rows
  }
  if (Array.isArray(result)) {
    return result as T[]
  }
  return []
}

export async function up({ db, payload, req: _req }: MigrateUpArgs): Promise<void> {
  // 1. Đọc dữ liệu cũ trước khi thay đổi bảng
  const legacyCardsResult = await db.execute(sql`
    SELECT "id", "reflection_prompt" FROM "eq_cards" WHERE "reflection_prompt" IS NOT NULL;
  `)
  const legacyCards = getRows<{ id: number; reflection_prompt: string | null }>(legacyCardsResult)

  const legacyVersionsResult = await db.execute(sql`
    SELECT "id", "version_reflection_prompt" FROM "_eq_cards_v" WHERE "version_reflection_prompt" IS NOT NULL;
  `)
  const legacyVersions = getRows<{ id: number; version_reflection_prompt: string | null }>(
    legacyVersionsResult,
  )

  const legacyTagsResult = await db.execute(sql`
    SELECT "id", "_parent_id", "_order", "text" FROM "eq_cards_emotion_tags" ORDER BY "_parent_id", "_order";
  `)
  const legacyTags = getRows<{
    id: string
    _parent_id: number
    _order: number
    text: string | null
  }>(legacyTagsResult)

  const legacyVersionTagsResult = await db.execute(sql`
    SELECT "id", "_parent_id", "_order", "text" FROM "_eq_cards_v_version_emotion_tags" ORDER BY "_parent_id", "_order";
  `)
  const legacyVersionTags = getRows<{
    id: number
    _parent_id: number
    _order: number
    text: string | null
  }>(legacyVersionTagsResult)

  // 2. Tạo Enum Types an toàn (bỏ qua nếu đã tồn tại)
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_eq_cards_emotion_tags" AS ENUM('joyful', 'peaceful', 'fresh', 'serene', 'grateful', 'relaxed', 'confident', 'tired', 'discouraged', 'stressed');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__eq_cards_v_version_emotion_tags" AS ENUM('joyful', 'peaceful', 'fresh', 'serene', 'grateful', 'relaxed', 'confident', 'tired', 'discouraged', 'stressed');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  // 3. Tạo bảng reflectionPrompts cho thẻ và bản version
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "eq_cards_reflection_prompts" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "prompt" varchar
    );

    CREATE TABLE IF NOT EXISTS "_eq_cards_v_version_reflection_prompts" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "prompt" varchar,
      "_uuid" varchar
    );

    ALTER TABLE "eq_cards_reflection_prompts" DROP CONSTRAINT IF EXISTS "eq_cards_reflection_prompts_parent_id_fk";
    ALTER TABLE "eq_cards_reflection_prompts" ADD CONSTRAINT "eq_cards_reflection_prompts_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."eq_cards"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "_eq_cards_v_version_reflection_prompts" DROP CONSTRAINT IF EXISTS "_eq_cards_v_version_reflection_prompts_parent_id_fk";
    ALTER TABLE "_eq_cards_v_version_reflection_prompts" ADD CONSTRAINT "_eq_cards_v_version_reflection_prompts_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."_eq_cards_v"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "eq_cards_reflection_prompts_order_idx" ON "eq_cards_reflection_prompts" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "eq_cards_reflection_prompts_parent_id_idx" ON "eq_cards_reflection_prompts" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_eq_cards_v_version_reflection_prompts_order_idx" ON "_eq_cards_v_version_reflection_prompts" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_eq_cards_v_version_reflection_prompts_parent_id_idx" ON "_eq_cards_v_version_reflection_prompts" USING btree ("_parent_id");
  `)

  // 4. Thêm cột từ khóa cho eq_cards và _eq_cards_v
  await db.execute(sql`
    ALTER TABLE "eq_cards" ADD COLUMN IF NOT EXISTS "keyword_vi" varchar;
    ALTER TABLE "eq_cards" ADD COLUMN IF NOT EXISTS "keyword_en" varchar;
    ALTER TABLE "_eq_cards_v" ADD COLUMN IF NOT EXISTS "version_keyword_vi" varchar;
    ALTER TABLE "_eq_cards_v" ADD COLUMN IF NOT EXISTS "version_keyword_en" varchar;
  `)

  // 5. Thay thế cấu trúc bảng eq_cards_emotion_tags và _eq_cards_v_version_emotion_tags
  await db.execute(sql`
    DROP TABLE IF EXISTS "eq_cards_emotion_tags" CASCADE;
    CREATE TABLE "eq_cards_emotion_tags" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_eq_cards_emotion_tags"
    );
    ALTER TABLE "eq_cards_emotion_tags" ADD CONSTRAINT "eq_cards_emotion_tags_parent_fk"
      FOREIGN KEY ("parent_id") REFERENCES "public"."eq_cards"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX IF NOT EXISTS "eq_cards_emotion_tags_parent_idx" ON "eq_cards_emotion_tags" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "eq_cards_emotion_tags_order_idx" ON "eq_cards_emotion_tags" USING btree ("order");

    DROP TABLE IF EXISTS "_eq_cards_v_version_emotion_tags" CASCADE;
    CREATE TABLE "_eq_cards_v_version_emotion_tags" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum__eq_cards_v_version_emotion_tags"
    );
    ALTER TABLE "_eq_cards_v_version_emotion_tags" ADD CONSTRAINT "_eq_cards_v_version_emotion_tags_parent_fk"
      FOREIGN KEY ("parent_id") REFERENCES "public"."_eq_cards_v"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX IF NOT EXISTS "_eq_cards_v_version_emotion_tags_parent_idx" ON "_eq_cards_v_version_emotion_tags" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "_eq_cards_v_version_emotion_tags_order_idx" ON "_eq_cards_v_version_emotion_tags" USING btree ("order");
  `)

  // 6. Chuyển dữ liệu reflection_prompt -> reflectionPrompts (bản chính & version)
  for (const card of legacyCards) {
    const prompts = migrateReflectionPromptToPrompts(card.reflection_prompt)
    for (let i = 0; i < prompts.length; i++) {
      const promptId = randomUUID()
      await db.execute(sql`
        INSERT INTO "eq_cards_reflection_prompts" ("_order", "_parent_id", "id", "prompt")
        VALUES (${i + 1}, ${card.id}, ${promptId}, ${prompts[i].prompt});
      `)
    }
  }

  for (const version of legacyVersions) {
    const prompts = migrateReflectionPromptToPrompts(version.version_reflection_prompt)
    for (let i = 0; i < prompts.length; i++) {
      const uuid = randomUUID()
      await db.execute(sql`
        INSERT INTO "_eq_cards_v_version_reflection_prompts" ("_order", "_parent_id", "prompt", "_uuid")
        VALUES (${i + 1}, ${version.id}, ${prompts[i].prompt}, ${uuid});
      `)
    }
  }

  // 7. Chuyển dữ liệu emotionTags (bản chính & version), ánh xạ 10 cảm xúc và ghi log các thẻ bị bỏ
  const groupedTags = new Map<number, string[]>()
  for (const tag of legacyTags) {
    if (tag.text) {
      const list = groupedTags.get(tag._parent_id) ?? []
      list.push(tag.text)
      groupedTags.set(tag._parent_id, list)
    }
  }

  let totalDroppedMain = 0
  for (const [parentId, tags] of groupedTags.entries()) {
    const { tags: mapped, droppedCount } = migrateEmotionTags(tags)
    totalDroppedMain += droppedCount
    for (let i = 0; i < mapped.length; i++) {
      await db.execute(sql`
        INSERT INTO "eq_cards_emotion_tags" ("order", "parent_id", "value")
        VALUES (${i + 1}, ${parentId}, ${mapped[i]});
      `)
    }
  }

  const groupedVersionTags = new Map<number, string[]>()
  for (const tag of legacyVersionTags) {
    if (tag.text) {
      const list = groupedVersionTags.get(tag._parent_id) ?? []
      list.push(tag.text)
      groupedVersionTags.set(tag._parent_id, list)
    }
  }

  let totalDroppedVersion = 0
  for (const [parentId, tags] of groupedVersionTags.entries()) {
    const { tags: mapped, droppedCount } = migrateEmotionTags(tags)
    totalDroppedVersion += droppedCount
    for (let i = 0; i < mapped.length; i++) {
      await db.execute(sql`
        INSERT INTO "_eq_cards_v_version_emotion_tags" ("order", "parent_id", "value")
        VALUES (${i + 1}, ${parentId}, ${mapped[i]});
      `)
    }
  }

  payload.logger.info(
    `[Migration eq_cards_q17] Đã hoàn thành chuyển đổi emotionTags. Số nhãn bị bỏ do không khớp 10 cảm xúc chuẩn: bản chính = ${totalDroppedMain}, bản version = ${totalDroppedVersion}.`,
  )

  // 8. Xóa các cột cũ
  await db.execute(sql`
    ALTER TABLE "eq_cards" DROP COLUMN IF EXISTS "reflection_prompt";
    ALTER TABLE "_eq_cards_v" DROP COLUMN IF EXISTS "version_reflection_prompt";
  `)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  // 1. Đọc dữ liệu hiện tại để phục hồi lại cấu trúc cũ
  const promptsResult = await db.execute(sql`
    SELECT "_parent_id", "prompt" FROM "eq_cards_reflection_prompts" ORDER BY "_parent_id", "_order" ASC;
  `)
  const prompts = getRows<{ _parent_id: number; prompt: string | null }>(promptsResult)
  const promptsByParent = new Map<number, Array<{ prompt: string | null }>>()
  for (const p of prompts) {
    const list = promptsByParent.get(p._parent_id) ?? []
    list.push({ prompt: p.prompt })
    promptsByParent.set(p._parent_id, list)
  }

  const vPromptsResult = await db.execute(sql`
    SELECT "_parent_id", "prompt" FROM "_eq_cards_v_version_reflection_prompts" ORDER BY "_parent_id", "_order" ASC;
  `)
  const vPrompts = getRows<{ _parent_id: number; prompt: string | null }>(vPromptsResult)
  const vPromptsByParent = new Map<number, Array<{ prompt: string | null }>>()
  for (const p of vPrompts) {
    const list = vPromptsByParent.get(p._parent_id) ?? []
    list.push({ prompt: p.prompt })
    vPromptsByParent.set(p._parent_id, list)
  }

  const currentTagsResult = await db.execute(sql`
    SELECT "parent_id", "order", "value" FROM "eq_cards_emotion_tags" ORDER BY "parent_id", "order" ASC;
  `)
  const currentTags = getRows<{ parent_id: number; order: number; value: string | null }>(
    currentTagsResult,
  )

  const currentVTagsResult = await db.execute(sql`
    SELECT "parent_id", "order", "value" FROM "_eq_cards_v_version_emotion_tags" ORDER BY "parent_id", "order" ASC;
  `)
  const currentVTags = getRows<{ parent_id: number; order: number; value: string | null }>(
    currentVTagsResult,
  )

  // 2. Khôi phục cột reflection_prompt
  await db.execute(sql`
    ALTER TABLE "eq_cards" ADD COLUMN IF NOT EXISTS "reflection_prompt" varchar;
    ALTER TABLE "_eq_cards_v" ADD COLUMN IF NOT EXISTS "version_reflection_prompt" varchar;
  `)

  for (const [parentId, promptList] of promptsByParent.entries()) {
    const restored = rollbackReflectionPromptsToPrompt(promptList)
    if (restored) {
      await db.execute(sql`
        UPDATE "eq_cards" SET "reflection_prompt" = ${restored} WHERE "id" = ${parentId};
      `)
    }
  }

  for (const [parentId, promptList] of vPromptsByParent.entries()) {
    const restored = rollbackReflectionPromptsToPrompt(promptList)
    if (restored) {
      await db.execute(sql`
        UPDATE "_eq_cards_v" SET "version_reflection_prompt" = ${restored} WHERE "id" = ${parentId};
      `)
    }
  }

  // 3. Khôi phục bảng eq_cards_emotion_tags và _eq_cards_v_version_emotion_tags
  await db.execute(sql`
    DROP TABLE IF EXISTS "eq_cards_emotion_tags" CASCADE;
    CREATE TABLE "eq_cards_emotion_tags" (
      "id" varchar PRIMARY KEY NOT NULL,
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "text" varchar
    );
    ALTER TABLE "eq_cards_emotion_tags" ADD CONSTRAINT "eq_cards_emotion_tags_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."eq_cards"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX IF NOT EXISTS "eq_cards_emotion_tags_parent_id_idx" ON "eq_cards_emotion_tags" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "eq_cards_emotion_tags_order_idx" ON "eq_cards_emotion_tags" USING btree ("_order");

    DROP TABLE IF EXISTS "_eq_cards_v_version_emotion_tags" CASCADE;
    CREATE TABLE "_eq_cards_v_version_emotion_tags" (
      "id" serial PRIMARY KEY NOT NULL,
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "text" varchar,
      "_uuid" varchar
    );
    ALTER TABLE "_eq_cards_v_version_emotion_tags" ADD CONSTRAINT "_eq_cards_v_version_emotion_tags_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."_eq_cards_v"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX IF NOT EXISTS "_eq_cards_v_version_emotion_tags_parent_id_idx" ON "_eq_cards_v_version_emotion_tags" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_eq_cards_v_version_emotion_tags_order_idx" ON "_eq_cards_v_version_emotion_tags" USING btree ("_order");
  `)

  for (const tag of currentTags) {
    const emotion = getEmotion(tag.value)
    const label = emotion ? emotion.label : tag.value
    const id = randomUUID()
    await db.execute(sql`
      INSERT INTO "eq_cards_emotion_tags" ("id", "_order", "_parent_id", "text")
      VALUES (${id}, ${tag.order}, ${tag.parent_id}, ${label});
    `)
  }

  for (const tag of currentVTags) {
    const emotion = getEmotion(tag.value)
    const label = emotion ? emotion.label : tag.value
    const uuid = randomUUID()
    await db.execute(sql`
      INSERT INTO "_eq_cards_v_version_emotion_tags" ("_order", "_parent_id", "text", "_uuid")
      VALUES (${tag.order}, ${tag.parent_id}, ${label}, ${uuid});
    `)
  }

  // 4. Xóa bảng reflectionPrompts và các cột mới
  await db.execute(sql`
    DROP TABLE IF EXISTS "eq_cards_reflection_prompts" CASCADE;
    DROP TABLE IF EXISTS "_eq_cards_v_version_reflection_prompts" CASCADE;
    ALTER TABLE "eq_cards" DROP COLUMN IF EXISTS "keyword_vi";
    ALTER TABLE "eq_cards" DROP COLUMN IF EXISTS "keyword_en";
    ALTER TABLE "_eq_cards_v" DROP COLUMN IF EXISTS "version_keyword_vi";
    ALTER TABLE "_eq_cards_v" DROP COLUMN IF EXISTS "version_keyword_en";
    DROP TYPE IF EXISTS "public"."enum_eq_cards_emotion_tags";
    DROP TYPE IF EXISTS "public"."enum__eq_cards_v_version_emotion_tags";
  `)
}
