import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "private_files" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"description" varchar,
  	"is_sample" boolean DEFAULT false,
  	"prefix" varchar DEFAULT 'private',
  	"_objectkey" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  ALTER TABLE "products_files" DROP CONSTRAINT "products_files_file_id_media_id_fk";
  
  ALTER TABLE "_products_v_version_files" DROP CONSTRAINT "_products_v_version_files_file_id_media_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "private_files_id" integer;
  CREATE INDEX "private_files_updated_at_idx" ON "private_files" USING btree ("updated_at");
  CREATE INDEX "private_files_created_at_idx" ON "private_files" USING btree ("created_at");
  CREATE UNIQUE INDEX "private_files_filename_idx" ON "private_files" USING btree ("filename");
  ALTER TABLE "products_files" ADD CONSTRAINT "products_files_file_id_private_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."private_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_version_files" ADD CONSTRAINT "_products_v_version_files_file_id_private_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."private_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_private_files_fk" FOREIGN KEY ("private_files_id") REFERENCES "public"."private_files"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_private_files_id_idx" ON "payload_locked_documents_rels" USING btree ("private_files_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "private_files" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "private_files" CASCADE;
  ALTER TABLE "products_files" DROP CONSTRAINT "products_files_file_id_private_files_id_fk";
  
  ALTER TABLE "_products_v_version_files" DROP CONSTRAINT "_products_v_version_files_file_id_private_files_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_private_files_fk";
  
  DROP INDEX "payload_locked_documents_rels_private_files_id_idx";
  ALTER TABLE "products_files" ADD CONSTRAINT "products_files_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_version_files" ADD CONSTRAINT "_products_v_version_files_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "private_files_id";`)
}
