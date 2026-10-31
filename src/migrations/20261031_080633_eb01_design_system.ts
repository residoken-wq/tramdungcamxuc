import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_design_system_lock_colors" AS ENUM('locked', 'open');
  CREATE TYPE "public"."enum_design_system_lock_fonts" AS ENUM('locked', 'open');
  CREATE TYPE "public"."enum_design_system_lock_sizes" AS ENUM('locked', 'open');
  CREATE TYPE "public"."enum_design_system_lock_custom_css" AS ENUM('locked', 'open');
  CREATE TABLE "design_system_colors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"token" varchar NOT NULL,
  	"label" varchar,
  	"hex" varchar NOT NULL
  );
  
  CREATE TABLE "design_system" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"fonts_heading" varchar DEFAULT 'Anton' NOT NULL,
  	"fonts_ui" varchar DEFAULT 'Montserrat' NOT NULL,
  	"fonts_quote" varchar DEFAULT 'Playfair Display' NOT NULL,
  	"fonts_body" varchar DEFAULT 'Montserrat' NOT NULL,
  	"radius_card" numeric DEFAULT 20 NOT NULL,
  	"spacing_sm" numeric DEFAULT 16 NOT NULL,
  	"spacing_md" numeric DEFAULT 24 NOT NULL,
  	"spacing_lg" numeric DEFAULT 32 NOT NULL,
  	"lock_colors" "enum_design_system_lock_colors" DEFAULT 'locked' NOT NULL,
  	"lock_fonts" "enum_design_system_lock_fonts" DEFAULT 'locked' NOT NULL,
  	"lock_sizes" "enum_design_system_lock_sizes" DEFAULT 'locked' NOT NULL,
  	"lock_custom_css" "enum_design_system_lock_custom_css" DEFAULT 'locked' NOT NULL,
  	"lock_contrast_check" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "design_system_colors" ADD CONSTRAINT "design_system_colors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."design_system"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "design_system_colors_order_idx" ON "design_system_colors" USING btree ("_order");
  CREATE INDEX "design_system_colors_parent_id_idx" ON "design_system_colors" USING btree ("_parent_id");`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "design_system_colors" CASCADE;
  DROP TABLE "design_system" CASCADE;
  DROP TYPE "public"."enum_design_system_lock_colors";
  DROP TYPE "public"."enum_design_system_lock_fonts";
  DROP TYPE "public"."enum_design_system_lock_sizes";
  DROP TYPE "public"."enum_design_system_lock_custom_css";`)
}
