import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_block_templates_kind" AS ENUM('section', 'page');
  ALTER TYPE "public"."enum_products_icon" ADD VALUE 'check';
  ALTER TYPE "public"."enum_products_icon" ADD VALUE 'arrow-right';
  ALTER TYPE "public"."enum_products_icon" ADD VALUE 'phone';
  ALTER TYPE "public"."enum_products_icon" ADD VALUE 'email';
  ALTER TYPE "public"."enum_products_icon" ADD VALUE 'location';
  ALTER TYPE "public"."enum_products_icon" ADD VALUE 'clock';
  ALTER TYPE "public"."enum_products_icon" ADD VALUE 'calendar';
  ALTER TYPE "public"."enum_products_icon" ADD VALUE 'user';
  ALTER TYPE "public"."enum__products_v_version_icon" ADD VALUE 'check';
  ALTER TYPE "public"."enum__products_v_version_icon" ADD VALUE 'arrow-right';
  ALTER TYPE "public"."enum__products_v_version_icon" ADD VALUE 'phone';
  ALTER TYPE "public"."enum__products_v_version_icon" ADD VALUE 'email';
  ALTER TYPE "public"."enum__products_v_version_icon" ADD VALUE 'location';
  ALTER TYPE "public"."enum__products_v_version_icon" ADD VALUE 'clock';
  ALTER TYPE "public"."enum__products_v_version_icon" ADD VALUE 'calendar';
  ALTER TYPE "public"."enum__products_v_version_icon" ADD VALUE 'user';
  CREATE TABLE "block_templates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"kind" "enum_block_templates_kind" NOT NULL,
  	"description" varchar,
  	"puck_data" jsonb NOT NULL,
  	"created_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "block_templates_id" integer;
  ALTER TABLE "block_templates" ADD CONSTRAINT "block_templates_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "block_templates_created_by_idx" ON "block_templates" USING btree ("created_by_id");
  CREATE INDEX "block_templates_updated_at_idx" ON "block_templates" USING btree ("updated_at");
  CREATE INDEX "block_templates_created_at_idx" ON "block_templates" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_block_templates_fk" FOREIGN KEY ("block_templates_id") REFERENCES "public"."block_templates"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_block_templates_id_idx" ON "payload_locked_documents_rels" USING btree ("block_templates_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_block_templates_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_block_templates_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "block_templates_id";
  DROP TABLE "block_templates" CASCADE;
  
  ALTER TABLE "products" ALTER COLUMN "icon" SET DATA TYPE text;
  DROP TYPE "public"."enum_products_icon";
  CREATE TYPE "public"."enum_products_icon" AS ENUM('target', 'layers', 'star', 'heart', 'butterfly', 'leaf', 'valve', 'compass', 'mask', 'signpost', 'team', 'chat', 'book', 'spark', 'shield', 'mirror');
  ALTER TABLE "products" ALTER COLUMN "icon" SET DATA TYPE "public"."enum_products_icon" USING "icon"::"public"."enum_products_icon";
  ALTER TABLE "_products_v" ALTER COLUMN "version_icon" SET DATA TYPE text;
  DROP TYPE "public"."enum__products_v_version_icon";
  CREATE TYPE "public"."enum__products_v_version_icon" AS ENUM('target', 'layers', 'star', 'heart', 'butterfly', 'leaf', 'valve', 'compass', 'mask', 'signpost', 'team', 'chat', 'book', 'spark', 'shield', 'mirror');
  ALTER TABLE "_products_v" ALTER COLUMN "version_icon" SET DATA TYPE "public"."enum__products_v_version_icon" USING "version_icon"::"public"."enum__products_v_version_icon";
  DROP TYPE "public"."enum_block_templates_kind";`)
}
