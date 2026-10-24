import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Backfill for rows written before `status` existed; the table name is a parameter so tests can
// run the same statements on a scratch table instead of the real habit_checkins.
export const backfillCheckinStatusSql = (table = 'habit_checkins'): string =>
  `UPDATE "${table}" SET "status" = 'voted' WHERE "status" IS NULL AND "done" = true;
  UPDATE "${table}" SET "status" = 'missed' WHERE "status" IS NULL;`

// REVIEW-REQUIRED: Migration thêm cột status, backfill dữ liệu cũ từ done (true -> voted, còn lại -> missed), sau đó mới SET NOT NULL.
export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_habit_checkins_status" AS ENUM('voted', 'minimal', 'missed', 'rest');
  ALTER TABLE "habit_checkins" ADD COLUMN "status" "enum_habit_checkins_status";`)
  await db.execute(sql.raw(backfillCheckinStatusSql()))
  await db.execute(sql`ALTER TABLE "habit_checkins" ALTER COLUMN "status" SET NOT NULL;`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "habit_checkins" DROP COLUMN IF EXISTS "status";
  DROP TYPE IF EXISTS "public"."enum_habit_checkins_status";`)
}
