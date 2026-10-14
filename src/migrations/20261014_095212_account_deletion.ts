import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  const duplicatePlansResult = await db.execute(sql`
    SELECT "plan_id", COUNT(*) as cnt
    FROM "certificates"
    WHERE "plan_id" IS NOT NULL
    GROUP BY "plan_id"
    HAVING COUNT(*) > 1;
  `)

  const duplicates = ((
    duplicatePlansResult as unknown as {
      rows?: Array<{ plan_id: number | string; cnt: number | string }>
    }
  )?.rows ?? duplicatePlansResult) as Array<{ plan_id: number | string; cnt: number | string }>

  if (Array.isArray(duplicates) && duplicates.length > 0) {
    const ids = duplicates.map((d) => `plan_id ${d.plan_id} (${d.cnt} chứng nhận)`).join(', ')
    throw new Error(
      `[Migration T2-16] Phát hiện kế hoạch có nhiều hơn 1 chứng nhận: ${ids}. Dừng migration để xử lý dữ liệu thủ công, không tự xóa.`,
    )
  }

  await db.execute(sql`
   DROP INDEX IF EXISTS "certificates_plan_idx";
  ALTER TABLE "orders" ALTER COLUMN "customer_id" DROP NOT NULL;
  ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "deletion_requested_at" timestamp(3) with time zone;
  ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "anonymized_at" timestamp(3) with time zone;
  CREATE UNIQUE INDEX IF NOT EXISTS "certificates_plan_idx" ON "certificates" USING btree ("plan_id");`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  const nullOrdersResult = await db.execute(sql`
    SELECT COUNT(*) as cnt
    FROM "orders"
    WHERE "customer_id" IS NULL;
  `)

  const rows = ((
    nullOrdersResult as unknown as {
      rows?: Array<{ cnt: number | string }>
    }
  )?.rows ?? nullOrdersResult) as Array<{ cnt: number | string }>

  const nullCount = Number(rows?.[0]?.cnt ?? 0)
  if (nullCount > 0) {
    throw new Error(
      `[Rollback T2-16] Phát hiện ${nullCount} đơn hàng đã bị ẩn danh (customer_id = NULL). Không thể khôi phục ràng buộc NOT NULL trên orders.customer_id. Vui lòng xử lý dữ liệu thủ công trước khi rollback.`,
    )
  }

  await db.execute(sql`
   DROP INDEX IF EXISTS "certificates_plan_idx";
  ALTER TABLE "orders" ALTER COLUMN "customer_id" SET NOT NULL;
  CREATE INDEX IF NOT EXISTS "certificates_plan_idx" ON "certificates" USING btree ("plan_id");
  ALTER TABLE "customers" DROP COLUMN IF EXISTS "deletion_requested_at";
  ALTER TABLE "orders" DROP COLUMN IF EXISTS "anonymized_at";`)
}
