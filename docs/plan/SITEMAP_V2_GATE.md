# Biên bản nghiệm thu Cổng Sitemap v2 (Sitemap v2 Gate Verification)

> **Mục đích**: Bảng đối chiếu tiêu chí nghiệm thu Cổng Sitemap v2 (theo `docs/plan/SITEMAP_V2.md` mục 9 và `docs/tasks/prompts/SM-08.md`).
> **Nguyên tắc AGENTS.md**: AI kỹ thuật chỉ ghi nhận kết quả kiểm thử tự động (đường dẫn, a11y, Lighthouse); **cột "Hana xác nhận" để trống** để Hana tự tay trải nghiệm và đánh giá thực tế. AI tuyệt đối không tự đánh "Đạt" thay cho người chủ dự án.

---

## 1. Tiêu chí nghiệm thu cốt lõi (Sitemap v2 §9)

|  STT   | Tiêu chí nghiệm thu                                                                                                                          | Kết quả Kỹ thuật tự động (E2E / Script)                                          | Hana xác nhận (☐ Chưa / ☑ Đạt) | Ghi chú từ Hana |
| :----: | :------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------- | :----------------------------: | :-------------- |
| **01** | **Điều hướng di động (375px)**: Mở menu mobile -> mở accordion "Sản phẩm" -> thấy rõ 2 nhóm: _Dành cho Cá nhân_ & _Dành cho Doanh nghiệp_.   | Đã kiểm qua test `tests/e2e/sitemap-v2-gate.test.ts` (Pass)                      |               ☐                |                 |
| **02** | **Điều hướng máy tính (1440px)**: Mở menu con "Sản phẩm" bằng chuột và bàn phím (Enter mở, Escape đóng, Tab chuyển mục).                     | Đã kiểm qua test `tests/e2e/sitemap-v2-gate.test.ts` (Pass)                      |               ☐                |                 |
| **03** | **Cây danh mục 1.1**: Truy cập đầy đủ các trang trong cấu trúc 1.1 trả về mã 200, không vỡ layout, không tràn ngang ở 375px và 1440px.       | Đã kiểm 12 trang cây 1.1 qua `sitemap-v2-gate.test.ts` (Pass)                    |               ☐                |                 |
| **04** | **Trợ năng (Accessibility)**: Không có lỗi serious / critical theo tiêu chuẩn WCAG 2.0 / 2.1 A & AA (Axe Core).                              | Đã kiểm qua `expectNoSeriousA11y` trên 12 trang cây 1.1 (0 vi phạm)              |               ☐                |                 |
| **05** | **Hiệu năng trang chủ (Lighthouse Mobile)**: Điểm Performance trang chủ trên thiết bị di động (mục tiêu ≥ 90).                               | Chạy đo thực tế trên bản `pnpm build && pnpm start` (Xem mục 2 bên dưới)         |               ☐                |                 |
| **06** | **Chuyển hướng thông minh (308 Redirects)**: Các đường dẫn cũ (`/ve-hana`, `/thu-vien`, `/coaching/growth-mirror`) tự chuyển đúng trang mới. | Đã kiểm qua test `LEGACY_REDIRECTS` (Pass 3/3 link)                              |               ☐                |                 |
| **07** | **Không có link chết (No Dead Links)**: Tất cả link nội bộ trong Menu chính, Menu con và Chân trang đều trả về 200.                          | Đã kiểm qua API `navigation?depth=1` trong test E2E (Pass)                       |               ☐                |                 |
| **08** | **Tự sửa Menu con trong CMS**: Hana tự sửa 1 mục trong menu con và thấy website tự cập nhật.                                                 | Đã bàn giao cơ chế lưu `navigation` trong CMS; hướng dẫn tại mục 7.3d            |               ☐                |                 |
| **09** | **Tự sửa Câu hỏi thường gặp (FAQ)**: Hana tự sửa 1 câu hỏi/trả lời và thấy khối FAQ cập nhật.                                                | Đã bàn giao collection `faqs` & nguồn `group` trong Puck; hướng dẫn tại mục 5.12 |               ☐                |                 |
| **10** | **Tự đổi Tagline gói trong Sản phẩm**: Hana tự sửa tagline/tên gói trong `products`, không sửa trong Puck.                                   | Đã cấu hình resolver tự động cho các khối gói; hướng dẫn tại mục 3.1c            |               ☐                |                 |
| **11** | **Tự sửa Số điện thoại Hotline**: Hana tự sửa số hotline tại Cài đặt chung và thấy trang Liên hệ cập nhật.                                   | Đã cấu hình khối `ContactInfo` đọc từ `siteSettings`; hướng dẫn tại mục 7.3b     |               ☐                |                 |

---

## 2. Kết quả kiểm thử tự động chi tiết (Kỹ sư ghi nhận)

### 2.1. Kiểm thử đường dẫn và Cây danh mục 1.1 (`tests/e2e/sitemap-v2-gate.test.ts`)

- **Môi trường chạy**: `localhost:3000` (Node.js production build `pnpm build && pnpm start`), cơ sở dữ liệu mẫu đã seed (`E2E_SEEDED=1`).
- **Danh sách các trang đã quét**:
  1. `/` (Trang chủ v2): HTTP 200, Không tràn ngang (375 & 1440), 0 lỗi a11y serious/critical.
  2. `/lo-trinh-chuyen-minh` (Lộ trình chuyển mình): HTTP 200, Không tràn ngang, 0 lỗi a11y.
  3. `/eq-buddy` (EQ Buddy số & giới thiệu): HTTP 200, Không tràn ngang, 0 lỗi a11y.
  4. `/habit/1-percent-better` (Habit Hack 21 ngày): HTTP 200, Không tràn ngang, 0 lỗi a11y.
  5. `/coaching` (Coach 1:1 chuyên sâu): HTTP 200, Không tràn ngang, 0 lỗi a11y.
  6. `/doanh-nghiep/eq-development-for-clarity` (Chương trình DN 1): HTTP 200, Không tràn ngang, 0 lỗi a11y.
  7. `/doanh-nghiep/habit-formation-for-resilience` (Chương trình DN 2): HTTP 200, Không tràn ngang, 0 lỗi a11y.
  8. `/ve-tram` (Về Trạm & Triết lý): HTTP 200, Không tràn ngang, 0 lỗi a11y.
  9. `/tai-nguyen` (Tài nguyên & Blog): HTTP 200, Không tràn ngang, 0 lỗi a11y.
  10. `/cong-dong` (Cộng đồng của Trạm): HTTP 200, Không tràn ngang, 0 lỗi a11y.
  11. `/lien-he` (Liên hệ & Biểu mẫu B2C/B2B): HTTP 200, Không tràn ngang, 0 lỗi a11y.
  12. `/cau-hoi-thuong-gap` (Ngân hàng FAQ): HTTP 200, Không tràn ngang, 0 lỗi a11y.
- **Kiểm tra chuyển hướng link cũ (308)**:
  - `/ve-hana` ➔ `/ve-tram`: 308 Permanent Redirect.
  - `/thu-vien` ➔ `/tai-nguyen`: 308 Permanent Redirect.
  - `/coaching/growth-mirror` ➔ `/lo-trinh-chuyen-minh`: 308 Permanent Redirect.

### 2.2. Điểm Lighthouse Mobile Trang chủ (`http://localhost:3000/`)

- **Lệnh chạy**: `pnpm dlx lighthouse@12 http://localhost:3000/ --form-factor=mobile --only-categories=performance --only-categories=accessibility --output=json --output-path=docs/screenshots/sm08/lighthouse-home.json --chrome-flags="--headless"`
- **Kết quả đo lường thực tế**:
  - **Accessibility (Trợ năng)**: **100 / 100** (Tuyệt đối, 0 vi phạm)
  - **Performance (Hiệu năng)**: **85 / 100 – CHƯA ĐẠT mục tiêu ≥ 90.** Đo trên máy local (throttling giả lập của Lighthouse), cần đo lại trên server thật trước khi kết luận.
  - Nguyên nhân lớn nhất trong báo cáo: LCP 4,1 s (điểm 0,48); JavaScript không dùng (~0,45 s); audit "redirects" báo ~0,6 s dù `GET /` trả 200 trực tiếp – cần kiểm lại. Đã ghi `docs/BACKLOG.md`.
  - **Tệp báo cáo JSON**: `docs/screenshots/sm08/lighthouse-home.json`.
  - **Ảnh chụp màn hình bàn giao**:
    - Trang Cộng đồng: `docs/screenshots/sm08/community-1440.png` & `docs/screenshots/sm08/community-375.png`.
    - Trang Doanh nghiệp: `docs/screenshots/sm08/business-1440.png` & `docs/screenshots/sm08/business-375.png`.

---

## 3. Danh sách hạng mục còn chờ Hana cung cấp (Nội dung thật)

Theo phân tích mâu thuẫn chính sách (M1–M13) và các câu hỏi mở (Q6–Q8) trong `SITEMAP_V2.md`:

|   Mã    | Hạng mục cần Hana cung cấp / chốt                                        | Hiện trạng kỹ thuật trong code                                                    | Hành động tiếp theo của Hana                                   |
| :-----: | :----------------------------------------------------------------------- | :-------------------------------------------------------------------------------- | :------------------------------------------------------------- |
| **M1**  | Câu hỏi thường gặp về thanh toán (mockup ghi hoàn tiền 7 ngày, thẻ Visa) | Không đưa nội dung hoàn tiền / Visa lên web; FAQ mẫu chỉ có `[MẪU]` chờ Hana viết | Viết câu trả lời FAQ thật: chỉ VietQR, không hoàn tiền         |
| **M2**  | Quyết định nút trên 3 gói giải pháp                                      | Đang trỏ về phiên trải nghiệm 149.000đ (ghi nhận gói quan tâm)                    | Hana giữ nguyên hoặc quyết định mở bán trực tiếp ở Giai đoạn 4 |
| **M3**  | Lời chia sẻ khách hàng thật (Testimonials)                               | Đang dùng dữ liệu mẫu có gắn tiền tố `[MẪU]`, có lọc `consent = true`             | Nhập các testimonial thực tế đã được khách hàng cho phép       |
| **M4**  | Số liệu chứng minh (Số năm kinh nghiệm, số giờ khai vấn, học viên...)    | Đã gỡ toàn bộ số liệu chưa xác nhận; dùng nhãn định tính an toàn                  | Hana gửi số liệu thực tế đã kiểm chứng để đưa vào `StatsBar`   |
| **M5**  | Danh sách Logo đối tác / Doanh nghiệp đã đồng hành                       | Đang dùng biểu tượng mẫu `[MẪU] Tổ chức Test`                                     | Gửi file logo PNG nền trong của các tổ chức được phép sử dụng  |
| **M6**  | Thông tin Đội ngũ chuyên gia (nếu có cộng sự)                            | Đang hiển thị chuyên gia mẫu; ẩn trên trang công khai nếu chưa có dữ liệu thật    | Gửi ảnh, tên, chức danh và sự đồng ý của chuyên gia đồng hành  |
| **M7**  | Tên gọi chuẩn của phiên tư vấn ban đầu                                   | Dùng thống nhất: "Phiên trải nghiệm Growth Mirror 149.000đ"                       | Hana xác nhận nếu muốn đổi tên thành "Phiên Khám phá"          |
| **M8**  | Vị trí Quiz chẩn đoán trên Menu                                          | Đã đặt ở đầu menu con "Tài nguyên miễn phí" và có nút trên trang chủ              | Hana duyệt vị trí điều hướng này                               |
| **M9**  | Email liên hệ, Hotline và Địa chỉ văn phòng chính thức                   | Đã có sẵn các ô nhập tại Cài đặt chung (`siteSettings`)                           | Nhập số hotline và địa chỉ văn phòng thật                      |
| **M10** | Tệp ảnh chữ ký người sáng lập Hana Lương                                 | Đã hỗ trợ cả chữ ký dạng văn bản Playfair và ảnh chữ ký PNG                       | Tải ảnh chữ ký nền trong lên mục Thư viện ảnh                  |
| **M11** | Bộ biểu tượng minh họa (Icons)                                           | Đã chuẩn hóa icon SVG nét mảnh theo bảng màu Brand Book 2026                      | Duyệt bộ icon SVG hiện tại                                     |
| **M12** | Bảng màu nền và độ tương phản                                            | Tuân thủ 100% 8 màu Brand Book 2026, đạt chuẩn tương phản WCAG AA                 | Duyệt diện mạo màu sắc trên thiết bị thực tế                   |
| **M13** | Nội dung và tần suất gửi Bản tin (Newsletter)                            | Biểu mẫu chỉ cam kết chia sẻ góc nhìn và bài tập thực hành                        | Hana soạn kế hoạch gửi email định kỳ khi sẵn sàng              |
| **Q6**  | Chốt tên thương mại: "Habit Hack" hay "Habit Formation"                  | Đang cấu hình trong CMS tại mục Sản phẩm                                          | Hana tự sửa tên trong mục Sản phẩm bất kỳ lúc nào              |
| **Q7**  | Chốt tên 2 chương trình Doanh nghiệp                                     | Đã seed 2 chương trình mẫu trong `programs`                                       | Soạn nội dung chi tiết cho 2 chương trình đào tạo doanh nghiệp |
| **Q8**  | Đội ngũ chuyên gia: Có đưa lên website ở giai đoạn này không?            | Nếu chưa có, khối `TeamGrid` sẽ tự động ẩn an toàn ngoài web                      | Hana phản hồi có sử dụng khối này hay không                    |
