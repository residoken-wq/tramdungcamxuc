import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('owner', 'editor');
  CREATE TYPE "public"."enum_entitlements_source" AS ENUM('trial', 'order', 'package', 'manual', 'gift');
  CREATE TYPE "public"."enum_entitlements_status" AS ENUM('trial', 'active', 'expired');
  CREATE TYPE "public"."enum_orders_payment_status" AS ENUM('pending', 'paid', 'failed', 'cancelled');
  CREATE TYPE "public"."enum_orders_delivery_status" AS ENUM('none', 'access_granted', 'email_sent', 'scheduled');
  CREATE TYPE "public"."enum_discount_codes_type" AS ENUM('percent', 'fixed');
  CREATE TYPE "public"."enum_leads_need" AS ENUM('personal', 'business', 'resource');
  CREATE TYPE "public"."enum_leads_follow_up_status" AS ENUM('new', 'contacted', 'converted', 'closed');
  CREATE TYPE "public"."enum_habit_plans_scorecard_rating" AS ENUM('good', 'neutral', 'bad');
  CREATE TYPE "public"."enum_habit_checkins_emotion" AS ENUM('calm', 'grateful', 'energized', 'overwhelmed', 'tired', 'anxious');
  CREATE TYPE "public"."enum_diagnostic_results_top_stage" AS ENUM('cue', 'craving', 'response', 'reward');
  CREATE TABLE "customers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"name" varchar,
  	"phone" varchar,
  	"consent_marketing" boolean DEFAULT false,
  	"consent_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "entitlements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"customer_id" integer NOT NULL,
  	"product_id" integer NOT NULL,
  	"granted_at" timestamp(3) with time zone,
  	"source" "enum_entitlements_source" NOT NULL,
  	"status" "enum_entitlements_status" DEFAULT 'active' NOT NULL,
  	"expires_at" timestamp(3) with time zone,
  	"trial_key" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "orders_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer NOT NULL,
  	"price" numeric NOT NULL
  );
  
  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"customer_id" integer NOT NULL,
  	"subtotal" numeric,
  	"discount_code_id" integer,
  	"total" numeric NOT NULL,
  	"payment_ref" varchar,
  	"payment_status" "enum_orders_payment_status" DEFAULT 'pending' NOT NULL,
  	"delivery_status" "enum_orders_delivery_status" DEFAULT 'none',
  	"paid_at" timestamp(3) with time zone,
  	"terms_accepted_at" timestamp(3) with time zone NOT NULL,
  	"created_by_admin" boolean DEFAULT false,
  	"pay_token" varchar,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "discount_codes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"type" "enum_discount_codes_type" NOT NULL,
  	"value" numeric NOT NULL,
  	"valid_until" timestamp(3) with time zone,
  	"max_uses" numeric,
  	"used_count" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "discount_codes_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer
  );
  
  CREATE TABLE "leads_interest_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "leads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_form" varchar,
  	"source_page" varchar,
  	"source_utm" varchar,
  	"need" "enum_leads_need",
  	"name" varchar,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"message" varchar,
  	"consent" boolean DEFAULT false,
  	"follow_up_status" "enum_leads_follow_up_status" DEFAULT 'new',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "habit_plans_scorecard" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"habit" varchar NOT NULL,
  	"rating" "enum_habit_plans_scorecard_rating"
  );
  
  CREATE TABLE "habit_plans_chosen_techniques" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"technique_id" integer,
  	"action" varchar
  );
  
  CREATE TABLE "habit_plans" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"customer_id" integer,
  	"lead_email" varchar,
  	"identity_statement" varchar,
  	"start_date" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "habit_checkins" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"plan_id" integer NOT NULL,
  	"day" numeric NOT NULL,
  	"done" boolean DEFAULT false,
  	"emotion" "enum_habit_checkins_emotion",
  	"note" varchar,
  	"plan_day" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "saved_cards" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"customer_id" integer NOT NULL,
  	"card_id" integer NOT NULL,
  	"reflection" varchar,
  	"saved_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "diagnostic_results_answers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question_id" integer,
  	"score" numeric
  );
  
  CREATE TABLE "diagnostic_results" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar,
  	"top_stage" "enum_diagnostic_results_top_stage",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "certificates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"customer_id" integer NOT NULL,
  	"plan_id" integer,
  	"identity_statement" varchar,
  	"days_completed" numeric,
  	"issued_at" timestamp(3) with time zone,
  	"code" varchar,
  	"image45_id" integer,
  	"image916_id" integer,
  	"is_public" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "lesson_progress" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"customer_id" integer NOT NULL,
  	"lesson_id" integer NOT NULL,
  	"watched_percent" numeric DEFAULT 0,
  	"completed_at" timestamp(3) with time zone,
  	"customer_lesson" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "otp_codes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"code_hash" varchar NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"attempts" numeric DEFAULT 0,
  	"used_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payment_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_id" integer,
  	"provider" varchar NOT NULL,
  	"raw_payload" jsonb,
  	"signature_valid" boolean DEFAULT false,
  	"result" varchar,
  	"received_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "audit_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"actor_id" integer,
  	"action" varchar NOT NULL,
  	"target" varchar,
  	"before" jsonb,
  	"after" jsonb,
  	"at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users" ADD COLUMN "role" "enum_users_role" DEFAULT 'editor' NOT NULL;
  -- Admins created before roles existed keep full rights (they were the only admins).
  UPDATE "users" SET "role" = 'owner';
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "customers_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "entitlements_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "orders_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "discount_codes_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "leads_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "habit_plans_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "habit_checkins_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "saved_cards_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "diagnostic_results_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "certificates_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "lesson_progress_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "otp_codes_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "payment_events_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "audit_logs_id" integer;
  ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_discount_code_id_discount_codes_id_fk" FOREIGN KEY ("discount_code_id") REFERENCES "public"."discount_codes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "discount_codes_rels" ADD CONSTRAINT "discount_codes_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."discount_codes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "discount_codes_rels" ADD CONSTRAINT "discount_codes_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "leads_interest_tags" ADD CONSTRAINT "leads_interest_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "habit_plans_scorecard" ADD CONSTRAINT "habit_plans_scorecard_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."habit_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "habit_plans_chosen_techniques" ADD CONSTRAINT "habit_plans_chosen_techniques_technique_id_techniques_id_fk" FOREIGN KEY ("technique_id") REFERENCES "public"."techniques"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "habit_plans_chosen_techniques" ADD CONSTRAINT "habit_plans_chosen_techniques_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."habit_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "habit_plans" ADD CONSTRAINT "habit_plans_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "habit_checkins" ADD CONSTRAINT "habit_checkins_plan_id_habit_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."habit_plans"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "saved_cards" ADD CONSTRAINT "saved_cards_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "saved_cards" ADD CONSTRAINT "saved_cards_card_id_eq_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."eq_cards"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "diagnostic_results_answers" ADD CONSTRAINT "diagnostic_results_answers_question_id_diagnostic_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."diagnostic_questions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "diagnostic_results_answers" ADD CONSTRAINT "diagnostic_results_answers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."diagnostic_results"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "certificates" ADD CONSTRAINT "certificates_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "certificates" ADD CONSTRAINT "certificates_plan_id_habit_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."habit_plans"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "certificates" ADD CONSTRAINT "certificates_image45_id_media_id_fk" FOREIGN KEY ("image45_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "certificates" ADD CONSTRAINT "certificates_image916_id_media_id_fk" FOREIGN KEY ("image916_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "customers_email_idx" ON "customers" USING btree ("email");
  CREATE INDEX "customers_updated_at_idx" ON "customers" USING btree ("updated_at");
  CREATE INDEX "customers_created_at_idx" ON "customers" USING btree ("created_at");
  CREATE INDEX "entitlements_customer_idx" ON "entitlements" USING btree ("customer_id");
  CREATE INDEX "entitlements_product_idx" ON "entitlements" USING btree ("product_id");
  CREATE UNIQUE INDEX "entitlements_trial_key_idx" ON "entitlements" USING btree ("trial_key");
  CREATE INDEX "entitlements_updated_at_idx" ON "entitlements" USING btree ("updated_at");
  CREATE INDEX "entitlements_created_at_idx" ON "entitlements" USING btree ("created_at");
  CREATE INDEX "orders_items_order_idx" ON "orders_items" USING btree ("_order");
  CREATE INDEX "orders_items_parent_id_idx" ON "orders_items" USING btree ("_parent_id");
  CREATE INDEX "orders_items_product_idx" ON "orders_items" USING btree ("product_id");
  CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");
  CREATE INDEX "orders_discount_code_idx" ON "orders" USING btree ("discount_code_id");
  CREATE UNIQUE INDEX "orders_payment_ref_idx" ON "orders" USING btree ("payment_ref");
  CREATE UNIQUE INDEX "orders_pay_token_idx" ON "orders" USING btree ("pay_token");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE UNIQUE INDEX "discount_codes_code_idx" ON "discount_codes" USING btree ("code");
  CREATE INDEX "discount_codes_updated_at_idx" ON "discount_codes" USING btree ("updated_at");
  CREATE INDEX "discount_codes_created_at_idx" ON "discount_codes" USING btree ("created_at");
  CREATE INDEX "discount_codes_rels_order_idx" ON "discount_codes_rels" USING btree ("order");
  CREATE INDEX "discount_codes_rels_parent_idx" ON "discount_codes_rels" USING btree ("parent_id");
  CREATE INDEX "discount_codes_rels_path_idx" ON "discount_codes_rels" USING btree ("path");
  CREATE INDEX "discount_codes_rels_products_id_idx" ON "discount_codes_rels" USING btree ("products_id");
  CREATE INDEX "leads_interest_tags_order_idx" ON "leads_interest_tags" USING btree ("_order");
  CREATE INDEX "leads_interest_tags_parent_id_idx" ON "leads_interest_tags" USING btree ("_parent_id");
  CREATE INDEX "leads_email_idx" ON "leads" USING btree ("email");
  CREATE INDEX "leads_updated_at_idx" ON "leads" USING btree ("updated_at");
  CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");
  CREATE INDEX "habit_plans_scorecard_order_idx" ON "habit_plans_scorecard" USING btree ("_order");
  CREATE INDEX "habit_plans_scorecard_parent_id_idx" ON "habit_plans_scorecard" USING btree ("_parent_id");
  CREATE INDEX "habit_plans_chosen_techniques_order_idx" ON "habit_plans_chosen_techniques" USING btree ("_order");
  CREATE INDEX "habit_plans_chosen_techniques_parent_id_idx" ON "habit_plans_chosen_techniques" USING btree ("_parent_id");
  CREATE INDEX "habit_plans_chosen_techniques_technique_idx" ON "habit_plans_chosen_techniques" USING btree ("technique_id");
  CREATE INDEX "habit_plans_customer_idx" ON "habit_plans" USING btree ("customer_id");
  CREATE INDEX "habit_plans_updated_at_idx" ON "habit_plans" USING btree ("updated_at");
  CREATE INDEX "habit_plans_created_at_idx" ON "habit_plans" USING btree ("created_at");
  CREATE INDEX "habit_checkins_plan_idx" ON "habit_checkins" USING btree ("plan_id");
  CREATE UNIQUE INDEX "habit_checkins_plan_day_idx" ON "habit_checkins" USING btree ("plan_day");
  CREATE INDEX "habit_checkins_updated_at_idx" ON "habit_checkins" USING btree ("updated_at");
  CREATE INDEX "habit_checkins_created_at_idx" ON "habit_checkins" USING btree ("created_at");
  CREATE INDEX "saved_cards_customer_idx" ON "saved_cards" USING btree ("customer_id");
  CREATE INDEX "saved_cards_card_idx" ON "saved_cards" USING btree ("card_id");
  CREATE INDEX "saved_cards_updated_at_idx" ON "saved_cards" USING btree ("updated_at");
  CREATE INDEX "saved_cards_created_at_idx" ON "saved_cards" USING btree ("created_at");
  CREATE INDEX "diagnostic_results_answers_order_idx" ON "diagnostic_results_answers" USING btree ("_order");
  CREATE INDEX "diagnostic_results_answers_parent_id_idx" ON "diagnostic_results_answers" USING btree ("_parent_id");
  CREATE INDEX "diagnostic_results_answers_question_idx" ON "diagnostic_results_answers" USING btree ("question_id");
  CREATE INDEX "diagnostic_results_updated_at_idx" ON "diagnostic_results" USING btree ("updated_at");
  CREATE INDEX "diagnostic_results_created_at_idx" ON "diagnostic_results" USING btree ("created_at");
  CREATE INDEX "certificates_customer_idx" ON "certificates" USING btree ("customer_id");
  CREATE INDEX "certificates_plan_idx" ON "certificates" USING btree ("plan_id");
  CREATE UNIQUE INDEX "certificates_code_idx" ON "certificates" USING btree ("code");
  CREATE INDEX "certificates_image45_idx" ON "certificates" USING btree ("image45_id");
  CREATE INDEX "certificates_image916_idx" ON "certificates" USING btree ("image916_id");
  CREATE INDEX "certificates_updated_at_idx" ON "certificates" USING btree ("updated_at");
  CREATE INDEX "certificates_created_at_idx" ON "certificates" USING btree ("created_at");
  CREATE INDEX "lesson_progress_customer_idx" ON "lesson_progress" USING btree ("customer_id");
  CREATE INDEX "lesson_progress_lesson_idx" ON "lesson_progress" USING btree ("lesson_id");
  CREATE UNIQUE INDEX "lesson_progress_customer_lesson_idx" ON "lesson_progress" USING btree ("customer_lesson");
  CREATE INDEX "lesson_progress_updated_at_idx" ON "lesson_progress" USING btree ("updated_at");
  CREATE INDEX "lesson_progress_created_at_idx" ON "lesson_progress" USING btree ("created_at");
  CREATE INDEX "otp_codes_email_idx" ON "otp_codes" USING btree ("email");
  CREATE INDEX "otp_codes_updated_at_idx" ON "otp_codes" USING btree ("updated_at");
  CREATE INDEX "otp_codes_created_at_idx" ON "otp_codes" USING btree ("created_at");
  CREATE INDEX "payment_events_order_idx" ON "payment_events" USING btree ("order_id");
  CREATE INDEX "payment_events_updated_at_idx" ON "payment_events" USING btree ("updated_at");
  CREATE INDEX "payment_events_created_at_idx" ON "payment_events" USING btree ("created_at");
  CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_id");
  CREATE INDEX "audit_logs_updated_at_idx" ON "audit_logs" USING btree ("updated_at");
  CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_customers_fk" FOREIGN KEY ("customers_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_entitlements_fk" FOREIGN KEY ("entitlements_id") REFERENCES "public"."entitlements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_discount_codes_fk" FOREIGN KEY ("discount_codes_id") REFERENCES "public"."discount_codes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_leads_fk" FOREIGN KEY ("leads_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_habit_plans_fk" FOREIGN KEY ("habit_plans_id") REFERENCES "public"."habit_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_habit_checkins_fk" FOREIGN KEY ("habit_checkins_id") REFERENCES "public"."habit_checkins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_saved_cards_fk" FOREIGN KEY ("saved_cards_id") REFERENCES "public"."saved_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_diagnostic_results_fk" FOREIGN KEY ("diagnostic_results_id") REFERENCES "public"."diagnostic_results"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_certificates_fk" FOREIGN KEY ("certificates_id") REFERENCES "public"."certificates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lesson_progress_fk" FOREIGN KEY ("lesson_progress_id") REFERENCES "public"."lesson_progress"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_otp_codes_fk" FOREIGN KEY ("otp_codes_id") REFERENCES "public"."otp_codes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payment_events_fk" FOREIGN KEY ("payment_events_id") REFERENCES "public"."payment_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_logs_fk" FOREIGN KEY ("audit_logs_id") REFERENCES "public"."audit_logs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_customers_id_idx" ON "payload_locked_documents_rels" USING btree ("customers_id");
  CREATE INDEX "payload_locked_documents_rels_entitlements_id_idx" ON "payload_locked_documents_rels" USING btree ("entitlements_id");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_discount_codes_id_idx" ON "payload_locked_documents_rels" USING btree ("discount_codes_id");
  CREATE INDEX "payload_locked_documents_rels_leads_id_idx" ON "payload_locked_documents_rels" USING btree ("leads_id");
  CREATE INDEX "payload_locked_documents_rels_habit_plans_id_idx" ON "payload_locked_documents_rels" USING btree ("habit_plans_id");
  CREATE INDEX "payload_locked_documents_rels_habit_checkins_id_idx" ON "payload_locked_documents_rels" USING btree ("habit_checkins_id");
  CREATE INDEX "payload_locked_documents_rels_saved_cards_id_idx" ON "payload_locked_documents_rels" USING btree ("saved_cards_id");
  CREATE INDEX "payload_locked_documents_rels_diagnostic_results_id_idx" ON "payload_locked_documents_rels" USING btree ("diagnostic_results_id");
  CREATE INDEX "payload_locked_documents_rels_certificates_id_idx" ON "payload_locked_documents_rels" USING btree ("certificates_id");
  CREATE INDEX "payload_locked_documents_rels_lesson_progress_id_idx" ON "payload_locked_documents_rels" USING btree ("lesson_progress_id");
  CREATE INDEX "payload_locked_documents_rels_otp_codes_id_idx" ON "payload_locked_documents_rels" USING btree ("otp_codes_id");
  CREATE INDEX "payload_locked_documents_rels_payment_events_id_idx" ON "payload_locked_documents_rels" USING btree ("payment_events_id");
  CREATE INDEX "payload_locked_documents_rels_audit_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_logs_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "customers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "entitlements" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "discount_codes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "discount_codes_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "leads_interest_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "leads" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "habit_plans_scorecard" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "habit_plans_chosen_techniques" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "habit_plans" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "habit_checkins" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "saved_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "diagnostic_results_answers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "diagnostic_results" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "certificates" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lesson_progress" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "otp_codes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payment_events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "audit_logs" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "customers" CASCADE;
  DROP TABLE "entitlements" CASCADE;
  DROP TABLE "orders_items" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "discount_codes" CASCADE;
  DROP TABLE "discount_codes_rels" CASCADE;
  DROP TABLE "leads_interest_tags" CASCADE;
  DROP TABLE "leads" CASCADE;
  DROP TABLE "habit_plans_scorecard" CASCADE;
  DROP TABLE "habit_plans_chosen_techniques" CASCADE;
  DROP TABLE "habit_plans" CASCADE;
  DROP TABLE "habit_checkins" CASCADE;
  DROP TABLE "saved_cards" CASCADE;
  DROP TABLE "diagnostic_results_answers" CASCADE;
  DROP TABLE "diagnostic_results" CASCADE;
  DROP TABLE "certificates" CASCADE;
  DROP TABLE "lesson_progress" CASCADE;
  DROP TABLE "otp_codes" CASCADE;
  DROP TABLE "payment_events" CASCADE;
  DROP TABLE "audit_logs" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_customers_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_entitlements_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_orders_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_discount_codes_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_leads_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_habit_plans_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_habit_checkins_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_saved_cards_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_diagnostic_results_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_certificates_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_lesson_progress_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_otp_codes_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_payment_events_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_audit_logs_fk";
  
  DROP INDEX "payload_locked_documents_rels_customers_id_idx";
  DROP INDEX "payload_locked_documents_rels_entitlements_id_idx";
  DROP INDEX "payload_locked_documents_rels_orders_id_idx";
  DROP INDEX "payload_locked_documents_rels_discount_codes_id_idx";
  DROP INDEX "payload_locked_documents_rels_leads_id_idx";
  DROP INDEX "payload_locked_documents_rels_habit_plans_id_idx";
  DROP INDEX "payload_locked_documents_rels_habit_checkins_id_idx";
  DROP INDEX "payload_locked_documents_rels_saved_cards_id_idx";
  DROP INDEX "payload_locked_documents_rels_diagnostic_results_id_idx";
  DROP INDEX "payload_locked_documents_rels_certificates_id_idx";
  DROP INDEX "payload_locked_documents_rels_lesson_progress_id_idx";
  DROP INDEX "payload_locked_documents_rels_otp_codes_id_idx";
  DROP INDEX "payload_locked_documents_rels_payment_events_id_idx";
  DROP INDEX "payload_locked_documents_rels_audit_logs_id_idx";
  ALTER TABLE "users" DROP COLUMN "role";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "customers_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "entitlements_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "orders_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "discount_codes_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "leads_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "habit_plans_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "habit_checkins_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "saved_cards_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "diagnostic_results_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "certificates_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "lesson_progress_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "otp_codes_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "payment_events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "audit_logs_id";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_entitlements_source";
  DROP TYPE "public"."enum_entitlements_status";
  DROP TYPE "public"."enum_orders_payment_status";
  DROP TYPE "public"."enum_orders_delivery_status";
  DROP TYPE "public"."enum_discount_codes_type";
  DROP TYPE "public"."enum_leads_need";
  DROP TYPE "public"."enum_leads_follow_up_status";
  DROP TYPE "public"."enum_habit_plans_scorecard_rating";
  DROP TYPE "public"."enum_habit_checkins_emotion";
  DROP TYPE "public"."enum_diagnostic_results_top_stage";`)
}
