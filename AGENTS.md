# AGENTS.md – Hệ sinh thái số Trạm Dừng Cảm Xúc

> File hướng dẫn cho Codex. Đặt ở thư mục gốc repo. Codex đọc toàn bộ file này trước mỗi task.
> Chủ dự án: Hana Lương (không biết code). Người review kỹ thuật: anh IT hỗ trợ.
>
> **Khi có xung đột giữa các skill thiết kế, `tdcx-brand` và Brand Book 2026 luôn thắng.** Mọi việc UI phải dùng skill `tdcx-brand` (`.agents/skills/tdcx-brand/`, `.claude/skills/tdcx-brand/`).

---

## 1. Vai trò của bạn

Bạn là kỹ sư full-stack duy nhất của dự án. Bạn code **tất cả sản phẩm số** của Trạm Dừng Cảm Xúc trên **một codebase duy nhất**:

| Web                     | Đường dẫn   | Mục đích                                                                                                |
| ----------------------- | ----------- | ------------------------------------------------------------------------------------------------------- |
| Web 1 – Landing Page    | `/`         | Cửa vào, điều hướng, thu lead, phiên trải nghiệm + 3 gói Growth Mirror, B2B                             |
| Web 2 – Habit Formation | `/habit`    | Chẩn đoán, Habit Loop 5 phút, Habit Tracker số (dùng thử 21 ngày, sau đó 250.000đ / ưu đãi 178.000đ)    |
| Web 3 – EQ Buddy        | `/eq-buddy` | EQ Buddy số 26 thẻ (dùng thử 21 ngày, sau đó 250.000đ / ưu đãi 178.000đ), link Shopee cho bộ thẻ vật lý |
| CMS                     | `/admin`    | Hana tự quản toàn bộ nội dung, sản phẩm, lead, đơn hàng; dựng trang bằng kéo thả (mục 5B)               |

Mục tiêu tối thượng: **Hana tự sửa được mọi nội dung thay đổi thường xuyên mà không cần đụng vào code.**

### Thông tin đã chốt (cập nhật 03/10)

| Mục               | Quyết định                                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Tên miền          | `tramdungcamxuc.com` – một domain, ba đường dẫn `/`, `/habit`, `/eq-buddy`                                                                    |
| Tên thương hiệu   | `TRAM DUNG CAM XUC` (không dấu) cho domain, nội dung chuyển khoản, sender email, mã đơn. Giao diện luôn hiển thị **Trạm Dừng Cảm Xúc** có dấu |
| Giá               | Tất cả là giá tạm, chưa final → **mọi giá phải sửa được trong CMS**, không hardcode ở đâu                                                     |
| Công cụ số        | Habit Tracker số và EQ Buddy số: mở tự do 21 ngày dùng thử, sau đó bán 250.000đ, giá ưu đãi 178.000đ                                          |
| Bộ thẻ vật lý     | Bán trên gian hàng Shopee của Hana. Web **chỉ đặt nút dẫn link** (có UTM), không xây giỏ hàng, không xử lý giao vận                           |
| Hoàn tiền         | **Không có chính sách hoàn tiền.** Thay vào đó là phiên trải nghiệm Growth Mirror 149.000đ; sau phiên này khách chọn 1 trong 3 gói            |
| Danh mục sản phẩm | Nguồn chuẩn là file `Growth_Mirror_Pricing_Calculator.xlsx` (seed vào CMS)                                                                    |
| Chỉnh trang       | Kéo thả trực quan kiểu Elementor bằng Puck, nhúng trong admin (mục 5B)                                                                        |

### Ba gói Growth Mirror (seed, giá tạm)

| Cấu phần                                             | Giá trị đơn vị                       | CLEAR      | BUILD      | SHINE       |
| ---------------------------------------------------- | ------------------------------------ | ---------- | ---------- | ----------- |
| Bộ công cụ số Habit Tracker + EQ Buddy               | 250.000đ × 2                         | Có         | Có         | Có          |
| Workshop "Tập thương cảm xúc"                        | 500.000đ/buổi                        | 2 buổi     | 2 buổi     | 2 buổi      |
| Coaching 1:1 "Vững vàng chuyển mình"                 | 1.000.000đ/phiên (giá lẻ 2.200.000đ) | 1          | 3          | 6           |
| Tư vấn hướng nghiệp                                  | 1.000.000đ/phiên (giá lẻ 1.500.000đ) | Không      | 1          | 3           |
| Cộng đồng private "Tập thương cảm xúc" + webinar quý | 300.000đ                             | Không      | Có         | Có          |
| Tổng giá trị                                         |                                      | 2.500.000đ | 5.800.000đ | 10.800.000đ |
| Giá bán                                              |                                      | 1.750.000đ | 2.900.000đ | 4.320.000đ  |
| % ưu đãi                                             |                                      | 30%        | 50%        | 60%         |

Tổng giá trị và % ưu đãi được **tính tự động** từ cấu phần và giá bán, không nhập tay.

### Câu hỏi còn mở – không tự quyết, giữ cấu hình được trong CMS

- Mua sau 21 ngày dùng thử là vĩnh viễn hay theo kỳ → làm `accessDurationDays` (rỗng = vĩnh viễn).
- 178.000đ là giá cố định hay có hạn → `salePrice` + `saleEndsAt` tùy chọn.
- Phí trải nghiệm 149.000đ có trừ vào giá gói không → cờ `trialCreditApplies` trong siteSettings, mặc định tắt.
- Thinking Mirror và chương trình B2B chưa có trong file pricing → vẫn dựng, mặc định `saleStatus = consult`, Hana có thể ẩn.

---

## 2. Nguyên tắc làm việc (bắt buộc)

1. **Chỉ làm đúng task được giao.** Không tự thêm tính năng, không đổi stack, không refactor ngoài phạm vi. Ý tưởng mới → ghi vào `docs/BACKLOG.md`.
2. **Hỏi trước khi đoán.** Khi spec thiếu hoặc mâu thuẫn, dừng lại và liệt kê câu hỏi. Không bịa nội dung, giá, số liệu, testimonial.
3. **Nội dung nằm trong CMS, không nằm trong code.** Không hardcode copy, giá, ảnh, thẻ, testimonial. Chỉ nhãn UI cố định (nút "Gửi", "Đăng nhập"…) được nằm trong code, gom vào `src/lib/i18n/vi.ts`.
4. **Commit nhỏ, mỗi commit một việc**, message tiếng Anh dạng `feat(habit): add 21-day tracker grid`.
5. **Không bao giờ commit secret.** Mọi khóa nằm trong `.env`, cập nhật `.env.example` khi thêm biến mới.
6. **Mỗi task kết thúc bằng báo cáo** theo mẫu ở mục 13.
7. **Ngôn ngữ giao diện: tiếng Việt có dấu.** Code, tên biến, comment: tiếng Anh.
8. **Code do AI viết phải được người review** ở các phần: đăng nhập, phân quyền, webhook thanh toán, mở khóa nội dung trả phí. Đánh dấu `// REVIEW-REQUIRED:` ở các chỗ này.

---

## 3. Tài liệu tham chiếu

| Tài liệu                                | Dùng để                                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------------------ |
| Brand Book 2026 (7 trang)               | Màu, font, layout, khoảng thở, UI principles, mẫu website                                  |
| Who & What (website brief)              | Nhóm khách hàng, rổ sản phẩm, 5 luồng người dùng, mô hình dữ liệu                          |
| Web Description (slide)                 | Cấu trúc 3 web, thứ tự build                                                               |
| Bio & How to work with me               | Copy chuyên môn, dịch vụ, testimonial mẫu                                                  |
| File Excel Habit Hack                   | Nội dung 20 video, 11 kỹ thuật, 4 bước Habit Loop, tracker 21 ngày, 16 tình huống trì hoãn |
| Planning chuyển đổi sản phẩm số (mục 2) | Danh mục sản phẩm, spec, lộ trình, cổng giai đoạn                                          |
| Cập nhật thông tin từ Hana 03/10        | Domain, trial 21 ngày, Shopee, không hoàn tiền                                             |
| Growth_Mirror_Pricing_Calculator.xlsx   | 3 gói Growth Mirror, cấu phần, giá trị, giá bán                                            |

Asset gốc (logo PNG nền trong, ảnh chân dung) do Hana cung cấp trong `public/brand/`. **Không cắt ảnh từ infographic.**

---

## 4. Tech stack

| Lớp               | Lựa chọn                                                                       | Lý do                                                                                         |
| ----------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Framework         | Next.js (App Router) + TypeScript strict                                       | Một app cho cả 3 web + CMS                                                                    |
| CMS               | Payload CMS 3 (chạy trong cùng app Next.js, admin tại `/admin`) + Live Preview | Giao diện quản trị sẵn có, collection tùy biến, phân quyền, upload media, xem trước trực tiếp |
| Trình dựng trang  | Puck (`@puckeditor/core`, MIT) nhúng trong admin                               | Kéo thả kiểu Elementor bằng chính component brand, dữ liệu thuộc về dự án                     |
| Database          | PostgreSQL (Neon hoặc Supabase) qua adapter Postgres của Payload               | Một DB cho nội dung, user, đơn hàng                                                           |
| Styling           | Tailwind CSS + design tokens ở mục 5                                           | Nhất quán brand                                                                               |
| Media             | S3-compatible storage (Cloudflare R2) qua plugin storage của Payload           | Ảnh, PDF ebook                                                                                |
| Video trả phí     | Bunny Stream hoặc Cloudflare Stream, link ký có thời hạn                       | Không lộ video cho người chưa mua. Không dùng YouTube unlisted                                |
| Email             | Resend + React Email                                                           | Giao sản phẩm, xác nhận, nhắc lịch                                                            |
| Thanh toán        | Chuyển khoản VietQR có webhook xác nhận (payOS hoặc SePay – chốt ở GĐ 2)       | Phù hợp khách Việt Nam                                                                        |
| Đặt lịch coaching | Nhúng link đặt lịch (Cal.com hoặc Google Calendar booking)                     | Không tự build lịch                                                                           |
| Analytics         | GA4 hoặc Plausible + sự kiện tùy chỉnh                                         | Đo chuyển đổi                                                                                 |
| Deploy            | Vercel (app) + DB managed                                                      | Preview mỗi PR, rollback 1 click                                                              |
| Test              | Vitest (logic) + Playwright (luồng chính)                                      |                                                                                               |

Luôn dùng bản stable mới nhất và **đọc docs chính thức trước khi dùng API** của Payload, Next.js, cổng thanh toán. Không dựa vào trí nhớ về API.

---

## 5. Design system (từ Brand Book 2026)

### Màu (khai báo trong `tailwind.config.ts` và CSS variables)

| Token            | Hex       | Dùng cho                         |
| ---------------- | --------- | -------------------------------- |
| `deep-navy`      | `#280A60` | Tiêu đề chính, text đậm, nền tối |
| `bright-magenta` | `#BC039E` | Tiêu đề tầng 2, điểm nhấn        |
| `accent-pink`    | `#EF3B83` | Nút CTA chính, trái tim, link    |
| `soft-pink`      | `#FDE6F6` | Nền card, badge                  |
| `lavender-mist`  | `#E9DDF9` | Nền section, card phụ            |
| `mint-haze`      | `#D9F1EA` | Trạng thái thành công, tracker   |
| `butter-cream`   | `#F6E9B8` | Highlight, nhắc nhở              |
| `warm-ivory`     | `#FAF7F4` | Nền trang                        |

Nền gradient pastel tím – hồng – be – trắng, nhẹ. Không dùng màu ngoài bảng.

### Font (Google Fonts)

| Vai trò                           | Font                                  |
| --------------------------------- | ------------------------------------- |
| Tiêu đề lớn (H1, H2)              | Anton                                 |
| Nhãn series, tiêu đề phụ, nút, UI | Montserrat SemiBold / Bold            |
| Câu quote, dòng cảm xúc           | Playfair Display Italic               |
| Đoạn văn                          | Montserrat Regular hoặc Inter Regular |

Tất cả phải có subset `vietnamese`. Kiểm tra dấu tiếng Việt hiển thị đúng với Anton.

### Quy tắc layout

- Tiêu đề 2 tầng màu: dòng 1 `deep-navy`, dòng 2 `bright-magenta`.
- Khoảng thở: header → tiêu đề 16–24px; tiêu đề → dòng cảm xúc 12–16px; dòng cảm xúc → hình 24–32px; lề ngoài tối thiểu 24px.
- Bo góc card lớn (16–24px), viền mảnh, bóng rất nhẹ.
- Visual assets: nét trái tim, đường kẻ mảnh, biểu tượng van, bướm, họa tiết lá. Dùng SVG trong `src/components/brand/`.
- Logo: không đổi màu, không xoay, không méo; kích thước tối thiểu 120px chiều ngang.
- UI principles: Clarity, Warmth, Whitespace, Emotional Trust.
- Mobile-first. Mọi trang phải đẹp ở 375px.
- Ảnh chia sẻ mạng xã hội: 1080×1350 (4:5) và 1080×1920 (9:16).

### Component dùng chung (`src/components/ui/`)

`Button`, `Card`, `SectionHeader` (series label + tiêu đề 2 tầng + dòng cảm xúc), `QuoteBlock`, `ProductCard`, `TestimonialCard`, `LeadForm`, `PriceTag`, `StatusBadge`, `EmotionPicker`, `ProgressGrid`, `Modal`, `Toast`, `Navbar`, `Footer`.

---

## 5B. Trình dựng trang kéo thả (Page Builder – trải nghiệm kiểu Elementor)

Hana không biết code và quen kiểu chỉnh trang trực quan như Elementor. **Elementor là plugin riêng của WordPress, không gắn được vào Next.js/Payload**, nên dự án dùng **Puck** – trình dựng trang kéo thả mã nguồn mở (MIT) cho React – nhúng vào admin. Hana kéo thả các khối, sửa chữ ngay trên trang, xem trước desktop/mobile, rồi bấm Xuất bản.

Package hiện tại: `@puckeditor/core` (tên cũ `@measured/puck`). Đọc docs chính thức tại puckeditor.com trước khi code, không dựa vào trí nhớ.

### Phân vai: cái gì kéo thả, cái gì nhập form

| Loại nội dung                                                                                                   | Cách sửa                              | Lý do                                                                                         |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| Trang chủ, Về Hana, Coaching, Growth Mirror, Doanh nghiệp, Thư viện (phần giới thiệu), landing chiến dịch mới   | **Kéo thả bằng Puck**                 | Bố cục thay đổi theo chiến dịch, cần trực quan                                                |
| Sản phẩm, gói, dịch vụ, 26 thẻ EQ, bài học, video, kỹ thuật, câu hỏi quiz, testimonial, bài viết, trang pháp lý | **Form trong Payload** + Live Preview | Dữ liệu có cấu trúc, dùng lại ở nhiều nơi; kéo thả sẽ làm hỏng logic bán hàng, quyền truy cập |
| Trang học, tracker, luồng rút thẻ, checkout, tài khoản                                                          | **Không chỉnh được**                  | Là ứng dụng, chỉ Codex sửa                                                                    |

Khối kéo thả **lấy dữ liệu từ Payload** chứ không chép lại: khối "Lưới sản phẩm" chọn sản phẩm từ collection `products`; sửa giá ở sản phẩm thì mọi trang tự cập nhật.

### Thư viện khối (`src/puck/blocks/`, nhóm theo danh mục trong sidebar)

| Danh mục   | Khối                                                                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mở đầu     | `HeroTwoEntries` (2 lối vào Cá nhân / Doanh nghiệp), `HeroImage`, `SectionHeader` (series label + tiêu đề 2 tầng + dòng cảm xúc)                                               |
| Nội dung   | `RichText`, `ImageText` (ảnh trái/phải), `QuoteBlock`, `StatsBar` (10+ năm, ICF ACC, 500+ giờ…), `JourneySteps` (Pause → Feel → Name → Choose → Practice), `FAQ`, `VideoEmbed` |
| Bố cục     | `Columns` (2/3 cột, có vùng thả lồng nhau), `Spacer` (chỉ các mức 16/24/32/48/64), `Divider` (đường kẻ mảnh / nét trái tim)                                                    |
| Bán hàng   | `ProductGrid`, `ProductFeature`, `PackageComparison` (3 gói Growth Mirror), `PriceTag`, `TrialCTA` (dùng thử 21 ngày)                                                          |
| Niềm tin   | `TestimonialSlider`, `TestimonialGrid`, `LogoStrip`, `HanaStory`                                                                                                               |
| Chuyển đổi | `CTAButton`, `LeadForm` (chọn tài nguyên giao qua email), `BookingCTA` (phiên trải nghiệm 149.000đ), `B2BBriefForm`, `QuizCTA`, `ShopeeButton`, `ZaloButton`, `LibraryPreview` |

### Giữ brand an toàn (bắt buộc)

- Field màu là **dropdown chỉ gồm 8 màu brand book**; không có color picker tự do. Font cố định theo vai trò, Hana không chọn font.
- Khoảng cách, bo góc, cỡ chữ là các mức có sẵn (S / M / L), không nhập số tự do.
- Mỗi khối render bằng đúng component trong `src/components/` → trang kéo thả và trang code trông giống hệt nhau.
- Ảnh bắt buộc có `alt`; ảnh tải lên đi qua collection `media` của Payload, tự tối ưu.
- Dùng permissions API của Puck để khóa: không xóa được khối `HeroTwoEntries` và footer pháp lý trên trang chủ.

### Trải nghiệm cho Hana

- Mở từ Payload: danh sách `pages` → nút **"Chỉnh sửa trực quan"** → editor Puck toàn màn hình tại `/admin/builder/[pageId]`, chỉ user Payload đã đăng nhập mới vào được.
- Xem trước 3 kích thước: điện thoại 375px, máy tính bảng 768px, máy tính 1440px.
- Nút **Lưu nháp** và **Xuất bản** tách riêng; trang công khai chỉ đọc bản đã xuất bản. Có lịch sử phiên bản (dùng Payload versions) và nút khôi phục bản trước.
- Hoàn tác / làm lại, nhân bản khối, nhân bản cả trang.
- **Mẫu trang có sẵn** khi tạo trang mới: "Landing chiến dịch", "Trang dịch vụ", "Trang workshop", "Trang sự kiện". Mỗi mẫu là một JSON trong `src/puck/templates/`.
- Toàn bộ nhãn trong editor bằng tiếng Việt (tên khối, tên field, nút).
- Tự lưu nháp mỗi 30 giây; cảnh báo khi rời trang chưa lưu.

### Kỹ thuật

- Dữ liệu trang lưu dạng JSON trong field `puckData` của collection `pages`; render phía công khai bằng `<Render>` của Puck (server component khi được), có cache và revalidate khi xuất bản.
- Mỗi khối có `version`; khi đổi props của khối phải viết migration dữ liệu (Puck có API data migration). Không được làm hỏng trang Hana đã dựng.
- Khối lấy dữ liệu Payload dùng external field / `resolveData`, chỉ lưu ID, không lưu bản sao giá hay tên.
- Test: snapshot render mỗi khối + Playwright kịch bản "kéo khối Hero vào trang trống, sửa tiêu đề, xuất bản, trang công khai hiện đúng".

---

## 6. Cấu trúc repo

```
/
├─ AGENTS.md
├─ docs/
│  ├─ HUONG_DAN_CMS.md        # hướng dẫn Hana dùng CMS, tiếng Việt, có ảnh chụp
│  ├─ BACKLOG.md
│  ├─ DECISIONS.md            # ghi lại mọi quyết định kỹ thuật đã chốt
│  └─ RUNBOOK.md              # deploy, backup, rollback, xử lý sự cố
├─ public/brand/
├─ src/
│  ├─ app/
│  │  ├─ (site)/              # Web 1: /, /ve-hana, /coaching, /doanh-nghiep, /tai-nguyen, /blog
│  │  ├─ (habit)/habit/       # Web 2
│  │  ├─ (eq)/eq-buddy/       # Web 3
│  │  ├─ (account)/tai-khoan/ # đăng nhập, khóa học của tôi, đơn hàng
│  │  ├─ (payload)/admin/     # CMS
│  │  ├─ (builder)/admin/builder/[pageId]/  # editor Puck
│  │  ├─ (site)/[...slug]/    # render trang dựng bằng Puck
│  │  └─ api/                 # webhooks, lead, payment
│  ├─ collections/            # Payload collections
│  ├─ puck/{config.ts,blocks/,templates/,migrations/}  # cấu hình và khối kéo thả
│  ├─ globals/                # Payload globals (cài đặt site, trang chủ)
│  ├─ components/{ui,brand,site,habit,eq}/
│  ├─ lib/{payments,email,video,analytics,auth,i18n}/
│  └─ emails/                 # template React Email
├─ tests/{unit,e2e}/
└─ seed/                      # dữ liệu mẫu, đánh dấu rõ là MẪU
```

---

## 7. Mô hình dữ liệu (Payload collections)

Mọi collection có `createdAt`, `updatedAt`. Collection nội dung có `status` (`draft` / `published`) và hỗ trợ xem trước.

### Nội dung

**products** – mọi thứ có thể bán hoặc tặng
`name`, `slug`, `web` (site / habit / eq), `type` (ebook / toolkit / digital_tool / physical_external / workshop / community / coaching_trial / package / b2b), `journeyStep` (pause / feel / name / choose / practice), `audience[]`, `painPoint`, `outcome`, `shortDescription`, `description` (rich text), `includes[]`, `preview` (media), `price`, `salePrice`, `coverImage`, `files[]` (PDF, chỉ giao sau khi mua/đăng ký), `ctaLabel`, `ctaType` (buy / download / book / contact / external), `faq[]` {question, answer}, `saleStatus` (coming_soon / on_sale / free / consult / hidden), `relatedProducts[]`, `order`,
`trialDays` (0 = không dùng thử; Habit Tracker và EQ Buddy = 21), `accessDurationDays` (rỗng = vĩnh viễn), `saleEndsAt?`,
`externalUrl` + `externalLabel` (VD: link Shopee; khi có thì CTA mở link ngoài, không vào checkout),
`components[]` {label, quantity, unitValue, retailPrice?, grantsProduct?} – dùng cho gói; `totalValue` và `discountPercent` là trường tính tự động, chỉ đọc.

**services** – coaching 1:1
`name` (Growth Mirror, Thinking Mirror…), `slug`, `audience`, `situations[]`, `outcomes[]`, `process[]`, `duration`, `format`, `priceMode` (fixed / quote), `price`, `bookingUrl`, `testimonials[]`, `ctaLabel`.

**programs** – chương trình doanh nghiệp
`name`, `slug`, `targetBehaviors[]`, `learnerGroup`, `format`, `duration`, `deliverables[]`, `followUp`, `measurement`, `caseStudies[]`, `ctaLabel`.

**posts** – bài viết / video
`title`, `slug`, `series` (Đọc sách cùng bạn…), `topic` (eq / habit / career), `format` (article / video), `thumbnail`, `videoUrl`, `content`, `ctaProduct`, `leadMagnet`.

**testimonials**
`name`, `role` (chỉ hiện khi `consent` = true), `quote`, `relatedOffer`, `language` (vi / en), `consent` (bắt buộc true mới được hiển thị), `photo`.

**eqCards** – 26 thẻ EQ Buddy
`code` (VD: `TDCX-01`), `message`, `story` (rich text), `reflectionPrompt`, `smallAction`, `topic`, `emotionTags[]`, `relatedProduct`, `image`, `shareImage45`, `shareImage916` (tự sinh nếu trống), `qrSlug`, `order`.

**courseModules / lessons** – nội dung khóa Habit Hack
`courseModules`: `title`, `group` (insight / principle / technique), `order`.
`lessons`: `module`, `title`, `summary`, `videoId` (Bunny/Cloudflare), `durationSec`, `stage` (cue / craving / response / reward / none), `downloadables[]`, `order`, `isFreePreview`.

**diagnosticQuestions** – quiz chẩn đoán
`statement`, `stage` (cue / craving / response / reward), `suggestion` (rich text), `order`. Seed từ 16 tình huống trong sheet "Khảo sát trì hoãn".

**techniques** – 11 kỹ thuật
`name`, `stage`, `howTo`, `example`, `lesson` (liên kết video).

### Globals

**siteSettings**: logo, tagline, email liên hệ, LinkedIn, Zalo group link, mã analytics, thông tin chuyển khoản hiển thị.
**pages** – trang dựng bằng kéo thả: `title`, `slug` (`/` = trang chủ), `puckData` (JSON), `template`, `seo` {title, description, ogImage}, `status` (draft / published), bật versions + autosave. Seed sẵn: trang chủ, Về Hana, Coaching, Growth Mirror, Doanh nghiệp, dựng từ mẫu theo đúng thứ tự khối ở mục 8.1. (Global `homePage` cũ bỏ, thay bằng trang slug `/`.)

**navigation** (global): menu chính và footer, Hana kéo thả để sắp xếp mục, chọn trang đích từ `pages`.

### Người dùng và giao dịch

**siteSettings** bổ sung: `brandAscii` = `TRAM DUNG CAM XUC`, `domain`, `shopeeStoreUrl`, `trialCreditApplies` (mặc định false), thông tin chuyển khoản VietQR, `zaloChatUrl`, `showFloatingChat` (bật/tắt), `certificateMinDays` (mặc định 15), `sellerInfo` {tên người bán hoặc hộ kinh doanh, mã số thuế?, địa chỉ, điện thoại, email}.

**legalPages** – 6 trang pháp lý: `title`, `slug`, `content` (rich text), `lastUpdated`, `order`. Seed sẵn 6 bản ghi rỗng có tiêu đề (mục 8.1), nội dung do Hana soạn. Footer tự liệt kê theo `order`.

**certificates** – `customer`, `plan` (habitPlans), `identityStatement`, `daysCompleted`, `issuedAt`, `code` (mã ngắn duy nhất, dùng cho link xác minh công khai `/chung-nhan/[code]`), `image45`, `image916`.

**users** (admin) – Hana và người hỗ trợ. Vai trò: `owner`, `editor`.
**customers** – học viên/người mua. `email`, `name`, `phone?`, `consentMarketing`, `consentAt`, `entitlements[]`. Đăng nhập bằng email + mã OTP 6 số (hết hạn 10 phút), không mật khẩu.
**entitlements** – quyền truy cập: `customer`, `product`, `grantedAt`, `source` (trial / order / package / manual / gift), `status` (trial / active / expired), `expiresAt?`. Mỗi customer chỉ được dùng thử mỗi công cụ **một lần** (duy nhất theo customer + product + source=trial). Mua gói Growth Mirror tự cấp entitlement cho các `grantsProduct` trong `components`.
**orders** – `customer`, `items[]` {product, price}, `subtotal`, `discountCode?`, `total`, `paymentRef` (mã nội dung chuyển khoản, duy nhất), `paymentStatus` (pending / paid / failed / cancelled), `deliveryStatus` (none / access_granted / email_sent / scheduled), `paidAt`, `notes`. Không có trường hoàn tiền, không có địa chỉ giao hàng.
**discountCodes** – `code`, `type` (percent / fixed), `value`, `validUntil`, `maxUses`, `usedCount`, `products[]`.
**leads** – `source` (form nào, trang nào, utm), `need` (personal / business / resource), `name`, `email`, `phone?`, `message`, `consent`, `followUpStatus` (new / contacted / converted / closed), `interestTags[]`. Hana xuất CSV được.
**habitPlans** – kế hoạch của học viên: `customer` hoặc `leadEmail`, `scorecard[]` {habit, rating: good/neutral/bad}, `identityStatement` ("Tôi sẽ … để trở thành …"), `chosenTechniques[]` {technique, action}, `startDate`.
**habitCheckins** – `plan`, `day` (1–21), `done` (bool), `emotion` (một trong bộ emoji/cảm xúc cố định), `note?`. Duy nhất theo (plan, day).
**savedCards** – `customer`, `card`, `reflection?`, `savedAt`.
**diagnosticResults** – `email?`, `answers[]`, `topStage`, `createdAt`.

### Phân quyền

- Public chỉ đọc nội dung `published`.
- `customers` chỉ đọc/sửa dữ liệu của chính mình (habitPlans, checkins, savedCards, orders).
- `lessons.videoId` và `products.files` chỉ trả về khi có `entitlement` hợp lệ; link video/file luôn là link ký có hạn.
- `editor` sửa nội dung, không xóa đơn hàng, không sửa cài đặt thanh toán. `owner` toàn quyền.

---

## 8. Spec chức năng

### 8.1 Web 1 – Landing (`/`)

Trang chủ dựng bằng Puck (mục 5B). Bản seed ban đầu gồm 4 khối theo thứ tự dưới đây; sau đó Hana tự kéo thả thay đổi:

1. **Hero**: thông điệp "Hiểu mình rõ. Hành động bền bỉ. Tỏa sáng bằng thế mạnh riêng." + 2 lối vào:
   - Cá nhân: "Tôi đang ở một bước chuyển trong sự nghiệp" → "Khám phá cách Hana đồng hành"
   - Doanh nghiệp: "Tôi muốn việc học tạo ra hành vi thực tế" → "Trao đổi về chương trình cho đội ngũ"
2. **Chọn nhu cầu**: Tài nguyên miễn phí / Khóa học / Đồng hành (lấy từ `products` + `services`).
3. **Bằng chứng**: câu chuyện Hana, chuyên môn, testimonial.
4. **Chuyển đổi**: form nhận tài nguyên, nút đăng ký học, nút đặt lịch.

Trang con: `/ve-hana`, `/coaching`, `/coaching/[slug]`, `/doanh-nghiep`, `/doanh-nghiep/[slug]`, `/thu-vien`, `/tai-nguyen/[slug]`, `/blog/[slug]`, `/chung-nhan/[code]`, và 6 trang pháp lý.

**Menu chính** (sửa được trong CMS qua global `navigation`): Về Hana · Thư viện · Test thói quen 5 phút (→ `/habit/chan-doan`) · Growth Mirror · Doanh nghiệp · nút nổi bật "Đặt phiên trải nghiệm". Quiz chẩn đoán là lead magnet chính, phải nằm trên menu cả desktop lẫn mobile.

**Thư viện** (`/thu-vien`): 2 tab.

- _Khóa học_: Habit Tracker số, EQ Buddy số, 3 gói Growth Mirror (lấy từ `products`).
- _Nội dung_: ebook, toolkit, bài "Đọc sách cùng bạn", video ngắn (lấy từ `products` loại ebook/toolkit và `posts`).
- Bộ lọc chủ đề EQ / Habit / Career, tìm kiếm theo tên. Tab đang chọn và bộ lọc nằm trên URL (`?tab=noi-dung&topic=habit`) để chia sẻ được.

**Nút chat Zalo nổi**: component `FloatingChat`, góc phải dưới, mở `zaloChatUrl` ở tab mới, ghi sự kiện `zalo_chat_clicked`. Tự ẩn trong `/habit/hoc`, tracker và luồng rút thẻ để không che nội dung; không đè lên vùng an toàn của iOS (dùng `env(safe-area-inset-bottom)`).

**6 trang pháp lý** (footer mọi trang, nội dung từ `legalPages`):

1. `/thong-tin-phap-ly` – thông tin người bán (lấy từ `sellerInfo`)
2. `/dieu-khoan-su-dung`
3. `/chinh-sach-bao-mat` – theo Nghị định 13/2023
4. `/chinh-sach-cung-cap-dich-vu` – coaching, workshop, công cụ số, dùng thử 21 ngày
5. `/gia-thanh-toan` – giá, hình thức thanh toán, **không hoàn tiền**, vai trò phiên trải nghiệm 149.000đ
6. `/phan-anh-khieu-nai` – kênh và thời hạn phản hồi
   Checkout phải có ô tick "Tôi đã đọc và đồng ý với Điều khoản và Chính sách giá – thanh toán" (link tới trang 2 và 5); lưu thời điểm đồng ý vào order.

Sản phẩm hiển thị theo `saleStatus`: coming_soon → nút "Nhận thông báo"; on_sale → "Mua ngay" (hoặc "Dùng thử 21 ngày miễn phí" nếu `trialDays` > 0); free → "Nhận miễn phí"; consult → "Đăng ký tư vấn"; hidden → không hiện. Có `externalUrl` → nút mở link ngoài, ghi sự kiện `external_clicked`.

**Trang Growth Mirror** (`/coaching/growth-mirror`): bảng so sánh 3 gói CLEAR / BUILD / SHINE (cấu phần, tổng giá trị gạch ngang, giá bán, % ưu đãi – tất cả từ CMS). CTA duy nhất trên trang: **"Đặt phiên trải nghiệm 149.000đ"**. Các gói không có nút mua trực tiếp; sau phiên trải nghiệm, Hana tạo link thanh toán gói từ CMS và gửi cho khách. Trang điều khoản ghi rõ: không hoàn tiền, phiên trải nghiệm giúp khách thử trước khi chọn gói.

### 8.2 Web 2 – Habit Formation (`/habit`)

**Miễn phí**

1. **Chẩn đoán** (`/habit/chan-doan`): hiển thị các câu từ `diagnosticQuestions`, người dùng chọn mức độ đúng với mình (thang 1–4). Kết quả = giai đoạn có điểm cao nhất + gợi ý tương ứng + CTA sang Habit Loop và trang offer.
2. **Habit Loop 5 phút** (`/habit/5-phut`): wizard 4 bước theo file Excel:
   - Bước 1 – Bảng điểm thói quen: liệt kê thói quen trong ngày, đánh dấu tốt / bình thường / xấu.
   - Bước 2 – Gọi tên thói quen: "Tôi sẽ [hành động] để trở thành [con người]".
   - Bước 3 – Chọn 1–2 kỹ thuật cho mỗi giai đoạn (Cue, Craving, Response, Reward) từ `techniques`, ghi hành động cụ thể.
   - Bước 4 – Xem tracker 21 ngày.
     Lưu nháp trong trình duyệt; để lại email để lưu kết quả và nhận link mời group Zalo.
3. **Trang offer** (`/habit/1-percent-better`): 20 video, 11 kỹ thuật, tracker 21 ngày, giá từ CMS. CTA: "Dùng thử 21 ngày miễn phí" (đăng nhập OTP, không cần thanh toán).

**Habit Tracker số (Habit Hack 1% Better) – dùng thử 21 ngày, sau đó 250.000đ / ưu đãi 178.000đ**

- Đăng ký → tạo entitlement `trial` hết hạn sau `trialDays`. Trong thời gian dùng thử mở toàn bộ nội dung.
- Banner đếm ngày còn lại; email nhắc ngày 18 và ngày 21. Hết hạn: dữ liệu tracker vẫn giữ, chỉ xem được, nút "Mua để dùng tiếp".
- Mua → entitlement `active`.
- Dashboard `/habit/hoc`: danh sách module (Insight → Habit Loop → Nguyên tắc → Kỹ thuật), tiến độ xem video.
- Trình phát video dùng link ký, ghi nhận đã xem ≥ 80%.
- Tracker 21 ngày: lưới 21 ô, mỗi ngày tick hoàn thành + chọn cảm xúc. Lỡ 1 ngày: hiện "Lỡ nhịp 1 ngày là không sao cả". Lỡ 2 ngày liên tiếp: email nhắc nhẹ. Không cho tick ngày tương lai.
- Hiển thị câu "Ngày hôm nay, bạn đã bỏ phiếu cho con người bạn muốn trở thành?".
- Ngày 21: trang tổng kết (số ngày hoàn thành, cảm xúc nổi bật) + mời mua để dùng tiếp + mời phiên trải nghiệm Growth Mirror 149.000đ.
- **Chứng nhận 21 ngày**: nếu số ngày tick ≥ `certificateMinDays`, tạo bản ghi `certificates` và sinh ảnh bằng `next/og` theo brand book (logo, tên học viên, câu "Tôi sẽ … để trở thành …", số ngày hoàn thành, ngày cấp, mã xác minh). Có bản 4:5 và 9:16, nút tải ảnh và chia sẻ. Trang `/chung-nhan/[code]` công khai chỉ hiện tên, câu định danh, số ngày, ngày cấp; **không hiện cảm xúc hay ghi chú**. Học viên có thể tắt link công khai. Chưa đủ ngày: hiện lời động viên, không cấp.
- Lịch workshop "Tập thương cảm xúc" (dành cho khách mua gói) lấy từ CMS, email nhắc trước 24 giờ.

### 8.3 Web 3 – EQ Buddy (`/eq-buddy`)

Luồng 5 bước:

1. Chọn trạng thái: theo cảm xúc (tag), theo chủ đề, hoặc rút ngẫu nhiên.
2. Hiện thông điệp (Playfair Display Italic, hiệu ứng lật thẻ nhẹ, tôn trọng `prefers-reduced-motion`).
3. Mở câu chuyện.
4. Reflection: câu hỏi journaling + một hành động nhỏ; người dùng có thể ghi suy nghĩ (chỉ lưu khi đăng nhập).
5. Đi tiếp: lưu thẻ, chia sẻ (tải ảnh 4:5 / 9:16), rút thẻ khác, xem offer liên quan.

- URL thẻ: `/eq-buddy/the/[qrSlug]` – đây là đích của QR in trên thẻ vật lý; slug không được đổi sau khi in.
- Ảnh chia sẻ sinh bằng `next/og` theo layout brand book nếu thẻ chưa có ảnh riêng.
- EQ Buddy số: thẻ đầu tiên xem tự do không cần đăng nhập; để rút tiếp cần đăng ký dùng thử 21 ngày (cơ chế entitlement giống Habit Tracker), sau đó 250.000đ / ưu đãi 178.000đ. **Riêng trang thẻ mở từ QR luôn xem được thông điệp + câu chuyện của đúng thẻ đó** (người mua bộ thẻ vật lý không bị chặn).
- Bộ thẻ vật lý: nút "Mua bộ thẻ trên Shopee" mở `externalUrl` kèm UTM. Không xây checkout cho hàng vật lý.

### 8.4 Tài khoản (`/tai-khoan`)

Đăng nhập OTP qua email, khóa học của tôi, thẻ đã lưu, đơn hàng, tải lại file đã mua, xóa tài khoản và dữ liệu.

---

## 9. Năm luồng người dùng phải chạy end-to-end

| Luồng                               | Các bước                                                                                                                                                                    |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nhận tài nguyên miễn phí            | Trang tài nguyên → nhập tên, email, tick consent → tạo lead → email gửi link tải (link ký 7 ngày) → chuỗi email tiếp nối                                                    |
| Dùng thử công cụ số                 | Trang offer → nhập email → OTP → tạo customer + entitlement `trial` 21 ngày → vào thẳng công cụ → email chào mừng                                                           |
| Mua công cụ số sau dùng thử         | Banner / email nhắc → checkout → order `pending` + mã chuyển khoản → VietQR → xác nhận → entitlement `active` → email xác nhận                                              |
| Mua bộ thẻ vật lý                   | Nút Shopee → mở gian hàng Shopee (tab mới, có UTM) → ghi sự kiện `external_clicked`                                                                                         |
| Mua Habit Hack có video             | Trang offer → checkout → tạo/đăng nhập customer bằng OTP → thanh toán → webhook → tạo entitlement → chuyển vào dashboard                                                    |
| Đặt phiên trải nghiệm Growth Mirror | Trang Growth Mirror → form ngắn → order 149.000đ → VietQR → xác nhận → link đặt lịch → email hướng dẫn                                                                      |
| Mua gói Growth Mirror               | Sau phiên trải nghiệm, Hana tạo link thanh toán gói trong CMS → khách thanh toán → xác nhận → tự cấp entitlement công cụ số + email lịch workshop, coaching, link cộng đồng |
| Gửi brief doanh nghiệp              | Trang B2B → form chi tiết (công ty, quy mô, hành vi mục tiêu, thời gian) → lead → email xác nhận cho khách + thông báo cho Hana                                             |

Mỗi form: chống spam (honeypot + rate limit + Cloudflare Turnstile), validate server-side bằng Zod, thông báo lỗi tiếng Việt dễ hiểu.

---

## 10. Thanh toán (phần nhạy cảm nhất)

- Mỗi order có `paymentRef` duy nhất làm nội dung chuyển khoản (VD: `TDCX8F3K2`).
- Webhook: xác thực chữ ký/khóa của cổng, so khớp `paymentRef` và **số tiền chính xác**, xử lý idempotent (nhận trùng webhook không cấp quyền 2 lần), ghi log mọi webhook.
- Chỉ webhook đã xác thực mới chuyển order sang `paid`. Không tin dữ liệu từ trình duyệt.
- Order `pending` quá 24 giờ → `failed`, gửi email nhắc nếu khách đồng ý.
- Hana có nút "Xác nhận thủ công" và "Hủy đơn" trong CMS (chỉ `owner`), mọi thao tác ghi log. Không có chức năng hoàn tiền.
- **GĐ 1 chạy chế độ xác nhận thủ công**: hiện VietQR với nội dung chuyển khoản `paymentRef`, Hana bấm xác nhận trong CMS. Webhook tự động thêm ở GĐ 2 khi đã chốt cổng. Code tách `PaymentProvider` interface để đổi chế độ không phải sửa luồng.
- Có chế độ sandbox cho môi trường preview.

---

## 11. Bảo mật, dữ liệu cá nhân, chất lượng

- Tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân: consent rõ ràng, ghi `consentAt`, trang chính sách bảo mật, cho phép xóa dữ liệu.
- Dữ liệu cảm xúc, reflection, tracker là dữ liệu nhạy cảm: không gửi vào analytics, không hiển thị cho editor nếu không cần.
- Security headers (CSP, HSTS), cookie `httpOnly` + `secure`, rate limit đăng nhập OTP.
- Accessibility: tương phản đạt WCAG AA, điều hướng bàn phím, `alt` cho mọi ảnh (trường bắt buộc trong CMS).
- Hiệu năng: Lighthouse mobile ≥ 90 cho trang chủ, ảnh qua `next/image`, font tự host qua `next/font`.
- SEO: metadata từ CMS, Open Graph, sitemap, robots.
- Analytics sự kiện: `lead_submitted`, `resource_downloaded`, `diagnostic_completed`, `habit_loop_completed`, `checkout_started`, `order_paid`, `certificate_issued`, `certificate_shared`, `zalo_chat_clicked`, `library_filtered`, `trial_started`, `trial_expired`, `trial_converted`, `lesson_completed`, `tracker_day_checked`, `card_drawn`, `card_shared`, `qr_opened`, `external_clicked` (Shopee), `package_viewed`, `experience_session_booked`, `booking_clicked`, `b2b_brief_submitted`.
- Backup DB hằng ngày, giữ 14 ngày. Ghi quy trình khôi phục trong `docs/RUNBOOK.md`.

---

## 12. Lộ trình và tiêu chí nghiệm thu

Chỉ bắt đầu giai đoạn sau khi cổng của giai đoạn trước đạt và Hana xác nhận.

### GĐ 0 – Nền móng

- [ ] Khởi tạo repo, Next.js + Payload + Postgres + Tailwind, lint, format, CI chạy test
- [ ] Design tokens, font, component `ui/` cơ bản, trang `/styleguide` hiển thị toàn bộ
- [ ] Toàn bộ collections ở mục 7 (chưa cần UI public), phân quyền, seed dữ liệu MẪU
- [ ] Deploy preview lên Vercel, `.env.example`, `docs/DECISIONS.md`
- [ ] Tích hợp Puck vào admin với 5 khối đầu tiên (`HeroTwoEntries`, `SectionHeader`, `RichText`, `ImageText`, `CTAButton`), lưu nháp / xuất bản, xem trước 3 kích thước
- [ ] Ước lượng số task và thời gian cho GĐ 1–4

**Cổng**: Hana đăng nhập `/admin`, thấy đủ collection, tạo thử 1 sản phẩm, và tự kéo thả dựng 1 trang thử từ 5 khối đầu tiên rồi xuất bản.

### GĐ 1 – Web 1 Landing + CMS

- [ ] Đủ thư viện khối mục 5B, 4 mẫu trang, lịch sử phiên bản, khóa khối bắt buộc
- [ ] Trang chủ và các trang con mục 8.1 dựng bằng Puck từ mẫu; trang dữ liệu đọc 100% từ CMS
- [ ] Form lead, form coaching, form brief B2B; email xác nhận; thông báo cho Hana
- [ ] Giao tài nguyên miễn phí qua email
- [ ] Trang Growth Mirror 3 gói + thanh toán phiên trải nghiệm 149.000đ (xác nhận thủ công) + link thanh toán gói do Hana tạo
- [ ] Menu chính có quiz, Thư viện 2 tab có bộ lọc, nút chat Zalo nổi
- [ ] Quiz chẩn đoán `/habit/chan-doan` (kéo từ GĐ 2 lên vì nằm trên menu chính; kết quả thu email, CTA tạm sang phiên trải nghiệm cho đến khi Habit Tracker lên sóng)
- [ ] 6 trang pháp lý từ `legalPages`, footer, ô đồng ý điều khoản ở checkout
- [ ] Analytics, SEO, chính sách bảo mật, kết nối domain
- [ ] `docs/HUONG_DAN_CMS.md` bản 1

**Cổng**: Hana tự kéo thả tạo 1 landing chiến dịch mới từ mẫu và xuất bản, tự sửa tiêu đề hero, thêm 1 testimonial, đổi trạng thái 1 sản phẩm, sửa 1 trang pháp lý mà không cần hỗ trợ; lead thật về đủ và xuất được CSV; 6 trang pháp lý đã có nội dung thật.

### GĐ 2 – Web 2 Habit MVP

- [ ] Habit Loop 5 phút, trang offer; đổi CTA kết quả quiz sang dùng thử Habit Tracker
- [ ] Customer OTP, entitlement dùng thử 21 ngày, email nhắc hết hạn
- [ ] Checkout công cụ số, VietQR, webhook tự động, chuyển entitlement trial → active
- [ ] Dashboard học, trình phát video bảo vệ, tracker 21 ngày, email nhắc
- [ ] Chứng nhận 21 ngày: ảnh 4:5 / 9:16, trang xác minh công khai `/chung-nhan/[code]`
- [ ] Test Playwright cho luồng mua → học → tick tracker

**Cổng**: một đơn thật được thanh toán và mở khóa tự động; người review kỹ thuật đã duyệt các chỗ `REVIEW-REQUIRED`.

### GĐ 3 – Web 3 EQ Buddy

- [ ] Collection `eqCards` đầy đủ, luồng rút thẻ 5 bước, trang thẻ theo QR
- [ ] Lưu thẻ, ảnh chia sẻ 4:5 và 9:16, offer liên quan
- [ ] Dùng thử 21 ngày cho EQ Buddy số (tái dùng entitlement của GĐ 2), nút Shopee cho bộ thẻ vật lý
- [ ] Xuất danh sách QR (CSV + PNG) cho file in

**Cổng**: người dùng thật rút thẻ và quét QR ổn định trên điện thoại.

### GĐ 4 – Mở rộng

- [ ] Thanh toán gói Growth Mirror tự động qua webhook, cấp quyền cộng đồng và lịch workshop
- [ ] Chuỗi email nuôi dưỡng sau tài nguyên miễn phí
- [ ] Mã giảm giá
- [ ] Đề xuất (chưa code) bản B2B dùng tracker cho đội ngũ

### Definition of Done cho mọi task

- Chạy được trên preview, không lỗi console, không lỗi TypeScript
- Đẹp ở 375px và 1440px, đúng brand book
- Nội dung đến từ CMS, có trạng thái loading / rỗng / lỗi
- Có test cho logic quan trọng
- `HUONG_DAN_CMS.md` cập nhật nếu có thứ Hana cần thao tác

---

## 13. Mẫu báo cáo sau mỗi task

```
## Đã làm
- …
## Cách kiểm tra (cho người không biết code)
1. Mở link preview …
2. Bấm …
## File thay đổi chính
- …
## Cần người review kỹ thuật
- … (nếu có REVIEW-REQUIRED)
## Câu hỏi / quyết định cần Hana chốt
- …
## Việc tiếp theo đề xuất
- …
```

---

## 14. Những điều KHÔNG làm

- Không bịa testimonial, số liệu, giá, chứng chỉ.
- Không dùng màu, font ngoài brand book.
- Không lưu video trả phí ở nơi ai có link cũng xem được.
- Không đánh dấu đơn là đã thanh toán nếu chưa có webhook xác thực hoặc xác nhận thủ công của `owner`.
- Không gửi dữ liệu cảm xúc, reflection vào analytics hay dịch vụ bên thứ ba.
- Không đổi `qrSlug` của thẻ đã in.
- Không xóa dữ liệu khách hàng thật khi chạy seed hay migration.
- Không xây giỏ hàng, địa chỉ giao hàng hay quản lý tồn kho cho bộ thẻ vật lý – đã bán qua Shopee.
- Không viết chính sách hoàn tiền hay nút hoàn tiền.
- Không cho một customer dùng thử cùng một công cụ hai lần.
- Không tự viết nội dung pháp lý thay Hana; chỉ dựng khung và tiêu đề.
- Không đưa cảm xúc, ghi chú tracker lên chứng nhận hay trang công khai.
- Không thêm color picker, chọn font hay ô nhập CSS tự do vào trình kéo thả.
- Không dùng Puck cho dữ liệu có cấu trúc (sản phẩm, thẻ EQ, bài học, giá) – các thứ này là form Payload.
- Không đổi props của khối mà không viết migration cho dữ liệu trang đã có.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
