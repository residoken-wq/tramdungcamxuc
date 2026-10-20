import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_pages_template" ADD VALUE 'community' BEFORE 'campaign';
  ALTER TYPE "public"."enum_pages_template" ADD VALUE 'business' BEFORE 'campaign';
  ALTER TYPE "public"."enum__pages_v_version_template" ADD VALUE 'community' BEFORE 'campaign';
  ALTER TYPE "public"."enum__pages_v_version_template" ADD VALUE 'business' BEFORE 'campaign';`)
}

export async function down({ db: _db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  // PostgreSQL không hỗ trợ xóa giá trị trực tiếp khỏi kiểu enum (ALTER TYPE DROP VALUE).
  // Để tránh lỗi và nguy cơ mất dữ liệu khi rollback, hàm down để trống theo đặc tả SM-08 (như SM-07).
}
