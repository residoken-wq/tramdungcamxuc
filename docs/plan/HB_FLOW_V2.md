# Habit Hack – dựng lại theo flow mới (HB v2)

> Lập 31/10/2026. Nguồn: bản flow "Xây Thói Quen — Dựng Thương Hiệu" anh Nhân gửi (artifact claude.ai, trang tham chiếu của Hana).
> Quyết định chốt 31/10 (anh Nhân): mục 3.
>
> Nối tiếp kế hoạch HB-01 → HB-15 ở `docs/plan/MEETING_2010.md`. HB-01 → HB-11 đã merge, nhưng chỉ **gắn thêm** từng phần (thanh 1%, thói quen neo, Boarding Pass, tracker 4 trạm) vào **wizard cũ 4 bước**. Vì vậy trang `/habit/5-phut` vẫn là bản cũ.

## 1. Hiện trạng và flow mới

| Bước trong flow mới                                                                                                         | Bản đang chạy (`/habit/5-phut`)                                                                        | Việc cần làm                                                              |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Thanh tiến trình 3 giai đoạn: **Khám** (1–2) · **Xây** (3–6) · **Chuyển mình** (28 ngày)                                    | 4 bước: Bảng điểm → Gọi tên → Kỹ thuật → "Kế hoạch 21 ngày"                                            | Dựng lại khung: 3 giai đoạn, 6 bước và màn 28 ngày                        |
| **1. Khám đúng bệnh**: lời mở, câu trích, các con số, khảo sát **8 câu** (0/8)                                              | Không có. Quiz 16 câu nằm riêng ở `/habit/chan-doan`                                                   | Bước mới, 8 câu [MẪU] trong CMS                                           |
| **2. Nguyên lý 1%**: thanh kéo + 3 điều chưa biết                                                                           | Có thanh kéo HB-08, nằm trong wizard cũ                                                                | Chuyển thành bước 2, thêm 3 ý từ CMS                                      |
| **3. Tìm Mentor**: soi lại một ngày (+ / − / =), chọn Mentor từ việc "+", giờ                                               | Bảng điểm tốt / bình thường / xấu + chọn thói quen neo (HB-09)                                         | Đổi cách gọi và luồng: chọn Mentor là một bước riêng                      |
| **4. Gọi tên**: tuyên ngôn, nhịp tuần (số lần + thứ), thói quen hạt nhân < 2', lý do riêng, **ngày bắt đầu**, bạn đồng hành | Có tuyên ngôn và nhịp tuần. Ngày bắt đầu cố định hôm nay. Lý do riêng và bạn đồng hành để sang tracker | Gộp đủ 6 ô vào bước 4. Ngày bắt đầu cho chọn                              |
| **5. Vòng lặp**: giải thích 4 giai đoạn + 4 quy tắc, đánh dấu kỹ thuật                                                      | "Chọn kỹ thuật thực hành" 1–2 kỹ thuật mỗi giai đoạn                                                   | Thêm phần giải thích; chỉ kỹ thuật được đánh dấu mới lên Boarding Pass    |
| **6. Boarding Pass**: tải cover điện thoại, tải ảnh đăng bài, sao chép caption, nút "Lên chuyến · Bắt đầu 28 ngày"          | Có ảnh 4:5 / 9:16 (HB-10) ở bước 4 cũ                                                                  | Chuyển thành bước 6, thêm nút sao chép caption (caption lấy từ CMS)       |
| **28 ngày**: Khởi hành → Ngày 28 Về đích, 4 trạng thái, "Lỡ một ngày là bình thường…"                                       | Tracker 4 trạm (HB-11) ở `/habit/tracker`. Ô ngày chỉ có số                                            | Thêm ngày lịch thực tế trên ô, câu nhắc, lý do riêng hiện lại khi lỡ nhịp |
| **Nhìn lại mỗi trạm**                                                                                                       | Chưa có (HB-12)                                                                                        | HB-12                                                                     |
| **Dữ liệu của bạn**: tải bản sao lưu, CSV 28 ngày, khôi phục từ file, sao chép gửi Coach, bắt đầu lại                       | Chưa có (HB-13)                                                                                        | HB-13 mở rộng (mục 3)                                                     |
| **Đồng hành sau 28 ngày**: đặt lịch Habit Coach, ủng hộ                                                                     | Chưa có (HB-14)                                                                                        | HB-14                                                                     |

## 2. Những chỗ KHÔNG chép nguyên từ bản tham chiếu

- **Con số "80% thất bại", "tuần 3 có 40% bỏ cuộc"**: không có nguồn. Theo AGENTS §2 / §14 không bịa số liệu, nên chỉ hiện khi Hana nhập kèm nguồn trong CMS (cùng luật câu trích HB-07).
- **Câu "Mọi thứ bạn nhập nằm trong trình duyệt… kể cả Hana"**: sai với hệ thống của mình, vì dữ liệu lưu trên server theo tài khoản OTP. Phải thay bằng câu đúng sự thật. Hana soạn trong CMS, có khung [MẪU].
- **Ảnh 4:3**: giữ 9:16 (cover điện thoại) và 4:5 (đăng bài) theo brand book.
- **"Ủng hộ Trạm Dừng Cảm Xúc"**: chỉ làm khi Hana duyệt (HB-14 cũ).

## 3. Quyết định chốt 31/10 (anh Nhân)

1. **8 câu Khám đúng bệnh**: dựng khung với 8 câu [MẪU] trong CMS (câu hỏi, thang điểm, gợi ý theo kết quả). Hana thay nội dung thật sau.
2. **Ngày bắt đầu**: khách chọn từ hôm nay đến **+14 ngày**. Tracker và ngày lịch trên từng ô tính theo ngày này. Luật khoá `startDate` (HB-05) đổi thành: khoá sau khi lưu kế hoạch, chỉ chọn được lúc tạo.
3. **Dữ liệu**: làm **giống hệt bản mới**, gồm tải bản sao lưu, tải CSV 28 ngày, **khôi phục từ file**, sao chép gửi Coach, bắt đầu lại. Dữ liệu vẫn lưu trên server.
   - Khôi phục chỉ ghi vào kế hoạch của chính khách.
   - File phải kiểm tra theo schema (Zod), ghi đè có xác nhận.
   - Đánh dấu `// REVIEW-REQUIRED:` vì đây là ghi dữ liệu khách từ file.
4. **Boarding Pass**: giữ 9:16 + 4:5, thêm nút sao chép caption gợi ý.

## 4. Task (Planning viết prompt, máy làm theo thứ tự)

| Mã    | Việc                                                                                                                                                                | Phụ thuộc | Ước lượng |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------- |
| HB-16 | Khung flow mới trên `/habit/5-phut`: thanh 3 giai đoạn, 6 bước + màn 28 ngày, lưu nháp (đọc được nháp cũ), mọi nhãn "21 ngày" theo `journeyDays`                    | HB-11     | 6 h       |
| HB-17 | Bước 1 Khám đúng bệnh: global CMS (lời mở, câu trích có nguồn, con số chỉ hiện khi có nguồn, 8 câu [MẪU] + gợi ý), đếm 0/8, kết quả nút thắt                        | HB-16     | 5 h       |
| HB-18 | Bước 2 Nguyên lý 1%: chuyển thanh kéo HB-08 vào bước, 3 ý "chưa biết" từ CMS                                                                                        | HB-16     | 2 h       |
| HB-19 | Bước 3 Tìm Mentor: soi lại một ngày (+ / − / =), chọn Mentor chỉ từ việc "+", giờ (dùng field HB-09)                                                                | HB-16     | 4 h       |
| HB-20 | Bước 4 Gọi tên: tuyên ngôn, nhịp tuần (số lần + thứ), thói quen hạt nhân, lý do riêng, **ngày bắt đầu (hôm nay → +14)**, bạn đồng hành; đổi luật khoá `startDate`   | HB-19     | 5 h       |
| HB-21 | Bước 5 Vòng lặp: giải thích 4 giai đoạn + 4 quy tắc (CMS), đánh dấu kỹ thuật; chỉ kỹ thuật đánh dấu lên Boarding Pass                                               | HB-20     | 4 h       |
| HB-22 | Bước 6 Boarding Pass: 9:16 + 4:5 (HB-10), sao chép caption (CMS), nút "Lên chuyến · Bắt đầu 28 ngày" tạo kế hoạch (email + OTP)                                     | HB-21     | 4 h       |
| HB-23 | Màn 28 ngày: Khởi hành / Về đích, **ngày lịch thực tế trên từng ô** (dd/MM), câu "Lỡ một ngày là bình thường…", lý do riêng hiện lại khi lỡ nhịp                    | HB-22     | 4 h       |
| HB-24 | Phần CMS của HB-17 / 18 / 21 / 22 (Planning làm trước, song song HB-16 + HB-23): field CMS, migration, hàm đọc, seed [MẪU]. Sau HB-24 bốn task đó chỉ còn giao diện | HB-07     | 3 h       |
| HB-12 | Nhìn lại mỗi trạm (giữ như kế hoạch cũ)                                                                                                                             | HB-23     | 4 h       |
| HB-13 | Dữ liệu của bạn: bản sao lưu JSON, CSV 28 ngày, **khôi phục từ file** (REVIEW-REQUIRED), sao chép gửi Coach, bắt đầu lại (giữ kế hoạch cũ)                          | HB-23     | 5 h       |
| HB-14 | Đặt lịch Habit Coach từ CMS; Ủng hộ nếu Hana duyệt                                                                                                                  | HB-23     | 2 h       |
| HB-15 | Test unit / e2e cả flow, seed demo, `HUONG_DAN_CMS.md`                                                                                                              | tất cả    | 4 h       |

Tổng khoảng 49 giờ.

- **Thứ tự:** HB-16 → HB-23 nối tiếp nhau vì cùng sửa trình hướng dẫn. HB-24 (chỉ CMS) chạy song song từ đầu. HB-12 / 13 / 14 chạy song song sau HB-23.
- **Dữ liệu nháp:** nháp cũ trong trình duyệt (HB-09) phải đọc được ở khung mới. Kế hoạch đã lưu trên server giữ nguyên, không cần migration dữ liệu. Chỉ thêm field mới (kết quả 8 câu, Mentor) nếu cần, và khi đó phải viết migration.
- **Không đưa dữ liệu nhạy cảm ra ngoài:** lý do riêng, suy ngẫm và cảm xúc không gửi analytics, không lên Boarding Pass hay chứng nhận (AGENTS §11, §14).

## 5. Cập nhật 31/10 (chiều)

- **HB-24** (phiên Planning khác làm, merge qua PR #228): đưa phần CMS của bước 1, 2, 5, 6 lên trước. HB-17 chỉ còn làm giao diện; HB-18 chỉ thêm phần CMS còn thiếu. Khoá migration: HB-24 → HB-12 → HB-18 (đảo 31/10 để PC nhà không phải chờ).
- Thứ tự giao việc và quy tắc chung: `docs/tasks/prompts/HB-COMMON.md`.
