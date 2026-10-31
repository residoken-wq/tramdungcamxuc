import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."hjc_diag_stage" AS ENUM('cue', 'craving', 'response', 'reward');
  CREATE TABLE "hjc_diag_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"source" varchar NOT NULL,
  	"source_url" varchar
  );
  
  CREATE TABLE "hjc_diag_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"statement" varchar NOT NULL,
  	"stage" "hjc_diag_stage" NOT NULL,
  	"is_active" boolean DEFAULT true
  );
  
  ALTER TABLE "habit_journey_content" ADD COLUMN "diagnose_title" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "diagnose_intro" jsonb;
  ALTER TABLE "habit_journey_content" ADD COLUMN "diagnose_quote_text" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "diagnose_quote_author" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "diagnose_quote_source" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "diagnose_quote_source_url" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "diagnose_stage_results_cue_title" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "diagnose_stage_results_cue_suggestion" jsonb;
  ALTER TABLE "habit_journey_content" ADD COLUMN "diagnose_stage_results_cue_next_step_hint" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "diagnose_stage_results_craving_title" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "diagnose_stage_results_craving_suggestion" jsonb;
  ALTER TABLE "habit_journey_content" ADD COLUMN "diagnose_stage_results_craving_next_step_hint" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "diagnose_stage_results_response_title" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "diagnose_stage_results_response_suggestion" jsonb;
  ALTER TABLE "habit_journey_content" ADD COLUMN "diagnose_stage_results_response_next_step_hint" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "diagnose_stage_results_reward_title" varchar;
  ALTER TABLE "habit_journey_content" ADD COLUMN "diagnose_stage_results_reward_suggestion" jsonb;
  ALTER TABLE "habit_journey_content" ADD COLUMN "diagnose_stage_results_reward_next_step_hint" varchar;
  ALTER TABLE "hjc_diag_stats" ADD CONSTRAINT "hjc_diag_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."habit_journey_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hjc_diag_questions" ADD CONSTRAINT "hjc_diag_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."habit_journey_content"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "hjc_diag_stats_order_idx" ON "hjc_diag_stats" USING btree ("_order");
  CREATE INDEX "hjc_diag_stats_parent_id_idx" ON "hjc_diag_stats" USING btree ("_parent_id");
  CREATE INDEX "hjc_diag_questions_order_idx" ON "hjc_diag_questions" USING btree ("_order");
  CREATE INDEX "hjc_diag_questions_parent_id_idx" ON "hjc_diag_questions" USING btree ("_parent_id");`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "hjc_diag_stats" CASCADE;
  DROP TABLE "hjc_diag_questions" CASCADE;
  ALTER TABLE "habit_journey_content" DROP COLUMN "diagnose_title";
  ALTER TABLE "habit_journey_content" DROP COLUMN "diagnose_intro";
  ALTER TABLE "habit_journey_content" DROP COLUMN "diagnose_quote_text";
  ALTER TABLE "habit_journey_content" DROP COLUMN "diagnose_quote_author";
  ALTER TABLE "habit_journey_content" DROP COLUMN "diagnose_quote_source";
  ALTER TABLE "habit_journey_content" DROP COLUMN "diagnose_quote_source_url";
  ALTER TABLE "habit_journey_content" DROP COLUMN "diagnose_stage_results_cue_title";
  ALTER TABLE "habit_journey_content" DROP COLUMN "diagnose_stage_results_cue_suggestion";
  ALTER TABLE "habit_journey_content" DROP COLUMN "diagnose_stage_results_cue_next_step_hint";
  ALTER TABLE "habit_journey_content" DROP COLUMN "diagnose_stage_results_craving_title";
  ALTER TABLE "habit_journey_content" DROP COLUMN "diagnose_stage_results_craving_suggestion";
  ALTER TABLE "habit_journey_content" DROP COLUMN "diagnose_stage_results_craving_next_step_hint";
  ALTER TABLE "habit_journey_content" DROP COLUMN "diagnose_stage_results_response_title";
  ALTER TABLE "habit_journey_content" DROP COLUMN "diagnose_stage_results_response_suggestion";
  ALTER TABLE "habit_journey_content" DROP COLUMN "diagnose_stage_results_response_next_step_hint";
  ALTER TABLE "habit_journey_content" DROP COLUMN "diagnose_stage_results_reward_title";
  ALTER TABLE "habit_journey_content" DROP COLUMN "diagnose_stage_results_reward_suggestion";
  ALTER TABLE "habit_journey_content" DROP COLUMN "diagnose_stage_results_reward_next_step_hint";
  DROP TYPE "public"."hjc_diag_stage";`)
}
