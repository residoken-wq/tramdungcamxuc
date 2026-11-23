import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Lesson link to Hana's Facebook / TikTok video. Adds one nullable column; no data changes.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "social_video_url" varchar;
    ALTER TABLE "_lessons_v" ADD COLUMN IF NOT EXISTS "version_social_video_url" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "lessons" DROP COLUMN IF EXISTS "social_video_url";
    ALTER TABLE "_lessons_v" DROP COLUMN IF EXISTS "version_social_video_url";
  `)
}
