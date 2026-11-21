# Deploy BX-08 (+ nút cà phê trên tracker) lên tramdungcamxuc.com

Viết ngày 20/11/2026. Quy trình chung: `docs/RUNBOOK.md` mục "Deploy một lệnh", "Backup / Rollback".

> **Chưa deploy đợt BX-01 → BX-07?** Lần deploy này kéo bản mới nhất nên lên **cả hai đợt cùng lúc**. Khi đó làm **bước 2 (báo cáo ô để trống BX-05) trong `DEPLOY-BX-01-07.md`** trước, gửi Hana duyệt, rồi mới làm tiếp từ bước 2 ở file này. Kiểm sau deploy: làm cả bảng bước 4 của file kia lẫn bước 3 của file này.

## Đợt này lên những gì

| PR | Nội dung | Migration |
| --- | --- | --- |
| #404 | Tracker Habit: bỏ nút nổi "Thấy công cụ hữu ích?", dùng nút cà phê chung của site; khung "sau hành trình" (đặt lịch Habit Coach) nằm luôn trong trang | – |
| #405 BX-08a | Trang `/habit/1-percent-better` và `/tai-nguyen/...` chỉnh bố cục bằng builder (nhóm khối "Trang sản phẩm", nút "Chỉnh bố cục bằng builder" trong form sản phẩm) | – |
| #406 BX-08b | Trang `/eq-buddy` chỉnh bố cục bằng builder (nhóm khối "EQ Buddy", ô tím đầu "Nội dung EQ Buddy") | – |

- **Không có migration mới.** Migration mới nhất vẫn là `20261116_120000_bx07_youtube_lessons`.
- **Không** có biến môi trường mới, `docker-compose.prod.yml` không đổi.
- **Không đổi gì trên site ngay khi deploy**: chưa có trang builder nào thì `/habit/1-percent-better`, `/tai-nguyen/...`, `/eq-buddy` vẫn hiện y như cũ. Chỉ khi Hana tạo trang builder **và bấm Xuất bản** thì trang mới thay trang cũ.

## 1. Kiểm trước khi deploy

1. GitHub → **Actions** → run CI của `main` ở commit `1ebc9a6` (merge #406 BX-08b):
   - tất cả job xanh;
   - job **"Build and Push Docker image"** xanh (đã đẩy `latest` và `tools-latest`).
2. Chọn giờ ít khách. Báo Hana: site khựng khoảng 1–2 phút.

## 2. Deploy

SSH vào server:

```bash
cd /opt/tdcx
```

```bash
./scripts/deploy.sh status
```

Ghi lại commit đang chạy (để đối chiếu khi rollback).

```bash
./scripts/deploy.sh
```

Script tự: backup DB + media → ghi mốc rollback → `git pull` → kéo image `latest` → `up -d` → chờ `healthy`. Lỗi ở bước nào thì dừng ở đó. **Không** sửa `.env`. Nếu `git status` có file đã sửa thì script dừng: báo lại, không tự xoá.

```bash
./scripts/deploy.sh status
```

Mong đợi:

- commit đang chạy = `1ebc9a6`;
- migration mới nhất = `20261116_120000_bx07_youtube_lessons`.

## 3. Kiểm sau deploy (10 phút)

Mở bằng điện thoại **và** máy tính:

| Trang | Thấy |
| --- | --- |
| `/habit/1-percent-better` | Giống hệt trước deploy (giá, nút "Dùng thử", các phần) |
| `/eq-buddy` | Giống hệt trước deploy; bấm "Rút thẻ ngay" vào trang rút thẻ; nút Shopee (nếu có link) mở Shopee |
| `/eq-buddy` → nút "Hướng dẫn" | Mở cửa sổ hướng dẫn 3 bước như cũ |
| `/habit/tracker` (tài khoản học viên đang có hành trình) | **Không** còn nút nổi "Thấy công cụ hữu ích?"; góc phải dưới là nút cà phê chung |
| `/admin` → Sản phẩm → "Habit Tracker số" | Trên cùng form có ô tím **"Bố cục trang sản phẩm"**, dòng "Chưa có trang builder" + nút "Chỉnh bố cục bằng builder" |
| `/admin` → EQ Buddy → Nội dung EQ Buddy | Trên cùng có ô tím **"Bố cục trang EQ Buddy (/eq-buddy)"** |

> Không bấm nút "Chỉnh bố cục bằng builder" chỉ để thử: nút tạo một trang **nháp** thật trong CMS (không hiện cho khách, nhưng nằm trong danh sách Trang). Lỡ tạo thì vào **Trang** → xoá trang đó.

Lỗi bất kỳ → bước 5.

## 4. Hana làm trong CMS (khi muốn đổi bố cục)

Không bắt buộc. Chi tiết: `docs/HUONG_DAN_CMS.md` mục **5.48**.

1. **Trang Habit Tracker số**: Sản phẩm → Habit Tracker số → **Chỉnh bố cục bằng builder** → builder mở ở tab mới với trang nháp đã xếp sẵn.
2. **Trang EQ Buddy**: EQ Buddy → Nội dung EQ Buddy → ô tím trên cùng → **Chỉnh bố cục bằng builder**.
3. Trong builder: kéo thả, đổi tuỳ chọn ở cột phải, xem 3 cỡ màn hình → **Xuất bản**. Khách thấy trang mới ngay.
4. Chữ, giá, danh sách **vẫn sửa ở form sản phẩm / Nội dung EQ Buddy** như cũ; builder chỉ đổi bố cục.
5. Muốn quay lại trang cũ: **Trang** → mở trang `habit/1-percent-better` (hoặc `eq-buddy`) → **Ẩn tài liệu** (gỡ xuất bản).
6. Sau khi dùng thật, chụp vài ảnh màn hình gửi lại để bổ sung vào hướng dẫn mục 5.48.

## 5. Rollback

Không có migration nên quay về bản cũ an toàn:

```bash
./scripts/deploy.sh rollback
```

```bash
./scripts/deploy.sh status
```

Mong đợi: commit đang chạy = commit ghi ở bước 2. Sau rollback:

- nếu Hana **đã xuất bản** trang builder cho `/habit/1-percent-better` hoặc `/eq-buddy`, bản cũ **không biết** các khối mới → khách lại thấy trang code cũ (đúng, vì bản cũ chưa có cơ chế thay trang); trang builder vẫn nằm trong CMS, deploy lại là dùng được;
- đường dẫn `eq-buddy`, `habit/1-percent-better` có thể hiện thêm ở danh sách Trang – không ảnh hưởng khách.

Chỉ khi dữ liệu hỏng mới phục hồi toàn bộ DB + media: `docs/RUNBOOK.md` → "Phục hồi toàn diện cả code, database và media". Lệnh này **xoá dữ liệu hiện tại** (lead / đơn sau giờ deploy sẽ mất), phải hỏi lại trước khi chạy.

## 6. Anh IT review sau deploy

Hai API công khai mới (chỉ trả dữ liệu vốn đã hiện công khai trên trang):

- `src/app/api/builder/offer-product/[id]/route.ts` – sản phẩm đã xuất bản, không ẩn;
- `src/app/api/builder/eq-content/route.ts` – chữ giới thiệu EQ Buddy, không trả chế độ truy cập.
