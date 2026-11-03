# Review EB-11a – Chuẩn bị buổi thử builder (dữ liệu MẪU + chạy thử 8 việc)

**Kết luận: ĐẠT sau EB-11ac** (03/11). Planning QA trên `task/EB-11a-session-prep` @ `a5ec6eca`; Planning sửa EB-11ac. Không migration. Báo cáo chạy thử: `EB-11a-rehearsal.md`.

## Đã kiểm

- **Typecheck:** sạch.
- **Lint:** 0 lỗi.
- **Unit:** `eb11-session-clean` 7 test xanh, có thêm trường hợp thiếu mốc.
- **E2E `eb11-rehearsal`:** đi đúng 8 việc bằng giao diện. REST chỉ dùng để chuẩn bị và dọn. Kiểm kết quả trên trang công khai: vị trí 2 cột 1440 / 375, `display: none` ở 375, màu nút. Sau EB-11ac: **3 lần chạy liên tiếp đều xanh** (~48 s).
- **Kết quả chạy thử:**
  - 8/8 việc đạt, không có P1;
  - P2: chọn mẫu trang, nhãn `Hàng ngang (Row)`, chọn lại khối cha qua thanh breadcrumb, mở từng tab trong danh sách, nhấp đúp đúng chữ trong cây Cấu trúc, chuột phải đúng vùng;
  - P3: bảng màu thu gọn, lịch sử phiên bản.
  - Các P2 này để buổi thử EB-11 xác nhận.

## EB-11ac (Planning sửa)

| #   | Vấn đề                                                                                                                                                                                                                                                                                                         | Sửa                                                                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | **Lệnh dọn xoá sạch dữ liệu `[MẪU]` của demo.** Thiếu file mốc buổi thử thì phép chọn lấy **mọi** trang / mẫu khối / ảnh có `[MẪU]`, kể cả nội dung của `pnpm seed` (trang chủ, các trang mẫu…). Có 2 trường hợp gây ra: chạy dọn lần 2 (lần 1 đã xoá file mốc), hoặc container `--rm` không mount `backups/`. | Không có mốc thì không chọn gì, và lệnh dọn **từ chối** với thông báo rõ. Thêm test.                                                         |
| C2  | Script `seed:eb11` / `seed:eb11:clean` tự đặt `DEMO_SEED_ALLOW=true`, nên bỏ qua điều kiện 1 của `demo-guard`. Prompt yêu cầu dùng guard giống `seed:demo-gd2`.                                                                                                                                                | Bỏ khỏi `package.json`; người chạy tự truyền `-e DEMO_SEED_ALLOW=true`.                                                                      |
| C3  | **"P1 CSS" không có thật.** Bản Laptop thêm `item.id` vào `collectPageStyles` (đổi logic, ngoài ranh giới). Puck luôn để `id` trong `props`, và `data-eb-id` cũng lấy từ `props.id`, nên dòng thêm không đổi gì.                                                                                               | Gỡ. Đã kiểm bằng log khi chạy e2e: không khối nào thiếu `props.id`.                                                                          |
| C4  | **E2E chập chờn ở 3 chỗ:** việc 2 ép ảnh nằm bên trái; việc 6 mở bảng màu tuỳ chọn nên `nth(2)` trỏ nhầm ô; việc 7 chuột phải trước khi menu gắn. Mỗi lần chạy test làm bẩn `docs/screenshots/`.                                                                                                               | Kiểm "2 cột cạnh nhau" không phụ thuộc thứ tự; bắt buộc mở đủ 8 ô màu; thử lại chuột phải (`toPass`); chỉ chụp ảnh khi `EB11_SCREENSHOTS=1`. |
| C5  | **Báo cáo ghi sai lệnh cho anh Nhân:** nói lệnh tạo tài khoản `hana-session@…` và trang `[MẪU] Landing thử` (code không làm vậy; trang này là việc 1 của Hana); thiếu cách chạy trên demo.                                                                                                                     | Viết lại mục 5: image `tools`, `-e DEMO_SEED_ALLOW=true -e SITE_URL=…`, mount `./backups`, tài khoản do anh Nhân tự tạo.                     |

## Trước buổi thử (EB-11)

- **anh Nhân:** deploy `main` lên demo; chạy lệnh chuẩn bị (mục 5 của báo cáo chạy thử); tạo tài khoản `owner` cho Hana; mở khoá màu / font / kích thước.
- **Planning:** mở sẵn phiếu quan sát. Có thể theo dõi trước 6 điểm P2 trong báo cáo.
