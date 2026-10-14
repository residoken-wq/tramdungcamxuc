import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "trial_usage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email_hash" varchar NOT NULL,
  	"product_id" integer NOT NULL,
  	"used_at" timestamp(3) with time zone,
  	"usage_key" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "trial_usage_id" integer;
  ALTER TABLE "trial_usage" ADD CONSTRAINT "trial_usage_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "trial_usage_email_hash_idx" ON "trial_usage" USING btree ("email_hash");
  CREATE INDEX "trial_usage_product_idx" ON "trial_usage" USING btree ("product_id");
  CREATE UNIQUE INDEX "trial_usage_usage_key_idx" ON "trial_usage" USING btree ("usage_key");
  CREATE INDEX "trial_usage_updated_at_idx" ON "trial_usage" USING btree ("updated_at");
  CREATE INDEX "trial_usage_created_at_idx" ON "trial_usage" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trial_usage_fk" FOREIGN KEY ("trial_usage_id") REFERENCES "public"."trial_usage"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_trial_usage_id_idx" ON "payload_locked_documents_rels" USING btree ("trial_usage_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "trial_usage" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_trial_usage_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_trial_usage_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "trial_usage_id";
  DROP TABLE IF EXISTS "trial_usage" CASCADE;
  `)
}
