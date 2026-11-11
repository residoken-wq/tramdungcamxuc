import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { vi } from '../lib/i18n/vi'
import type { Product } from '../payload-types'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE IF NOT EXISTS "products_curriculum_modules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "products_feature_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_products_v_version_curriculum_modules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_products_v_version_feature_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "offer_series_label" varchar;
  ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "offer_title_line1" varchar;
  ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "offer_title_line2" varchar;
  ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "offer_emotion_line" varchar;
  ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "curriculum_heading" varchar;
  ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "curriculum_subheading" varchar;
  ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "features_heading" varchar;
  ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "features_subheading" varchar;
  ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "bottom_title" varchar;
  ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "bottom_description" varchar;

  ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_offer_series_label" varchar;
  ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_offer_title_line1" varchar;
  ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_offer_title_line2" varchar;
  ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_offer_emotion_line" varchar;
  ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_curriculum_heading" varchar;
  ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_curriculum_subheading" varchar;
  ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_features_heading" varchar;
  ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_features_subheading" varchar;
  ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_bottom_title" varchar;
  ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_bottom_description" varchar;

  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'products_curriculum_modules_parent_id_fk'
    ) THEN
      ALTER TABLE "products_curriculum_modules" ADD CONSTRAINT "products_curriculum_modules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;

  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'products_feature_items_parent_id_fk'
    ) THEN
      ALTER TABLE "products_feature_items" ADD CONSTRAINT "products_feature_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;

  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = '_products_v_version_curriculum_modules_parent_id_fk'
    ) THEN
      ALTER TABLE "_products_v_version_curriculum_modules" ADD CONSTRAINT "_products_v_version_curriculum_modules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;

  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = '_products_v_version_feature_items_parent_id_fk'
    ) THEN
      ALTER TABLE "_products_v_version_feature_items" ADD CONSTRAINT "_products_v_version_feature_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;

  CREATE INDEX IF NOT EXISTS "products_curriculum_modules_order_idx" ON "products_curriculum_modules" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "products_curriculum_modules_parent_id_idx" ON "products_curriculum_modules" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "products_feature_items_order_idx" ON "products_feature_items" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "products_feature_items_parent_id_idx" ON "products_feature_items" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_products_v_version_curriculum_modules_order_idx" ON "_products_v_version_curriculum_modules" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_products_v_version_curriculum_modules_parent_id_idx" ON "_products_v_version_curriculum_modules" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_products_v_version_feature_items_order_idx" ON "_products_v_version_feature_items" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_products_v_version_feature_items_parent_id_idx" ON "_products_v_version_feature_items" USING btree ("_parent_id");
  `)

  // REVIEW-REQUIRED: Điền sẵn chữ mặc định từ vi.habit.offer cho sản phẩm habit-tracker-so nếu đã tồn tại (PK-30).
  // Dùng SQL trực tiếp trên DB thật để không phụ thuộc các cột schema thêm ở migration sau (vd: curriculum_unit_label).
  const existingCheck = (await db.execute(sql`
    SELECT "id", "offer_title_line1", "curriculum_heading"
    FROM "products"
    WHERE "slug" = 'habit-tracker-so'
    LIMIT 1
  `)) as { rows?: Array<{ id: number; offer_title_line1: string | null; curriculum_heading: string | null }> } | undefined

  if (existingCheck && Array.isArray(existingCheck.rows)) {
    const existing = existingCheck.rows[0]
    if (!existing) {
      return
    }
    const modsCountRes = (await db.execute(sql`
      SELECT count(*)::int AS "cnt"
      FROM "products_curriculum_modules"
      WHERE "_parent_id" = ${existing.id}
    `)) as { rows?: Array<{ cnt: number }> } | undefined
    const modsCount = modsCountRes?.rows?.[0]?.cnt ?? 0
    const isEmpty = !existing.offer_title_line1 && !existing.curriculum_heading && modsCount === 0
    if (!isEmpty) {
      return
    }

    await db.execute(sql`
      UPDATE "products"
      SET
        "offer_series_label" = ${vi.habit.offer.badge},
        "offer_title_line1" = ${vi.habit.offer.titleLine1},
        "offer_title_line2" = ${vi.habit.offer.titleLine2},
        "offer_emotion_line" = ${vi.habit.offer.emotionalLine},
        "curriculum_heading" = ${vi.habit.offer.curriculum.heading},
        "curriculum_subheading" = ${vi.habit.offer.curriculum.subheading},
        "features_heading" = ${vi.habit.offer.features.heading},
        "features_subheading" = ${vi.habit.offer.features.subheading},
        "bottom_title" = ${'Bắt đầu hành trình {ngay} ngày của bạn'}
      WHERE "id" = ${existing.id}
    `)
    for (let idx = 0; idx < vi.habit.offer.curriculum.modules.length; idx++) {
      const m = vi.habit.offer.curriculum.modules[idx]
      await db.execute(sql`
        INSERT INTO "products_curriculum_modules" ("_order", "_parent_id", "id", "title", "description")
        VALUES (${idx + 1}, ${existing.id}, ${`pk30-mod-${existing.id}-${idx + 1}`}, ${m.title}, ${m.desc})
        ON CONFLICT ("id") DO NOTHING
      `)
    }
    for (let idx = 0; idx < vi.habit.offer.features.items.length; idx++) {
      const item = vi.habit.offer.features.items[idx]
      await db.execute(sql`
        INSERT INTO "products_feature_items" ("_order", "_parent_id", "id", "title", "description")
        VALUES (${idx + 1}, ${existing.id}, ${`pk30-feat-${existing.id}-${idx + 1}`}, ${item.title}, ${item.desc})
        ON CONFLICT ("id") DO NOTHING
      `)
    }
    return
  }

  // Fallback cho mockPayload trong unit test
  if (payload) {
    const found = await payload.find({
      collection: 'products',
      where: { slug: { equals: 'habit-tracker-so' } },
      draft: true,
      limit: 1,
      depth: 0,
      req,
    })

    if (found.docs.length > 0) {
      const doc = found.docs[0] as Product
      const isEmpty =
        !doc.offerTitleLine1 &&
        !doc.curriculumHeading &&
        (!doc.curriculumModules || doc.curriculumModules.length === 0)

      if (isEmpty) {
        const defaultData = {
          offerSeriesLabel: vi.habit.offer.badge,
          offerTitleLine1: vi.habit.offer.titleLine1,
          offerTitleLine2: vi.habit.offer.titleLine2,
          offerEmotionLine: vi.habit.offer.emotionalLine,
          curriculumHeading: vi.habit.offer.curriculum.heading,
          curriculumSubheading: vi.habit.offer.curriculum.subheading,
          curriculumModules: vi.habit.offer.curriculum.modules.map((m) => ({
            title: m.title,
            description: m.desc,
          })),
          featuresHeading: vi.habit.offer.features.heading,
          featuresSubheading: vi.habit.offer.features.subheading,
          featureItems: vi.habit.offer.features.items.map((item) => ({
            title: item.title,
            description: item.desc,
          })),
          bottomTitle: 'Bắt đầu hành trình {ngay} ngày của bạn',
        }

        await payload.update({
          collection: 'products',
          id: doc.id,
          data: defaultData,
          draft: false,
          req,
        })
      }
    }
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE IF EXISTS "products_curriculum_modules" CASCADE;
  DROP TABLE IF EXISTS "products_feature_items" CASCADE;
  DROP TABLE IF EXISTS "_products_v_version_curriculum_modules" CASCADE;
  DROP TABLE IF EXISTS "_products_v_version_feature_items" CASCADE;
  ALTER TABLE "products" DROP COLUMN IF EXISTS "offer_series_label";
  ALTER TABLE "products" DROP COLUMN IF EXISTS "offer_title_line1";
  ALTER TABLE "products" DROP COLUMN IF EXISTS "offer_title_line2";
  ALTER TABLE "products" DROP COLUMN IF EXISTS "offer_emotion_line";
  ALTER TABLE "products" DROP COLUMN IF EXISTS "curriculum_heading";
  ALTER TABLE "products" DROP COLUMN IF EXISTS "curriculum_subheading";
  ALTER TABLE "products" DROP COLUMN IF EXISTS "features_heading";
  ALTER TABLE "products" DROP COLUMN IF EXISTS "features_subheading";
  ALTER TABLE "products" DROP COLUMN IF EXISTS "bottom_title";
  ALTER TABLE "products" DROP COLUMN IF EXISTS "bottom_description";
  ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_offer_series_label";
  ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_offer_title_line1";
  ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_offer_title_line2";
  ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_offer_emotion_line";
  ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_curriculum_heading";
  ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_curriculum_subheading";
  ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_features_heading";
  ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_features_subheading";
  ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_bottom_title";
  ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_bottom_description";`)
}
