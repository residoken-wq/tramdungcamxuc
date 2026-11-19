import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// REVIEW-REQUIRED: BX-07 migration adding video_source and youtube_url to lessons
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_lessons_video_source" AS ENUM('bunny', 'youtube');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__lessons_v_version_video_source" AS ENUM('bunny', 'youtube');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "video_source" "enum_lessons_video_source" DEFAULT 'bunny';
    ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "youtube_url" varchar;

    ALTER TABLE "_lessons_v" ADD COLUMN IF NOT EXISTS "version_video_source" "enum__lessons_v_version_video_source" DEFAULT 'bunny';
    ALTER TABLE "_lessons_v" ADD COLUMN IF NOT EXISTS "version_youtube_url" varchar;

    UPDATE "lessons" SET "video_source" = 'bunny' WHERE "video_source" IS NULL;
    UPDATE "_lessons_v" SET "version_video_source" = 'bunny' WHERE "version_video_source" IS NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "lessons" DROP COLUMN IF EXISTS "video_source";
    ALTER TABLE "lessons" DROP COLUMN IF EXISTS "youtube_url";

    ALTER TABLE "_lessons_v" DROP COLUMN IF EXISTS "version_video_source";
    ALTER TABLE "_lessons_v" DROP COLUMN IF EXISTS "version_youtube_url";

    DROP TYPE IF EXISTS "public"."enum_lessons_video_source";
    DROP TYPE IF EXISTS "public"."enum__lessons_v_version_video_source";
  `)
}
