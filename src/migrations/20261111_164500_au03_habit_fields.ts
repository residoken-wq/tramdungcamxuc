import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "curriculum_unit_label" varchar;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_curriculum_unit_label" varchar;

    ALTER TABLE "techniques" ADD COLUMN IF NOT EXISTS "apply_label" varchar;
    ALTER TABLE "techniques" ADD COLUMN IF NOT EXISTS "apply_placeholder" varchar;
    ALTER TABLE "_techniques_v" ADD COLUMN IF NOT EXISTS "version_apply_label" varchar;
    ALTER TABLE "_techniques_v" ADD COLUMN IF NOT EXISTS "version_apply_placeholder" varchar;

    -- Điền sẵn nhãn / gợi ý riêng cho kỹ thuật "Soi lại nhịp sinh học" nếu đang trống
    UPDATE "techniques"
    SET
      "apply_label" = 'Thói quen tốt tôi nhận ra:',
      "apply_placeholder" = 'Ngồi thiền'
    WHERE "name" = 'Soi lại nhịp sinh học'
      AND ("apply_label" IS NULL OR BTRIM("apply_label") = '')
      AND ("apply_placeholder" IS NULL OR BTRIM("apply_placeholder") = '');

    UPDATE "_techniques_v"
    SET
      "version_apply_label" = 'Thói quen tốt tôi nhận ra:',
      "version_apply_placeholder" = 'Ngồi thiền'
    WHERE "version_name" = 'Soi lại nhịp sinh học'
      AND ("version_apply_label" IS NULL OR BTRIM("version_apply_label") = '')
      AND ("version_apply_placeholder" IS NULL OR BTRIM("version_apply_placeholder") = '');
  `)
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

