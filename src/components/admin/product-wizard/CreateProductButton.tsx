import React from 'react'
import Link from 'next/link'

export function CreateProductButton() {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-bright-magenta/20 bg-gradient-to-r from-soft-pink/40 to-lavender-mist/30 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-bright-magenta text-white text-lg font-bold shadow-sm">
          ✨
        </span>
        <div>
          <h3 className="font-ui text-sm font-bold text-deep-navy">
            Tạo sản phẩm qua Trình hướng dẫn (Wizard 5 bước)
          </h3>
          <p className="text-xs text-deep-navy/70">
            Dành riêng cho Hana: thiết lập nhanh công cụ số, gói Growth Mirror, sách điện tử và xem trước giao diện.
          </p>
        </div>
      </div>

      <Link
        href="/admin/tao-san-pham"
        className="inline-flex items-center gap-2 rounded-xl bg-deep-navy px-4 py-2 font-ui text-xs font-bold text-white shadow-sm transition-all hover:bg-bright-magenta hover:shadow-md"
      >
        <span>+ Tạo sản phẩm bằng Wizard</span>
        <span>→</span>
      </Link>
    </div>
  )
}
