# Deploy AU-01 → AU-04 lên tramdungcamxuc.com

Viết ngày 12/11/2026. Áp dụng cho `main` @ `126cef87` (sau #359, #362, #367, #370). Quy trình chung: `docs/RUNBOOK.md` mục "Deploy một lệnh" và "Backup / Rollback".

## 0. CHƯA DEPLOY ĐƯỢC – CI trên `main` đang đỏ

`scripts/deploy.sh` kéo image `ghcr.io/residoken-wq/tramdungcamxuc:latest`. CI chỉ đẩy `latest` khi **mọi** job xanh. Từ khi merge AU-01..AU-04, CI `main` đỏ ở e2e, job "Build and Push Docker image" bị **bỏ qua**. Vì vậy `latest` vẫn là bản cũ, **chưa có** AU-01..AU-04. Chạy `deploy.sh` bây giờ không lên tính năng mới.

Lỗi e2e CI run [#1044](https://github.com/residoken-wq/tramdungcamxuc/actions/runs/43144581943) (commit `126cef87`):

| Test | Lỗi | Nguyên nhân / hướng sửa |
| --- | --- | --- |
| `puck-builder.spec.ts`, `puck-editor-frame.test.ts` | không tìm thấy ô "Tiêu đề dòng 1" | AU-04 đổi **nhãn** ô tiêu đề hero thành "Tiêu đề dòng 1 (dùng \*từ\* để tô màu nổi bật)". Prompt AU-04 yêu cầu ghi cách dùng vào **mô tả** (`admin.description`), không vào nhãn → trả nhãn cũ, chuyển gợi ý sang mô tả |
| `habit-loop.test.ts` (1440 + 375) | `fill('06:30')` vào ô giờ | AU-01 đổi ô giờ sang 3 ô chọn AM/PM, test cũ chưa cập nhật → dùng `selectOption` như `helpers/habit-zip.ts` (`fillMentor` có tham số giờ) |
| `dp03-stage-gate.test.ts` (2 test) | không có nút "GIAI ĐOẠN 2" | AU-03 bỏ 3 thẻ giai đoạn lớn → test đi sang bước 3 bằng thanh bước (`StepNavigation`) hoặc nút "Sang giai đoạn 2" |
| `au04-site-shared.test.ts` | gửi form Tham gia, không thấy câu cảm ơn | Chỉ đỏ khi bật Turnstile (CI có khoá test). Máy QA chặn Cloudflare nên không kiểm được. Cần xem trace trong artifact `playwright-report-desktop-1440-0`: form có gửi token Turnstile không, server trả lỗi gì. **Có thể là lỗi thật** – form Tham gia trên site thật cũng bật Turnstile |
| `gate-eq-journey.test.ts` (1440 + 375) | chưa rõ | Test chưa sửa từ trước AU-02, có thể vướng chữ / nút đã đổi. Xem trace trong artifact `playwright-report-desktop-1440-1` / `mobile-375-4` |
| `live-preview-extended.test.ts` | chập chờn (retry xanh) | Không chặn |

→ Giao 1 task sửa CI (đề xuất `CI-01`). Xong và CI `main` **xanh**, có image mới trên GHCR thì mới làm từ bước 1.

## 1. Kiểm trước khi deploy (trên máy bất kỳ)

1. GitHub → **Actions** → run CI mới nhất của `main`: tất cả job xanh, có job **"Build and Push Docker image"** xanh.
2. Ghi lại 7 ký tự đầu của commit đó (VD `abc1234`). GitHub → **Packages** → `tramdungcamxuc` phải có tag `sha-abc1234`.
3. Chọn giờ ít khách (tối muộn). Báo Hana trước: site khựng khoảng 1–2 phút lúc khởi động lại.

## 2. Deploy (anh IT, trên server)

SSH vào server, vào thư mục repo (VD `/opt/tdcx`), rồi chạy từng lệnh:

```bash
cd /opt/tdcx
```

```bash
./scripts/deploy.sh status
```

Ghi lại commit đang chạy (để đối chiếu nếu phải rollback).

```bash
./scripts/deploy.sh
```

Script tự làm theo thứ tự:

1. backup DB + media;
2. ghi mốc rollback;
3. `git pull`;
4. kéo image `latest`;
5. `up -d`, migration chạy lúc app khởi động;
6. chờ `healthy`.

Lỗi ở bước nào thì dừng ở đó. **Không** sửa `.env`. Nếu `git status` có file đã sửa thì script dừng: báo lại, không tự xoá.

```bash
./scripts/deploy.sh status
```

Mong đợi:

- commit đang chạy = commit ở bước 1;
- migration mới nhất = `20261111_164500_au03_habit_fields`.

Migration sẽ chạy (đều chỉ **thêm cột**, mỗi cái vài ms):

| Migration | Việc |
| --- | --- |
| `20261110_150000_au04_navigation_badge` | thêm cột `badge` cho menu chính, menu con, menu chân trang |
| `20261111_100000_au02_eq_buddy_fields` | thêm 7 cột "Nội dung EQ Buddy"; đổi chữ sang bản mới của Hana **chỉ ở ô còn chữ mặc định cũ** (ô Hana đã sửa giữ nguyên) |
| `20261111_164500_au03_habit_fields` | thêm "tên đơn vị lộ trình" (sản phẩm) + nhãn / gợi ý ô áp dụng (kỹ thuật); điền sẵn cho "Soi lại nhịp sinh học" nếu đang trống |

Không có biến môi trường mới (`.env` giữ nguyên).

## 3. Kiểm sau deploy (5 phút, ai cũng làm được)

Mở bằng điện thoại và máy tính:

| Trang | Thấy |
| --- | --- |
| `/habit/5-phut` | Không còn nhãn "CONTENT CREATOR HUB", không còn 3 thẻ giai đoạn lớn. Có "Bước 1 / 6". Bước 3 chọn giờ dạng `6 : 00 AM`. Bước 4 "Bạn sẽ về đích ngày dd/mm/yyyy" |
| `/habit/1-percent-better` | Trang giới thiệu mở bình thường |
| `/eq-buddy` | Tiêu đề "BỘ THẺ EQ BUDDY", dòng "26 thông điệp cùng bạn…", không còn "Bộ thẻ là gì". Nút chính vào thẳng rút thẻ |
| `/eq-buddy/rut-the` | Rút 1 thẻ: không còn "#01", "TDCX-…". Có 3 nút "Trở thành VIP Member" / "Mua bộ thẻ trên Shopee" / "Đặt lịch coaching 1-1" |
| `/admin` | Đăng nhập được, mở "Điều hướng" thấy ô "Nhãn" cho mục menu |

Lỗi bất kỳ → bước 5.

## 4. Hana làm trong CMS sau deploy

1. **Điều hướng:** nhập nhãn `Free` cho 2 mục công cụ (EQ Buddy, Habit) → Lưu.
2. **Cài đặt site:** nhập link Calendar `https://calendar.app.google/gLuPgDnqAbFnjDPQ8` vào ô "Liên kết đặt lịch phiên trải nghiệm" (gửi khách sau khi thanh toán).
3. **Builder:**
   - trang Cộng đồng – 2 nút "Tham gia" chọn "Mở form" (ME TIME / YOGA BUDDY);
   - trang Chuyển mình – nút "Đăng ký nhận brochure" chọn form brochure;
   - trang chủ / Liên hệ – nút chọn "Đặt lịch phiên trải nghiệm";
   - tiêu đề hero: `*Chuyển* mình không *Chênh* vênh` (dấu `*` chỉ dùng ở dòng 1).
4. **Sản phẩm Habit Tracker số**, tab "Trang giới thiệu":
   - xoá 3 ô "Habit Hack khác biệt" (để ẩn phần này);
   - "Tên đơn vị lộ trình" = `giai đoạn`, nhập 3 giai đoạn;
   - giá khuyến mãi 99.000đ: nhập "Giá ưu đãi" + "Hết hạn ưu đãi".
5. **Sản phẩm EQ Buddy số:** giá khuyến mãi như trên (nếu muốn).
6. **Nội dung EQ Buddy:** kiểm link Shopee = `https://tinyurl.com/yc43suhc` (trống thì nút Shopee ẩn); đọc lại các ô chữ.
7. **Nội dung Habit:**
   - câu dẫn đầu trang nếu còn đuôi "…qua 3 giai đoạn:" thì xoá đuôi;
   - câu trích còn "Thói quen là lãi kép…" thì đổi thành "Mỗi hành động bạn thực hiện là một lá phiếu cho con người bạn muốn trở thành.";
   - xoá nhãn "CONTENT CREATOR HUB" nếu còn.
8. Thử gửi form "Tham gia ME TIME" bằng dữ liệu giả (`Học viên Test 01`, email `@example.com`) → thấy câu cảm ơn, có 1 dòng trong **Leads**, Hana nhận email báo. Xong xoá dòng thử.

Chi tiết từng ô: `docs/HUONG_DAN_CMS.md`.

## 5. Rollback

Các migration AU chỉ **thêm cột**, nên bản cũ vẫn chạy được trên DB mới. Rollback chỉ cần đổi bản app:

```bash
./scripts/deploy.sh rollback
```

```bash
./scripts/deploy.sh status
```

Mong đợi: commit đang chạy = commit ghi ở bước 2. Chữ "Nội dung EQ Buddy" đã đổi sang bản mới vẫn giữ (bản cũ cũng đọc được).

Chỉ khi dữ liệu bị hỏng mới phục hồi toàn bộ DB + media từ bản backup `deploy.sh` vừa tạo: `docs/RUNBOOK.md` → "Phục hồi toàn diện cả code, database và media". Lệnh này **xoá dữ liệu hiện tại** (lead / đơn mới sau giờ deploy sẽ mất), nên phải hỏi lại trước khi chạy.
