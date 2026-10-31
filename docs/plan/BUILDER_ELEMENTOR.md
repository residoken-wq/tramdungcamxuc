# Builder kiểu Elementor + công tắc khoá / mở brand (track EB)

> Lập 31/10/2026 (Planning). Nguồn: Hana phàn nàn CMS khó dùng; anh Nhân yêu cầu builder dùng giống Elementor để người dùng tự chỉnh.
> Quyết định 31/10 (anh Nhân):
>
> 1. Bỏ luật brand cứng trong builder để Hana tự chỉnh.
> 2. CMS này sẽ dùng lại để làm website sản phẩm cho **nhiều khách hàng khác nhau**. Mọi luật brand trở thành **tuỳ chọn khoá / mở** theo từng site.
>
> Chưa đọc được elementor.com (mạng phiên Planning chặn domain đó). Danh sách tính năng Elementor ở mục 2 viết theo bản Elementor phổ biến (Editor + Flexbox Container + Site Settings). Anh Nhân kiểm lại nếu cần.

## 1. Giữ gì, đổi gì

- **Giữ Puck** (`@puckeditor/core`, MIT). Elementor là plugin WordPress, không chạy trong Next.js / Payload. Đổi sang WordPress = viết lại đơn hàng, dùng thử, Habit, EQ Buddy.
  - Puck 0.23 có sẵn chỗ thay giao diện editor: `overrides` gồm `header`, `headerActions`, `fields`, `fieldLabel`, `drawer`, `drawerItem`, `componentItem`, `componentOverlay`, `actionBar`, `outline`, `iframe`, `preview`, `puck`, `fieldTypes`. Có thêm `plugins`.
  - Đủ để dựng lại giao diện editor theo kiểu Elementor mà không fork Puck.
- **Giao diện:** làm **bố cục và cách thao tác** giống Elementor (cột widget trái, canvas giữa, bảng sửa 3 tab, Navigator, chuột phải, chế độ thiết bị).
  - **Không** chép mã nguồn, icon, hình ảnh hay tên thương mại của Elementor: Elementor là phần mềm GPL của bên thứ ba. Lý do: policy tổ chức (PACE AI Policy mục 7) áp cho mọi dự án Planning làm. Giới hạn này không cản việc giống về cách dùng.
  - Icon dùng bộ mở đang có hoặc tự vẽ.
- **Dữ liệu trang cũ không hỏng:**
  - Khối brand hiện có (51 khối, PK-01 → PK-13) giữ nguyên, vẫn kéo thả được.
  - Widget chung mới thêm bên cạnh.
  - Đổi props khối cũ thì phải có migration (AGENTS §5B).

## 2. So khớp tính năng Elementor

| Nhóm                | Elementor                                                                                                                                                                  | Hiện có (Puck + PK)                                                | Task              |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------- |
| Khung editor        | Cột trái widget (icon + tìm kiếm + nhóm), canvas, thanh dưới (thiết bị, lịch sử, Navigator, xem trước, xuất bản)                                                           | Danh sách tên khối theo nhóm, header Puck                          | EB-03             |
| Bảng sửa phần tử    | 3 tab **Nội dung / Kiểu / Nâng cao**, mỗi control có biểu tượng thiết bị để đặt giá trị riêng                                                                              | Một cột field dài                                                  | EB-04             |
| Bố cục              | **Container** flexbox lồng nhau (hướng, căn, khoảng cách, wrap, chiều rộng full / boxed), grid                                                                             | `Columns`, `FreeSection` (PK-13)                                   | EB-05             |
| Widget cơ bản       | Tiêu đề, Văn bản, Ảnh, Nút, Icon, Danh sách icon, Đường kẻ, Khoảng trống, Video, Thư viện ảnh, Tabs, Accordion, Bộ đếm, Thanh tiến độ, Đánh giá, Mạng xã hội, Bản đồ, HTML | Khối brand theo mục đích (Hero, Thẻ gói…)                          | EB-06             |
| Kiểu (Style)        | Màu tự do, gradient, font, cỡ / độ đậm / giãn dòng, viền, bo góc, bóng, nền ảnh, hiệu ứng hover                                                                            | Dropdown 8 màu, cỡ chữ S/M/L (PK-01, PK-10)                        | EB-02, EB-04      |
| Nâng cao            | Margin / padding theo thiết bị, ẩn theo thiết bị, z-index, CSS ID / class, **CSS tuỳ chỉnh**, hiệu ứng chuyển động                                                         | Không                                                              | EB-04, EB-09      |
| Responsive          | Desktop / Tablet / Mobile, giá trị riêng mỗi thiết bị                                                                                                                      | Xem 3 khổ, **không** đặt giá trị riêng                             | EB-04             |
| Navigator           | Cây lớp, đổi tên lớp, ẩn / hiện, kéo đổi chỗ                                                                                                                               | Tab Cấu trúc của Puck, không đổi tên được (BACKLOG)                | EB-07             |
| Chuột phải          | Sửa, nhân bản, sao chép, dán, **dán kiểu**, đặt lại kiểu, lưu thành mẫu, Navigator, xoá                                                                                    | Thanh nút nhỏ (nhân bản, xoá, chọn cha)                            | EB-07             |
| Sao chép giữa trang | Sao chép phần tử trang A, dán sang trang B                                                                                                                                 | Không                                                              | EB-07             |
| Mẫu                 | Thư viện mẫu trang + mẫu section, **lưu section của mình thành mẫu**, widget toàn cục                                                                                      | 12 mẫu trang trong code                                            | EB-08             |
| Site Settings       | Màu toàn cục, font toàn cục, kiểu chữ toàn cục, logo, bố cục                                                                                                               | Màu / font cố định trong code (`tailwind.config.ts` + `next/font`) | EB-01, EB-02      |
| Lịch sử             | Hoàn tác từng thao tác + danh sách phiên bản, khôi phục                                                                                                                    | Hoàn tác có; phiên bản nằm ngoài builder (Payload)                 | EB-08             |
| Theme Builder       | Header / footer / trang chi tiết dựng bằng kéo thả, có điều kiện hiển thị                                                                                                  | Navbar / Footer trong code + global `navigation`                   | EB-10 (sau)       |
| Popup               | Popup builder + điều kiện mở                                                                                                                                               | Không                                                              | BACKLOG           |
| Form                | Form builder (field tuỳ ý, gửi email, webhook)                                                                                                                             | Form cố định (LeadForm, B2B, liên hệ)                              | BACKLOG           |
| Nội dung động       | Dynamic tags gắn dữ liệu                                                                                                                                                   | Khối lấy sản phẩm / dịch vụ từ Payload                             | Giữ cách hiện tại |

## 3. Công tắc khoá / mở brand (EB-01)

Global mới **`designSystem`**, mỗi site một bản:

| Field                            | Ý nghĩa                                                                                                                                         |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `colors[]`                       | Bảng màu toàn cục { tên, token, hex }. Seed = 8 màu Brand Book Trạm (giữ token cũ, trang cũ không đổi màu)                                      |
| `fonts`                          | Font theo vai trò (tiêu đề, UI, trích dẫn, đoạn văn), chọn từ danh sách Google Fonts có subset tiếng Việt. Seed = Anton / Montserrat / Playfair |
| `typeScale`, `radius`, `spacing` | Cỡ chữ, bo góc, khoảng cách mặc định                                                                                                            |
| `lock.colors`                    | `locked`: chỉ chọn màu trong bảng · `open`: thêm color picker tự do                                                                             |
| `lock.fonts`                     | `locked`: font theo vai trò, không chọn · `open`: chọn font cho từng phần tử                                                                    |
| `lock.sizes`                     | `locked`: chỉ các mức S / M / L · `open`: nhập số (px / rem / %)                                                                                |
| `lock.customCss`                 | `locked`: không có ô CSS / HTML · `open`: ô CSS tuỳ chỉnh và widget HTML (chỉ `owner`)                                                          |
| `lock.contrastCheck`             | Bật: báo khi chữ / nền dưới WCAG AA (cảnh báo, không chặn khi `open`)                                                                           |

- **Kỹ thuật:**
  - Màu đã là CSS variable (`--color-*-rgb` trong `tailwind.config.ts`). EB-02 đổi nguồn biến từ code sang `designSystem`, sinh `<style>` ở layout, có cache và revalidate khi lưu.
  - Font: `next/font` hiện là cố định lúc build. Khi `fonts` đổi, tải Google Fonts lúc chạy (thẻ `<link>` có `display=swap`, subset `vietnamese`). Cần mở CSP cho `fonts.googleapis.com` / `fonts.gstatic.com`.
- **Trạm Dừng Cảm Xúc:** theo quyết định 31/10 để **`open`** cho Hana tự chỉnh. Nhãn trong admin ghi rõ: "Đang mở – trang có thể lệch Brand Book".
- **Site khách hàng mới:** mặc định `locked` với bảng màu của khách. Planning đề xuất mặc định này, anh Nhân chốt.

## 4. Task

Thứ tự gợi ý: EB-01 → EB-02 trước, vì mọi control kiểu chữ / màu sau này đọc từ `designSystem`. EB-03 làm song song.

| Mã    | Việc                                                                                                                                                                                                                               | Phụ thuộc    | Ước lượng |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | --------- |
| EB-01 | Global `designSystem` + 5 công tắc khoá / mở + seed từ Brand Book (migration). Quyền: chỉ `owner` sửa công tắc. Cập nhật AGENTS §5B / §14 thành "theo `designSystem.lock`"                                                         | –            | 5 h       |
| EB-02 | Biến CSS màu / font / cỡ / bo góc sinh từ `designSystem` (thay giá trị cứng), tải font Google lúc chạy, CSP. Trang cũ hiển thị **y hệt** khi seed = Brand Book (test ảnh chụp so sánh)                                             | EB-01        | 6 h       |
| EB-03 | Khung editor kiểu Elementor qua `overrides`: cột trái dạng lưới icon + ô tìm kiếm + nhóm thu gọn; thanh dưới (thiết bị, hoàn tác, Navigator, xem trước, Lưu nháp / Xuất bản); nhãn tiếng Việt                                      | –            | 6 h       |
| EB-04 | Bảng sửa 3 tab Nội dung / Kiểu / Nâng cao (`fields` override + metadata nhóm field). Field kiểu **responsive** (`fieldTypes`) lưu `{ desktop, tablet, mobile }`, render ra CSS theo breakpoint. Control màu / font / cỡ đọc `lock` | EB-02, EB-03 | 10 h      |
| EB-05 | Widget **Container** flexbox lồng nhau (hướng, căn, gap, wrap, boxed / full, nền màu / ảnh / gradient, viền, bo góc, bóng, padding theo thiết bị)                                                                                  | EB-04        | 8 h       |
| EB-06 | Bộ widget chung đợt 1: Tiêu đề, Văn bản (rich text), Ảnh, Nút, Icon, Danh sách icon, Đường kẻ, Khoảng trống, Video, Tabs, Accordion, Bộ đếm. Mỗi widget đủ 3 tab, có snapshot test                                                 | EB-05        | 12 h      |
| EB-07 | Navigator đổi tên lớp (`_label` + `outline` override), ẩn theo thiết bị; menu chuột phải (`componentOverlay`): nhân bản, sao chép, dán, dán kiểu, đặt lại kiểu, xoá; clipboard sang trang khác                                     | EB-03        | 6 h       |
| EB-08 | Mẫu: collection `templates` (section / trang), "Lưu thành mẫu", chèn mẫu; bảng Lịch sử phiên bản trong builder (Payload versions, khôi phục)                                                                                       | EB-03        | 6 h       |
| EB-09 | Nâng cao: CSS tuỳ chỉnh cho phần tử / trang, widget HTML, ID / class, z-index, hiệu ứng vào khung hình. Chỉ hiện khi `lock.customCss = open` và user là `owner`; lọc / CSP (`REVIEW-REQUIRED`)                                     | EB-04        | 5 h       |
| EB-10 | Header / footer dựng bằng builder (thay Navbar / Footer code khi site chọn), giữ footer pháp lý bắt buộc                                                                                                                           | EB-06        | 8 h       |
| EB-11 | Buổi thử bấm giờ với Hana (như CM-07): 6–8 việc thật (đổi màu nút, đổi font tiêu đề, dựng landing từ mẫu, chỉnh mobile riêng, lưu section thành mẫu…), ghi lỗi, sửa vòng 2                                                         | EB-08        | 4 h       |
| EB-12 | `HUONG_DAN_CMS.md` phần builder mới + e2e các luồng chính                                                                                                                                                                          | EB-11        | 4 h       |

Tổng khoảng **80 giờ**. Popup builder, form builder, theme builder cho trang chi tiết: BACKLOG, làm sau buổi thử EB-11.

## 5. Rủi ro

- **Trang xấu / khó đọc khi mở brand.** Đã có cảnh báo tương phản (`lock.contrastCheck`), Lịch sử phiên bản để quay lại, và nhãn "Đang mở" trong admin.
- **CSS / HTML tuỳ chỉnh = chèn mã lên site.**
  - Chỉ `owner` dùng được.
  - CSS lọc bỏ `@import` / `url(javascript:…)`. HTML qua sanitizer; script chỉ cho khi anh Nhân duyệt.
  - Đánh `REVIEW-REQUIRED` (AGENTS §2.8).
- **Hiệu năng (Lighthouse mobile ≥ 90, AGENTS §11).** CSS sinh theo trang có cache, font tải `swap`, giới hạn số font mở.
- **Puck đổi API.** Ghim bản Puck, override bọc trong `src/puck/editor/`. Nâng Puck thì chạy e2e builder.
- **Dùng cho nhiều khách hàng.** Track EB chỉ làm phần builder + design system. Còn mã / chữ riêng của Trạm (luồng Habit, EQ Buddy, giá, i18n) cần kế hoạch "tách lõi sản phẩm" riêng. Chưa thuộc track này.

## 6. Đã chốt 31/10 (anh Nhân)

1. Nhiều khách hàng: **mỗi khách một bản cài riêng** (Docker + DB riêng như hiện tại). Không làm multi-tenant.
2. Site khách mới: mặc định **khoá** mọi công tắc. Site Trạm: `owner` mở trong admin sau EB-01.
3. Widget HTML **không chạy script**. Mã theo dõi (pixel, analytics) dùng ô riêng trong Cài đặt site.
4. Track EB chạy **song song** track HB, trên máy thứ ba. Task có migration xếp hàng 🔒 Migration chung: HB-24 → EB-01 → …

## 7. Đã xem và loại: Builder.io, Plasmic (31/10)

Nguồn là repo GitHub, forum và trang review. Tài liệu chính thức (`docs.plasmic.app`, `elementor.com`) bị mạng phiên Planning chặn.

|                       | Builder.io                                                   | Plasmic                                                 | Puck                                    |
| --------------------- | ------------------------------------------------------------ | ------------------------------------------------------- | --------------------------------------- |
| Trình sửa             | Dịch vụ cloud của Builder.io; forum nói không có bản tự host | Studio tự host được (Docker), forum báo còn lỗi khi cài | Nằm trong admin Payload                 |
| Nội dung trang        | Lưu trên cloud Builder, đọc qua CDN của họ                   | DB riêng của Plasmic                                    | Postgres của mình, có phiên bản Payload |
| License               | SDK MIT; trình sửa trả phí theo tài khoản                    | `platform/` AGPL, phần còn lại MIT                      | MIT                                     |
| Mỗi khách một bản cài | Mỗi khách một space trả phí, phụ thuộc mạng / giá bên ngoài  | Thêm cả app Plasmic cho mỗi khách, đăng nhập riêng      | Không phát sinh                         |

Kết luận: **giữ Puck**, dựng lại giao diện editor theo track EB.
