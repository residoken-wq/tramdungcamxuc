export const vi = {
  common: {
    send: 'Gửi',
    login: 'Đăng nhập',
    logout: 'Đăng xuất',
    save: 'Lưu',
    cancel: 'Hủy',
    submit: 'Xác nhận',
    loading: 'Đang tải...',
    close: 'Đóng',
  },
  status: {
    coming_soon: 'Sắp ra mắt',
    on_sale: 'Đang mở bán',
    free: 'Miễn phí',
    consult: 'Tư vấn',
    hidden: 'Ẩn',
  },
  price: {
    originalLabel: 'Giá gốc',
    saleLabel: 'Giá ưu đãi',
  },
  toast: {
    close: 'Đóng thông báo',
  },
} as const

export type LocaleStrings = typeof vi
