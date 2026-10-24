import type { Puck } from '@puckeditor/core'

type PuckProps = Parameters<typeof Puck>[0]
type DictionaryType = NonNullable<PuckProps['dictionary']>

export const puckVietnameseDictionary: DictionaryType = {
  'header-publish': 'Xuất bản',
  'header-undo': 'Hoàn tác',
  'header-redo': 'Làm lại',
  'header-toggle-leftsidebar': 'Bật/tắt thanh bên trái',
  'header-toggle-rightsidebar': 'Bật/tắt thanh bên phải',
  'header-toggle-menubar': 'Bật/tắt menu',
  'action-selectparent': 'Chọn khối cha',
  'action-duplicate': 'Nhân bản',
  'action-delete': 'Xóa',
  'label-page': 'Trang',
  'label-component': 'Khối',
  'outline-empty': 'Chưa có khối nào',
  'outline-item-collapse': 'Thu gọn',
  'outline-item-expand': 'Mở rộng',
  'outline-header-title': 'Cấu trúc trang',
  'outline-header-collapseall': 'Thu gọn tất cả',
  'outline-item-duplicate': 'Nhân bản',
  'outline-item-delete': 'Xóa',
  'drawer-category-other': 'Khác',
  'field-readonly': 'Chỉ xem',
  'field-arrayitem-duplicate': 'Nhân bản',
  'field-arrayitem-delete': 'Xóa',
  'field-external-selectdata': 'Chọn dữ liệu',
  'field-external-search': 'Tìm kiếm...',
  'plugin-blocks': 'Thư viện khối',
  'plugin-outline': 'Cấu trúc',
  'plugin-fields': 'Thuộc tính',
}
