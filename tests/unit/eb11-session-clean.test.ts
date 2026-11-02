// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  EB11_SAMPLE_PREFIX,
  filterRecordsToDelete,
  isSessionSampleRecord,
  type DeletableRecord,
} from '../../seed/eb11-session-lib'

describe('EB-11: Chọn bản ghi dọn dẹp buổi thử builder', () => {
  const sessionStart = '2026-11-03T10:00:00.000Z'
  const timeBefore = '2026-11-03T09:59:00.000Z'
  const timeAfter = '2026-11-03T10:05:00.000Z'

  describe('isSessionSampleRecord', () => {
    it('từ chối tất cả bản ghi không bắt đầu bằng [MẪU]', () => {
      const nonSampleRecords: DeletableRecord[] = [
        { id: 1, title: 'Trang chủ' },
        { id: 2, title: 'Về Hana' },
        { id: 3, name: 'Khung Hero thực tế' },
        { id: 4, alt: 'Ảnh chân dung Hana' },
        { id: 5, title: 'Trang thử nghiệm [MẪU] ở cuối' },
        { id: 6, name: 'Mẫu [MẪU] ở giữa' },
        { id: 7, title: '' },
        { id: 8, title: null },
        { id: 9, title: undefined },
        { id: 10, title: '  Trang không có tiền tố mẫu  ' },
        { id: 11, title: '[DEMO GĐ2] Workshop' },
      ]

      for (const record of nonSampleRecords) {
        expect(
          isSessionSampleRecord(record, sessionStart),
          `Bản ghi "${record.title ?? record.name ?? record.alt}" không được phép chọn xóa!`,
        ).toBe(false)
      }
    })

    it('từ chối bản ghi có [MẪU] nhưng tạo TRƯỚC mốc chạy buổi thử', () => {
      const oldSampleRecords: DeletableRecord[] = [
        { id: 1, title: '[MẪU] Trang tạo từ hôm qua', createdAt: timeBefore },
        { id: 2, name: '[MẪU] Mẫu khối cũ', createdAt: '2026-11-01T08:00:00.000Z' },
        { id: 3, alt: '[MẪU] Ảnh cũ', createdAt: timeBefore },
      ]

      for (const record of oldSampleRecords) {
        expect(
          isSessionSampleRecord(record, sessionStart),
          `Bản ghi cũ "${record.title ?? record.name ?? record.alt}" không được phép chọn xóa!`,
        ).toBe(false)
      }
    })

    it('chấp nhận bản ghi có tiền tố [MẪU] và tạo TỪ mốc chạy buổi thử trở đi', () => {
      const validSampleRecords: DeletableRecord[] = [
        { id: 101, title: '[MẪU] Trang thử builder', createdAt: timeAfter },
        { id: 102, title: '  [MẪU] Landing thử  ', createdAt: timeAfter },
        { id: 103, name: '[MẪU] Khung ảnh chữ', createdAt: timeAfter },
        { id: 104, alt: '[MẪU] Ảnh minh họa 1 - Cây mầm xanh', createdAt: timeAfter },
        { id: 105, alt: '[MẪU] Ảnh minh họa 2 - Bầu trời bình an', createdAt: timeAfter },
      ]

      for (const record of validSampleRecords) {
        expect(
          isSessionSampleRecord(record, sessionStart),
          `Bản ghi hợp lệ "${record.title ?? record.name ?? record.alt}" phải được chọn xóa!`,
        ).toBe(true)
      }
    })

    it('hoạt động chính xác khi không truyền sessionStartedAt (chỉ xét tiền tố [MẪU])', () => {
      expect(isSessionSampleRecord({ id: 1, title: 'Trang thật' })).toBe(false)
      expect(isSessionSampleRecord({ id: 2, title: '[MẪU] Trang bất kỳ' })).toBe(true)
      expect(isSessionSampleRecord({ id: 3, name: '[MẪU] Mẫu bất kỳ' })).toBe(true)
      expect(isSessionSampleRecord({ id: 4, alt: '[MẪU] Ảnh bất kỳ' })).toBe(true)
    })

    it('xử lý an toàn khi createdAt không hợp lệ hoặc thiếu', () => {
      expect(
        isSessionSampleRecord(
          { id: 1, title: '[MẪU] Trang không có ngày', createdAt: null },
          sessionStart,
        ),
      ).toBe(false)
      expect(
        isSessionSampleRecord(
          { id: 2, title: '[MẪU] Trang ngày lỗi', createdAt: 'ngày-lỗi' },
          sessionStart,
        ),
      ).toBe(false)
    })
  })

  describe('filterRecordsToDelete', () => {
    it('lọc danh sách hỗn hợp: không bao giờ chọn bản ghi thiếu [MẪU]', () => {
      const mixedList: DeletableRecord[] = [
        { id: 1, title: 'Trang chủ thật', createdAt: timeAfter },
        { id: 2, title: '[MẪU] Trang tạo trong buổi thử', createdAt: timeAfter },
        { id: 3, name: 'Block template hệ thống', createdAt: timeAfter },
        { id: 4, name: '[MẪU] Mẫu do Hana lưu', createdAt: timeAfter },
        { id: 5, alt: 'Logo thương hiệu thật', createdAt: timeAfter },
        { id: 6, alt: '[MẪU] Ảnh tải lên lúc thử', createdAt: timeAfter },
        { id: 7, title: '[MẪU] Trang có sẵn từ trước', createdAt: timeBefore },
        { id: 8, title: 'Trang bán hàng [MẪU]', createdAt: timeAfter },
      ]

      const toDelete = filterRecordsToDelete(mixedList, sessionStart)

      // Chỉ có các bản ghi 2, 4, 6 được chọn
      expect(toDelete.map((r) => r.id)).toEqual([2, 4, 6])

      // Kiểm tra tuyệt đối: mọi bản ghi trong danh sách xóa BẮT BUỘC có [MẪU]
      for (const item of toDelete) {
        const text = (item.title ?? item.name ?? item.alt ?? '').trim()
        expect(text.startsWith(EB11_SAMPLE_PREFIX)).toBe(true)
      }
    })

    it('trả về mảng rỗng khi danh sách không có bản ghi nào của buổi thử', () => {
      const realData: DeletableRecord[] = [
        { id: 1, title: 'Trang chủ', createdAt: timeAfter },
        { id: 2, title: 'Khóa học', createdAt: timeAfter },
      ]
      expect(filterRecordsToDelete(realData, sessionStart)).toEqual([])
      expect(filterRecordsToDelete([], sessionStart)).toEqual([])
    })
  })
})
