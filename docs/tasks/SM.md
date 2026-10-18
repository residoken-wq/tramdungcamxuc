# SM – Sitemap v2: task card

> **MỞ 17/10/2026** – câu hỏi đã chốt (`docs/DECISIONS.md` mục "Sitemap v2 – chốt 17/10/2026"). Áp dụng: `teamMembers` và `faqs` **làm luôn** (không còn có điều kiện); gói không bán trực tiếp; quiz nằm trong menu con Tài nguyên; trang Cộng đồng do Hana tự dựng bằng Puck (SM-08 chỉ làm mẫu trang); `qrSlug` thẻ EQ còn đổi được đến khi in.
> Phân tích đầy đủ: `docs/plan/SITEMAP_V2.md` (mục 2 = điểm mâu thuẫn **không được làm theo mockup**, mục 7 = quy tắc UI/UX chung).
> Mỗi task: đọc AGENTS.md → `GAPS_AND_QUESTIONS.md` → `DECISIONS.md` → `SITEMAP_V2.md` → card này. Task có giao diện: skill `tdcx-brand` trước.
> Mockup (PDF ngoài repo): Planning gửi ảnh chụp trang liên quan kèm prompt khi giao. **Không chép ảnh mockup vào repo.**

## Ranh giới file để chạy song song

| Task  | Vùng file chính                                                                                                                                          |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SM-01 | `src/collections/*`, `src/globals/*`, `src/migrations/*`, `src/payload-types.ts` (🔒 Migration)                                                          |
| SM-02 | `src/components/site/Navbar.tsx`, `Footer.tsx`, `next.config.*` (redirects), `src/lib/paths.ts` (mới), `src/app/sitemap.ts`, `/thu-vien` → `/tai-nguyen` |
| SM-03 | `src/puck/blocks/` (khối đợt A), `src/components/site/` tương ứng, `src/puck/migrations/`                                                                |
| SM-04 | `src/puck/blocks/` (khối đợt B), `src/components/site/` tương ứng, `src/puck/migrations/`                                                                |
| SM-05 | `src/app/(site)/(shell)/tai-nguyen/page.tsx`, `src/lib/library.ts`, khối `LeadMagnetCarousel`, `NewsletterForm`                                          |
| SM-06 | khối `ContactInfo`, `ContactForms`, route `/cau-hoi-thuong-gap`, `src/app/api/` form liên hệ                                                             |
| SM-07 | `src/puck/templates/`, `seed/`                                                                                                                           |

SM-03 và SM-04 cùng sửa `src/puck/config.tsx` và `src/puck/migrations/index` → mỗi task chỉ **thêm** dòng đăng ký khối của mình; Planning gộp khi merge.

---

## SM-00 – Hana chốt câu hỏi + gửi nội dung thật (Planning + Hana) [HANA]

Planning gửi Hana bảng Q1–Q13 và danh sách M1–M13 (bản dễ đọc, không thuật ngữ). Thu về: tên gói / sản phẩm, đường dẫn, số liệu có nguồn, testimonial có đồng ý, danh sách tổ chức được phép nêu tên + logo, đội ngũ (nếu có), ảnh chữ ký, email + hotline thật, nội dung 2 chương trình DN, ý tưởng trang Cộng đồng. Ghi quyết định vào `DECISIONS.md`, cập nhật AGENTS.md 8.1.

## SM-01 – CMS schema cho sitemap v2 (Laptop, 🔒 Migration) – ước lượng 6–8 h – prompt `prompts/SM-01.md`

Theo `SITEMAP_V2.md` mục 5:

- `navigation`: `children[]` 2 cấp (nhóm con + mục con có mô tả ngắn); migration giữ menu hiện có.
- `products`: `tagline`, `icon` (select bộ icon brand), `topic`, `audienceSegment`.
- `services`: `image`, `audienceLabel`, `badge`.
- `testimonials`: `age?`, `headline?`, nhóm `story` {before, insight?, after}. Giữ quy tắc `consent`.
- `siteSettings`: `hotline`, `officeAddress`, `facebookUrl`, `youtubeUrl`, `bookingCallUrl?`, `founderSignature`, `quizCtaPath`, danh sách lựa chọn "Tình trạng hiện tại".
- `leads`: `currentStatus`, `interestedService`, `interestedPackage`, `contactRole`, `interestedProgram`.
- Collection mới: `faqs`, `teamMembers` (chốt 17/10).

Tiêu chí nghiệm thu:

- [ ] Migration chạy trên bản sao DB demo không mất dữ liệu (menu, sản phẩm, testimonial, lead cũ còn nguyên).
- [ ] Mọi field mới có nhãn + mô tả tiếng Việt; ảnh bắt buộc `alt`; `icon` là select, không có ô nhập tự do.
- [ ] Phân quyền: `editor` sửa nội dung mới, không sửa cài đặt thanh toán; dữ liệu lead mới không vào analytics.
- [ ] Gỡ 2 mục BACKLOG (`products.topic`, CTA quiz trong CMS) khi xong.
- [ ] `pnpm lint && pnpm typecheck && pnpm test`.

## SM-02 – Menu con, đường dẫn mới, chuyển hướng 301 (PC nhà, sau SM-01, 🔒 Migration) – ước lượng 6–8 h – prompt `prompts/SM-02.md`

- `Navbar`: mục có `children` mở menu con (desktop: panel 2 nhóm như PDF tr. 1, mở bằng hover + click + bàn phím, Esc đóng, `aria-expanded`); mobile: accordion, quiz nằm đúng chỗ Hana chốt ở Q5.
- Gom mọi đường dẫn cố định vào `src/lib/paths.ts` (thay `GROWTH_MIRROR_PATH` rải rác: `products.ts`, `diagnostic.server.ts`, `TrackerSummaryCard.tsx`, email…).
- Đường dẫn + 301 theo `SITEMAP_V2.md` mục 6: `/ve-hana → /ve-tram`, `/coaching/growth-mirror → /lo-trinh-chuyen-minh`, `/thu-vien → /tai-nguyen` (giữ query `tab`, `topic`). Script đổi slug trang Puck có sẵn, **không ghi đè** nội dung trang.
- `sitemap.xml`, canonical, link footer cập nhật.
- Seed menu mới (chỉ khi menu đang là bản seed cũ; không đè menu Hana đã sửa).

Tiêu chí nghiệm thu:

- [ ] 375px và 1440px: mở được mọi mục con; Tab/Enter/Esc chạy; axe 0 lỗi.
- [ ] Mọi link cũ trả 301 tới link mới; không còn link nội bộ trỏ đường dẫn cũ (grep + e2e crawl).
- [ ] `/eq-buddy/the/[qrSlug]` không đổi.
- [ ] e2e cũ về menu / đường dẫn đã cập nhật, xanh.

## SM-03 – Khối Puck đợt A: trang chủ + trang lộ trình (Laptop, sau SM-02 merge) – ước lượng 12–16 h – prompt `prompts/SM-03.md`

Mới: `IconCardGrid`, `Callout`, `PackageCards`, `SolutionEcosystem`, `CTASection`.
Nâng cấp (tăng `version` + migration): `HeroTwoEntries` v2, `HeroImage` v2, `QuoteBlock` (nền tối), `StatsBar` v2, `FAQ` v2, `PackageComparison` v2, `TestimonialGrid` v2 (kiểu "trước/sau").

Bắt buộc theo `SITEMAP_V2.md`:

- M2: nút trên `PackageCards` / `PackageComparison` dẫn tới đặt phiên trải nghiệm, truyền gói quan tâm (`?goi=<slug>`), không có checkout gói (trừ khi Q3 đổi).
- `PackageComparison` v2: chọn 1 gói nổi bật + nhãn (mặc định "Khuyên dùng"); bảng mobile không vỡ.
- `SolutionEcosystem`: nút mỗi sản phẩm theo logic `saleStatus` (T1-08), không tự nghĩ CTA.
- Khối dữ liệu chỉ lưu ID; thiếu dữ liệu thật → không render trên trang công khai.

Tiêu chí nghiệm thu:

- [ ] Snapshot render mỗi khối mới / mỗi kiểu mới; test migration v1 → v2 trên `puckData` của 5 trang seed.
- [ ] Mỗi khối có mặt trên `/styleguide`; đúng brand ở 375px / 768px / 1440px.
- [ ] Field màu chỉ 8 màu brand, khoảng cách S/M/L, nhãn editor tiếng Việt.
- [ ] Không còn emoji làm icon (M11); không có kính mờ trên ảnh (M12).

## SM-04 – Khối Puck đợt B: Về Trạm + Coach 1:1 (sau SM-01, song song SM-03) – ước lượng 10–12 h

Mới: `VisionMission`, `ServiceCards` (📦 `services`), `TwoPathCards`, `TeamGrid` (📦 `teamMembers`).
Nâng cấp: `JourneySteps` v2 (3 kiểu: vòng tròn / card nối nét đứt / danh sách dọc; bước nổi bật; dòng phụ), `HanaStory` v2 (nền tối, chip, kiểu "thư" + ảnh chữ ký từ `siteSettings.founderSignature`), `ImageText` v2 (quote + nhãn ảnh), `LogoStrip` v2 (nhóm logo), (`TestimonialGrid` kiểu "3 giai đoạn" đã chuyển sang SM-03 – SM-04 chỉ dùng lại), form đặt phiên trải nghiệm thêm "Lộ trình quan tâm" + "Bạn đang trăn trở điều gì" (vẫn tạo đơn 149.000đ, không đổi logic thanh toán – nếu phải chạm `src/lib/payments` thì dừng và hỏi, `REVIEW-REQUIRED`).

Tiêu chí nghiệm thu: như SM-03.

## SM-05 – Trang Tài nguyên + newsletter (sau SM-02) – ước lượng 8 h

- `/tai-nguyen` (thay `/thu-vien`): khối đầu là `LeadMagnetCarousel` (sản phẩm `saleStatus = free`, form gửi link tải qua T1-07); khu bài viết: ô tìm kiếm, chip chủ đề (Tất cả / Tài liệu / Thói quen / Cảm xúc / Sự nghiệp), 1 bài nổi bật + lưới; thời gian đọc tính từ nội dung; bộ lọc trên URL như cũ (sự kiện `library_filtered`).
- `posts`: thêm `featured` (nếu SM-01 chưa làm thì làm ở đây, xin 🔒 Migration).
- `NewsletterForm`: lưu `leads` (`need = resource`, tag `newsletter`, consent + `consentAt`), honeypot + rate limit + Turnstile, Zod. Không gửi bản tin (BACKLOG).
- Trạng thái rỗng / đang tải / lỗi cho cả carousel và danh sách bài.

## SM-06 – Trang Liên hệ + FAQ dùng chung (sau SM-01) – ước lượng 6–8 h

- `ContactInfo`: đọc `siteSettings` (email, hotline/Zalo, địa điểm, LinkedIn, Facebook, YouTube); mục trống thì ẩn.
- `ContactForms`: 2 kiểu (tab trên trang chủ, 2 cột trên Liên hệ). B2C: họ tên, email, SĐT, dịch vụ quan tâm (từ `services`), trăn trở. B2B: dùng lại `B2BBriefForm` + vai trò, chương trình quan tâm (từ `programs`). Email xác nhận cho khách + thông báo cho Hana (hạ tầng T1-06).
- Route `/cau-hoi-thuong-gap` đọc `faqs` theo nhóm; `FAQ` v2 thêm chế độ "lấy theo nhóm" (chỉ lưu nhóm, không chép câu hỏi) + link "Xem toàn bộ".
- M1: **không** seed câu hỏi về hoàn tiền / Visa. FAQ seed đánh dấu `[MẪU]`, nội dung do Hana viết.

## SM-07 – Mẫu trang + dựng trang MẪU (sau SM-03, SM-04, SM-06) [HANA] – ước lượng 6 h

- Mẫu mới trong `src/puck/templates/`: "Trang chủ v2", "Trang lộ trình", "Trang Về Trạm", "Trang Coach 1:1", "Trang Liên hệ" – đúng thứ tự section `SITEMAP_V2.md` mục 3.
- Seed: chỉ **tạo mới** trang còn thiếu (`/lien-he`, `/san-pham`…) ở trạng thái nháp; trang đã có (trang chủ, Về Trạm, Coach, Lộ trình, Doanh nghiệp) → tạo **bản nháp mới** từ mẫu để Hana so sánh rồi tự xuất bản, không đè bản đã xuất bản.
- Chữ chưa có → `[MẪU] …`; không chép chữ trong mockup vào seed nếu thuộc M1–M13.
- Planning + Hana nhập nội dung thật, xuất bản.

## SM-08 – Cộng đồng, trang DN, QA tổng, hướng dẫn CMS (Planning + agent) [HANA]

- Trang Cộng đồng (theo Q10), 2 trang chương trình DN (nội dung Q7) – dựng bằng khối có sẵn, không khối mới nếu không cần.
- QA: e2e crawl không 404, axe 0 lỗi, Lighthouse mobile trang chủ ≥ 90, kiểm 375px mọi trang mới.
- `docs/HUONG_DAN_CMS.md`: menu con, khối mới, FAQ, thông tin liên hệ, đổi tên gói.
- Biên bản cổng Sitemap v2 (`SITEMAP_V2.md` mục 9).
