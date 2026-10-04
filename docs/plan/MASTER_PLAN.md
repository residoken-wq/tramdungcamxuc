# Master Plan – Hệ sinh thái số Trạm Dừng Cảm Xúc

> Người lập: BA / Planning Manager · Cập nhật: 03/10/2026
> Người thực thi code: **Antigravity** (thay vai "Codex" trong `AGENTS.md`)
> Chủ sản phẩm: Hana Lương · Review kỹ thuật: anh IT hỗ trợ (nhan-it)
> Nguồn: `docs/Planning chuyển đổi sản phẩm số – Trạm Dừng Cảm Xúc.docx`, `agent/AGENTS.md`

---

## 1. Mục tiêu và phạm vi

Xây **một codebase Next.js + Payload CMS 3** chứa 3 web (`/`, `/habit`, `/eq-buddy`) + CMS (`/admin`) + trình kéo thả Puck, để Hana tự sửa mọi nội dung thay đổi thường xuyên mà không cần code.

Thước đo thành công của dự án (không phải của từng web):
1. Hana vượt qua bài kiểm tra cổng của từng giai đoạn **mà không cần hỗ trợ**.
2. Không có đơn hàng nào được mở khóa sai (thiếu tiền, trùng webhook, chưa xác nhận).
3. Không có giá, copy, testimonial nào bị hardcode.

Ngoài phạm vi (ghi vào `docs/BACKLOG.md` nếu có ai đề xuất): giỏ hàng / giao vận bộ thẻ vật lý, hoàn tiền, app mobile, đa ngôn ngữ, tự build lịch đặt hẹn, B2B tracker cho đội ngũ (chỉ đề xuất ở GĐ 4).

---

## 2. Lộ trình tổng thể

| GĐ | Tên | Kết quả dùng được | Số task | Ước lượng tạm* | Cổng |
| --- | --- | --- | --- | --- | --- |
| 0 | Nền móng | Admin chạy trên preview, đủ collections, kéo thả 5 khối | 11 | 2–3 tuần | Hana tạo 1 sản phẩm + dựng 1 trang thử |
| 1 | Web 1 Landing + CMS | Trang chủ, thư viện, form lead, quiz chẩn đoán, bán phiên trải nghiệm 149k (xác nhận tay) | 17 | 4–5 tuần | Hana tự dựng landing chiến dịch, lead thật về |
| 2 | Web 2 Habit MVP | Dùng thử 21 ngày, tracker, video bảo vệ, thanh toán tự động, chứng nhận | ~12 | 4–5 tuần | 1 đơn thật thanh toán & mở khóa tự động; IT duyệt REVIEW-REQUIRED |
| 3 | Web 3 EQ Buddy | Rút thẻ 5 bước, trang QR, ảnh chia sẻ, dùng thử | ~7 | 2–3 tuần | Người thật rút thẻ & quét QR ổn định |
| 4 | Mở rộng | Gói Growth Mirror tự động, email nuôi dưỡng, mã giảm giá | ~5 | 2 tuần | Theo backlog |

\* Ước lượng tạm của Planning. **Task T0-11 yêu cầu Antigravity ước lượng lại** sau khi nền móng xong; con số của T0-11 sẽ thay bảng này.

Quy tắc chuyển giai đoạn: chỉ mở task GĐ sau khi cổng GĐ trước **đạt** và Hana xác nhận bằng văn bản (comment/Zalo đều được, ghi lại vào `docs/DECISIONS.md`).

---

## 3. Cách giao việc cho Antigravity

### 3.1 Chuẩn bị một lần (trước task đầu tiên)

1. **Đưa `AGENTS.md` ra thư mục gốc repo.** Hiện file nằm ở `agent/AGENTS.md`, trong khi chính file ghi "Đặt ở thư mục gốc repo". Antigravity đọc `AGENTS.md` ở gốc. Task T0-01 làm việc này.
2. Đọc `docs/tasks/README.md`: quy trình, mẫu prompt, bảng trạng thái.
3. Đưa file nguồn còn thiếu vào `docs/source/` (xem mục 6 – nếu thiếu, T0-07 sẽ seed dữ liệu giả có đánh dấu MẪU).

### 3.2 Nhịp làm việc

```
Planning chọn task (theo thứ tự phụ thuộc)
  → Giao cho Antigravity bằng prompt mẫu (docs/tasks/README.md)
  → Antigravity làm trên branch riêng `task/T0-03-design-tokens`
  → Antigravity báo cáo theo mẫu mục 13 AGENTS.md
  → Planning nghiệm thu theo "Tiêu chí nghiệm thu" của task
  → (Nếu có REVIEW-REQUIRED) IT review
  → Merge vào main → cập nhật bảng trạng thái
```

- **Một task = một branch = một PR.** Không gộp task.
- **Chạy tuần tự là mặc định.** Chỉ chạy song song các cặp được đánh dấu "song song được" trong file task (khác thư mục, không cùng sửa `payload.config.ts`).
- Antigravity gặp spec thiếu / mâu thuẫn → **dừng và hỏi**, không tự đoán (nguyên tắc 2 trong AGENTS.md).

---

## 4. Sơ đồ phụ thuộc

### GĐ 0

```
T0-01 Scaffold ──┬─> T0-02 CI & test
                 ├─> T0-03 Tokens & font ──> T0-04 UI primitives ──> T0-05 UI composites
                 ├─> T0-06 Collections nội dung ──┬─> T0-07 Collections giao dịch + quyền ──> T0-08 Seed MẪU
                 │                                 └─> T0-09 Puck editor + 5 khối (cần T0-05)
                 └─> T0-10 Deploy preview (cần tài khoản từ IT)
                                        tất cả ──> T0-11 Ước lượng GĐ1–4 + hướng dẫn CMS nháp
```

Song song được: (T0-02 ‖ T0-03), (T0-04/05 ‖ T0-06/07), T0-10 bất kỳ lúc nào sau T0-01.

### GĐ 1

```
Puck:      T1-01 ─> T1-02 ─> T1-03 ─> T1-04 (mẫu trang, versions, khóa khối)
Khung:     T1-05 Navbar/Footer/Zalo/pháp lý
Lead:      T1-06 Form & email ─> T1-07 Tài nguyên miễn phí
Sản phẩm:  T1-08 Logic hiển thị saleStatus ─> T1-09 Thư viện
Trang:     T1-10 Trang con dữ liệu ─> T1-11 Growth Mirror
Tiền:      T1-12 Thanh toán thủ công 149k ─> T1-13 Link thanh toán gói
Quiz:      T1-14 Chẩn đoán /habit/chan-doan (cần T1-06)
Hạ tầng:   T1-15 Analytics/SEO/security/domain
Seed:      T1-16 Dựng trang seed từ mẫu (cần T1-04, T1-10, T1-11)
Cuối:      T1-17 QA + E2E + HUONG_DAN_CMS bản 1
```

---

## 5. GĐ 2–4: danh sách epic (chưa tách task chi tiết)

Tách task chi tiết sau khi cổng GĐ 1 đạt và có ước lượng T0-11. Ghi sẵn để không quên phụ thuộc.

### GĐ 2 – Habit MVP
| Epic | Ghi chú phụ thuộc / rủi ro |
| --- | --- |
| E2-1 Customer OTP login (`/tai-khoan`) | REVIEW-REQUIRED. Cần collection `otpCodes` (xem GAPS). Rate limit. |
| E2-2 Entitlement service: trial 21 ngày, hết hạn, trial→active, một lần/khách | REVIEW-REQUIRED. Dùng lại hàm cấp quyền viết ở T1-13. |
| E2-3 Chốt cổng thanh toán (payOS / SePay) + `WebhookProvider` | **Chặn bởi quyết định Hana**: hình thức kinh doanh, tài khoản nhận tiền. |
| E2-4 Checkout công cụ số + webhook idempotent + đổi CTA quiz sang dùng thử | REVIEW-REQUIRED. |
| E2-5 Habit Loop 5 phút (wizard 4 bước) + trang offer `/habit/1-percent-better` | Cần nội dung `techniques` thật. |
| E2-6 Video bảo vệ (Bunny/Cloudflare Stream, signed URL) + dashboard `/habit/hoc` + tiến độ ≥80% | **Chặn bởi quyết định**: chọn dịch vụ video. Cần collection `lessonProgress`. |
| E2-7 Tracker 21 ngày + quy tắc lỡ nhịp + email nhắc (ngày 18, 21, lỡ 2 ngày) | Cần cron (Vercel Cron). Dữ liệu cảm xúc không vào analytics. |
| E2-8 Tổng kết ngày 21 + chứng nhận (`next/og` 4:5, 9:16) + `/chung-nhan/[code]` | Kiểm tra font Anton có dấu trong `next/og`. |
| E2-9 Lịch workshop + email nhắc 24h | Cần collection `workshops` (xem GAPS). |
| E2-10 Playwright: mua → học → tick tracker | |

### GĐ 3 – EQ Buddy
| Epic | Ghi chú |
| --- | --- |
| E3-1 Luồng rút thẻ 5 bước (lọc theo cảm xúc / chủ đề / ngẫu nhiên, lật thẻ, reduced-motion) | |
| E3-2 Trang thẻ QR `/eq-buddy/the/[qrSlug]` luôn xem được; khóa `qrSlug` sau khi đánh dấu "đã in" | Cần cờ `printedAt` để khóa sửa slug (xem GAPS). |
| E3-3 Gating: thẻ đầu miễn phí, sau đó trial 21 ngày (dùng lại E2-2) | |
| E3-4 Lưu thẻ + reflection (chỉ khi đăng nhập) | Dữ liệu nhạy cảm. |
| E3-5 Ảnh chia sẻ `next/og` 4:5 / 9:16 + offer liên quan | |
| E3-6 Nút Shopee + UTM + `external_clicked` | Đã có component từ T1-08. |
| E3-7 Xuất QR (CSV + PNG) cho file in | |

### GĐ 4 – Mở rộng
E4-1 Thanh toán gói tự động qua webhook + cấp quyền cộng đồng/lịch · E4-2 Chuỗi email nuôi dưỡng · E4-3 Mã giảm giá · E4-4 Đề xuất (tài liệu, không code) B2B tracker · E4-5 Hardening & tối ưu theo số liệu 4 tuần đầu.

---

## 6. Đầu vào phải có – ai chuẩn bị, chặn task nào

| Đầu vào | Người lo | Chặn task |
| --- | --- | --- |
| Tài khoản GitHub repo, Vercel, Neon/Supabase, Cloudflare (R2 + Turnstile), Resend | IT | T0-10 (deploy); T0-01..09 chạy local được |
| `Growth_Mirror_Pricing_Calculator.xlsx` → `docs/source/` | Hana | T0-08 (seed). Thiếu thì seed theo bảng trong AGENTS.md |
| File Excel Habit Hack (16 tình huống, 11 kỹ thuật, 20 video) → `docs/source/` | Hana | T0-08 (seed), T1-14 (quiz) |
| Brand Book 2026 (PDF) → `docs/source/` | Hana | T0-03 (tham chiếu; token đã có trong AGENTS.md) |
| Logo PNG nền trong (sáng/tối/đơn sắc), ảnh chân dung → `public/brand/` | Hana | T0-03 dùng placeholder; T1-16 cần bản thật |
| Copy trang chủ 2 lối vào, mô tả Growth Mirror / Thinking Mirror / B2B, 3–6 testimonial có consent | Hana | T1-16 (dựng trang thật); GĐ 1 cổng |
| PDF ebook, toolkit EQ | Hana | T1-07 nghiệm thu thật |
| Thông tin người bán + nội dung 6 trang pháp lý (nên có luật sư xem) | Hana | Cổng GĐ 1 |
| Tên miền DNS, email gửi đi (domain verify Resend), link Zalo, link đặt lịch (Cal.com/Google) | Hana + IT | T1-15, T1-06, T1-12 |
| Tài khoản ngân hàng nhận VietQR | Hana | T1-12 (hiển thị QR) |

---

## 7. Rủi ro chính và cách xử lý trong kế hoạch

| Rủi ro | Xử lý |
| --- | --- |
| Code AI có lỗ hổng ở auth, phân quyền, webhook, mở khóa nội dung | Mọi task chạm vào đây gắn nhãn **[REVIEW]**; không merge khi IT chưa duyệt. Có test bắt buộc cho access control (T0-07). |
| Puck route `/admin/builder/...` xung đột với catch-all `/admin/[[...segments]]` của Payload | T0-09 bắt đầu bằng spike 2 giờ; phương án dự phòng: route `/builder/[pageId]` ngoài admin, guard bằng session Payload. Ghi kết quả vào DECISIONS.md. |
| API Payload 3 / Puck đổi nhanh, AI nhớ sai | Mỗi task yêu cầu đọc docs chính thức và ghi phiên bản package vào DECISIONS.md. |
| Phạm vi phình to | Antigravity chỉ làm đúng task; ý tưởng mới → BACKLOG.md. Planning từ chối thay đổi giữa giai đoạn trừ khi Hana chốt. |
| Dữ liệu cá nhân nhạy cảm (NĐ 13/2023) | Consent + `consentAt` ở mọi form; cảm xúc/reflection không vào analytics; xóa tài khoản ở GĐ 2. |
| Chờ nội dung thật của Hana | Antigravity seed dữ liệu MẪU có cờ `isSample`; cổng mỗi GĐ yêu cầu nội dung thật, không phải code. |
| Cổng thanh toán chưa chốt | GĐ 1 dùng `ManualPaymentProvider`; interface `PaymentProvider` thiết kế từ T1-12 để GĐ 2 chỉ thêm provider. |

---

## 8. Quyết định & câu hỏi mở

Xem `docs/plan/GAPS_AND_QUESTIONS.md` – gồm các lỗ hổng spec Planning đã phát hiện, phương án mặc định Antigravity sẽ dùng, và câu hỏi cần Hana chốt (kèm hạn chót theo giai đoạn).
