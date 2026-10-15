# Kế hoạch làm lại trải nghiệm CMS cho Hana (CM-01 → CM-07)

> Viết 15/10/2026. Chỉ là kế hoạch + prompt task; chưa có code. Mục tiêu AGENTS.md mục 1: **Hana tự sửa mọi nội dung thường xuyên mà không cần đụng code.**

## 1. Hiện trạng (main ngày 15/10)

| Vấn đề                                                           | Chi tiết                                                                                                                                                                                                                                                                                               | Hệ quả cho Hana                                                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Menu trái quá dài, lẫn việc kỹ thuật                             | ~30 mục hiện ra. Nhóm "Hệ thống", "Khóa học", "Bán hàng" trộn mục Hana dùng hằng ngày (Sản phẩm, Bài học) với nhật ký kỹ thuật (Sự kiện thanh toán, Nhắc dùng thử, Nhắc workshop, Tiến độ bài học, Kết quả quiz, Quyền truy cập). Một số collection không có nhóm (Bài học, Kỹ thuật, Thẻ EQ, Trang…). | Không biết bắt đầu từ đâu; dễ sửa nhầm dữ liệu hệ thống.                                      |
| Trang chủ admin là danh sách thẻ collection mặc định của Payload | Không có "việc cần làm hôm nay".                                                                                                                                                                                                                                                                       | Đơn chờ xác nhận, lead mới, yêu cầu xóa tài khoản phải tự đi tìm.                             |
| Form **Sản phẩm** phẳng, ~30 trường                              | Mọi loại (ebook, công cụ số, gói, Shopee, workshop…) thấy cùng một form: "Cấu phần của gói" hiện cả với ebook, "Số ngày dùng thử" hiện cả với Shopee, "Tài liệu được giao" hiện với gói.                                                                                                               | Không biết trường nào bắt buộc cho loại mình đang tạo; dễ tạo sản phẩm thiếu / sai logic bán. |
| Không có luồng tạo theo bước                                     | Tạo sản phẩm = 1 form dài; tạo gói Growth Mirror cần hiểu "cấu phần", "cấp quyền sản phẩm".                                                                                                                                                                                                            | Hana cần người hỗ trợ.                                                                        |
| Live Preview chỉ có ở 3 collection                               | `services`, `programs`, `posts` (`src/lib/live-preview.ts`). Sản phẩm, bài học, thẻ EQ, testimonial, trang pháp lý, workshop, cài đặt site **không** xem trước được. Trang Puck có xem trước riêng trong builder.                                                                                      | Sửa xong phải xuất bản rồi mở web mới biết kết quả.                                           |

## 2. Nguyên tắc thiết kế

1. **Theo việc của Hana, không theo bảng dữ liệu.** Menu, dashboard, wizard đặt tên bằng động từ / việc ("Tạo sản phẩm", "Đơn chờ xác nhận"), không bằng tên collection.
2. **Chỉ thấy cái cần thấy.** Trường không áp dụng cho loại sản phẩm thì ẩn (`admin.condition`); collection kỹ thuật ẩn khỏi menu với `editor`, gom vào nhóm "Hệ thống" thu gọn cho `owner`.
3. **Không đổi schema nếu tránh được.** Ưu tiên `tabs` không tên, `admin.condition`, `admin.position: 'sidebar'`, custom view / component – **không** đổi cấu trúc dữ liệu → **không migration**, không làm hỏng dữ liệu, Puck block, API đang dùng. Task nào thật sự cần migration phải DỪNG hỏi.
4. **Wizard là lối tắt, không thay form.** Wizard tạo bản ghi **nháp** qua đúng validation / hook của collection, rồi mở form chuẩn. Form chuẩn vẫn sửa được mọi thứ.
5. **Xem trước ở mọi nơi Hana sửa nội dung hiển thị công khai**, 3 kích thước 375 / 768 / 1440 như Puck; không lộ bản nháp cho khách (đã có quy tắc `preview=1` + kiểm phiên admin trong `live-preview`).
6. **Brand + tiếng Việt + dễ đọc**: logo / màu brand cho admin ở mức nhẹ (logo, icon, màu nhấn), không phá giao diện Payload; mọi nhãn, mô tả tiếng Việt; tương phản WCAG AA.
7. **Không thêm package.** Payload 3 có sẵn custom view, `admin.components`, `livePreview`, `beforeDashboard`.

## 3. Cấu trúc menu đề xuất (CM-01)

| Nhóm (thứ tự)              | Mục                                                                                                                                           | `editor` thấy?                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Trang web**              | Trang (Puck), Bài viết & video, Lời chia sẻ, Trang pháp lý, Thư viện ảnh, Thư viện ảnh, Menu (global), Cài đặt site (global)                  | Có (Cài đặt site: chỉ owner sửa phần thanh toán – giữ quyền hiện có) |
| **Sản phẩm & bán hàng**    | Sản phẩm, Dịch vụ đồng hành, Chương trình doanh nghiệp, Đơn hàng, Mã giảm giá, Tài liệu riêng tư                                              | Có (Đơn hàng: theo quyền hiện có)                                    |
| **Khóa Habit**             | Nhóm bài học, Bài học, Kỹ thuật, Câu hỏi quiz, Lịch workshop                                                                                  | Có                                                                   |
| **EQ Buddy**               | Thẻ EQ                                                                                                                                        | Có                                                                   |
| **Học viên & khách**       | Khách hàng, Lead, Chứng nhận, Kế hoạch thói quen                                                                                              | Có (cảm xúc / ghi chú vẫn ẩn với editor)                             |
| **Hệ thống** (cuối, owner) | Quản trị viên, Quyền truy cập, Check-in, Tiến độ bài học, Kết quả quiz, Thẻ đã lưu, Sự kiện thanh toán, Nhật ký, Nhắc dùng thử, Nhắc workshop | **Không** (ẩn bằng `admin.hidden` theo vai trò)                      |

Mỗi collection: `admin.description` 1 câu tiếng Việt "dùng để làm gì", `defaultColumns` hữu ích, `listSearchableFields`, `useAsTitle` có nghĩa. Thứ tự trong `payload.config.ts` = thứ tự menu.

## 4. Dashboard "Hôm nay" (CM-02)

Thay phần đầu dashboard (`admin.components.beforeDashboard` hoặc custom `views.dashboard`):

- **Việc cần làm** (thẻ số, bấm vào mở danh sách đã lọc): đơn chờ xác nhận, đơn lệch tiền / đã hủy mà khách vẫn chuyển (từ `paymentEvents`), lead mới, yêu cầu xóa tài khoản, workshop trong 7 ngày tới.
- **Tạo nhanh**: Tạo sản phẩm (mở wizard CM-04), Tạo trang / landing (mẫu Puck), Thêm lời chia sẻ, Thêm buổi workshop, Thêm bài học.
- **Hướng dẫn**: link mục tương ứng trong `HUONG_DAN_CMS.md` (bản web hoặc PDF).
- Chỉ đếm, không hiện dữ liệu cá nhân (tên / email) trên dashboard.

## 5. Form Sản phẩm theo loại (CM-03)

Tabs (không tên → không đổi dữ liệu): **Cơ bản** · **Giá & bán** · **Nội dung trang** · **Gói & quyền** · **Tài liệu giao** · **Liên kết ngoài**. Sidebar: `saleStatus`, `web`, `type`, thứ tự, trạng thái nháp.

| Loại (`type`)                                    | Tab / trường hiện                                                                     | Ẩn                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `digital_tool` (công cụ số)                      | Giá, giá ưu đãi, `trialDays`, `accessDurationDays`, `saleEndsAt`, nội dung trang, FAQ | Cấu phần gói, liên kết ngoài, tài liệu                     |
| `ebook`, `toolkit`                               | Tài liệu được giao, giá (0 = miễn phí), nội dung                                      | Dùng thử, cấu phần                                         |
| `package` (gói)                                  | Cấu phần gói + tổng giá trị / % (chỉ đọc), giá bán, cấp quyền sản phẩm                | Dùng thử, tài liệu, liên kết ngoài                         |
| `physical_external` (Shopee)                     | Liên kết ngoài + nhãn, ảnh                                                            | Giá trong web (chỉ hiển thị), dùng thử, cấu phần, tài liệu |
| `coaching_trial`, `workshop`, `community`, `b2b` | Giá / CTA theo loại                                                                   | Trường không áp dụng                                       |

Thêm: mô tả ngắn dưới từng trường ("Khách thấy ở đâu"), cảnh báo nhẹ khi `saleStatus = on_sale` mà thiếu giá / ảnh bìa / slug.

## 6. Wizard (CM-04, CM-06)

**CM-04 – "Tạo sản phẩm"** (custom view `/admin/tao-san-pham`, 5 bước, nút Quay lại / Tiếp, lưu tạm trên trình duyệt):

1. **Chọn loại** – thẻ lớn có hình + 1 câu giải thích ("Công cụ số: mở dùng thử 21 ngày rồi bán", "Gói đồng hành: gộp nhiều cấu phần"…).
2. **Thông tin cơ bản** – tên (tự sinh slug, sửa được), khu vực web, mô tả ngắn, ảnh bìa (chọn từ Media, bắt buộc `alt`).
3. **Giá & cách bán** – chỉ các trường của loại đã chọn (bảng mục 5); gói: thêm cấu phần, thấy ngay tổng giá trị và % ưu đãi.
4. **Nội dung trang** – "Bao gồm", Khó khăn / Kết quả, FAQ.
5. **Xem trước & lưu** – khung xem trước 375 / 768 / 1440 (dùng route xem trước của CM-05) → **Lưu nháp** (mặc định) hoặc **Xuất bản** → mở form chuẩn của bản ghi.

Tạo qua Local API trong server action có kiểm phiên admin (`editor` / `owner`), `draft: true`, chạy đủ hook (tính tổng giá trị gói…). Không tạo được → báo lỗi tiếng Việt, giữ dữ liệu đã nhập.

**CM-06 – Wizard nhỏ khác** (sau CM-04, dùng chung khung bước): "Thêm bài học" (chọn nhóm → tiêu đề, tóm tắt → mã video Bunny + thời lượng → xem thử bài), "Lên lịch workshop" (chọn sản phẩm được tham gia → ngày giờ giờ VN → link tham gia → xem trước email nhắc).

## 7. Live Preview mở rộng (CM-05)

Mở rộng `src/lib/live-preview.ts` thành bảng ánh xạ dùng chung:

| Collection                            | Trang xem trước                                                                                                                                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `products`                            | theo loại: công cụ số Habit → `/habit/1-percent-better`; ebook / toolkit → `/tai-nguyen/[slug]`; gói → `/coaching/growth-mirror`; còn lại → route thẻ sản phẩm `/xem-truoc/san-pham/[id]` (ProductCard + PriceTag) |
| `lessons`                             | `/habit/hoc/[id]` ở chế độ xem trước admin (bỏ kiểm quyền học viên chỉ khi phiên admin hợp lệ)                                                                                                                     |
| `eqCards`                             | `/eq-buddy/the/[qrSlug]`                                                                                                                                                                                           |
| `testimonials`                        | `/xem-truoc/loi-chia-se/[id]` (TestimonialCard)                                                                                                                                                                    |
| `legalPages`                          | `/[slug]` của trang pháp lý                                                                                                                                                                                        |
| `workshops`                           | `/xem-truoc/workshop/[id]` (thẻ lịch như khách thấy)                                                                                                                                                               |
| `siteSettings`, `navigation` (global) | `/` (header, footer, menu, nút Zalo)                                                                                                                                                                               |

Quy tắc an toàn (giữ như T1-10b): chỉ phiên admin xem được bản nháp; khách mở link `preview=1` thấy bản đã xuất bản hoặc 404; `noindex`; không cache chung.

## 8. Thứ tự, máy, ước lượng

| Mã    | Việc                                                                    | Phụ thuộc    | Migration | Ước lượng    | Máy đề xuất |
| ----- | ----------------------------------------------------------------------- | ------------ | --------- | ------------ | ----------- |
| CM-01 | Menu theo việc + ẩn collection kỹ thuật theo vai trò + mô tả / cột      | –            | Không     | 4–5 h        | Local       |
| CM-02 | Dashboard "Hôm nay"                                                     | CM-01        | Không     | 5–6 h        | Laptop      |
| CM-03 | Form Sản phẩm theo loại (tabs + điều kiện + cảnh báo)                   | –            | Không     | 5–6 h        | PC nhà      |
| CM-05 | Live Preview mở rộng + route `/xem-truoc/*`                             | –            | Không     | 8–10 h       | Laptop      |
| CM-04 | Wizard "Tạo sản phẩm"                                                   | CM-03, CM-05 | Không     | 10–12 h      | PC nhà      |
| CM-06 | Wizard bài học + workshop                                               | CM-04        | Không     | 6–8 h        | Local       |
| CM-07 | Cập nhật `HUONG_DAN_CMS.md` + ảnh + buổi thử với Hana (5 việc, bấm giờ) | CM-01→06     | Không     | Planning 3 h | Planning    |

Song song được: CM-01 ‖ CM-03 ‖ CM-05. File dễ xung đột: `src/payload.config.ts` (CM-01, CM-02 thêm component), `src/collections/Products.ts` (CM-03 – CM-05 chỉ thêm `livePreview`), `src/lib/i18n/vi.ts` (mỗi task một khối riêng: `cms.nav`, `cms.dashboard`, `cms.productForm`, `cms.preview`, `cms.wizard`).

## 9. Tiêu chí nghiệm thu chung (cổng CMS-UX)

Hana (hoặc anh Nhân đóng vai Hana, chưa xem hướng dẫn) tự làm, mỗi việc ≤ 5 phút, không hỏi:

1. Tạo công cụ số mới ở trạng thái nháp, giá 250.000 / 178.000, dùng thử 21 ngày, xem trước trên điện thoại, rồi xuất bản.
2. Tạo gói đồng hành 3 cấu phần và đọc đúng tổng giá trị + % ưu đãi.
3. Sửa câu chuyện 1 thẻ EQ, xem trước trước khi xuất bản.
4. Tìm và xác nhận 1 đơn chờ từ dashboard.
5. Thêm 1 lời chia sẻ có đồng ý hiển thị, xem trước thẻ.

Không có lỗi console, không lỗi TypeScript; e2e cho wizard và live preview; editor không thấy nhóm Hệ thống; dữ liệu cũ mở / sửa / lưu bình thường.
