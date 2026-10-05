# Lỗ hổng spec, quyết định mặc định và câu hỏi mở

> BA review `AGENTS.md` + file Planning ngày 03/10/2026.
> Quy ước: **Mặc định** = Antigravity làm theo cách này cho đến khi có quyết định khác. Khi Hana/IT chốt khác, Planning cập nhật file này và `docs/DECISIONS.md`.

---

## A. Lỗ hổng trong mô hình dữ liệu (AGENTS.md mục 7)

Spec mô tả tính năng nhưng thiếu chỗ lưu dữ liệu. Antigravity **bổ sung** các mục dưới đây trong T0-06 / T0-07.

| #   | Thiếu                                                     | Tính năng cần                                        | Mặc định bổ sung                                                                                                                                                                                         |
| --- | --------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Lịch workshop                                             | 8.2 "Lịch workshop lấy từ CMS, email nhắc 24h"       | Collection `workshops`: `title`, `product` (rel), `startsAt`, `endsAt`, `joinUrl`, `audienceProducts[]` (ai được xem), `status`.                                                                         |
| A2  | Tiến độ xem video                                         | 8.2 "ghi nhận đã xem ≥ 80%"                          | Collection `lessonProgress`: `customer`, `lesson`, `watchedPercent`, `completedAt?`. Duy nhất (customer, lesson).                                                                                        |
| A3  | Mã OTP                                                    | 8.4 "OTP 6 số, hết hạn 10 phút"                      | Collection `otpCodes` (ẩn khỏi admin): `email`, `codeHash`, `expiresAt`, `attempts`, `usedAt?`. Không lưu OTP dạng rõ.                                                                                   |
| A4  | Log webhook & thao tác tay                                | Mục 10 "ghi log mọi webhook", "mọi thao tác ghi log" | Collection `paymentEvents`: `order?`, `provider`, `rawPayload`, `signatureValid`, `result`, `receivedAt`. Collection `auditLogs`: `actor`, `action`, `target`, `before`, `after`, `at`. Chỉ `owner` đọc. |
| A5  | Thời điểm đồng ý điều khoản ở checkout                    | 8.1 "lưu thời điểm đồng ý vào order"                 | `orders.termsAcceptedAt` (bắt buộc khi tạo order).                                                                                                                                                       |
| A6  | Bật/tắt link chứng nhận công khai                         | 8.2 "Học viên có thể tắt link công khai"             | `certificates.isPublic` (mặc định true).                                                                                                                                                                 |
| A7  | Khóa `qrSlug` sau khi in                                  | Mục 14 "Không đổi qrSlug của thẻ đã in"              | `eqCards.printedAt`; khi có giá trị thì field `qrSlug` read-only (hook chặn cả qua API).                                                                                                                 |
| A8  | Link thanh toán gói do Hana tạo                           | 8.1, luồng "Mua gói Growth Mirror"                   | `orders.createdByAdmin` (bool) + `orders.payToken` (ngẫu nhiên, duy nhất) → trang `/thanh-toan/[payToken]`.                                                                                              |
| A9  | Đánh dấu dữ liệu mẫu                                      | Mục 14 "Không xóa dữ liệu khách thật khi seed"       | Field `isSample` (ẩn, mặc định false) ở các collection nội dung; seed chỉ tạo/xóa bản ghi `isSample = true`.                                                                                             |
| A10 | Lead từ đặt phiên trải nghiệm khi khách chưa có tài khoản | Luồng 149k ở GĐ 1 (OTP chỉ có ở GĐ 2)                | GĐ 1: form đặt phiên tạo/tìm `customer` theo email **không cần đăng nhập**; order gắn customer đó. GĐ 2 khách đăng nhập OTP bằng cùng email sẽ thấy đơn.                                                 |

## B. Mâu thuẫn / chỗ chưa rõ trong tài liệu

| #   | Chỗ                                                                               | Vấn đề                                                                                        | Mặc định                                                                                                                                                  |
| --- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | AGENTS.md mục 7                                                                   | `pages` được liệt kê dưới "Globals" nhưng thực chất là **collection** (nhiều trang, có slug). | Làm `pages` là collection.                                                                                                                                |
| B2  | AGENTS.md mục 9                                                                   | Tiêu đề "Năm luồng" nhưng bảng có 8 luồng.                                                    | Làm đủ 8 luồng.                                                                                                                                           |
| B3  | AGENTS.md mục 9                                                                   | Luồng "Mua Habit Hack có video" (mua thẳng) trùng/mâu thuẫn với "dùng thử 21 ngày rồi mua".   | Một sản phẩm duy nhất (Habit Tracker số). Cho phép **mua ngay không cần dùng thử** từ trang offer (nút phụ), cùng checkout. Chờ Hana xác nhận Q1.         |
| B4  | File Planning, bảng tổng quan                                                     | Ghi "sau đó 178.000đ", bảng danh mục ghi "250.000đ, ưu đãi 178.000đ".                         | Theo bảng danh mục: `price` 250.000, `salePrice` 178.000.                                                                                                 |
| B5  | AGENTS.md 5B vs mục 6                                                             | Editor Puck tại `/admin/builder/[pageId]` có thể đụng route catch-all của Payload.            | Spike ở T0-09; dự phòng `/builder/[pageId]`.                                                                                                              |
| B6  | Mục 9 nhắc Cloudflare Turnstile, mục 4 (tech stack) không có.                     |                                                                                               | Thêm Turnstile vào stack; khóa trong `.env`; tắt được ở môi trường dev.                                                                                   |
| B7  | `siteSettings` định nghĩa ở 2 chỗ (Globals và "bổ sung").                         |                                                                                               | Gộp thành một global, chia tab trong admin: Chung / Thanh toán / Liên hệ & Zalo / Người bán / Công cụ số.                                                 |
| B8  | Quiz chẩn đoán: thang 1–4 cho mỗi câu, điểm hòa giữa 2 giai đoạn chưa có quy tắc. |                                                                                               | Hòa → chọn giai đoạn xuất hiện trước theo thứ tự Cue → Craving → Response → Reward; hiển thị cả giai đoạn thứ 2 nếu chênh ≤ 1 điểm. Ghi vào DECISIONS.md. |
| B9  | Ngày trong tracker 21 ngày tính theo múi giờ nào.                                 |                                                                                               | `Asia/Ho_Chi_Minh` cho mọi tính toán ngày (trial, tracker, nhắc email).                                                                                   |
| B10 | VietQR GĐ 1: tự sinh mã EMVCo hay dùng ảnh từ dịch vụ ngoài.                      |                                                                                               | Tự sinh payload VietQR (chuẩn EMVCo/NAPAS) bằng thư viện, render QR phía server; không phụ thuộc API ngoài ở GĐ 1.                                        |

## C. Câu hỏi cần Hana chốt

Antigravity **không tự quyết**; trong lúc chờ, làm theo cột "Mặc định" và để cấu hình được trong CMS.

| #   | Câu hỏi                                                                                      | Mặc định đang dùng                                                                                               | Hạn chót    |
| --- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------- |
| Q1  | Habit Hack 149.000đ trong brief cũ đã được thay bằng Habit Tracker số 250.000đ / 178.000đ?   | Đúng, đã thay.                                                                                                   | Trước GĐ 2  |
| Q2  | Mua sau dùng thử là vĩnh viễn hay theo kỳ?                                                   | `accessDurationDays` rỗng = vĩnh viễn                                                                            | Trước GĐ 2  |
| Q3  | 178.000đ là giá ưu đãi cố định hay có hạn?                                                   | `saleEndsAt` rỗng = cố định                                                                                      | Trước GĐ 2  |
| Q4  | Phí 149.000đ có trừ vào giá gói không?                                                       | `trialCreditApplies = false`                                                                                     | Trước T1-13 |
| Q5  | Web có hiện "tổng giá trị" và "% ưu đãi" của 3 gói? Coaching tính 1.000.000đ hay 2.200.000đ? | Hiện; dùng `unitValue` (1.000.000đ); có công tắc ẩn trong khối `PackageComparison`                               | Trước T1-11 |
| Q6  | Mua gói được mở khóa Habit Tracker + EQ Buddy số ngay?                                       | Có, qua `components[].grantsProduct`                                                                             | Trước T1-13 |
| Q7  | Thinking Mirror và 2 chương trình B2B có hiện trên web không?                                | Hiện với trạng thái "Cần tư vấn"                                                                                 | Trước T1-16 |
| Q8  | Hình thức kinh doanh (cá nhân / hộ kinh doanh) để đăng ký payOS hoặc SePay?                  | GĐ 1 xác nhận thủ công                                                                                           | Trước GĐ 2  |
| Q9  | Dịch vụ video: Bunny Stream hay Cloudflare Stream?                                           | Chưa chọn; Planning đề xuất Bunny Stream (rẻ, có token auth, máy chủ châu Á)                                     | Trước GĐ 2  |
| Q10 | Analytics: GA4 hay Plausible?                                                                | Planning đề xuất **Plausible** (không cookie, gọn hơn với NĐ 13) hoặc GA4 nếu Hana đã chạy quảng cáo Google/Meta | Trước T1-15 |
| Q11 | Link đặt lịch: Cal.com hay Google Calendar booking?                                          | Field `bookingUrl` nhận bất kỳ link nào                                                                          | Trước T1-12 |
| Q12 | Nút chat nổi mở Zalo OA hay Zalo cá nhân?                                                    | Field `zaloChatUrl` nhận bất kỳ link nào                                                                         | Trước T1-05 |
| Q13 | Nút CTA chính nền hồng `accent-pink` + chữ trắng chỉ đạt chuẩn dễ đọc (WCAG AA) khi chữ to và đậm (≥ 18.66px). Chấp nhận nút CTA luôn chữ to, hay đổi nền nút sang `bright-magenta` (đạt 5.78:1 với mọi cỡ chữ)? | Giữ `accent-pink`, chữ nút CTA ≥ 18.66px đậm; nút nhỏ dùng nền `deep-navy` | Trước T0-04 merge |
| Q14 | Bộ cảm xúc cố định cho tracker 21 ngày và EQ Buddy: gồm những cảm xúc nào (tên tiếng Việt), bao nhiêu cái? Hiển thị bằng icon nét mảnh hay emoji? | 6 cảm xúc mẫu, icon SVG nét mảnh (không emoji), đánh dấu `PENDING Q14` trong `src/lib/emotions.ts` | Trước GĐ 2 (tracker) – T0-05 dùng bộ mẫu |

## D. Câu hỏi cho IT

| #   | Câu hỏi                                                                                                                      | Hạn chót    |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | ----------- |
| D1  | Ai tạo và giữ quyền owner các tài khoản Vercel / Neon / Cloudflare / Resend? Đề xuất: tài khoản đứng tên Hana, IT là member. | Trước T0-10b (trước T1-15) – bản demo GĐ 0 tự host, không cần |
| D2  | Neon hay Supabase? Planning đề xuất **Neon** (branch DB cho mỗi preview, khớp Vercel).                                       | Trước T0-10b (trước T1-15) |
| D3  | Package manager: pnpm (đề xuất)                                                                                              | T0-01       |
| D4  | Lịch review REVIEW-REQUIRED: IT review trong bao lâu sau khi PR mở? Đề xuất ≤ 2 ngày làm việc.                               | Trước T0-07 |
