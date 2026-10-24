import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_habit_plans_rhythm_days" AS ENUM('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');
  CREATE TABLE "habit_plans_rhythm_days" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_habit_plans_rhythm_days",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "habit_plans_scorecard" ADD COLUMN "time" varchar;
  ALTER TABLE "habit_plans" ADD COLUMN "anchor_habit" varchar;
  ALTER TABLE "habit_plans" ADD COLUMN "two_minute_action" varchar;
  ALTER TABLE "habit_plans" ADD COLUMN "private_reason" varchar;
  ALTER TABLE "habit_plans" ADD COLUMN "companion_name" varchar;
  ALTER TABLE "habit_plans_rhythm_days" ADD CONSTRAINT "habit_plans_rhythm_days_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."habit_plans"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "habit_plans_rhythm_days_order_idx" ON "habit_plans_rhythm_days" USING btree ("order");
  CREATE INDEX "habit_plans_rhythm_days_parent_idx" ON "habit_plans_rhythm_days" USING btree ("parent_id");`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "habit_plans_rhythm_days" CASCADE;
  ALTER TABLE "habit_plans_scorecard" DROP COLUMN "time";
  ALTER TABLE "habit_plans" DROP COLUMN "anchor_habit";
  ALTER TABLE "habit_plans" DROP COLUMN "two_minute_action";
  ALTER TABLE "habit_plans" DROP COLUMN "private_reason";
  ALTER TABLE "habit_plans" DROP COLUMN "companion_name";
  DROP TYPE "public"."enum_habit_plans_rhythm_days";`)
}
