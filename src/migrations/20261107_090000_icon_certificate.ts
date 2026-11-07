import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Brand icon "certificate" (Chứng nhận) – also selectable as a product icon.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TYPE "public"."enum_products_icon" ADD VALUE IF NOT EXISTS 'certificate';
  ALTER TYPE "public"."enum__products_v_version_icon" ADD VALUE IF NOT EXISTS 'certificate';`)
}

// Postgres cannot drop an enum value; products using it keep a valid value.
export async function down(_args: MigrateDownArgs): Promise<void> {}
