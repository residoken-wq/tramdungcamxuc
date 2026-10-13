import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "tracker_nudges" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"plan_id" integer,
  	"missed_start_day" numeric NOT NULL,
  	"sent_at" timestamp(3) with time zone NOT NULL,
  	"nudge_key" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "habit_checkins" ALTER COLUMN "emotion" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum_habit_checkins_emotion";
  CREATE TYPE "public"."enum_habit_checkins_emotion" AS ENUM('joyful', 'peaceful', 'fresh', 'serene', 'grateful', 'relaxed', 'confident', 'tired', 'discouraged', 'stressed');
  ALTER TABLE "habit_checkins" ALTER COLUMN "emotion" SET DATA TYPE "public"."enum_habit_checkins_emotion" USING (
    CASE WHEN "emotion" IN ('joyful', 'peaceful', 'fresh', 'serene', 'grateful', 'relaxed', 'confident', 'tired', 'discouraged', 'stressed')
    THEN "emotion"::"public"."enum_habit_checkins_emotion"
    ELSE NULL END
  );
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "tracker_nudges_id" integer;
  ALTER TABLE "tracker_nudges" ADD CONSTRAINT "tracker_nudges_plan_id_habit_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."habit_plans"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "tracker_nudges_plan_idx" ON "tracker_nudges" USING btree ("plan_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "tracker_nudges_nudge_key_idx" ON "tracker_nudges" USING btree ("nudge_key");
  CREATE INDEX IF NOT EXISTS "tracker_nudges_updated_at_idx" ON "tracker_nudges" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "tracker_nudges_created_at_idx" ON "tracker_nudges" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tracker_nudges_fk" FOREIGN KEY ("tracker_nudges_id") REFERENCES "public"."tracker_nudges"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_tracker_nudges_id_idx" ON "payload_locked_documents_rels" USING btree ("tracker_nudges_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_tracker_nudges_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_tracker_nudges_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "tracker_nudges_id";
  DROP TABLE IF EXISTS "tracker_nudges" CASCADE;
  
  ALTER TABLE "habit_checkins" ALTER COLUMN "emotion" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum_habit_checkins_emotion";
  CREATE TYPE "public"."enum_habit_checkins_emotion" AS ENUM('calm', 'grateful', 'energized', 'overwhelmed', 'tired', 'anxious');
  ALTER TABLE "habit_checkins" ALTER COLUMN "emotion" SET DATA TYPE "public"."enum_habit_checkins_emotion" USING (
    CASE WHEN "emotion" IN ('calm', 'grateful', 'energized', 'overwhelmed', 'tired', 'anxious')
    THEN "emotion"::"public"."enum_habit_checkins_emotion"
    ELSE NULL END
  );`)
}
