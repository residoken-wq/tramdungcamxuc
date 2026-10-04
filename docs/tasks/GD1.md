# GĐ 1 – Web 1 Landing + CMS: task card cho Antigravity

> **Chỉ mở khi cổng GĐ 0 đạt.** Ước lượng ngày công sẽ điền từ `docs/plan/ESTIMATES.md` (T0-11).
> **Cổng GĐ 1**: Hana tự kéo thả tạo 1 landing chiến dịch mới từ mẫu và xuất bản; tự sửa tiêu đề hero, thêm 1 testimonial, đổi trạng thái 1 sản phẩm, sửa 1 trang pháp lý mà không cần hỗ trợ; lead thật về đủ và xuất được CSV; 6 trang pháp lý đã có nội dung thật.
> Tham chiếu: AGENTS.md mục 5B, 8.1, 9, 10, 11; `docs/plan/GAPS_AND_QUESTIONS.md`.

---

## T1-01 – Khối Puck: Mở đầu, Nội dung, Bố cục

**Phạm vi**: `HeroImage`, `QuoteBlock`, `StatsBar` (số liệu nhập tay trong khối – Hana tự nhập, không bịa sẵn), `JourneySteps` (Pause → Feel → Name → Choose → Practice), `FAQ` (accordion, bàn phím được), `VideoEmbed` (chỉ YouTube/Vimeo công khai cho nội dung miễn phí), `Columns` (2/3 cột, vùng thả lồng nhau), `Spacer` (16/24/32/48/64), `Divider` (đường kẻ mảnh / nét trái tim).
Sidebar Puck nhóm khối theo danh mục 5B, nhãn tiếng Việt. Mỗi khối có `version`, snapshot test.

**Tiêu chí nghiệm thu**

- [ ] Mọi khối kéo thả được, render giống hệt trên trang công khai ở 375/1440.
- [ ] `Columns` chứa được khối khác bên trong.
- [ ] Không khối nào có field màu/cỡ chữ tự do.

---

## T1-02 – Khối Puck: Bán hàng, Niềm tin

**Phụ thuộc**: T1-01, T1-08

**Phạm vi**: `ProductGrid` (chọn nhiều product hoặc lọc theo `web`/`type`), `ProductFeature`, `PackageComparison` (3 gói, công tắc hiện/ẩn "tổng giá trị" và "% ưu đãi" – GAPS Q5), `PriceTag`, `TrialCTA`, `TestimonialSlider`, `TestimonialGrid` (chỉ testimonial `consent = true` + published), `LogoStrip`, `HanaStory`.
**Bắt buộc**: dùng external field / `resolveData` của Puck, **chỉ lưu ID**, giá/tên lấy trực tiếp từ Payload khi render. Đổi giá ở product → trang tự cập nhật sau revalidate (hook `afterChange` của `products`, `testimonials` revalidate các trang dùng chúng).

**Tiêu chí nghiệm thu**

- [ ] Đổi giá 1 sản phẩm trong admin → trang có `ProductGrid` hiện giá mới mà không phải sửa trang.
- [ ] Mở JSON `puckData` → không chứa giá hay tên sản phẩm.
- [ ] Testimonial `consent = false` không bao giờ hiện.

---

## T1-03 – Khối Puck: Chuyển đổi

**Phụ thuộc**: T1-02, T1-06

**Phạm vi**: `CTAButton` (đã có, bổ sung chọn trang đích từ `pages`), `LeadForm` (chọn 1 tài nguyên sẽ giao qua email), `BookingCTA` (phiên trải nghiệm – giá lấy từ product), `B2BBriefForm`, `QuizCTA`, `ShopeeButton` (lấy `shopeeStoreUrl` + UTM), `ZaloButton`, `LibraryPreview`. Form gọi API của T1-06; ghi sự kiện analytics qua helper (T1-15 nối provider; trước đó helper no-op).

**Tiêu chí nghiệm thu**

- [ ] Gửi form từ khối trên trang kéo thả tạo được `lead` với `source` = slug trang + utm.
- [ ] Nút Shopee mở tab mới, URL có `utm_source=tramdungcamxuc`.

---

## T1-04 – Puck: mẫu trang, lịch sử phiên bản, khóa khối, autosave

**Phụ thuộc**: T1-03

**Phạm vi**

1. 4 mẫu JSON trong `src/puck/templates/`: "Landing chiến dịch", "Trang dịch vụ", "Trang workshop", "Trang sự kiện". Tạo trang mới → chọn mẫu.
2. Lịch sử phiên bản (Payload versions) + nút khôi phục bản trước, hiển thị tiếng Việt.
3. Permissions API của Puck: trên trang slug `/`, không xóa / kéo ra được `HeroTwoEntries`; footer pháp lý không xóa được.
4. Hoàn tác / làm lại, nhân bản khối, **nhân bản cả trang**.
5. Autosave nháp mỗi 30 giây; cảnh báo khi rời trang chưa lưu.
6. Khung migration dữ liệu khối trong `src/puck/migrations/` + 1 test chứng minh đổi props có migration không làm hỏng trang cũ.

**Tiêu chí nghiệm thu**

- [ ] Tạo landing từ mẫu "Landing chiến dịch" → sửa → xuất bản trong < 10 phút (Planning bấm giờ).
- [ ] Khôi phục bản cũ hoạt động.
- [ ] Không xóa được Hero trên trang chủ.

---

## T1-05 – Navbar, Footer, FloatingChat, 6 trang pháp lý

**Phạm vi**

1. Nối `Navbar`/`Footer` với global `navigation`; menu đúng 8.1: Về Hana · Thư viện · Test thói quen 5 phút (→ `/habit/chan-doan`) · Growth Mirror · Doanh nghiệp · nút nổi bật "Đặt phiên trải nghiệm". Quiz hiện trên cả desktop và mobile.
2. Footer tự liệt kê `legalPages` theo `order` + thông tin người bán từ `sellerInfo`.
3. 6 route pháp lý (slug đúng 8.1) render rich text từ `legalPages`, hiện `lastUpdated`. Trang `/thong-tin-phap-ly` lấy `sellerInfo`.
4. `FloatingChat`: góc phải dưới, `env(safe-area-inset-bottom)`, mở `zaloChatUrl` tab mới, sự kiện `zalo_chat_clicked`, tắt được bằng `showFloatingChat`; tự ẩn trên `/habit/hoc`, tracker, luồng rút thẻ (danh sách route ẩn khai báo một chỗ).

**Tiêu chí nghiệm thu**

- [ ] Hana đổi thứ tự menu trong admin → web đổi theo.
- [ ] Sửa nội dung 1 trang pháp lý → trang công khai cập nhật.
- [ ] Nút Zalo không che nội dung trên iPhone (ảnh chụp 375px).

---

## T1-06 – Hạ tầng form + email: lead, coaching, B2B

**Phạm vi**

1. `src/lib/forms/`: validate Zod phía server, honeypot, rate limit (theo IP + email), Cloudflare Turnstile (tắt được ở dev). Thông báo lỗi tiếng Việt dễ hiểu.
2. API/Server Actions: `submitLead` (nguồn, nhu cầu, tag quan tâm, consent + `consentAt`), `submitCoachingForm` (Thinking Mirror / coaching), `submitB2BBrief` (công ty, quy mô, hành vi mục tiêu, thời gian).
3. `src/lib/email/` với Resend + React Email; sender `TRAM DUNG CAM XUC <...>`; template: xác nhận cho khách, thông báo cho Hana (email nhận lấy từ `siteSettings`). Ghi log gửi lỗi, không làm hỏng form khi email lỗi.
4. Admin `leads`: lọc theo `followUpStatus`, `source`, `need`; nút **Xuất CSV** (UTF-8 BOM để Excel mở tiếng Việt đúng), chỉ owner/editor.
5. Unit test validator; e2e gửi form B2B.

**Tiêu chí nghiệm thu**

- [ ] Gửi brief B2B → khách nhận email xác nhận, Hana nhận email thông báo, lead có trong admin.
- [ ] CSV mở bằng Excel không lỗi font tiếng Việt.
- [ ] Gửi 10 lần liên tục → bị chặn với thông báo tiếng Việt.

---

## T1-07 – Giao tài nguyên miễn phí qua email

**Phụ thuộc**: T1-06

**Phạm vi**: route `/tai-nguyen/[slug]` (product `type` ebook/toolkit, `saleStatus = free`) → form tên + email + consent → lead → email chứa **link ký hết hạn 7 ngày** tới file PDF (route `/api/download/[token]` kiểm tra token, redirect tới URL ký của R2). File PDF không truy cập trực tiếp được. Sự kiện `lead_submitted`, `resource_downloaded`.

**Tiêu chí nghiệm thu**

- [ ] Nhận email, tải được PDF; sửa token / quá hạn → báo lỗi tiếng Việt.
- [ ] Đoán URL file trên R2 không tải được.

---

## T1-08 – Logic hiển thị sản phẩm theo `saleStatus`

**Phạm vi**: hàm thuần `resolveProductCta(product)` trong `src/lib/products.ts` theo bảng 8.1 (coming_soon → "Nhận thông báo"; on_sale → "Mua ngay" hoặc "Dùng thử 21 ngày miễn phí" khi `trialDays > 0`; free → "Nhận miễn phí"; consult → "Đăng ký tư vấn"; hidden → không hiện; có `externalUrl` → link ngoài + `external_clicked`). Nhãn lấy từ `vi.ts` trừ khi product có `ctaLabel`. Gắn vào `ProductCard`. Giá hiển thị tôn trọng `saleEndsAt` (hết hạn → hiện giá gốc). Trong GĐ 1, CTA "Dùng thử" dẫn tới trang "Sắp ra mắt – để lại email" (tạo lead tag `trial_waitlist`).

**Tiêu chí nghiệm thu**

- [ ] Unit test đủ 6 nhánh + trường hợp `saleEndsAt` đã qua.
- [ ] Đổi `saleStatus` trong admin → nút đổi trên web.

---

## T1-09 – Thư viện `/thu-vien`

**Phụ thuộc**: T1-08

**Phạm vi**: 2 tab _Khóa học_ (Habit Tracker số, EQ Buddy số, 3 gói) và _Nội dung_ (ebook, toolkit, `posts`); lọc chủ đề EQ / Habit / Career; tìm theo tên; trạng thái trên URL `?tab=noi-dung&topic=habit&q=...`; trạng thái rỗng/loading/lỗi. Phần giới thiệu đầu trang là vùng Puck (trang `pages` slug `thu-vien-intro` hoặc tương đương). Sự kiện `library_filtered`.

**Tiêu chí nghiệm thu**

- [ ] Copy URL đã lọc gửi người khác → mở ra đúng tab và bộ lọc.
- [ ] Dùng tốt ở 375px.

---

## T1-10 – Trang con dữ liệu

**Phụ thuộc**: T1-08

**Phạm vi**: `/coaching/[slug]` (từ `services`), `/doanh-nghiep/[slug]` (từ `programs`, form B2B ở cuối), `/blog/[slug]` (từ `posts`, có CTA sản phẩm), `/tai-nguyen/[slug]` đã có ở T1-07. Mỗi trang: metadata từ CMS, Live Preview của Payload, trạng thái 404 tiếng Việt, `ctaLabel` từ CMS.

**Tiêu chí nghiệm thu**

- [ ] Sửa một service trong admin → Live Preview cập nhật ngay.
- [ ] Slug không tồn tại → trang 404 thương hiệu.

---

## T1-11 – Trang Growth Mirror

**Phụ thuộc**: T1-10

**Phạm vi**: `/coaching/growth-mirror` là trang Puck (dựng ở T1-16) dùng `PackageComparison` + `BookingCTA`. Kiểm tra: CTA **duy nhất** là "Đặt phiên trải nghiệm 149.000đ" (giá từ product), các gói **không có nút mua**. Dòng ghi chú "không hoàn tiền, phiên trải nghiệm giúp bạn thử trước khi chọn gói" lấy từ CMS và link tới `/gia-thanh-toan`. Sự kiện `package_viewed`, `booking_clicked`.

**Tiêu chí nghiệm thu**

- [ ] Tổng giá trị gạch ngang, giá bán, % ưu đãi khớp seed; đổi giá bán trong admin → % ưu đãi tự đổi.

---

## T1-12 – Thanh toán thủ công phiên trải nghiệm 149k **[REVIEW]**

**Phụ thuộc**: T1-06

**Phạm vi**

1. `src/lib/payments/`: interface `PaymentProvider` (`createPayment`, `verifyWebhook`, `parseWebhook`) + `ManualPaymentProvider` (GĐ 1). Không để logic luồng phụ thuộc provider cụ thể.
2. Form đặt phiên (tên, email, SĐT, nhu cầu ngắn) + ô tick bắt buộc "Tôi đã đọc và đồng ý với Điều khoản và Chính sách giá – thanh toán" (link trang 2 và 5) → tạo/tìm customer theo email (GAPS A10) → order `pending` với `paymentRef`, `termsAcceptedAt`, giá **đọc từ DB phía server** (không tin giá từ client).
3. Trang thanh toán `/thanh-toan/don/[orderId-hoặc-token]`: VietQR sinh phía server (GAPS B10) từ thông tin ngân hàng trong `siteSettings`, số tiền chính xác, nội dung = `paymentRef`; hướng dẫn chuyển khoản; trạng thái đơn.
4. Admin `orders`: nút "Xác nhận thủ công" và "Hủy đơn" **chỉ owner**, ghi `auditLogs`. Xác nhận → `paid` + `paidAt` → email gửi link đặt lịch (`bookingUrl` của service) + hướng dẫn → `deliveryStatus = email_sent`.
5. Cron (Vercel Cron) mỗi giờ: order `pending` > 24h → `failed`, gửi email nhắc nếu `consentMarketing`.
6. Chế độ sandbox cho preview (đánh dấu rõ "THỬ NGHIỆM – không chuyển tiền thật").
7. Test: tạo order với giá client gửi sai → server dùng giá DB; editor gọi API xác nhận → bị từ chối; xác nhận 2 lần → email chỉ gửi 1 lần.

**Tiêu chí nghiệm thu**

- [ ] Luồng đầy đủ trên preview: đặt phiên → QR → Hana xác nhận → khách nhận email có link đặt lịch.
- [ ] Không có nút hay field hoàn tiền.
- [ ] IT approve.

---

## T1-13 – Link thanh toán gói do Hana tạo **[REVIEW]**

**Phụ thuộc**: T1-12 · **Cần chốt trước**: GAPS Q4, Q6

**Phạm vi**

1. Trong admin, owner tạo order cho khách (chọn customer + gói) → hệ thống sinh `payToken` → hiện link `/thanh-toan/[payToken]` để Hana copy gửi khách. Áp `trialCreditApplies` nếu bật.
2. Khách mở link → xem tóm tắt gói, tick đồng ý điều khoản → VietQR → Hana xác nhận như T1-12.
3. Khi `paid`: service `grantEntitlementsForOrder(order)` (idempotent, dùng lại ở GĐ 2) cấp entitlement `source = package` cho mọi `grantsProduct` trong `components`; email xác nhận kèm thông tin workshop / coaching / cộng đồng lấy từ CMS.
4. Test idempotent: gọi grant 2 lần → không nhân đôi entitlement.

**Tiêu chí nghiệm thu**

- [ ] Hana tạo link, khách thanh toán (sandbox), Hana xác nhận → khách có 2 entitlement công cụ số.
- [ ] Link `payToken` đoán bừa → 404.
- [ ] IT approve.

---

## T1-14 – Quiz chẩn đoán `/habit/chan-doan`

**Phụ thuộc**: T1-06

**Phạm vi**: hiển thị câu từ `diagnosticQuestions` (thang 1–4, từng câu một, có thanh tiến độ, mobile-first); hàm thuần `scoreDiagnostic()` + quy tắc hòa theo GAPS B8, unit test; kết quả = giai đoạn kẹt nhất + gợi ý (rich text từ CMS) + CTA. Trước khi xem chi tiết kết quả: để lại email (tùy chọn, có consent) → lưu `diagnosticResults` + lead tag `diagnostic`. CTA kết quả cấu hình trong CMS; GĐ 1 mặc định trỏ tới phiên trải nghiệm. Sự kiện `diagnostic_completed` (không gửi câu trả lời chi tiết vào analytics).

**Tiêu chí nghiệm thu**

- [ ] Làm quiz trên điện thoại < 3 phút.
- [ ] Hana đổi nội dung gợi ý của 1 giai đoạn trong admin → kết quả đổi theo.

---

## T1-15 – Analytics, SEO, security headers, domain

**Phụ thuộc**: T1-05 · **Cần chốt trước**: GAPS Q10

**Phạm vi**: `src/lib/analytics/track.ts` (một helper, danh sách sự kiện mục 11 là union type; chặn ở tầng type các field nhạy cảm); provider GA4 hoặc Plausible theo quyết định, mã lấy từ `siteSettings`. Metadata + Open Graph từ CMS, `sitemap.xml`, `robots.txt` (chặn `/admin`, `/builder`, `/tai-khoan`, `/styleguide`). Security headers: CSP, HSTS, X-Frame-Options (trừ editor preview cần iframe), Referrer-Policy; cookie httpOnly + secure. Kết nối `tramdungcamxuc.com` trên Vercel, redirect `www` → apex. Ghi vào RUNBOOK.

**Tiêu chí nghiệm thu**

- [ ] securityheaders.com đạt A trở lên.
- [ ] Sự kiện `lead_submitted` hiện trong dashboard analytics.
- [ ] Domain thật chạy HTTPS.

---

## T1-16 – Dựng các trang seed từ mẫu **[HANA]**

**Phụ thuộc**: T1-04, T1-10, T1-11

**Phạm vi**: seed (vẫn `isSample` với text `[MẪU]` nếu chưa có copy thật) các trang Puck: trang chủ `/` theo 4 khối 8.1 (Hero 2 lối vào với đúng câu chữ trong 8.1 → Chọn nhu cầu → Bằng chứng → Chuyển đổi), `/ve-hana`, `/coaching`, `/coaching/growth-mirror`, `/doanh-nghiep`. Khi Hana gửi copy thật: thay vào và đổi `isSample = false` (làm cùng Hana, không tự viết copy).

**Tiêu chí nghiệm thu**

- [ ] 5 trang hiện đúng thứ tự khối, đẹp ở 375/1440.
- [ ] Hana mở từng trang trong editor và sửa được.

---

## T1-17 – QA tổng, E2E, Lighthouse, hướng dẫn CMS bản 1 **[HANA]**

**Phụ thuộc**: tất cả task GĐ 1

**Phạm vi**

1. Playwright cho các luồng GĐ 1: nhận tài nguyên miễn phí; gửi brief B2B; đặt phiên trải nghiệm → admin xác nhận; tạo link gói → thanh toán → entitlement; quiz chẩn đoán; dựng landing từ mẫu và xuất bản.
2. Lighthouse mobile trang chủ ≥ 90; sửa ảnh/font nếu thiếu.
3. Kiểm tra a11y cơ bản (axe) trên trang chủ, thư viện, quiz.
4. `docs/HUONG_DAN_CMS.md` bản 1: mọi thao tác trong bài kiểm tra cổng GĐ 1 + cách xác nhận đơn, xuất CSV lead, tạo link thanh toán gói. Có ảnh chụp.
5. Danh sách việc còn thiếu nội dung từ Hana (checklist "Trước Giai đoạn 1" trong file Planning) – báo trạng thái từng mục.

**Tiêu chí nghiệm thu (= cổng GĐ 1)**

- [ ] Toàn bộ E2E xanh trên CI.
- [ ] Hana làm bài kiểm tra cổng GĐ 1 không cần hỗ trợ.
- [ ] 6 trang pháp lý có nội dung thật, lead thật về và xuất được CSV.
