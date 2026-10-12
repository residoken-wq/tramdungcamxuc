import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "workshop_reminders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"workshop_id" integer NOT NULL,
  	"customer_id" integer NOT NULL,
  	"sent_at" timestamp(3) with time zone NOT NULL,
  	"workshop_customer" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "workshop_reminders_id" integer;
  ALTER TABLE "workshop_reminders" ADD CONSTRAINT "workshop_reminders_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workshop_reminders" ADD CONSTRAINT "workshop_reminders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "workshop_reminders_workshop_idx" ON "workshop_reminders" USING btree ("workshop_id");
  CREATE INDEX "workshop_reminders_customer_idx" ON "workshop_reminders" USING btree ("customer_id");
  CREATE UNIQUE INDEX "workshop_reminders_workshop_customer_idx" ON "workshop_reminders" USING btree ("workshop_customer");
  CREATE INDEX "workshop_reminders_updated_at_idx" ON "workshop_reminders" USING btree ("updated_at");
  CREATE INDEX "workshop_reminders_created_at_idx" ON "workshop_reminders" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_workshop_reminders_fk" FOREIGN KEY ("workshop_reminders_id") REFERENCES "public"."workshop_reminders"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_workshop_reminders_id_idx" ON "payload_locked_documents_rels" USING btree ("workshop_reminders_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "workshop_reminders" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "workshop_reminders" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_workshop_reminders_fk";
  
  DROP INDEX "payload_locked_documents_rels_workshop_reminders_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "workshop_reminders_id";`)
}
