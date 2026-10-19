import type { Data } from '@puckeditor/core'

export type PuckMigration = (data: Data) => Data

/**
 * Danh sách migration cho Puck data của Trạm Dừng Cảm Xúc.
 * Hiện tại là mảng rỗng (tất cả 5 khối đang ở phiên bản ban đầu: version 1).
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
]

/**
 * Thực thi lần lượt tất cả migrations trên dữ liệu trang Puck.
 */
export function applyPuckMigrations(data: Data): Data {
  return puckMigrations.reduce((acc, migration) => migration(acc), data)
}
