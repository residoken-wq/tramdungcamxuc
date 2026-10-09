import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" ALTER COLUMN "terms_accepted_at" DROP NOT NULL;
  ALTER TABLE "entitlements" ADD COLUMN "order_id" integer;
  ALTER TABLE "entitlements" ADD COLUMN "grant_key" varchar;
  ALTER TABLE "orders" ADD COLUMN "trial_credit_order_id" integer;
  ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_trial_credit_order_id_orders_id_fk" FOREIGN KEY ("trial_credit_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "entitlements_order_idx" ON "entitlements" USING btree ("order_id");
  CREATE UNIQUE INDEX "entitlements_grant_key_idx" ON "entitlements" USING btree ("grant_key");
  CREATE UNIQUE INDEX "orders_trial_credit_order_idx" ON "orders" USING btree ("trial_credit_order_id");`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "entitlements" DROP CONSTRAINT "entitlements_order_id_orders_id_fk";
  
  ALTER TABLE "orders" DROP CONSTRAINT "orders_trial_credit_order_id_orders_id_fk";
  
  DROP INDEX "entitlements_order_idx";
  DROP INDEX "entitlements_grant_key_idx";
  DROP INDEX "orders_trial_credit_order_idx";
  ALTER TABLE "orders" ALTER COLUMN "terms_accepted_at" SET NOT NULL;
  ALTER TABLE "entitlements" DROP COLUMN "order_id";
  ALTER TABLE "entitlements" DROP COLUMN "grant_key";
  ALTER TABLE "orders" DROP COLUMN "trial_credit_order_id";`)
}
