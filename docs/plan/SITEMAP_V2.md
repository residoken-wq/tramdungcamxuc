# Sitemap v2 – Phân tích bản revise của Hana và kế hoạch cập nhật

> Người lập: Planning · 17/10/2026
> Nguồn: file PDF "Sơ đồ cấu trúc website Trạm Dừng Cảm Xúc" (51 trang, Hana gửi 17/10). **Không commit file PDF** (repo công khai, PDF có ảnh chân dung, email, ảnh khách hàng). Planning giữ bản gốc ngoài repo; trích dẫn theo số trang.
> Task card: `docs/tasks/SM.md`.
> Trạng thái: **ĐÃ CHỐT 17/10** (Planning trả lời thay Hana) – kết quả ở `docs/DECISIONS.md` mục "Sitemap v2 – chốt 17/10/2026". Còn chờ Hana nội dung thật (SM-00).

---

## 1. Tóm tắt bản revise

### 1.1 Cây trang mới (PDF tr. 1)

```
tramdungcamxuc.com
├─ Trang chủ
├─ Sản phẩm
│  ├─ Dành cho Cá nhân
│  │  ├─ Chuyển mình không chênh vênh  (gói giải pháp – CLEAR / BUILD / SHINE)
│  │  ├─ EQ Buddy                      (công cụ hỗ trợ cảm xúc)
│  │  ├─ Habit Hack                    (công cụ rèn thói quen)
│  │  └─ Coach 1:1                     (khai vấn chuyên sâu)
│  └─ Dành cho Doanh nghiệp
│     ├─ EQ                            (giải pháp tổ chức)
│     ├─ Habit                         (giải pháp tổ chức)
│     └─ Coach 1:1                     (khai vấn chuyên sâu)
├─ Về Trạm
├─ Tài nguyên (tài nguyên free, bài SEO)
├─ Cộng đồng của Trạm
└─ Liên hệ
```

### 1.2 Mockup có trong PDF

| Trang                         | PDF trang | Mức chi tiết                                                             |
| ----------------------------- | --------- | ------------------------------------------------------------------------ |
| Trang chủ                     | 2–12      | Đủ 11 section                                                            |
| Lộ trình Chuyển mình không... | 13–21     | Đủ 7 section (hero, nỗi đau, 3 cột mốc, bảng giá, testimonial, FAQ, CTA) |
| Habit Tracker                 | 22        | **Chỉ có trang bìa** – chưa có mockup                                    |
| EQ Buddy                      | 23        | **Chỉ có trang bìa** – chưa có mockup                                    |
| Sản phẩm doanh nghiệp         | 24        | **Chưa có nội dung** – PDF ghi "cần thêm nội dung cho 2 trang sản phẩm"  |
| Về Trạm (About)               | 25–33     | Đủ 9 section                                                             |
| Tài nguyên                    | 34–37     | Đủ 3 section (carousel lead magnet, blog SEO, newsletter + CTA)          |
| Coach 1:1                     | 38–45     | Đủ 7 section                                                             |
| Liên hệ                       | 46–51     | Đủ 4 section                                                             |
| Cộng đồng của Trạm            | –         | **Không có trang nào**                                                   |

### 1.3 Thay đổi lớn so với AGENTS.md mục 8.1

| #   | Hiện tại (đã build)                                                                                             | Bản revise                                                                                                                                                                           |
| --- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Menu phẳng 6 mục: Về Hana · Thư viện · Test 5 phút · Growth Mirror · Doanh nghiệp · nút "Đặt phiên trải nghiệm" | Menu 6 mục, **"Sản phẩm" có menu con 2 nhóm** (Cá nhân 4 mục, Doanh nghiệp 3 mục); có thêm Cộng đồng, Liên hệ                                                                        |
| 2   | Thương hiệu xoay quanh **Hana** ("Về Hana", giọng "Hana đồng hành")                                             | Thương hiệu xoay quanh **Trạm** như một tổ chức ("Về Trạm", giọng "chúng tôi", có đội ngũ, tầm nhìn – sứ mệnh)                                                                       |
| 3   | 3 gói gọi là **Growth Mirror** CLEAR / BUILD / SHINE                                                            | 3 gói gọi là **Lộ trình "Chuyển mình không chênh vênh"** (Signature Program). **Growth Mirror** thành tên dịch vụ coach 1:1 cho cá nhân, đi cặp với **Thinking Mirror** cho lãnh đạo |
| 4   | Thư viện `/thu-vien` 2 tab                                                                                      | Tài nguyên: carousel lead magnet + blog SEO có tìm kiếm & chip chủ đề + đăng ký newsletter                                                                                           |
| 5   | Không có trang Liên hệ, Cộng đồng                                                                               | Có trang Liên hệ (thông tin + 2 form B2C/B2B + FAQ nhanh), có mục Cộng đồng                                                                                                          |
| 6   | Quiz "Test thói quen 5 phút" nằm trên menu chính (chốt AGENTS 8.1)                                              | Quiz **không còn trên menu**; chỉ còn ở nút "Công cụ chẩn đoán – miễn phí" trên trang chủ và lead magnet                                                                             |
| 7   | Trang chủ seed 4 khối                                                                                           | Trang chủ 11 section                                                                                                                                                                 |

Phần lớn thay đổi nằm ở **Web 1** (trang Puck + menu + CMS). Web 2 (`/habit`) và Web 3 (`/eq-buddy`) giữ nguyên luồng ứng dụng; chỉ đổi tên hiển thị trên menu và trang giới thiệu.

---

## 2. Điểm mâu thuẫn với quyết định đã chốt / chính sách (phải xử lý trước khi lên web)

Những điểm này **không được đưa lên web như trong mockup**. Planning đề xuất cách xử lý, Hana chốt.

| #   | Trang PDF               | Nội dung mockup                                                                                                                 | Mâu thuẫn với                                                                                                    | Đề xuất                                                                                                                                                                        |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M1  | 51                      | FAQ: "cam kết **hoàn tiền trong 7 ngày**", "thẻ ATM/**Visa**"                                                                   | AGENTS 1 + 14: không có chính sách hoàn tiền; thanh toán chỉ VietQR / SePay                                      | Viết lại câu trả lời: chuyển khoản VietQR, không hoàn tiền, phiên trải nghiệm 149.000đ để thử trước. Nội dung FAQ do Hana soạn                                                 |
| M2  | 4, 10, 18               | Nút **"Đặt ngay"** cạnh từng gói CLEAR/BUILD/SHINE; **"Chọn gói này"** ở bảng giá                                               | AGENTS 8.1: gói không có nút mua trực tiếp, CTA duy nhất là "Đặt phiên trải nghiệm 149.000đ"                     | Giữ quy tắc cũ: mọi nút trên gói dẫn tới đặt phiên trải nghiệm (có ghi gói quan tâm vào lead/đơn). Nếu Hana muốn bán gói trực tiếp → là quyết định mới (Q3), kéo việc GĐ 4 lên |
| M3  | 9, 19, 44               | Testimonial có tên, tuổi, chức danh, ảnh, câu chuyện trước/sau                                                                  | AGENTS 14 + policy 5: không bịa testimonial; `consent = true` mới được hiện                                      | Chỉ dùng testimonial thật đã có đồng ý. Ảnh trong mockup trông như ảnh minh họa/AI → **không dùng làm ảnh khách**. Thiếu câu chuyện thật thì ẩn section                        |
| M4  | 26, 33, 21              | Số liệu: 50+ doanh nghiệp, 10.000+ học viên, 98% hài lòng, 500+ học viên, "01 tiên phong", "hàng ngàn giờ"                      | AGENTS 14: không bịa số liệu. Mâu thuẫn nội bộ: tr. 8 ghi **500+ giờ coaching**, tr. 21/26 ghi **500+ học viên** | Hana xác nhận từng con số và nguồn. Số chưa xác nhận → không hiện                                                                                                              |
| M5  | 33                      | Logo đối tác: Techcombank, Vinamilk, FPT, VietinBank, Unilever, RMIT, VnExpress, Vietcetera, VTV1, Brands VN                    | Bản quyền / nhãn hiệu (policy 7) + không bịa                                                                     | Chỉ hiện tổ chức Hana **đã thực sự làm việc** và được phép nêu tên / dùng logo. Danh sách do Hana gửi                                                                          |
| M6  | 31, 32                  | "Đội ngũ chuyên gia" 3 người (ảnh stock), "Toàn bộ đội ngũ đạt chuẩn ACC/PCC"                                                   | Policy 5: không dùng ảnh người không có thật như người thật; Hana hiện là ICF ACC, PCC candidate                 | Nếu có đội ngũ thật: Hana gửi tên, vai trò, ảnh, đồng ý. Chưa có → bỏ section, sửa câu "toàn bộ đội ngũ"                                                                       |
| M7  | 6 vs 11, 41, 45, 46, 51 | 3 khái niệm khác nhau: "Đặt lịch gọi **15 phút**" (miễn phí), "**Phiên Khám phá** 30–45 phút", "**Phiên trải nghiệm** 149.000đ" | Luồng đã build: chỉ có phiên trải nghiệm 149.000đ (đơn + VietQR + link đặt lịch)                                 | Hana chốt (Q4). Đề xuất: "Phiên Khám phá" = tên mới của phiên trải nghiệm 149.000đ; cuộc gọi 15 phút miễn phí là kênh Zalo / form liên hệ                                      |
| M8  | 1, 3                    | Quiz chẩn đoán không còn trên menu                                                                                              | AGENTS 8.1: quiz là lead magnet chính, **phải nằm trên menu** desktop + mobile                                   | Đề xuất: đặt quiz trong menu con "Tài nguyên" hoặc làm nút nổi bật thay cho "Đặt phiên trải nghiệm" (Q5)                                                                       |
| M9  | 49                      | Email liên hệ khác với email ở tr. 11 (có vẻ gõ thiếu chữ "r"); hotline là số giả                                               | –                                                                                                                | Lấy từ `siteSettings`, Hana nhập số / email thật                                                                                                                               |
| M10 | 30                      | Chữ ký "Hana Lương" dạng font viết tay                                                                                          | Brand book: chỉ Anton / Montserrat / Playfair Display                                                            | Dùng ảnh chữ ký thật (PNG nền trong, Hana gửi) qua `media`, hoặc Playfair Display Italic                                                                                       |
| M11 | 36–38, 49               | Icon emoji (📝🎙️⚡👤🏢✉️📞📍🌐)                                                                                                 | Brand: icon là SVG trong `src/components/brand/` (emoji chỉ dùng cho bộ 10 cảm xúc)                              | Thay bằng icon SVG nét mảnh có sẵn / bổ sung bộ icon brand                                                                                                                     |
| M12 | 17, 18                  | Card kính mờ trên nền ảnh tối bị làm mờ                                                                                         | Brand: nền pastel nhẹ; WCAG AA                                                                                   | Dùng nền `lavender-mist` / `warm-ivory`, card trắng viền mảnh; bảng giá cột nổi bật `deep-navy`                                                                                |
| M13 | 36                      | Newsletter hứa "Podcast & Âm thanh", "mỗi tuần"                                                                                 | Không bịa; hiện chưa có hệ thống gửi newsletter                                                                  | Chỉ hứa thứ đang có. Form newsletter lưu `leads` (tag `newsletter`); gửi bản tin hằng tuần → BACKLOG                                                                           |

---

## 3. Phân tích theo từng trang: section mockup → khối Puck / dữ liệu CMS

Ký hiệu: ✅ có sẵn, dùng ngay · 🔧 có sẵn, cần nâng cấp (tăng `version` + viết migration Puck) · 🆕 khối mới · 📦 dữ liệu lấy từ collection (form Payload, không nhập trong Puck).

### 3.1 Trang chủ `/` (tr. 3–12)

| Section mockup                                                     | Khối                                                              | Ghi chú                                                                                                                                    |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Hero: tiêu đề 2 tầng, mô tả, 2 card lối vào, ảnh Hana              | 🔧 `HeroTwoEntries` v2                                            | Thêm: ảnh (`media`, bắt buộc `alt`), đoạn mô tả, nhãn nhóm mỗi lối vào ("CHO CÁ NHÂN"), kiểu nút (đặc / viền). Khóa xóa giữ nguyên         |
| Lộ trình đặc biệt: 3 card CLEAR/BUILD/SHINE + 1 nút                | 🆕 `PackageCards` 📦 `products` (type package)                    | Chỉ lưu ID gói; tên, tagline ("Tỏ tường từ bên trong"), mô tả ngắn, icon lấy từ sản phẩm. Có tùy chọn "card nổi bật"                       |
| Bạn đang ở giai đoạn…: 4 card icon + quote nền tối + nút chẩn đoán | 🆕 `IconCardGrid` + 🔧 `QuoteBlock` (kiểu nền tối) + ✅ `QuizCTA` | `IconCardGrid` dùng chung cho nhiều trang: 2/3/4 cột, đầu card là icon brand hoặc số thứ tự                                                |
| Hành trình chuyển hóa 5 bước                                       | 🔧 `JourneySteps` v2                                              | Thêm kiểu hiển thị: vòng tròn số (trang chủ), card nối nét đứt + bước nổi bật (Về Trạm), danh sách dọc (Coach 1:1). Thêm dòng phụ mỗi bước |
| Người sáng lập: nền tối, quote, sứ mệnh, chip giá trị, ảnh         | 🔧 `HanaStory` v2                                                 | Thêm: nền tối, chức danh, danh sách chip, vị trí ảnh                                                                                       |
| Bảo chứng: 10+ năm · ICF ACC · 500+ giờ                            | 🔧 `StatsBar` v2                                                  | Thêm mô tả dưới mỗi số, cho phép icon thay số (huy hiệu ICF)                                                                               |
| Câu chuyện khách hàng 3 card                                       | 🔧 `TestimonialGrid` v2 📦 `testimonials`                         | Thêm kiểu card viền trên màu + avatar                                                                                                      |
| Hệ sinh thái giải pháp 3 cột                                       | 🆕 `SolutionEcosystem` 📦 products/services/programs              | 3 cột: Đào tạo cá nhân (gói + masterclass) · Khai vấn 1:1 (services) · Giải pháp DN (programs). Nút theo `saleStatus` (logic T1-08)        |
| FAQ + card "Đặt lịch gọi 15 phút"                                  | 🔧 `FAQ` v2                                                       | Thêm cột phụ (card đặt lịch, lấy email/link từ `siteSettings`), kiểu đánh số, link "Xem tất cả"                                            |
| Quà tặng miễn phí + form "Bắt đầu hành trình" (tab Cá nhân/DN)     | ✅ `LeadForm` + 🆕 `ContactForms`                                 | `ContactForms` có 2 chế độ: tab (trang chủ) và 2 cột (Liên hệ). Tab DN dùng lại logic `B2BBriefForm`                                       |

### 3.2 Lộ trình "Chuyển mình không chênh vênh" (tr. 14–21)

| Section                               | Khối                                           | Ghi chú                                                                                                                                  |
| ------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Hero ảnh phải + 2 nút                 | 🔧 `HeroImage` v2                              | Thêm nút thứ 2 (viền), dải huy hiệu / số liệu nhỏ (dùng cho Coach 1:1, Về Trạm)                                                          |
| 4 nỗi đau đánh số + khối nền tối      | 🆕 `IconCardGrid` (kiểu số) + 🆕 `Callout`     | `Callout`: tiêu đề + mô tả trên nền `deep-navy`, tùy chọn nút                                                                            |
| 3 cột mốc CLEAR/BUILD/SHINE           | 🆕 `PackageCards` (kiểu số 01/02/03)           | Cùng khối với trang chủ, khác kiểu                                                                                                       |
| Bảng giá & quyền lợi + "Khuyên dùng"  | 🔧 `PackageComparison` v2 📦                   | Thêm: chọn gói nổi bật + nhãn huy hiệu; nút dưới mỗi cột **dẫn tới đặt phiên trải nghiệm** (M2). Tổng giá trị, % ưu đãi vẫn tính tự động |
| Testimonial trước/sau theo gói        | 🔧 `TestimonialGrid` v2 (kiểu "câu chuyện") 📦 | Cần trường mới trong `testimonials` (mục 5.4)                                                                                            |
| FAQ đánh số, câu 2 so sánh 2 cột      | 🔧 `FAQ` v2 (kiểu số)                          | Câu trả lời 2 cột: chấp nhận viết dạng đoạn văn; không làm layout riêng                                                                  |
| CTA cuối + dãy avatar "500+ học viên" | 🆕 `CTASection`                                | Dãy avatar chỉ hiện khi có ảnh thật + số liệu đã xác nhận (M3, M4)                                                                       |

### 3.3 Habit Hack, EQ Buddy (tr. 22–23)

Chưa có mockup. Giữ trang giới thiệu hiện có (`/habit/1-percent-better`, `/eq-buddy`), chỉ nối menu. Khi Hana gửi mockup → task riêng. Cần chốt tên hiển thị (Q6).

### 3.4 Sản phẩm doanh nghiệp (tr. 24)

PDF chưa có nội dung. Dùng sẵn `programs` + `/doanh-nghiep/[slug]`. Việc của Hana: soạn nội dung 2 chương trình "EQ Development for Clarity" và "Habit Formation for Resilience and Agility in Action" theo các trường của `programs` (hành vi mục tiêu, nhóm học viên, hình thức, thời lượng, sản phẩm bàn giao, theo dõi sau, đo lường). Trang chủ tr. 10 dùng tên khác ("EQ for Leadership & Team", "Habit Formation in Action") → Q7.

### 3.5 Về Trạm (tr. 26–33)

| Section                                    | Khối                                              | Ghi chú                                                                  |
| ------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------ |
| Hero + 3 số liệu + ảnh có nhãn             | 🔧 `HeroImage` v2                                 | Số liệu chờ xác nhận (M4)                                                |
| Tại sao lại là "Trạm Dừng"? + 3 bước + ảnh | 🔧 `ImageText` v2 hoặc `Columns` + `IconCardGrid` | Ưu tiên ghép khối có sẵn; chỉ nâng `ImageText` thêm quote + nhãn ảnh     |
| Tầm nhìn – Sứ mệnh – Giá trị cốt lõi       | 🆕 `VisionMission` + `IconCardGrid`               | Giá trị cốt lõi = `IconCardGrid` 4 cột                                   |
| Khung chuyển hóa 5 bước                    | 🔧 `JourneySteps` v2 (kiểu card)                  |                                                                          |
| Lời chào nhà sáng lập + chữ ký             | 🔧 `HanaStory` v2 (kiểu "thư")                    | Chữ ký là ảnh (M10)                                                      |
| Đội ngũ chuyên gia                         | 🆕 `TeamGrid` 📦 collection mới `teamMembers`     | **Chỉ làm nếu có đội ngũ thật** (M6, Q8)                                 |
| Tiêu chuẩn quốc tế                         | `Columns` + `RichText` + `IconCardGrid`           | Không cần khối mới                                                       |
| Tổ chức đã tin tưởng                       | ✅ `StatsBar` + 🔧 `LogoStrip` v2                 | `LogoStrip` thêm nhóm (Doanh nghiệp / Truyền thông). Danh sách thật (M5) |
| Sẵn sàng bắt đầu: 2 card Cá nhân / DN      | 🆕 `TwoPathCards`                                 | Có thể dùng lại phần card của `HeroTwoEntries` v2                        |

### 3.6 Tài nguyên (tr. 35–37)

| Section                                                | Khối / trang                                                      | Ghi chú                                                                                                                                |
| ------------------------------------------------------ | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Carousel tài nguyên miễn phí + form email              | 🆕 `LeadMagnetCarousel` 📦 products (`saleStatus = free`)         | Dùng lại logic `LeadForm` (giao link ký 7 ngày, T1-07). Carousel có nút bàn phím, không tự chạy                                        |
| Bài viết chuyên đề: tìm kiếm, chip chủ đề, bài nổi bật | Trang `/tai-nguyen` (ứng dụng, không Puck) 📦 `posts`, `products` | Nâng cấp từ `/thu-vien`: thêm bài nổi bật (`posts.featured`), thời gian đọc (tính tự động), chip theo `topic`. Bộ lọc vẫn nằm trên URL |
| Newsletter + CTA 2 nút nền tối                         | 🆕 `NewsletterForm` + ✅ `CTAButton` / 🆕 `CTASection`            | Lưu `leads` với `need = resource`, tag `newsletter`, có consent                                                                        |

### 3.7 Coach 1:1 (tr. 39–45)

| Section                                    | Khối                                                               | Ghi chú                                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Hero + 2 huy hiệu + 3 số                   | 🔧 `HeroImage` v2                                                  |                                                                                                                               |
| 4 tình huống + card ảnh có nút             | 🆕 `IconCardGrid` + `Columns`                                      |                                                                                                                               |
| Chọn "Tấm gương": Growth / Thinking Mirror | 🆕 `ServiceCards` 📦 `services`                                    | Lấy `situations[]` ("Phù hợp với"), `outcomes[]`, ảnh, nhãn đối tượng                                                         |
| Điều gì diễn ra trong 1:1 (3 mục + ảnh)    | `Columns` + `IconCardGrid` (1 cột) + `ImageText`                   |                                                                                                                               |
| Testimonial 3 tầng                         | 🔧 `TestimonialGrid` v2 (kiểu "3 giai đoạn")                       | Trường "Vấn đề ban đầu / Quá trình nhận thức / Kết quả" (mục 5.4)                                                             |
| Quy trình đồng hành 5 bước                 | 🔧 `JourneySteps` v2 (kiểu danh sách dọc) hoặc `IconCardGrid` (số) | Bước tự nhập (không phải Pause→Practice) → dùng `IconCardGrid` kiểu số, 1 cột                                                 |
| Form đặt lịch + card ảnh                   | 🔧 `BookingCTA` / form phiên trải nghiệm                           | Thêm trường "Lộ trình quan tâm" (Growth / Thinking Mirror) và "Bạn đang trăn trở điều gì". Vẫn tạo đơn 149.000đ (luồng T1-12) |

### 3.8 Liên hệ `/lien-he` (tr. 47–51)

| Section                         | Khối                               | Ghi chú                                                                            |
| ------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------- |
| Hero chữ + 2 điểm mạnh + ảnh    | 🔧 `HeroImage` v2 + `IconCardGrid` |                                                                                    |
| Thông tin liên hệ + mạng xã hội | 🆕 `ContactInfo` 📦 `siteSettings` | Email, hotline/Zalo, địa điểm, LinkedIn, Facebook, YouTube – không nhập trong Puck |
| 2 form B2C / B2B                | 🆕 `ContactForms` (kiểu 2 cột)     | Trường mới ở mục 5.6                                                               |
| FAQ nhanh + "Xem toàn bộ"       | 🔧 `FAQ` v2                        | Cần trang FAQ đầy đủ (Q9)                                                          |

### 3.9 Cộng đồng của Trạm

Không có mockup → **chặn**, chờ Hana (Q10). Tạm thời mục menu trỏ tới link Zalo group (`siteSettings`) hoặc ẩn.

---

## 4. Câu hỏi cần Hana chốt

| Mã  | Câu hỏi                                                                                                                                                                      | Đề xuất của Planning                                                                                                              | Chặn task    |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| Q1  | Đổi tên 3 gói: "Growth Mirror CLEAR/BUILD/SHINE" → **Lộ trình "Chuyển mình không chênh vênh"**? Growth Mirror chỉ còn là tên dịch vụ coach 1:1?                              | Đồng ý. Tên gói sửa trong CMS (`products`), không cần code. Đổi đường dẫn (Q2)                                                    | SM-07        |
| Q2  | Đường dẫn mới (bảng mục 6) có được không? Đường dẫn cũ tự chuyển sang mới (301)                                                                                              | Đồng ý bảng mục 6                                                                                                                 | SM-02        |
| Q3  | Gói có được **mua trực tiếp** ("Chọn gói này") hay vẫn phải qua phiên trải nghiệm 149.000đ?                                                                                  | Vẫn qua phiên trải nghiệm (đã chốt). Nút "Chọn gói này" → mở form đặt phiên, ghi gói quan tâm                                     | SM-04        |
| Q4  | "Phiên Khám phá", "Phiên trải nghiệm 149.000đ", "cuộc gọi 15 phút miễn phí" – là 1, 2 hay 3 thứ?                                                                             | 2 thứ: Phiên Khám phá = phiên trải nghiệm 149.000đ (đổi tên hiển thị); gọi 15 phút miễn phí = qua Zalo / form liên hệ             | SM-04, SM-06 |
| Q5  | Quiz "Test thói quen 5 phút" đặt ở đâu trên menu? (AGENTS bắt buộc có trên menu)                                                                                             | Mục đầu tiên trong menu con "Tài nguyên" + nút nổi bật trên mobile                                                                | SM-02        |
| Q6  | Tên hiển thị: "Habit Hack" / "Habit Tracker" / "Habit Formation" (masterclass) / "Habit Hack 1% Better" – dùng tên nào ở đâu? "EQ Mastery" là EQ Buddy số hay sản phẩm khác? | 1 sản phẩm = 1 tên. Đề xuất: menu "Habit Hack", sản phẩm "Habit Tracker số"; cần Hana xác nhận masterclass có phải sản phẩm riêng | SM-07        |
| Q7  | 2 chương trình doanh nghiệp: tên chính thức là gì? "Coach 1:1" dành cho doanh nghiệp có phải là Thinking Mirror?                                                             | Hana soạn nội dung theo trường `programs`                                                                                         | SM-07        |
| Q8  | Đội ngũ chuyên gia: có người thật nào ngoài Hana? (tên, vai trò, ảnh, đồng ý)                                                                                                | Chưa có → bỏ section                                                                                                              | SM-05        |
| Q9  | Có làm trang **Câu hỏi thường gặp** riêng không? FAQ dùng chung cho nhiều trang?                                                                                             | Có: collection `faqs` (câu hỏi, trả lời, nhóm), khối `FAQ` chọn theo nhóm → sửa 1 chỗ, mọi trang cập nhật                         | SM-01, SM-06 |
| Q10 | Trang "Cộng đồng của Trạm" gồm gì? (Zalo group miễn phí, cộng đồng private của gói BUILD/SHINE, webinar quý, sự kiện?)                                                       | Gửi mockup / nội dung; tạm trỏ link Zalo group                                                                                    | SM-08        |
| Q11 | Số liệu, logo đối tác, testimonial: Hana gửi bản thật + xác nhận được phép công bố (M3–M6)                                                                                   | Section chưa có dữ liệu thật thì ẩn                                                                                               | SM-07        |
| Q12 | Có trang chi tiết cho từng gói (CLEAR / BUILD / SHINE) không, hay chỉ 1 trang lộ trình?                                                                                      | 1 trang lộ trình (như mockup)                                                                                                     | –            |
| Q13 | Newsletter: chỉ thu email, hay cần gửi bản tin hằng tuần tự động?                                                                                                            | GĐ này chỉ thu email; gửi bản tin → BACKLOG (Resend Broadcast)                                                                    | SM-06        |

Bảng câu hỏi gửi Hana (Claude Docs, 17/10) đánh số lại. Đối chiếu số trong bảng gửi Hana → số ở đây: Q1→Q1 · Q2→Q2 · Q3→Q5 · Q4→Q3 · Q5→Q4 · Q6→Q6 · Q7→Q7 · Q8→Q12 · Q9a–c→Q11 · Q10→Q8 · Q11→Q10 · Q12→Q9 · Q13→Q13.

Khi Hana trả lời: ghi vào `docs/DECISIONS.md` và cập nhật AGENTS.md mục 8.1 (menu, tên gói, trang con). Quyết định Q1, Q2, Q5 phải chốt trước khi bắt đầu SM-02.

---

## 5. Thay đổi CMS (Payload) – cần migration 🔒

### 5.1 `navigation` (global)

- Mỗi mục menu chính thêm `children[]` (tối đa 2 cấp): nhóm con có `groupLabel` ("Dành cho Cá nhân" / "Dành cho Doanh nghiệp") và danh sách mục con {label, `description` ngắn (vd. "Công cụ hỗ trợ cảm xúc"), linkType, page/url}.
- Mục có `children` vẫn có thể có trang đích riêng (vd. `/san-pham`).
- Migration giữ nguyên dữ liệu menu hiện tại (mục cũ không có `children`).

### 5.2 `products`

- `tagline` (vd. "Tỏ tường từ bên trong") – dùng cho `PackageCards`.
- `icon` – **select** từ bộ icon brand (không upload tự do).
- `topic` (eq / habit / career) – đã nằm trong BACKLOG từ T1-09, làm luôn.
- `audienceSegment` (individual / business) – để `SolutionEcosystem` và menu tự gom nhóm.
- Gói nổi bật ("Khuyên dùng") để ở **khối** `PackageComparison` (chọn trong Puck), không để ở sản phẩm.

### 5.3 `services`

- `image` (media, bắt buộc alt), `audienceLabel` ("Dành cho chuyên gia & cá nhân"), `badge` ngắn. `situations[]`, `outcomes[]` đã có.

### 5.4 `testimonials`

- `age?`, `headline?` (chức danh hiện trên card – chỉ hiện khi `consent`), `photo` (đã có), `relatedOffer` (đã có – dùng làm nhãn "Gói đồng hành"),
- `story` nhóm tùy chọn: `before` (Trước / Vấn đề ban đầu), `insight?` (Quá trình nhận thức), `after` (Sau / Kết quả).
- Không đổi quy tắc `consent`.

### 5.5 `siteSettings`

- `hotline`, `officeAddress` (chỉ thành phố nếu Hana muốn), `facebookUrl`, `youtubeUrl`, `bookingCallUrl` (link gọi 15 phút nếu Q4 chốt có), `founderSignature` (media).
- `quizCtaPath` – đã nằm trong BACKLOG T1-14, làm luôn.

### 5.6 `leads`

- `currentStatus` (B2C: "Tình trạng hiện tại", select do Hana sửa danh sách trong `siteSettings`), `interestedService` (relation `services`), `interestedPackage` (relation `products`) – để nút "Chọn gói này" ghi lại gói quan tâm (Q3).
- B2B: `contactRole` (HRD / L&D Manager / CEO…), `interestedProgram` (relation `programs`). Các trường B2B cũ giữ nguyên.
- Tag `newsletter` cho form newsletter.

### 5.7 Collection mới (có điều kiện)

- `faqs` – nếu Q9 = có: `question`, `answer` (rich text giới hạn), `group` (chung / lộ trình / coaching / sản phẩm số / doanh nghiệp), `order`, `status`.
- `teamMembers` – chỉ nếu Q8 có người thật: `name`, `role`, `specialty`, `bio`, `photo`, `order`, `published` (cần đồng ý của người đó).

---

## 6. Đường dẫn và chuyển hướng (đề xuất, chờ Q2)

| Mục menu                        | Đường dẫn mới                        | Hiện tại                  | Loại                      |
| ------------------------------- | ------------------------------------ | ------------------------- | ------------------------- |
| Trang chủ                       | `/`                                  | `/`                       | Puck                      |
| Sản phẩm (trang tổng, tùy chọn) | `/san-pham`                          | –                         | Puck, mới                 |
| Chuyển mình không chênh vênh    | `/lo-trinh-chuyen-minh`              | `/coaching/growth-mirror` | Puck, đổi slug + 301      |
| EQ Buddy                        | `/eq-buddy`                          | `/eq-buddy`               | ứng dụng, giữ             |
| Habit Hack                      | `/habit/1-percent-better`            | như cũ                    | ứng dụng, giữ             |
| Coach 1:1 (cá nhân)             | `/coaching`                          | `/coaching`               | Puck, dựng lại            |
| Doanh nghiệp (tổng)             | `/doanh-nghiep`                      | `/doanh-nghiep`           | Puck, dựng lại            |
| DN – EQ / Habit                 | `/doanh-nghiep/[slug]`               | như cũ                    | `programs`, nội dung mới  |
| DN – Coach 1:1                  | `/coaching/thinking-mirror`          | `/coaching/[slug]`        | `services`, giữ           |
| Về Trạm                         | `/ve-tram`                           | `/ve-hana`                | Puck, đổi slug + 301      |
| Tài nguyên                      | `/tai-nguyen`                        | `/thu-vien`               | ứng dụng, đổi + 301       |
| Tài nguyên chi tiết             | `/tai-nguyen/[slug]`, `/blog/[slug]` | như cũ                    | giữ                       |
| Cộng đồng của Trạm              | `/cong-dong`                         | –                         | Puck, chờ Q10             |
| Liên hệ                         | `/lien-he`                           | –                         | Puck, mới                 |
| Câu hỏi thường gặp              | `/cau-hoi-thuong-gap`                | –                         | ứng dụng (`faqs`), chờ Q9 |

Ràng buộc kỹ thuật:

- `/tai-nguyen` hiện là tiền tố của `/tai-nguyen/[slug]` – trang tổng và trang chi tiết dùng chung tiền tố, không xung đột route.
- Hằng `GROWTH_MIRROR_PATH` và mọi link trong email, trang đơn, quiz, sitemap.xml phải đổi theo; giữ 301 vĩnh viễn cho link cũ đã gửi qua email / in ấn.
- Không đổi đường dẫn `/eq-buddy/the/[qrSlug]` (QR đã in).
- Trang Puck do Hana dựng: đổi slug bằng script có kiểm tra (không ghi đè trang đã sửa); seed chỉ **tạo mới** trang còn thiếu.

---

## 7. UI/UX – hướng dẫn chung cho mọi task SM

1. Dùng skill `tdcx-brand` trước mọi việc UI. Mockup là **hướng bố cục**, không phải spec pixel: màu, font, icon, khoảng cách theo brand book (M10–M12).
2. Mockup chỉ có desktop. Mỗi khối mới phải có bản 375px: lưới 4 cột → 1 cột (2 cột ở 768px); bảng giá 3 cột → cuộn ngang có cột tiêu đề dính, hoặc 3 card xếp dọc; menu con "Sản phẩm" → accordion trong menu mobile.
3. Menu con desktop: mở bằng hover **và** click/bàn phím (Enter, Esc, Tab), `aria-expanded`, không mất khi rê chuột chéo.
4. Carousel: không tự chạy, có nút trước/sau và chấm, vuốt được trên mobile, tôn trọng `prefers-reduced-motion`.
5. Nút trên gói: theo M2 – không có nút "mua" trực tiếp nếu Q3 chưa đổi.
6. Khối lấy dữ liệu (`PackageCards`, `ServiceCards`, `SolutionEcosystem`, `ContactInfo`, `TestimonialGrid`) chỉ lưu ID trong `puckData` (AGENTS 5B).
7. Khối nâng cấp: tăng `version`, viết migration Puck, test migration chạy trên `puckData` của trang seed + trang thật đang có (không làm hỏng trang Hana đã dựng).
8. Mọi chữ cố định mới (nhãn nút, aria) vào `src/lib/i18n/vi.ts`; nhãn trong editor Puck tiếng Việt.
9. Section thiếu dữ liệu thật (testimonial, logo, đội ngũ, số liệu) → không render gì trên trang công khai; trong editor hiện ghi chú "Chưa có dữ liệu".
10. Lighthouse mobile trang chủ ≥ 90 (trang chủ mới dài gấp 3 bản cũ: ảnh dưới màn hình đầu phải lazy, chỉ ảnh hero `priority`).

---

## 8. Ảnh hưởng tới phần đã làm

| Phần                    | Ảnh hưởng                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| e2e Playwright          | Test menu, đường dẫn `/thu-vien`, `/ve-hana`, `/coaching/growth-mirror` phải cập nhật     |
| `docs/HUONG_DAN_CMS.md` | Thêm: menu con, các khối mới, trang FAQ, thông tin liên hệ                                |
| AGENTS.md 8.1           | Cập nhật menu, tên gói, trang con sau khi Hana chốt (Planning làm, không phải agent code) |
| Email đã gửi có link cũ | Giữ 301                                                                                   |
| GĐ 3 (EQ Buddy)         | Không ảnh hưởng luồng; chỉ đổi mục menu                                                   |
| Quiz CTA                | Đổi sang `siteSettings.quizCtaPath` (BACKLOG T1-14)                                       |

---

## 9. Lộ trình đề xuất

Chạy song song với GĐ 3 (khác vùng file: GĐ 3 ở `eq-buddy/`, SM ở Web 1 + Puck). 🔒 Migration dùng chung → SM-01 xếp hàng sau T3-04.

```
Hana trả lời Q1–Q13 + gửi nội dung thật (SM-00)
        │
SM-01 CMS schema (🔒 Migration) ───────────────┐
        │                                     │
SM-02 Menu con + đường dẫn mới + 301          │
        │                                     │
SM-03 Khối Puck đợt A (trang chủ + lộ trình) ─┤
SM-04 Khối Puck đợt B (Về Trạm + Coach 1:1)  ─┤  (SM-03, SM-04 song song, khác file)
        │                                     │
SM-05 Trang Tài nguyên + newsletter           │
SM-06 Trang Liên hệ + FAQ dùng chung          │
        │
SM-07 Mẫu trang + dựng trang MẪU [HANA nhập nội dung thật]
        │
SM-08 Cộng đồng + trang DN (khi có nội dung) · QA tổng · HUONG_DAN_CMS
```

Ước lượng thô (chưa gồm thời gian chờ Hana): SM-01 6–8 h · SM-02 6 h · SM-03 12–16 h · SM-04 10–12 h · SM-05 8 h · SM-06 6–8 h · SM-07 6 h · SM-08 6 h + nội dung. Tổng khoảng **60–70 h code**, 2–3 tuần với 2 agent.

Cổng nghiệm thu Sitemap v2: Hana tự mở menu "Sản phẩm" trên điện thoại và máy tính, vào đủ các trang trong cây mục 1.1; tự sửa 1 mục menu con, 1 FAQ, 1 tagline gói, 1 số điện thoại liên hệ trong CMS và thấy trang cập nhật; không còn link cũ nào báo 404.
