import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_web" AS ENUM('site', 'habit', 'eq');
  CREATE TYPE "public"."enum_products_type" AS ENUM('ebook', 'toolkit', 'digital_tool', 'physical_external', 'workshop', 'community', 'coaching_trial', 'package', 'b2b');
  CREATE TYPE "public"."enum_products_journey_step" AS ENUM('pause', 'feel', 'name', 'choose', 'practice');
  CREATE TYPE "public"."enum_products_cta_type" AS ENUM('buy', 'download', 'book', 'contact', 'external');
  CREATE TYPE "public"."enum_products_sale_status" AS ENUM('coming_soon', 'on_sale', 'free', 'consult', 'hidden');
  CREATE TYPE "public"."enum_products_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__products_v_version_web" AS ENUM('site', 'habit', 'eq');
  CREATE TYPE "public"."enum__products_v_version_type" AS ENUM('ebook', 'toolkit', 'digital_tool', 'physical_external', 'workshop', 'community', 'coaching_trial', 'package', 'b2b');
  CREATE TYPE "public"."enum__products_v_version_journey_step" AS ENUM('pause', 'feel', 'name', 'choose', 'practice');
  CREATE TYPE "public"."enum__products_v_version_cta_type" AS ENUM('buy', 'download', 'book', 'contact', 'external');
  CREATE TYPE "public"."enum__products_v_version_sale_status" AS ENUM('coming_soon', 'on_sale', 'free', 'consult', 'hidden');
  CREATE TYPE "public"."enum__products_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_services_price_mode" AS ENUM('fixed', 'quote');
  CREATE TYPE "public"."enum_services_sale_status" AS ENUM('coming_soon', 'on_sale', 'free', 'consult', 'hidden');
  CREATE TYPE "public"."enum_services_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__services_v_version_price_mode" AS ENUM('fixed', 'quote');
  CREATE TYPE "public"."enum__services_v_version_sale_status" AS ENUM('coming_soon', 'on_sale', 'free', 'consult', 'hidden');
  CREATE TYPE "public"."enum__services_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_programs_sale_status" AS ENUM('coming_soon', 'on_sale', 'free', 'consult', 'hidden');
  CREATE TYPE "public"."enum_programs_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__programs_v_version_sale_status" AS ENUM('coming_soon', 'on_sale', 'free', 'consult', 'hidden');
  CREATE TYPE "public"."enum__programs_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_posts_topic" AS ENUM('eq', 'habit', 'career');
  CREATE TYPE "public"."enum_posts_format" AS ENUM('article', 'video');
  CREATE TYPE "public"."enum_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__posts_v_version_topic" AS ENUM('eq', 'habit', 'career');
  CREATE TYPE "public"."enum__posts_v_version_format" AS ENUM('article', 'video');
  CREATE TYPE "public"."enum__posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_testimonials_language" AS ENUM('vi', 'en');
  CREATE TYPE "public"."enum_testimonials_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__testimonials_v_version_language" AS ENUM('vi', 'en');
  CREATE TYPE "public"."enum__testimonials_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_eq_cards_topic" AS ENUM('eq', 'habit', 'career');
  CREATE TYPE "public"."enum_eq_cards_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__eq_cards_v_version_topic" AS ENUM('eq', 'habit', 'career');
  CREATE TYPE "public"."enum__eq_cards_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_course_modules_group" AS ENUM('insight', 'principle', 'technique');
  CREATE TYPE "public"."enum_course_modules_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__course_modules_v_version_group" AS ENUM('insight', 'principle', 'technique');
  CREATE TYPE "public"."enum__course_modules_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_lessons_stage" AS ENUM('cue', 'craving', 'response', 'reward', 'none');
  CREATE TYPE "public"."enum_lessons_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__lessons_v_version_stage" AS ENUM('cue', 'craving', 'response', 'reward', 'none');
  CREATE TYPE "public"."enum__lessons_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_diagnostic_questions_stage" AS ENUM('cue', 'craving', 'response', 'reward');
  CREATE TYPE "public"."enum_diagnostic_questions_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__diagnostic_questions_v_version_stage" AS ENUM('cue', 'craving', 'response', 'reward');
  CREATE TYPE "public"."enum__diagnostic_questions_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_techniques_stage" AS ENUM('cue', 'craving', 'response', 'reward');
  CREATE TYPE "public"."enum_techniques_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__techniques_v_version_stage" AS ENUM('cue', 'craving', 'response', 'reward');
  CREATE TYPE "public"."enum__techniques_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_legal_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__legal_pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_workshops_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__workshops_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_pages_template" AS ENUM('campaign', 'service', 'workshop', 'event');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_version_template" AS ENUM('campaign', 'service', 'workshop', 'event');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_site_settings_analytics_provider" AS ENUM('none', 'ga4', 'plausible');
  CREATE TYPE "public"."enum_navigation_main_menu_link_type" AS ENUM('page', 'url');
  CREATE TYPE "public"."enum_navigation_footer_menu_link_type" AS ENUM('page', 'url');
  CREATE TABLE "products_audience" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "products_includes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "products_files" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"file_id" integer
  );
  
  CREATE TABLE "products_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "products_components" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"quantity" numeric,
  	"unit_value" numeric,
  	"retail_price" numeric,
  	"grants_product_id" integer
  );
  
  CREATE TABLE "products" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"slug" varchar,
  	"web" "enum_products_web",
  	"type" "enum_products_type",
  	"journey_step" "enum_products_journey_step",
  	"pain_point" varchar,
  	"outcome" varchar,
  	"short_description" varchar,
  	"description" jsonb,
  	"preview_id" integer,
  	"price" numeric,
  	"sale_price" numeric,
  	"sale_ends_at" timestamp(3) with time zone,
  	"cover_image_id" integer,
  	"cta_label" varchar,
  	"cta_type" "enum_products_cta_type",
  	"sale_status" "enum_products_sale_status" DEFAULT 'consult',
  	"order" numeric DEFAULT 0,
  	"trial_days" numeric DEFAULT 0,
  	"access_duration_days" numeric,
  	"external_url" varchar,
  	"external_label" varchar,
  	"total_value" numeric,
  	"discount_percent" numeric,
  	"is_sample" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_products_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "products_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer
  );
  
  CREATE TABLE "_products_v_version_audience" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v_version_includes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v_version_files" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"file_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v_version_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v_version_components" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"quantity" numeric,
  	"unit_value" numeric,
  	"retail_price" numeric,
  	"grants_product_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_slug" varchar,
  	"version_web" "enum__products_v_version_web",
  	"version_type" "enum__products_v_version_type",
  	"version_journey_step" "enum__products_v_version_journey_step",
  	"version_pain_point" varchar,
  	"version_outcome" varchar,
  	"version_short_description" varchar,
  	"version_description" jsonb,
  	"version_preview_id" integer,
  	"version_price" numeric,
  	"version_sale_price" numeric,
  	"version_sale_ends_at" timestamp(3) with time zone,
  	"version_cover_image_id" integer,
  	"version_cta_label" varchar,
  	"version_cta_type" "enum__products_v_version_cta_type",
  	"version_sale_status" "enum__products_v_version_sale_status" DEFAULT 'consult',
  	"version_order" numeric DEFAULT 0,
  	"version_trial_days" numeric DEFAULT 0,
  	"version_access_duration_days" numeric,
  	"version_external_url" varchar,
  	"version_external_label" varchar,
  	"version_total_value" numeric,
  	"version_discount_percent" numeric,
  	"version_is_sample" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__products_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_products_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer
  );
  
  CREATE TABLE "services_situations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "services_outcomes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "services_process" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "services" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"slug" varchar,
  	"audience" varchar,
  	"duration" varchar,
  	"format" varchar,
  	"price_mode" "enum_services_price_mode" DEFAULT 'quote',
  	"price" numeric,
  	"booking_url" varchar,
  	"cta_label" varchar,
  	"sale_status" "enum_services_sale_status" DEFAULT 'consult',
  	"is_sample" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_services_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "services_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"testimonials_id" integer
  );
  
  CREATE TABLE "_services_v_version_situations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_version_outcomes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_version_process" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_slug" varchar,
  	"version_audience" varchar,
  	"version_duration" varchar,
  	"version_format" varchar,
  	"version_price_mode" "enum__services_v_version_price_mode" DEFAULT 'quote',
  	"version_price" numeric,
  	"version_booking_url" varchar,
  	"version_cta_label" varchar,
  	"version_sale_status" "enum__services_v_version_sale_status" DEFAULT 'consult',
  	"version_is_sample" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__services_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_services_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"testimonials_id" integer
  );
  
  CREATE TABLE "programs_target_behaviors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "programs_deliverables" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "programs_case_studies" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "programs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"slug" varchar,
  	"learner_group" varchar,
  	"format" varchar,
  	"duration" varchar,
  	"follow_up" varchar,
  	"measurement" varchar,
  	"cta_label" varchar,
  	"sale_status" "enum_programs_sale_status" DEFAULT 'consult',
  	"is_sample" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_programs_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_programs_v_version_target_behaviors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_programs_v_version_deliverables" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_programs_v_version_case_studies" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_programs_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_slug" varchar,
  	"version_learner_group" varchar,
  	"version_format" varchar,
  	"version_duration" varchar,
  	"version_follow_up" varchar,
  	"version_measurement" varchar,
  	"version_cta_label" varchar,
  	"version_sale_status" "enum__programs_v_version_sale_status" DEFAULT 'consult',
  	"version_is_sample" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__programs_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"series" varchar,
  	"topic" "enum_posts_topic",
  	"format" "enum_posts_format" DEFAULT 'article',
  	"thumbnail_id" integer,
  	"video_url" varchar,
  	"content" jsonb,
  	"cta_product_id" integer,
  	"lead_magnet_id" integer,
  	"is_sample" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_posts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_posts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_series" varchar,
  	"version_topic" "enum__posts_v_version_topic",
  	"version_format" "enum__posts_v_version_format" DEFAULT 'article',
  	"version_thumbnail_id" integer,
  	"version_video_url" varchar,
  	"version_content" jsonb,
  	"version_cta_product_id" integer,
  	"version_lead_magnet_id" integer,
  	"version_is_sample" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "testimonials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"quote" varchar,
  	"language" "enum_testimonials_language" DEFAULT 'vi',
  	"consent" boolean DEFAULT false,
  	"photo_id" integer,
  	"is_sample" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_testimonials_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "testimonials_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer,
  	"services_id" integer,
  	"programs_id" integer
  );
  
  CREATE TABLE "_testimonials_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_role" varchar,
  	"version_quote" varchar,
  	"version_language" "enum__testimonials_v_version_language" DEFAULT 'vi',
  	"version_consent" boolean DEFAULT false,
  	"version_photo_id" integer,
  	"version_is_sample" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__testimonials_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_testimonials_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer,
  	"services_id" integer,
  	"programs_id" integer
  );
  
  CREATE TABLE "eq_cards_emotion_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "eq_cards" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar,
  	"message" varchar,
  	"story" jsonb,
  	"reflection_prompt" varchar,
  	"small_action" varchar,
  	"topic" "enum_eq_cards_topic",
  	"related_product_id" integer,
  	"image_id" integer,
  	"share_image45_id" integer,
  	"share_image916_id" integer,
  	"qr_slug" varchar,
  	"printed_at" timestamp(3) with time zone,
  	"order" numeric DEFAULT 0,
  	"is_sample" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_eq_cards_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_eq_cards_v_version_emotion_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_eq_cards_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_code" varchar,
  	"version_message" varchar,
  	"version_story" jsonb,
  	"version_reflection_prompt" varchar,
  	"version_small_action" varchar,
  	"version_topic" "enum__eq_cards_v_version_topic",
  	"version_related_product_id" integer,
  	"version_image_id" integer,
  	"version_share_image45_id" integer,
  	"version_share_image916_id" integer,
  	"version_qr_slug" varchar,
  	"version_printed_at" timestamp(3) with time zone,
  	"version_order" numeric DEFAULT 0,
  	"version_is_sample" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__eq_cards_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "course_modules" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"group" "enum_course_modules_group",
  	"order" numeric DEFAULT 0,
  	"is_sample" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_course_modules_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_course_modules_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_group" "enum__course_modules_v_version_group",
  	"version_order" numeric DEFAULT 0,
  	"version_is_sample" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__course_modules_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "lessons_downloadables" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"file_id" integer
  );
  
  CREATE TABLE "lessons" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"module_id" integer,
  	"title" varchar,
  	"summary" varchar,
  	"video_id" varchar,
  	"duration_sec" numeric,
  	"stage" "enum_lessons_stage",
  	"order" numeric DEFAULT 0,
  	"is_free_preview" boolean DEFAULT false,
  	"is_sample" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_lessons_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_lessons_v_version_downloadables" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"file_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_lessons_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_module_id" integer,
  	"version_title" varchar,
  	"version_summary" varchar,
  	"version_video_id" varchar,
  	"version_duration_sec" numeric,
  	"version_stage" "enum__lessons_v_version_stage",
  	"version_order" numeric DEFAULT 0,
  	"version_is_free_preview" boolean DEFAULT false,
  	"version_is_sample" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__lessons_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "diagnostic_questions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"statement" varchar,
  	"stage" "enum_diagnostic_questions_stage",
  	"suggestion" jsonb,
  	"order" numeric DEFAULT 0,
  	"is_sample" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_diagnostic_questions_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_diagnostic_questions_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_statement" varchar,
  	"version_stage" "enum__diagnostic_questions_v_version_stage",
  	"version_suggestion" jsonb,
  	"version_order" numeric DEFAULT 0,
  	"version_is_sample" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__diagnostic_questions_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "techniques" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"stage" "enum_techniques_stage",
  	"how_to" jsonb,
  	"example" jsonb,
  	"lesson_id" integer,
  	"is_sample" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_techniques_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_techniques_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_stage" "enum__techniques_v_version_stage",
  	"version_how_to" jsonb,
  	"version_example" jsonb,
  	"version_lesson_id" integer,
  	"version_is_sample" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__techniques_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "legal_pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"content" jsonb,
  	"last_updated" timestamp(3) with time zone,
  	"order" numeric DEFAULT 0,
  	"is_sample" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_legal_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_legal_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_content" jsonb,
  	"version_last_updated" timestamp(3) with time zone,
  	"version_order" numeric DEFAULT 0,
  	"version_is_sample" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__legal_pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "workshops" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"product_id" integer,
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"join_url" varchar,
  	"is_sample" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_workshops_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "workshops_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer
  );
  
  CREATE TABLE "_workshops_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_product_id" integer,
  	"version_starts_at" timestamp(3) with time zone,
  	"version_ends_at" timestamp(3) with time zone,
  	"version_join_url" varchar,
  	"version_is_sample" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__workshops_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_workshops_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"puck_data" jsonb,
  	"template" "enum_pages_template",
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_og_image_id" integer,
  	"is_sample" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_puck_data" jsonb,
  	"version_template" "enum__pages_v_version_template",
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_og_image_id" integer,
  	"version_is_sample" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"tagline" varchar,
  	"brand_ascii" varchar DEFAULT 'TRAM DUNG CAM XUC',
  	"domain" varchar DEFAULT 'tramdungcamxuc.com',
  	"analytics_provider" "enum_site_settings_analytics_provider" DEFAULT 'none',
  	"analytics_measurement_id" varchar,
  	"analytics_plausible_domain" varchar,
  	"bank_bin" varchar,
  	"bank_name" varchar,
  	"account_number" varchar,
  	"account_name" varchar,
  	"transfer_prefix" varchar DEFAULT 'TDCX',
  	"trial_credit_applies" boolean DEFAULT false,
  	"email" varchar,
  	"linked_in_url" varchar,
  	"zalo_group_url" varchar,
  	"zalo_chat_url" varchar,
  	"show_floating_chat" boolean DEFAULT false,
  	"shopee_store_url" varchar,
  	"seller_info_name" varchar,
  	"seller_info_tax_code" varchar,
  	"seller_info_address" varchar,
  	"seller_info_phone" varchar,
  	"seller_info_email" varchar,
  	"certificate_min_days" numeric DEFAULT 15,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "navigation_main_menu" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"link_type" "enum_navigation_main_menu_link_type" DEFAULT 'page' NOT NULL,
  	"page_id" integer,
  	"url" varchar,
  	"highlight" boolean DEFAULT false
  );
  
  CREATE TABLE "navigation_footer_menu" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"link_type" "enum_navigation_footer_menu_link_type" DEFAULT 'page' NOT NULL,
  	"page_id" integer,
  	"url" varchar,
  	"highlight" boolean DEFAULT false
  );
  
  CREATE TABLE "navigation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "media" ADD COLUMN "is_sample" boolean DEFAULT false;
  ALTER TABLE "media" ADD COLUMN "prefix" varchar DEFAULT '';
  ALTER TABLE "media" ADD COLUMN "_objectkey" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "products_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "services_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "programs_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "posts_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "testimonials_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "eq_cards_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "course_modules_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "lessons_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "diagnostic_questions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "techniques_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "legal_pages_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "workshops_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pages_id" integer;
  ALTER TABLE "products_audience" ADD CONSTRAINT "products_audience_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_includes" ADD CONSTRAINT "products_includes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_files" ADD CONSTRAINT "products_files_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_files" ADD CONSTRAINT "products_files_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_faq" ADD CONSTRAINT "products_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_components" ADD CONSTRAINT "products_components_grants_product_id_products_id_fk" FOREIGN KEY ("grants_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_components" ADD CONSTRAINT "products_components_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_preview_id_media_id_fk" FOREIGN KEY ("preview_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_audience" ADD CONSTRAINT "_products_v_version_audience_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_includes" ADD CONSTRAINT "_products_v_version_includes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_files" ADD CONSTRAINT "_products_v_version_files_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_version_files" ADD CONSTRAINT "_products_v_version_files_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_faq" ADD CONSTRAINT "_products_v_version_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_components" ADD CONSTRAINT "_products_v_version_components_grants_product_id_products_id_fk" FOREIGN KEY ("grants_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_version_components" ADD CONSTRAINT "_products_v_version_components_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_parent_id_products_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_preview_id_media_id_fk" FOREIGN KEY ("version_preview_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_situations" ADD CONSTRAINT "services_situations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_outcomes" ADD CONSTRAINT "services_outcomes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_process" ADD CONSTRAINT "services_process_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_version_situations" ADD CONSTRAINT "_services_v_version_situations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_version_outcomes" ADD CONSTRAINT "_services_v_version_outcomes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_version_process" ADD CONSTRAINT "_services_v_version_process_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v" ADD CONSTRAINT "_services_v_parent_id_services_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_target_behaviors" ADD CONSTRAINT "programs_target_behaviors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_deliverables" ADD CONSTRAINT "programs_deliverables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programs_case_studies" ADD CONSTRAINT "programs_case_studies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_programs_v_version_target_behaviors" ADD CONSTRAINT "_programs_v_version_target_behaviors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_programs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_programs_v_version_deliverables" ADD CONSTRAINT "_programs_v_version_deliverables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_programs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_programs_v_version_case_studies" ADD CONSTRAINT "_programs_v_version_case_studies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_programs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_programs_v" ADD CONSTRAINT "_programs_v_parent_id_programs_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_cta_product_id_products_id_fk" FOREIGN KEY ("cta_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_lead_magnet_id_products_id_fk" FOREIGN KEY ("lead_magnet_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_thumbnail_id_media_id_fk" FOREIGN KEY ("version_thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_cta_product_id_products_id_fk" FOREIGN KEY ("version_cta_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_lead_magnet_id_products_id_fk" FOREIGN KEY ("version_lead_magnet_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "testimonials_rels" ADD CONSTRAINT "testimonials_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "testimonials_rels" ADD CONSTRAINT "testimonials_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "testimonials_rels" ADD CONSTRAINT "testimonials_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "testimonials_rels" ADD CONSTRAINT "testimonials_rels_programs_fk" FOREIGN KEY ("programs_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_testimonials_v" ADD CONSTRAINT "_testimonials_v_parent_id_testimonials_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."testimonials"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_testimonials_v" ADD CONSTRAINT "_testimonials_v_version_photo_id_media_id_fk" FOREIGN KEY ("version_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_testimonials_v_rels" ADD CONSTRAINT "_testimonials_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_testimonials_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_testimonials_v_rels" ADD CONSTRAINT "_testimonials_v_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_testimonials_v_rels" ADD CONSTRAINT "_testimonials_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_testimonials_v_rels" ADD CONSTRAINT "_testimonials_v_rels_programs_fk" FOREIGN KEY ("programs_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "eq_cards_emotion_tags" ADD CONSTRAINT "eq_cards_emotion_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."eq_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "eq_cards" ADD CONSTRAINT "eq_cards_related_product_id_products_id_fk" FOREIGN KEY ("related_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "eq_cards" ADD CONSTRAINT "eq_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "eq_cards" ADD CONSTRAINT "eq_cards_share_image45_id_media_id_fk" FOREIGN KEY ("share_image45_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "eq_cards" ADD CONSTRAINT "eq_cards_share_image916_id_media_id_fk" FOREIGN KEY ("share_image916_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_eq_cards_v_version_emotion_tags" ADD CONSTRAINT "_eq_cards_v_version_emotion_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_eq_cards_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_eq_cards_v" ADD CONSTRAINT "_eq_cards_v_parent_id_eq_cards_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."eq_cards"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_eq_cards_v" ADD CONSTRAINT "_eq_cards_v_version_related_product_id_products_id_fk" FOREIGN KEY ("version_related_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_eq_cards_v" ADD CONSTRAINT "_eq_cards_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_eq_cards_v" ADD CONSTRAINT "_eq_cards_v_version_share_image45_id_media_id_fk" FOREIGN KEY ("version_share_image45_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_eq_cards_v" ADD CONSTRAINT "_eq_cards_v_version_share_image916_id_media_id_fk" FOREIGN KEY ("version_share_image916_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_course_modules_v" ADD CONSTRAINT "_course_modules_v_parent_id_course_modules_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."course_modules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lessons_downloadables" ADD CONSTRAINT "lessons_downloadables_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lessons_downloadables" ADD CONSTRAINT "lessons_downloadables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_course_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."course_modules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lessons_v_version_downloadables" ADD CONSTRAINT "_lessons_v_version_downloadables_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lessons_v_version_downloadables" ADD CONSTRAINT "_lessons_v_version_downloadables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lessons_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lessons_v" ADD CONSTRAINT "_lessons_v_parent_id_lessons_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lessons_v" ADD CONSTRAINT "_lessons_v_version_module_id_course_modules_id_fk" FOREIGN KEY ("version_module_id") REFERENCES "public"."course_modules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_diagnostic_questions_v" ADD CONSTRAINT "_diagnostic_questions_v_parent_id_diagnostic_questions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."diagnostic_questions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "techniques" ADD CONSTRAINT "techniques_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_techniques_v" ADD CONSTRAINT "_techniques_v_parent_id_techniques_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."techniques"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_techniques_v" ADD CONSTRAINT "_techniques_v_version_lesson_id_lessons_id_fk" FOREIGN KEY ("version_lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_legal_pages_v" ADD CONSTRAINT "_legal_pages_v_parent_id_legal_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."legal_pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workshops" ADD CONSTRAINT "workshops_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workshops_rels" ADD CONSTRAINT "workshops_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_rels" ADD CONSTRAINT "workshops_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v" ADD CONSTRAINT "_workshops_v_parent_id_workshops_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."workshops"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_workshops_v" ADD CONSTRAINT "_workshops_v_version_product_id_products_id_fk" FOREIGN KEY ("version_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_workshops_v_rels" ADD CONSTRAINT "_workshops_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_workshops_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_workshops_v_rels" ADD CONSTRAINT "_workshops_v_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_main_menu" ADD CONSTRAINT "navigation_main_menu_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_main_menu" ADD CONSTRAINT "navigation_main_menu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_menu" ADD CONSTRAINT "navigation_footer_menu_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_footer_menu" ADD CONSTRAINT "navigation_footer_menu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_audience_order_idx" ON "products_audience" USING btree ("_order");
  CREATE INDEX "products_audience_parent_id_idx" ON "products_audience" USING btree ("_parent_id");
  CREATE INDEX "products_includes_order_idx" ON "products_includes" USING btree ("_order");
  CREATE INDEX "products_includes_parent_id_idx" ON "products_includes" USING btree ("_parent_id");
  CREATE INDEX "products_files_order_idx" ON "products_files" USING btree ("_order");
  CREATE INDEX "products_files_parent_id_idx" ON "products_files" USING btree ("_parent_id");
  CREATE INDEX "products_files_file_idx" ON "products_files" USING btree ("file_id");
  CREATE INDEX "products_faq_order_idx" ON "products_faq" USING btree ("_order");
  CREATE INDEX "products_faq_parent_id_idx" ON "products_faq" USING btree ("_parent_id");
  CREATE INDEX "products_components_order_idx" ON "products_components" USING btree ("_order");
  CREATE INDEX "products_components_parent_id_idx" ON "products_components" USING btree ("_parent_id");
  CREATE INDEX "products_components_grants_product_idx" ON "products_components" USING btree ("grants_product_id");
  CREATE UNIQUE INDEX "products_slug_idx" ON "products" USING btree ("slug");
  CREATE INDEX "products_preview_idx" ON "products" USING btree ("preview_id");
  CREATE INDEX "products_cover_image_idx" ON "products" USING btree ("cover_image_id");
  CREATE INDEX "products_updated_at_idx" ON "products" USING btree ("updated_at");
  CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");
  CREATE INDEX "products__status_idx" ON "products" USING btree ("_status");
  CREATE INDEX "products_rels_order_idx" ON "products_rels" USING btree ("order");
  CREATE INDEX "products_rels_parent_idx" ON "products_rels" USING btree ("parent_id");
  CREATE INDEX "products_rels_path_idx" ON "products_rels" USING btree ("path");
  CREATE INDEX "products_rels_products_id_idx" ON "products_rels" USING btree ("products_id");
  CREATE INDEX "_products_v_version_audience_order_idx" ON "_products_v_version_audience" USING btree ("_order");
  CREATE INDEX "_products_v_version_audience_parent_id_idx" ON "_products_v_version_audience" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_includes_order_idx" ON "_products_v_version_includes" USING btree ("_order");
  CREATE INDEX "_products_v_version_includes_parent_id_idx" ON "_products_v_version_includes" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_files_order_idx" ON "_products_v_version_files" USING btree ("_order");
  CREATE INDEX "_products_v_version_files_parent_id_idx" ON "_products_v_version_files" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_files_file_idx" ON "_products_v_version_files" USING btree ("file_id");
  CREATE INDEX "_products_v_version_faq_order_idx" ON "_products_v_version_faq" USING btree ("_order");
  CREATE INDEX "_products_v_version_faq_parent_id_idx" ON "_products_v_version_faq" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_components_order_idx" ON "_products_v_version_components" USING btree ("_order");
  CREATE INDEX "_products_v_version_components_parent_id_idx" ON "_products_v_version_components" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_components_grants_product_idx" ON "_products_v_version_components" USING btree ("grants_product_id");
  CREATE INDEX "_products_v_parent_idx" ON "_products_v" USING btree ("parent_id");
  CREATE INDEX "_products_v_version_version_slug_idx" ON "_products_v" USING btree ("version_slug");
  CREATE INDEX "_products_v_version_version_preview_idx" ON "_products_v" USING btree ("version_preview_id");
  CREATE INDEX "_products_v_version_version_cover_image_idx" ON "_products_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_products_v_version_version_updated_at_idx" ON "_products_v" USING btree ("version_updated_at");
  CREATE INDEX "_products_v_version_version_created_at_idx" ON "_products_v" USING btree ("version_created_at");
  CREATE INDEX "_products_v_version_version__status_idx" ON "_products_v" USING btree ("version__status");
  CREATE INDEX "_products_v_created_at_idx" ON "_products_v" USING btree ("created_at");
  CREATE INDEX "_products_v_updated_at_idx" ON "_products_v" USING btree ("updated_at");
  CREATE INDEX "_products_v_latest_idx" ON "_products_v" USING btree ("latest");
  CREATE INDEX "_products_v_rels_order_idx" ON "_products_v_rels" USING btree ("order");
  CREATE INDEX "_products_v_rels_parent_idx" ON "_products_v_rels" USING btree ("parent_id");
  CREATE INDEX "_products_v_rels_path_idx" ON "_products_v_rels" USING btree ("path");
  CREATE INDEX "_products_v_rels_products_id_idx" ON "_products_v_rels" USING btree ("products_id");
  CREATE INDEX "services_situations_order_idx" ON "services_situations" USING btree ("_order");
  CREATE INDEX "services_situations_parent_id_idx" ON "services_situations" USING btree ("_parent_id");
  CREATE INDEX "services_outcomes_order_idx" ON "services_outcomes" USING btree ("_order");
  CREATE INDEX "services_outcomes_parent_id_idx" ON "services_outcomes" USING btree ("_parent_id");
  CREATE INDEX "services_process_order_idx" ON "services_process" USING btree ("_order");
  CREATE INDEX "services_process_parent_id_idx" ON "services_process" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "services_slug_idx" ON "services" USING btree ("slug");
  CREATE INDEX "services_updated_at_idx" ON "services" USING btree ("updated_at");
  CREATE INDEX "services_created_at_idx" ON "services" USING btree ("created_at");
  CREATE INDEX "services__status_idx" ON "services" USING btree ("_status");
  CREATE INDEX "services_rels_order_idx" ON "services_rels" USING btree ("order");
  CREATE INDEX "services_rels_parent_idx" ON "services_rels" USING btree ("parent_id");
  CREATE INDEX "services_rels_path_idx" ON "services_rels" USING btree ("path");
  CREATE INDEX "services_rels_testimonials_id_idx" ON "services_rels" USING btree ("testimonials_id");
  CREATE INDEX "_services_v_version_situations_order_idx" ON "_services_v_version_situations" USING btree ("_order");
  CREATE INDEX "_services_v_version_situations_parent_id_idx" ON "_services_v_version_situations" USING btree ("_parent_id");
  CREATE INDEX "_services_v_version_outcomes_order_idx" ON "_services_v_version_outcomes" USING btree ("_order");
  CREATE INDEX "_services_v_version_outcomes_parent_id_idx" ON "_services_v_version_outcomes" USING btree ("_parent_id");
  CREATE INDEX "_services_v_version_process_order_idx" ON "_services_v_version_process" USING btree ("_order");
  CREATE INDEX "_services_v_version_process_parent_id_idx" ON "_services_v_version_process" USING btree ("_parent_id");
  CREATE INDEX "_services_v_parent_idx" ON "_services_v" USING btree ("parent_id");
  CREATE INDEX "_services_v_version_version_slug_idx" ON "_services_v" USING btree ("version_slug");
  CREATE INDEX "_services_v_version_version_updated_at_idx" ON "_services_v" USING btree ("version_updated_at");
  CREATE INDEX "_services_v_version_version_created_at_idx" ON "_services_v" USING btree ("version_created_at");
  CREATE INDEX "_services_v_version_version__status_idx" ON "_services_v" USING btree ("version__status");
  CREATE INDEX "_services_v_created_at_idx" ON "_services_v" USING btree ("created_at");
  CREATE INDEX "_services_v_updated_at_idx" ON "_services_v" USING btree ("updated_at");
  CREATE INDEX "_services_v_latest_idx" ON "_services_v" USING btree ("latest");
  CREATE INDEX "_services_v_rels_order_idx" ON "_services_v_rels" USING btree ("order");
  CREATE INDEX "_services_v_rels_parent_idx" ON "_services_v_rels" USING btree ("parent_id");
  CREATE INDEX "_services_v_rels_path_idx" ON "_services_v_rels" USING btree ("path");
  CREATE INDEX "_services_v_rels_testimonials_id_idx" ON "_services_v_rels" USING btree ("testimonials_id");
  CREATE INDEX "programs_target_behaviors_order_idx" ON "programs_target_behaviors" USING btree ("_order");
  CREATE INDEX "programs_target_behaviors_parent_id_idx" ON "programs_target_behaviors" USING btree ("_parent_id");
  CREATE INDEX "programs_deliverables_order_idx" ON "programs_deliverables" USING btree ("_order");
  CREATE INDEX "programs_deliverables_parent_id_idx" ON "programs_deliverables" USING btree ("_parent_id");
  CREATE INDEX "programs_case_studies_order_idx" ON "programs_case_studies" USING btree ("_order");
  CREATE INDEX "programs_case_studies_parent_id_idx" ON "programs_case_studies" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "programs_slug_idx" ON "programs" USING btree ("slug");
  CREATE INDEX "programs_updated_at_idx" ON "programs" USING btree ("updated_at");
  CREATE INDEX "programs_created_at_idx" ON "programs" USING btree ("created_at");
  CREATE INDEX "programs__status_idx" ON "programs" USING btree ("_status");
  CREATE INDEX "_programs_v_version_target_behaviors_order_idx" ON "_programs_v_version_target_behaviors" USING btree ("_order");
  CREATE INDEX "_programs_v_version_target_behaviors_parent_id_idx" ON "_programs_v_version_target_behaviors" USING btree ("_parent_id");
  CREATE INDEX "_programs_v_version_deliverables_order_idx" ON "_programs_v_version_deliverables" USING btree ("_order");
  CREATE INDEX "_programs_v_version_deliverables_parent_id_idx" ON "_programs_v_version_deliverables" USING btree ("_parent_id");
  CREATE INDEX "_programs_v_version_case_studies_order_idx" ON "_programs_v_version_case_studies" USING btree ("_order");
  CREATE INDEX "_programs_v_version_case_studies_parent_id_idx" ON "_programs_v_version_case_studies" USING btree ("_parent_id");
  CREATE INDEX "_programs_v_parent_idx" ON "_programs_v" USING btree ("parent_id");
  CREATE INDEX "_programs_v_version_version_slug_idx" ON "_programs_v" USING btree ("version_slug");
  CREATE INDEX "_programs_v_version_version_updated_at_idx" ON "_programs_v" USING btree ("version_updated_at");
  CREATE INDEX "_programs_v_version_version_created_at_idx" ON "_programs_v" USING btree ("version_created_at");
  CREATE INDEX "_programs_v_version_version__status_idx" ON "_programs_v" USING btree ("version__status");
  CREATE INDEX "_programs_v_created_at_idx" ON "_programs_v" USING btree ("created_at");
  CREATE INDEX "_programs_v_updated_at_idx" ON "_programs_v" USING btree ("updated_at");
  CREATE INDEX "_programs_v_latest_idx" ON "_programs_v" USING btree ("latest");
  CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");
  CREATE INDEX "posts_thumbnail_idx" ON "posts" USING btree ("thumbnail_id");
  CREATE INDEX "posts_cta_product_idx" ON "posts" USING btree ("cta_product_id");
  CREATE INDEX "posts_lead_magnet_idx" ON "posts" USING btree ("lead_magnet_id");
  CREATE INDEX "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE INDEX "posts__status_idx" ON "posts" USING btree ("_status");
  CREATE INDEX "_posts_v_parent_idx" ON "_posts_v" USING btree ("parent_id");
  CREATE INDEX "_posts_v_version_version_slug_idx" ON "_posts_v" USING btree ("version_slug");
  CREATE INDEX "_posts_v_version_version_thumbnail_idx" ON "_posts_v" USING btree ("version_thumbnail_id");
  CREATE INDEX "_posts_v_version_version_cta_product_idx" ON "_posts_v" USING btree ("version_cta_product_id");
  CREATE INDEX "_posts_v_version_version_lead_magnet_idx" ON "_posts_v" USING btree ("version_lead_magnet_id");
  CREATE INDEX "_posts_v_version_version_updated_at_idx" ON "_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_posts_v_version_version_created_at_idx" ON "_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_posts_v_version_version__status_idx" ON "_posts_v" USING btree ("version__status");
  CREATE INDEX "_posts_v_created_at_idx" ON "_posts_v" USING btree ("created_at");
  CREATE INDEX "_posts_v_updated_at_idx" ON "_posts_v" USING btree ("updated_at");
  CREATE INDEX "_posts_v_latest_idx" ON "_posts_v" USING btree ("latest");
  CREATE INDEX "testimonials_photo_idx" ON "testimonials" USING btree ("photo_id");
  CREATE INDEX "testimonials_updated_at_idx" ON "testimonials" USING btree ("updated_at");
  CREATE INDEX "testimonials_created_at_idx" ON "testimonials" USING btree ("created_at");
  CREATE INDEX "testimonials__status_idx" ON "testimonials" USING btree ("_status");
  CREATE INDEX "testimonials_rels_order_idx" ON "testimonials_rels" USING btree ("order");
  CREATE INDEX "testimonials_rels_parent_idx" ON "testimonials_rels" USING btree ("parent_id");
  CREATE INDEX "testimonials_rels_path_idx" ON "testimonials_rels" USING btree ("path");
  CREATE INDEX "testimonials_rels_products_id_idx" ON "testimonials_rels" USING btree ("products_id");
  CREATE INDEX "testimonials_rels_services_id_idx" ON "testimonials_rels" USING btree ("services_id");
  CREATE INDEX "testimonials_rels_programs_id_idx" ON "testimonials_rels" USING btree ("programs_id");
  CREATE INDEX "_testimonials_v_parent_idx" ON "_testimonials_v" USING btree ("parent_id");
  CREATE INDEX "_testimonials_v_version_version_photo_idx" ON "_testimonials_v" USING btree ("version_photo_id");
  CREATE INDEX "_testimonials_v_version_version_updated_at_idx" ON "_testimonials_v" USING btree ("version_updated_at");
  CREATE INDEX "_testimonials_v_version_version_created_at_idx" ON "_testimonials_v" USING btree ("version_created_at");
  CREATE INDEX "_testimonials_v_version_version__status_idx" ON "_testimonials_v" USING btree ("version__status");
  CREATE INDEX "_testimonials_v_created_at_idx" ON "_testimonials_v" USING btree ("created_at");
  CREATE INDEX "_testimonials_v_updated_at_idx" ON "_testimonials_v" USING btree ("updated_at");
  CREATE INDEX "_testimonials_v_latest_idx" ON "_testimonials_v" USING btree ("latest");
  CREATE INDEX "_testimonials_v_rels_order_idx" ON "_testimonials_v_rels" USING btree ("order");
  CREATE INDEX "_testimonials_v_rels_parent_idx" ON "_testimonials_v_rels" USING btree ("parent_id");
  CREATE INDEX "_testimonials_v_rels_path_idx" ON "_testimonials_v_rels" USING btree ("path");
  CREATE INDEX "_testimonials_v_rels_products_id_idx" ON "_testimonials_v_rels" USING btree ("products_id");
  CREATE INDEX "_testimonials_v_rels_services_id_idx" ON "_testimonials_v_rels" USING btree ("services_id");
  CREATE INDEX "_testimonials_v_rels_programs_id_idx" ON "_testimonials_v_rels" USING btree ("programs_id");
  CREATE INDEX "eq_cards_emotion_tags_order_idx" ON "eq_cards_emotion_tags" USING btree ("_order");
  CREATE INDEX "eq_cards_emotion_tags_parent_id_idx" ON "eq_cards_emotion_tags" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "eq_cards_code_idx" ON "eq_cards" USING btree ("code");
  CREATE INDEX "eq_cards_related_product_idx" ON "eq_cards" USING btree ("related_product_id");
  CREATE INDEX "eq_cards_image_idx" ON "eq_cards" USING btree ("image_id");
  CREATE INDEX "eq_cards_share_image45_idx" ON "eq_cards" USING btree ("share_image45_id");
  CREATE INDEX "eq_cards_share_image916_idx" ON "eq_cards" USING btree ("share_image916_id");
  CREATE UNIQUE INDEX "eq_cards_qr_slug_idx" ON "eq_cards" USING btree ("qr_slug");
  CREATE INDEX "eq_cards_updated_at_idx" ON "eq_cards" USING btree ("updated_at");
  CREATE INDEX "eq_cards_created_at_idx" ON "eq_cards" USING btree ("created_at");
  CREATE INDEX "eq_cards__status_idx" ON "eq_cards" USING btree ("_status");
  CREATE INDEX "_eq_cards_v_version_emotion_tags_order_idx" ON "_eq_cards_v_version_emotion_tags" USING btree ("_order");
  CREATE INDEX "_eq_cards_v_version_emotion_tags_parent_id_idx" ON "_eq_cards_v_version_emotion_tags" USING btree ("_parent_id");
  CREATE INDEX "_eq_cards_v_parent_idx" ON "_eq_cards_v" USING btree ("parent_id");
  CREATE INDEX "_eq_cards_v_version_version_code_idx" ON "_eq_cards_v" USING btree ("version_code");
  CREATE INDEX "_eq_cards_v_version_version_related_product_idx" ON "_eq_cards_v" USING btree ("version_related_product_id");
  CREATE INDEX "_eq_cards_v_version_version_image_idx" ON "_eq_cards_v" USING btree ("version_image_id");
  CREATE INDEX "_eq_cards_v_version_version_share_image45_idx" ON "_eq_cards_v" USING btree ("version_share_image45_id");
  CREATE INDEX "_eq_cards_v_version_version_share_image916_idx" ON "_eq_cards_v" USING btree ("version_share_image916_id");
  CREATE INDEX "_eq_cards_v_version_version_qr_slug_idx" ON "_eq_cards_v" USING btree ("version_qr_slug");
  CREATE INDEX "_eq_cards_v_version_version_updated_at_idx" ON "_eq_cards_v" USING btree ("version_updated_at");
  CREATE INDEX "_eq_cards_v_version_version_created_at_idx" ON "_eq_cards_v" USING btree ("version_created_at");
  CREATE INDEX "_eq_cards_v_version_version__status_idx" ON "_eq_cards_v" USING btree ("version__status");
  CREATE INDEX "_eq_cards_v_created_at_idx" ON "_eq_cards_v" USING btree ("created_at");
  CREATE INDEX "_eq_cards_v_updated_at_idx" ON "_eq_cards_v" USING btree ("updated_at");
  CREATE INDEX "_eq_cards_v_latest_idx" ON "_eq_cards_v" USING btree ("latest");
  CREATE INDEX "course_modules_updated_at_idx" ON "course_modules" USING btree ("updated_at");
  CREATE INDEX "course_modules_created_at_idx" ON "course_modules" USING btree ("created_at");
  CREATE INDEX "course_modules__status_idx" ON "course_modules" USING btree ("_status");
  CREATE INDEX "_course_modules_v_parent_idx" ON "_course_modules_v" USING btree ("parent_id");
  CREATE INDEX "_course_modules_v_version_version_updated_at_idx" ON "_course_modules_v" USING btree ("version_updated_at");
  CREATE INDEX "_course_modules_v_version_version_created_at_idx" ON "_course_modules_v" USING btree ("version_created_at");
  CREATE INDEX "_course_modules_v_version_version__status_idx" ON "_course_modules_v" USING btree ("version__status");
  CREATE INDEX "_course_modules_v_created_at_idx" ON "_course_modules_v" USING btree ("created_at");
  CREATE INDEX "_course_modules_v_updated_at_idx" ON "_course_modules_v" USING btree ("updated_at");
  CREATE INDEX "_course_modules_v_latest_idx" ON "_course_modules_v" USING btree ("latest");
  CREATE INDEX "lessons_downloadables_order_idx" ON "lessons_downloadables" USING btree ("_order");
  CREATE INDEX "lessons_downloadables_parent_id_idx" ON "lessons_downloadables" USING btree ("_parent_id");
  CREATE INDEX "lessons_downloadables_file_idx" ON "lessons_downloadables" USING btree ("file_id");
  CREATE INDEX "lessons_module_idx" ON "lessons" USING btree ("module_id");
  CREATE INDEX "lessons_updated_at_idx" ON "lessons" USING btree ("updated_at");
  CREATE INDEX "lessons_created_at_idx" ON "lessons" USING btree ("created_at");
  CREATE INDEX "lessons__status_idx" ON "lessons" USING btree ("_status");
  CREATE INDEX "_lessons_v_version_downloadables_order_idx" ON "_lessons_v_version_downloadables" USING btree ("_order");
  CREATE INDEX "_lessons_v_version_downloadables_parent_id_idx" ON "_lessons_v_version_downloadables" USING btree ("_parent_id");
  CREATE INDEX "_lessons_v_version_downloadables_file_idx" ON "_lessons_v_version_downloadables" USING btree ("file_id");
  CREATE INDEX "_lessons_v_parent_idx" ON "_lessons_v" USING btree ("parent_id");
  CREATE INDEX "_lessons_v_version_version_module_idx" ON "_lessons_v" USING btree ("version_module_id");
  CREATE INDEX "_lessons_v_version_version_updated_at_idx" ON "_lessons_v" USING btree ("version_updated_at");
  CREATE INDEX "_lessons_v_version_version_created_at_idx" ON "_lessons_v" USING btree ("version_created_at");
  CREATE INDEX "_lessons_v_version_version__status_idx" ON "_lessons_v" USING btree ("version__status");
  CREATE INDEX "_lessons_v_created_at_idx" ON "_lessons_v" USING btree ("created_at");
  CREATE INDEX "_lessons_v_updated_at_idx" ON "_lessons_v" USING btree ("updated_at");
  CREATE INDEX "_lessons_v_latest_idx" ON "_lessons_v" USING btree ("latest");
  CREATE INDEX "diagnostic_questions_updated_at_idx" ON "diagnostic_questions" USING btree ("updated_at");
  CREATE INDEX "diagnostic_questions_created_at_idx" ON "diagnostic_questions" USING btree ("created_at");
  CREATE INDEX "diagnostic_questions__status_idx" ON "diagnostic_questions" USING btree ("_status");
  CREATE INDEX "_diagnostic_questions_v_parent_idx" ON "_diagnostic_questions_v" USING btree ("parent_id");
  CREATE INDEX "_diagnostic_questions_v_version_version_updated_at_idx" ON "_diagnostic_questions_v" USING btree ("version_updated_at");
  CREATE INDEX "_diagnostic_questions_v_version_version_created_at_idx" ON "_diagnostic_questions_v" USING btree ("version_created_at");
  CREATE INDEX "_diagnostic_questions_v_version_version__status_idx" ON "_diagnostic_questions_v" USING btree ("version__status");
  CREATE INDEX "_diagnostic_questions_v_created_at_idx" ON "_diagnostic_questions_v" USING btree ("created_at");
  CREATE INDEX "_diagnostic_questions_v_updated_at_idx" ON "_diagnostic_questions_v" USING btree ("updated_at");
  CREATE INDEX "_diagnostic_questions_v_latest_idx" ON "_diagnostic_questions_v" USING btree ("latest");
  CREATE INDEX "techniques_lesson_idx" ON "techniques" USING btree ("lesson_id");
  CREATE INDEX "techniques_updated_at_idx" ON "techniques" USING btree ("updated_at");
  CREATE INDEX "techniques_created_at_idx" ON "techniques" USING btree ("created_at");
  CREATE INDEX "techniques__status_idx" ON "techniques" USING btree ("_status");
  CREATE INDEX "_techniques_v_parent_idx" ON "_techniques_v" USING btree ("parent_id");
  CREATE INDEX "_techniques_v_version_version_lesson_idx" ON "_techniques_v" USING btree ("version_lesson_id");
  CREATE INDEX "_techniques_v_version_version_updated_at_idx" ON "_techniques_v" USING btree ("version_updated_at");
  CREATE INDEX "_techniques_v_version_version_created_at_idx" ON "_techniques_v" USING btree ("version_created_at");
  CREATE INDEX "_techniques_v_version_version__status_idx" ON "_techniques_v" USING btree ("version__status");
  CREATE INDEX "_techniques_v_created_at_idx" ON "_techniques_v" USING btree ("created_at");
  CREATE INDEX "_techniques_v_updated_at_idx" ON "_techniques_v" USING btree ("updated_at");
  CREATE INDEX "_techniques_v_latest_idx" ON "_techniques_v" USING btree ("latest");
  CREATE UNIQUE INDEX "legal_pages_slug_idx" ON "legal_pages" USING btree ("slug");
  CREATE INDEX "legal_pages_updated_at_idx" ON "legal_pages" USING btree ("updated_at");
  CREATE INDEX "legal_pages_created_at_idx" ON "legal_pages" USING btree ("created_at");
  CREATE INDEX "legal_pages__status_idx" ON "legal_pages" USING btree ("_status");
  CREATE INDEX "_legal_pages_v_parent_idx" ON "_legal_pages_v" USING btree ("parent_id");
  CREATE INDEX "_legal_pages_v_version_version_slug_idx" ON "_legal_pages_v" USING btree ("version_slug");
  CREATE INDEX "_legal_pages_v_version_version_updated_at_idx" ON "_legal_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_legal_pages_v_version_version_created_at_idx" ON "_legal_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_legal_pages_v_version_version__status_idx" ON "_legal_pages_v" USING btree ("version__status");
  CREATE INDEX "_legal_pages_v_created_at_idx" ON "_legal_pages_v" USING btree ("created_at");
  CREATE INDEX "_legal_pages_v_updated_at_idx" ON "_legal_pages_v" USING btree ("updated_at");
  CREATE INDEX "_legal_pages_v_latest_idx" ON "_legal_pages_v" USING btree ("latest");
  CREATE INDEX "workshops_product_idx" ON "workshops" USING btree ("product_id");
  CREATE INDEX "workshops_updated_at_idx" ON "workshops" USING btree ("updated_at");
  CREATE INDEX "workshops_created_at_idx" ON "workshops" USING btree ("created_at");
  CREATE INDEX "workshops__status_idx" ON "workshops" USING btree ("_status");
  CREATE INDEX "workshops_rels_order_idx" ON "workshops_rels" USING btree ("order");
  CREATE INDEX "workshops_rels_parent_idx" ON "workshops_rels" USING btree ("parent_id");
  CREATE INDEX "workshops_rels_path_idx" ON "workshops_rels" USING btree ("path");
  CREATE INDEX "workshops_rels_products_id_idx" ON "workshops_rels" USING btree ("products_id");
  CREATE INDEX "_workshops_v_parent_idx" ON "_workshops_v" USING btree ("parent_id");
  CREATE INDEX "_workshops_v_version_version_product_idx" ON "_workshops_v" USING btree ("version_product_id");
  CREATE INDEX "_workshops_v_version_version_updated_at_idx" ON "_workshops_v" USING btree ("version_updated_at");
  CREATE INDEX "_workshops_v_version_version_created_at_idx" ON "_workshops_v" USING btree ("version_created_at");
  CREATE INDEX "_workshops_v_version_version__status_idx" ON "_workshops_v" USING btree ("version__status");
  CREATE INDEX "_workshops_v_created_at_idx" ON "_workshops_v" USING btree ("created_at");
  CREATE INDEX "_workshops_v_updated_at_idx" ON "_workshops_v" USING btree ("updated_at");
  CREATE INDEX "_workshops_v_latest_idx" ON "_workshops_v" USING btree ("latest");
  CREATE INDEX "_workshops_v_rels_order_idx" ON "_workshops_v_rels" USING btree ("order");
  CREATE INDEX "_workshops_v_rels_parent_idx" ON "_workshops_v_rels" USING btree ("parent_id");
  CREATE INDEX "_workshops_v_rels_path_idx" ON "_workshops_v_rels" USING btree ("path");
  CREATE INDEX "_workshops_v_rels_products_id_idx" ON "_workshops_v_rels" USING btree ("products_id");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_seo_seo_og_image_idx" ON "pages" USING btree ("seo_og_image_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_seo_version_seo_og_image_idx" ON "_pages_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE INDEX "_pages_v_autosave_idx" ON "_pages_v" USING btree ("autosave");
  CREATE INDEX "site_settings_logo_idx" ON "site_settings" USING btree ("logo_id");
  CREATE INDEX "navigation_main_menu_order_idx" ON "navigation_main_menu" USING btree ("_order");
  CREATE INDEX "navigation_main_menu_parent_id_idx" ON "navigation_main_menu" USING btree ("_parent_id");
  CREATE INDEX "navigation_main_menu_page_idx" ON "navigation_main_menu" USING btree ("page_id");
  CREATE INDEX "navigation_footer_menu_order_idx" ON "navigation_footer_menu" USING btree ("_order");
  CREATE INDEX "navigation_footer_menu_parent_id_idx" ON "navigation_footer_menu" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_menu_page_idx" ON "navigation_footer_menu" USING btree ("page_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_programs_fk" FOREIGN KEY ("programs_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_eq_cards_fk" FOREIGN KEY ("eq_cards_id") REFERENCES "public"."eq_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_course_modules_fk" FOREIGN KEY ("course_modules_id") REFERENCES "public"."course_modules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lessons_fk" FOREIGN KEY ("lessons_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_diagnostic_questions_fk" FOREIGN KEY ("diagnostic_questions_id") REFERENCES "public"."diagnostic_questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_techniques_fk" FOREIGN KEY ("techniques_id") REFERENCES "public"."techniques"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_legal_pages_fk" FOREIGN KEY ("legal_pages_id") REFERENCES "public"."legal_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_products_id_idx" ON "payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_services_id_idx" ON "payload_locked_documents_rels" USING btree ("services_id");
  CREATE INDEX "payload_locked_documents_rels_programs_id_idx" ON "payload_locked_documents_rels" USING btree ("programs_id");
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX "payload_locked_documents_rels_testimonials_id_idx" ON "payload_locked_documents_rels" USING btree ("testimonials_id");
  CREATE INDEX "payload_locked_documents_rels_eq_cards_id_idx" ON "payload_locked_documents_rels" USING btree ("eq_cards_id");
  CREATE INDEX "payload_locked_documents_rels_course_modules_id_idx" ON "payload_locked_documents_rels" USING btree ("course_modules_id");
  CREATE INDEX "payload_locked_documents_rels_lessons_id_idx" ON "payload_locked_documents_rels" USING btree ("lessons_id");
  CREATE INDEX "payload_locked_documents_rels_diagnostic_questions_id_idx" ON "payload_locked_documents_rels" USING btree ("diagnostic_questions_id");
  CREATE INDEX "payload_locked_documents_rels_techniques_id_idx" ON "payload_locked_documents_rels" USING btree ("techniques_id");
  CREATE INDEX "payload_locked_documents_rels_legal_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("legal_pages_id");
  CREATE INDEX "payload_locked_documents_rels_workshops_id_idx" ON "payload_locked_documents_rels" USING btree ("workshops_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_audience" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_includes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_files" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_components" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v_version_audience" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v_version_includes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v_version_files" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v_version_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v_version_components" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_products_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_situations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_outcomes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_process" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_version_situations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_version_outcomes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_version_process" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_target_behaviors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_deliverables" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs_case_studies" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_programs_v_version_target_behaviors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_programs_v_version_deliverables" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_programs_v_version_case_studies" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_programs_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_posts_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "testimonials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "testimonials_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_testimonials_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_testimonials_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "eq_cards_emotion_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "eq_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_eq_cards_v_version_emotion_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_eq_cards_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "course_modules" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_course_modules_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lessons_downloadables" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lessons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lessons_v_version_downloadables" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lessons_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "diagnostic_questions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_diagnostic_questions_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "techniques" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_techniques_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "legal_pages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_legal_pages_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "workshops" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "workshops_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_workshops_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_workshops_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation_main_menu" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation_footer_menu" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "navigation" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "products_audience" CASCADE;
  DROP TABLE "products_includes" CASCADE;
  DROP TABLE "products_files" CASCADE;
  DROP TABLE "products_faq" CASCADE;
  DROP TABLE "products_components" CASCADE;
  DROP TABLE "products" CASCADE;
  DROP TABLE "products_rels" CASCADE;
  DROP TABLE "_products_v_version_audience" CASCADE;
  DROP TABLE "_products_v_version_includes" CASCADE;
  DROP TABLE "_products_v_version_files" CASCADE;
  DROP TABLE "_products_v_version_faq" CASCADE;
  DROP TABLE "_products_v_version_components" CASCADE;
  DROP TABLE "_products_v" CASCADE;
  DROP TABLE "_products_v_rels" CASCADE;
  DROP TABLE "services_situations" CASCADE;
  DROP TABLE "services_outcomes" CASCADE;
  DROP TABLE "services_process" CASCADE;
  DROP TABLE "services" CASCADE;
  DROP TABLE "services_rels" CASCADE;
  DROP TABLE "_services_v_version_situations" CASCADE;
  DROP TABLE "_services_v_version_outcomes" CASCADE;
  DROP TABLE "_services_v_version_process" CASCADE;
  DROP TABLE "_services_v" CASCADE;
  DROP TABLE "_services_v_rels" CASCADE;
  DROP TABLE "programs_target_behaviors" CASCADE;
  DROP TABLE "programs_deliverables" CASCADE;
  DROP TABLE "programs_case_studies" CASCADE;
  DROP TABLE "programs" CASCADE;
  DROP TABLE "_programs_v_version_target_behaviors" CASCADE;
  DROP TABLE "_programs_v_version_deliverables" CASCADE;
  DROP TABLE "_programs_v_version_case_studies" CASCADE;
  DROP TABLE "_programs_v" CASCADE;
  DROP TABLE "posts" CASCADE;
  DROP TABLE "_posts_v" CASCADE;
  DROP TABLE "testimonials" CASCADE;
  DROP TABLE "testimonials_rels" CASCADE;
  DROP TABLE "_testimonials_v" CASCADE;
  DROP TABLE "_testimonials_v_rels" CASCADE;
  DROP TABLE "eq_cards_emotion_tags" CASCADE;
  DROP TABLE "eq_cards" CASCADE;
  DROP TABLE "_eq_cards_v_version_emotion_tags" CASCADE;
  DROP TABLE "_eq_cards_v" CASCADE;
  DROP TABLE "course_modules" CASCADE;
  DROP TABLE "_course_modules_v" CASCADE;
  DROP TABLE "lessons_downloadables" CASCADE;
  DROP TABLE "lessons" CASCADE;
  DROP TABLE "_lessons_v_version_downloadables" CASCADE;
  DROP TABLE "_lessons_v" CASCADE;
  DROP TABLE "diagnostic_questions" CASCADE;
  DROP TABLE "_diagnostic_questions_v" CASCADE;
  DROP TABLE "techniques" CASCADE;
  DROP TABLE "_techniques_v" CASCADE;
  DROP TABLE "legal_pages" CASCADE;
  DROP TABLE "_legal_pages_v" CASCADE;
  DROP TABLE "workshops" CASCADE;
  DROP TABLE "workshops_rels" CASCADE;
  DROP TABLE "_workshops_v" CASCADE;
  DROP TABLE "_workshops_v_rels" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "navigation_main_menu" CASCADE;
  DROP TABLE "navigation_footer_menu" CASCADE;
  DROP TABLE "navigation" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_products_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_services_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_programs_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_posts_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_testimonials_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_eq_cards_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_course_modules_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_lessons_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_diagnostic_questions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_techniques_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_legal_pages_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_workshops_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pages_fk";
  
  DROP INDEX "payload_locked_documents_rels_products_id_idx";
  DROP INDEX "payload_locked_documents_rels_services_id_idx";
  DROP INDEX "payload_locked_documents_rels_programs_id_idx";
  DROP INDEX "payload_locked_documents_rels_posts_id_idx";
  DROP INDEX "payload_locked_documents_rels_testimonials_id_idx";
  DROP INDEX "payload_locked_documents_rels_eq_cards_id_idx";
  DROP INDEX "payload_locked_documents_rels_course_modules_id_idx";
  DROP INDEX "payload_locked_documents_rels_lessons_id_idx";
  DROP INDEX "payload_locked_documents_rels_diagnostic_questions_id_idx";
  DROP INDEX "payload_locked_documents_rels_techniques_id_idx";
  DROP INDEX "payload_locked_documents_rels_legal_pages_id_idx";
  DROP INDEX "payload_locked_documents_rels_workshops_id_idx";
  DROP INDEX "payload_locked_documents_rels_pages_id_idx";
  ALTER TABLE "media" DROP COLUMN "is_sample";
  ALTER TABLE "media" DROP COLUMN "prefix";
  ALTER TABLE "media" DROP COLUMN "_objectkey";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "products_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "services_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "programs_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "posts_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "testimonials_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "eq_cards_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "course_modules_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "lessons_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "diagnostic_questions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "techniques_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "legal_pages_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "workshops_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pages_id";
  DROP TYPE "public"."enum_products_web";
  DROP TYPE "public"."enum_products_type";
  DROP TYPE "public"."enum_products_journey_step";
  DROP TYPE "public"."enum_products_cta_type";
  DROP TYPE "public"."enum_products_sale_status";
  DROP TYPE "public"."enum_products_status";
  DROP TYPE "public"."enum__products_v_version_web";
  DROP TYPE "public"."enum__products_v_version_type";
  DROP TYPE "public"."enum__products_v_version_journey_step";
  DROP TYPE "public"."enum__products_v_version_cta_type";
  DROP TYPE "public"."enum__products_v_version_sale_status";
  DROP TYPE "public"."enum__products_v_version_status";
  DROP TYPE "public"."enum_services_price_mode";
  DROP TYPE "public"."enum_services_sale_status";
  DROP TYPE "public"."enum_services_status";
  DROP TYPE "public"."enum__services_v_version_price_mode";
  DROP TYPE "public"."enum__services_v_version_sale_status";
  DROP TYPE "public"."enum__services_v_version_status";
  DROP TYPE "public"."enum_programs_sale_status";
  DROP TYPE "public"."enum_programs_status";
  DROP TYPE "public"."enum__programs_v_version_sale_status";
  DROP TYPE "public"."enum__programs_v_version_status";
  DROP TYPE "public"."enum_posts_topic";
  DROP TYPE "public"."enum_posts_format";
  DROP TYPE "public"."enum_posts_status";
  DROP TYPE "public"."enum__posts_v_version_topic";
  DROP TYPE "public"."enum__posts_v_version_format";
  DROP TYPE "public"."enum__posts_v_version_status";
  DROP TYPE "public"."enum_testimonials_language";
  DROP TYPE "public"."enum_testimonials_status";
  DROP TYPE "public"."enum__testimonials_v_version_language";
  DROP TYPE "public"."enum__testimonials_v_version_status";
  DROP TYPE "public"."enum_eq_cards_topic";
  DROP TYPE "public"."enum_eq_cards_status";
  DROP TYPE "public"."enum__eq_cards_v_version_topic";
  DROP TYPE "public"."enum__eq_cards_v_version_status";
  DROP TYPE "public"."enum_course_modules_group";
  DROP TYPE "public"."enum_course_modules_status";
  DROP TYPE "public"."enum__course_modules_v_version_group";
  DROP TYPE "public"."enum__course_modules_v_version_status";
  DROP TYPE "public"."enum_lessons_stage";
  DROP TYPE "public"."enum_lessons_status";
  DROP TYPE "public"."enum__lessons_v_version_stage";
  DROP TYPE "public"."enum__lessons_v_version_status";
  DROP TYPE "public"."enum_diagnostic_questions_stage";
  DROP TYPE "public"."enum_diagnostic_questions_status";
  DROP TYPE "public"."enum__diagnostic_questions_v_version_stage";
  DROP TYPE "public"."enum__diagnostic_questions_v_version_status";
  DROP TYPE "public"."enum_techniques_stage";
  DROP TYPE "public"."enum_techniques_status";
  DROP TYPE "public"."enum__techniques_v_version_stage";
  DROP TYPE "public"."enum__techniques_v_version_status";
  DROP TYPE "public"."enum_legal_pages_status";
  DROP TYPE "public"."enum__legal_pages_v_version_status";
  DROP TYPE "public"."enum_workshops_status";
  DROP TYPE "public"."enum__workshops_v_version_status";
  DROP TYPE "public"."enum_pages_template";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_version_template";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum_site_settings_analytics_provider";
  DROP TYPE "public"."enum_navigation_main_menu_link_type";
  DROP TYPE "public"."enum_navigation_footer_menu_link_type";`)
}
