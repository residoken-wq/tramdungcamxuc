'use client'

import React from 'react'
import { ContactInfo } from '@/components/site/ContactInfo'
import { ContactForms } from '@/components/site/ContactForms'
import { FAQ } from '@/components/site/FAQ'

export function Sm06BlocksDemo() {
  return (
    <div className="space-y-16">
      {/* 1. ContactInfo - Đủ thông tin */}
      <div className="space-y-6">
        <div className="border-b border-deep-navy/10 pb-2">
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-bright-magenta">
            1. Khối ContactInfo – Đủ tất cả các mục (Email, Hotline, Địa chỉ, Mạng xã hội)
          </h3>
          <p className="mt-1 font-ui text-xs text-deep-navy/70">
            Dữ liệu đọc tự động từ Cài đặt chung (siteSettings). Hiển thị đầy đủ các kênh liên hệ
            với nút gọi, email, địa chỉ và icon mạng xã hội.
          </p>
        </div>
        <div className="rounded-2xl border border-deep-navy/10 overflow-hidden bg-white">
          <ContactInfo
            seriesLabel="[MẪU SM-06] THÔNG TIN LIÊN HỆ"
            titleLine1="[MẪU SM-06] KẾT NỐI VỚI TRẠM"
            titleLine2="[MẪU SM-06] ĐỦ TẤT CẢ CÁC MỤC"
            emotionLine="[MẪU SM-06] Mọi chia sẻ của bạn đều được đón nhận bằng sự thấu cảm, tôn trọng và trọn vẹn yêu thương."
            showEmail={true}
            showHotline={true}
            showOfficeAddress={true}
            showSocial={true}
            bgColor="warm-ivory"
            padding="sm"
            _resolved={{
              contact: {
                email: 'contact@example.com',
                hotline: '0900 123 456',
                officeAddress: 'Quận 1, TP. Hồ Chí Minh',
                linkedInUrl: 'https://linkedin.com/company/example',
                facebookUrl: 'https://facebook.com/example',
                youtubeUrl: 'https://youtube.com/@example',
                zaloChatUrl: 'https://zalo.me/example',
              },
            }}
          />
        </div>
      </div>

      {/* 2. ContactInfo - Thiếu một số mục (Ẩn địa chỉ & mạng xã hội) */}
      <div className="space-y-6">
        <div className="border-b border-deep-navy/10 pb-2">
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-bright-magenta">
            2. Khối ContactInfo – Thiếu mục (Chỉ hiện Email và Hotline)
          </h3>
          <p className="mt-1 font-ui text-xs text-deep-navy/70">
            Khi các trường địa chỉ hoặc mạng xã hội để trống trong Cài đặt chung, khối sẽ tự động ẩn
            các ô tương ứng một cách mượt mà.
          </p>
        </div>
        <div className="rounded-2xl border border-deep-navy/10 overflow-hidden bg-white">
          <ContactInfo
            seriesLabel="[MẪU SM-06] LIÊN HỆ NHANH"
            titleLine1="[MẪU SM-06] GỌI HOẶC EMAIL"
            titleLine2="[MẪU SM-06] CHO ĐỘI NGŨ TRẠM"
            showEmail={true}
            showHotline={true}
            showOfficeAddress={false}
            showSocial={false}
            bgColor="soft-pink"
            padding="sm"
            _resolved={{
              contact: {
                email: 'support@example.com',
                hotline: '0900 987 654',
                officeAddress: null,
                linkedInUrl: null,
                facebookUrl: null,
                youtubeUrl: null,
                zaloChatUrl: null,
              },
            }}
          />
        </div>
      </div>

      {/* 3. ContactForms - Layout 2 Cột (Columns) */}
      <div className="space-y-6">
        <div className="border-b border-deep-navy/10 pb-2">
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-bright-magenta">
            3. Khối ContactForms – Bố cục 2 Cột (Columns layout – dùng trên trang /lien-he)
          </h3>
          <p className="mt-1 font-ui text-xs text-deep-navy/70">
            Hiển thị song song hai form: Khách hàng cá nhân (B2C) và Đối tác doanh nghiệp (B2B).
            Trên mobile tự động xếp dọc.
          </p>
        </div>
        <div className="rounded-2xl border border-deep-navy/10 overflow-hidden bg-white">
          <ContactForms
            layout="columns"
            titleB2C="[MẪU SM-06] Dành cho Cá nhân"
            descriptionB2C="[MẪU SM-06] Đăng ký tư vấn 1:1 hoặc gửi những trăn trở của bạn về hành trình cảm xúc và thói quen."
            titleB2B="[MẪU SM-06] Dành cho Doanh nghiệp"
            descriptionB2B="[MẪU SM-06] Cùng Trạm kiến tạo chương trình đào tạo và giải pháp chăm sóc sức khỏe tinh thần cho đội ngũ."
            submitLabelB2C="Gửi yêu cầu tư vấn"
            submitLabelB2B="Gửi đề xuất doanh nghiệp"
            bgColor="warm-ivory"
            padding="sm"
            isDemo={true}
            _resolved={{
              services: [
                { id: 1, name: '[MẪU SM-06] Khai vấn Chuyển mình' },
                { id: 2, name: '[MẪU SM-06] Khai vấn Thinking Mirror' },
              ],
              programs: [
                { id: 1, name: '[MẪU SM-06] EQ Development for Teams' },
                { id: 2, name: '[MẪU SM-06] Habit Formation Workshop' },
              ],
              leadStatusOptions: [
                { label: '[MẪU SM-06] Đang muốn chuyển việc' },
                { label: '[MẪU SM-06] Đang đối mặt với áp lực kiệt sức' },
              ],
            }}
          />
        </div>
      </div>

      {/* 4. ContactForms - Layout Tab (Tabs layout – dùng trên trang chủ SM-07) */}
      <div className="space-y-6">
        <div className="border-b border-deep-navy/10 pb-2">
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-bright-magenta">
            4. Khối ContactForms – Bố cục Tab chuyển đổi (Tabs layout – hỗ trợ phím mũi tên)
          </h3>
          <p className="mt-1 font-ui text-xs text-deep-navy/70">
            Chuyển đổi qua lại giữa tab Cá nhân và Doanh nghiệp với đầy đủ thuộc tính trợ năng và
            giữ trạng thái đã nhập.
          </p>
        </div>
        <div className="rounded-2xl border border-deep-navy/10 overflow-hidden bg-white">
          <ContactForms
            layout="tabs"
            titleB2C="[MẪU SM-06] Đăng ký tư vấn Cá nhân"
            descriptionB2C="[MẪU SM-06] Kết nối với người đồng hành để bắt đầu hành trình của bạn."
            titleB2B="[MẪU SM-06] Hợp tác Doanh nghiệp"
            descriptionB2B="[MẪU SM-06] Đề xuất chương trình đào tạo cho tổ chức của bạn."
            submitLabelB2C="Gửi yêu cầu tư vấn"
            submitLabelB2B="Gửi đề xuất doanh nghiệp"
            bgColor="lavender-mist"
            padding="sm"
            isDemo={true}
            _resolved={{
              services: [{ id: 1, name: '[MẪU SM-06] Khai vấn Chuyển mình' }],
              programs: [{ id: 1, name: '[MẪU SM-06] EQ Development for Teams' }],
              leadStatusOptions: [{ label: '[MẪU SM-06] Đang muốn thấu hiểu cảm xúc' }],
            }}
          />
        </div>
      </div>

      {/* 5. FAQ v3 - Nguồn lấy theo nhóm (source = 'group') */}
      <div className="space-y-6">
        <div className="border-b border-deep-navy/10 pb-2">
          <h3 className="font-ui text-sm font-bold uppercase tracking-wider text-bright-magenta">
            5. Khối FAQ v3 – Nguồn tự động theo nhóm (source = group, liên kết xem toàn bộ)
          </h3>
          <p className="mt-1 font-ui text-xs text-deep-navy/70">
            Chế độ tự động tra cứu câu hỏi theo nhóm từ CMS. Nút &ldquo;Xem toàn bộ&rdquo; tự động
            trỏ tới /cau-hoi-thuong-gap#&lt;nhóm&gt; khi để trống seeAllLink.
          </p>
        </div>
        <div className="rounded-2xl border border-deep-navy/10 overflow-hidden bg-white">
          <FAQ
            version={3}
            source="group"
            group="general"
            limit={5}
            seriesLabel="[MẪU SM-06] THẮC MẮC THƯỜNG GẶP"
            titleLine1="[MẪU SM-06] CÂU HỎI THEO NHÓM"
            titleLine2="[MẪU SM-06] NGUỒN TỰ ĐỘNG CMS"
            bgColor="warm-ivory"
            padding="sm"
            _resolved={{
              groupItems: [
                {
                  question: '[MẪU SM-06] Nguồn câu hỏi theo nhóm hoạt động như thế nào?',
                  answer:
                    'Khi Hana chọn source = group trong Puck editor, hệ thống sẽ tự động truy vấn danh sách câu hỏi theo nhóm từ CMS và hiển thị lên trang.',
                },
                {
                  question: '[MẪU SM-06] Nếu một nhóm chưa có câu hỏi nào thì sao?',
                  answer:
                    'Trên trang công khai, khối FAQ sẽ tự động ẩn đi để không tạo khoảng trắng vô nghĩa. Trong Puck editor, khối sẽ hiện khung hướng dẫn để Hana biết cần bổ sung câu hỏi.',
                },
              ],
            }}
          />
        </div>
      </div>
    </div>
  )
}
