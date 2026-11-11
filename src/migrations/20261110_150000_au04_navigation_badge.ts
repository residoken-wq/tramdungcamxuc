import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "navigation_main_menu" ADD COLUMN IF NOT EXISTS "badge" varchar;
   ALTER TABLE "navigation_main_menu_children_items" ADD COLUMN IF NOT EXISTS "badge" varchar;
   ALTER TABLE "navigation_footer_menu" ADD COLUMN IF NOT EXISTS "badge" varchar;`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "navigation_main_menu" DROP COLUMN IF EXISTS "badge";
   ALTER TABLE "navigation_main_menu_children_items" DROP COLUMN IF EXISTS "badge";
   ALTER TABLE "navigation_footer_menu" DROP COLUMN IF EXISTS "badge";`)
}

