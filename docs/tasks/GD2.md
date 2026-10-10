# GĐ 2 – Web 2 Habit MVP: task card cho Antigravity

> **MỞ 10/10/2026** – cổng GĐ 1 đạt (anh Nhân xác nhận thay Hana). Quyết định đã chốt: `docs/plan/GAPS_AND_QUESTIONS.md` mục "Kết quả chốt 10/10/2026".
> **Cổng GĐ 2** (AGENTS.md mục 12): một đơn thật được thanh toán và **mở khóa tự động**; người review kỹ thuật đã duyệt các chỗ `REVIEW-REQUIRED`.
> Tham chiếu: AGENTS.md mục 7, 8.2, 9 (luồng 2, 3, 5), 10, 11; `docs/plan/ESTIMATES.md` mục GĐ 2 (E2-1 → E2-10); `docs/plan/GAPS_AND_QUESTIONS.md`.
> Khung dữ liệu đã có từ GĐ 0: `customers`, `otpCodes`, `entitlements` (khóa trial một lần), `habitPlans`, `habitCheckins`, `lessonProgress`, `certificates`, `workshops`, `lessons.videoId`. Nội dung đã nhập: 16 câu quiz, 11 kỹ thuật, 20 bài học / 7 nhóm.

## Quyết định (chốt 10/10)

| Mã     | Chốt                                                                  | Task          |
| ------ | --------------------------------------------------------------------- | ------------- |
| Q8     | SePay, tài khoản cá nhân                                              | T2-09         |
| Q9     | Bunny Stream cho video trả phí (video gốc Hana giữ trên YouTube)      | T2-05         |
| Q14    | 10 cảm xúc theo prototype, emoji                                      | T2-06         |
| Q2     | Mua lẻ từng công cụ số, dùng vĩnh viễn                                | T2-02, T2-08  |
| H1, H2 | Quiz thang 1–5, điểm trung bình mỗi giai đoạn                         | T2-12         |
| Q19    | Owner xác nhận được đơn đã hết hạn                                    | T2-13         |
| D1, D2 | Anh Nhân đứng tên tài khoản; chạy server riêng (Docker), cron crontab | mọi task cron |
| Q15    | **Còn mở** – giá Habit Tracker để trong CMS                           | không chặn    |

**Việc ngoài code cần có trước khi task tương ứng nghiệm thu**: tài khoản **SePay** (T2-09) và **Bunny Stream** + 20 video tải lên (T2-05) – anh Nhân tạo, khóa API chỉ đặt trong `.env` server, không gửi vào chat/repo.

## Lịch máy đề xuất

- **PC nhà** (chuỗi đăng nhập – thanh toán, `[REVIEW]`): T2-01 → T2-02 → T2-04 → T2-08 → T2-09 → T2-13.
- **Local** (Habit): T2-03 → T2-06 → T2-07.
- **Laptop**: T2-00 → T2-12 → T2-10 → T2-05.
- **Codex** (Local): review thứ hai mọi task `[REVIEW]`.
- **Planning**: QA từng PR, T2-11 (e2e luồng Habit + cổng).
- 🔒 Migration: T2-01, T2-02, T2-06, T2-07 đều có thể cần migration → nối tiếp nhau, không chạy song song.

---

## T2-00 – Cô lập unit test dùng chung DB (giao ngay)

**Máy**: Laptop · **Ước lượng**: 1 h · Không migration, không package.

**Vì sao**: `payments.test.ts` ("thiếu thông tin ngân hàng") và `package-payment.test.ts` cùng sửa global `siteSettings` khi vitest chạy song song file → đôi khi test thứ nhất vẫn tạo được đơn (T1-17b mục 5). Chạy riêng: xanh. Đây là test chập chờn có gốc rõ, không phải lỗi sản phẩm.

**Phạm vi**: cấu hình vitest để các file test dùng Local API + DB (gồm mọi file sửa `siteSettings`) chạy **tuần tự**, các file thuần (component, hàm) vẫn song song – ví dụ `test.projects` tách 2 nhóm, nhóm DB `fileParallelism: false`. Không đổi nội dung test, không bỏ qua test nào.

**Tiêu chí nghiệm thu**

- [ ] `pnpm test` chạy 5 lần liên tiếp trên DB sạch: 5/5 xanh.
- [ ] Thời gian chạy không tăng quá 2 lần so với hiện tại (ghi số trước/sau vào báo cáo).

---

## T2-01 – Đăng nhập khách bằng OTP email **[REVIEW]**

**Máy**: PC nhà · **Ước lượng**: 12 h (E2-1) · 🔒 Migration nếu thêm field.

**Phạm vi**: `/tai-khoan/dang-nhap`: nhập email → gửi OTP 6 số (hết hạn 10 phút, lưu **hash** trong `otpCodes`, tối đa 5 lần thử, rate limit theo email + IP, Turnstile) → nhập mã → tạo customer nếu chưa có (ghi `consentAt` khi tick đồng ý) → phiên đăng nhập cookie `httpOnly` + `secure` + `sameSite=lax`, tách hẳn khỏi phiên admin Payload. Đăng xuất. Trang `/tai-khoan` khung (khóa học của tôi, đơn hàng – rỗng). Email OTP qua `EmailSender` có sẵn (React Email, brand). Không mật khẩu.
**Bảo mật**: so sánh mã hằng thời gian; mã dùng một lần; không tiết lộ email có tồn tại hay không; access `customers` chỉ đọc/sửa chính mình (AGENTS mục 7 Phân quyền).

**Tiêu chí nghiệm thu**

- [ ] Nhập email → nhận mã (log khi chưa có Resend) → đăng nhập; mã sai 5 lần → khóa, báo tiếng Việt.
- [ ] Mã hết hạn / dùng lại → từ chối. Khách A không đọc được dữ liệu khách B qua REST.
- [ ] IT duyệt.

---

## T2-02 – Dịch vụ quyền truy cập (entitlement) **[REVIEW]**

**Phụ thuộc**: T2-01 · **Máy**: PC nhà · **Ước lượng**: 8 h (E2-2)

**Phạm vi**: `src/lib/entitlements/` (mở rộng từ `grantEntitlementsForOrder` của T1-13): `startTrial(customer, product)` (chỉ khi `trialDays > 0`, một lần duy nhất – dựa vào khóa `trialKey` ở DB), `hasAccess(customer, product, now)`, `activateFromOrder(order)` (trial → active, giữ dữ liệu), tự hết hạn theo `expiresAt` (đọc lúc kiểm, không cần cron để chặn quyền). Sự kiện `trial_started`, `trial_expired`, `trial_converted` (không gửi dữ liệu cá nhân).

**Tiêu chí nghiệm thu**

- [ ] Dùng thử lần 2 cùng công cụ → từ chối, báo tiếng Việt. Gọi đồng thời 2 lần → đúng 1 bản ghi.
- [ ] Hết hạn → `hasAccess` false; mua → active, tracker cũ vẫn còn.
- [ ] IT duyệt.

---

## T2-03 – Habit Loop 5 phút + trang offer

**Máy**: Local · **Ước lượng**: 12 h (E2-5)

**Phạm vi**: `/habit/5-phut` wizard 4 bước theo AGENTS 8.2 (bảng điểm thói quen tốt/bình thường/xấu → "Tôi sẽ … để trở thành …" → chọn 1–2 kỹ thuật mỗi giai đoạn từ `techniques` + hành động → xem tracker 21 ngày), lưu nháp `localStorage`, để lại email (consent) → lưu `habitPlans` theo `leadEmail` + lead tag + link nhóm Zalo (`zaloGroupUrl`). `/habit/1-percent-better`: trang offer (20 video, 11 kỹ thuật, tracker) – giá và chữ từ CMS, CTA "Dùng thử 21 ngày miễn phí" (dẫn tới đăng nhập OTP; trước T2-04 thì tạm dẫn tới trang đăng nhập). Sự kiện `habit_loop_completed`.

**Tiêu chí nghiệm thu**

- [ ] Làm xong wizard trên điện thoại < 5 phút; tải lại trang giữa chừng không mất dữ liệu.
- [ ] Không gửi nội dung thói quen / câu định danh vào analytics.

---

## T2-04 – Luồng dùng thử 21 ngày

**Phụ thuộc**: T2-02, T2-03 · **Máy**: PC nhà · **Ước lượng**: 6 h

**Phạm vi**: CTA trang offer → OTP → `startTrial` → vào thẳng `/habit/hoc`; email chào mừng; banner đếm ngày còn lại; hết hạn: chỉ xem, nút "Mua để dùng tiếp"; email nhắc ngày 18 và 21 (cron, idempotent). **Đổi CTA kết quả quiz** sang dùng thử Habit Tracker (cấu hình CMS). Luồng 2 mục 9 AGENTS chạy end-to-end.

---

## T2-05 – Video bảo vệ + dashboard học **[REVIEW]**

**Máy**: Laptop · **Ước lượng**: 14 h (E2-6)

**Phạm vi**: Bunny Stream (Q9) sau interface `VideoProvider` (`src/lib/video/`), link ký có hạn, chỉ trả khi `hasAccess`. `/habit/hoc`: module theo nhóm (Insight → Habit Loop → Nguyên tắc → Kỹ thuật), tiến độ, ghi `lessonProgress` khi xem ≥ 80%, `isFreePreview` xem không cần đăng nhập. Sự kiện `lesson_completed`. Không YouTube unlisted.

---

## T2-06 – Tracker 21 ngày + nhắc nhở

**Phụ thuộc**: T2-02 · **Máy**: Local · **Ước lượng**: 14 h (E2-7) · Q14 cho bộ cảm xúc

**Phạm vi**: lưới 21 ô, tick + chọn cảm xúc (bộ cố định Q14: **10 cảm xúc emoji** – Vui vẻ, Bình an, Tươi mới, An yên, Biết ơn, Thư thái, Tự tin, Hơi mệt, Chùn bước, Căng thẳng; thay bộ 6 cảm xúc MẪU trong `src/lib/emotions.ts`), ghi chú tùy chọn; không tick ngày tương lai; duy nhất (plan, day); "Lỡ nhịp 1 ngày là không sao cả"; lỡ 2 ngày liên tiếp → email nhắc nhẹ (cron, idempotent); câu "Ngày hôm nay, bạn đã bỏ phiếu cho con người bạn muốn trở thành?"; ngày 21: trang tổng kết + mời mua + mời phiên trải nghiệm. Dữ liệu cảm xúc/ghi chú **không** vào analytics, **không** hiện cho editor. Sự kiện `tracker_day_checked` (không kèm cảm xúc).

---

## T2-07 – Chứng nhận 21 ngày

**Phụ thuộc**: T2-06 · **Máy**: Local · **Ước lượng**: 10 h (E2-8)

**Phạm vi**: đủ `certificateMinDays` → tạo `certificates` + ảnh `next/og` 4:5 và 9:16 theo brand (logo, tên, câu định danh, số ngày, ngày cấp, mã); **kiểm Anton có dấu tiếng Việt trong `next/og`** (font đã cắt ở T1-17b vẫn đủ dải tiếng Việt). `/chung-nhan/[code]` công khai chỉ hiện tên, câu định danh, số ngày, ngày cấp; học viên tắt được link công khai. Chưa đủ ngày: lời động viên. Sự kiện `certificate_issued`, `certificate_shared`.

---

## T2-08 – Mua công cụ số (xác nhận thủ công) **[REVIEW]**

**Phụ thuộc**: T2-02 · **Máy**: PC nhà · **Ước lượng**: 6 h

**Phạm vi** (Q2: mua lẻ, vĩnh viễn): khách đã đăng nhập bấm "Mua để dùng tiếp" → đơn `pending` + VietQR (tái dùng T1-12) → Hana xác nhận → `activateFromOrder` → email xác nhận. Ô đồng ý điều khoản. Luồng 3 mục 9 AGENTS chạy được bằng xác nhận thủ công – **chưa đạt cổng** (cổng cần tự động, T2-09).

---

## T2-09 – Webhook SePay tự động **[REVIEW]**

**Phụ thuộc**: T2-08 · **Máy**: PC nhà · **Ước lượng**: 14 h (E2-3)

**Phạm vi**: `PaymentProvider` thứ hai – **SePay** (Q8) – sau interface có sẵn; webhook xác thực chữ ký, khớp `paymentRef` + **số tiền chính xác**, idempotent (nhận trùng không cấp 2 lần), ghi `paymentEvents` mọi lần gọi; sandbox cho preview. Không tin dữ liệu trình duyệt. AGENTS mục 10.

---

## T2-10 – Lịch workshop + nhắc 24 giờ

**Máy**: Laptop · **Ước lượng**: 6 h (E2-9)

**Phạm vi**: lịch workshop "Tập thương cảm xúc" từ `workshops` cho khách mua gói (lọc `audienceProducts`), hiện trong `/tai-khoan`; email nhắc trước 24 giờ (cron, idempotent, giờ Việt Nam).

---

## T2-12 – Quiz: thang 1–5, chấm điểm trung bình

**Máy**: Laptop · **Ước lượng**: 2 h · Không migration (điểm lưu dạng số trong `diagnosticResults.answers`).

**Phạm vi** (H1, H2): thang mỗi câu **1–5** với 5 nhãn theo file Excel (Không bao giờ / Hiếm khi / Thỉnh thoảng / Thường xuyên / Rất thường xuyên – nhãn vào `vi.ts`); `scoreDiagnostic` tính **điểm trung bình** mỗi giai đoạn (giai đoạn không có câu nào thì bỏ qua), hòa theo B8; giai đoạn phụ khi chênh ≤ một ngưỡng tính trên thang trung bình (ghi lý do). Sửa Zod `max(5)`, giao diện 5 nút, unit test (gồm trường hợp 6/3/5/2 câu – kết quả không còn luôn ra "Tín hiệu").

**Tiêu chí nghiệm thu**

- [ ] Tín hiệu trả 3 cho cả 6 câu, Khao khát trả 5 cho cả 3 câu, còn lại 1 → kết quả "Khao khát" (cộng tổng sẽ ra "Tín hiệu").
- [ ] Kết quả cũ trong `diagnosticResults` (thang 1–4) vẫn hiển thị được, không lỗi.

---

## T2-13 – Owner xác nhận đơn đã hết hạn **[REVIEW]**

**Phụ thuộc**: – · **Máy**: PC nhà · **Ước lượng**: 2 h

**Phạm vi** (Q19): `confirmManualPayment` nhận cả đơn `failed` (hết hạn 24 giờ) – chỉ owner, UPDATE có điều kiện `payment_status IN ('pending','failed')`, ghi audit `confirm_expired_order`; đơn `cancelled` vẫn **không** xác nhận được. Nút "Xác nhận thanh toán" hiện cho đơn `pending` và `failed` (kèm cảnh báo "Đơn đã quá hạn – chỉ xác nhận khi đã thấy tiền về"). Hướng dẫn CMS mục 7.5 cập nhật.

**Tiêu chí nghiệm thu**

- [ ] Đơn hết hạn → owner xác nhận → paid, email gửi 1 lần; editor không làm được; đơn đã hủy vẫn bị từ chối.
- [ ] IT duyệt.

---

## T2-11 – E2E luồng Habit + cổng GĐ 2 (Planning)

**Phụ thuộc**: tất cả · **Ước lượng**: 8 h (E2-10)

Playwright: offer → OTP → dùng thử → học video → tick tracker → chứng nhận; mua → webhook sandbox → active. Lighthouse, axe các trang mới. Biên bản `docs/tasks/GATE_GD2.md`.
