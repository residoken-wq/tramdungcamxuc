import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { LEGACY_PAGE_SLUGS, LEGACY_REDIRECTS, reverseMapping, rewriteLinks } from '../lib/paths'

// SM-02 (data only, no schema change): sitemap v2 paths.
// REVIEW-REQUIRED: touches pages Hana has built. Page slugs are renamed only when the target
// slug is free (never overwritten); links inside puckData / menus are rewritten only when a
// whole string is an old path (sentences that mention a path are left alone).

type Db = MigrateUpArgs['db']
type SlugMapping = ReadonlyArray<{ readonly from: string; readonly to: string }>
type LinkMapping = Parameters<typeof rewriteLinks>[1]

function rowsOf<T>(result: unknown): T[] {
  return ((result as { rows?: T[] })?.rows ?? result) as T[]
}

async function renameSlugs(db: Db, mapping: SlugMapping): Promise<void> {
  for (const { from, to } of mapping) {
    const source = rowsOf<{ id: number }>(
      await db.execute(sql`SELECT "id" FROM "pages" WHERE "slug" = ${from} LIMIT 1`),
    )
    if (source.length === 0) continue
    const taken = rowsOf<{ id: number }>(
      await db.execute(sql`SELECT "id" FROM "pages" WHERE "slug" = ${to} LIMIT 1`),
    )
    if (taken.length > 0) {
      console.warn(
        `[Migration SM-02] Đã có trang đường dẫn "${to}" – giữ nguyên trang "${from}", không ghi đè.`,
      )
      continue
    }
    const renamed = rowsOf<{ id: number }>(
      await db.execute(
        sql`UPDATE "pages" SET "slug" = ${to} WHERE "slug" = ${from} RETURNING "id"`,
      ),
    )
    for (const { id } of renamed) {
      // Keep version history consistent so restoring an old version does not bring back the old slug.
      await db.execute(
        sql`UPDATE "_pages_v" SET "version_slug" = ${to} WHERE "parent_id" = ${id} AND "version_slug" = ${from}`,
      )
    }
  }
}

async function rewriteJsonColumn(
  db: Db,
  table: 'pages' | '_pages_v',
  column: 'puck_data' | 'version_puck_data',
  mapping: LinkMapping,
): Promise<number> {
  const rows = rowsOf<{ id: number; data: unknown }>(
    await db.execute(
      sql`SELECT "id", ${sql.identifier(column)} AS "data" FROM ${sql.identifier(table)} WHERE ${sql.identifier(column)} IS NOT NULL`,
    ),
  )
  let total = 0
  for (const row of rows) {
    const { value, changed } = rewriteLinks(row.data, mapping)
    if (!changed) continue
    total += changed
    await db.execute(
      sql`UPDATE ${sql.identifier(table)} SET ${sql.identifier(column)} = ${JSON.stringify(value)}::jsonb WHERE "id" = ${row.id}`,
    )
  }
  return total
}

async function rewriteUrlColumn(
  db: Db,
  table: 'navigation_main_menu' | 'navigation_main_menu_children_items' | 'navigation_footer_menu',
  mapping: LinkMapping,
): Promise<number> {
  const rows = rowsOf<{ id: string; url: string }>(
    await db.execute(sql`SELECT "id", "url" FROM ${sql.identifier(table)} WHERE "url" IS NOT NULL`),
  )
  let total = 0
  for (const row of rows) {
    const { value, changed } = rewriteLinks(row.url, mapping)
    if (!changed) continue
    total += changed
    await db.execute(
      sql`UPDATE ${sql.identifier(table)} SET "url" = ${value} WHERE "id" = ${row.id}`,
    )
  }
  return total
}

async function rewriteAllLinks(db: Db, mapping: LinkMapping, label: string): Promise<void> {
  const changed =
    (await rewriteJsonColumn(db, 'pages', 'puck_data', mapping)) +
    (await rewriteJsonColumn(db, '_pages_v', 'version_puck_data', mapping)) +
    (await rewriteUrlColumn(db, 'navigation_main_menu', mapping)) +
    (await rewriteUrlColumn(db, 'navigation_main_menu_children_items', mapping)) +
    (await rewriteUrlColumn(db, 'navigation_footer_menu', mapping))
  if (changed) console.info(`[Migration SM-02] ${label}: đã đổi ${changed} liên kết.`)
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await renameSlugs(db, LEGACY_PAGE_SLUGS)
  await rewriteAllLinks(db, LEGACY_REDIRECTS, 'Sang đường dẫn mới')
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await rewriteAllLinks(db, reverseMapping(LEGACY_REDIRECTS), 'Trả về đường dẫn cũ')
  await renameSlugs(db, reverseMapping(LEGACY_PAGE_SLUGS))
}
