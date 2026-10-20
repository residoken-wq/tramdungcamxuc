import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_pages_template" ADD VALUE 'home-v2' BEFORE 'campaign';
  ALTER TYPE "public"."enum_pages_template" ADD VALUE 'journey' BEFORE 'campaign';
  ALTER TYPE "public"."enum_pages_template" ADD VALUE 'about' BEFORE 'campaign';
  ALTER TYPE "public"."enum_pages_template" ADD VALUE 'coach' BEFORE 'campaign';
  ALTER TYPE "public"."enum_pages_template" ADD VALUE 'contact' BEFORE 'campaign';
  ALTER TYPE "public"."enum__pages_v_version_template" ADD VALUE 'home-v2' BEFORE 'campaign';
  ALTER TYPE "public"."enum__pages_v_version_template" ADD VALUE 'journey' BEFORE 'campaign';
  ALTER TYPE "public"."enum__pages_v_version_template" ADD VALUE 'about' BEFORE 'campaign';
  ALTER TYPE "public"."enum__pages_v_version_template" ADD VALUE 'coach' BEFORE 'campaign';
  ALTER TYPE "public"."enum__pages_v_version_template" ADD VALUE 'contact' BEFORE 'campaign';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // PostgreSQL không hỗ trợ xóa giá trị trực tiếp khỏi kiểu enum (ALTER TYPE DROP VALUE).
  // Để tránh lỗi và nguy cơ mất dữ liệu khi rollback, hàm down để trống theo đặc tả SM-07.
}
