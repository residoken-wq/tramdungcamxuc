import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "habit_reflections_answers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" varchar
  );
  
  CREATE TABLE "habit_reflections" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"customer_id" integer NOT NULL,
  	"plan_id" integer NOT NULL,
  	"station_index" numeric NOT NULL,
  	"reflection_key" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "habit_reflections_id" integer;
  ALTER TABLE "habit_reflections_answers" ADD CONSTRAINT "habit_reflections_answers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."habit_reflections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "habit_reflections" ADD CONSTRAINT "habit_reflections_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "habit_reflections" ADD CONSTRAINT "habit_reflections_plan_id_habit_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."habit_plans"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "habit_reflections_answers_order_idx" ON "habit_reflections_answers" USING btree ("_order");
  CREATE INDEX "habit_reflections_answers_parent_id_idx" ON "habit_reflections_answers" USING btree ("_parent_id");
  CREATE INDEX "habit_reflections_customer_idx" ON "habit_reflections" USING btree ("customer_id");
  CREATE INDEX "habit_reflections_plan_idx" ON "habit_reflections" USING btree ("plan_id");
  CREATE UNIQUE INDEX "habit_reflections_reflection_key_idx" ON "habit_reflections" USING btree ("reflection_key");
  CREATE INDEX "habit_reflections_updated_at_idx" ON "habit_reflections" USING btree ("updated_at");
  CREATE INDEX "habit_reflections_created_at_idx" ON "habit_reflections" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_habit_reflections_fk" FOREIGN KEY ("habit_reflections_id") REFERENCES "public"."habit_reflections"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_habit_reflections_id_idx" ON "payload_locked_documents_rels" USING btree ("habit_reflections_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "habit_reflections_answers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "habit_reflections" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "habit_reflections_answers" CASCADE;
  DROP TABLE "habit_reflections" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_habit_reflections_fk";
  
  DROP INDEX "payload_locked_documents_rels_habit_reflections_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "habit_reflections_id";`)
}
