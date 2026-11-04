import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// REVIEW-REQUIRED: Thêm 5 giá trị cảm xúc mới vào enum_habit_checkins_emotion cho Habit Tracker (H5 / DP-01)
export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_habit_checkins_emotion" ADD VALUE IF NOT EXISTS 'insecure';
    ALTER TYPE "public"."enum_habit_checkins_emotion" ADD VALUE IF NOT EXISTS 'unconfident';
    ALTER TYPE "public"."enum_habit_checkins_emotion" ADD VALUE IF NOT EXISTS 'somewhat_confident';
    ALTER TYPE "public"."enum_habit_checkins_emotion" ADD VALUE IF NOT EXISTS 'very_confident';
    ALTER TYPE "public"."enum_habit_checkins_emotion" ADD VALUE IF NOT EXISTS 'wonderful';
  `)
}

export async function down({ db: _db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  // PostgreSQL không hỗ trợ DROP VALUE khỏi ENUM type trực tiếp mà không tái tạo bảng.
}
