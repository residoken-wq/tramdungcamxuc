import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "rate_limit_hits" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "leads" ADD COLUMN "consent_at" timestamp(3) with time zone;
  ALTER TABLE "leads" ADD COLUMN "service_id" integer;
  ALTER TABLE "leads" ADD COLUMN "brief_company" varchar;
  ALTER TABLE "leads" ADD COLUMN "brief_team_size" varchar;
  ALTER TABLE "leads" ADD COLUMN "brief_target_behaviors" varchar;
  ALTER TABLE "leads" ADD COLUMN "brief_timeline" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "rate_limit_hits_id" integer;
  CREATE INDEX "rate_limit_hits_key_idx" ON "rate_limit_hits" USING btree ("key");
  CREATE INDEX "rate_limit_hits_updated_at_idx" ON "rate_limit_hits" USING btree ("updated_at");
  CREATE INDEX "rate_limit_hits_created_at_idx" ON "rate_limit_hits" USING btree ("created_at");
  ALTER TABLE "leads" ADD CONSTRAINT "leads_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rate_limit_hits_fk" FOREIGN KEY ("rate_limit_hits_id") REFERENCES "public"."rate_limit_hits"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "leads_service_idx" ON "leads" USING btree ("service_id");
  CREATE INDEX "payload_locked_documents_rels_rate_limit_hits_id_idx" ON "payload_locked_documents_rels" USING btree ("rate_limit_hits_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rate_limit_hits" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "rate_limit_hits" CASCADE;
  ALTER TABLE "leads" DROP CONSTRAINT "leads_service_id_services_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_rate_limit_hits_fk";
  
  DROP INDEX "leads_service_idx";
  DROP INDEX "payload_locked_documents_rels_rate_limit_hits_id_idx";
  ALTER TABLE "leads" DROP COLUMN "consent_at";
  ALTER TABLE "leads" DROP COLUMN "service_id";
  ALTER TABLE "leads" DROP COLUMN "brief_company";
  ALTER TABLE "leads" DROP COLUMN "brief_team_size";
  ALTER TABLE "leads" DROP COLUMN "brief_target_behaviors";
  ALTER TABLE "leads" DROP COLUMN "brief_timeline";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "rate_limit_hits_id";`)
}
