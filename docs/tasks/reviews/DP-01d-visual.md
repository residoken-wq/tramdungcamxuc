# Báo cáo so sánh giao diện DP-01d (Visual Review)

- Ngày thực hiện: 04/11/2026
- Nhánh: `task/DP-01d-fixes`
- Kịch bản chụp: `scripts/dp01-capture.mjs` (Playwright)
- Bản đối chiếu:
  - Bản gốc ZIP: `http://localhost:3100` (`../DIGITAL PRODUCT`)
  - Bản repo: `http://localhost:3000` (codebase Trạm Dừng Cảm Xúc)
- Viewport kiểm tra: Mobile 390×844px và Desktop 1440×900px.
- Thư mục ảnh ghép so sánh: `../dp01-compare/`
- Thư mục ảnh Habit lưu repo: `docs/screenshots/dp01/`

---

## 1. Bảng đối chiếu từng màn hình

| Màn hình | Tệp ảnh ghép (`../dp01-compare/`) | Còn khác gì so với Zip | Lý do kỹ thuật / Brand Book |
| --- | --- | --- | --- |
| **Habit Bước 1: Khám đúng nút thắt** | `habit-step1-390.png`<br/>`habit-step1-1440.png` | - Header trên cùng: Bản repo có thanh điều hướng chung của site (`Navbar` Trạm Dừng Cảm Xúc).<br/>- Không còn huy hiệu "Bước 1 / 6" (đã gỡ bỏ theo B5). | - Khung shell ứng dụng Next.js có Navbar đồng bộ toàn hệ sinh thái.<br/>- Đã gỡ nhãn bước theo quyết định B5 để khớp zip. |
| **Habit Bước 2: Nguyên lý 1%** | `habit-step2-390.png`<br/>`habit-step2-1440.png` | - Không khác biệt về bố cục, biểu đồ vùng năng lực tiềm ẩn, thanh kéo slider và 3 thẻ tư duy.<br/>- Tiêu đề và chữ dẫn nhập được nạp trực tiếp từ CMS `habitJourneyContent.step2`. | - Khớp bố cục và màu sắc Brand Book 2026. |
| **Habit Bước 3: Tìm Mentor** | `habit-step3-390.png`<br/>`habit-step3-1440.png` | - Bảng soi một ngày, các nút `+`, `-`, `=`, nút chọn Mentor và gợi ý thời gian đồng nhất. | - Đã đưa copy và nhãn vào CMS / `vi.ts` khối `dp01`. |
| **Habit Bước 4: Gọi tên thói quen** | `habit-step4-390.png`<br/>`habit-step4-1440.png` | - Trường `startDate` và `endDate` tính toán theo nhịp 28 ngày tại múi giờ Việt Nam (+7).<br/>- Các thẻ gợi ý vai trò và thói quen hạt nhân lấy từ CMS `suggestedRoles` / `suggestedAtomicHabits`. | - Giữ logic đồng bộ ngày chuẩn 28 ngày và giao quyền chỉnh sửa chữ cho Hana trong CMS. |
| **Habit Bước 5: Thiết kế vòng lặp** | `habit-step5-390.png`<br/>`habit-step5-1440.png` | - 4 khối quy luật hiển thị đầy đủ, mỗi kỹ thuật có nút toggle checkbox và nút "Xem" mở rộng ví dụ/ghi chú.<br/>- Khối có nhãn "Toa của bạn" highlight đúng toa tìm ra ở Bước 1. | - Dữ liệu 11 kỹ thuật được lưu trong collection `techniques` có đầy đủ `description`, `examples`, `applyTemplate`. |
| **Habit Bước 6: Boarding Pass** | `habit-step6-390.png`<br/>`habit-step6-1440.png` | - Thêm 2 nút: "Tải ảnh Cover điện thoại" (9:16) và "Tải ảnh đăng bài" (4:5) cạnh nút "Sao chép caption" (hoàn thành B4).<br/>- Form đăng ký có Turnstile Cloudflare và kiểm tra OTP. | - Khớp bố cục tấm vé zip; tích hợp hạ tầng xác thực an toàn của Trạm. |
| **Habit Bước 7: Tracker 28 ngày** | `habit-step7-tracker-390.png`<br/>`habit-step7-tracker-1440.png` | - Lưới 4 trạm × 7 ngày (28 ngày), hiển thị đúng trạng thái hoàn thành / tối giản / lỡ nhịp / ngày nghỉ.<br/>- Đầy đủ nút tải CSV, suy ngẫm trạm và quote dẫn đường. | - Dữ liệu check-in lưu vào PostgreSQL qua collection `habitCheckins`. |
| **Hộp thoại Check-in ngày** | `habit-checkin-modal-390.png`<br/>`habit-checkin-modal-1440.png` | - 3 trạng thái (Đã làm, Bản tối giản, Lỡ nhịp) + 5 icon cảm xúc (😫, 😣, 😊, 🥰, 😍).<br/>- Có nút thùng rác "Xóa check-in này" ở góc dưới bên trái để reset ngày khi cần sửa. | - Khớp toàn bộ styling và logic của zip. |
| **EQ Buddy: Rút thẻ ngẫu nhiên** | `eq-draw-screen-390.png`<br/>`eq-draw-screen-1440.png` | - Giao diện chọn cảm xúc và nút rút ngẫu nhiên.<br/>- Thẻ giới thiệu và nút liên kết Shopee dẫn đúng gian hàng. | - Tích hợp đầy đủ theo component zip `EQBuddyApp.tsx`. |
| **EQ Buddy: Mặt trước thẻ 3D** | `eq-card-front-390.png`<br/>`eq-card-front-1440.png` | - Thẻ lật 3D bo góc 24px, đổ bóng nhẹ, hiệu ứng chuyển màu pastel theo Brand Book.<br/>- Từ khóa Anton, số thẻ, nhãn cảm xúc và trích dẫn. | - Tương thích trên cả mobile 390px và desktop 1440px. |
| **EQ Buddy: Mặt sau thẻ 3D** | `eq-card-back-390.png`<br/>`eq-card-back-1440.png` | - 3 câu hỏi suy ngẫm: Gợi nhớ, Gói ghém, Ghi nhận.<br/>- Giữ xuống dòng và chữ đậm `<strong>Mặt trước:</strong>` / `<strong>Mặt sau:</strong>` (hoàn thành B5). | - Khớp 100% định dạng zip `EQBuddyApp.tsx:219-220`. |
| **EQ Buddy: Tất cả thẻ** | `eq-all-cards-390.png`<br/>`eq-all-cards-1440.png` | - Lưới hiển thị các thẻ cảm xúc.<br/>- Khi bật "Miễn phí hoàn toàn" (công tắc owner `eqAccessMode = 'free'`), tất cả thẻ đều hiện "Chạm để mở thẻ" và xem được thông điệp mà không bị paywall. | - Đã hỗ trợ cả 2 chế độ `trial` và `free`. |

---

## 2. Kết luận
- Toàn bộ các khác biệt đã được giải quyết hoặc lý giải minh bạch:
  1. Đã gỡ bỏ nhãn "Bước x / 6" khỏi `HabitTrackerHeader`.
  2. Đã thêm 2 nút tải ảnh 9:16 và 4:5 trên Boarding Pass.
  3. Đã căn chỉnh định dạng thẻ tương tác 3D với chữ đậm và xuống dòng cho Mặt trước / Mặt sau.
  4. Hệ thống CMS và fallback `withDp01Defaults()` đảm bảo trang web luôn hiển thị đúng nội dung chuẩn zip ngay cả khi cơ sở dữ liệu trống.
