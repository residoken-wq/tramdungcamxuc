import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req: _req }: MigrateUpArgs): Promise<void> {
  // 1. Thêm cột save_key
  await db.execute(sql`
    ALTER TABLE "saved_cards" ADD COLUMN IF NOT EXISTS "save_key" varchar;
  `)

  // 2. Gộp bản trùng có sẵn (giữ bản mới nhất theo saved_at / created_at / id, in số bản bị gộp)
  const dedupResult = await db.execute(sql`
    WITH ranked AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY customer_id, card_id
          ORDER BY COALESCE(saved_at, created_at) DESC, id DESC
        ) AS rn
      FROM "saved_cards"
      WHERE customer_id IS NOT NULL AND card_id IS NOT NULL
    ),
    deleted AS (
      DELETE FROM "saved_cards"
      WHERE id IN (SELECT id FROM ranked WHERE rn > 1)
      RETURNING id
    )
    SELECT count(*)::int AS count FROM deleted;
  `)

  const rows = Array.isArray(dedupResult)
    ? (dedupResult as Array<{ count?: number }>)
    : ((dedupResult as unknown as { rows?: Array<{ count?: number }> })?.rows ?? [])
  const mergedCount = Number(rows[0]?.count ?? 0)

  const logMessage = `[saved_cards_unique] Đã gộp ${mergedCount} bản ghi trùng lặp có sẵn.`
  console.log(logMessage)
  payload?.logger?.info?.(logMessage)

  // 3. Cập nhật save_key cho các bản ghi hiện có
  await db.execute(sql`
    UPDATE "saved_cards"
    SET "save_key" = "customer_id"::text || ':' || "card_id"::text
    WHERE "save_key" IS NULL AND "customer_id" IS NOT NULL AND "card_id" IS NOT NULL;
  `)

  // 4. Tạo unique index
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "saved_cards_save_key_idx" ON "saved_cards" USING btree ("save_key");
  `)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "saved_cards_save_key_idx";
    ALTER TABLE "saved_cards" DROP COLUMN IF EXISTS "save_key";
  `)
}
