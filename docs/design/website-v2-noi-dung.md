# Nội dung website v2 (chép từ file thiết kế "Sơ đồ cấu trúc website Trạm Dừng Cảm Xúc", 62 trang)

Planning chép chữ từ file thiết kế của designer (07/11/2026) để máy dựng mẫu trang (PK-22). File gốc không đưa vào repo.

**Quy ước:**

- `[MẪU]` = chưa xác thực / chưa có đồng ý. Giữ nguyên `[MẪU]`, Hana thay bằng nội dung thật.
- `→ CMS` = lấy từ dữ liệu CMS (sản phẩm, dịch vụ, cài đặt trang), **không** ghi cứng.
- **Không có** trang "Lộ trình chuyển mình không chênh vênh" (tr. 15–22): Hana đang sửa nội dung, chờ chốt.
- Trang Habit Tracker, EQ Buddy, Sản phẩm doanh nghiệp: thiết kế chưa có nội dung (tr. 23–24).

---

## 1. Trang chủ (tr. 3–12) → mẫu `home-v2`

### 1.1 Hero: `HeroTwoEntries`, bố cục hàng, ảnh bên phải mép sóng (PK-20)

- Nhãn: `HERO SECTION` → bỏ (chỉ là nhãn của designer).
- Dòng 1: `Hiểu mình rõ. Hành động bền bỉ.`
- Dòng 2: `Tỏa sáng bằng thế mạnh riêng.`
- Mô tả: `Trạm dừng cảm xúc nơi cung cấp giải pháp Khai vấn và Đào tạo ứng dụng Thông minh cảm xúc (EQ) & Habit Formation dành riêng cho sự phát triển của cá nhân và doanh nghiệp.`
- Lối vào 1:
  - nhãn `Cho cá nhân`;
  - tiêu đề `Phát triển Năng lực & Sự nghiệp`;
  - nút `Khám phá các lộ trình` → `/lo-trinh-chuyen-minh`.
- Lối vào 2:
  - nhãn `Cho doanh nghiệp`;
  - tiêu đề `Nâng tầm Năng lực Đội ngũ`;
  - nút `Nhận tư vấn giải pháp` → `/doanh-nghiep`.
- Ảnh: `[MẪU]` (ảnh Hana đứng lớp, Hana chọn trong Thư viện).

### 1.2 Lộ trình khai vấn đặc biệt: `IconCardGrid`, 3 cột, thẻ giữa `outline` (PK-20) + `CTAButton`

> Phần CLEAR / BUILD / SHINE gắn với trang Chuyển mình đang chờ chốt. Dựng khung, chữ thẻ để `[MẪU]` nếu Hana chưa chốt; nút trỏ `/lo-trinh-chuyen-minh`.

- Nhãn: `Lộ trình khai vấn đặc biệt`. Tiêu đề: `Chuyển mình không chênh vênh`.
- Dòng cảm xúc: `"Một lộ trình được thiết kế riêng biệt giúp bạn bước qua giai đoạn chuyển giao sự nghiệp với sự thấu suốt, tự tin và một hệ thống thói quen vững vàng."`
- 3 thẻ (icon / tiêu đề / dòng phụ / mô tả): `[MẪU]` CLEAR, BUILD, SHINE.
- Nút: `Tìm hiểu chi tiết lộ trình` → `/lo-trinh-chuyen-minh`.

### 1.3 Đồng cảm & nhận diện: `IconCardGrid` 4 cột (icon) + `QuoteBlock` tối + `CTAButton`

- Nhãn: `Đồng cảm & nhận diện`. Tiêu đề: `Bạn đang ở giai đoạn...`

| Thẻ | Tiêu đề               | Mô tả                                                          |
| --- | --------------------- | -------------------------------------------------------------- |
| 1   | Chuyển mình sự nghiệp | Đang cân nhắc hướng đi mới nhưng cảm thấy mông lung.           |
| 2   | Thiếu tự tin thể hiện | Có năng lực nhưng khó làm cho giá trị của mình được nhìn thấy. |
| 3   | Thiếu sự quyết liệt   | Muốn thay đổi bản thân nhưng chưa đủ dứt khoát hành động.      |
| 4   | Khó khăn công sở      | Gặp bế tắc trong việc thiết lập ranh giới và mối quan hệ.      |

- Trích dẫn (dải xanh thẫm): `"Bạn thực sự muốn bước ra, nhưng chưa biết cần nhìn lại điều gì, chuẩn bị thế nào hoặc duy trì hành động ra sao."`
- Nút: `Công cụ chẩn đoán - Miễn phí` → `/habit/chan-doan`.

### 1.4 Phương pháp: `JourneySteps` kiểu Vòng tròn, bước 5 nổi bật

- Nhãn: `Phương pháp`. Tiêu đề: `Hành trình chuyển hóa`.

| Bước | Tên      | Tên phụ             | Mô tả                                                        |
| ---- | -------- | ------------------- | ------------------------------------------------------------ |
| 01   | Pause    | Dừng lại & Quan sát | Tạo không gian phản tư an toàn để đánh giá hiện trạng.       |
| 02   | Feel     | Kết nối cảm xúc     | Nhận diện các tín hiệu từ bên trong thông qua lăng kính EQ.  |
| 03   | Name     | Gọi tên vấn đề      | Phân tích các mô thức, niềm tin giới hạn và nhu cầu cốt lõi. |
| 04   | Choose   | Lựa chọn chủ đích   | Thiết lập mục tiêu và mở rộng các giải pháp khả thi.         |
| 05   | Practice | Thực hành bền bỉ    | Ứng dụng Habit Formation để tạo ra sự thay đổi thực tế.      |

### 1.5 Người sáng lập: `HanaStory` bố cục "Ảnh trong khung cong", tone tối, ảnh phải

- Nhãn: `Người sáng lập`. Dòng 1: `Coach Hana Lương`.
- Chức danh: `Growth Mirror & Learning Implementation Partner`.
- Trích dẫn: `Những điều đẹp đẽ luôn bắt đầu khi bạn cho phép mình dừng lại.`
- Nội dung: `Sứ mệnh: Tạo ra không gian và công cụ giúp phụ nữ nuôi dưỡng trí tuệ cảm xúc, hình thành thói quen tích cực và phát triển một cuộc sống trọn vẹn hơn.`
- Chip: `Dịu dàng`, `Tin cậy`, `Truyền cảm hứng`.
- Nút: `Xem thêm` → `/ve-tram`.
- Ảnh: `[MẪU]`.

### 1.6 Bảo chứng chuyên môn: `StatsBar` 3 ô

- Nhãn: `Bảo chứng chuyên môn`. Tiêu đề: `Nền tảng vững vàng`.
- Ô 1: `10+` · `Năm kinh nghiệm` · `Thiết kế trải nghiệm học tập & chương trình phát triển năng lực.`
- Ô 2: icon huy chương · `ICF ACC` · `PCC Candidate. Chứng chỉ Khai vấn chuẩn quốc tế.`
- Ô 3: `500+` · `Giờ Coaching` · `Đồng hành cùng phụ nữ hướng nội và người giỏi chuyên môn.`
- Số liệu và chứng chỉ để Hana xác nhận lại trước khi xuất bản (AGENTS §14).

### 1.7 Câu chuyện khách hàng: `TestimonialGrid` `quote`, vạch màu `cycle` (PK-20)

- Nhãn: `Tiếng nói chuyển hóa`. Tiêu đề: `Câu chuyện khách hàng`.
- Lời chia sẻ: lấy từ collection `testimonials` (chỉ `consent = true`). Mẫu **không** chép tên / ảnh / câu trong thiết kế.

### 1.8 Hệ sinh thái giải pháp: `SolutionEcosystem` bố cục "Theo nhóm" (PK-19)

- Nhãn: `Sản phẩm & dịch vụ`. Tiêu đề: `Hệ sinh thái giải pháp toàn diện`.
- Mô tả: `Ứng dụng chuyên sâu Thông minh Cảm xúc (EQ) và Kiến tạo Thói quen (Habit Formation) vào các lộ trình Đào tạo và Khai vấn, đáp ứng linh hoạt nhu cầu phát triển của cá nhân và tổ chức.`
- **Cột 1** `Đào tạo cá nhân`: `Các chương trình học tập thiết kế riêng giúp bạn tự chủ trên hành trình phát triển.`
  - Nhóm khung hồng, badge `Signature program`, tiêu đề `Chuyển mình không chênh vênh` (3 gói → CMS).
  - Nhóm `Phát triển Năng lực Cốt lõi (Masterclass)`: EQ Mastery, Habit Formation → CMS.
- **Cột 2** `Khai vấn chuyên sâu (1:1)`: `Không gian đồng hành cá nhân hóa, bảo mật tuyệt đối, tháo gỡ điểm nghẽn.`
  - `1. Dành cho Chuyên gia / Cá nhân chuyển nghề` (Growth Mirror → CMS);
  - `2. Dành cho Quản lý / Lãnh đạo (Leadership)` (Thinking Mirror → CMS);
  - nút `Đặt lịch Phiên Khám phá 1:1`.
- **Cột 3** `Giải pháp Doanh nghiệp`: `Đối tác triển khai học tập (Learning Partner), chuyển hóa kiến thức thành hành vi.`
  - `1. EQ for Leadership & Team` → CMS;
  - `2. Habit Formation in Action` → CMS;
  - nút `Nhận Tư vấn Giải Pháp`.

### 1.9 FAQ: `FAQ` thẻ liên hệ có ảnh, nhãn viên, + / − (PK-19)

- Nhãn: `FAQs`. Tiêu đề: `Câu hỏi thường gặp`.
- Mô tả: `Giải đáp các thắc mắc phổ biến về các chương trình và dịch vụ của Trạm Dừng Cảm Xúc. Để nhận tư vấn chuyên sâu, vui lòng đặt lịch trao đổi cùng đại diện của chúng tôi.`
- Thẻ liên hệ:
  - tiêu đề `Đặt lịch gọi 15 phút`;
  - mô tả `Mình sẽ giúp bạn chọn đúng giải pháp theo từng giai đoạn.`;
  - nút `Đặt lịch ngay`;
  - email **→ CMS** (siteSettings).
- Câu hỏi: nguồn **theo nhóm từ CMS**. 5 câu trong thiết kế (câu trả lời đầy đủ chỉ có câu 1, Hana nhập vào collection Câu hỏi thường gặp):
  1. `Trạm Dừng Cảm Xúc phù hợp với ai?` → `Phù hợp với phụ nữ hướng nội, người làm chuyên môn đang ở bước chuyển sự nghiệp, cần một không gian an toàn để nhìn lại, hiểu rõ thế mạnh và tìm ra hướng đi rõ ràng hơn thay vì chỉ giải quyết phần ngọn.`
  2. `Các chương trình Khai vấn tại Trạm khác gì so với tư vấn thông thường?`
  3. `Mình cần chuẩn bị gì trước khi book lịch Coaching?`
  4. `Trạm Dừng Cảm Xúc có cung cấp khóa đào tạo in-house về EQ không?`
  5. `Sản phẩm số và tài liệu của Trạm có thể truy cập như thế nào?`

### 1.10 Quà tặng + Liên hệ: `Columns` 2 cột

- **Trái:** nhãn `Lead magnet`, tiêu đề `Quà tặng miễn phí`, `LeadMagnetCarousel` dạng danh sách (PK-21) → CMS.
  - Thiết kế có 2 mục: "Công cụ chuẩn đoán thói quen trong 5 phút" và "Ebook & Bộ công cụ EQ". Lưu ý: "chuẩn đoán" → **"chẩn đoán"**.
- **Phải:** nhãn `Liên hệ & đặt lịch`, `ContactForms` dạng tab, tiêu đề `Bắt đầu hành trình`, tab `Cá nhân` / `Doanh nghiệp`, nút `Đặt lịch khám phá`.

---

## 2. Trang Coach 1:1 (tr. 26–32) → mẫu `coach`

### 2.1 Hero: `HeroImage` split, chip, số liệu, ảnh có thẻ chú thích (PK-20)

- Nhãn: `Executive & Personal Coaching`. Dòng 1: `Khai vấn chuyên sâu (1:1 Coaching)`.
- Mô tả: `"Tấm gương phản chiếu" (Mirror) trung thực và sắc bén nhất. Chúng tôi tạo ra không gian đồng hành bảo mật, giúp bạn tháo gỡ những rào cản nội tâm và đưa ra quyết định sáng suốt tại các thời khắc quan trọng.`
- Nút: `Đặt lịch Phiên Khám phá ngay`.
- Chip: `Bảo mật tuyệt đối`, `Tiêu chuẩn Quốc tế`.
- Số liệu: `100%` Bảo mật thông tin · `1 : 1` Đồng hành sâu sắc · `Chuyển hóa` Từ gốc rễ nội tâm.
- Chú thích ảnh: `Không gian an toàn` / `Bộc lộ & tháo gỡ rào cản`.

### 2.2 Vì sao 1:1: `Columns` (`IconCardGrid` 2×2 + `Card` ảnh có nhãn)

- Nhãn: `Empathy & Need Identification • Why 1:1 coaching?`. Tiêu đề: `Bạn đang đối mặt với những lựa chọn khó khăn?`
- 4 thẻ:
  - `Ngã rẽ Sự nghiệp`: `Bạn đang đứng trước những quyết định quan trọng và cần một góc nhìn khách quan, sắc bén để định hình hướng đi?`
  - `Áp lực Lãnh đạo`: `Mới đảm nhận vai trò Quản lý/Lãnh đạo và cảm thấy quá tải khi phải tự mình đưa ra các quyết định mang tính chiến lược?`
  - `Thể hiện Giá trị`: `Giỏi chuyên môn, giàu ý tưởng nhưng gặp vướng mắc và rào cản trong việc khẳng định giá trị bản thân trong tổ chức?`
  - `Không gian An toàn`: `Cần một nơi hoàn toàn riêng tư để bộc lộ những tâm tư không thể tỏ cùng sếp, đồng nghiệp hay người thân?`
- Thẻ ảnh:
  - nhãn ảnh `✨ Giải pháp may đo 1:1`;
  - tiêu đề `Tại sao bạn cần một Chuyên gia Đồng hành Chuyên sâu?`;
  - nội dung `Khác với các khóa học chung, Khai vấn 1:1 mang lại không gian cá nhân hóa tuyệt đối. Nơi mọi góc khuất nội tâm, áp lực quản trị và rào cản sự nghiệp của riêng bạn được tháo gỡ trực tiếp cùng chuyên gia.`;
  - nút `Đặt lịch Phiên Khám phá ngay (100% Bảo mật)`.

### 2.3 Hai tấm gương: `ServiceCards` `detailed` (PK-21) → CMS `services`

- Nhãn: `Our 1:1 solutions • Lộ trình khai vấn chuyên sâu`. Tiêu đề: `Chọn "tấm gương" phản chiếu phù hợp với bạn`.
- Thẻ 1 `Growth Mirror` · `Dành cho chuyên gia & cá nhân` · `Từ tỏ tường đến hành động`:
  - Phù hợp với: Phụ nữ hướng nội, làm chuyên môn giỏi / Đang mông lung, muốn chuyển hướng sự nghiệp / Thiếu tự tin vào định hướng mới;
  - Kết quả: Nhìn nhận đúng giá trị bản thân / Phá vỡ niềm tin giới hạn / Tự tin bước ra khỏi vùng an toàn.
- Thẻ 2 `Thinking Mirror` · `Dành cho lãnh đạo & quản lý` · `Phản chiếu tư duy lãnh đạo`:
  - Phù hợp với: Nữ quản lý mới thăng chức / Lãnh đạo chuyển giao tổ chức / Đối mặt áp lực hiệu suất & con người;
  - Kết quả: Làm chủ trí tuệ cảm xúc (EQ) / Thiết lập ranh giới chuyên nghiệp / Giải quyết xung đột nhân sự.
- Hai danh sách trên nhập vào `situations[]` / `outcomes[]` của dịch vụ trong CMS. Mẫu chỉ chọn dịch vụ.

### 2.4 Phương pháp tiếp cận: `Columns` (`IconCardGrid` dạng danh sách + ảnh có nhãn)

- Nhãn: `The coaching approach • Phương pháp tiếp cận`. Tiêu đề: `Điều gì diễn ra trong không gian 1:1 của chúng tôi?`
- 3 mục:
  - `Không lời khuyên áp đặt`: `Coach không đóng vai trò "chỉ đường", mà sử dụng kỹ năng đặt câu hỏi sâu (Deep Questioning) để giúp bạn tự khám phá và tìm ra câu trả lời phù hợp nhất với hệ giá trị cốt lõi của chính mình.`
  - `Ứng dụng EQ & Khoa học Hành vi`: `Mọi vấn đề sự nghiệp đều được soi chiếu thấu đáo qua lăng kính Cảm xúc. Đồng thời, thiết lập các bài tập nhỏ (Micro-practice) sau mỗi phiên để tạo nên những chuyển hóa thực tế bền vững.`
  - `Bảo mật theo chuẩn Quốc tế (ICF)`: `Mọi câu chuyện và thông tin chia sẻ trong phiên đều được bảo mật tuyệt đối theo Quy tắc Đạo đức nghiêm ngặt của Liên đoàn Khai vấn Quốc tế (ICF).`
- Nhãn ảnh: `✨ Tiêu chuẩn khai vấn`.

### 2.5 Câu chuyện thực tế: `TestimonialGrid` `stages` → CMS

- Nhãn: `Social proof • Câu chuyện thực tế`. Tiêu đề: `Những người trong cuộc nói gì?`
- **Không** chép tên / chức danh / nội dung trong thiết kế (chưa xác thực).

### 2.6 Quy trình: `Columns` (`JourneySteps` dạng danh sách + ảnh có nhãn `✨ Minh bạch & hiệu quả`)

- Nhãn: `How we work • Quy trình hợp tác`. Tiêu đề: `Quy trình đồng hành chuẩn mực`.
- 5 bước:
  1. `Đăng ký`: `Điền form thông tin để xác định sự phù hợp ban đầu.`
  2. `Phiên Khám phá (Discovery Session)`: `Cuộc gọi 30–45 phút để làm rõ mục tiêu và đánh giá mức độ tương thích giữa Coach – Coachee.`
  3. `Thiết kế Lộ trình`: `Lên kế hoạch số lượng phiên (thường từ 3-6-12 phiên) dựa trên vấn đề cốt lõi.`
  4. `Khai vấn & Thực hành`: `Tiến hành các phiên Coaching (Online/Offline) kết hợp bài tập duy trì thói quen giữa các phiên.`
  5. `Đánh giá & Tổng kết`: `Đo lường sự thay đổi và chuyển giao công cụ để khách hàng tự bước tiếp.`

### 2.7 Đặt lịch: `Columns` (`ContactForms` 1 form `personal` (PK-21) + `Card` ảnh có thẻ chú thích) + `Callout` dải

- Nhãn: `Booking & final step • Đặt lịch hẹn`. Tiêu đề: `Bước vào không gian của riêng bạn`.
- Form:
  - các ô: Họ và tên, Email liên hệ, Số điện thoại, Lộ trình bạn đang quan tâm (Growth Mirror / Thinking Mirror), Bạn đang trăn trở điều gì nhất trong sự nghiệp/công việc hiện tại?;
  - nút `Đặt lịch Phiên Khám phá`;
  - dòng dưới: `Thông tin của bạn được mã hóa và bảo mật tuyệt đối.`
- Thẻ ảnh:
  - nhãn `✨ Kết nối bảo mật`;
  - tiêu đề `Sẵn sàng cho bước chuyển mới?`;
  - nội dung `Phiên trải nghiệm 1:1 giúp bạn trực tiếp gỡ bỏ các vướng mắc sự nghiệp cùng Chuyên gia Khai vấn. Phí trải nghiệm …` (giá **→ CMS**, không ghi số).
- Dải ghi chú: `TRẠM DỪNG CẢM XÚC: **Hành trình vạn dặm** bắt đầu từ một quyết định dũng cảm thấu hiểu chính mình.`

---

## 3. Trang Về Trạm (tr. 34–42) → mẫu `about`

### 3.1 Hero: `HeroImage` split, số liệu, chú thích ảnh có avatar (PK-20)

- Nhãn: `Trạm Dừng Cảm Xúc`. Dòng 1: `Nơi mọi sự chuyển hóa bắt đầu từ bên trong`.
- Mô tả: `Trạm Dừng Cảm Xúc là tổ chức chuyên sâu về Khai vấn và Đào tạo ứng dụng Thông minh Cảm xúc (EQ) & Habit Formation. Chúng tôi kiến tạo môi trường để cá nhân bứt phá sự nghiệp và doanh nghiệp xây dựng đội ngũ hiệu suất cao.`
- Nút: `Khám phá ngay`.
- Số liệu: `[MẪU] 01` Tiên phong về EQ · `[MẪU] 500+` Học viên chuyển mình · `[MẪU] 100%` Tâm huyết đồng hành.
- Chú thích ảnh: `Cộng đồng EQ & Habit Formation`.

### 3.2 Brand story: `Columns` (`QuoteBlock` + `RichText` + `IconCardGrid` số + `Card` ảnh có chú thích)

- Nhãn: `Brand story`. Tiêu đề: `Tại sao lại là "Trạm dừng"?`
- Trích dẫn: `Những điều đẹp đẽ luôn bắt đầu khi bạn cho phép mình dừng lại.`
- Đoạn: `Giữa nhịp sống và công việc hối hả, con người thường lao đi để tìm kiếm kết quả. Nhưng Trạm tin rằng dừng lại không phải là lùi bước, mà là để tạo ra một khoảng không an toàn (Safe Space).`
- 3 thẻ số:
  - `01 Quan sát`: `Tĩnh lặng để nhìn nhận rõ ràng cảm xúc, suy nghĩ và phản ứng của chính mình trong mọi hoàn cảnh.`
  - `02 Thấu hiểu`: `Lắng nghe nhu cầu nội tại, thấu cảm sâu sắc với bản thân để tìm lại sự cân bằng vốn có.`
  - `03 Vững bước`: `Đưa ra những lựa chọn sắc bén, sáng suốt và tiến về phía trước với sự tự tin trọn vẹn.`
- Chú thích ảnh: `Khoảng Không An Toàn` / `Safe Space for Transformation`.

### 3.3 Tầm nhìn – Sứ mệnh – Giá trị: `VisionMission` + `IconCardGrid` 4 cột (icon brand, không emoji)

- Nhãn: `Corporate identity`. Tiêu đề: `Tầm nhìn - Sứ mệnh - Giá trị cốt lõi`.
- Tầm nhìn: `Hệ sinh thái học tập & khai vấn hàng đầu` – `Nơi EQ và Thói quen tích cực trở thành nhịp đập tự nhiên trong mỗi cá nhân và doanh nghiệp.`
- Sứ mệnh:
  - Với cá nhân: `Trở thành "Tấm gương phát triển" (Growth Mirror) giúp tháo gỡ điểm nghẽn và định hướng sự nghiệp.`
  - Với doanh nghiệp: `Trở thành "Đối tác chuyển hóa" (Learning Implementation Partner) đưa kiến thức thành hành vi thực tế.`
- Giá trị cốt lõi:
  - `Gentle – Dịu dàng & Tinh tế`: `Đồng hành an toàn, tôn trọng và không phán xét.`
  - `Trustworthy – Đáng tin cậy`: `Năng lực chuyên môn vững vàng và chuẩn mực.`
  - `Empowering – Trao quyền`: `Khai phóng và kích hoạt nội lực tự thân.`
  - `Reflective – Tự phản tư`: `Khuyến khích sự chiêm nghiệm và thấu hiểu sâu sắc.`

### 3.4 Khung 5 bước: `JourneySteps` kiểu Thẻ, bước 3 nổi bật + `Callout` dải

- Nhãn: `Phương pháp`. Tiêu đề: `Khung chuyển hóa 5 bước (The 5-step framework)`.
- Mô tả: `Sự kết hợp nền tảng giữa Khai vấn tâm lý (EQ) và Khoa học Hành vi (Habit Formation) giúp kiến tạo chuyển hóa bền vững.`
- 5 bước:
  - `Pause` – `Dừng lại & Quan sát` – `Dừng lại giữa nhịp sống hối hả để quan sát hiện trạng, nhận diện rõ ràng cảm xúc và suy nghĩ hiện tại.`
  - `Feel` – `Cảm nhận & Lắng nghe` – `Gọi tên chính xác và thấu cảm với các cảm xúc đang hiện diện mà không phán xét hay né tránh.`
  - `Name` – `Nhận diện mô thức` – `Khám phá các gốc rễ, mô thức tư duy lặp lại và những niềm tin giới hạn đang cản trở sự phát triển.`
  - `Choose` – `Lựa chọn con đường` – `Chủ động ra quyết định sáng suốt và kiến tạo phản ứng mới phù hợp với giá trị mục tiêu.`
  - `Practice` – `Rèn luyện bền vững` – `Xây dựng hệ thống thói quen nhỏ (Micro-practice) hằng ngày để duy trì sự chuyển hóa lâu dài.`
- Dải: `MÔ HÌNH KHAI VẤN: Kết hợp giữa nhận thức cảm xúc chiều sâu (EQ) và thực thi thói quen kỷ luật (Habit Formation) giúp tối ưu hiệu suất cá nhân & tổ chức.`

### 3.5 Lời chào từ nhà sáng lập: `HanaStory` bố cục `letter`

- Nhãn: `Founder's message`. Tiêu đề: `Lời chào từ nhà sáng lập`.
- Nội dung:
  - `Chào bạn, tôi là Hana Lương. Với hơn 10 năm kinh nghiệm trong ngành thiết kế trải nghiệm học tập và đào tạo doanh nghiệp, tôi đã có cơ hội đồng hành cùng hàng ngàn cá nhân và tổ chức trên hành trình khai phóng tiềm năng.`
  - `Tại Trạm Dừng Cảm Xúc, chúng tôi cam kết mang đến một không gian an toàn (Safe Space) cùng phương pháp khoa học chuẩn mực, giúp bạn cởi bỏ giới hạn, kiến tạo thói quen tích cực và bền vững chuyển hóa từ bên trong.`
- Trích dẫn: `Từ quá trình quan sát hàng ngàn giờ huấn luyện, tôi nhận ra kiến thức chỉ dừng ở bề mặt nếu thiếu đi trí tuệ cảm xúc và môi trường nuôi dưỡng thói quen. Trạm ra đời để lấp đầy khoảng trống đó.`
- Lời chào cuối: `Trân trọng & Đồng hành,`. Chữ ký: `Hana Lương` (Playfair nghiêng, không font viết tay).
- Chú thích ảnh: `Hana Lương` / `Founder & Master Coach`.
- "Hàng ngàn" là con số Hana tự nói về mình. Hana xác nhận trước khi xuất bản.

### 3.6 Đội ngũ: `TeamGrid` → CMS `teamMembers`

- Nhãn: `Đồng hành & kiến tạo sự chuyển hóa`. Tiêu đề: `Đội ngũ chuyên gia`.
- Đoạn giới thiệu:
  - `Trạm Dừng Cảm Xúc tự hào sở hữu đội ngũ chuyên gia, chuyên viên Khai vấn (Coach) được đào tạo bài bản, kết hợp chuyên môn sâu sắc về EQ và ứng dụng thiết kế trải nghiệm học tập cho tổ chức.`
  - `Sứ mệnh: Cung cấp không gian và hệ thống công cụ giúp cá nhân và tổ chức phát triển tư duy, xây dựng thói quen hiệu suất cao.`
- Chip: `Chuyên môn`, `Tin cậy`, `Đồng hành`.
- Thành viên: **không** chép người / ảnh trong thiết kế.

### 3.7 Tiêu chuẩn quốc tế: `Columns` (`Card` + 2 `Stat`) + `Callout` dải

- Nhãn: `Certifications & standards`. Tiêu đề: `Tiêu chuẩn quốc tế. Văn hóa thuần Việt.`
- Mô tả: `Cam kết chất lượng vượt trội thông qua việc tuân thủ khắt khe các chuẩn mực khai vấn quốc tế kết hợp cùng sự thấu hiểu sâu sắc văn hóa doanh nghiệp Việt Nam.`
- Thẻ `Chuẩn mực Khai vấn ICF` – `International Coach Federation`:
  - đoạn: `Toàn bộ đội ngũ chuyên gia tuân thủ khắt khe Tiêu chuẩn Đạo đức và Khung năng lực cốt lõi từ Liên đoàn Khai vấn Quốc tế (ICF).`
  - ý 1: `Đội ngũ đạt chuẩn ACC / PCC: Đội ngũ Coach được cấp chứng chỉ uy tín toàn cầu.` (`[MẪU]` cho tới khi Hana xác nhận cả đội có chứng chỉ);
  - ý 2: `Bảo mật & Tôn trọng: Cam kết an toàn thông tin tuyệt đối trong mọi phiên khai vấn.`
- Số liệu: `10+ năm` Kinh nghiệm Thiết kế Chương trình L&D · `Hàng ngàn giờ` Huấn luyện & Đào tạo Thực tế (Hana xác nhận).
- Dải: `BẢO CHỨNG CHẤT LƯỢNG: **Kết hợp chuẩn mực quốc tế ICF** cùng phương pháp khoa học mang lại hiệu quả chuyển hóa đo lường được.`

### 3.8 Đối tác: `StatsBar` + `LogoStrip` nhóm + `Callout` dải

- Nhãn: `Partners & network`. Tiêu đề: `Những tổ chức đã tin tưởng Trạm`.
- Mô tả: `Trạm Dừng Cảm Xúc tự hào đồng hành cùng các tập đoàn, doanh nghiệp và tổ chức hàng đầu trong hành trình phát triển trí tuệ cảm xúc & nâng cao hiệu suất.`
- Số liệu: `[MẪU] 50+` · `[MẪU] 10.000+` · `[MẪU] 98%` (chưa xác thực).
- Nhóm logo:
  - `Mạng lưới đối tác Strategic & Corporate`;
  - `Tổ chức giáo dục & Đơn vị truyền thông`.
  - Mỗi nhóm `[MẪU] Đối tác 1…5`. **Không** dùng tên Techcombank, Vinamilk, FPT, VietinBank, Unilever, RMIT, VnExpress, Vietcetera, VTV1, Brands VN khi chưa có xác nhận hợp tác.
- Dải: `CAM KẾT CHẤT LƯỢNG: Thiết kế chương trình may đo theo nhu cầu cốt lõi của từng doanh nghiệp.`

### 3.9 Bắt đầu: `TwoPathCards` + `Callout` dải

- Nhãn: `Get started`. Tiêu đề: `Sẵn sàng để bắt đầu hành trình của bạn?`
- Mô tả: `Dù bạn đang tìm kiếm sự đột phá cá nhân hay một giải pháp đào tạo toàn diện cho tổ chức, chúng tôi luôn ở đây để lắng nghe.`
- Thẻ 1 `Dành cho Cá nhân`:
  - mô tả `Khai phóng tiềm năng tự thân, thấu hiểu cảm xúc và xây dựng hệ thói quen tích cực bền vững.`;
  - `Quyền lợi đồng hành`: Khai vấn 1-1 chuyên sâu cùng Master Coach / Lộ trình rèn luyện thói quen thiết kế riêng / Tham gia cộng đồng thực hành EQ an toàn;
  - nút `Xem các Lộ trình Cá nhân` → `/lo-trinh-chuyen-minh`.
- Thẻ 2 `Dành cho Doanh nghiệp`:
  - mô tả `Giải pháp nâng cao trí tuệ cảm xúc lãnh đạo và tối ưu hóa hiệu suất làm việc cho đội ngũ.`;
  - `Giải pháp may đo`: Đào tạo Leadership & Corporate EQ / Khai vấn nhóm & Thiết kế Workshop / Đo lường mức độ chuyển hóa hành vi;
  - nút `Liên hệ Tư vấn Doanh nghiệp` → `/doanh-nghiep`.
- Dải: `TRẠM DỪNG CẢM XÚC: **Không gian an toàn** cùng phương pháp khoa học giúp bạn chuyển hóa bền vững.`

---

## 4. Trang Tài nguyên (tr. 44–46) → mẫu mới `resources` (trang dựng bằng Puck, nếu Hana muốn thay trang code `/tai-nguyen`)

- **4.1** Nhãn `Resources & knowledge hub`, tiêu đề `Thư viện tri thức & công cụ`.
  - Mô tả: `Nơi lưu giữ những bài viết chuyên sâu và các công cụ thực hành miễn phí, giúp bạn nuôi dưỡng Trí tuệ Cảm xúc (EQ), xây dựng thói quen và vững bước trên con đường sự nghiệp.`
  - `LeadMagnetCarousel` (có form) → CMS.
- **4.2** Nhãn `SEO articles & blog • Góc nhìn chuyên gia`, tiêu đề `Bài viết chuyên đề`.
  - `LibraryPreview` `featured` (PK-21) → CMS.
  - Dải: `TRẠM DỪNG CẢM XÚC: **Tài nguyên miễn phí** giúp bạn xây dựng thói quen tích cực và phát triển bản thân mỗi ngày.`
- **4.3** Nhãn `Weekly newsletter & insights`, tiêu đề `Nuôi dưỡng nội lực mỗi tuần`.
  - Mô tả: `Đăng ký nhận bản tin (Newsletter) hàng tuần từ Trạm Dừng Cảm Xúc để cập nhật những bài viết, podcast và công cụ thực hành mới nhất.`
  - `NewsletterForm` với 3 ý:
    - `Bài viết Chuyên sâu`: `Góc nhìn quản trị cảm xúc, tâm lý học ứng dụng và khoa học thói quen từ các chuyên gia.`
    - `Podcast & Âm thanh Trầm lắng`: `Những cuộc trò chuyện chữa lành và suy ngẫm giúp bạn tĩnh lặng giữa nhịp sống hối hả.`
    - `Công cụ Thực hành Miễn phí`: `Nhận ngay các Template, Toolkit rèn luyện EQ và theo dõi thói quen hàng tuần.`
  - Icon brand, không emoji. Podcast chỉ giữ nếu Trạm đã có.
- **4.4** `CTASection` nền xanh thẫm: `Đã sẵn sàng cho những bước đi sâu hơn?` – `Chuyển hóa kiến thức thành kết quả thực tế với các lộ trình đồng hành chuyên sâu của chúng tôi.`
  - 2 nút: `Khám phá Lộ trình Chuyển mình (Cá nhân)`, `Nhận Tư vấn Giải pháp B2B (Tổ chức)`.

---

## 5. Trang Cộng đồng của Trạm (tr. 48–56) → mẫu `community`

### 5.1 Hero: `HeroImage` backdrop tối, ảnh nền `[MẪU]`

- Nhãn (Playfair nghiêng): `Không gian an toàn để thuộc về`. Dòng 1: `Cộng đồng của Trạm`.
- Mô tả: `Những điểm chạm nhỏ giúp bạn chăm sóc Thân - Tâm và bắt đầu ngày mới nhất quán.`

### 5.2 Chọn không gian: `IconCardGrid` dạng trượt (PK-21), vạch màu (PK-20)

- Tiêu đề: `Chọn không gian của bạn`. Dòng cảm xúc: `Tự nguyện đến. Tôn trọng nhịp riêng.`
- Thẻ:
  - `Cộng đồng · Me Time · "Thương mình theo cách riêng" · Khởi đầu ngày mới lúc 5:00 AM mỗi ngày.` · `Khám phá` → `#me-time`;
  - `Cộng đồng · Yoga Buddy · Chăm sóc thân tâm thông qua yoga · Trải thảm 8:30 AM Thứ 3 & Thứ 5.` · `Khám phá` → `#yoga-buddy`;
  - `Coming soon · Không gian mới · Những trạm dừng mới đang được ấp ủ để đồng hành cùng bạn.`

### 5.3 Me Time (`anchorId: me-time`): `ImageText` ảnh phải, nền `soft-pink`

- Nhãn `Cộng đồng`, dòng 1 `Me Time`, trích dẫn `"Thương mình theo cách riêng."`.
- Nội dung:
  - `Tôn Chỉ "Me" First`: `Chưa đủ sẵn sàng thì không cần bắt mình vào link. Tự do rời đi khi cần.`
  - `You Always Can Miss ONE`: `Cho phép mình làm biếng 1 ngày. Mai chúng mình sẽ lại ở đây.`
- Ảnh `[MẪU]`.

### 5.4 Lịch trình 5:00 AM: `IconCardGrid` 3 cột, vạch màu `cycle`

- `5:00 - 5:10 · We Time · Check-in đầu ngày. Cùng nghe một đoạn nhạc tĩnh tâm.`
- `5:10 - 5:50 · Me Time của tui · Làm điều mình thích. Cho mình, vì mình. Viết lách hoặc thiền định.`
- `5:50 - 6:00 · You & Me · Check-out. Cùng bốc thẻ và chọn thông điệp thương mình.`

### 5.5 Tiếng nói cộng đồng Me Time: `TestimonialGrid` `featured` (PK-21), nền `lavender-mist`

- Lời chia sẻ → CMS (chỉ `consent = true`). **Không** chép tên / câu trong thiết kế.

### 5.6 Khoảnh khắc Me Time: `PhotoGallery` mosaic (PK-21)

- Ảnh `[MẪU]`. Ảnh có người: chỉ dùng khi đã có đồng ý của người trong ảnh.

### 5.7 Yoga Buddy (`anchorId: yoga-buddy`): `ImageText` ảnh trái tràn mép (PK-21)

- Nhãn `Cộng đồng`, dòng 1 `Yoga Buddy`, trích dẫn `Mỗi lần trải thảm là một lần chăm sóc Thân - Tâm.`
- Nội dung:
  - `Duyên đã hội tụ đủ để tụi mình có mặt ở đây. Một cuộc hẹn nhỏ để trải thảm, có người cùng tập, cùng nhắc nhau dành thời gian cho bản thân giữa những bận rộn.`
  - `Nếu bạn từng tập rồi bỏ dở, Yoga Buddy sẽ giúp bạn dễ quay lại hơn.`

### 5.8 Cuộc hẹn 8:30 sáng thứ 3 & 5: `Columns` 2 `Card` có vạch màu, nền `soft-pink`

- **Hành trình 30 Phút:**
  - `05 phút kết nối`: `Ngồi thoải mái, nghe nhạc, cảm nhận cơ thể và năng lượng sáng nay.`
  - `20 phút chuyển động`: `Khởi động nhẹ. Tập 6 vòng Chào Mặt Trời. Thư giãn cùng sự hướng dẫn.`
  - `05 phút lắng nghe`: `Check-in cảm xúc. Bốc một thẻ thông điệp gửi vào ngày mới.`
- **Vài điều giữ cho nhau:**
  - `Tôn trọng nhịp riêng`: `Tập chậm hơn, giảm số vòng hoặc nghỉ giữa chừng. Tập theo trạng thái hôm ấy.`
  - `Lỡ một buổi, hẹn buổi sau`: `Không áy náy hay tập bù. Điểm đến là nuôi dưỡng cơ thể và thói quen.`
  - `Trân trọng cuộc hẹn`: `Cố gắng đúng giờ. Chuẩn bị sẵn thảm. Tắt micro khi cùng tập.`

### 5.9 Góc nhỏ Yoga Buddy: `PhotoGallery`, ảnh `[MẪU]`

### 5.10 CTA: `CTASection` nền **xanh thẫm** (thiết kế dùng đen, ngoài brand book)

- Dòng cảm xúc: `Nuôi dưỡng một tâm trí vững vàng từ những thói quen nhỏ nhất.`
- Tiêu đề: `Trở thành một phần của bộ lạc`.
- Nút `Tham gia Me Time`, `Tham gia Yoga Buddy`: link nhóm **→ CMS** (siteSettings / trang Cộng đồng). Chưa có link thì để `#`, ghi vào báo cáo.

---

## 6. Trang Liên hệ (tr. 58–62) → mẫu `contact`

### 6.1 Hero: `Columns` (`RichText` trong thẻ + 2 `Card` icon + `Card` ảnh có nhãn `✨ Không gian kết nối`)

- Nhãn `Get in touch • Trạm Dừng Cảm Xúc`, tiêu đề `Lắng nghe để kiến tạo sự chuyển hóa`.
- Đoạn: `Dù bạn đang tìm kiếm một lộ trình bứt phá cho cá nhân hay một giải pháp đào tạo toàn diện để nâng tầm đội ngũ, Trạm Dừng Cảm Xúc luôn ở đây, sẵn sàng đồng hành cùng bạn.`
- Thẻ:
  - `Đồng hành 1:1`: `Lộ trình thiết kế riêng thấu hiểu từng nhu cầu.`
  - `Giải pháp toàn diện`: `Nâng tầm đội ngũ & phát triển bền vững.`

### 6.2 Kênh liên hệ: `ContactInfo` → CMS

- Nhãn `Quick contact info • Thông tin liên hệ trực tiếp`, tiêu đề `Kết nối nhanh chóng cùng Trạm Dừng Cảm Xúc`.
- Mô tả: `Chúng tôi luôn sẵn sàng lắng nghe và đồng hành cùng bạn. Chọn kênh liên hệ thuận tiện nhất để bắt đầu cuộc trò chuyện ngay hôm nay.`
- Email / Hotline–Zalo / Địa điểm / Mạng xã hội: **→ siteSettings**. Số "0930-000-000" trong thiết kế là số giả, không dùng.
- Câu phụ:
  - Email: `Gửi email trực tiếp để nhận phản hồi chi tiết trong 24h làm việc.`
  - Hotline: `Kênh hỗ trợ & tư vấn nhanh qua Zalo Official / Hotline trực tiếp.`
  - Địa điểm: `Không gian làm việc & khai vấn riêng tư, hiện đại, hỗ trợ đặt lịch trước.`
- Mạng xã hội:
  - LinkedIn `Trạm Dừng Cảm Xúc / Growth Coach`;
  - Facebook `Trạm Dừng Cảm Xúc`;
  - YouTube & Podcast `Chia sẻ góc nhìn & chuỗi nội dung chuyển hóa` (link → CMS).

### 6.3 Form phân luồng: `ContactForms` `columns`

- Nhãn `Segmented contact forms • Phân luồng form liên hệ`, tiêu đề `Chúng tôi có thể hỗ trợ bạn như thế nào?`
- Cá nhân (B2C):
  - mô tả `Đặt lịch Khai vấn 1:1, tư vấn khóa học hoặc hỗ trợ liên quan đến sản phẩm số/tài liệu.`;
  - nút `Gửi yêu cầu hỗ trợ`.
- Doanh nghiệp (B2B):
  - mô tả `Gửi brief để thiết kế chương trình đào tạo EQ & Habit Formation riêng biệt cho đội ngũ.`;
  - nút `Gửi yêu cầu Thiết kế chương trình`.

### 6.4 FAQ nhanh: `FAQ` `quick` (PK-21) + nút "Xem toàn bộ"

- Nhãn `FAQ quick links • Hỗ trợ nhanh`, tiêu đề `Bạn cần giải đáp nhanh?`
- Mô tả: `Tiết kiệm thời gian tìm kiếm thông tin bằng cách xem nhanh giải đáp cho các câu hỏi phổ biến bên dưới.`
- Câu hỏi → CMS. Trong thiết kế có 1 câu **trái chính sách**, **không** đưa vào:
  - `Chính sách hoàn hủy và thanh toán…` ghi "thẻ ATM/Visa" và "hoàn tiền trong 7 ngày";
  - Trạm **không có hoàn tiền** và chỉ nhận **chuyển khoản VietQR** (AGENTS §1, §14);
  - Hana viết lại câu này.
- Hai câu còn lại dùng được:
  - `Hướng dẫn kích hoạt khóa học/sản phẩm số tải về ở đâu?` → `Ngay sau khi thanh toán thành công, bạn sẽ nhận được email hướng dẫn chi tiết kèm đường dẫn truy cập kho tài liệu số.`
  - `Tôi chưa biết chọn gói Khai vấn 1:1 nào, làm sao để được tư vấn?` → `Bạn có thể liên hệ trực tiếp qua Zalo/Hotline hoặc gửi form đăng ký tư vấn ngắn để đội ngũ xếp lịch trao đổi 15 phút miễn phí.`
- Nút: `Xem toàn bộ Câu hỏi thường gặp` → `/cau-hoi-thuong-gap`.
