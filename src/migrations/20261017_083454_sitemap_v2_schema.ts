import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// SM-01: sitemap v2 CMS schema (submenu, FAQ, team, contact settings, lead interest fields).
// sale_status defaults: aligns the DB with the code default ('coming_soon') that earlier
// migrations left at 'consult'.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_faqs_group" AS ENUM('general', 'journey', 'coaching', 'digital', 'business', 'payment');
  CREATE TYPE "public"."enum_faqs_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__faqs_v_version_group" AS ENUM('general', 'journey', 'coaching', 'digital', 'business', 'payment');
  CREATE TYPE "public"."enum__faqs_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_team_members_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__team_members_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_products_topic" AS ENUM('eq', 'habit', 'career');
  CREATE TYPE "public"."enum_products_audience_segment" AS ENUM('individual', 'business');
  CREATE TYPE "public"."enum_products_icon" AS ENUM('target', 'layers', 'star', 'heart', 'butterfly', 'leaf', 'valve', 'compass', 'mask', 'signpost', 'team', 'chat', 'book', 'spark', 'shield', 'mirror');
  CREATE TYPE "public"."enum__products_v_version_topic" AS ENUM('eq', 'habit', 'career');
  CREATE TYPE "public"."enum__products_v_version_audience_segment" AS ENUM('individual', 'business');
  CREATE TYPE "public"."enum__products_v_version_icon" AS ENUM('target', 'layers', 'star', 'heart', 'butterfly', 'leaf', 'valve', 'compass', 'mask', 'signpost', 'team', 'chat', 'book', 'spark', 'shield', 'mirror');
  CREATE TYPE "public"."enum_navigation_main_menu_children_items_link_type" AS ENUM('page', 'url');
  ALTER TYPE "public"."enum_navigation_main_menu_link_type" ADD VALUE 'none';
  CREATE TABLE "faqs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"group" "enum_faqs_group" DEFAULT 'general',
  	"order" numeric DEFAULT 0,
  	"is_sample" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_faqs_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_faqs_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_question" varchar,
  	"version_answer" varchar,
  	"version_group" "enum__faqs_v_version_group" DEFAULT 'general',
  	"version_order" numeric DEFAULT 0,
  	"version_is_sample" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__faqs_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "team_members" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"specialty" varchar,
  	"bio" varchar,
  	"photo_id" integer,
  	"order" numeric DEFAULT 0,
  	"consent" boolean DEFAULT false,
  	"is_sample" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_team_members_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_team_members_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_role" varchar,
  	"version_specialty" varchar,
  	"version_bio" varchar,
  	"version_photo_id" integer,
  	"version_order" numeric DEFAULT 0,
  	"version_consent" boolean DEFAULT false,
  	"version_is_sample" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__team_members_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "navigation_main_menu_children_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"description" varchar,
  	"link_type" "enum_navigation_main_menu_children_items_link_type" DEFAULT 'page' NOT NULL,
  	"page_id" integer,
  	"url" varchar
  );
  
  CREATE TABLE "navigation_main_menu_children" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"group_label" varchar
  );
  
  CREATE TABLE "site_settings_lead_status_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL
  );
  
  ALTER TABLE "products" ALTER COLUMN "sale_status" SET DEFAULT 'coming_soon';
  ALTER TABLE "_products_v" ALTER COLUMN "version_sale_status" SET DEFAULT 'coming_soon';
  ALTER TABLE "services" ALTER COLUMN "sale_status" SET DEFAULT 'coming_soon';
  ALTER TABLE "_services_v" ALTER COLUMN "version_sale_status" SET DEFAULT 'coming_soon';
  ALTER TABLE "programs" ALTER COLUMN "sale_status" SET DEFAULT 'coming_soon';
  ALTER TABLE "_programs_v" ALTER COLUMN "version_sale_status" SET DEFAULT 'coming_soon';
  ALTER TABLE "posts" ADD COLUMN "featured" boolean DEFAULT false;
  ALTER TABLE "_posts_v" ADD COLUMN "version_featured" boolean DEFAULT false;
  ALTER TABLE "testimonials" ADD COLUMN "age" numeric;
  ALTER TABLE "testimonials" ADD COLUMN "story_before" varchar;
  ALTER TABLE "testimonials" ADD COLUMN "story_insight" varchar;
  ALTER TABLE "testimonials" ADD COLUMN "story_after" varchar;
  ALTER TABLE "_testimonials_v" ADD COLUMN "version_age" numeric;
  ALTER TABLE "_testimonials_v" ADD COLUMN "version_story_before" varchar;
  ALTER TABLE "_testimonials_v" ADD COLUMN "version_story_insight" varchar;
  ALTER TABLE "_testimonials_v" ADD COLUMN "version_story_after" varchar;
  ALTER TABLE "products" ADD COLUMN "topic" "enum_products_topic";
  ALTER TABLE "products" ADD COLUMN "audience_segment" "enum_products_audience_segment";
  ALTER TABLE "products" ADD COLUMN "tagline" varchar;
  ALTER TABLE "products" ADD COLUMN "icon" "enum_products_icon";
  ALTER TABLE "_products_v" ADD COLUMN "version_topic" "enum__products_v_version_topic";
  ALTER TABLE "_products_v" ADD COLUMN "version_audience_segment" "enum__products_v_version_audience_segment";
  ALTER TABLE "_products_v" ADD COLUMN "version_tagline" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_icon" "enum__products_v_version_icon";
  ALTER TABLE "services" ADD COLUMN "audience_label" varchar;
  ALTER TABLE "services" ADD COLUMN "badge" varchar;
  ALTER TABLE "services" ADD COLUMN "image_id" integer;
  ALTER TABLE "_services_v" ADD COLUMN "version_audience_label" varchar;
  ALTER TABLE "_services_v" ADD COLUMN "version_badge" varchar;
  ALTER TABLE "_services_v" ADD COLUMN "version_image_id" integer;
  ALTER TABLE "leads" ADD COLUMN "interested_package_id" integer;
  ALTER TABLE "leads" ADD COLUMN "interested_program_id" integer;
  ALTER TABLE "leads" ADD COLUMN "current_status" varchar;
  ALTER TABLE "leads" ADD COLUMN "brief_contact_role" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "faqs_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "team_members_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "founder_signature_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "hotline" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "office_address" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "facebook_url" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "youtube_url" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "quiz_cta_path" varchar;
  ALTER TABLE "_faqs_v" ADD CONSTRAINT "_faqs_v_parent_id_faqs_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."faqs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team_members" ADD CONSTRAINT "team_members_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_team_members_v" ADD CONSTRAINT "_team_members_v_parent_id_team_members_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_team_members_v" ADD CONSTRAINT "_team_members_v_version_photo_id_media_id_fk" FOREIGN KEY ("version_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_main_menu_children_items" ADD CONSTRAINT "navigation_main_menu_children_items_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_main_menu_children_items" ADD CONSTRAINT "navigation_main_menu_children_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_main_menu_children"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_main_menu_children" ADD CONSTRAINT "navigation_main_menu_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_main_menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_lead_status_options" ADD CONSTRAINT "site_settings_lead_status_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "faqs_updated_at_idx" ON "faqs" USING btree ("updated_at");
  CREATE INDEX "faqs_created_at_idx" ON "faqs" USING btree ("created_at");
  CREATE INDEX "faqs__status_idx" ON "faqs" USING btree ("_status");
  CREATE INDEX "_faqs_v_parent_idx" ON "_faqs_v" USING btree ("parent_id");
  CREATE INDEX "_faqs_v_version_version_updated_at_idx" ON "_faqs_v" USING btree ("version_updated_at");
  CREATE INDEX "_faqs_v_version_version_created_at_idx" ON "_faqs_v" USING btree ("version_created_at");
  CREATE INDEX "_faqs_v_version_version__status_idx" ON "_faqs_v" USING btree ("version__status");
  CREATE INDEX "_faqs_v_created_at_idx" ON "_faqs_v" USING btree ("created_at");
  CREATE INDEX "_faqs_v_updated_at_idx" ON "_faqs_v" USING btree ("updated_at");
  CREATE INDEX "_faqs_v_latest_idx" ON "_faqs_v" USING btree ("latest");
  CREATE INDEX "team_members_photo_idx" ON "team_members" USING btree ("photo_id");
  CREATE INDEX "team_members_updated_at_idx" ON "team_members" USING btree ("updated_at");
  CREATE INDEX "team_members_created_at_idx" ON "team_members" USING btree ("created_at");
  CREATE INDEX "team_members__status_idx" ON "team_members" USING btree ("_status");
  CREATE INDEX "_team_members_v_parent_idx" ON "_team_members_v" USING btree ("parent_id");
  CREATE INDEX "_team_members_v_version_version_photo_idx" ON "_team_members_v" USING btree ("version_photo_id");
  CREATE INDEX "_team_members_v_version_version_updated_at_idx" ON "_team_members_v" USING btree ("version_updated_at");
  CREATE INDEX "_team_members_v_version_version_created_at_idx" ON "_team_members_v" USING btree ("version_created_at");
  CREATE INDEX "_team_members_v_version_version__status_idx" ON "_team_members_v" USING btree ("version__status");
  CREATE INDEX "_team_members_v_created_at_idx" ON "_team_members_v" USING btree ("created_at");
  CREATE INDEX "_team_members_v_updated_at_idx" ON "_team_members_v" USING btree ("updated_at");
  CREATE INDEX "_team_members_v_latest_idx" ON "_team_members_v" USING btree ("latest");
  CREATE INDEX "navigation_main_menu_children_items_order_idx" ON "navigation_main_menu_children_items" USING btree ("_order");
  CREATE INDEX "navigation_main_menu_children_items_parent_id_idx" ON "navigation_main_menu_children_items" USING btree ("_parent_id");
  CREATE INDEX "navigation_main_menu_children_items_page_idx" ON "navigation_main_menu_children_items" USING btree ("page_id");
  CREATE INDEX "navigation_main_menu_children_order_idx" ON "navigation_main_menu_children" USING btree ("_order");
  CREATE INDEX "navigation_main_menu_children_parent_id_idx" ON "navigation_main_menu_children" USING btree ("_parent_id");
  CREATE INDEX "site_settings_lead_status_options_order_idx" ON "site_settings_lead_status_options" USING btree ("_order");
  CREATE INDEX "site_settings_lead_status_options_parent_id_idx" ON "site_settings_lead_status_options" USING btree ("_parent_id");
  ALTER TABLE "services" ADD CONSTRAINT "services_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v" ADD CONSTRAINT "_services_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_interested_package_id_products_id_fk" FOREIGN KEY ("interested_package_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_interested_program_id_programs_id_fk" FOREIGN KEY ("interested_program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_founder_signature_id_media_id_fk" FOREIGN KEY ("founder_signature_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "services_image_idx" ON "services" USING btree ("image_id");
  CREATE INDEX "_services_v_version_version_image_idx" ON "_services_v" USING btree ("version_image_id");
  CREATE INDEX "leads_interested_package_idx" ON "leads" USING btree ("interested_package_id");
  CREATE INDEX "leads_interested_program_idx" ON "leads" USING btree ("interested_program_id");
  CREATE INDEX "payload_locked_documents_rels_faqs_id_idx" ON "payload_locked_documents_rels" USING btree ("faqs_id");
  CREATE INDEX "payload_locked_documents_rels_team_members_id_idx" ON "payload_locked_documents_rels" USING btree ("team_members_id");
  CREATE INDEX "site_settings_founder_signature_idx" ON "site_settings" USING btree ("founder_signature_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE IF EXISTS "faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_faqs_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "team_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_team_members_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "navigation_main_menu_children_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "navigation_main_menu_children" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "site_settings_lead_status_options" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "faqs" CASCADE;
  DROP TABLE IF EXISTS "_faqs_v" CASCADE;
  DROP TABLE IF EXISTS "team_members" CASCADE;
  DROP TABLE IF EXISTS "_team_members_v" CASCADE;
  DROP TABLE IF EXISTS "navigation_main_menu_children_items" CASCADE;
  DROP TABLE IF EXISTS "navigation_main_menu_children" CASCADE;
  DROP TABLE IF EXISTS "site_settings_lead_status_options" CASCADE;
  ALTER TABLE "services" DROP CONSTRAINT IF EXISTS "services_image_id_media_id_fk";
  ALTER TABLE "_services_v" DROP CONSTRAINT IF EXISTS "_services_v_version_image_id_media_id_fk";
  ALTER TABLE "leads" DROP CONSTRAINT IF EXISTS "leads_interested_package_id_products_id_fk";
  ALTER TABLE "leads" DROP CONSTRAINT IF EXISTS "leads_interested_program_id_programs_id_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_faqs_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_team_members_fk";
  ALTER TABLE "site_settings" DROP CONSTRAINT IF EXISTS "site_settings_founder_signature_id_media_id_fk";
  -- Parents that only opened a submenu have no link of their own: point them home before the
  -- 'none' value disappears from the enum.
  UPDATE "navigation_main_menu" SET "link_type" = 'url', "url" = '/' WHERE "link_type" = 'none';
  ALTER TABLE "navigation_main_menu" ALTER COLUMN "link_type" SET DATA TYPE text;
  ALTER TABLE "navigation_main_menu" ALTER COLUMN "link_type" SET DEFAULT 'page'::text;
  DROP TYPE IF EXISTS "public"."enum_navigation_main_menu_link_type";
  CREATE TYPE "public"."enum_navigation_main_menu_link_type" AS ENUM('page', 'url');
  ALTER TABLE "navigation_main_menu" ALTER COLUMN "link_type" SET DEFAULT 'page'::"public"."enum_navigation_main_menu_link_type";
  ALTER TABLE "navigation_main_menu" ALTER COLUMN "link_type" SET DATA TYPE "public"."enum_navigation_main_menu_link_type" USING "link_type"::"public"."enum_navigation_main_menu_link_type";
  DROP INDEX IF EXISTS "services_image_idx";
  DROP INDEX IF EXISTS "_services_v_version_version_image_idx";
  DROP INDEX IF EXISTS "leads_interested_package_idx";
  DROP INDEX IF EXISTS "leads_interested_program_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_faqs_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_team_members_id_idx";
  DROP INDEX IF EXISTS "site_settings_founder_signature_idx";
  ALTER TABLE "products" ALTER COLUMN "sale_status" SET DEFAULT 'consult';
  ALTER TABLE "_products_v" ALTER COLUMN "version_sale_status" SET DEFAULT 'consult';
  ALTER TABLE "services" ALTER COLUMN "sale_status" SET DEFAULT 'consult';
  ALTER TABLE "_services_v" ALTER COLUMN "version_sale_status" SET DEFAULT 'consult';
  ALTER TABLE "programs" ALTER COLUMN "sale_status" SET DEFAULT 'consult';
  ALTER TABLE "_programs_v" ALTER COLUMN "version_sale_status" SET DEFAULT 'consult';
  ALTER TABLE "posts" DROP COLUMN IF EXISTS "featured";
  ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_featured";
  ALTER TABLE "testimonials" DROP COLUMN IF EXISTS "age";
  ALTER TABLE "testimonials" DROP COLUMN IF EXISTS "story_before";
  ALTER TABLE "testimonials" DROP COLUMN IF EXISTS "story_insight";
  ALTER TABLE "testimonials" DROP COLUMN IF EXISTS "story_after";
  ALTER TABLE "_testimonials_v" DROP COLUMN IF EXISTS "version_age";
  ALTER TABLE "_testimonials_v" DROP COLUMN IF EXISTS "version_story_before";
  ALTER TABLE "_testimonials_v" DROP COLUMN IF EXISTS "version_story_insight";
  ALTER TABLE "_testimonials_v" DROP COLUMN IF EXISTS "version_story_after";
  ALTER TABLE "products" DROP COLUMN IF EXISTS "topic";
  ALTER TABLE "products" DROP COLUMN IF EXISTS "audience_segment";
  ALTER TABLE "products" DROP COLUMN IF EXISTS "tagline";
  ALTER TABLE "products" DROP COLUMN IF EXISTS "icon";
  ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_topic";
  ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_audience_segment";
  ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_tagline";
  ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_icon";
  ALTER TABLE "services" DROP COLUMN IF EXISTS "audience_label";
  ALTER TABLE "services" DROP COLUMN IF EXISTS "badge";
  ALTER TABLE "services" DROP COLUMN IF EXISTS "image_id";
  ALTER TABLE "_services_v" DROP COLUMN IF EXISTS "version_audience_label";
  ALTER TABLE "_services_v" DROP COLUMN IF EXISTS "version_badge";
  ALTER TABLE "_services_v" DROP COLUMN IF EXISTS "version_image_id";
  ALTER TABLE "leads" DROP COLUMN IF EXISTS "interested_package_id";
  ALTER TABLE "leads" DROP COLUMN IF EXISTS "interested_program_id";
  ALTER TABLE "leads" DROP COLUMN IF EXISTS "current_status";
  ALTER TABLE "leads" DROP COLUMN IF EXISTS "brief_contact_role";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "faqs_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "team_members_id";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "founder_signature_id";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "hotline";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "office_address";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "facebook_url";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "youtube_url";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "quiz_cta_path";
  DROP TYPE IF EXISTS "public"."enum_faqs_group";
  DROP TYPE IF EXISTS "public"."enum_faqs_status";
  DROP TYPE IF EXISTS "public"."enum__faqs_v_version_group";
  DROP TYPE IF EXISTS "public"."enum__faqs_v_version_status";
  DROP TYPE IF EXISTS "public"."enum_team_members_status";
  DROP TYPE IF EXISTS "public"."enum__team_members_v_version_status";
  DROP TYPE IF EXISTS "public"."enum_products_topic";
  DROP TYPE IF EXISTS "public"."enum_products_audience_segment";
  DROP TYPE IF EXISTS "public"."enum_products_icon";
  DROP TYPE IF EXISTS "public"."enum__products_v_version_topic";
  DROP TYPE IF EXISTS "public"."enum__products_v_version_audience_segment";
  DROP TYPE IF EXISTS "public"."enum__products_v_version_icon";
  DROP TYPE IF EXISTS "public"."enum_navigation_main_menu_children_items_link_type";`)
}
