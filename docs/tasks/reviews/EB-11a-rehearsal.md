# Báo cáo Chạy thử 8 việc EB-11 bằng giao diện (EB-11a Rehearsal Report)

> **Mã công việc:** EB-11a  
> **Người thực hiện:** Antigravity (Laptop đóng vai Hana)  
> **Môi trường:** Local Node.js + PostgreSQL (Docker), trình duyệt desktop 1440px, mobile 375px  
> **Mục tiêu:** Kiểm chứng toàn bộ 8 công việc trong kịch bản buổi thử nghiệm trực quan (Visual Page Builder) thông qua giao diện người dùng thực (E2E), không dùng REST đi tắt, bảo đảm Hana không gặp lỗi chặn (P1) trước buổi thử chính thức.

---

## 1. Bảng tổng hợp kết quả 8 việc

Tiêu chuẩn đánh giá theo `docs/plan/CM-07.md` (mục 4.2) và `docs/plan/EB-11.md`:

- **Đạt:** Hoàn thành trọn vẹn yêu cầu công việc qua giao diện, kiểm chứng công khai đúng 100%.
- **P1 (Chặn):** Không làm xong được, hoặc làm sai mà không biết → phải sửa trước khi giao người dùng.
- **P2 (Khựng):** Làm xong được nhưng mất thao tác tìm nút, đọc hiểu nhãn hoặc dễ bấm nhầm.
- **P3 (Góp ý):** Hoàn thành trơn tru, mong muốn tinh chỉnh câu chữ / màu sắc cho thuận tay hơn.

| STT | Tên việc                                                                                                                                                                                                                                                          | Kết quả | Số thao tác | Chỗ khựng (Màn hình + Nút, chữ đang hiện)                                                                                                                                                                      | Mức độ |
| :-: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-----: | :---------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----: |
|  1  | **Đổi tiêu đề trang Landing thử**<br>Tạo trang Landing thử từ mẫu _Landing chiến dịch_, đổi tiêu đề dòng 1 thành "Thử builder mới", xuất bản và kiểm tra công khai.                                                                                               | **Đạt** |      8      | Modal chọn mẫu trang: Thẻ mẫu _Landing chiến dịch_ có hình preview nhưng vùng bấm là toàn bộ thẻ, chưa có nút bấm riêng ghi rõ "Chọn mẫu này".                                                                 |   P2   |
|  2  | **Khung 2 cột (ảnh + chữ), xem trước trên điện thoại**<br>Thêm Container, chỉnh hướng hàng ngang trên máy tính và cột dọc trên điện thoại; kéo Ảnh và Văn bản vào; xem trước mobile (375px) bằng thanh dưới; xuất bản và kiểm tra thật.                           | **Đạt** |     16      | Nút hướng hiển thị Container ghi `Hàng ngang (Row)` và `Cột dọc (Column)` có lẫn tiếng Anh trong ngoặc. Việc kéo khối thứ 2 vào bên cạnh khối thứ 1 trong Container cần căn vị trí chuột chuẩn.                |   P2   |
|  3  | **Đổi màu nền sang hồng nhạt, bo góc lớn, padding ĐT khác máy tính**<br>Đổi màu nền Container sang `soft-pink`, bo góc card (20-24px), chỉnh padding trên/dưới cho điện thoại sang mức Nhỏ (`sm` / 16px).                                                         | **Đạt** |     12      | Khi click vào khối để chỉnh kiểu, nếu click trúng ảnh/chữ con thì panel chuyển sang khối con. Người dùng phải nhìn thanh breadcrumb ở góc trên phải (`Container > Ảnh`) và bấm `Container` để chọn lại cha.    |   P2   |
|  4  | **Thêm khối Tab (Cá nhân, Doanh nghiệp) mỗi tab một câu ngắn**<br>Kéo khối Tabs vào trang, đổi tên 2 tab thành "Cá nhân" và "Doanh nghiệp", thêm câu văn bản vào mỗi tab, kiểm tra chuyển tab trên trang công khai.                                               | **Đạt** |     12      | Danh sách tab trong panel Nội dung hiển thị dạng mảng tóm tắt (`Tab 1`, `Tab 2`). Phải bấm vào từng dòng tóm tắt để mở rộng trường "Tiêu đề thẻ" mới gõ được chữ.                                              |   P2   |
|  5  | **Ẩn Tab trên điện thoại, đổi tên Cấu trúc thành "Tab khách hàng"**<br>Tích chọn ẩn trên Điện thoại trong tab Nâng cao; mở cây Cấu trúc, nhấp đúp đổi tên thành "Tab khách hàng"; xuất bản và kiểm tra trang công khai (1440 hiện, 375 ẩn).                       | **Đạt** |      7      | Nhấp đúp vào dòng trong cây Cấu trúc: cần click vào phần chữ tên khối (nhấp trúng icon mở rộng chevron sẽ không kích hoạt ô đổi tên). Biểu tượng con mắt gạch chéo "Ẩn trên: Điện thoại" hiển thị rất rõ ràng. |   P2   |
|  6  | **Đổi màu nút chính toàn site sang tím đậm**<br>Vào Admin Design System, đổi mã HEX token `accent-pink` sang `#280A60` (tím đậm), lưu lại và kiểm tra nút CTA trang công khai đổi sang tím đậm.                                                                   | **Đạt** |      6      | Danh sách 8 màu trong Admin mặc định thu gọn; bấm nút "Hiển thị toàn bộ" ở đầu danh sách giúp mở bung tất cả 8 màu một lần để sửa nhanh.                                                                       |   P3   |
|  7  | **Lưu khung 2 cột thành [MẪU] Khung ảnh chữ, chèn vào trang khác**<br>Nhấp chuột phải vào Container 2 cột chọn "Lưu thành mẫu", đặt tên `[MẪU] Khung ảnh chữ`; mở visual builder của `[MẪU] Trang thử builder`, mở tab Mẫu và bấm "Chèn"; xuất bản và kiểm chứng. | **Đạt** |      9      | Menu chuột phải (context menu) chỉ hiện khi click chuột phải đúng vùng Container. Tab "Mẫu" ở thanh bên trái tìm kiếm và chèn tức thì rất mượt mà.                                                             |   P2   |
|  8  | **Xem trước bản cũ trong lịch sử phiên bản, thoát an toàn**<br>Bấm nút "Lịch sử" trên thanh công cụ, xem bản ban đầu của trang, kiểm tra chế độ xem trước an toàn (nút Lưu nháp/Xuất bản bị vô hiệu hoá), bấm "Thoát" trở lại bản mới nhất mà không mất nội dung. | **Đạt** |      5      | Chế độ xem trước có banner màu tím cảnh báo rõ ràng kèm nút "Thoát", bảo vệ dữ liệu nháp tuyệt đối. Hoàn toàn không có chỗ khựng.                                                                              |   P3   |

---

## 2. Ảnh chụp màn hình 8 việc (`docs/screenshots/eb11/`)

Tất cả ảnh đã được lưu tại độ phân giải chuẩn desktop 1440px (chỉ dùng dữ liệu có tiền tố `[MẪU]`):

1. **Việc 1:** `docs/screenshots/eb11/viec-1-doi-tieu-de.png` – Đổi tiêu đề dòng 1 thành "Thử builder mới", xem trước trong builder.
2. **Việc 2:** `docs/screenshots/eb11/viec-2-hai-cot-mobile.png` – Khung 2 cột hiển thị dạng cột dọc xếp chồng trên mô phỏng điện thoại 375px.
3. **Việc 3:** `docs/screenshots/eb11/viec-3-kieu-nang-cao.png` – Panel Kiểu & Nâng cao: màu nền `soft-pink`, bo góc thẻ, padding cho Điện thoại.
4. **Việc 4:** `docs/screenshots/eb11/viec-4-tabs-public.png` – Trang công khai chuyển đổi qua lại giữa tab Cá nhân và Doanh nghiệp.
5. **Việc 5:** `docs/screenshots/eb11/viec-5-navigator-rename.png` – Cây Cấu trúc hiển thị tên "Tab khách hàng" kèm badge "Ẩn trên: Điện thoại".
6. **Việc 6:** `docs/screenshots/eb11/viec-6-doi-mau-nut.png` – Màn hình Quản trị Thiết kế hệ thống, trường mã màu HEX `#280A60` của token `accent-pink`.
7. **Việc 7:** `docs/screenshots/eb11/viec-7-chen-mau-khoi.png` – Tab Mẫu bên trái với mẫu `[MẪU] Khung ảnh chữ` vừa được chèn vào trang.
8. **Việc 8:** `docs/screenshots/eb11/viec-8-lich-su-phien-ban.png` – Banner tím xem trước phiên bản cũ trong lịch sử, nút Lưu nháp và Xuất bản bị vô hiệu hoá an toàn.

---

## 3. Phân tích trải nghiệm người dùng cho Hana

Hana không biết code và đã quen với tư duy thiết kế kéo thả dạng Elementor. Qua đợt chạy thử E2E:

### Những điểm Hana sẽ thấy thuận tay và thích thú:

1. **Thanh xem trước kích thước màn hình ở thanh dưới:** Chuyển đổi cực nhanh giữa Máy tính (1440px), Máy tính bảng (768px) và Điện thoại (375px). Xem ngay được Container 2 cột tự nhảy thành 1 cột dọc trên mobile.
2. **Tab Nâng cao với điều khiển theo thiết bị:** Biểu tượng Máy tính / Tablet / Điện thoại trực quan, không cần phải nhớ media queries CSS.
3. **Cây Cấu trúc (Navigator):** Có biểu tượng trực quan báo ngay khối nào đang bị ẩn trên điện thoại.
4. **Lưu khối thành mẫu & chèn lại:** Rất tiện lợi cho việc tạo sẵn các khối testimonial, khung ảnh chữ hay form để tái sử dụng ở nhiều trang chiến dịch khác nhau.
5. **An toàn phiên bản:** Chế độ xem trước bản cũ chặn hoàn toàn việc bấm nhầm Xuất bản đè lên bản mới, có nút "Thoát" to rõ.

### Những điểm người hướng dẫn (anh Nhân) cần chú ý nhắc Hana trong buổi thử:

1. **Thanh Breadcrumb khi chọn Container:** Khi Container đã chứa ảnh hoặc chữ bên trong, nếu Hana bấm chuột vào giữa màn hình thì Puck sẽ chọn khối con (Ảnh hoặc Chữ). Nhắc Hana nhìn lên góc trên bên phải panel thuộc tính: có dòng breadcrumb `Container (Hộp / Khung chứa) > Ảnh`. Chỉ cần bấm vào chữ `Container` là chọn lại được khung ngoài để chỉnh màu nền và bo góc.
2. **Mở rộng mục trong danh sách Tabs:** Trong tab Nội dung của TabsWidget, 2 tab ban đầu hiển thị dạng nút tóm tắt (`Tab 1`, `Tab 2`). Nhắc Hana click vào chữ `Tab 1` để mở rộng ô gõ chữ "Cá nhân".
3. **Nhấp chuột phải vào đúng khối:** Khi muốn Lưu thành mẫu, cần nhấp chuột phải vào khoảng trống / viền của Container hoặc chọn Container trên cây Cấu trúc rồi dùng chuột phải.

---

## 4. Lỗi P1

**Không có lỗi P1.**

_Planning sửa EB-11ac:_ bản trước ghi một "P1 về CSS" và đã sửa bằng cách đọc thêm `item.id` trong `collectPageStyles`. Planning đã gỡ bản sửa đó và chạy lại e2e, có ghi log mọi khối thiếu `props.id`. Kết quả: không khối nào thiếu (Puck luôn để `id` trong `props`), và việc 2 vẫn xanh.

Lần đỏ trước là do e2e chập chờn, không phải lỗi sản phẩm:

- **Việc 2:** thứ tự ảnh / chữ tuỳ chỗ thả chuột, mà test lại ép ảnh nằm bên trái.
- **Việc 6:** bước mở bảng màu là tuỳ chọn, nên `nth(2)` có lúc trỏ nhầm ô.
- **Việc 7:** bấm chuột phải ngay khi canvas vừa sẵn sàng, trước khi menu kịp gắn (đúng lỗi EB-07).

Đã sửa trong test. Chạy 3 lần liên tiếp đều xanh.

## 5. Hướng dẫn cho anh Nhân (chạy trên **demo**, không chạy trên `tramdungcamxuc.com`)

_Planning sửa EB-11ac: bản trước ghi sai. Lệnh **không** tạo tài khoản và **không** tạo trang `[MẪU] Landing thử`, vì Hana tự tạo trang này ở việc 1._

Lệnh chạy qua image `tools` giống seed MẪU (`docs/RUNBOOK.md`). Cần thêm 3 thứ:

- `-e DEMO_SEED_ALLOW=true`: bật tay, script không tự bật;
- `-e SITE_URL=<địa chỉ demo>`: guard từ chối khi thiếu biến này hoặc khi nó là tên miền thật;
- mount `./backups`: giữ file mốc buổi thử và bản sao `designSystem` giữa lệnh chuẩn bị và lệnh dọn. Container `--rm` tự xoá khi chạy xong, không mount là mất 2 file này.

### 1. Trước buổi thử

```bash
mkdir -p backups
docker compose -p tdcx-demo -f docker-compose.prod.yml --profile tools pull seed < /dev/null
docker compose -p tdcx-demo -f docker-compose.prod.yml --profile tools run --rm \
  -e DEMO_SEED_ALLOW=true -e SITE_URL=<địa chỉ demo> -v "$PWD/backups:/app/backups" \
  seed pnpm seed:eb11 < /dev/null
```

Lệnh này:

- tạo trang `[MẪU] Trang thử builder` (đích của việc 7) và 2 ảnh `[MẪU]` trong Thư viện ảnh;
- lưu bản sao `designSystem` và mốc thời gian vào `./backups/`.

Chạy lại không tạo trùng. Tài khoản `owner` của Hana do anh Nhân tự tạo trong admin, tự gửi mật khẩu. Sau đó mở khoá màu / font / kích thước theo `docs/plan/EB-11.md` mục 1.

### 2. Sau buổi thử

```bash
docker compose -p tdcx-demo -f docker-compose.prod.yml --profile tools run --rm \
  -e DEMO_SEED_ALLOW=true -e SITE_URL=<địa chỉ demo> -v "$PWD/backups:/app/backups" \
  seed pnpm seed:eb11:clean < /dev/null
```

Lệnh này:

- chỉ xoá trang / mẫu khối / ảnh có `[MẪU]` **tạo sau lệnh chuẩn bị**;
- trả `designSystem` về bản sao, gồm màu nút ở việc 6 và các khoá.

Thiếu file mốc trong `./backups/` thì lệnh **từ chối**, không xoá gì. Dữ liệu `[MẪU]` của seed demo vẫn giữ.
