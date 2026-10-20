import type { Payload } from 'payload'
import { getTemplateData, type PageTemplateKey } from '../src/puck/templates'

export type TemplateDraftMapping = {
  slug: string
  template: PageTemplateKey
  defaultTitle: string
}

export const TEMPLATE_DRAFT_MAPPINGS: readonly TemplateDraftMapping[] = [
  { slug: '/', template: 'home-v2', defaultTitle: '[MẪU] Trang chủ' },
  { slug: 'lo-trinh-chuyen-minh', template: 'journey', defaultTitle: '[MẪU] Lộ trình chuyển mình' },
  { slug: 've-tram', template: 'about', defaultTitle: '[MẪU] Về Trạm' },
  { slug: 'coaching', template: 'coach', defaultTitle: '[MẪU] Khai vấn 1:1' },
  { slug: 'lien-he', template: 'contact', defaultTitle: '[MẪU] Liên hệ' },
  { slug: 'cong-dong', template: 'community', defaultTitle: '[MẪU] Cộng đồng' },
  { slug: 'doanh-nghiep', template: 'business', defaultTitle: '[MẪU] Doanh nghiệp' },
] as const

export type TemplateDraftReport = {
  created: number
  drafted: number
  skipped: number
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return false
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }
  const objA = a as Record<string, unknown>
  const objB = b as Record<string, unknown>
  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)
  if (keysA.length !== keysB.length) return false
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(objB, key)) return false
    if (!deepEqual(objA[key], objB[key])) return false
  }
  return true
}

export function normalizePuckData(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data
  const d = data as Record<string, unknown>
  const normalized: Record<string, unknown> = {}
  if (d.content) normalized.content = d.content
  if (d.root) normalized.root = d.root
  if (d.zones && typeof d.zones === 'object' && Object.keys(d.zones).length > 0) {
    normalized.zones = d.zones
  }
  return normalized
}

export function arePuckDataEquivalent(a: unknown, b: unknown): boolean {
  return deepEqual(normalizePuckData(a), normalizePuckData(b))
}

/**
 * Tạo bản nháp từ mẫu sitemap v2 cho 5 trang cốt lõi:
 * '/', 'lo-trinh-chuyen-minh', 've-tram', 'coaching', 'lien-he'.
 *
 * Quy tắc:
 * 1. Chưa có trang -> tạo trang nháp mới (_status: 'draft', isSample: true).
 * 2. Đã có trang -> chỉ cập nhật bản nháp (draft: true), bản xuất bản không đổi.
 * 3. Bỏ qua nếu: bản mới nhất là nháp đã giống mẫu (chạy 2 lần không tạo version mới),
 *    hoặc bản mới nhất là nháp đang sửa dở (mới hơn bản xuất bản và khác mẫu).
 */
export async function seedTemplateDrafts(
  payload: Payload,
  mappings: readonly TemplateDraftMapping[] = TEMPLATE_DRAFT_MAPPINGS,
): Promise<TemplateDraftReport> {
  const report: TemplateDraftReport = {
    created: 0,
    drafted: 0,
    skipped: 0,
  }

  for (const mapping of mappings) {
    const { slug, template: templateKey, defaultTitle } = mapping

    // Tra trang hiện tại (lấy cả nháp để biết trạng thái mới nhất; nếu chưa có nháp, tra bản xuất bản)
    let existingDraftRes = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      draft: true,
      overrideAccess: true,
    })
    if (existingDraftRes.docs.length === 0) {
      existingDraftRes = await payload.find({
        collection: 'pages',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 0,
        draft: false,
        overrideAccess: true,
      })
    }

    if (existingDraftRes.docs.length === 0) {
      // 1. Chưa có trang -> tạo mới bản nháp
      const templateData = getTemplateData(templateKey, defaultTitle)
      if (!templateData) {
        report.skipped++
        console.log(`[template-drafts] ${slug}: skipped (template ${templateKey} not found)`)
        continue
      }

      await payload.create({
        collection: 'pages',
        data: {
          slug,
          title: defaultTitle,
          template: templateKey,
          puckData: templateData,
          isSample: true,
          _status: 'draft',
        },
        draft: true,
        overrideAccess: true,
      })

      report.created++
      console.log(`[template-drafts] ${slug}: created draft page`)
      continue
    }

    const page = existingDraftRes.docs[0]
    const pageTitle = (typeof page.title === 'string' && page.title.trim()) || defaultTitle
    const templateData = getTemplateData(templateKey, pageTitle)
    if (!templateData) {
      report.skipped++
      console.log(`[template-drafts] ${slug}: skipped (template ${templateKey} not found)`)
      continue
    }

    // Tra lịch sử phiên bản để kiểm tra bản mới nhất
    const versionsRes = await payload.findVersions({
      collection: 'pages',
      where: { parent: { equals: page.id } },
      sort: '-createdAt',
      limit: 5,
      overrideAccess: true,
    })

    const latestVersionDoc = versionsRes.docs[0]
    const latestVersion =
      (latestVersionDoc?.version as unknown as Record<string, unknown> | undefined) || {}
    const latestStatus =
      (latestVersion._status as string | undefined) ?? (page._status as string | undefined)
    const latestPuckData = latestVersion.puckData ?? page.puckData

    // Điều kiện A: Bản nháp mới nhất đã giống mẫu -> Bỏ qua, không tạo thêm version
    if (arePuckDataEquivalent(latestPuckData, templateData)) {
      report.skipped++
      console.log(`[template-drafts] ${slug}: skipped (draft matches template)`)
      continue
    }

    // Tra xem trang đã có bản xuất bản chưa
    const publishedRes = await payload.find({
      collection: 'pages',
      where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
      limit: 1,
      depth: 0,
      draft: false,
    })
    const isPublished = publishedRes.docs.length > 0

    // Điều kiện B: Nếu bản mới nhất là nháp (draft) khác mẫu, và trang đã có bản xuất bản
    // (nghĩa là có người đang sửa dở một bản nháp trên nền bản xuất bản) -> Bỏ qua, không đè
    if (isPublished && latestStatus === 'draft') {
      report.skipped++
      console.log(`[template-drafts] ${slug}: skipped (in-progress draft exists)`)
      continue
    }

    // Nếu trang chưa từng xuất bản nhưng đã có nội dung khác mẫu -> không đè
    if (!isPublished && latestStatus === 'draft' && latestPuckData) {
      report.skipped++
      console.log(`[template-drafts] ${slug}: skipped (in-progress unpublished draft exists)`)
      continue
    }

    // 2. Trang đã có (mẫu hoặc thật, đang ở bản xuất bản mới nhất) -> chỉ ghi bản nháp
    await payload.update({
      collection: 'pages',
      id: page.id,
      data: {
        puckData: templateData,
        template: templateKey,
      },
      draft: true,
      overrideAccess: true,
    })

    report.drafted++
    console.log(`[template-drafts] ${slug}: created draft from template`)
  }

  return report
}
