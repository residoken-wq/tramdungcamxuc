import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_habit_plans_outcome" AS ENUM('in_progress', 'completed', 'experienced');
  ALTER TABLE "habit_plans" ADD COLUMN "journey_days" numeric;
  ALTER TABLE "habit_plans" ADD COLUMN "outcome" "enum_habit_plans_outcome" DEFAULT 'in_progress';
  ALTER TABLE "site_settings" ADD COLUMN "habit_journey_days" numeric DEFAULT 28;
  ALTER TABLE "site_settings" ADD COLUMN "certificate_min_percent" numeric DEFAULT 90;
  UPDATE "habit_plans" SET "journey_days" = 21 WHERE "journey_days" IS NULL;`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "habit_plans" DROP COLUMN IF EXISTS "journey_days";
  ALTER TABLE "habit_plans" DROP COLUMN IF EXISTS "outcome";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "habit_journey_days";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "certificate_min_percent";
  DROP TYPE IF EXISTS "public"."enum_habit_plans_outcome";`)
}
