# Lên tramdungcamxuc.com và bàn giao cho Hana (kế hoạch 20/10/2026, sửa 21/10: NPM ở VPS khác; sửa 28/10: DB mới, không chuyển từ demo)

> **Chạy lệnh:** bản từng lệnh theo thứ tự ở [`GO_LIVE_STEPS.md`](GO_LIVE_STEPS.md) (28/10). File này giữ lý do và chi tiết.

Đã chốt với anh Nhân 20/10:

- Dữ liệu: ~~chuyển DB + ảnh của bản demo~~ → **sửa 28/10: DB mới**, nạp dữ liệu thật Hana đã cung cấp (Habit Hack, 26 thẻ EQ) + khung `[MẪU]` để Hana thay (mục E2).
- **Mở mềm**: lên domain thật nhưng `SITE_NOINDEX=true`, chưa quảng bá. Hana nhập nội dung thật và làm buổi thử CM-07 ngay trên bản thật. Đủ mục C mới bật index và bán.
- DNS trỏ thẳng IP WAN `115.79.58.24`, không qua Cloudflare proxy.
- **Sửa 21/10:** Nginx Proxy Manager (NPM) chạy bằng Docker trên **một VPS khác**, cùng lớp mạng nội bộ (LAN) với VPS production. Không phải cùng máy như bản 20/10. Bản demo ở server khác nữa.

Mô hình mạng (anh Nhân xác nhận 21/10):

```
Khách ──80/443──▶ 115.79.58.24 (IP WAN) ──NAT──▶ máy chủ vật lý 192.168.1.240
                                                   ├─ VPS NPM   192.168.250.10  (nhận 80/443)
                                                   └─ VPS prod  192.168.250.30  (app :3000 + postgres)
NPM 192.168.250.10 ──http──▶ 192.168.250.30:3000
```

Yêu cầu NAT (router / máy chủ vật lý, anh Nhân cấu hình):

- WAN `80`, `443` → `192.168.250.10` (NPM). Let's Encrypt cần cổng 80.
- **Không** NAT cổng `3000`, `5432` hay cổng admin NPM `81` ra WAN (81 chỉ mở trong LAN / VPN của anh).
- **Giữ IP thật của khách** (chỉ DNAT, không SNAT / masquerade khi vào `192.168.250.10`). Nếu NPM thấy mọi khách cùng một IP (`192.168.1.240` hoặc `192.168.250.1`) thì giới hạn gửi OTP / form tính chung cho mọi người → khách thật bị chặn. Kiểm ở mục E5.

Planning **không** vào server, không đọc / ghi mật khẩu hay khóa. Mọi lệnh dưới đây anh Nhân tự chạy rồi báo kết quả.

---

## A. Tình trạng code (kiểm 20/10 trên `main` @ `c8cbcfb`)

- CI trên `main` xanh, gồm lint, typecheck, unit, build và **toàn bộ e2e**. Hai lần merge tài liệu sau đó cũng xanh.
- Máy QA, DB trống: lint 0 lỗi, unit 125 file / **1331 test** xanh, migration chạy từ DB rỗng đến hết, build production qua.
- E2E chạy lại trên máy QA: các test đỏ đều do máy QA không ra mạng được Cloudflare Turnstile, nên không có test nào đỏ vì code.
- Migration tự chạy khi container khởi động (`prodMigrations`), không cần lệnh riêng.

**Kết luận: code chạy ổn, nhưng chưa đủ để bàn giao.** Còn 3 lỗi kỹ thuật chặn (mục B, GO-01) và phần nội dung Hana phải đưa (mục C).

## B. GO-01 – sửa kỹ thuật trước khi lên (Planning đã làm 20/10, PR kèm file này)

| #   | Vấn đề                                                                                                                                                                                                                                                                                  | Sửa                                                                                                                                                                                                                               |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | **Logo không bao giờ hiện.** `Navbar.tsx:99` và `Footer.tsx:72` gọi `<Logo>` không truyền ảnh, nên mọi trang luôn hiện khung "LOGO – chờ file từ Hana", kể cả khi Hana đã tải logo vào Cài đặt website.                                                                                 | Navbar / Footer đọc `siteSettings.logo` (ảnh + mô tả ảnh). Chưa có logo thì giữ khung chờ như hiện tại. Có test.                                                                                                                  |
| B2  | **`docker-compose.prod.yml` không chuyển biến video / lưu trữ vào app.** `VIDEO_PROVIDER`, `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_TOKEN_KEY` (và `S3_*` nếu sau này dùng R2) có ghi trong `.env` cũng không tới app, nên video trả phí luôn ở chế độ sandbox (không hiện video thật). | Thêm các biến này vào `environment` của `app` (để trống = như cũ).                                                                                                                                                                |
| B3  | **App mở cổng 3000 ra mọi địa chỉ.** Sửa 21/10: NPM ở VPS khác nên **không** dùng được `docker-compose.npm.yml` (mạng Docker chỉ có trong một máy).                                                                                                                                     | Không cần file override: đặt `APP_PORT=192.168.250.30:3000` trong `.env` → app chỉ nghe trên IP LAN. Thêm luật `DOCKER-USER` chỉ cho `192.168.250.10` vào cổng 3000 (mục E1). `docker-compose.npm.yml` chỉ dùng khi NPM cùng máy. |
| B4  | **Backup chưa tự động và thiếu volume `private`** (PDF trả phí). AGENTS §11 yêu cầu backup hằng ngày, giữ 14 ngày.                                                                                                                                                                      | `scripts/backup.sh`: dump DB + nén `media` + `private`, kiểm checksum, xóa bản quá 14 ngày. Kèm 1 dòng crontab. RUNBOOK ghi cách chép bản backup ra ngoài server.                                                                 |
| B5  | **Chưa có cách liệt kê dữ liệu MẪU sau khi chuyển DB.**                                                                                                                                                                                                                                 | `pnpm sample:report` **chỉ đọc**: in số bản ghi `isSample` theo từng bảng, kèm trang / sản phẩm đã xuất bản còn chữ `[MẪU]`. Hana xóa hoặc sửa trong admin, script không tự xóa (tránh xóa nhầm thứ Hana đã sửa).                 |

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

1. Tại nhà cung cấp tên miền, tạo bản ghi `A`: `tramdungcamxuc.com` → `115.79.58.24` và `www` → `115.79.58.24` (NAT 80/443 vào NPM `192.168.250.10`). Không bật proxy. Kiểm tra: `dig +short tramdungcamxuc.com` trả đúng IP đó.
2. **VPS NPM `192.168.250.10`**: nhận 80, 443 qua NAT (mục đầu file). Cổng admin NPM (81) chỉ mở trong LAN / cho IP của anh.
3. **VPS production `192.168.250.30`**: cài Docker + plugin compose (nếu chưa có). **Không** NAT cổng nào của VPS này ra WAN (SSH chỉ trong LAN / VPN).
   - Kiểm `ip -4 addr` có `192.168.250.30`. Từ VPS NPM thử `ping 192.168.250.30`.
   - **Lưu ý:** cổng Docker mở ra **không** đi qua luật `ufw` thường. Gắn app vào IP LAN (`APP_PORT` ở mục G) để Internet không vào được, rồi chặn các máy LAN khác (mọi máy khác trong `192.168.250.0/24` hay `192.168.1.0/24` gọi thẳng được app và giả `X-Forwarded-For` để lách giới hạn OTP / form):

     ```bash
     sudo iptables -I DOCKER-USER -p tcp -m conntrack --ctdir ORIGINAL --ctorigdst 192.168.250.30 --ctorigdstport 3000 ! -s 192.168.250.10 -j DROP
     sudo apt-get install -y iptables-persistent && sudo netfilter-persistent save   # giữ luật sau khi khởi động lại
     ```

     Chạy sau khi Docker đã chạy (chuỗi `DOCKER-USER` do Docker tạo). Kiểm ở mục E5.
4. `git clone https://github.com/residoken-wq/tramdungcamxuc.git /opt/tdcx && cd /opt/tdcx`. Đăng nhập GHCR như RUNBOOK mục "Xác thực GitHub Container Registry".
5. Tạo `/opt/tdcx/.env` (anh tự gõ, `chmod 600`, **không** gửi nội dung cho ai). Danh sách biến ở mục G.

### E2. DB mới + nạp dữ liệu Hana (sửa 28/10)

**Đổi phương án 28/10 (anh Nhân):** **không** chuyển DB / ảnh từ demo `tdcx.skoolmate.vn`. Bản thật dựng DB trống, rồi nạp dữ liệu thật Hana đã cung cấp. Hệ quả:

- Mọi thứ chỉ có trên demo **không sang**: khách / đơn thử (kể cả đơn SePay 15/10), tài khoản admin, ảnh đã tải, nội dung Hana đã sửa trên demo (nếu có). Hana nhập lại trên bản thật.
- Không cần `backup.sh`, `scp`, `pg_restore` hay lệnh dọn khách demo.
- Phần khung (trang dựng từ mẫu, menu, sản phẩm + 3 gói, dịch vụ, 6 trang pháp lý trống, FAQ, Cài đặt website) do `pnpm seed` tạo, **gắn nhãn `[MẪU]`** (`isSample`). Hana thay bằng nội dung thật trong admin; `pnpm sample:report` liệt kê chỗ còn `[MẪU]`. Lệnh seed **chỉ chạy một lần lúc dựng**, chỉ tạo / sửa bản ghi `isSample`, không đụng bản ghi thật.

Dữ liệu thật đã có:

| Dữ liệu                                                                        | Nguồn                                                                      | Lệnh                                                                                |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Habit Hack: 16 câu chẩn đoán, 11 kỹ thuật, 7 nhóm / 20 bài học (chưa có video) | file Excel của Hana, đã chuyển vào repo (`seed/import/habit-hack-data.ts`) | `pnpm import:habit`                                                                 |
| 26 thẻ EQ                                                                      | file JSON của Hana, **để ngoài repo** (không commit), anh giữ              | `pnpm import:eq`                                                                    |
| Giá 3 gói Growth Mirror + công cụ số                                           | `Growth_Mirror_Pricing_Calculator.xlsx`, đã nằm trong dữ liệu seed         | có trong `pnpm seed` (vẫn gắn `[MẪU]`, Hana xác nhận giá rồi bỏ nhãn bằng cách sửa) |

Các bước (trên VPS production, `cd /opt/tdcx`, sau E1):

1. Kiểm `.env` đã có đủ biến mục G, `APP_TAG` = `sha-…` của image đã kéo về. Kéo luôn image `tools` cùng tag (dùng cho seed / import):

   ```bash
   export DC="docker compose -p tdcx -f docker-compose.prod.yml"
   $DC pull < /dev/null
   $DC --profile tools pull seed < /dev/null
   ```

2. Chạy app trên DB trống. App tự chạy **toàn bộ migration** từ đầu (CI kiểm đường này mỗi lần build):

   ```bash
   $DC up -d < /dev/null
   $DC ps < /dev/null                     # app + postgres healthy (lần đầu chờ ~1 phút)
   $DC logs app --tail 100 < /dev/null    # không có dòng lỗi migration
   ```

   Từ **VPS NPM**: `curl -s http://192.168.250.30:3000/api/users/init` → `"initialized":false` (chưa có admin).

3. Dựng khung `[MẪU]` (một lần): `$DC --profile tools run --rm seed < /dev/null`. Mong đợi bảng `created` theo từng bảng, dòng "Seed dữ liệu MẪU xong".
4. Nạp Habit Hack thật: `$DC --profile tools run --rm seed pnpm import:habit < /dev/null`. Lệnh xóa câu quiz / kỹ thuật / bài học `[MẪU]` vừa tạo ở bước 3, thay bằng bản thật.
5. Nạp 26 thẻ EQ thật. Chép file JSON lên VPS vào thư mục **ngoài** `/opt/tdcx` (VD `/root/eq-cards-26.json`, `chmod 600`), rồi:

   ```bash
   $DC --profile tools run --rm \
     -v /root/eq-cards-26.json:/import/eq-cards.json:ro \
     -e EQ_CARDS_FILE=/import/eq-cards.json \
     seed pnpm import:eq < /dev/null
   ```

   Lệnh kiểm đủ 26 thẻ trước khi ghi, xóa thẻ `[MẪU]`, gắn sản phẩm "EQ Buddy số". Chạy lại không tạo trùng. Xong thì xóa file JSON khỏi VPS nếu không cần giữ.
   **Thứ tự 3 → 4 → 5 là bắt buộc**: chạy seed sau import thì seed vẫn bỏ qua dữ liệu thật, nhưng import cần sản phẩm "EQ Buddy số" do seed tạo.

6. Tài khoản admin đầu tiên: làm **ngay sau E3** (khi đã có HTTPS), mở `https://tramdungcamxuc.com/admin` tạo tài khoản đầu tiên (tự nhận vai trò `owner`). Trong lúc chờ, bật **Access List** trong NPM chỉ cho IP của anh vào host này, tạo xong admin mới gỡ, vì form "tạo admin đầu tiên" mở cho bất kỳ ai tới trước. Sau đó tạo tài khoản cho Hana, đổi vai trò thành `owner` (anh tự gửi mật khẩu).
7. Kiểm thử 28/10 (Planning, DB trống ở máy QA, `main` @ `00ec145`): seed → `import:habit` chạy sạch; Habit thay đủ 16 câu / 7 nhóm / 20 bài / 11 kỹ thuật. Còn `[MẪU]`: 8 trang, 12 sản phẩm, 2 dịch vụ, 2 chương trình, 2 bài viết, 3 lời chia sẻ (nháp), 3 FAQ, 3 thẻ EQ (mất sau bước 5), 6 trang pháp lý khung trống. 8 trang đều đã xuất bản; 7 trang chính có thêm **bản nháp** dựng từ mẫu mới (SM-07) – Hana mở trình dựng trang sẽ thấy bản nháp đó, trang công khai vẫn là bản đã xuất bản.
8. Danh sách còn `[MẪU]`: `$DC --profile tools run --rm seed pnpm sample:report < /dev/null` (chỉ đọc). Gửi bảng này cho Hana / Planning để Hana thay dần.
9. **Không** chạy `seed:demo-gd2*` trên bản thật (đã bị chặn với domain thật). Không chạy lại `pnpm seed` sau khi Hana bắt đầu sửa, trừ khi Planning yêu cầu.

### E3. Nginx Proxy Manager

Tạo **Proxy Host**:

- Domain Names: `tramdungcamxuc.com`, `www.tramdungcamxuc.com`
- Scheme `http`, Forward Hostname / IP **`192.168.250.30`**, Forward Port `3000` (NPM ở VPS khác nên không gọi được tên container)
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
    proxy_pass http://192.168.250.30:3000;
}

location = /api/payments/sepay/webhook {
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Real-IP $remote_addr;
    client_max_body_size 64k;
    proxy_pass http://192.168.250.30:3000;
}
```

Kiểm (chạy trên **VPS NPM**) cấu hình NPM sinh ra **không** còn `$proxy_add_x_forwarded_for` cho host này: `docker exec <container-npm> sh -c 'grep -rn "forwarded_for\|tramdungcamxuc" /data/nginx/proxy_host/'`. NPM chỉ bỏ khối `location /` mặc định khi tab Advanced đã có `location /`. Nếu vẫn thấy `$proxy_add_x_forwarded_for` trong file của host này thì dừng lại, báo Planning.

### E4. Cron (crontab của user chạy Docker trên VPS)

5 việc hẹn giờ, gọi bằng `CRON_SECRET` trong `.env`. Backup hằng ngày: `15 3 * * * cd /opt/tdcx && ./scripts/backup.sh >> /var/log/tdcx-backup.log 2>&1` (giữ 14 ngày ở `/opt/tdcx-backups`; mỗi tuần chép thư mục này ra máy khác). Lệnh mẫu và giờ chạy lấy đúng RUNBOOK mục "Lịch Cron …" (T1-12a, T2-10, T2-02, T2-04, T2-06), đổi `cd /opt/tramdungcamxuc` thành `cd /opt/tdcx` và `http://127.0.0.1:3400` thành **`http://192.168.250.30:3000`** (app không còn nghe `127.0.0.1`; gọi thẳng IP LAN tránh phải đi vòng ra IP công khai rồi vào lại NPM – nhiều mạng LAN không cho đi vòng như vậy). Lần đầu chạy tay 1 lệnh, phải ra `"success":true`. Thêm dòng backup hằng ngày của GO-01 B4. Thiếu cron thì đơn chờ không bao giờ hết hạn và không có email nhắc.

### E5. Kiểm sau khi lên (anh chạy, báo Planning kết quả)

```bash
curl -sI https://tramdungcamxuc.com | head -5                          # 200, có strict-transport-security
curl -s https://tramdungcamxuc.com/robots.txt                          # đang mở mềm: Disallow toàn bộ
curl -s -o /dev/null -w "%{http_code}\n" https://tramdungcamxuc.com/api/test-reset-admins   # phải 404
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://tramdungcamxuc.com/api/cron/expire-orders   # phải 401 (không kèm khóa)
docker compose -p tdcx -f docker-compose.prod.yml ps                  # (trên VPS production) app + postgres healthy; cổng ghi 192.168.250.30:3000->3000, KHÔNG phải 0.0.0.0:3000
```

Kiểm cổng 3000 chỉ NPM vào được:

```bash
curl -m 5 -s -o /dev/null -w "%{http_code}\n" http://115.79.58.24:3000/      # từ máy ngoài Internet: phải hết giờ / 000
curl -m 5 -s -o /dev/null -w "%{http_code}\n" http://192.168.250.30:3000/         # từ VPS NPM: 200
curl -m 5 -s -o /dev/null -w "%{http_code}\n" http://192.168.250.30:3000/         # từ máy chủ vật lý 192.168.1.240 hoặc máy LAN khác: phải hết giờ / 000
```

Kiểm NPM thấy **IP thật** của khách: mở trang chủ bằng 4G điện thoại, rồi trên VPS NPM xem log của proxy host (`docker exec <container-npm> sh -c 'tail -5 /data/logs/proxy-host-*_access.log'`). Phải thấy IP công khai của điện thoại, **không** phải `192.168.x.x`. Nếu là `192.168.x.x` → sửa NAT (chỉ DNAT) trước khi mở bán.

Rồi trên trình duyệt (điện thoại + máy tính):

- `/admin` đăng nhập được;
- trang chủ hiện, form gửi được (Turnstile thật);
- đăng nhập OTP bằng email thật của anh: **nhận được email** (Resend đã xác minh domain);
- mở 1 trang pháp lý, 1 sản phẩm, 1 thẻ EQ qua link QR.

## F. Thứ tự đề xuất

1. GO-01 đã làm → anh duyệt PR, merge, CI build image mới (đặt `TURNSTILE_SITE_KEY` **trước** khi merge để image mới có key thật).
2. Anh: DNS + Resend (xác minh domain `tramdungcamxuc.com`: SPF, DKIM) + Turnstile + E1–E5 với `SITE_NOINDEX=true`, `PAYMENT_SANDBOX=` để trống (đơn thật).
   Sửa 28/10: E2 là DB mới + `seed` khung `[MẪU]` + `import:habit` + `import:eq` (cần file JSON 26 thẻ). Không chuyển gì từ demo.
3. Hana: mục C (logo, pháp lý, giá, ngân hàng…) + buổi thử CM-07 trên bản thật. Planning chạy lại `pnpm sample:report`, viết biên bản CM-07.
4. Anh: duyệt mục D.
5. Bật bán: `SITE_NOINDEX=` (trống), `CSP_ENFORCE=true` (sau khi kiểm không lỗi console), `up -d`. Thử 1 đơn thật nhỏ đi hết luồng. Báo Hana.
6. Tắt bản demo `tdcx.skoolmate.vn` hoặc để `SITE_NOINDEX=true` + mật khẩu, tránh trùng nội dung với bản thật.

## G. Biến môi trường bản thật (chỉ tên – giá trị anh tự giữ)

| Biến                                                                                                            | Giá trị / ghi chú                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PAYLOAD_SECRET`                                                                                                | **Tạo mới** (`openssl rand -hex 32`), không dùng lại của demo. Hệ quả: mọi người đăng nhập lại, link trong email cũ của demo hết hiệu lực – chấp nhận được. |
| `POSTGRES_PASSWORD`                                                                                             | Tạo mới (hex). DB mới (sửa 28/10), không dùng gì của demo.                                                                                                  |
| `SITE_URL`                                                                                                      | `https://tramdungcamxuc.com`                                                                                                                                |
| `SITE_NOINDEX`                                                                                                  | `true` khi mở mềm, để trống khi bật bán                                                                                                                     |
| `CSP_ENFORCE`                                                                                                   | để trống khi mở mềm, `true` khi bật bán                                                                                                                     |
| `TURNSTILE_SECRET_KEY`                                                                                          | secret của widget có `tramdungcamxuc.com` (khớp `TURNSTILE_SITE_KEY` ở GitHub)                                                                              |
| `RESEND_API_KEY`, `EMAIL_FROM`                                                                                  | domain `tramdungcamxuc.com` đã xác minh trong Resend; `EMAIL_FROM` dạng `TRAM DUNG CAM XUC <no-reply@tramdungcamxuc.com>`                                   |
| `CRON_SECRET`                                                                                                   | tạo mới                                                                                                                                                     |
| `PAYMENT_PROVIDER`                                                                                              | `manual` (Hana bấm xác nhận) hoặc `sepay` + `SEPAY_WEBHOOK_API_KEY`                                                                                         |
| `PAYMENT_SANDBOX`                                                                                               | **để trống**                                                                                                                                                |
| `VIDEO_PROVIDER`, `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_TOKEN_KEY`                                           | khi đã có Bunny (cần GO-01 B2)                                                                                                                              |
| `APP_TAG`                                                                                                       | `sha-<7 ký tự>` của commit đã duyệt (không dùng `latest` cho bản thật)                                                                                      |
| `APP_PORT`                                                                                                      | **`192.168.250.30:3000`** – app chỉ nghe trên IP LAN (GO-01 B3, sửa 21/10). Để trống = mở `0.0.0.0:3000` ra Internet, **không được**                        |
| **Không bao giờ đặt** trong `.env`: `E2E_TEST_HOOKS`, `DEMO_SEED_ALLOW`, `SEED_ALLOW_PROD`, `STYLEGUIDE_PUBLIC` | (`SEED_ALLOW_PROD` đã gắn sẵn cho riêng service `seed` trong compose; đặt trong `.env` cũng không cần)                                                      |     |
