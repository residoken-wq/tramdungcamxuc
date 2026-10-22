# Họp 20/10/2026 – Puck kéo thả khối con + Habit Hack 28 ngày

Nguồn: biên bản họp 20/10 (anh Nhân). Planning phân tích 20/10 trên `main` @ `7c00c0d`.

1. **CMS Puck Editor**: kéo thả các khối con trong khối lớn. Mỗi khối con chỉnh được định dạng, ảnh đại diện, **cỡ chữ** và **màu chữ**.
2. **Habit Hack**: phân tích theo workflow "Xây Thói Quen – Dựng Thương Hiệu" (trang tham chiếu) và bộ code freelance (`DIGITAL_PRODUCT.zip`).

---

## Phần 1 – Puck: khối con kéo thả được (track PK, giao PC nhà)

### Hiện trạng

- Puck `@puckeditor/core` **0.23.0**. Có sẵn:
  - field `slot`: khối con là khối Puck thật, kéo / chọn / nhân bản / xóa được ngay trên canvas;
  - sửa chữ trực tiếp trên canvas (`contentEditable` cho text / textarea / richtext).
- Chỉ **`Columns`** dùng slot (`src/puck/blocks/Columns.tsx`). Các khối khác lưu thẻ / bước / số liệu / câu hỏi trong field `array`. Item của `array` chỉ sắp xếp được ở **cột phải**, không kéo được trên canvas. Đây đúng là chỗ Hana phản ánh.
- **Chưa khối nào có field màu chữ hay cỡ chữ.** 34/41 khối có `bgColor` (6 màu nền) + `padding` S/M/L. Màu chữ hiện tự suy ra từ nền.
- Đã có helper ảnh `createMediaExternalField()` (`src/puck/media-field.tsx`): chỉ chọn ảnh có mô tả ảnh, chỉ lưu ID. Riêng `ImageText` còn một bản chép tay.

### Hướng làm

- **Khối có thẻ / bước lặp lại** đổi từ `array` sang **slot + khối con nhỏ**: `Card`, `Stat`, `Step`… Mỗi container chỉ nhận đúng loại khối con của nó (`allow`). Làm trước cho `IconCardGrid`, `StatsBar`, `JourneySteps`, `ServiceCards`, sau đó `PackageCards`, `FAQ`. `Columns` cũng nhận các khối con mới.
- **Khối lấy dữ liệu từ Payload** giữ nguyên `array` / chọn ID: `ProductGrid`, `Testimonial*`, `PackageComparison`, `LeadMagnetCarousel`. Lý do: AGENTS §5B / §14, giá và sản phẩm không chép vào trang.
- **Định dạng mỗi khối con**, vẫn trong luật brand (AGENTS §5B):
  - **Màu chữ**: dropdown, **chỉ các cặp màu chữ / nền đạt tương phản WCAG AA**, lọc theo nền của khối cha.
    - `deep-navy` đạt trên mọi nền pastel.
    - `bright-magenta` đạt trên pastel **trừ** `lavender-mist` (4,44 < 4,5, chỉ dùng cho chữ lớn).
    - `accent-pink` chỉ dùng cho chữ lớn.
    - Trên nền `deep-navy`: chữ trắng hoặc `soft-pink`.
  - **Cỡ chữ**: S / M / L theo từng vai trò (tiêu đề / đoạn văn). Font vẫn cố định theo vai trò, không cho chọn font.
  - **Căn lề**: trái / giữa. **Kiểu thẻ**: dùng lại `cardStyle` (trắng / hồng nhạt / viền).
  - **Ảnh đại diện**: `createMediaExternalField`, bắt buộc có mô tả ảnh.
  - **Không** thêm color picker tự do, ô nhập số, ô CSS (AGENTS §14).
- Mỗi khối đổi props phải **tăng `version` + viết Puck migration** trong `src/puck/migrations/`. Migration chuyển `items[]` thành khối con, chạy được 2 lần không đổi gì, đi vào cả slot của `Columns`. **Không** cần migration DB vì `puckData` là JSON.

### Task (PC nhà, theo thứ tự, mỗi task 1 PR)

| Mã    | Việc                                                                                                                                                                                                     | Ước lượng | Nghiệm thu                                                                                                       |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------- |
| PK-01 | Bộ preset định dạng dùng chung (màu chữ an toàn theo nền, cỡ chữ S/M/L, căn lề) + áp cho `SectionHeader` (màu + cỡ từng dòng, sửa chữ trên canvas), `SectionHeader` v1 → v2                              | 6 h       | Test chứng minh mọi cặp màu cho phép đạt AA; trang cũ hiện y hệt sau migration; test tương phản T3-07 vẫn xanh   |
| PK-02 | Khối con `Card` (chỉ hiện trong container, có màu chữ / cỡ chữ / căn lề / ảnh) + `IconCardGrid` dùng slot (v1 → v2, migration `items` → `Card`, migration chạy cả khi đọc)                               | 6 h       | Kéo thẻ trên canvas; trang cũ không mất chữ; migration chạy 2 lần không đổi; ảnh khối con hiện ở trang công khai |
| PK-03 | Khối con `Stat`, `Step` + `StatsBar`, `JourneySteps` dùng slot (bước kéo thả tự do, chốt 22/10) + migration; sửa tiêu đề / số thứ tự `IconCardGrid` trên nền navy                                        | 5 h       | Như PK-02                                                                                                        |
| PK-04 | `ServiceCards`, `PackageCards` (phần thẻ tự nhập) dùng slot + ảnh từng thẻ; `ImageText` chuyển sang `createMediaExternalField`                                                                           | 5 h       | Như PK-02; ảnh vẫn bắt buộc mô tả ảnh                                                                            |
| PK-05 | `FAQ` (phần câu hỏi tự nhập) dùng slot; `Columns` nhận khối con mới; cập nhật 9 mẫu trang + seed; e2e "kéo thẻ trong IconCardGrid, đổi màu + cỡ chữ, xuất bản, trang công khai đúng"; `HUONG_DAN_CMS.md` | 5 h       | CI xanh; e2e mới xanh trên CI; hướng dẫn có ảnh                                                                  |

**Câu hỏi cho Hana (không chặn PK-01):** màu `bright-magenta` trên nền `lavender-mist`: chỉ cho chữ lớn (tiêu đề), hay bỏ hẳn? Planning đề xuất **chỉ chữ lớn**.

---

## Phần 2 – Habit Hack theo workflow 28 ngày (track HB, **chờ Hana chốt**)

### Bộ code freelance

- Là bản mới của prototype đã xem trong `docs/plan/HANA_PROTOTYPE.md`. Quyết định cũ vẫn giữ: **chỉ làm mẫu giao diện tham khảo, không chép code**. Lý do:
  - toàn bộ dữ liệu chỉ lưu `localStorage`, không có server, tài khoản hay quyền dùng thử;
  - nội dung viết cứng trong code (trái AGENTS §2.3);
  - khoảng 115 chỗ màu ngoài palette, `accent-pink` sai mã (`#EF3883`), Anton thiếu subset tiếng Việt;
  - có lỗi:
    - ngày bắt đầu bị ghép sai;
    - "hôm nay là ngày 11" viết cứng;
    - chuỗi ngày tính từ ngày 1;
    - luật "lỡ 2 ngày bỏ phiếu" chỉ là chữ, không có logic;
    - modal gọi hook sai thứ tự;
  - rất ít thuộc tính hỗ trợ trình đọc màn hình (`aria`), modal không có focus trap.
- **Không chép** vào repo:
  - link video giữ chỗ (`dQw4w9WgXcQ`) và link reel Facebook;
  - **số tài khoản ngân hàng viết cứng** trong `DonateModal`;
  - số liệu không nguồn "80% kế hoạch thất bại", "40% bỏ cuộc tuần 3";
  - câu trích dẫn gán tên chưa kiểm ("Aristotle", "Robert Kiyosaki");
  - link Google Calendar viết cứng.
- Không có tạo ảnh Boarding Pass thật (chỉ thẻ HTML, bảo khách chụp màn hình).

### So với `/habit` đang chạy

| Bước workflow                                                                        | Đang có                                         | Hướng                                                                                  |
| ------------------------------------------------------------------------------------ | ----------------------------------------------- | -------------------------------------------------------------------------------------- |
| B1 Chẩn đoán 8 câu                                                                   | Có (16 câu, thang 1–5, điểm TB, nhập trong CMS) | Giữ engine; Hana sửa / bỏ bớt câu trong CMS nếu chọn 8 câu                             |
| B2 Nguyên lý 1% (thanh kéo)                                                          | Chưa                                            | Component mới, chữ trong CMS, bỏ số liệu không nguồn                                   |
| B3 Tìm Mentor (+/−/=, chọn thói quen neo, giờ)                                       | Một phần (bảng điểm tốt / thường / xấu)         | Mở rộng bảng điểm + thói quen neo                                                      |
| B4 Gọi tên + nhịp tuần, hành động < 2 phút, lý do riêng, ngày bắt đầu, bạn đồng hành | Một phần (chỉ câu "Tôi sẽ … để trở thành …")    | Thêm field vào `habitPlans` (lý do riêng + bạn đồng hành: chỉ khách xem)               |
| B5 Vòng lặp kỹ thuật                                                                 | Có (kỹ thuật lấy từ CMS)                        | Giữ; thêm ví dụ / video vào `techniques`                                               |
| B6 Habit Boarding Pass                                                               | Chưa                                            | Ảnh `next/og` như chứng nhận (cỡ theo brand 4:5 / 9:16, hoặc cỡ Hana chốt)             |
| Tracker 28 ngày, 4 trạng thái, 4 trạm + suy ngẫm                                     | Một phần (21 ngày, tick + cảm xúc)              | Mở rộng dữ liệu + luật nhịp tuần phía server                                           |
| Sao lưu / khôi phục file, CSV, gửi kết quả cho coach                                 | Chưa (dữ liệu đã lưu server)                    | Không cần sao lưu file; thêm tải CSV dữ liệu của mình + nút chép kết quả               |
| Đặt lịch coach / Ủng hộ                                                              | Đặt lịch có ở dịch vụ                           | Đặt lịch lấy link từ CMS; **Ủng hộ cần Hana quyết** (trái mô hình bán công cụ trả phí) |

**Đã chốt 20/10** (anh Nhân): câu 1 = 28 ngày; câu 2 = ngày trong nhịp không check-in là lỡ nhịp, đạt 90% mới cấp chứng nhận, không đạt ghi "Đã trải nghiệm". Chi tiết cách hiểu: `docs/DECISIONS.md`. Đủ để làm HB-02 (prompt `docs/tasks/prompts/HB-02.md`); câu 3–10 chặn HB-07 trở đi.

### Hana / anh Nhân phải chốt trước khi code (theo thứ tự quan trọng)

1. **21 hay 28 ngày?** AGENTS §1 / §8.2 đang chốt 21 ngày dùng thử + tracker 21 ngày. Nếu 28: dùng thử thành 28 ngày, hay hết thử ở ngày 22 rồi mời mua?
2. **Luật nhịp tuần**: chỉ ngày bỏ phiếu mới tính "lỡ nhịp"? "Bản tối giản" có giữ chuỗi và có tính vào chứng nhận? `certificateMinDays` mới là bao nhiêu?
3. Chẩn đoán: thay 16 câu bằng 8 câu, hay giữ cả hai?
4. Nguồn cho "80%", "40% tuần 3" (không có thì bỏ); xác nhận tên tác giả các câu trích dẫn.
5. Hướng "Dựng thương hiệu" (người làm nội dung, số bài / tuần) là hướng chung cho mọi khách, hay một biến thể?
6. Bước nào xem tự do, bước nào cần đăng nhập OTP / dùng thử?
7. Nút **Ủng hộ**: giữ (cần VietQR thật, tài khoản do Hana cung cấp qua CMS) hay bỏ?
8. Cỡ ảnh Boarding Pass: 4:3 như bản tham chiếu, hay 4:5 / 9:16 theo brand book; có cần bản hình nền điện thoại?
9. Bộ cảm xúc khi check-in: 10 cảm xúc đã chốt (Q14) hay 5 mức tự tin của bản tham chiếu?
10. Link đặt lịch coach: Google Calendar riêng hay `bookingUrl` của dịch vụ?

### Task (sau khi chốt; PC nhà hoặc Laptop – `🔒 Migration` từng task một)

| Mã    | Việc                                                                                                  | Ước lượng | Migration DB     |
| ----- | ----------------------------------------------------------------------------------------------------- | --------- | ---------------- |
| HB-01 | Planning ghi quyết định (10 câu trên) vào `DECISIONS.md`, sửa AGENTS §8.2 nếu đổi 28 ngày             | 2 h       | –                |
| HB-02 | Số ngày hành trình thành cài đặt (`habitJourneyDays`) thay mọi số 21 viết cứng                        | 4 h       | có               |
| HB-03 | `habitPlans` thêm field B3–B4 + quyền đọc (lý do riêng, suy ngẫm: chỉ khách)                          | 5 h       | có               |
| HB-04 | `habitCheckins.status` (bỏ phiếu / tối giản / lỡ / nghỉ) + chuyển dữ liệu cũ `done=true` → bỏ phiếu   | 5 h       | có, kèm backfill |
| HB-05 | Bộ luật nhịp tuần `src/lib/habit/rhythm.ts` (ngày bỏ phiếu, nghỉ, chuỗi, cảnh báo lỡ 2 ngày) + test   | 4 h       | –                |
| HB-06 | Cron nhắc lỡ nhịp + điều kiện chứng nhận chạy theo bộ luật mới                                        | 3 h       | –                |
| HB-07 | Global nội dung hành trình (tên chặng, câu trích có nguồn, 1%, câu hỏi trạm) + ví dụ / video kỹ thuật | 4 h       | có               |
| HB-08 | B2 thanh kéo 1%                                                                                       | 4 h       | –                |
| HB-09 | B3–B4 trong trình hướng dẫn Habit Loop                                                                | 6 h       | –                |
| HB-10 | B6 Boarding Pass + ảnh `next/og`                                                                      | 5 h       | –                |
| HB-11 | Tracker 28 ngày 4 trạm, check-in 4 trạng thái                                                         | 6 h       | –                |
| HB-12 | Suy ngẫm mỗi trạm                                                                                     | 4 h       | –                |
| HB-13 | Tải CSV dữ liệu của mình + chép kết quả cho coach + bắt đầu lại (giữ kế hoạch cũ)                     | 3 h       | –                |
| HB-14 | Nút đặt lịch coach từ CMS; Ủng hộ nếu được duyệt                                                      | 2 h       | –                |
| HB-15 | Cập nhật test unit / e2e / seed demo + `HUONG_DAN_CMS.md`; `REVIEW-REQUIRED` ở HB-03 / 04 / 06        | 4 h       | –                |

HB-03, HB-04, HB-06 chạm dữ liệu khách và quyền truy cập → anh Nhân duyệt `REVIEW-REQUIRED`. Dữ liệu suy ngẫm, lý do riêng, cảm xúc **không** gửi analytics, **không** hiện trên chứng nhận / Boarding Pass (AGENTS §11, §14).

## Thứ tự đề xuất cho PC nhà

1. **PK-01 → PK-05** (giao ngay, prompt `docs/tasks/prompts/PK-01.md`). Track này không đụng DB nên chạy song song được với việc deploy tramdungcamxuc.com.
2. Song song: Hana trả lời 10 câu phần 2 → Planning làm HB-01 → giao HB-02 trở đi. Track HB có nhiều migration, nên chỉ giao khi PK đã xong hoặc giao máy khác, giữ luật 🔒 Migration một task một lúc.
