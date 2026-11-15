import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "hide_offer_includes" boolean DEFAULT false;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "hide_offer_stats" boolean DEFAULT false;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "hide_offer_curriculum" boolean DEFAULT false;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "hide_offer_features" boolean DEFAULT false;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "hide_offer_faq" boolean DEFAULT false;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "hide_offer_bottom" boolean DEFAULT false;

    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_hide_offer_includes" boolean DEFAULT false;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_hide_offer_stats" boolean DEFAULT false;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_hide_offer_curriculum" boolean DEFAULT false;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_hide_offer_features" boolean DEFAULT false;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_hide_offer_faq" boolean DEFAULT false;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_hide_offer_bottom" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" DROP COLUMN IF EXISTS "hide_offer_includes";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "hide_offer_stats";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "hide_offer_curriculum";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "hide_offer_features";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "hide_offer_faq";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "hide_offer_bottom";

    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_hide_offer_includes";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_hide_offer_stats";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_hide_offer_curriculum";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_hide_offer_features";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_hide_offer_faq";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_hide_offer_bottom";
  `)
}
