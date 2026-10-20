# Lên tramdungcamxuc.com và bàn giao cho Hana (kế hoạch 20/10/2026)

Đã chốt với anh Nhân 20/10:

- Dữ liệu: **chuyển DB + ảnh của bản demo** sang server thật, rồi dọn dữ liệu `[MẪU]` / khách demo.
- **Mở mềm**: lên domain thật nhưng `SITE_NOINDEX=true`, chưa quảng bá. Hana nhập nội dung thật và làm buổi thử CM-07 ngay trên bản thật. Đủ mục C mới bật index và bán.
- DNS trỏ thẳng VPS `115.79.58.24`, không qua Cloudflare proxy.
- Nginx Proxy Manager (NPM) chạy bằng Docker trên VPS này. Bản demo ở server khác.

Planning **không** vào server, không đọc / ghi mật khẩu hay khóa. Mọi lệnh dưới đây anh Nhân tự chạy rồi báo kết quả.

---

## A. Tình trạng code (kiểm 20/10 trên `main` @ `c8cbcfb`)

- CI trên `main` xanh, gồm lint, typecheck, unit, build và **toàn bộ e2e**. Hai lần merge tài liệu sau đó cũng xanh.
- Máy QA, DB trống: lint 0 lỗi, unit 125 file / **1331 test** xanh, migration chạy từ DB rỗng đến hết, build production qua.
- E2E chạy lại trên máy QA: các test đỏ đều do máy QA không ra mạng được Cloudflare Turnstile, nên không có test nào đỏ vì code.
- Migration tự chạy khi container khởi động (`prodMigrations`), không cần lệnh riêng.

**Kết luận: code chạy ổn, nhưng chưa đủ để bàn giao.** Còn 3 lỗi kỹ thuật chặn (mục B, GO-01) và phần nội dung Hana phải đưa (mục C).

## B. GO-01 – sửa kỹ thuật trước khi lên (Planning làm, ~3 h)

| #   | Vấn đề                                                                                                                                                                                                                                                                                  | Sửa                                                                                                                                                                                                               |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | **Logo không bao giờ hiện.** `Navbar.tsx:99` và `Footer.tsx:72` gọi `<Logo>` không truyền ảnh, nên mọi trang luôn hiện khung "LOGO – chờ file từ Hana", kể cả khi Hana đã tải logo vào Cài đặt website.                                                                                 | Navbar / Footer đọc `siteSettings.logo` (ảnh + mô tả ảnh). Chưa có logo thì giữ khung chờ như hiện tại. Có test.                                                                                                  |
| B2  | **`docker-compose.prod.yml` không chuyển biến video / lưu trữ vào app.** `VIDEO_PROVIDER`, `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_TOKEN_KEY` (và `S3_*` nếu sau này dùng R2) có ghi trong `.env` cũng không tới app, nên video trả phí luôn ở chế độ sandbox (không hiện video thật). | Thêm các biến này vào `environment` của `app` (để trống = như cũ).                                                                                                                                                |
| B3  | **App mở cổng 3000 ra mọi địa chỉ, và NPM (container) không gọi được `127.0.0.1` của host.**                                                                                                                                                                                            | Thêm file `docker-compose.npm.yml`: app vào mạng Docker của NPM, **không** mở cổng ra ngoài. NPM gọi app theo tên container.                                                                                      |
| B4  | **Backup chưa tự động và thiếu volume `private`** (PDF trả phí). AGENTS §11 yêu cầu backup hằng ngày, giữ 14 ngày.                                                                                                                                                                      | `scripts/backup.sh`: dump DB + nén `media` + `private`, kiểm checksum, xóa bản quá 14 ngày. Kèm 1 dòng crontab. RUNBOOK ghi cách chép bản backup ra ngoài server.                                                 |
| B5  | **Chưa có cách liệt kê dữ liệu MẪU sau khi chuyển DB.**                                                                                                                                                                                                                                 | `pnpm sample:report` **chỉ đọc**: in số bản ghi `isSample` theo từng bảng, kèm trang / sản phẩm đã xuất bản còn chữ `[MẪU]`. Hana xóa hoặc sửa trong admin, script không tự xóa (tránh xóa nhầm thứ Hana đã sửa). |

**Không** sửa logic thanh toán / đăng nhập. Mục B1 có thêm test. B2–B4 chỉ là cấu hình và script vận hành.

Ngoài code, anh cần làm ở GitHub: **Settings → Secrets and variables → Actions → Variables**, đặt `TURNSTILE_SITE_KEY` = site key thật của Cloudflare Turnstile. Trong Cloudflare, widget này phải cho phép cả `tramdungcamxuc.com` và `tdcx.skoolmate.vn`. Key được gắn vào image lúc build, nên **sau khi đặt biến phải có một commit mới trên `main`** để CI build lại image. Nếu thiếu, image dùng key thử của Cloudflare và form trên domain thật sẽ báo lỗi.

## C. Hana phải đưa / làm trước khi bật bán (mở mềm vẫn lên được khi thiếu)

1. **Logo** (PNG / SVG nền trong) → tải vào **Cài đặt website → Logo** (cần GO-01 B1 mới hiện). Thêm favicon nếu có.
2. **6 trang pháp lý**: nội dung thật (Planning không viết thay) + **Thông tin người bán** trong Cài đặt website.
3. **Chốt giá** công cụ số (250k / 178k hay 499k / 199k – Q15) và giá 3 gói, sửa trong CMS.
4. **Thanh toán**: thông tin chuyển khoản VietQR trong Cài đặt website. Nếu dùng SePay tự động: tài khoản SePay + webhook (RUNBOOK mục SePay).
5. Liên kết Zalo, Shopee, đặt lịch coaching; email / hotline thật; ảnh bìa sản phẩm.
6. Số liệu (có nguồn), logo đối tác (có cho phép), lời chia sẻ (có đồng ý), đội ngũ (nếu có), chữ ký – theo `docs/plan/SITEMAP_V2.md` mục 2. **Xác nhận** các câu Sitemap v2 Planning đã chốt thay ngày 17/10 (`docs/DECISIONS.md`).
7. **Buổi thử CM-07** (`docs/plan/CM-07.md`): việc 1–5 đạt, không lỗi P1. Làm ngay trên bản thật khi đang mở mềm.
8. Sửa / xóa mọi chữ `[MẪU]` còn trên trang đã xuất bản (danh sách lấy từ `pnpm sample:report`).
9. Video: tài khoản **Bunny Stream** + tải video bài học (chưa có thì khóa học chạy, nhưng không có video thật).
10. Bộ thẻ EQ: chốt `qrSlug` trước khi in (in rồi không đổi được).

## D. Anh Nhân còn phải duyệt (REVIEW-REQUIRED chưa ghi "IT duyệt")

- T0-07: `src/lib/auth/access.ts`, `Users.ts`, `Orders.ts`, `Entitlements.ts`, `src/fields/unique-key.ts`, tab thanh toán của SiteSettings.
- T0-09: chặn đăng nhập ở builder + `src/puck/actions.ts`.
- SM-01 `TeamMembers`.
- SM-02 migration `20261018_020000_sitemap_v2_paths` (đổi slug trang Hana đã dựng – **chạy lúc khởi động bản thật**).
- SM-03 mục A2.
- SM-04 `createExperienceOrder`.
- SM-05 `submitNewsletter`.
- SM-07 migration enum + `seed/template-drafts.ts`.

Đây là các phần đăng nhập / phân quyền / thanh toán theo AGENTS §2.8: duyệt trước khi bật bán (mục F bước 4).

## E. Deploy lần đầu (anh Nhân chạy, sau khi GO-01 merge và CI xanh)

### E1. DNS và chuẩn bị server

1. Tại nhà cung cấp tên miền, tạo bản ghi `A`: `tramdungcamxuc.com` → `115.79.58.24` và `www` → `115.79.58.24`. Không bật proxy. Kiểm tra: `dig +short tramdungcamxuc.com` trả `115.79.58.24`.
2. Trên VPS: cài Docker + plugin compose (nếu chưa có). Mở firewall **chỉ** 80, 443 (cho NPM) và cổng SSH. Cổng admin của NPM (81) chỉ mở cho IP của anh.
3. Tìm mạng Docker của NPM: `docker network ls` rồi `docker inspect <container-npm> --format '{{json .NetworkSettings.Networks}}'`. Ghi lại tên mạng (ví dụ `npm_default`).
4. `git clone https://github.com/residoken-wq/tramdungcamxuc.git /opt/tdcx && cd /opt/tdcx`. Đăng nhập GHCR như RUNBOOK mục "Xác thực GitHub Container Registry".
5. Tạo `/opt/tdcx/.env` (anh tự gõ, `chmod 600`, **không** gửi nội dung cho ai). Danh sách biến ở mục G.

### E2. Chuyển dữ liệu từ demo

1. Trên **server demo**, dọn trước khi sao lưu. Lệnh xóa khách demo không chạy được trên bản thật vì bị chặn với domain thật:
   `docker compose -p tdcx-demo -f docker-compose.prod.yml --profile tools run --rm -e DEMO_SEED_ALLOW=true -e SITE_URL=https://tdcx.skoolmate.vn seed pnpm seed:demo-gd2:clean < /dev/null` (đúng lệnh trong RUNBOOK mục "Dữ liệu demo GĐ 2")
   Lệnh này chỉ xóa 3 khách demo cố định (`hoc-vien-test-0x@example.test`), đơn / quyền / tracker của họ và workshop `[MẪU]` demo. Đơn thật ngày 15/10 không bị đụng.
2. Vẫn trên server demo: chạy quy trình backup trong RUNBOOK ("Backup DB và media cùng thời điểm") **và thêm volume `private`** (hoặc dùng `scripts/backup.sh` của GO-01). Kiểm `SHA256SUMS`.
3. Chép thư mục backup sang VPS mới (`scp` / `rsync`), kiểm lại checksum trên VPS.
4. Trên VPS mới: `docker compose -p tdcx -f docker-compose.prod.yml -f docker-compose.npm.yml up -d postgres`, rồi khôi phục DB, `media` và `private` theo RUNBOOK mục "Phục hồi toàn diện" (đổi `tdcx-demo` thành `tdcx`).
5. `docker compose -p tdcx -f docker-compose.prod.yml -f docker-compose.npm.yml up -d`. App tự chạy các migration còn thiếu. Xem log: `docker compose -p tdcx logs app --tail 100`, không có dòng lỗi migration.
6. Dữ liệu `[MẪU]` còn lại: chạy `pnpm sample:report` (GO-01 B5), Hana xóa hoặc sửa trong admin.
7. **Không** chạy `pnpm seed` hay bất kỳ lệnh `seed:demo-gd2*` nào trên server thật.
8. Tài khoản admin chuyển theo DB. Tạo tài khoản `owner` cho Hana trong admin (anh tự gửi mật khẩu). Rà danh sách Quản trị viên, xóa tài khoản test.

### E3. Nginx Proxy Manager

Tạo **Proxy Host**:

- Domain Names: `tramdungcamxuc.com`, `www.tramdungcamxuc.com`
- Scheme `http`, Forward Hostname: tên container app (ví dụ `tdcx-app-1`), Forward Port `3000`
- Bật **Block Common Exploits**, **Websockets Support**
- Tab SSL: **Request a new SSL Certificate** (Let's Encrypt), bật **Force SSL** và **HTTP/2**. Chỉ bật **HSTS** sau khi HTTPS chạy ổn ít nhất 1 ngày: app đã tự gửi HSTS `includeSubDomains`, áp lên mọi tên miền con của tramdungcamxuc.com.
- Tab **Advanced** – **bắt buộc**. Nếu thiếu, khách có thể giả IP để lách giới hạn gửi OTP / form (RUNBOOK mục SePay, T2-21). Ứng dụng đọc IP **đầu tiên** trong `X-Forwarded-For`, nên phải ghi đè header này bằng IP thật:

```nginx
location / {
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $http_connection;
    proxy_http_version 1.1;
    client_max_body_size 50m;
    proxy_pass http://tdcx-app-1:3000;
}

location = /api/payments/sepay/webhook {
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Real-IP $remote_addr;
    client_max_body_size 64k;
    proxy_pass http://tdcx-app-1:3000;
}
```

Kiểm cấu hình NPM sinh ra **không** còn `$proxy_add_x_forwarded_for` cho host này: `docker exec <container-npm> sh -c 'grep -rn "forwarded_for\|tramdungcamxuc" /data/nginx/proxy_host/'`. NPM chỉ bỏ khối `location /` mặc định khi tab Advanced đã có `location /`. Nếu vẫn thấy `$proxy_add_x_forwarded_for` trong file của host này thì dừng lại, báo Planning.

### E4. Cron (crontab của user chạy Docker trên VPS)

5 việc hẹn giờ, gọi bằng `CRON_SECRET` trong `.env`. Lệnh mẫu và giờ chạy lấy đúng RUNBOOK mục "Lịch Cron …" (T1-12a, T2-10, T2-02, T2-04, T2-06), đổi địa chỉ thành `https://tramdungcamxuc.com`. Thêm dòng backup hằng ngày của GO-01 B4. Thiếu cron thì đơn chờ không bao giờ hết hạn và không có email nhắc.

### E5. Kiểm sau khi lên (anh chạy, báo Planning kết quả)

```bash
curl -sI https://tramdungcamxuc.com | head -5                          # 200, có strict-transport-security
curl -s https://tramdungcamxuc.com/robots.txt                          # đang mở mềm: Disallow toàn bộ
curl -s -o /dev/null -w "%{http_code}\n" https://tramdungcamxuc.com/api/test-reset-admins   # phải 404
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://tramdungcamxuc.com/api/cron/expire-orders   # phải 401 (không kèm khóa)
docker compose -p tdcx ps                                              # app + postgres healthy, không có cổng 3000 mở ra ngoài
```

Rồi trên trình duyệt (điện thoại + máy tính):

- `/admin` đăng nhập được;
- trang chủ hiện, form gửi được (Turnstile thật);
- đăng nhập OTP bằng email thật của anh: **nhận được email** (Resend đã xác minh domain);
- mở 1 trang pháp lý, 1 sản phẩm, 1 thẻ EQ qua link QR.

## F. Thứ tự đề xuất

1. Planning làm **GO-01** → anh duyệt PR, merge, CI build image mới (đã đặt `TURNSTILE_SITE_KEY`).
2. Anh: DNS + Resend (xác minh domain `tramdungcamxuc.com`: SPF, DKIM) + Turnstile + E1–E5 với `SITE_NOINDEX=true`, `PAYMENT_SANDBOX=` để trống (đơn thật).
3. Hana: mục C (logo, pháp lý, giá, ngân hàng…) + buổi thử CM-07 trên bản thật. Planning chạy lại `pnpm sample:report`, viết biên bản CM-07.
4. Anh: duyệt mục D.
5. Bật bán: `SITE_NOINDEX=` (trống), `CSP_ENFORCE=true` (sau khi kiểm không lỗi console), `up -d`. Thử 1 đơn thật nhỏ đi hết luồng. Báo Hana.
6. Tắt bản demo `tdcx.skoolmate.vn` hoặc để `SITE_NOINDEX=true` + mật khẩu, tránh trùng nội dung với bản thật.

## G. Biến môi trường bản thật (chỉ tên – giá trị anh tự giữ)

| Biến                                                                                              | Giá trị / ghi chú                                                                                                                                           |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PAYLOAD_SECRET`                                                                                  | **Tạo mới** (`openssl rand -hex 32`), không dùng lại của demo. Hệ quả: mọi người đăng nhập lại, link trong email cũ của demo hết hiệu lực – chấp nhận được. |
| `POSTGRES_PASSWORD`                                                                               | Tạo mới (hex). Khôi phục bằng `pg_restore` nên không cần mật khẩu cũ.                                                                                       |
| `SITE_URL`                                                                                        | `https://tramdungcamxuc.com`                                                                                                                                |
| `SITE_NOINDEX`                                                                                    | `true` khi mở mềm, để trống khi bật bán                                                                                                                     |
| `CSP_ENFORCE`                                                                                     | để trống khi mở mềm, `true` khi bật bán                                                                                                                     |
| `TURNSTILE_SECRET_KEY`                                                                            | secret của widget có `tramdungcamxuc.com` (khớp `TURNSTILE_SITE_KEY` ở GitHub)                                                                              |
| `RESEND_API_KEY`, `EMAIL_FROM`                                                                    | domain `tramdungcamxuc.com` đã xác minh trong Resend; `EMAIL_FROM` dạng `TRAM DUNG CAM XUC <no-reply@tramdungcamxuc.com>`                                   |
| `CRON_SECRET`                                                                                     | tạo mới                                                                                                                                                     |
| `PAYMENT_PROVIDER`                                                                                | `manual` (Hana bấm xác nhận) hoặc `sepay` + `SEPAY_WEBHOOK_API_KEY`                                                                                         |
| `PAYMENT_SANDBOX`                                                                                 | **để trống**                                                                                                                                                |
| `VIDEO_PROVIDER`, `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_TOKEN_KEY`                             | khi đã có Bunny (cần GO-01 B2)                                                                                                                              |
| `APP_TAG`                                                                                         | `sha-<7 ký tự>` của commit đã duyệt (không dùng `latest` cho bản thật)                                                                                      |
| `NPM_NETWORK`                                                                                     | tên mạng Docker của NPM (GO-01 B3)                                                                                                                          |
| **Không bao giờ đặt** `E2E_TEST_HOOKS`, `DEMO_SEED_ALLOW`, `SEED_ALLOW_PROD`, `STYLEGUIDE_PUBLIC` |                                                                                                                                                             |
