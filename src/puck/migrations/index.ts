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

export const puckMigrations: PuckMigration[] = [migrateCTAButtonV1ToV2]

/**
 * Thực thi lần lượt tất cả migrations trên dữ liệu trang Puck.
 */
export function applyPuckMigrations(data: Data): Data {
  return puckMigrations.reduce((acc, migration) => migration(acc), data)
}
