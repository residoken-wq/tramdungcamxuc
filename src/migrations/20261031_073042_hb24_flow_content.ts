import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_habit_journey_content_diagnose_questions_stage" AS ENUM('cue', 'craving', 'response', 'reward');
  CREATE TYPE "public"."enum_habit_journey_content_diagnose_results_stage" AS ENUM('cue', 'craving', 'response', 'reward');
  CREATE TYPE "public"."enum_habit_journey_content_loop_stages_stage" AS ENUM('cue', 'craving', 'response', 'reward');
  CREATE TABLE "habit_journey_content_one_percent_unknowns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"body" varchar
  );
  
  CREATE TABLE "habit_journey_content_diagnose_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"source_label" varchar NOT NULL,
  	"source_url" varchar
  );
  
  CREATE TABLE "habit_journey_content_diagnose_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"statement" varchar NOT NULL,
  	"stage" "enum_habit_journey_content_diagnose_questions_stage" NOT NULL
  );
  
  CREATE TABLE "habit_journey_content_diagnose_results" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"stage" "enum_habit_journey_content_diagnose_results_stage" NOT NULL,
  	"title" varchar NOT NULL,
  	"suggestion" varchar NOT NULL
  );
  
  CREATE TABLE "habit_journey_content_loop_stages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"stage" "enum_habit_journey_content_loop_stages_stage" NOT NULL,
  	"title" varchar NOT NULL,
  	"explanation" varchar NOT NULL
  );
  
  CREATE TABLE "habit_journey_content_loop_rules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"body" varchar
  );
  
  ALTER TABLE "habit_journey_content" ADD COLUMN "diagnose_title" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "diagnose_intro" jsonb;
  ALTER TABLE "habit_journey_content" ADD COLUMN "diagnose_quote_text" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "diagnose_quote_author" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "diagnose_quote_source" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "diagnose_quote_source_url" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "diagnose_scale_min_label" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "diagnose_scale_max_label" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "loop_intro" jsonb;
  ALTER TABLE "habit_journey_content" ADD COLUMN "boarding_pass_caption_template" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "privacy_note" varchar;
  ALTER TABLE "habit_journey_content_one_percent_unknowns" ADD CONSTRAINT "habit_journey_content_one_percent_unknowns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."habit_journey_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "habit_journey_content_diagnose_stats" ADD CONSTRAINT "habit_journey_content_diagnose_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."habit_journey_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "habit_journey_content_diagnose_questions" ADD CONSTRAINT "habit_journey_content_diagnose_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."habit_journey_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "habit_journey_content_diagnose_results" ADD CONSTRAINT "habit_journey_content_diagnose_results_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."habit_journey_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "habit_journey_content_loop_stages" ADD CONSTRAINT "habit_journey_content_loop_stages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."habit_journey_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "habit_journey_content_loop_rules" ADD CONSTRAINT "habit_journey_content_loop_rules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."habit_journey_content"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "habit_journey_content_one_percent_unknowns_order_idx" ON "habit_journey_content_one_percent_unknowns" USING btree ("_order");
  CREATE INDEX "habit_journey_content_one_percent_unknowns_parent_id_idx" ON "habit_journey_content_one_percent_unknowns" USING btree ("_parent_id");
  CREATE INDEX "habit_journey_content_diagnose_stats_order_idx" ON "habit_journey_content_diagnose_stats" USING btree ("_order");
  CREATE INDEX "habit_journey_content_diagnose_stats_parent_id_idx" ON "habit_journey_content_diagnose_stats" USING btree ("_parent_id");
  CREATE INDEX "habit_journey_content_diagnose_questions_order_idx" ON "habit_journey_content_diagnose_questions" USING btree ("_order");
  CREATE INDEX "habit_journey_content_diagnose_questions_parent_id_idx" ON "habit_journey_content_diagnose_questions" USING btree ("_parent_id");
  CREATE INDEX "habit_journey_content_diagnose_results_order_idx" ON "habit_journey_content_diagnose_results" USING btree ("_order");
  CREATE INDEX "habit_journey_content_diagnose_results_parent_id_idx" ON "habit_journey_content_diagnose_results" USING btree ("_parent_id");
  CREATE INDEX "habit_journey_content_loop_stages_order_idx" ON "habit_journey_content_loop_stages" USING btree ("_order");
  CREATE INDEX "habit_journey_content_loop_stages_parent_id_idx" ON "habit_journey_content_loop_stages" USING btree ("_parent_id");
  CREATE INDEX "habit_journey_content_loop_rules_order_idx" ON "habit_journey_content_loop_rules" USING btree ("_order");
  CREATE INDEX "habit_journey_content_loop_rules_parent_id_idx" ON "habit_journey_content_loop_rules" USING btree ("_parent_id");`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "habit_journey_content_one_percent_unknowns" CASCADE;
  DROP TABLE "habit_journey_content_diagnose_stats" CASCADE;
  DROP TABLE "habit_journey_content_diagnose_questions" CASCADE;
  DROP TABLE "habit_journey_content_diagnose_results" CASCADE;
  DROP TABLE "habit_journey_content_loop_stages" CASCADE;
  DROP TABLE "habit_journey_content_loop_rules" CASCADE;
  ALTER TABLE "habit_journey_content" DROP COLUMN "diagnose_title";
  ALTER TABLE "habit_journey_content" DROP COLUMN "diagnose_intro";
  ALTER TABLE "habit_journey_content" DROP COLUMN "diagnose_quote_text";
  ALTER TABLE "habit_journey_content" DROP COLUMN "diagnose_quote_author";
  ALTER TABLE "habit_journey_content" DROP COLUMN "diagnose_quote_source";
  ALTER TABLE "habit_journey_content" DROP COLUMN "diagnose_quote_source_url";
  ALTER TABLE "habit_journey_content" DROP COLUMN "diagnose_scale_min_label";
  ALTER TABLE "habit_journey_content" DROP COLUMN "diagnose_scale_max_label";
  ALTER TABLE "habit_journey_content" DROP COLUMN "loop_intro";
  ALTER TABLE "habit_journey_content" DROP COLUMN "boarding_pass_caption_template";
  ALTER TABLE "habit_journey_content" DROP COLUMN "privacy_note";
  DROP TYPE "public"."enum_habit_journey_content_diagnose_questions_stage";
  DROP TYPE "public"."enum_habit_journey_content_diagnose_results_stage";
  DROP TYPE "public"."enum_habit_journey_content_loop_stages_stage";`)
}
