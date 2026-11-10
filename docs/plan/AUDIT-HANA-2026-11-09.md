# Rà soát website của Hana (09/11/2026) – phân tích và kế hoạch

Nguồn: file `Audit_Website_Tram_Dung_Cam_Xuc_20261109.xlsx` Hana gửi 10/11, sheet "Rà soát nội dung", 22 mục (mã 01–24, thiếu 23). Mục 22 kèm 1 ảnh chụp. **Không commit file Excel**; chữ của Hana chép nguyên văn ở cột "Hana đề xuất" để các task dùng đúng chữ.

Planning đã đối chiếu từng mục với code trên `main` @ `2f84a59f` (sau CD-04).

## Cách đọc

- **Hana (builder)**: Hana tự sửa trong trình dựng trang hoặc CMS, không cần code. Hướng dẫn ở phần A.
- **Code AU-0x**: cần task code. Prompt ở `docs/tasks/prompts/AU-0x.md`.
- **Hỏi**: cần Hana trả lời trước, xem phần C.

## Bảng 22 mục

| Mã | Trang / mục | Hana đề xuất (rút gọn – chữ đầy đủ ở phần D) | Ai làm | Ghi chú kỹ thuật |
| --- | --- | --- | --- | --- |
| 01 | Trang chủ / Định vị (hero) | Tiêu đề "CHUYỂN MÌNH KHÔNG CHÊNH VÊNH", làm nổi 2 chữ "Chuyển" – "Chênh"; mô tả mới; nút "Khám phá điểm nghẽn sự nghiệp" cuộn xuống mục 04 | Hana (chữ, nút, neo) + **Code AU-04** (tô màu từng chữ) | Tiêu đề 2 tầng hiện chỉ đổi màu theo dòng, chưa tô được từng chữ. Nút cuộn: dùng "ID neo" (tab Kiểu → Nâng cao) cho mục 04 rồi đặt link `#ten-neo` |
| 02 | Trang chủ / Dành cho… | Ẩn | Hana | Xoá khối hoặc tab Kiểu → Ẩn trên thiết bị |
| 04 | Trang chủ / Nỗi đau | Tiêu đề "Bạn đang thấy bản thân mắc kẹt ở đâu", giữ 4 trạng thái, câu hỏi mới, 2 nút: Điểm nghẽn Thói quen / Điểm nghẽn cảm xúc (link 2 công cụ) | Hana | 2 nút = `ButtonWidget` → `/habit/chan-doan` và `/eq-buddy` |
| 03 | Trang chủ / Giải pháp | Tiêu đề, mô tả mới; giữ 3 ô Clear – Build – Shine; nút "Tìm hiểu chi tiết lộ trình" | Hana | Khối `PackageCards`. Link nút hiện là `#` → đổi thành `/lo-trinh-chuyen-minh` |
| 05 | Trang chủ / Hành trình chuyển hoá | Bỏ nhãn "Phương pháp", thêm câu dẫn, giữ 5 bước | Hana | Khối `JourneySteps` |
| 06 | Trang chủ / Người đồng hành | Câu nghiêng + câu định vị mới; 3 điểm profile; bỏ 3 từ khoá, thay bằng lời chia sẻ "Khách hàng nói gì về Hana"; nút đặt lịch phiên 149.000đ → link Google Calendar | Hana (chữ, bỏ từ khoá, thêm khối lời chia sẻ) + **Hỏi C2** (đặt lịch) | `HanaStory`: để trống danh sách từ khoá thì ẩn. Lời chia sẻ: khối `TestimonialSlider`, chỉ lời có `consent = true` |
| 07 | Trang chủ / Hệ sinh thái | Bỏ | Hana | Xoá khối `SolutionEcosystem` |
| 08 | Trang chủ / FAQ → hết trang | Ẩn | Hana | Xoá các khối từ FAQ tới cuối trang |
| 09 | Menu (3 sọc) | Chỉ 3 mục: Sản phẩm (4 mục con, 2 mục có nhãn "Free"), Cộng đồng nuôi dưỡng Thân – Tâm, Liên hệ | Hana (menu) + **Code AU-04** (nhãn "Free") | Menu sửa ở CMS → Điều hướng. Mục menu chưa có ô nhãn / huy hiệu |
| 10 | Sản phẩm / Chuyển mình | Đổi thứ tự / chữ các phần; bỏ số "01 · 02…" ở nhãn; bỏ "05 Kiến trúc chương trình", "07", "08" và mọi phần sau 09; cuối trang: form "Đăng ký nhận brochure chi tiết" (email, SĐT) | Hana (chữ, xoá khối, nhãn) + **Code AU-04** (form) + **Hỏi C6** | Nhãn "01 · …" là ô "Nhãn" từng khối, Hana xoá được |
| 12 | EQ Buddy / Hướng dẫn | "Trạm dừng để lắng nghe" → "Dừng để vững vàng bước tới"; hướng dẫn 3 bước mới; câu nghiêng mới; nút "Đã hiểu & Tiếp tục trải nghiệm" → "Trải nghiệm" | **Code AU-02** (+ CMS) | Một phần chữ ở CMS "Nội dung EQ Buddy", phần còn lại ở `vi.ts` |
| 13 | EQ Buddy / Giới thiệu | Bỏ "Bộ thẻ chánh niệm…", "Bộ thẻ là gì", 4 ô mục đích; tiêu đề "BỘ THẺ EQ BUDDY"; câu 26 thông điệp mới; vào thẳng rút thẻ; sửa link Shopee; bỏ "Bước 2 lắng nghe tiếng lòng"; 3 biểu tượng Hít thở 3 hơi – Nghĩ về mong muốn hôm nay – Gọi tên cảm xúc hiện tại thay cho ô kể chuyện; giữ gợi ý chọn nhanh cảm xúc | **Code AU-02** + Hana (link Shopee) | Link Shopee: CMS → Nội dung EQ Buddy → "Đường dẫn mua bộ thẻ vật lý (Shopee)", hiện là `https://shopee.vn` (mặc định) |
| 14 | EQ Buddy / Kết quả (thẻ) | Bỏ "Mình đã lắng nghe bạn"; nhắc lại "Tôi đang: … / Tôi cảm thấy: …"; bỏ "Thẻ số…" và mã thẻ ở mọi chỗ; mặt sau: 3 câu hỏi kết nối nội tâm; câu nghiêng "Dừng để vững vàng bước tới"; "Mua công cụ số" → "Trở thành VIP Member (250.000 → 99.000)"; thêm nút Shopee và nút đặt lịch coaching 1-1 (149.000đ) | **Code AU-02** + **Hỏi C1, C2** | Giá đặt ở CMS sản phẩm (không ghi cứng) |
| 15 | Xây thói quen / Giới thiệu | Tiêu đề "XÂY THÓI QUEN DỰNG THƯƠNG HIỆU"; câu nghiêng; danh sách 4 dòng mới | Hana (form sản phẩm Habit Tracker số, tab "Trang giới thiệu" – PK-30) | |
| 16 | Xây thói quen / Giới thiệu | Bỏ 4 Module, thay bằng 3 giai đoạn Khám thói quen – Xây thói quen – Chuyển mình cùng thói quen | Hana (danh sách) + **Code AU-03** (nhãn "Module" → "giai đoạn") | Ô số liệu đang ghi cứng chữ "Module" |
| 17 | Xây thói quen / Giới thiệu | Bỏ "Habit Hack khác biệt" và "Câu hỏi thường gặp" | Hana (FAQ: xoá hết câu hỏi thì tự ẩn) + **Code AU-03** (mục "khác biệt") | Danh sách "khác biệt" để trống thì đang lấy chữ mặc định, không ẩn được |
| 18 | Xây thói quen / Công cụ | Bỏ nhãn "CONTENT CREATOR HUB"; bỏ thước 3 giai đoạn, bấm "Khám" thì hiện luồng khám; giờ AM/PM thay SA/CH; sửa lỗi ngày về đích; đổi nhãn "Cách tôi áp dụng" và 11 ví dụ kỹ thuật; "Nhận thẻ lên tàu" → "Nhận Habit Boarding Pass" | Hana (nhãn header: CMS "Nội dung Habit"; ví dụ kỹ thuật: CMS "Kỹ thuật") + **Code AU-01** (ngày, giờ) + **Code AU-03** (còn lại) | Lỗi ngày: `Step4IdentityHabit.tsx:70` tách chuỗi ngày có giờ theo dấu `-` → ra "07T00:00:00+07:00/12/2026" |
| 19 | Habit Boarding Pass | Hiện **nội dung đã ghi** cho từng quy luật (không chỉ tên quy luật), bố cục như vòng Habit Loop | **Code AU-03** | `BoardingPassCard.tsx` |
| 20 | Habit Boarding Pass | Để lại email bắt đầu hành trình 28 ngày; 2 nút: Trở thành VIP Member (250.000 → 99.000), Cần coach đồng hành 1:1 (149.000đ, link Calendar); câu trích mới | **Code AU-03** + **Hỏi C1, C2** | |
| 21 | Habit Boarding Pass | "Lưới 28 ngày theo dõi" → "Bảng Habit Hack 28 ngày"; 4 chế độ Đã bỏ phiếu / Thực hiện tối thiểu / Lỡ nhịp / Ngày nghỉ theo nhịp | **Code AU-03** | 4 trạng thái đã có trong dữ liệu (`voted / minimal / missed / rest`), chỉ đổi nhãn / hiển thị |
| 22 | Design đang bị overlap (ảnh) | Nút "Thấy công cụ này hữu ích" chồng lên nút ly cà phê | **Code AU-01** | `Dashboard28Days.tsx:1238` có nút nổi riêng, cùng góc với nút cà phê của toàn site (`FloatingActions.tsx`) |
| 11 | Cộng đồng | Bấm "Khám phá" thì hiện Cộng đồng – Lịch trình – Khoảnh khắc Me Time; **bỏ** "Tiếng nói cộng đồng"; nút Tham gia Me Time / Yoga Buddy: bấm thì gửi tên + SĐT Zalo | Hana (xoá khối lời chia sẻ) + **Code AU-04** (form tham gia) + **Hỏi C3** | Hiện "Khám phá" cuộn xuống phần tương ứng |
| 24 | Liên hệ | Tiêu đề mới; nút đặt lịch phiên trải nghiệm 1:1 149.000đ (link Calendar); liên hệ giải pháp doanh nghiệp (email / SĐT / công ty) | Hana (tiêu đề, khối `B2BBriefForm` có sẵn) + **Hỏi C2** | |

## A. Việc Hana tự làm trong builder / CMS (không chờ code)

Làm được ngay, theo thứ tự trang:

1. **Trang chủ** (builder): mục 01 (chữ + nút cuộn tới mục 04), 02, 03, 04, 05, 06 (trừ nút đặt lịch – chờ C2), 07, 08. Sửa bản nháp, xem trước 375 / 1440 rồi mới Xuất bản.
2. **Menu** (CMS → Điều hướng): mục 09 – 3 mục và 4 mục con. Nhãn "Free" thêm sau khi có AU-04.
3. **Trang Chuyển mình** (builder): mục 10 trừ form brochure.
4. **Habit Tracker số** (CMS → Sản phẩm → Habit Tracker số → tab "Trang giới thiệu"): mục 15, 16 (nhập 3 giai đoạn), 17 (xoá hết câu hỏi thường gặp).
5. **Nội dung Habit** (CMS): bỏ nhãn "CONTENT CREATOR HUB" ở phần đầu. **Kỹ thuật** (CMS): sửa ví dụ 11 kỹ thuật theo mục 18.
6. **Nội dung EQ Buddy** (CMS): sửa "Đường dẫn mua bộ thẻ vật lý (Shopee)" = `https://tinyurl.com/yc43suhc`.
7. **Cộng đồng** (builder): xoá khối "Tiếng nói cộng đồng Me Time".
8. **Liên hệ** (builder): tiêu đề mục 24, khối "Brief doanh nghiệp".

## B. Việc cần code (4 task)

| Task | Nội dung | Mục | Ước lượng | Phụ thuộc |
| --- | --- | --- | --- | --- |
| [AU-01](../tasks/prompts/AU-01.md) | **Gấp – lỗi:** ngày về đích sai định dạng; giờ AM/PM; 2 nút nổi chồng nhau trên bảng Habit | 18 (phần lỗi), 22 | 0,5 ngày | Không |
| [AU-02](../tasks/prompts/AU-02.md) | EQ Buddy: luồng giới thiệu – hướng dẫn – rút thẻ – kết quả theo góp ý | 12, 13, 14 | 1–1,5 ngày | C1, C2 cho nút mua / đặt lịch |
| [AU-03](../tasks/prompts/AU-03.md) | Xây thói quen: trang giới thiệu (nhãn giai đoạn, ẩn "khác biệt"), công cụ (bỏ thước, nhãn), Boarding Pass hiện nội dung đã ghi dạng Habit Loop, CTA, bảng 28 ngày | 16, 17, 18, 19, 20, 21 | 1,5–2 ngày | C1, C2 cho nút mua / đặt lịch; AU-01 trước |
| [AU-04](../tasks/prompts/AU-04.md) | Toàn site: tô màu từng chữ trong tiêu đề; nhãn "Free" cho mục menu; form "Tham gia" (tên + SĐT Zalo) và form "Nhận brochure"; 1 ô link đặt lịch dùng chung | 01, 09, 10, 11, (06, 14, 20, 24) | 1–1,5 ngày | C2, C3, C6 |

Thứ tự đề xuất: AU-01 ngay (lỗi đang thấy) → AU-04 (dùng chung cho các trang) → AU-02 và AU-03 (song song được nếu 2 máy).

## C. Câu hỏi cần Hana trả lời

| # | Câu hỏi | Ảnh hưởng |
| --- | --- | --- |
| C1 | **"Trở thành VIP Member (250.000 → 99.000)"**: VIP là mua **từng công cụ** (EQ Buddy riêng, Habit riêng – mỗi cái 99.000đ) hay **1 gói cho cả 2**? Còn 28 ngày dùng thử miễn phí không? 99.000đ là giá cố định hay khuyến mãi có hạn? | AU-02, AU-03. Giá đặt trong CMS sản phẩm, Hana tự nhập; code chỉ đổi chữ nút và luồng mua |
| C2 | **Đặt lịch phiên trải nghiệm 149.000đ qua Google Calendar**: khách trả 149.000đ **lúc nào**? (a) Bấm nút → mở thẳng Google Calendar, tiền thu ngoài web; hay (b) giữ như hiện tại: thanh toán VietQR trên web trước, sau đó mới nhận link Calendar qua email | AU-02, AU-03, AU-04, mục 06 / 14 / 20 / 24 |
| C3 | **Cộng đồng – "Click vô Khám phá thì hiện ra…"**: (a) cuộn xuống phần Me Time / Yoga Buddy như hiện tại; hay (b) bấm thì **mở ra ngay tại chỗ** phần Cộng đồng – Lịch trình – Khoảnh khắc, bấm lại thì đóng? | AU-04 |
| C4 | Form "Tham gia Me Time / Yoga Buddy" (tên + SĐT Zalo): sau khi khách gửi, Hana muốn nhận báo qua **email**? Khách thấy câu gì? Theo Nghị định 13, form phải có ô đồng ý chính sách bảo mật – đồng ý thêm ô này? Danh sách đăng ký hiện bắt buộc có email: hỏi thêm email trong form, hay chỉ tên + SĐT? | AU-04 |
| C5 | Tiêu đề "CHUYỂN MÌNH KHÔNG CHÊNH VÊNH" làm nổi 2 chữ "Chuyển" – "Chênh": tô màu **hồng sen** (magenta) cho 2 chữ đó, phần còn lại xanh thẫm – đúng ý? | AU-04 |
| C6 | Form "Đăng ký nhận brochure": có **file PDF brochure** để web tự gửi qua email không, hay chỉ ghi nhận email + SĐT để Hana liên hệ? | AU-04 |
| C7 | Nhãn **"Free"** ở EQ Buddy và Habit Hack trong menu: "Free" là phần dùng thử miễn phí, còn VIP Member trả phí – đúng không? | AU-04 |
| C8 | Mục 06 "dùng lại testi phiên bản trước": là những lời chia sẻ nào? Các lời đó đã có đồng ý hiển thị (`consent`) chưa? | Hana (builder) |
| C9 | Mục 18 "bỏ cái thước chi tiết 3 giai đoạn, chỉ cần click vào Khám thì hiện ra flow khám": bỏ cả thanh 4 bước nhỏ phía dưới (Khám đúng bệnh – Nguyên lý 1% – Tìm Mentor – Gọi tên thói quen) hay chỉ bỏ 3 thẻ giai đoạn lớn? | AU-03 |

### Kết quả trả lời 10/11 (Hana, qua anh Nhân)

| # | Trả lời | Hệ quả |
| --- | --- | --- |
| C1 | VIP Member là mua **từng công cụ**. 99.000đ là **khuyến mãi có hạn** | Hana nhập `salePrice` = 99.000, `saleEndsAt` trong CMS từng sản phẩm. Code đã hỗ trợ `saleEndsAt` (`src/lib/products.ts`): hết hạn thì tự về giá gốc. Nút hiện giá theo `saleEndsAt` |
| C1b | 28 ngày dùng thử còn hay bỏ: **chưa trả lời** | Giữ nguyên dùng thử như hiện tại |
| C2 | **Thanh toán VietQR trên web trước**, sau đó gửi link Calendar | Nút đặt lịch / coach 1:1 dẫn tới trang thanh toán phiên trải nghiệm (`getBookingPath`). Hana nhập link Calendar vào `siteSettings.experienceBookingUrl` (gửi qua email sau khi xác nhận thanh toán). AU-04 mục 4 rút gọn |
| C3 | **Cuộn xuống** như hiện tại | AU-04 bỏ mục 5 |
| C4 | Chưa trả lời | AU-04 mục 3 (form Tham gia): tạm hỏi tên + SĐT Zalo + **email** (vì `leads.email` bắt buộc), câu cảm ơn là field CMS, báo Hana qua email liên hệ trong `siteSettings` |
| C5 | Chưa trả lời | Tạm dùng **hồng sen** cho chữ nổi bật |
| C6 | Chỉ thu **email + SĐT** để Hana liên hệ | AU-04: form brochure chỉ tạo `leads`, không gửi file |
| C7 | "Tất cả free" | Nhãn "Free" hiện cho cả 2 công cụ. **Cần làm rõ:** nếu công cụ miễn phí hết thì VIP Member 99.000đ mở thêm gì? Tới khi rõ, giữ nguyên dùng thử / quyền truy cập như hiện tại |
| C8 | Hana tự làm trong CMS | – |
| C9 | Bỏ 3 thẻ giai đoạn lớn, phần "Khám" làm thành **wizard từng bước** | AU-03 mục 2 |

**Còn cần Hana trả lời:** C1b (dùng thử 28 ngày), C4 (form Tham gia), C5 (màu chữ nổi bật), C7 (VIP mở thêm gì khi công cụ "tất cả free").

## D. Chữ của Hana (nguyên văn, để các task dùng đúng chữ)

> Chép từ cột "Đề xuất chỉnh sửa". Giữ nguyên lỗi gõ của file gốc ở chỗ không chắc; chỗ đã sửa chính tả ghi trong ngoặc vuông.

**01 – Trang chủ / Định vị**
- Tiêu đề: `CHUYỂN MÌNH KHÔNG CHÊNH VÊNH` (làm nổi "Chuyển" – "Chênh").
- Mô tả: `Đồng hành cùng phụ nữ đi qua chuyển mình trong sự nghiệp với sự thấu hiểu bản thân, vững vàng trong từng lựa chọn và tỏa sáng bằng thế mạnh riêng.`
- Nút: `Khám phá điểm nghẽn sự nghiệp` (thay "Quiz 5 phút"), bấm thì cuộn xuống mục 04.

**04 – Trang chủ / Nỗi đau**
- Tiêu đề: `Bạn đang thấy bản thân mắc kẹt ở đâu`. Giữ 4 trạng thái.
- Câu hỏi: `Bạn thực sự muốn tìm được lối ra nhưng chưa biết bắt đầu từ đâu?`
- 2 nút: `Điểm nghẽn Thói quen` – `Điểm nghẽn cảm xúc` (link tới 2 công cụ).

**03 – Trang chủ / Giải pháp**
- Tiêu đề: `Lộ trình đào tạo - khai vấn & hướng nghiệp dành riêng cho phụ nữ`
- Mô tả: `Không có phụ nữ kém cỏi, chỉ có những phụ nữ chưa dành đủ sự ưu tiên cho chính mình để từng bước tỏ tường - tự tin - tỏa sáng.`
- Giữ 3 ô Clear – Build – Shine. Nút: `Tìm hiểu chi tiết lộ trình`.

**05 – Trang chủ / Hành trình chuyển hoá**
- Bỏ nhãn "Phương pháp". Tiêu đề: `HÀNH TRÌNH CHUYỂN HÓA`.
- Câu dẫn: `Là một người giỏi, bạn không thiếu lý thuyết để thay đổi bản thân. Thứ bạn cần là một lộ trình tiếp cận đủ khoa học nhưng cũng tôn trọng nhịp điệu riêng.` Hiện 5 bước.

**06 – Trang chủ / Người đồng hành**
- Câu nghiêng: `Mọi điều tốt đẹp luôn có sẵn bên trong, khi bạn cho phép mình dùng tài sản quan trọng nhất của mình: MỘT KHOẢNG DỪNG.`
- Câu định vị: `Niềm tin này đã thôi thúc Hana tạo ra không gian và những công cụ thiết thực giúp phụ nữ nuôi dưỡng trí tuệ cảm xúc, hình thành thói quen tích cực để chúng mình được sống một cuộc sống trọn vẹn hơn.`
- 3 điểm trong profile. Bỏ 3 từ khoá; dùng lại lời chia sẻ bản trước: `Khách hàng nói gì về Hana`.
- Nút: `Đặt lịch phiên tìm hiểu - 30 phút để bạn gọi tên được vấn đề mình đang mắc kẹt trong sự nghiệp` (phiên trải nghiệm 149.000đ), link Calendar `https://calendar.app.google/gLuPgDnqAbFnjDPQ8`.

**09 – Menu**
1. `SẢN PHẨM` (không cần ghi cá nhân / doanh nghiệp):
   - `Chuyển mình không chênh vênh - Lộ trình đào tạo và khai vấn chuyên sâu`
   - `Tập thương cảm xúc - Bộ thẻ thông điệp EQ Buddy` (nhãn Free)
   - `Xây thói quen - Dựng thương hiệu - Tài liệu tự học và công cụ Habit Hack` (nhãn Free)
   - `Career Clarity Coaching - Gói khai vấn chuyên sâu`
2. `CỘNG ĐỒNG NUÔI DƯỠNG THÂN-TÂM`
3. `LIÊN HỆ`

**10 – Sản phẩm / Chuyển mình** (đi theo thứ tự này, giọng người kể chuyện, giống blog hơn slide)
1. `Phụ nữ thời đại AI đứng trước một bước chuyển mình lớn....`
2. "Cô ấy là ai" → `Bạn có thường mất ngủ nhiều đêm vì tâm tư này?`
3. `3 kiểu chênh vênh....`
4. Câu chuyện không của riêng ai: `Chuyển mình là hành trình khó khăn bạn luôn cần đi qua để trưởng thành.` / `Nhưng bạn hoàn toàn có thể đi qua nó mà KHÔNG CHÊNH VÊNH.`
   - Bỏ hết các số `01-02-03-04-05…`.
5. `CHUYỂN MÌNH KHÔNG CHÊNH VÊNH` / `Lộ trình đào tạo - khai vấn & hướng nghiệp dành riêng cho phụ nữ` / `Giúp phụ nữ đi qua bước chuyển mình trong sự nghiệp với 3 năng lực lõi: nội lực vững chãi, hành động bền bỉ, xây dựng mối quan hệ hài hòa tính nam-tính nữ.`
   - `PHASE 1 - Đào tạo và đồng hành qua 3 chương trình`: `01 · Xây thói quen – Dựng thương hiệu`, `02 · Tập thương cảm xúc`, `03 · Giao tiếp hài hòa tính nam - tính nữ`.
   - `PHASE 2 - Khai vấn về sự nghiệp chuyên sâu 1-1`.
   - Bỏ phần "05 kiến trúc chương trình" (trùng).
- "Một vòng lặp…" → `Phương pháp triển khai và hành trình chuyển hóa` (chỉ giữ 06 – 09, bỏ 07 – 08).
- Bỏ hết phần sau; cuối trang: `Đăng ký nhận brochure chi tiết` (mail, SĐT) → `Em sẽ liên hệ trực tiếp.`

**12 – EQ Buddy / Hướng dẫn**
- `Trạm dừng để lắng nghe` → `Dừng để vững vàng bước tới.`
- `Hướng dẫn: 3 bước để "dừng" và kết nối nội tâm mỗi ngày`
  1. `Gọi tên mong muốn và cảm xúc: Dành 3 hơi thở để thả lỏng và gọi tên mong muốn cho hôm nay. Chia sẻ cảm xúc bạn đang có ngay lúc này.`
  2. `Chọn thông điệp: Rút ngẫu nhiên thông điệp phù hợp với mình, đọc và cảm nhận`
  3. `Khám phá: Lật thẻ sang mặt sau để được gợi mở bằng những câu hỏi đào sâu - kết nối. Khuyến khích đào sâu với coach, người thương hoặc có thời gian chất lượng cho bản thân.`
- Câu nghiêng: `Đằng sau mỗi cảm xúc đều là một thông điệp đang chờ đợi bạn khám phá bằng sự chân thành và đón nhận trọn vẹn.`
- Nút: `Đã hiểu & Tiếp tục trải nghiệm` → `Trải nghiệm`.

**13 – EQ Buddy / Giới thiệu**
- Bỏ `Bộ thẻ chánh niệm & Trí tuệ cảm xúc (EQ)`. `Trạm dừng cảm xúc` → `BỘ THẺ EQ BUDDY`.
- `26 thông điệp cùng bạn Gói ghém cảm xúc - Ghi nhận nỗ lực - Gợi nhớ bài học ý nghĩa mỗi ngày.`
- Bỏ "Bộ thẻ là gì", bỏ 4 ô mục đích. Không cần "bỏ qua hướng dẫn và rút thẻ ngay" mà qua thẳng rút thẻ.
- Link Shopee: `https://tinyurl.com/yc43suhc`.
- Bỏ "Bước 2 lắng nghe tiếng lòng".
- 3 biểu tượng: `Hít thở 3 hơi` – `Nghĩ về mong muốn hôm nay` – `Gọi tên cảm xúc hiện tại`, thay cho chỗ "Hôm nay bạn đang… kể cho mình nghe…". Giữ gợi ý chọn nhanh cảm xúc.

**14 – EQ Buddy / Kết quả**
- Bỏ `Mình đã lắng nghe bạn`. Nhắc lại phần khách gõ và cảm xúc: `Tôi đang: …` / `Tôi cảm thấy: …`.
- Bỏ `Thẻ số…`. Mặt sau: bỏ mã `TDCX-22…`. Mọi thẻ đều bỏ mã.
- `Hãy tự vấn dịu dàng cùng bản thân` → `3 câu hỏi kết nối nội tâm`.
- Câu nghiêng: `Dừng để vững vàng bước tới.`
- `Mua công cụ số` → `Trở thành VIP Member` (250.000 → 99.000).
- Thêm nút: `Mua bộ thẻ trên Shopee`; `Đặt lịch coaching 1-1` (149.000đ phiên trải nghiệm) → link Google Calendar.

**15 – Xây thói quen / Giới thiệu**
- `Habit Hack 1% Better Mỗi Ngày` → `XÂY THÓI QUEN DỰNG THƯƠNG HIỆU`.
- Câu nghiêng: `Con đường xây dựng thương hiệu cá nhân bền vững bằng chính những hành động nhỏ, nhất quán.`
- `Bộ tài liệu tự học và công cụ theo dõi thói quen:`
  - `✓ 20 video bài giảng ngắn (5–7 phút) để hiểu đúng về thói quen`
  - `✓ 11 kỹ thuật tạo lập thói quen`
  - `✓ Tracker 28 ngày thực hành xây thói quen`
  - `✓ Quan trọng nhất: Lộ trình 3 giai đoạn hiểu đúng - tạo lập và theo dõi thói quen được hướng dẫn từng bước`

**16** – Thay 4 Module bằng 3 giai đoạn: `Khám thói quen` – `Xây thói quen` – `Chuyển mình cùng thói quen`.

**17** – Bỏ "Habit Hack khác biệt" và "Câu hỏi thường gặp".

**18 – Xây thói quen / Công cụ**
- Bỏ `CONTENT CREATOR HUB • TRẠM DỪNG CẢM XÚC`. Bỏ thước 3 giai đoạn; bấm "Khám" thì hiện luồng khám.
- "Việc này thường diễn ra lúc mấy giờ": dùng AM / PM thay SA / CH.
- Lỗi "Ngày về đích" hiện `07T00:00:00+07:00/12/2026`.
- Kỹ thuật – ví dụ / "Cách tôi áp dụng" (theo từng kỹ thuật):
  - Soi lại nhịp sinh học: `Thói quen tốt tôi nhận ra: ...` (gợi ý: `Ngồi thiền`), thay cho "Ví dụ… / Cách tôi áp dụng".
  - Ghép thói quen mới: ví dụ `Ghép thói quen đọc sách với thói quen ngồi thiền`; cách tôi áp dụng `Ngay sau khi ngồi thiền xong thì đọc sách`.
  - Hẹn thói quen cụ thể: ví dụ `6:00AM tại bàn làm việc`; cách tôi áp dụng `6:00AM tại bàn làm việc`.
  - Môi trường ảnh hưởng: ví dụ `Đọc sách ở gần cửa sổ vì tôi thích ánh sáng tự nhiên`.
  - Nghi thức tạo động lực: ví dụ `Mở một bản nhạc mình yêu thích`.
  - Bộ đôi thói quen: ví dụ `Đọc sách có kèm ghi chú bài học mình yêu thích`.
  - Quy tắc 2 phút (chính là thói quen nguyên tử bạn muốn bắt đầu ở Giai đoạn 1): ví dụ `Mỗi ngày đọc 1-2 trang sách, hoặc 5 phút`.
  - Tự động hóa cam kết: ví dụ `Đặt hẹn giờ vào 6:00am mỗi sáng`.
  - Chọn phần thưởng theo gu: ví dụ `Đọc sách xong thì tự thưởng 5 phút lướt Tiktok`.
  - Ghi nhận mình mỗi lần thực hiện: ví dụ `Điền vào bảng Habit Hack để ghi nhận mình hôm nay`.
  - Đôi bạn cùng tiến: ví dụ `Nhắn tin cho chồng để đánh dấu hôm nay đã thực hiện cam kết`.
- `Nhận thẻ lên tàu` → `Nhận Habit Boarding Pass`.

**19 – Habit Boarding Pass**: chỗ "4 quy luật đã chọn" thể hiện **nội dung tôi đã ghi**, không chỉ tên quy luật ("Lúc này tôi quan tâm tôi làm như thế nào 1 cách chi tiết"). Bố cục mô tả lại như hình Habit Loop cho trực quan.

**20 – Habit Boarding Pass**
- `Để lại email để bắt đầu hành trình 28 ngày hình thành thói quen`
- 2 nút: `Trở thành VIP Member` (250.000 → 99.000) – `Cần coach đồng hành 1:1` (149.000đ phiên trải nghiệm, link Calendar).
- `"Thói quen là lãi kép của sự tự hoàn thiện."` → `Mỗi hành động bạn thực hiện là một lá phiếu cho con người bạn muốn trở thành.`

**21 – Habit Boarding Pass**: `Lưới 28 ngày theo dõi` → `Bảng Habit Hack 28 ngày`; 4 chế độ: `Đã bỏ phiếu` / `Thực hiện tối thiểu` / `Lỡ nhịp` / `Ngày nghỉ theo nhịp`.

**22** – Design đang bị overlap (ảnh: nút "Thấy công cụ này hữu ích" chồng lên nút ly cà phê).

**11 – Cộng đồng**: bấm "Khám phá" thì hiện Cộng đồng – Lịch trình – Khoảnh khắc Me Time; **bỏ** Tiếng nói cộng đồng. `Tham gia ME TIME` – `THAM GIA YOGA BUDDY`: bấm thì gửi tên – SĐT Zalo.

**24 – Liên hệ**
- Tiêu đề: `MỖI KHOẢNG DỪNG ĐƯỢC SỬ DỤNG ĐÚNG CÁCH SẼ TẠO RA SỰ CHUYỂN HÓA MẠNH MẼ CHO HÀNH TRÌNH CHUYỂN MÌNH`
- `Đặt lịch phiên trải nghiệm 1:1 - 149.000` (link Calendar) – `Liên hệ giải pháp cho doanh nghiệp` (email / SĐT / công ty).
