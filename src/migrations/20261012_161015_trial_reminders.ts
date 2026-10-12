import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_trial_reminders_milestone" AS ENUM('day_18', 'day_21');
  CREATE TABLE "trial_reminders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"entitlement_id" integer,
  	"milestone" "enum_trial_reminders_milestone" NOT NULL,
  	"sent_at" timestamp(3) with time zone NOT NULL,
  	"reminder_key" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "trial_reminders_id" integer;
  ALTER TABLE "trial_reminders" ADD CONSTRAINT "trial_reminders_entitlement_id_entitlements_id_fk" FOREIGN KEY ("entitlement_id") REFERENCES "public"."entitlements"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "trial_reminders_entitlement_idx" ON "trial_reminders" USING btree ("entitlement_id");
  CREATE UNIQUE INDEX "trial_reminders_reminder_key_idx" ON "trial_reminders" USING btree ("reminder_key");
  CREATE INDEX "trial_reminders_updated_at_idx" ON "trial_reminders" USING btree ("updated_at");
  CREATE INDEX "trial_reminders_created_at_idx" ON "trial_reminders" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trial_reminders_fk" FOREIGN KEY ("trial_reminders_id") REFERENCES "public"."trial_reminders"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_trial_reminders_id_idx" ON "payload_locked_documents_rels" USING btree ("trial_reminders_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_trial_reminders_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_trial_reminders_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "trial_reminders_id";
  DROP TABLE IF EXISTS "trial_reminders" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_trial_reminders_milestone";`)
}
