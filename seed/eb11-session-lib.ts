// REVIEW-REQUIRED: Thư viện chuẩn bị dữ liệu và dọn dẹp buổi thử builder EB-11.
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import type { Payload } from 'payload'
import sharp from 'sharp'
import { collectDemoSeedFacts } from './demo-gd2-lib'
import { checkDemoSeedAllowed, checkDemoSeedEnv } from './demo-guard'

// Intercept server-only package when executed outside Next.js bundler
const require = createRequire(import.meta.url)
try {
  const resolved = require.resolve('server-only')
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports: {},
  } as unknown as NodeJS.Module
} catch {
  // Ignored in environments where server-only is mocked or not loaded
}

export const EB11_SAMPLE_PREFIX = '[MẪU]'
export const EB11_SAMPLE_PAGE_TITLE = '[MẪU] Trang thử builder'
export const EB11_SAMPLE_PAGE_SLUG = 'mau-trang-thu-builder'
export const EB11_BACKUP_DIR = 'backups'
export const EB11_SESSION_META_FILE = path.join(EB11_BACKUP_DIR, 'eb11-session-meta.json')

export const EB11_SAMPLE_IMAGES = [
  {
    alt: '[MẪU] Ảnh minh họa 1 - Cây mầm xanh',
    filename: 'eb11-sample-mam-xanh.png',
    width: 400,
    height: 300,
    r: 217,
    g: 241,
    b: 234, // mint-haze
  },
  {
    alt: '[MẪU] Ảnh minh họa 2 - Bầu trời bình an',
    filename: 'eb11-sample-bau-troi.png',
    width: 400,
    height: 300,
    r: 233,
    g: 221,
    b: 249, // lavender-mist
  },
] as const

export interface DeletableRecord {
  id: string | number
  title?: string | null
  name?: string | null
  alt?: string | null
  createdAt?: string | Date | null
}

export interface SessionMeta {
  startedAt: string
  backupPath: string
}

/**
 * Kiểm tra xem một bản ghi có phải là dữ liệu [MẪU] do buổi thử tạo ra không.
 * Điều kiện bắt buộc:
 * 1. Tiêu đề / tên / alt BẮT ĐẦU bằng "[MẪU]". Không bao giờ chọn bản ghi thiếu "[MẪU]".
 * 2. Nếu có mốc thời gian sessionStartedAt, bản ghi phải được tạo từ mốc này trở đi (cho phép độ trễ 1000ms).
 */
export function isSessionSampleRecord(
  record: DeletableRecord,
  sessionStartedAt?: string | Date | null,
): boolean {
  const nameOrTitle = record.title ?? record.name ?? record.alt
  if (typeof nameOrTitle !== 'string') return false
  const trimmed = nameOrTitle.trim()
  if (!trimmed.startsWith(EB11_SAMPLE_PREFIX)) return false

  if (sessionStartedAt) {
    if (!record.createdAt) return false
    const recordTime = new Date(record.createdAt).getTime()
    const sessionTime = new Date(sessionStartedAt).getTime()
    if (isNaN(recordTime) || isNaN(sessionTime)) return false
    // 1000ms margin for clock resolution
    if (recordTime < sessionTime - 1000) return false
  }

  return true
}

/**
 * Lọc danh sách bản ghi cần xóa. Đảm bảo 100% không bao giờ chọn bản ghi thiếu [MẪU].
 */
export function filterRecordsToDelete<T extends DeletableRecord>(
  records: T[],
  sessionStartedAt?: string | Date | null,
): T[] {
  return records.filter((r) => isSessionSampleRecord(r, sessionStartedAt))
}

/**
 * Tạo buffer ảnh PNG đơn sắc phục vụ thư viện media buổi thử.
 */
export async function createSamplePng(
  width: number,
  height: number,
  r: number,
  g: number,
  b: number,
): Promise<Buffer> {
  return await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r, g, b, alpha: 1 },
    },
  })
    .png()
    .toBuffer()
}

/**
 * Tìm file backup designSystem mới nhất trong thư mục backups.
 */
export function getLatestDesignSystemBackup(backupDir = EB11_BACKUP_DIR): string | null {
  if (!fs.existsSync(backupDir)) return null
  const files = fs
    .readdirSync(backupDir)
    .filter((f) => /^eb11-design-system-.*\.json$/.test(f))
    .sort()
    .reverse()
  if (files.length === 0) return null
  return path.join(backupDir, files[0])
}

/**
 * Ghi lại mốc bắt đầu buổi thử vào file meta để lệnh dọn biết mốc thời gian.
 */
export function recordSessionMeta(meta: SessionMeta): void {
  fs.mkdirSync(EB11_BACKUP_DIR, { recursive: true })
  fs.writeFileSync(EB11_SESSION_META_FILE, JSON.stringify(meta, null, 2), 'utf-8')
}

export function readSessionMeta(): SessionMeta | null {
  if (!fs.existsSync(EB11_SESSION_META_FILE)) return null
  try {
    const raw = fs.readFileSync(EB11_SESSION_META_FILE, 'utf-8')
    return JSON.parse(raw) as SessionMeta
  } catch {
    return null
  }
}

export function removeSessionMeta(): void {
  if (fs.existsSync(EB11_SESSION_META_FILE)) {
    fs.unlinkSync(EB11_SESSION_META_FILE)
  }
}

export interface SeedEb11SessionResult {
  pageId: string | number
  pageTitle: string
  mediaIds: (string | number)[]
  backupPath: string
  startedAt: string
  alreadySeeded: boolean
}

/**
 * Chuẩn bị dữ liệu mẫu cho buổi thử builder EB-11:
 * 1. Kiểm tra an toàn môi trường.
 * 2. Lưu backup designSystem.
 * 3. Tạo trang [MẪU] Trang thử builder (nếu chưa có).
 * 4. Tải 2 ảnh MẪU vào media (nếu chưa có).
 */
export async function seedEb11Session(
  payload: Payload,
  options?: { now?: Date },
): Promise<SeedEb11SessionResult> {
  const envGuard = checkDemoSeedEnv(process.env)
  if (!envGuard.ok) {
    throw new Error(envGuard.reason)
  }

  const facts = await collectDemoSeedFacts(payload)
  const guard = checkDemoSeedAllowed(process.env, facts)
  if (!guard.ok) {
    throw new Error(guard.reason)
  }

  const now = options?.now ?? new Date()
  const isoTimestamp = now.toISOString()
  fs.mkdirSync(EB11_BACKUP_DIR, { recursive: true })

  // 1. Sao lưu designSystem hiện tại
  const currentDesign = await payload.findGlobal({
    slug: 'designSystem',
    depth: 0,
    overrideAccess: true,
  })
  const backupFileName = `eb11-design-system-${isoTimestamp.replace(/[:.]/g, '-')}.json`
  const backupPath = path.join(EB11_BACKUP_DIR, backupFileName)
  fs.writeFileSync(backupPath, JSON.stringify(currentDesign, null, 2), 'utf-8')

  // Ghi nhận mốc bắt đầu buổi thử (nếu chưa có session meta thì tạo mới; nếu có rồi giữ nguyên mốc cũ để không bỏ sót bản ghi tạo trước đó)
  const existingMeta = readSessionMeta()
  const startedAt = existingMeta?.startedAt ?? isoTimestamp
  recordSessionMeta({ startedAt, backupPath })

  let alreadySeeded = true

  // 2. Tạo hoặc giữ nguyên trang [MẪU] Trang thử builder
  const existingPages = await payload.find({
    collection: 'pages',
    where: { slug: { equals: EB11_SAMPLE_PAGE_SLUG } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  let pageId: string | number
  if (existingPages.docs.length > 0) {
    pageId = existingPages.docs[0].id
  } else {
    alreadySeeded = false
    const createdPage = await payload.create({
      collection: 'pages',
      data: {
        title: EB11_SAMPLE_PAGE_TITLE,
        slug: EB11_SAMPLE_PAGE_SLUG,
        kind: 'page',
        _status: 'published',
        puckData: {
          root: { props: { title: EB11_SAMPLE_PAGE_TITLE } },
          content: [
            {
              type: 'SectionHeader',
              props: {
                id: 'eb11-sample-section-header',
                seriesLabel: '[MẪU] Buổi thử builder',
                titleLine1: 'TRANG THỬ BUILDER',
                titleLine2: 'TRẠM DỪNG CẢM XÚC',
                emotionLine: 'Trang mẫu dành riêng cho buổi thực hành của Hana',
                alignment: 'center',
                bgColor: 'warm-ivory',
              },
            },
          ],
          zones: {},
        },
      },
      overrideAccess: true,
    })
    pageId = createdPage.id
  }

  // 3. Tạo hoặc giữ nguyên 2 ảnh MẪU
  const mediaIds: (string | number)[] = []
  for (const imgSpec of EB11_SAMPLE_IMAGES) {
    const existingMedia = await payload.find({
      collection: 'media',
      where: { alt: { equals: imgSpec.alt } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (existingMedia.docs.length > 0) {
      mediaIds.push(existingMedia.docs[0].id)
    } else {
      alreadySeeded = false
      const pngBuffer = await createSamplePng(
        imgSpec.width,
        imgSpec.height,
        imgSpec.r,
        imgSpec.g,
        imgSpec.b,
      )
      const createdMedia = await payload.create({
        collection: 'media',
        data: {
          alt: imgSpec.alt,
          isSample: true,
        },
        file: {
          data: pngBuffer,
          mimetype: 'image/png',
          name: imgSpec.filename,
          size: pngBuffer.length,
        },
        overrideAccess: true,
      })
      mediaIds.push(createdMedia.id)
    }
  }

  return {
    pageId,
    pageTitle: EB11_SAMPLE_PAGE_TITLE,
    mediaIds,
    backupPath,
    startedAt,
    alreadySeeded,
  }
}

export interface CleanEb11SessionResult {
  deletedPages: { id: string | number; title: string }[]
  deletedTemplates: { id: string | number; name: string }[]
  deletedMedia: { id: string | number; alt: string }[]
  restoredBackup: string | null
}

/**
 * Dọn sạch dữ liệu [MẪU] do buổi thử tạo ra và hoàn trả designSystem:
 * 1. Lấy mốc thời gian bắt đầu từ session meta.
 * 2. Xóa các pages, blockTemplates, media có tên bắt đầu [MẪU] tạo sau mốc này.
 * 3. Hoàn trả designSystem từ file backup mới nhất.
 */
export async function cleanEb11Session(payload: Payload): Promise<CleanEb11SessionResult> {
  const envGuard = checkDemoSeedEnv(process.env)
  if (!envGuard.ok) {
    throw new Error(envGuard.reason)
  }

  const facts = await collectDemoSeedFacts(payload)
  const guard = checkDemoSeedAllowed(process.env, facts)
  if (!guard.ok) {
    throw new Error(guard.reason)
  }

  const meta = readSessionMeta()
  const startedAt = meta?.startedAt

  // 1. Quét và lọc pages
  const allPages = await payload.find({
    collection: 'pages',
    where: { title: { like: `${EB11_SAMPLE_PREFIX}%` } },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })
  const pagesToDelete = filterRecordsToDelete(allPages.docs, startedAt)
  const deletedPages: { id: string | number; title: string }[] = []
  for (const page of pagesToDelete) {
    await payload.delete({
      collection: 'pages',
      id: page.id,
      overrideAccess: true,
    })
    deletedPages.push({ id: page.id, title: page.title || '' })
  }

  // 2. Quét và lọc blockTemplates
  const allTemplates = await payload.find({
    collection: 'blockTemplates',
    where: { name: { like: `${EB11_SAMPLE_PREFIX}%` } },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })
  const templatesToDelete = filterRecordsToDelete(allTemplates.docs, startedAt)
  const deletedTemplates: { id: string | number; name: string }[] = []
  for (const tpl of templatesToDelete) {
    await payload.delete({
      collection: 'blockTemplates',
      id: tpl.id,
      overrideAccess: true,
    })
    deletedTemplates.push({ id: tpl.id, name: tpl.name || '' })
  }

  // 3. Quét và lọc media
  const allMedia = await payload.find({
    collection: 'media',
    where: { alt: { like: `${EB11_SAMPLE_PREFIX}%` } },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })
  const mediaToDelete = filterRecordsToDelete(allMedia.docs, startedAt)
  const deletedMedia: { id: string | number; alt: string }[] = []
  for (const m of mediaToDelete) {
    await payload.delete({
      collection: 'media',
      id: m.id,
      overrideAccess: true,
    })
    deletedMedia.push({ id: m.id, alt: m.alt || '' })
  }

  // 4. Khôi phục designSystem từ file backup mới nhất
  const latestBackup = getLatestDesignSystemBackup()
  let restoredBackup: string | null = null
  if (latestBackup && fs.existsSync(latestBackup)) {
    try {
      const raw = fs.readFileSync(latestBackup, 'utf-8')
      const backupData = JSON.parse(raw)
      const { id: _id, createdAt: _c, updatedAt: _u, globalType: _g, ...cleanData } = backupData
      await payload.updateGlobal({
        slug: 'designSystem',
        data: cleanData,
        overrideAccess: true,
      })
      restoredBackup = latestBackup
    } catch (err) {
      console.warn('Không thể khôi phục designSystem từ file backup:', err)
    }
  }

  // Dọn file session meta
  removeSessionMeta()

  return {
    deletedPages,
    deletedTemplates,
    deletedMedia,
    restoredBackup,
  }
}

