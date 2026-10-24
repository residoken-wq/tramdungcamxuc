import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export const BACKFILL_CHECKIN_STATUS_VOTED_SQL = `UPDATE "habit_checkins" SET "status" = 'voted' WHERE "done" = true;`
export const BACKFILL_CHECKIN_STATUS_MISSED_SQL = `UPDATE "habit_checkins" SET "status" = 'missed' WHERE "status" IS NULL;`

// REVIEW-REQUIRED: Migration thêm cột status, backfill dữ liệu cũ từ done (true -> voted, còn lại -> missed), sau đó mới SET NOT NULL.
export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_habit_checkins_status" AS ENUM('voted', 'minimal', 'missed', 'rest');
  ALTER TABLE "habit_checkins" ADD COLUMN "status" "enum_habit_checkins_status";
  UPDATE "habit_checkins" SET "status" = 'voted' WHERE "done" = true;
  UPDATE "habit_checkins" SET "status" = 'missed' WHERE "status" IS NULL;
  ALTER TABLE "habit_checkins" ALTER COLUMN "status" SET NOT NULL;`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "habit_checkins" DROP COLUMN IF EXISTS "status";
  DROP TYPE IF EXISTS "public"."enum_habit_checkins_status";`)
}
