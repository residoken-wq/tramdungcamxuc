# Lên tramdungcamxuc.com – từng lệnh (DB mới, 28/10/2026)

Bản lệnh chạy theo thứ tự cho anh Nhân. Lý do và chi tiết: `docs/plan/GO_LIVE.md` (mục E, phương án DB mới sửa 28/10).

- Mỗi khối ghi **chạy ở đâu**: `[VPS prod]` = 192.168.250.30, `[VPS NPM]` = 192.168.250.10, `[Máy ngoài]` = máy / điện thoại ngoài mạng LAN.
- Có dòng **Mong đợi**: không ra như vậy thì dừng, chép kết quả gửi Planning. **Không** chép mật khẩu / khóa vào tin nhắn.
- Planning không vào server, không giữ khóa nào.

---

## 0. Trước khi bắt đầu (GitHub, DNS, email)

1. **Turnstile:** trong Cloudflare, widget có domain `tramdungcamxuc.com`. GitHub → repo → Settings → Secrets and variables → Actions → **Variables**: `TURNSTILE_SITE_KEY` = site key của widget. Đặt **trước** khi CI build image sẽ dùng (mục 2 kiểm lại).
2. **DNS:** bản ghi `A` `tramdungcamxuc.com` và `www` → `115.79.58.24`, không bật proxy.
3. **Resend:** xác minh domain `tramdungcamxuc.com` (SPF, DKIM) để gửi được email OTP.
4. **NAT:** WAN 80, 443 → `192.168.250.10` (chỉ DNAT, không SNAT). Không NAT 3000, 5432, 81.

`[Máy ngoài]` Mong đợi: `dig +short tramdungcamxuc.com` → `115.79.58.24`.

---

## 1. Lấy code và chọn image `[VPS prod]`

```bash
sudo mkdir -p /opt/tdcx && sudo chown "$USER" /opt/tdcx
git clone https://github.com/residoken-wq/tramdungcamxuc.git /opt/tdcx
cd /opt/tdcx
git log -1 --format='%h %s'          # commit main mới nhất
```

Image dùng tag `sha-<7 ký tự>` của commit đó (CI build sau mỗi lần merge vào `main`; xem tab Actions phải xanh). Ghi lại 7 ký tự, VD `00ec145` → `sha-00ec145`.

---

## 2. Kiểm image có Turnstile thật `[VPS prod]`

```bash
TAG=sha-xxxxxxx                      # thay bằng tag ở bước 1
docker pull ghcr.io/residoken-wq/tramdungcamxuc:$TAG
docker pull ghcr.io/residoken-wq/tramdungcamxuc:tools-$TAG
docker run --rm --entrypoint sh ghcr.io/residoken-wq/tramdungcamxuc:$TAG \
  -c 'grep -rl 1x00000000000000000000AA /app/.next 2>/dev/null | head -1; echo done'
```

Mong đợi: chỉ in `done`. Nếu in thêm một đường dẫn file → image đang dùng **key thử** của Cloudflare: đặt biến `TURNSTILE_SITE_KEY` (bước 0.1), tạo một commit mới trên `main` (VD Planning merge một PR tài liệu), chờ CI xanh, làm lại bước 1–2 với tag mới.

---

## 3. Tạo `.env` `[VPS prod]`

Khóa bí mật được sinh thẳng vào file, **không hiện ra màn hình**:

```bash
cd /opt/tdcx
umask 077
cat > .env <<'EOF'
APP_TAG=sha-xxxxxxx
APP_PORT=192.168.250.30:3000
SITE_URL=https://tramdungcamxuc.com
SITE_NOINDEX=true
CSP_ENFORCE=
PAYMENT_PROVIDER=manual
PAYMENT_SANDBOX=
EMAIL_FROM=TRAM DUNG CAM XUC <no-reply@tramdungcamxuc.com>
VIDEO_PROVIDER=
BUNNY_STREAM_LIBRARY_ID=
BUNNY_STREAM_TOKEN_KEY=
EOF
{
  echo "PAYLOAD_SECRET=$(openssl rand -hex 32)"
  echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)"
  echo "CRON_SECRET=$(openssl rand -hex 32)"
} >> .env
chmod 600 .env
nano .env        # sửa APP_TAG cho đúng tag bước 1, rồi THÊM 2 dòng tự gõ:
                 #   RESEND_API_KEY=...        (từ Resend)
                 #   TURNSTILE_SECRET_KEY=...  (secret của widget ở bước 0.1)
```

- Dùng SePay tự động: đổi `PAYMENT_PROVIDER=sepay` và thêm `SEPAY_WEBHOOK_API_KEY=...` (RUNBOOK mục SePay). Chưa thì để `manual` (Hana bấm xác nhận).
- **Không bao giờ** thêm `E2E_TEST_HOOKS`, `DEMO_SEED_ALLOW`, `SEED_ALLOW_PROD`, `STYLEGUIDE_PUBLIC`.

Mong đợi (chỉ in tên biến, không in giá trị):

```bash
cut -d= -f1 .env | sort
grep -c '^E2E_TEST_HOOKS' .env       # phải ra 0
```

---

## 4. Chạy app trên DB trống `[VPS prod]`

```bash
cd /opt/tdcx
export DC="docker compose -p tdcx -f docker-compose.prod.yml"
$DC pull < /dev/null
$DC --profile tools pull seed < /dev/null
$DC up -d < /dev/null
sleep 60
$DC ps < /dev/null
$DC logs app --tail 100 < /dev/null
```

Mong đợi:

- `app` và `postgres` ở trạng thái `healthy`; cột cổng của `app` ghi `192.168.250.30:3000->3000/tcp` (**không** phải `0.0.0.0:3000`).
- Log không có dòng lỗi migration (app tự tạo toàn bộ bảng).

Chặn máy LAN khác gọi thẳng cổng 3000 (chỉ NPM được vào):

```bash
sudo iptables -I DOCKER-USER -p tcp -m conntrack --ctorigdst 192.168.250.30 --ctorigdstport 3000 ! -s 192.168.250.10 -j DROP
sudo apt-get install -y iptables-persistent && sudo netfilter-persistent save
```

`[VPS NPM]` Mong đợi: `curl -s http://192.168.250.30:3000/api/users/init` → có `"initialized":false`.

---

## 5. Nạp dữ liệu (đúng thứ tự 5a → 5b → 5c) `[VPS prod]`

```bash
cd /opt/tdcx
export DC="docker compose -p tdcx -f docker-compose.prod.yml"
```

**5a. Khung `[MẪU]`** (chỉ chạy **một lần**):

```bash
$DC --profile tools run --rm seed < /dev/null
```

Mong đợi: bảng số bản ghi `created`, dòng cuối `Seed dữ liệu MẪU xong`.

**5b. Habit Hack thật:**

```bash
$DC --profile tools run --rm seed pnpm import:habit < /dev/null
```

Mong đợi: `diagnosticQuestions 16`, `courseModules 7`, `lessons 20`, `techniques 11` ở cột `created`; dòng cuối `Đã nhập nội dung Habit Hack thật`.

**5c. 26 thẻ EQ thật.** Chép file JSON của Hana lên VPS **ngoài** `/opt/tdcx`, VD `/root/eq-cards-26.json`, rồi:

```bash
sudo chmod 600 /root/eq-cards-26.json
$DC --profile tools run --rm \
  -v /root/eq-cards-26.json:/import/eq-cards.json:ro \
  -e EQ_CARDS_FILE=/import/eq-cards.json \
  seed pnpm import:eq < /dev/null
```

Mong đợi: dòng cuối `Đã nhập dữ liệu thẻ EQ thật thành công`, bảng có đủ 26 thẻ. Báo lỗi định dạng thì không có gì được ghi: gửi Planning dòng lỗi (không gửi nội dung thẻ).

---

## 6. Nginx Proxy Manager `[VPS NPM]` (giao diện NPM, cổng 81 trong LAN)

1. **Access Lists → Add**: tên `chi-anh-nhan`, tab Rules: `allow <IP công khai của anh>`, `deny all`. (Tạm thời, gỡ ở bước 7.)
2. **Hosts → Proxy Hosts → Add**:
   - Domain Names: `tramdungcamxuc.com`, `www.tramdungcamxuc.com`
   - Scheme `http`, Forward Hostname / IP `192.168.250.30`, Forward Port `3000`
   - Bật **Block Common Exploits**, **Websockets Support**; Access List: `chi-anh-nhan`
   - Tab **SSL**: Request a new SSL Certificate, bật **Force SSL**, **HTTP/2**. **Chưa** bật HSTS.
   - Tab **Advanced** (bắt buộc – thiếu thì khách giả IP để lách giới hạn OTP):

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

Kiểm cấu hình NPM sinh ra (thay `<container-npm>` bằng tên container NPM, xem `docker ps`):

```bash
docker exec <container-npm> sh -c 'grep -rln "tramdungcamxuc" /data/nginx/proxy_host/'
docker exec <container-npm> sh -c 'grep -n "proxy_add_x_forwarded_for" $(grep -rl "tramdungcamxuc" /data/nginx/proxy_host/)'
```

Mong đợi: lệnh thứ hai **không in gì**. In ra dòng nào → dừng, báo Planning.

---

## 7. Tài khoản quản trị (trình duyệt, từ máy có IP trong Access List)

1. Mở `https://tramdungcamxuc.com/admin` → form **tạo tài khoản đầu tiên** → tạo tài khoản của anh (tự nhận vai trò `owner`).
2. Vào **Quản trị viên** → tạo tài khoản cho Hana → đổi vai trò thành `owner`. Anh tự gửi mật khẩu cho Hana.
3. NPM: sửa Proxy Host, Access List về **Publicly Accessible** (gỡ giới hạn IP).

---

## 8. Cron + backup `[VPS prod]`

`crontab -e`, dán 6 dòng (khóa đọc từ `.env` mỗi lần, không dán khóa vào crontab):

```cron
0 * * * * cd /opt/tdcx && curl -s -X POST -H "Authorization: Bearer $(grep ^CRON_SECRET= .env | cut -d= -f2)" http://192.168.250.30:3000/api/cron/expire-orders >> /var/log/tdcx-cron-expire.log 2>&1 && echo >> /var/log/tdcx-cron-expire.log
15 * * * * cd /opt/tdcx && curl -s -X POST -H "Authorization: Bearer $(grep ^CRON_SECRET= .env | cut -d= -f2)" http://192.168.250.30:3000/api/cron/workshop-reminders >> /var/log/tdcx-cron-workshop.log 2>&1 && echo >> /var/log/tdcx-cron-workshop.log
0 * * * * cd /opt/tdcx && curl -s -X POST -H "Authorization: Bearer $(grep ^CRON_SECRET= .env | cut -d= -f2)" http://192.168.250.30:3000/api/cron/expire-entitlements >> /var/log/tdcx-cron-entitlements.log 2>&1 && echo >> /var/log/tdcx-cron-entitlements.log
30 * * * * cd /opt/tdcx && curl -s -X POST -H "Authorization: Bearer $(grep ^CRON_SECRET= .env | cut -d= -f2)" http://192.168.250.30:3000/api/cron/trial-reminders >> /var/log/tdcx-cron-trial.log 2>&1 && echo >> /var/log/tdcx-cron-trial.log
45 * * * * cd /opt/tdcx && curl -s -X POST -H "Authorization: Bearer $(grep ^CRON_SECRET= .env | cut -d= -f2)" http://192.168.250.30:3000/api/cron/tracker-nudges >> /var/log/tdcx-cron-nudges.log 2>&1 && echo >> /var/log/tdcx-cron-nudges.log
15 3 * * * cd /opt/tdcx && ./scripts/backup.sh >> /var/log/tdcx-backup.log 2>&1
```

Log ghi vào `/var/log`: user chạy crontab phải ghi được ở đó (dùng crontab của `root`, hoặc đổi đường dẫn log sang thư mục của user).

Chạy tay một lần để kiểm:

```bash
cd /opt/tdcx
curl -s -X POST -H "Authorization: Bearer $(grep ^CRON_SECRET= .env | cut -d= -f2)" http://192.168.250.30:3000/api/cron/expire-orders; echo
./scripts/backup.sh
```

Mong đợi: lệnh curl in JSON có `"success":true`; backup in dòng `backup OK: …`, thư mục mới trong `/opt/tdcx-backups`. Mỗi tuần chép thư mục này ra máy khác.

---

## 9. Kiểm sau khi lên

`[Máy ngoài]`

```bash
curl -sI https://tramdungcamxuc.com | head -5                                              # 200, có strict-transport-security
curl -s https://tramdungcamxuc.com/robots.txt                                              # Disallow: / (đang mở mềm)
curl -s -o /dev/null -w "%{http_code}\n" https://tramdungcamxuc.com/api/test-reset-admins  # 404
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://tramdungcamxuc.com/api/cron/expire-orders   # 401
curl -m 5 -s -o /dev/null -w "%{http_code}\n" http://115.79.58.24:3000/                    # 000 (hết giờ)
```

`[VPS NPM]` `curl -m 5 -s -o /dev/null -w "%{http_code}\n" http://192.168.250.30:3000/` → `200`.

`[Máy chủ vật lý 192.168.1.240 hoặc máy LAN khác]` cùng lệnh → `000` (hết giờ).

**IP thật của khách:** mở trang chủ bằng 4G điện thoại, rồi `[VPS NPM]`:

```bash
docker exec <container-npm> sh -c 'tail -5 /data/logs/proxy-host-*_access.log'
```

Mong đợi: thấy IP công khai của điện thoại, **không** phải `192.168.x.x` (nếu là `192.168.x.x` → sửa NAT chỉ DNAT trước khi mở bán).

**Trình duyệt (điện thoại + máy tính):** `/admin` đăng nhập được; trang chủ hiện; gửi thử form Liên hệ (Turnstile thật, không báo lỗi cấu hình); đăng nhập OTP bằng email thật của anh → nhận được email; mở 1 trang pháp lý, 1 sản phẩm, 1 thẻ EQ.

---

## 10. Danh sách `[MẪU]` cho Hana `[VPS prod]`

```bash
cd /opt/tdcx
docker compose -p tdcx -f docker-compose.prod.yml --profile tools run --rm seed pnpm sample:report < /dev/null
```

Chỉ đọc, không xóa gì. Gửi bảng này cho Planning / Hana. Khoảng: 8 trang, 12 sản phẩm, 2 dịch vụ, 2 chương trình, 2 bài viết, 3 lời chia sẻ, 3 FAQ, 6 trang pháp lý khung trống.

**Không chạy lại** `pnpm seed` sau khi Hana đã bắt đầu sửa. **Không bao giờ** chạy `seed:demo-gd2*` trên bản thật.

---

## 11. Sau này

- **Cập nhật bản mới:** `cd /opt/tdcx && git pull --ff-only`, sửa `APP_TAG` trong `.env` sang tag mới, `docker compose -p tdcx -f docker-compose.prod.yml pull && … up -d`.
- **Bật bán** (khi Hana xong nội dung bắt buộc + anh duyệt `REVIEW-REQUIRED`): `.env` đặt `SITE_NOINDEX=` (trống), `CSP_ENFORCE=true`, rồi `up -d` (không chỉ `restart`). Thử 1 đơn thật nhỏ đi hết luồng. Sau 1 ngày HTTPS ổn mới bật HSTS trong NPM.
- **Bản demo** `tdcx.skoolmate.vn`: tắt, hoặc giữ `SITE_NOINDEX=true` + mật khẩu.
