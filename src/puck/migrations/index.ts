import type { Data } from '@puckeditor/core'

export type PuckMigration = (data: Data) => Data

/**
 * Danh sách migration cho Puck data của Trạm Dừng Cảm Xúc.
 *
 * --- HƯỚNG DẪN THÊM MIGRATION KHI ĐỔI PROPS CỦA KHỐI (AGENTS.md §5B) ---
 *
 * 1. Khi bạn sửa, đổi tên, hoặc tái cấu trúc props của một khối (ví dụ: đổi `buttonLink` -> `targetUrl`):
 *    - Tăng `version` trong `defaultProps` của khối đó lên (ví dụ: version: 2).
 *    - Viết một hàm migration nhận vào `Data` và trả về `Data` mới đã được chuyển đổi props cũ sang mới.
 *    - Thêm migration function vào mảng `puckMigrations` dưới đây theo thứ tự phiên bản tăng dần.
 *
 * 2. Cấu trúc một hàm migration mẫu:
 *    ```ts
 *    export const migrationV2: PuckMigration = (data) => {
 *      return {
 *        ...data,
 *        content: (data.content || []).map((item) => {
 *          if (item.type === 'HeroTwoEntries' && (!item.props.version || item.props.version < 2)) {
 *            return {
 *              ...item,
 *              props: {
 *                ...item.props,
 *                version: 2,
 *                // Chuyển đổi dữ liệu cũ sang mới, ví dụ:
 *                // targetUrl: item.props.buttonLink,
 *              },
 *            }
 *          }
 *          return item
 *        }),
 *      }
 *    }
 *    ```
 *
 * 3. Đăng ký vào mảng bên dưới:
 *    `export const puckMigrations: PuckMigration[] = [migrationV2]`
 *
 * 4. Luôn viết unit test xác nhận dữ liệu cũ của khách/Hana sau khi qua `applyPuckMigrations()`
 *    sẽ tương thích hoàn hảo với schema mới mà không làm mất bất kỳ nội dung nào.
 */
import { migrateCTAButtonV1ToV2 } from './v2-cta-button'
import { migratePackageComparisonV1ToV2 } from './v2-package-comparison'
import { migrateQuoteBlockV1ToV2 } from './v2-quote-block'
import { migrateStatsBarV1ToV2 } from './v2-stats-bar'
import { migrateHeroTwoEntriesV1ToV2 } from './v2-hero-two-entries'
import { migrateHeroImageV1ToV2 } from './v2-hero-image'
import { migratePackageComparisonV2ToV3 } from './v3-package-comparison'
import { migrateTestimonialGridV1ToV2 } from './v2-testimonial-grid'
import { migrateFAQV1ToV2 } from './v2-faq'
import { migrateJourneyStepsV1ToV2 } from './v2-journey-steps'
import { migrateHanaStoryV1ToV2 } from './v2-hana-story'
import { migrateImageTextV1ToV2 } from './v2-image-text'
import { migrateLogoStripV1ToV2 } from './v2-logo-strip'
import { migrateHanaStoryV2ToV3 } from './v3-hana-story'
import { migrateFAQV2ToV3 } from './v3-faq'
import { migrateSectionHeaderV1ToV2 } from './v2-section-header'
import { migrateIconCardGridV1ToV2 } from './v2-icon-card-grid'
import { migrateStatsBarV2ToV3 } from './v3-stats-bar'
import { migrateJourneyStepsV2ToV3 } from './v3-journey-steps'
import { migrateServiceCardsV1ToV2 } from './v2-service-cards'
import { migratePackageCardsV1ToV2 } from './v2-package-cards'

export {
  migrateJourneyStepsV1ToV2,
  migrateHanaStoryV1ToV2,
  migrateHanaStoryV2ToV3,
  migrateImageTextV1ToV2,
  migrateLogoStripV1ToV2,
  migrateFAQV2ToV3,
  migrateSectionHeaderV1ToV2,
  migrateIconCardGridV1ToV2,
  migrateStatsBarV2ToV3,
  migrateJourneyStepsV2ToV3,
  migrateServiceCardsV1ToV2,
  migratePackageCardsV1ToV2,
}

export const puckMigrations: PuckMigration[] = [
  migrateCTAButtonV1ToV2,
  migratePackageComparisonV1ToV2,
  migrateQuoteBlockV1ToV2,
  migrateStatsBarV1ToV2,
  migrateHeroTwoEntriesV1ToV2,
  migrateHeroImageV1ToV2,
  migratePackageComparisonV2ToV3,
  migrateTestimonialGridV1ToV2,
  migrateFAQV1ToV2,
  migrateJourneyStepsV1ToV2,
  migrateHanaStoryV1ToV2,
  migrateHanaStoryV2ToV3,
  migrateImageTextV1ToV2,
  migrateLogoStripV1ToV2,
  migrateFAQV2ToV3,
  migrateSectionHeaderV1ToV2,
  migrateIconCardGridV1ToV2,
  migrateStatsBarV2ToV3,
  migrateJourneyStepsV2ToV3,
  migrateServiceCardsV1ToV2,
  migratePackageCardsV1ToV2,
]

/**
 * Thực thi lần lượt tất cả migrations trên dữ liệu trang Puck.
 */
export function applyPuckMigrations(data: Data): Data {
  return puckMigrations.reduce((acc, migration) => migration(acc), data)
}

/**
 * Chuẩn hóa và chạy toàn bộ chuỗi migrations trên dữ liệu Puck thô (object hoặc JSON string).
 * Dùng khi đọc dữ liệu từ DB (on read) cũng như khi lưu (on save).
 */
export function normalizePuckData(raw: unknown): Data {
  if (!raw) {
    return { content: [], root: { props: { title: '' } }, zones: {} }
  }

  let data: unknown = raw
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw)
    } catch {
      return { content: [], root: { props: { title: '' } }, zones: {} }
    }
  }

  if (typeof data !== 'object' || data === null) {
    return { content: [], root: { props: { title: '' } }, zones: {} }
  }

  const obj = data as Partial<Data>
  const structured: Data = {
    content: Array.isArray(obj.content) ? obj.content : [],
    root: obj.root && typeof obj.root === 'object' ? obj.root : { props: { title: '' } },
    zones: obj.zones && typeof obj.zones === 'object' ? obj.zones : {},
  }

  return applyPuckMigrations(structured)
}
