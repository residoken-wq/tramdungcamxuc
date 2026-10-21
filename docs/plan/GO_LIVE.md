# Lên tramdungcamxuc.com và bàn giao cho Hana (kế hoạch 20/10/2026, sửa 21/10: NPM ở VPS khác)

Đã chốt với anh Nhân 20/10:

- Dữ liệu: **chuyển DB + ảnh của bản demo** sang server thật, rồi dọn dữ liệu `[MẪU]` / khách demo.
- **Mở mềm**: lên domain thật nhưng `SITE_NOINDEX=true`, chưa quảng bá. Hana nhập nội dung thật và làm buổi thử CM-07 ngay trên bản thật. Đủ mục C mới bật index và bán.
- DNS trỏ thẳng IP công khai vào **VPS NPM**, không qua Cloudflare proxy.
- **Sửa 21/10:** Nginx Proxy Manager (NPM) chạy bằng Docker trên **một VPS khác**, cùng lớp mạng nội bộ (LAN) với VPS production. Không phải cùng máy như bản 20/10. Bản demo ở server khác nữa.

Mô hình mạng:

```
Khách ──443──▶ VPS NPM (IP công khai, 80/443) ──http, LAN──▶ VPS production <IP_LAN_PROD>:3000 (app) ── postgres (nội bộ Docker)
```

Ký hiệu dùng bên dưới: `<IP_LAN_PROD>` = IP LAN của VPS production, `<IP_LAN_NPM>` = IP LAN của VPS NPM, `<IP_CONG_KHAI_NPM>` = IP công khai nhận 80/443 cho NPM.

> **Cần anh Nhân xác nhận:** `115.79.58.24` là IP công khai của VPS NPM hay của VPS production? DNS phải trỏ vào IP mà cổng 80/443 tới được NPM.

Planning **không** vào server, không đọc / ghi mật khẩu hay khóa. Mọi lệnh dưới đây anh Nhân tự chạy rồi báo kết quả.

---

## A. Tình trạng code (kiểm 20/10 trên `main` @ `c8cbcfb`)

- CI trên `main` xanh, gồm lint, typecheck, unit, build và **toàn bộ e2e**. Hai lần merge tài liệu sau đó cũng xanh.
- Máy QA, DB trống: lint 0 lỗi, unit 125 file / **1331 test** xanh, migration chạy từ DB rỗng đến hết, build production qua.
- E2E chạy lại trên máy QA: các test đỏ đều do máy QA không ra mạng được Cloudflare Turnstile, nên không có test nào đỏ vì code.
- Migration tự chạy khi container khởi động (`prodMigrations`), không cần lệnh riêng.

**Kết luận: code chạy ổn, nhưng chưa đủ để bàn giao.** Còn 3 lỗi kỹ thuật chặn (mục B, GO-01) và phần nội dung Hana phải đưa (mục C).

## B. GO-01 – sửa kỹ thuật trước khi lên (Planning đã làm 20/10, PR kèm file này)

| #   | Vấn đề                                                                                                                                                                                                                                                                                  | Sửa                                                                                                                                                                                                                            |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| B1  | **Logo không bao giờ hiện.** `Navbar.tsx:99` và `Footer.tsx:72` gọi `<Logo>` không truyền ảnh, nên mọi trang luôn hiện khung "LOGO – chờ file từ Hana", kể cả khi Hana đã tải logo vào Cài đặt website.                                                                                 | Navbar / Footer đọc `siteSettings.logo` (ảnh + mô tả ảnh). Chưa có logo thì giữ khung chờ như hiện tại. Có test.                                                                                                               |
| B2  | **`docker-compose.prod.yml` không chuyển biến video / lưu trữ vào app.** `VIDEO_PROVIDER`, `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_TOKEN_KEY` (và `S3_*` nếu sau này dùng R2) có ghi trong `.env` cũng không tới app, nên video trả phí luôn ở chế độ sandbox (không hiện video thật). | Thêm các biến này vào `environment` của `app` (để trống = như cũ).                                                                                                                                                             |
| B3  | **App mở cổng 3000 ra mọi địa chỉ.** Sửa 21/10: NPM ở VPS khác nên **không** dùng được `docker-compose.npm.yml` (mạng Docker chỉ có trong một máy).                                                                                                                                     | Không cần file override: đặt `APP_PORT=<IP_LAN_PROD>:3000` trong `.env` → app chỉ nghe trên IP LAN. Thêm luật `DOCKER-USER` chỉ cho `<IP_LAN_NPM>` vào cổng 3000 (mục E1). `docker-compose.npm.yml` chỉ dùng khi NPM cùng máy. |
| B4  | **Backup chưa tự động và thiếu volume `private`** (PDF trả phí). AGENTS §11 yêu cầu backup hằng ngày, giữ 14 ngày.                                                                                                                                                                      | `scripts/backup.sh`: dump DB + nén `media` + `private`, kiểm checksum, xóa bản quá 14 ngày. Kèm 1 dòng crontab. RUNBOOK ghi cách chép bản backup ra ngoài server.                                                              |
| B5  | **Chưa có cách liệt kê dữ liệu MẪU sau khi chuyển DB.**                                                                                                                                                                                                                                 | `pnpm sample:report` **chỉ đọc**: in số bản ghi `isSample` theo từng bảng, kèm trang / sản phẩm đã xuất bản còn chữ `[MẪU]`. Hana xóa hoặc sửa trong admin, script không tự xóa (tránh xóa nhầm thứ Hana đã sửa).              |

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

1. Tại nhà cung cấp tên miền, tạo bản ghi `A`: `tramdungcamxuc.com` → `<IP_CONG_KHAI_NPM>` và `www` → `<IP_CONG_KHAI_NPM>` (IP mà cổng 80/443 tới **VPS NPM** – xem câu hỏi ở đầu file về `115.79.58.24`). Không bật proxy. Kiểm tra: `dig +short tramdungcamxuc.com` trả đúng IP đó.
2. **VPS NPM**: mở 80, 443 ra Internet (Let's Encrypt cần 80). Cổng admin NPM (81) chỉ mở cho IP của anh.
3. **VPS production**: cài Docker + plugin compose (nếu chưa có). Mở ra Internet **chỉ** cổng SSH; không mở 80 / 443 / 3000.
   - Lấy IP LAN: `ip -4 addr` (ghi `<IP_LAN_PROD>` và tên card mạng LAN). Từ VPS NPM thử `ping <IP_LAN_PROD>`.
   - **Lưu ý:** cổng Docker mở ra **không** đi qua luật `ufw` thường. Gắn app vào IP LAN (`APP_PORT` ở mục G) để Internet không vào được, rồi chặn các máy LAN khác (nếu nhà cung cấp dùng chung LAN với khách khác thì máy lạ có thể gọi thẳng app và giả `X-Forwarded-For` để lách giới hạn OTP / form):

     ```bash
     sudo iptables -I DOCKER-USER -p tcp -m conntrack --ctorigdst <IP_LAN_PROD> --ctorigdstport 3000 ! -s <IP_LAN_NPM> -j DROP
     sudo apt-get install -y iptables-persistent && sudo netfilter-persistent save   # giữ luật sau khi khởi động lại
     ```

     Chạy sau khi Docker đã chạy (chuỗi `DOCKER-USER` do Docker tạo). Kiểm ở mục E5.
4. `git clone https://github.com/residoken-wq/tramdungcamxuc.git /opt/tdcx && cd /opt/tdcx`. Đăng nhập GHCR như RUNBOOK mục "Xác thực GitHub Container Registry".
5. Tạo `/opt/tdcx/.env` (anh tự gõ, `chmod 600`, **không** gửi nội dung cho ai). Danh sách biến ở mục G.

### E2. Chuyển dữ liệu từ demo

1. Trên **server demo**, dọn trước khi sao lưu. Lệnh xóa khách demo không chạy được trên bản thật vì bị chặn với domain thật:
   `docker compose -p tdcx-demo -f docker-compose.prod.yml --profile tools run --rm -e DEMO_SEED_ALLOW=true -e SITE_URL=https://tdcx.skoolmate.vn seed pnpm seed:demo-gd2:clean < /dev/null` (đúng lệnh trong RUNBOOK mục "Dữ liệu demo GĐ 2")
   Lệnh này chỉ xóa 3 khách demo cố định (`hoc-vien-test-0x@example.test`), đơn / quyền / tracker của họ và workshop `[MẪU]` demo. Đơn thật ngày 15/10 không bị đụng.
2. Vẫn trên server demo: `git pull --ff-only`, rồi sao lưu bằng script mới (DB + `media` + `private`):
   `PROJECT=tdcx-demo COMPOSE_FILES="-f docker-compose.prod.yml" BACKUP_ROOT=/root/tdcx-move ./scripts/backup.sh`
   Mong đợi dòng `backup OK: …`. Kiểm `SHA256SUMS`. App demo dừng vài giây rồi tự chạy lại.
3. Chép thư mục backup sang VPS mới (`scp` / `rsync`), kiểm lại checksum trên VPS.
4. Trên VPS production (`cd /opt/tdcx`), khôi phục bằng các lệnh dưới. **Không** làm theo nguyên mục "Phục hồi toàn diện" của RUNBOOK: mục đó có `git switch` về commit cũ và `curl 127.0.0.1:3400`, không đúng khi chuyển server.

   ```bash
   export B=/duong-dan/tdcx-move/<THOI-DIEM>          # thư mục backup vừa chép sang
   (cd "$B" && sha256sum -c SHA256SUMS)
   export DC="docker compose -p tdcx -f docker-compose.prod.yml"
   $DC pull < /dev/null
   $DC up -d postgres < /dev/null
   $DC exec -T postgres pg_restore -U postgres -d tramdungcamxuc --no-owner --no-privileges --exit-on-error < "$B/database.dump"
   $DC run --rm --no-deps -T --entrypoint tar app -C /app/media -xzf - < "$B/media.tar.gz"
   $DC run --rm --no-deps -T --entrypoint tar app -C /app/private -xzf - < "$B/private.tar.gz"
   ```

   DB vừa tạo còn trống nên không cần `DROP DATABASE`. Nếu `pg_restore` báo bảng đã có (đã lỡ chạy app trước) thì dừng lại, báo Planning.
   **Trước dòng `tar … /app/private` cuối, kiểm quyền thư mục `private`:** image hiện chỉ tạo sẵn `/app/media` cho user `node`; volume `private` mới có thể thuộc `root` nên lệnh `tar … /app/private` (chạy bằng user `node`) báo `Permission denied`, và Hana tải PDF trả phí cũng lỗi. Kiểm: `$DC run --rm --no-deps -T --entrypoint sh app -c 'ls -ld /app/private && touch /app/private/.w && rm /app/private/.w && echo OK'`. Không ra `OK` → chạy `$DC run --rm --no-deps -T -u root --entrypoint chown app -R node:node /app/private` rồi làm lại. (Kèm PR này: `Dockerfile` tạo sẵn `/app/private` cho user `node`, volume mới sẽ đúng quyền.)

5. `$DC up -d < /dev/null`. App tự chạy các migration còn thiếu. Xem log: `$DC logs app --tail 100`, không có dòng lỗi migration. Từ **VPS NPM** thử: `curl -s http://<IP_LAN_PROD>:3000/api/users/init` → có `"initialized":true`.
6. Dữ liệu `[MẪU]` còn lại (chỉ đọc, không xóa gì):
   `$DC --profile tools run --rm seed pnpm sample:report < /dev/null`
   In bảng số bản ghi mẫu theo từng bảng và danh sách `#id – trạng thái – còn chữ [MẪU] hay đã sửa`. Hana sửa thành nội dung thật hoặc xóa trong admin. 6 trang pháp lý hiện "đã sửa chữ" vì là khung trống, chỉ cần điền nội dung.
7. **Không** chạy `pnpm seed` hay bất kỳ lệnh `seed:demo-gd2*` nào trên server thật.
8. Tài khoản admin chuyển theo DB. Tạo tài khoản `owner` cho Hana trong admin (anh tự gửi mật khẩu). Rà danh sách Quản trị viên, xóa tài khoản test.

### E3. Nginx Proxy Manager

Tạo **Proxy Host**:

- Domain Names: `tramdungcamxuc.com`, `www.tramdungcamxuc.com`
- Scheme `http`, Forward Hostname / IP **`<IP_LAN_PROD>`**, Forward Port `3000` (NPM ở VPS khác nên không gọi được tên container)
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
    proxy_pass http://<IP_LAN_PROD>:3000;
}

location = /api/payments/sepay/webhook {
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Real-IP $remote_addr;
    client_max_body_size 64k;
    proxy_pass http://<IP_LAN_PROD>:3000;
}
```

Kiểm (chạy trên **VPS NPM**) cấu hình NPM sinh ra **không** còn `$proxy_add_x_forwarded_for` cho host này: `docker exec <container-npm> sh -c 'grep -rn "forwarded_for\|tramdungcamxuc" /data/nginx/proxy_host/'`. NPM chỉ bỏ khối `location /` mặc định khi tab Advanced đã có `location /`. Nếu vẫn thấy `$proxy_add_x_forwarded_for` trong file của host này thì dừng lại, báo Planning.

### E4. Cron (crontab của user chạy Docker trên VPS)

5 việc hẹn giờ, gọi bằng `CRON_SECRET` trong `.env`. Backup hằng ngày: `15 3 * * * cd /opt/tdcx && ./scripts/backup.sh >> /var/log/tdcx-backup.log 2>&1` (giữ 14 ngày ở `/opt/tdcx-backups`; mỗi tuần chép thư mục này ra máy khác). Lệnh mẫu và giờ chạy lấy đúng RUNBOOK mục "Lịch Cron …" (T1-12a, T2-10, T2-02, T2-04, T2-06), đổi `cd /opt/tramdungcamxuc` thành `cd /opt/tdcx` và `http://127.0.0.1:3400` thành **`http://<IP_LAN_PROD>:3000`** (app không còn nghe `127.0.0.1`; gọi thẳng IP LAN tránh phải đi vòng ra IP công khai rồi vào lại NPM – nhiều mạng LAN không cho đi vòng như vậy). Lần đầu chạy tay 1 lệnh, phải ra `"success":true`. Thêm dòng backup hằng ngày của GO-01 B4. Thiếu cron thì đơn chờ không bao giờ hết hạn và không có email nhắc.

### E5. Kiểm sau khi lên (anh chạy, báo Planning kết quả)

```bash
curl -sI https://tramdungcamxuc.com | head -5                          # 200, có strict-transport-security
curl -s https://tramdungcamxuc.com/robots.txt                          # đang mở mềm: Disallow toàn bộ
curl -s -o /dev/null -w "%{http_code}\n" https://tramdungcamxuc.com/api/test-reset-admins   # phải 404
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://tramdungcamxuc.com/api/cron/expire-orders   # phải 401 (không kèm khóa)
docker compose -p tdcx -f docker-compose.prod.yml ps                  # (trên VPS production) app + postgres healthy; cổng ghi <IP_LAN_PROD>:3000->3000, KHÔNG phải 0.0.0.0:3000
```

Kiểm cổng 3000 chỉ NPM vào được:

```bash
curl -m 5 -s -o /dev/null -w "%{http_code}\n" http://<IP_CONG_KHAI_PROD>:3000/   # từ máy ngoài Internet: phải hết giờ / 000
curl -m 5 -s -o /dev/null -w "%{http_code}\n" http://<IP_LAN_PROD>:3000/         # từ VPS NPM: 200
curl -m 5 -s -o /dev/null -w "%{http_code}\n" http://<IP_LAN_PROD>:3000/         # từ 1 máy LAN khác (nếu có): phải hết giờ / 000
```

Rồi trên trình duyệt (điện thoại + máy tính):

- `/admin` đăng nhập được;
- trang chủ hiện, form gửi được (Turnstile thật);
- đăng nhập OTP bằng email thật của anh: **nhận được email** (Resend đã xác minh domain);
- mở 1 trang pháp lý, 1 sản phẩm, 1 thẻ EQ qua link QR.

## F. Thứ tự đề xuất

1. GO-01 đã làm → anh duyệt PR, merge, CI build image mới (đặt `TURNSTILE_SITE_KEY` **trước** khi merge để image mới có key thật).
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
| `APP_PORT`                                                                                        | **`<IP_LAN_PROD>:3000`** – app chỉ nghe trên IP LAN (GO-01 B3, sửa 21/10). Để trống = mở `0.0.0.0:3000` ra Internet, **không được**                         |
| **Không bao giờ đặt** `E2E_TEST_HOOKS`, `DEMO_SEED_ALLOW`, `SEED_ALLOW_PROD`, `STYLEGUIDE_PUBLIC` |                                                                                                                                                             |
