import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import type { Technique } from '../payload-types'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "curriculum_unit_label" varchar;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_curriculum_unit_label" varchar;

    ALTER TABLE "techniques" ADD COLUMN IF NOT EXISTS "apply_label" varchar;
    ALTER TABLE "techniques" ADD COLUMN IF NOT EXISTS "apply_placeholder" varchar;
    ALTER TABLE "_techniques_v" ADD COLUMN IF NOT EXISTS "version_apply_label" varchar;
    ALTER TABLE "_techniques_v" ADD COLUMN IF NOT EXISTS "version_apply_placeholder" varchar;
  `)

  // Điền sẵn nhãn / gợi ý riêng cho kỹ thuật "Soi lại nhịp sinh học" nếu đang trống
  if (payload) {
    try {
      const found = await payload.find({
        collection: 'techniques',
        where: { name: { equals: 'Soi lại nhịp sinh học' } },
        draft: true,
        limit: 5,
        depth: 0,
        req,
      })

      for (const item of found.docs) {
        const doc = item as Technique
        if (!doc.applyLabel && !doc.applyPlaceholder) {
          await payload.update({
            collection: 'techniques',
            id: doc.id,
            data: {
              applyLabel: 'Thói quen tốt tôi nhận ra:',
              applyPlaceholder: 'Ngồi thiền',
            },
            draft: doc._status === 'draft',
            req,
          })
        }
      }
    } catch (err) {
      console.warn('[au03_habit_fields] Warning during technique backfill:', err)
    }
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" DROP COLUMN IF EXISTS "curriculum_unit_label";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_curriculum_unit_label";

    ALTER TABLE "techniques" DROP COLUMN IF EXISTS "apply_label";
    ALTER TABLE "techniques" DROP COLUMN IF EXISTS "apply_placeholder";
    ALTER TABLE "_techniques_v" DROP COLUMN IF EXISTS "version_apply_label";
    ALTER TABLE "_techniques_v" DROP COLUMN IF EXISTS "version_apply_placeholder";
  `)
}

