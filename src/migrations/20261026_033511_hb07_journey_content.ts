import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "habit_journey_content_stations_reflection_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL
  );
  
  CREATE TABLE "habit_journey_content_stations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"tagline" varchar
  );
  
  CREATE TABLE "habit_journey_content_quotes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"author" varchar NOT NULL,
  	"source" varchar NOT NULL,
  	"source_url" varchar,
  	"is_active" boolean DEFAULT true
  );
  
  CREATE TABLE "habit_journey_content_one_percent_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"statement" varchar NOT NULL,
  	"source_label" varchar NOT NULL,
  	"source_url" varchar
  );
  
  CREATE TABLE "habit_journey_content" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"one_percent_title" varchar,
  	"one_percent_intro" jsonb,
  	"one_percent_daily_percent" numeric DEFAULT 1,
  	"one_percent_max_days" numeric DEFAULT 365,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "techniques" ADD COLUMN "example_video_url" varchar;
  ALTER TABLE "_techniques_v" ADD COLUMN "version_example_video_url" varchar;
  ALTER TABLE "habit_journey_content_stations_reflection_questions" ADD CONSTRAINT "habit_journey_content_stations_reflection_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."habit_journey_content_stations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "habit_journey_content_stations" ADD CONSTRAINT "habit_journey_content_stations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."habit_journey_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "habit_journey_content_quotes" ADD CONSTRAINT "habit_journey_content_quotes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."habit_journey_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "habit_journey_content_one_percent_facts" ADD CONSTRAINT "habit_journey_content_one_percent_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."habit_journey_content"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "habit_journey_content_stations_reflection_questions_order_idx" ON "habit_journey_content_stations_reflection_questions" USING btree ("_order");
  CREATE INDEX "habit_journey_content_stations_reflection_questions_parent_id_idx" ON "habit_journey_content_stations_reflection_questions" USING btree ("_parent_id");
  CREATE INDEX "habit_journey_content_stations_order_idx" ON "habit_journey_content_stations" USING btree ("_order");
  CREATE INDEX "habit_journey_content_stations_parent_id_idx" ON "habit_journey_content_stations" USING btree ("_parent_id");
  CREATE INDEX "habit_journey_content_quotes_order_idx" ON "habit_journey_content_quotes" USING btree ("_order");
  CREATE INDEX "habit_journey_content_quotes_parent_id_idx" ON "habit_journey_content_quotes" USING btree ("_parent_id");
  CREATE INDEX "habit_journey_content_one_percent_facts_order_idx" ON "habit_journey_content_one_percent_facts" USING btree ("_order");
  CREATE INDEX "habit_journey_content_one_percent_facts_parent_id_idx" ON "habit_journey_content_one_percent_facts" USING btree ("_parent_id");`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "habit_journey_content_stations_reflection_questions" CASCADE;
  DROP TABLE "habit_journey_content_stations" CASCADE;
  DROP TABLE "habit_journey_content_quotes" CASCADE;
  DROP TABLE "habit_journey_content_one_percent_facts" CASCADE;
  DROP TABLE "habit_journey_content" CASCADE;
  ALTER TABLE "techniques" DROP COLUMN "example_video_url";
  ALTER TABLE "_techniques_v" DROP COLUMN "version_example_video_url";`)
}
