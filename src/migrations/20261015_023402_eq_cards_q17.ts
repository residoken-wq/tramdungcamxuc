import { randomUUID } from 'node:crypto'
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import {
  migrateEmotionTags,
  migrateReflectionPromptToPrompts,
  rollbackReflectionPromptsToPrompt,
} from '../lib/eq/migration'

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

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
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

  // 2. Tạo Enum Types an toàn
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

  // 3. Xóa các bảng phụ không còn dùng
  await db.execute(sql`
    DROP TABLE IF EXISTS "eq_cards_reflection_prompts" CASCADE;
    DROP TABLE IF EXISTS "_eq_cards_v_version_reflection_prompts" CASCADE;
  `)

  // 4. Thêm các cột mới vào eq_cards và di chuyển dữ liệu câu hỏi cũ
  await db.execute(sql`
    ALTER TABLE "eq_cards" ADD COLUMN IF NOT EXISTS "keyword_vi" varchar;
    ALTER TABLE "eq_cards" ADD COLUMN IF NOT EXISTS "keyword_en" varchar;
    ALTER TABLE "eq_cards" ADD COLUMN IF NOT EXISTS "prompt_recall" varchar;
    ALTER TABLE "eq_cards" ADD COLUMN IF NOT EXISTS "prompt_pack" varchar;
    ALTER TABLE "eq_cards" ADD COLUMN IF NOT EXISTS "prompt_acknowledge" varchar;
  `)

  for (const card of legacyCards) {
    const { promptRecall } = migrateReflectionPromptToPrompts(card.reflection_prompt)
    if (promptRecall) {
      await db.execute(sql`
        UPDATE "eq_cards" SET "prompt_recall" = ${promptRecall} WHERE "id" = ${card.id};
      `)
    }
  }

  await db.execute(sql`
    ALTER TABLE "eq_cards" DROP COLUMN IF EXISTS "reflection_prompt";
  `)

  // 5. Thêm các cột mới vào _eq_cards_v và di chuyển dữ liệu câu hỏi cũ
  await db.execute(sql`
    ALTER TABLE "_eq_cards_v" ADD COLUMN IF NOT EXISTS "version_keyword_vi" varchar;
    ALTER TABLE "_eq_cards_v" ADD COLUMN IF NOT EXISTS "version_keyword_en" varchar;
    ALTER TABLE "_eq_cards_v" ADD COLUMN IF NOT EXISTS "version_prompt_recall" varchar;
    ALTER TABLE "_eq_cards_v" ADD COLUMN IF NOT EXISTS "version_prompt_pack" varchar;
    ALTER TABLE "_eq_cards_v" ADD COLUMN IF NOT EXISTS "version_prompt_acknowledge" varchar;
  `)

  for (const ver of legacyVersions) {
    const { promptRecall } = migrateReflectionPromptToPrompts(ver.version_reflection_prompt)
    if (promptRecall) {
      await db.execute(sql`
        UPDATE "_eq_cards_v" SET "version_prompt_recall" = ${promptRecall} WHERE "id" = ${ver.id};
      `)
    }
  }

  await db.execute(sql`
    ALTER TABLE "_eq_cards_v" DROP COLUMN IF EXISTS "version_reflection_prompt";
  `)

  // 6. Xây dựng lại bảng emotion_tags với kiểu enum (select hasMany: order, parent_id, value, id)
  await db.execute(sql`
    DROP TABLE IF EXISTS "eq_cards_emotion_tags" CASCADE;

    CREATE TABLE "eq_cards_emotion_tags" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "value" "public"."enum_eq_cards_emotion_tags"
    );

    ALTER TABLE "eq_cards_emotion_tags" ADD CONSTRAINT "eq_cards_emotion_tags_parent_fk"
      FOREIGN KEY ("parent_id") REFERENCES "public"."eq_cards"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "eq_cards_emotion_tags_order_idx" ON "eq_cards_emotion_tags" USING btree ("order");
    CREATE INDEX "eq_cards_emotion_tags_parent_idx" ON "eq_cards_emotion_tags" USING btree ("parent_id");
  `)

  // Gom và chuyển đổi dữ liệu nhãn cảm xúc thẻ chính
  const tagsByParent = new Map<number, Array<{ text?: string | null }>>()
  for (const row of legacyTags) {
    const list = tagsByParent.get(row._parent_id) ?? []
    list.push({ text: row.text })
    tagsByParent.set(row._parent_id, list)
  }

  let totalDroppedCards = 0
  for (const [parentId, oldList] of tagsByParent.entries()) {
    const { tags, droppedCount } = migrateEmotionTags(oldList)
    totalDroppedCards += droppedCount
    for (let i = 0; i < tags.length; i++) {
      const tagKey = tags[i]
      await db.execute(sql`
        INSERT INTO "eq_cards_emotion_tags" ("order", "parent_id", "value")
        VALUES (${i + 1}, ${parentId}, ${tagKey});
      `)
    }
  }

  // Xây dựng lại bảng _eq_cards_v_version_emotion_tags
  await db.execute(sql`
    DROP TABLE IF EXISTS "_eq_cards_v_version_emotion_tags" CASCADE;

    CREATE TABLE "_eq_cards_v_version_emotion_tags" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "value" "public"."enum__eq_cards_v_version_emotion_tags"
    );

    ALTER TABLE "_eq_cards_v_version_emotion_tags" ADD CONSTRAINT "_eq_cards_v_version_emotion_tags_parent_fk"
      FOREIGN KEY ("parent_id") REFERENCES "public"."_eq_cards_v"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "_eq_cards_v_version_emotion_tags_order_idx" ON "_eq_cards_v_version_emotion_tags" USING btree ("order");
    CREATE INDEX "_eq_cards_v_version_emotion_tags_parent_idx" ON "_eq_cards_v_version_emotion_tags" USING btree ("parent_id");
  `)

  const versionTagsByParent = new Map<number, Array<{ text?: string | null }>>()
  for (const row of legacyVersionTags) {
    const list = versionTagsByParent.get(row._parent_id) ?? []
    list.push({ text: row.text })
    versionTagsByParent.set(row._parent_id, list)
  }

  let totalDroppedVersions = 0
  for (const [parentId, oldList] of versionTagsByParent.entries()) {
    const { tags, droppedCount } = migrateEmotionTags(oldList)
    totalDroppedVersions += droppedCount
    for (let i = 0; i < tags.length; i++) {
      const tagKey = tags[i]
      await db.execute(sql`
        INSERT INTO "_eq_cards_v_version_emotion_tags" ("order", "parent_id", "value")
        VALUES (${i + 1}, ${parentId}, ${tagKey});
      `)
    }
  }

  if (totalDroppedCards > 0 || totalDroppedVersions > 0) {
    console.log(
      `[MIGRATION-INFO] Bỏ qua ${totalDroppedCards} nhãn không khớp trong eq_cards và ${totalDroppedVersions} nhãn trong _eq_cards_v.`,
    )
  }
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  // 1. Đọc lại promptRecall để khôi phục về reflection_prompt
  const cardsResult = await db.execute(sql`
    SELECT "id", "prompt_recall" FROM "eq_cards" WHERE "prompt_recall" IS NOT NULL;
  `)
  const cards = getRows<{ id: number; prompt_recall: string | null }>(cardsResult)

  const versionsResult = await db.execute(sql`
    SELECT "id", "version_prompt_recall" FROM "_eq_cards_v" WHERE "version_prompt_recall" IS NOT NULL;
  `)
  const versions = getRows<{ id: number; version_prompt_recall: string | null }>(versionsResult)

  // 2. Đọc lại emotion tags enum hiện tại để đưa về dạng text (kiểm tra an toàn qua information_schema)
  const colRes = await db.execute(sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'eq_cards_emotion_tags' AND column_name IN ('parent_id', '_parent_id');
  `)
  const hasParentId = getRows<{ column_name: string }>(colRes).some(
    (r) => r.column_name === 'parent_id',
  )
  const parentCol = hasParentId ? '"parent_id"' : '"_parent_id"'
  const orderCol = hasParentId ? '"order"' : '"_order"'

  const currentTagsResult = await db.execute(sql`
    SELECT "id", ${sql.raw(parentCol)} as "parent_id", ${sql.raw(orderCol)} as "order", "value"
    FROM "eq_cards_emotion_tags"
    ORDER BY 2, 3;
  `)
  const currentTags = getRows<{
    id: number | string
    parent_id: number
    order: number
    value: string | null
  }>(currentTagsResult)

  const vColRes = await db.execute(sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = '_eq_cards_v_version_emotion_tags' AND column_name IN ('parent_id', '_parent_id');
  `)
  const hasVParentId = getRows<{ column_name: string }>(vColRes).some(
    (r) => r.column_name === 'parent_id',
  )
  const vParentCol = hasVParentId ? '"parent_id"' : '"_parent_id"'
  const vOrderCol = hasVParentId ? '"order"' : '"_order"'

  const currentVersionTagsResult = await db.execute(sql`
    SELECT "id", ${sql.raw(vParentCol)} as "parent_id", ${sql.raw(vOrderCol)} as "order", "value"
    FROM "_eq_cards_v_version_emotion_tags"
    ORDER BY 2, 3;
  `)
  const currentVersionTags = getRows<{
    id: number
    parent_id: number
    order: number
    value: string | null
  }>(currentVersionTagsResult)

  // 3. Khôi phục cột reflection_prompt trong eq_cards và xóa các cột mới
  await db.execute(sql`
    ALTER TABLE "eq_cards" ADD COLUMN IF NOT EXISTS "reflection_prompt" varchar;
  `)

  for (const card of cards) {
    const rolledBack = rollbackReflectionPromptsToPrompt(card.prompt_recall)
    if (rolledBack) {
      await db.execute(sql`
        UPDATE "eq_cards" SET "reflection_prompt" = ${rolledBack} WHERE "id" = ${card.id};
      `)
    }
  }

  await db.execute(sql`
    ALTER TABLE "eq_cards"
      DROP COLUMN IF EXISTS "keyword_vi",
      DROP COLUMN IF EXISTS "keyword_en",
      DROP COLUMN IF EXISTS "prompt_recall",
      DROP COLUMN IF EXISTS "prompt_pack",
      DROP COLUMN IF EXISTS "prompt_acknowledge";
  `)

  // 4. Khôi phục cột version_reflection_prompt trong _eq_cards_v
  await db.execute(sql`
    ALTER TABLE "_eq_cards_v" ADD COLUMN IF NOT EXISTS "version_reflection_prompt" varchar;
  `)

  for (const ver of versions) {
    const rolledBack = rollbackReflectionPromptsToPrompt(ver.version_prompt_recall)
    if (rolledBack) {
      await db.execute(sql`
        UPDATE "_eq_cards_v" SET "version_reflection_prompt" = ${rolledBack} WHERE "id" = ${ver.id};
      `)
    }
  }

  await db.execute(sql`
    ALTER TABLE "_eq_cards_v"
      DROP COLUMN IF EXISTS "version_keyword_vi",
      DROP COLUMN IF EXISTS "version_keyword_en",
      DROP COLUMN IF EXISTS "version_prompt_recall",
      DROP COLUMN IF EXISTS "version_prompt_pack",
      DROP COLUMN IF EXISTS "version_prompt_acknowledge";
  `)

  // 5. Khôi phục bảng emotion_tags dạng lines (text)
  await db.execute(sql`
    DROP TABLE IF EXISTS "eq_cards_emotion_tags" CASCADE;

    CREATE TABLE "eq_cards_emotion_tags" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "text" varchar
    );

    ALTER TABLE "eq_cards_emotion_tags" ADD CONSTRAINT "eq_cards_emotion_tags_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."eq_cards"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "eq_cards_emotion_tags_order_idx" ON "eq_cards_emotion_tags" USING btree ("_order");
    CREATE INDEX "eq_cards_emotion_tags_parent_id_idx" ON "eq_cards_emotion_tags" USING btree ("_parent_id");
  `)

  for (const row of currentTags) {
    if (row.value) {
      const id = randomUUID()
      await db.execute(sql`
        INSERT INTO "eq_cards_emotion_tags" ("_order", "_parent_id", "id", "text")
        VALUES (${row.order}, ${row.parent_id}, ${id}, ${row.value});
      `)
    }
  }

  await db.execute(sql`
    DROP TABLE IF EXISTS "_eq_cards_v_version_emotion_tags" CASCADE;

    CREATE TABLE "_eq_cards_v_version_emotion_tags" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "text" varchar,
      "_uuid" varchar
    );

    ALTER TABLE "_eq_cards_v_version_emotion_tags" ADD CONSTRAINT "_eq_cards_v_version_emotion_tags_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."_eq_cards_v"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "_eq_cards_v_version_emotion_tags_order_idx" ON "_eq_cards_v_version_emotion_tags" USING btree ("_order");
    CREATE INDEX "_eq_cards_v_version_emotion_tags_parent_id_idx" ON "_eq_cards_v_version_emotion_tags" USING btree ("_parent_id");
  `)

  for (const row of currentVersionTags) {
    if (row.value) {
      const uuid = randomUUID()
      await db.execute(sql`
        INSERT INTO "_eq_cards_v_version_emotion_tags" ("_order", "_parent_id", "text", "_uuid")
        VALUES (${row.order}, ${row.parent_id}, ${row.value}, ${uuid});
      `)
    }
  }

  // 6. Xóa enum types nếu không còn dùng
  await db.execute(sql`
    DROP TYPE IF EXISTS "public"."enum_eq_cards_emotion_tags";
    DROP TYPE IF EXISTS "public"."enum__eq_cards_v_version_emotion_tags";
  `)
}
