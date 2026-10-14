# Runbook – Hướng dẫn vận hành hệ thống

> Tài liệu hướng dẫn cài đặt, chạy local, kiểm thử, triển khai và xử lý sự cố.

---

## 1. Môi trường phát triển Local

### Yêu cầu tiên quyết

- **Node.js**: `>= 20.9.0` (Khuyên dùng Node 22 LTS)
- **pnpm**: `>= 9.0.0`
- **Docker & Docker Compose** (hoặc một dịch vụ PostgreSQL chạy ở cổng 5432 / Neon PostgreSQL)

### Các bước chạy local trong 5 bước

1. **Cài đặt thư viện phụ thuộc:**
   ```bash
   pnpm install
   ```
2. **Khởi tạo file cấu hình môi trường:**
   Sao chép `.env.example` thành `.env`:
   ```bash
   cp .env.example .env
   ```
3. **Khởi động Cơ sở dữ liệu PostgreSQL:**
   - Dùng Docker Compose:
     ```bash
     docker compose up -d
     ```
   - Hoặc kết nối tới cơ sở dữ liệu PostgreSQL cục bộ / Neon qua chuỗi kết nối `DATABASE_URI` trong `.env`.
4. **Chạy Migration Cơ sở dữ liệu:**
   Cấu hình hệ thống sử dụng `push: false`, do đó bắt buộc phải chạy migrations trước khi chạy server:
   ```bash
   pnpm migrate
   ```
5. **Khởi động máy chủ phát triển:**
   ```bash
   pnpm dev
   ```
6. **Truy cập ứng dụng:**
   - Trang người dùng: `http://localhost:3000`
   - Bảng quản trị CMS: `http://localhost:3000/admin` (tạo tài khoản quản trị đầu tiên trong lần đăng nhập đầu)

---

## 2. Các lệnh kiểm tra chất lượng code (Lint & Typecheck)

- Kiểm tra lỗi cú pháp và quy chuẩn code:
  ```bash
  pnpm lint
  ```
- Kiểm tra kiểu dữ liệu TypeScript:
  ```bash
  pnpm typecheck
  ```
- Kiểm tra unit tests:
  ```bash
  pnpm test
  ```
- Kiểm tra E2E smoke tests:
  ```bash
  pnpm test:e2e
  ```
- Định dạng code tự động:
  ```bash
  pnpm format
  ```

> **Ghi chú về múi giờ kiểm thử (T0-06c):**
> Máy chủ và toàn bộ quy trình kiểm thử (Vitest, Playwright webServer) luôn được cố định chạy theo múi giờ **UTC** (`TZ=UTC`, `PGTZ=UTC`, Postgres connection `options: '-c timezone=UTC'`). Việc này đảm bảo các bài test chứa dữ liệu ngày giờ (như `printedAt` trong thẻ EQ) không bị lệch múi giờ trên các máy trạm dev ở múi giờ địa phương (ví dụ `Asia/Bangkok` UTC+7) so với môi trường CI và Vercel. Mọi logic tính toán "ngày" nghiệp vụ thực tế phải quy đổi tường minh theo `Asia/Ho_Chi_Minh` (GAPS B9).

---

## 3. Quản lý Cơ sở dữ liệu & Migrations (Payload CMS)

- Toàn bộ schema thay đổi được quản lý qua migrations, không dùng `push: true`:
- Tạo migration mới khi thay đổi schema collection/global:
  ```bash
  pnpm migrate:create ten_migration
  ```
- Chạy migrations đang chờ:
  ```bash
  pnpm migrate
  ```
- Sinh types TypeScript cho các collection:
  ```bash
  pnpm generate:types
  ```

---

## 4. Xử lý sự cố thường gặp (Troubleshooting)

- **Lỗi kết nối cơ sở dữ liệu (`ECONNREFUSED 127.0.0.1:5432`)**:
  - Kiểm tra container Postgres đã chạy chưa: `docker ps`
  - Khởi động lại: `docker compose restart postgres`
  - Kiểm tra chuỗi kết nối `DATABASE_URI` trong `.env`.
- **Lỗi cache Next.js / build cũ**:
  - Chạy `pnpm devsafe` để xóa thư mục `.next` và khởi động lại sạch sẽ.

---

## 5. Chuẩn bị đưa lên Production (Tên miền chính thức, SEO, CSP & Plausible)

Khi chuyển từ môi trường thử nghiệm sang môi trường production chính thức:

### 1. Cấu hình tên miền chính thức (`NEXT_PUBLIC_SITE_URL`)

- Trong file `.env` production, đặt biến:
  ```dotenv
  NEXT_PUBLIC_SITE_URL=https://tramdungcamxuc.com
  ```
- Biến này được dùng để sinh URL tuyệt đối cho `metadataBase`, thẻ OpenGraph, canonical URL, file `sitemap.xml` và `robots.txt`.
- Lưu ý: DNS và chứng chỉ SSL do anh IT / người quản trị server cấu hình tại reverse proxy (Caddy / Nginx). Code Next.js không can thiệp DNS.

### 2. Cho phép máy tìm kiếm lập chỉ mục (`SITE_NOINDEX`)

- Ở bản demo hoặc staging: giữ `SITE_NOINDEX=true` (hệ thống gửi header `X-Robots-Tag: noindex, nofollow` và chặn tải script phân tích truy cập).
- Khi chính thức phát hành website ra công chúng: **xóa bỏ** hoặc đổi thành `SITE_NOINDEX=false` trong `.env`.
- Khi `SITE_NOINDEX` không phải là `true`, website sẽ cho phép Google/Bing index và tự động kích hoạt nạp script Plausible (nếu đã cấu hình domain).

### 3. Kích hoạt CSP chặn thật (`CSP_ENFORCE=true`)

- Mặc định hệ thống sử dụng header `Content-Security-Policy-Report-Only` để giám sát các tài nguyên bên ngoài mà không làm gián đoạn trải nghiệm người dùng.
- Trước khi bật chặn thật:
  1. Chạy bộ kiểm thử E2E: `pnpm test:e2e tests/e2e/csp.test.ts`.
  2. Xác nhận 0 vi phạm `securitypolicyviolation` và không có lỗi "Refused to load" trong console trình duyệt.
  3. Kiểm tra các chức năng: Cloudflare Turnstile, video YouTube/Vimeo, hình ảnh S3/R2 và script Plausible.
- Sau khi kiểm thử thành công, thêm vào `.env`:
  ```dotenv
  CSP_ENFORCE=true
  ```
- Khi đó, hệ thống sẽ chuyển sang header `Content-Security-Policy` chặn thật. Các đường dẫn `/admin`, `/builder`, `/api` vẫn luôn được miễn trừ.

### 4. Cấu hình Plausible Analytics trong CMS

- Quản trị viên đăng nhập vào `/admin`.
- Truy cập **Cài đặt website** (`siteSettings`) -> tab **Chung** -> mục **Đo lường truy cập**.
- Tại trường **Dịch vụ**, chọn `Plausible`.
- Tại trường **Tên miền Plausible** (`plausibleDomain`), nhập tên miền đã đăng ký với Plausible (ví dụ: `tramdungcamxuc.com`).
- Hệ thống sẽ nạp script Plausible (`https://plausible.io/js/script.js`) không dùng cookie, không yêu cầu banner cookie và tuân thủ bảo mật thông tin người dùng (không gửi email, họ tên, số điện thoại hay dữ liệu cảm xúc).

---

## Deploy bản demo trên server riêng

### Chuẩn bị

Dùng server Linux có Docker Engine + Docker Compose v2, Git và OpenSSL. Dự trù tối thiểu **1–2 CPU, 2 GB RAM, 10–20 GB đĩa trống** cho bản demo khi chạy bằng image pull từ GHCR (không còn bước build Next.js tốn nhiều tài nguyên trên server). Nếu dùng phương án dự phòng tự build image tại chỗ (`docker-compose.build.yml`), server cần tối thiểu **4 GB RAM** (khuyến nghị 8 GB RAM) để tránh tràn bộ nhớ lúc build Next.js. Lưu ý: Đây là mức dự trù, chưa phải kết quả benchmark tải. Mở cổng app đã chọn (ví dụ 3400); khi có HTTPS, chỉ cần mở 80/443 qua reverse proxy. Postgres không mở cổng ra host.

Chỉ dùng dữ liệu MẪU. Các lệnh dưới đây dành cho **server demo riêng**, luôn dùng project `tdcx-demo`. Máy dev dùng chung của anh Nhân đã có Postgres tại 55432: không chạy lại compose dev và không đụng container `sop-os-mvp-*` hay `tramdungcamxuc-postgres-dev`.

**Quy tắc gõ lệnh:** mọi lệnh `docker compose` trên server demo đều phải có đủ `-p tdcx-demo -f docker-compose.prod.yml`. Thiếu hai cờ này (vd. chỉ gõ `docker compose down`), Compose sẽ dùng `docker-compose.yml` của môi trường dev và project tên theo thư mục, không phải bản demo. Không bao giờ thêm `-v` vào `down` trừ khi cố ý xóa DB + media.

**Cách deploy hiện tại (từ T0-10c):** GitHub Actions build image sau khi CI xanh trên `main` và đẩy lên GHCR: `ghcr.io/residoken-wq/tramdungcamxuc`, tag `latest`, `sha-<7 ký tự commit>`, kèm `tools-latest` / `tools-sha-…` cho lệnh seed. Server **không build**, chỉ `git pull` (lấy file compose mới) → `docker compose pull` → `up -d`. Package hiện để **public** nên không cần `docker login`.

### Lần đầu

```bash
git clone https://github.com/residoken-wq/tramdungcamxuc.git
cd tramdungcamxuc
cp .env.example .env
chmod 600 .env
openssl rand -hex 32
openssl rand -hex 32
nano .env
```

Trong `.env`, điền hai chuỗi vừa sinh vào **PAYLOAD_SECRET** và **POSTGRES_PASSWORD** (mỗi biến một chuỗi khác nhau). Không dùng lại secret mẫu hay gửi chúng vào chat. Mật khẩu Postgres dùng chuỗi hex để an toàn khi ghép URL. Đặt:

```dotenv
APP_PORT=3400
SITE_NOINDEX=true
STYLEGUIDE_PUBLIC=true
# Để trống APP_IMAGE và APP_TAG để mặc định pull ghcr.io/residoken-wq/tramdungcamxuc:latest
APP_IMAGE=
APP_TAG=
```

**Form (Turnstile) và email trên bản demo.** Image build sẵn khóa site Turnstile _thử nghiệm_ của Cloudflare (trừ khi repo có biến `TURNSTILE_SITE_KEY`). Thêm vào `.env` khóa secret thử nghiệm đi kèm – đây là khóa công khai trong tài liệu Cloudflare, luôn cho qua, không phải bí mật:

```dotenv
SITE_URL=http://IP-SERVER:3400
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
# Tùy chọn: gửi email thật qua Resend. Bỏ trống thì email chỉ ghi vào log app.
RESEND_API_KEY=
EMAIL_FROM=
```

**Thanh toán 149.000đ trên bản demo (T1-12).** Thêm vào `.env`, rồi đặt crontab theo mục "Lịch Cron hủy đơn quá hạn 24 giờ" bên dưới:

```dotenv
# Tạo một lần: openssl rand -hex 32. Thiếu thì cron luôn trả 401, đơn chờ thanh toán không bao giờ hết hạn.
CRON_SECRET=
# true: trang đơn hiện dòng "môi trường thử nghiệm" để không ai chuyển tiền thật vào bản demo.
PAYMENT_SANDBOX=true
```

**⚠️ Không bao giờ đặt `E2E_TEST_HOOKS` trên server** (demo hay chính thức). Biến này chỉ dùng trong bước e2e của CI: khi bằng `1`, đường `/api/test-otp` trả mã đăng nhập OTP của bất kỳ email nào → ai cũng chiếm được tài khoản khách. Kiểm tra nhanh trên server: `grep -c '^E2E_TEST_HOOKS' .env` phải ra `0`.

Biến `SITE_URL` được server đọc lúc chạy (runtime): các link tải tài nguyên trong email, sitemap, robots và thẻ metadata sẽ dùng địa chỉ này (thay vì cố định tên miền chính thức). Thiếu `TURNSTILE_SECRET_KEY` thì mọi form (nhận tài nguyên, brief doanh nghiệp, quiz) báo lỗi cấu hình. Khi có tài khoản Cloudflare thật: đặt biến repo `TURNSTILE_SITE_KEY` (GitHub → Settings → Secrets and variables → Actions → Variables), chờ CI build image mới, rồi thay `TURNSTILE_SECRET_KEY` bằng secret thật.

`STYLEGUIDE_PUBLIC=true` cho khách xem `/styleguide`; để trống nếu không cần. Compose tự đặt `DATABASE_URI` tới Postgres nội bộ, không dùng URL DB local trong `.env`. Bản compose demo lưu media và tài liệu riêng tư trên volume local (`media:/app/media` và `private:/app/private`), không chuyển tiếp cấu hình S3. Volume `private` bảo vệ các tập tin PDF/ZIP/EPUB giao qua email khỏi bị mất khi cập nhật image app mới. `SITE_NOINDEX` và `STYLEGUIDE_PUBLIC` được đọc lúc chạy; đổi chúng rồi chạy `up -d` để tạo lại app, không chỉ `restart`.

#### Xác thực GitHub Container Registry (GHCR)

- **Package đang Public (hiện tại)**: bỏ qua bước đăng nhập, server pull trực tiếp không cần token.
- **Nếu sau này đổi sang Private**: cần đăng nhập để Docker có quyền pull image.
  Tạo một GitHub Personal Access Token (classic) tại: `GitHub -> Settings -> Developer settings -> Personal access tokens -> Tokens (classic)`. Chỉ chọn duy nhất một quyền: `read:packages`.
  Chạy lệnh đăng nhập (thay `<GITHUB_USERNAME>` bằng tài khoản GitHub). Lệnh `read` hỏi token và không hiện ra màn hình, không lưu vào lịch sử shell:
  ```bash
  read -rsp 'GHCR token: ' GHCR_TOKEN; echo
  printf '%s' "$GHCR_TOKEN" | docker login ghcr.io -u <GITHUB_USERNAME> --password-stdin
  unset GHCR_TOKEN
  ```
  Mong đợi: `Login Succeeded`. Tuyệt đối không dán token vào chat, không ghi vào `.env` hay commit vào repo.
- **Cách xem và đổi chế độ hiển thị Package trên GitHub**:
  Vào repo GitHub `https://github.com/residoken-wq/tramdungcamxuc` -> thẻ **Packages** (hoặc danh sách Packages ở cột phải trang chủ repo) -> chọn package `tramdungcamxuc` -> vào **Package settings** -> cuộn xuống mục **Danger Zone** -> **Change package visibility** -> chọn **Public** hoặc **Private**.

#### Kéo image và khởi chạy

```bash
docker compose -p tdcx-demo -f docker-compose.prod.yml pull < /dev/null
docker compose -p tdcx-demo -f docker-compose.prod.yml up -d < /dev/null
docker compose -p tdcx-demo -f docker-compose.prod.yml ps < /dev/null
docker compose -p tdcx-demo -f docker-compose.prod.yml logs --tail=80 app < /dev/null
curl -fsS http://127.0.0.1:3400/api/users/init
curl -sI http://127.0.0.1:3400/admin
curl -fsS http://127.0.0.1:3400/robots.txt
```

Kết quả mong đợi: cả app và postgres thành `healthy` (lần đầu chờ khoảng 30s–1 phút để Postgres khởi tạo và app chạy migration); API trả `initialized: false`; header có `X-Robots-Tag: noindex, nofollow`; robots có `User-Agent: *` và `Disallow: /`. Healthcheck app gọi Payload, tự kích hoạt `prodMigrations` trên DB trống. **Không chạy migrate bằng tay trong container.**

Mở `http://IP-SERVER:3400/admin`, tạo tài khoản quản trị đầu tiên cho chủ dự án: tài khoản đầu tiên tự nhận vai trò `owner`, các tài khoản tạo sau mặc định là `editor` và chỉ `owner` đổi được vai trò. Sau đó thử tải một ảnh có mô tả ở **Thư viện ảnh và tài liệu**. Không để form tạo admin đầu tiên mở công khai lâu; có thể dùng SSH tunnel hoặc giới hạn IP trong lúc thiết lập.

#### Lỗi `container tdcx-demo-postgres-1 is unhealthy`

Healthcheck Postgres cho tối đa khoảng 3 phút (`start_period` 60s + 30 lần × 5s) và kiểm tra qua TCP `127.0.0.1`, nên chỉ báo healthy khi server thật đã chạy, không phải server tạm của initdb. Nếu vẫn unhealthy, xem log trước khi sửa gì:

```bash
docker compose -p tdcx-demo -f docker-compose.prod.yml ps -a < /dev/null
docker compose -p tdcx-demo -f docker-compose.prod.yml logs --tail=100 postgres < /dev/null
docker inspect --format '{{json .State.Health}}' tdcx-demo-postgres-1
docker version --format '{{.Server.Version}}'
```

| Log thấy                                                                                   | Nguyên nhân và cách xử lý                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `database system is ready to accept connections`, rồi container chuyển healthy sau ít phút | Máy chậm, lần đầu khởi tạo lâu. Chạy lại `up -d` là app lên.                                                                                                                                                                                                                                                                                         |
| `Operation not permitted`, `clone3`, `faccessat2`, initdb dừng ngay                        | Docker/libseccomp trên host quá cũ cho image Postgres 18 (Debian trixie). Nâng Docker Engine lên bản mới (≥ 24) theo docs chính thức, rồi chạy lại.                                                                                                                                                                                                  |
| `could not create shared memory segment` / `No space left on device`                       | Hết đĩa hoặc `/dev/shm` quá nhỏ (VPS OpenVZ/LXC). Kiểm tra `df -h`; giải phóng đĩa hoặc đổi sang VPS KVM.                                                                                                                                                                                                                                            |
| `in 18+, these Docker images are configured to store database data in a format...`         | Volume `pgdata` còn dữ liệu cũ của Postgres 16/17 hoặc mount sai chỗ. Nếu là server demo chỉ có dữ liệu MẪU: `docker compose -p tdcx-demo -f docker-compose.prod.yml down -v < /dev/null` rồi `docker compose -p tdcx-demo -f docker-compose.prod.yml pull < /dev/null && docker compose -p tdcx-demo -f docker-compose.prod.yml up -d < /dev/null`. |
| `password authentication failed` / container restart liên tục sau khi đổi mật khẩu         | Volume đã khởi tạo với `POSTGRES_PASSWORD` cũ; đổi `.env` không đổi mật khẩu trong DB. Demo chỉ có MẪU thì `down -v` như trên, nếu không thì đặt lại `.env` về mật khẩu cũ.                                                                                                                                                                          |

`down -v` **xóa sạch DB và media của project `tdcx-demo`**: chỉ dùng trên server demo chưa có dữ liệu thật, và backup trước nếu không chắc. Không chạy trên máy dev dùng chung.

#### Lỗi `app  Skipped  No image to be pulled` khi chạy `pull`

Nghĩa là file `docker-compose.prod.yml` trên server vẫn là bản cũ (service `app` chỉ có `build:`, chưa có `image:`), nên Compose không có gì để kéo và `up` sẽ build tại chỗ. Làm theo mục **"Chuyển server đang build tại chỗ sang pull image"** bên dưới. Kiểm tra nhanh:

```bash
grep -n "image:" docker-compose.prod.yml
```

Phải thấy dòng `image: ${APP_IMAGE:-ghcr.io/residoken-wq/tramdungcamxuc}:${APP_TAG:-latest}`. Không thấy → server chưa `git pull` bản mới.

### Chuyển server đang build tại chỗ sang pull image

Dành cho server đã cài theo cách cũ (`up -d --build`). Làm **một lần**; dữ liệu và ảnh trong volume giữ nguyên.

```bash
cd /opt/tramdungcamxuc            # thư mục repo trên server
git status --short
```

Nếu `git status` liệt kê file đã sửa tay (thường là `docker-compose.prod.yml`), lưu lại phần sửa rồi trả file về bản gốc trước khi pull. `.env` không nằm trong Git nên không bị ảnh hưởng:

```bash
git diff > ../tdcx-local-changes.patch
git checkout -- docker-compose.prod.yml
```

Sau đó backup (mục **"Backup DB và media cùng thời điểm"**), rồi:

```bash
git switch main
git pull --ff-only < /dev/null
grep -n "image:" docker-compose.prod.yml
docker compose -p tdcx-demo -f docker-compose.prod.yml pull < /dev/null
docker compose -p tdcx-demo -f docker-compose.prod.yml up -d < /dev/null
docker compose -p tdcx-demo -f docker-compose.prod.yml ps < /dev/null
```

Mong đợi: lệnh `pull` báo `app  Pulled` (không còn `Skipped`); `up -d` không có dòng `Building`; `ps` thấy image `ghcr.io/residoken-wq/tramdungcamxuc:latest` và cả hai service `healthy` sau 1–2 phút (app tự chạy migration mới nếu có). Image cũ build tại chỗ (`tdcx-demo-app`) không còn dùng, có thể xóa sau khi bản mới chạy ổn: `docker image rm tdcx-demo-app`.

### Nạp dữ liệu MẪU cho buổi demo

Chạy **sau** khi app đã `healthy`. Image tools được kéo trực tiếp từ GHCR (tag `tools-latest`), không cần build trên server. Lệnh chỉ tạo/cập nhật bản ghi đánh dấu MẪU (`isSample`), không đụng dữ liệu thật, chạy nhiều lần không nhân đôi:

```bash
docker compose -p tdcx-demo -f docker-compose.prod.yml --profile tools pull seed < /dev/null
docker compose -p tdcx-demo -f docker-compose.prod.yml --profile tools run --rm seed < /dev/null
```

Mong đợi: bảng kết quả có `products 12`, `pages 5`, `lessons 20`… và dòng "Seed dữ liệu MẪU xong". Sau đó:

- `http://IP-SERVER:3400/` hiện trang chủ dựng bằng Puck (Hero 2 lối vào); `/ve-hana`, `/coaching`, `/coaching/growth-mirror`, `/doanh-nghiep` hiện trang mẫu.
- Trong `/admin`: Sản phẩm (9 sản phẩm + 3 gói CLEAR / BUILD / SHINE, tổng giá trị và % ưu đãi tự tính), Dịch vụ, Chương trình, Thẻ EQ, Bài học, Câu hỏi chẩn đoán, Kỹ thuật, 6 Trang pháp lý (chưa có nội dung), Menu điều hướng.
- Mọi chữ mẫu bắt đầu bằng `[MẪU]`; testimonial mẫu để **nháp** vì chưa có đồng ý của khách.

### Cập nhật

Làm bản sao lưu theo phần bên dưới **trước mỗi lần cập nhật**, nhất là bản có migration. Chỉ cập nhật sau khi commit trên `main` đã chạy CI xanh và image `sha-…` đã có trên GHCR. Giữ lại mã commit cũ và tag đang chạy:

Kiểm tra image của commit mới đã có: vào GitHub repo → **Actions**, run CI của commit đó xanh cả job "Build and Push Docker image"; hoặc tab **Packages** → `tramdungcamxuc` thấy tag `sha-<7 ký tự commit>`.

```bash
git rev-parse --short=7 HEAD > previous-release.txt   # commit đang chạy → rollback bằng APP_TAG=sha-<nội dung file>
git pull --ff-only < /dev/null
docker compose -p tdcx-demo -f docker-compose.prod.yml pull < /dev/null
docker compose -p tdcx-demo -f docker-compose.prod.yml up -d < /dev/null
docker compose -p tdcx-demo -f docker-compose.prod.yml ps < /dev/null
curl -fsS http://127.0.0.1:3400/api/users/init
```

Mong đợi: hai service healthy; `initialized: true` khi đã có admin. Đăng nhập lại, mở ảnh đã upload và kiểm tra trang đã xuất bản. `up` không xóa volume. Muốn dừng toàn bộ rồi khởi động lại: dùng `down` **không có `-v`**, sau đó `up -d`.

### Backup DB và media cùng thời điểm

Tạm dừng app để không có upload/ghi DB chen giữa hai bản sao. Lưu `.env` ở nơi bảo mật riêng; bản DB chứa tài khoản nhưng không thay thế secret cấu hình. Thư mục backup phải nằm ngoài Git và được chép sang máy/lưu trữ khác sau khi hoàn tất.

```bash
mkdir -p ../tdcx-backups
chmod 700 ../tdcx-backups
export TDCX_BACKUP_DIR="$(cd ../tdcx-backups && pwd)/$(date +%Y%m%d-%H%M%S)"
mkdir -m 700 "$TDCX_BACKUP_DIR"
git rev-parse HEAD > "$TDCX_BACKUP_DIR/commit.txt"
docker inspect --format '{{index .RepoDigests 0}}' tdcx-demo-app-1 > "$TDCX_BACKUP_DIR/image-digest.txt" 2>/dev/null || true
docker compose -p tdcx-demo -f docker-compose.prod.yml stop app < /dev/null
docker compose -p tdcx-demo -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres -d tramdungcamxuc -Fc < /dev/null > "$TDCX_BACKUP_DIR/database.dump"
docker compose -p tdcx-demo -f docker-compose.prod.yml run --rm --no-deps -T --entrypoint tar app -C /app/media -czf - . < /dev/null > "$TDCX_BACKUP_DIR/media.tar.gz"
docker compose -p tdcx-demo -f docker-compose.prod.yml exec -T postgres pg_restore --list < "$TDCX_BACKUP_DIR/database.dump" > "$TDCX_BACKUP_DIR/database-list.txt"
tar -tzf "$TDCX_BACKUP_DIR/media.tar.gz"
sha256sum "$TDCX_BACKUP_DIR/database.dump" "$TDCX_BACKUP_DIR/media.tar.gz" > "$TDCX_BACKUP_DIR/SHA256SUMS"
docker compose -p tdcx-demo -f docker-compose.prod.yml start app < /dev/null
```

Mong đợi: `database-list.txt` có bảng `users`, `media`, `payload_migrations`; archive media có các ảnh đã tải. Nếu một lệnh backup lỗi, giữ app dừng, xử lý lỗi và làm lại trước khi cập nhật. Mỗi ngày giữ một bản, tối thiểu 14 ngày; diễn tập restore định kỳ.

### Khôi phục backup / Rollback

**Các lệnh restore dưới đây xóa dữ liệu demo hiện tại.** Chỉ chạy trên đúng project demo cần phục hồi. Đặt `TDCX_BACKUP_DIR` về thư mục backup muốn dùng, kiểm checksum trước.

#### 1. Rollback chỉ phiên bản app (khi bản cập nhật KHÔNG có migration database)

Nếu bản mới không thay đổi database hay media, chỉ cần rollback image app về phiên bản cũ:

- **Cách 1: Rollback theo tag commit trong `.env`**:
  Sửa `.env`, đặt `APP_TAG=sha-<commit-cũ>` (ví dụ `APP_TAG=sha-1a2b3c4`, lấy 7 ký tự trong `previous-release.txt` hoặc `git log --oneline`). Sau đó pull và khởi động lại:
  ```bash
  docker compose -p tdcx-demo -f docker-compose.prod.yml pull < /dev/null
  docker compose -p tdcx-demo -f docker-compose.prod.yml up -d < /dev/null
  ```
  Khi muốn quay lại bản mới nhất: để trống `APP_TAG=` (hoặc `APP_TAG=latest`) rồi `pull` + `up -d`.
- **Cách 2: Rollback tuyệt đối theo Image Digest**:
  Lấy digest từ job summary của GitHub Actions hoặc file `$TDCX_BACKUP_DIR/image-digest.txt` (dạng `ghcr.io/residoken-wq/tramdungcamxuc@sha256:...`). **Không** đặt digest vào `APP_IMAGE`: compose luôn ghép thêm `:<tag>` nên tên image sẽ sai. Thay vào đó kéo digest về và gắn một tag local:
  ```bash
  docker pull ghcr.io/residoken-wq/tramdungcamxuc@sha256:<digest-cũ>
  docker tag ghcr.io/residoken-wq/tramdungcamxuc@sha256:<digest-cũ> ghcr.io/residoken-wq/tramdungcamxuc:rollback
  ```
  Đặt `APP_TAG=rollback` trong `.env`, rồi chạy **chỉ** `docker compose -p tdcx-demo -f docker-compose.prod.yml up -d < /dev/null` (không chạy `pull`, vì tag `rollback` chỉ có ở máy này).

#### 2. Phục hồi toàn diện cả code, database và media (khi có migration)

Nếu rollback do bản mới có migration database, phải phục hồi **cả DB, media và commit cũ** cùng đợt; chỉ checkout code cũ không đảo migration:

```bash
export TDCX_BACKUP_DIR=/duong-dan-tuyet-doi/tdcx-backups/THOI-DIEM-BACKUP
sha256sum -c "$TDCX_BACKUP_DIR/SHA256SUMS"
docker compose -p tdcx-demo -f docker-compose.prod.yml stop app < /dev/null
git switch --detach "$(cat "$TDCX_BACKUP_DIR/commit.txt")"
echo "APP_TAG=sha-$(git rev-parse --short=7 HEAD)"   # ghi giá trị này vào .env (thay dòng APP_TAG cũ)
nano .env
docker compose -p tdcx-demo -f docker-compose.prod.yml pull < /dev/null
docker compose -p tdcx-demo -f docker-compose.prod.yml exec -T postgres psql -U postgres -d postgres -P pager=off -v ON_ERROR_STOP=1 -c 'DROP DATABASE tramdungcamxuc WITH (FORCE)' -c 'CREATE DATABASE tramdungcamxuc' < /dev/null
docker compose -p tdcx-demo -f docker-compose.prod.yml exec -T postgres pg_restore -U postgres -d tramdungcamxuc --no-owner --no-privileges --exit-on-error < "$TDCX_BACKUP_DIR/database.dump"
docker compose -p tdcx-demo -f docker-compose.prod.yml run --rm --no-deps -T --entrypoint sh app -c 'find /app/media -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +' < /dev/null
docker compose -p tdcx-demo -f docker-compose.prod.yml run --rm --no-deps -T --entrypoint tar app -C /app/media -xzf - < "$TDCX_BACKUP_DIR/media.tar.gz"
docker compose -p tdcx-demo -f docker-compose.prod.yml up -d < /dev/null
curl -fsS http://127.0.0.1:3400/api/users/init
```

Mong đợi: `initialized: true`; đăng nhập bằng tài khoản trước backup, thấy nội dung và ảnh cũ. Chờ app healthy trước khi mở lại cho khách. Muốn trở lại bản mới: `git switch main`, `git pull --ff-only < /dev/null`, để trống `APP_TAG=` trong `.env`, rồi làm quy trình cập nhật.

### Dự phòng: Không pull được image (Tự build tại chỗ)

Khi không có kết nối internet ra GHCR hoặc cần kiểm tra build trực tiếp từ mã nguồn, sử dụng file override `docker-compose.build.yml`:

```bash
docker compose -p tdcx-demo -f docker-compose.prod.yml -f docker-compose.build.yml up -d --build < /dev/null
```

Lệnh chạy seed dữ liệu mẫu khi build tại chỗ:

```bash
docker compose -p tdcx-demo -f docker-compose.prod.yml -f docker-compose.build.yml --profile tools run --rm seed < /dev/null
```

Lưu ý:

- Quá trình build Next.js standalone tại chỗ cần tối thiểu **4 GB RAM** (khuyến nghị 8 GB RAM) và mất từ 3–5 phút.
- Image build tại chỗ sẽ ghi đè lên tag local của `APP_TAG` (${APP_TAG:-latest}).

### HTTPS

Có thể đặt Caddy trên host (hoặc Nginx + Let's Encrypt), trỏ DNS tên miền demo về server. Với Caddy, thay tên miền thật vào cấu hình:

```caddyfile
demo.example.com {
    reverse_proxy 127.0.0.1:3400
}
```

Mở 80/443 và đặt `APP_PORT=127.0.0.1:3400` trong `.env` để cổng app chỉ lắng nghe localhost, rồi `up -d`. Khi dùng Nginx, chuyển tiếp đúng Host/X-Forwarded-Proto và cấu hình giới hạn upload phù hợp. Dùng HTTPS trước khi cho khách đăng nhập. Noindex không phải cơ chế bảo vệ truy cập.

### Không dùng Docker

Cài Node 22, Corepack/pnpm đúng `packageManager` trong `package.json`, và Postgres 18 độc lập. `.env` cần `DATABASE_URI` thật, `PAYLOAD_SECRET` riêng, `SITE_NOINDEX=true`; **không đặt `NEXT_OUTPUT=standalone`**. `NEXT_OUTPUT` chỉ dành cho build Docker; chạy local/CI vẫn dùng `next start` bình thường.

```bash
corepack enable
pnpm install --frozen-lockfile < /dev/null
pnpm migrate < /dev/null
pnpm build < /dev/null
```

Chạy lâu dài bằng systemd, ví dụ `/etc/systemd/system/tdcx-demo.service` (sửa `User`, thư mục và đường dẫn pnpm theo máy):

```ini
[Unit]
Description=Tram Dung Cam Xuc demo
After=network.target

[Service]
Type=simple
User=tdcx
WorkingDirectory=/srv/tramdungcamxuc
EnvironmentFile=/srv/tramdungcamxuc/.env
Environment=NODE_ENV=production
Environment=PORT=3400
ExecStart=/usr/local/bin/pnpm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Sau khi lưu: `sudo systemctl daemon-reload`, `sudo systemctl enable --now tdcx-demo`, kiểm tra `sudo systemctl status tdcx-demo --no-pager`. Có thể dùng PM2 tương đương. Backup DB bằng pg_dump và thư mục `media/`, giữ thư mục này khi cập nhật code.

### Kiểm thử local

`pnpm test` **cần Postgres đang chạy**: test Local API T0-06 tự áp migration trên DB test đã cấu hình. Trên máy Codex giữ nguyên `.env` (DB `tramdungcamxuc_codex`, Postgres 55432), chạy e2e với `PORT=3200`; không dùng DB demo để chạy test bootstrap. Compose dev đọc `${POSTGRES_PORT:-5432}`; máy mới nếu đổi cổng phải sửa cùng cổng trong `DATABASE_URI`.

---

### Lịch Cron hủy đơn quá hạn 24 giờ (T1-12a)

Endpoint `/api/cron/expire-orders` tự động tìm các đơn hàng ở trạng thái `pending` quá 24 giờ để chuyển sang `failed`, đồng thời gửi email nhắc hẹn nếu khách hàng đã bật `consentMarketing = true`.

Route này được bảo vệ nghiêm ngặt bằng header `Authorization: Bearer <CRON_SECRET>` (so khớp hằng thời gian `timingSafeEqual` với biến môi trường `CRON_SECRET` trong `.env`).

**Cấu hình crontab mẫu trên server Linux / Docker:**
Chạy kiểm tra định kỳ mỗi giờ một lần (vào phút thứ 0 của mỗi giờ):

```bash
# Mở crontab: crontab -e
0 * * * * cd /opt/tramdungcamxuc && curl -s -X POST -H "Authorization: Bearer $(grep ^CRON_SECRET= .env | cut -d= -f2)" http://127.0.0.1:3400/api/cron/expire-orders >> /var/log/tdcx-cron-expire.log 2>&1 && echo >> /var/log/tdcx-cron-expire.log
```

_(Khóa được đọc từ `.env` mỗi lần chạy – **không dán khóa vào crontab**. Đổi `/opt/tramdungcamxuc` và cổng `3400` nếu server khác.)_

Kiểm (demo đã chạy đúng 10/10): gọi có khóa → `200`, không khóa → `401`; sau phút 0 kế tiếp `tail -3 /var/log/tdcx-cron-expire.log` có JSON `"success":true`. Thêm biến mà chưa tạo lại container thì cron trả `401` → chạy `docker compose -p tdcx-demo -f docker-compose.prod.yml up -d`.

---

### Lịch Cron nhắc workshop trước 24 giờ (T2-10)

Endpoint `/api/cron/workshop-reminders` tự động tìm các workshop đã xuất bản có thời gian bắt đầu `startsAt` trong khoảng `(now + 23h, now + 25h]`, xác định các khách hàng có đơn hàng đã thanh toán (`paymentStatus = 'paid'`) chứa sản phẩm trong danh sách `audienceProducts`, và gửi email nhắc lịch.

Route này được bảo vệ nghiêm ngặt bằng header `Authorization: Bearer <CRON_SECRET>` (so khớp hằng thời gian `timingSafeEqual`). Hệ thống bảo đảm tính lũy đẳng (idempotency) thông qua khóa duy nhất `workshop:customer` trong collection `workshopReminders` – không gửi trùng email kể cả khi cron chạy lại hoặc chạy song song.

**Cấu hình crontab mẫu trên server Linux / Docker:**
Chạy kiểm tra định kỳ mỗi giờ một lần (vào phút thứ 15 của mỗi giờ):

```bash
# Mở crontab: crontab -e
15 * * * * cd /opt/tramdungcamxuc && curl -s -X POST -H "Authorization: Bearer $(grep ^CRON_SECRET= .env | cut -d= -f2)" http://127.0.0.1:3400/api/cron/workshop-reminders >> /var/log/tdcx-cron-workshop.log 2>&1 && echo >> /var/log/tdcx-cron-workshop.log
```

---

### Lịch Cron cập nhật quyền truy cập hết hạn (T2-02)

Endpoint `/api/cron/expire-entitlements` tự động tìm các bản ghi quyền truy cập (`entitlements`) ở trạng thái `trial` hoặc `active` đã quá thời hạn `expiresAt` để chuyển trạng thái sang `expired`, đồng thời phát sự kiện phân tích `trial_expired`.

Route này được bảo vệ bằng header `Authorization: Bearer <CRON_SECRET>` (so khớp hằng thời gian `timingSafeEqual` với biến môi trường `CRON_SECRET` trong `.env`).

**Cấu hình crontab mẫu trên server Linux / Docker:**
Chạy kiểm tra định kỳ mỗi giờ một lần:

```bash
# Mở crontab: crontab -e
0 * * * * cd /opt/tramdungcamxuc && curl -s -X POST -H "Authorization: Bearer $(grep ^CRON_SECRET= .env | cut -d= -f2)" http://127.0.0.1:3400/api/cron/expire-entitlements >> /var/log/tdcx-cron-entitlements.log 2>&1 && echo >> /var/log/tdcx-cron-entitlements.log
```

---

### Lịch Cron nhắc hạn dùng thử ngày 18 và ngày 21 (T2-04)

Endpoint `/api/cron/trial-reminders` tự động quét các quyền dùng thử (`entitlements` với `status = 'trial'`) của công cụ số có `trialDays > 0`. Hệ thống xác định các mốc nhắc:

- **Mốc Ngày 18 (còn 3 ngày)**: khi thời gian còn lại nằm trong khoảng `24h < timeLeft <= 72h`.
- **Mốc Ngày 21 (ngày cuối cùng)**: khi thời gian còn lại nằm trong khoảng `0 < timeLeft <= 24h`.

Hệ thống gửi email nhắc nhở kèm giá ưu đãi đọc tự động từ sản phẩm (`getEffectivePrice`). Nếu khách hàng đã mua sản phẩm (`status = 'active'`), hệ thống không gửi nhắc.

Route được bảo vệ nghiêm ngặt bằng header `Authorization: Bearer <CRON_SECRET>` (so khớp hằng thời gian `timingSafeEqual`). Tính lũy đẳng (idempotency) được đảm bảo ở cấp CSDL thông qua khóa duy nhất `entitlement:milestone` trong collection `trialReminders`.

**Cấu hình crontab mẫu trên server Linux / Docker:**
Chạy kiểm tra định kỳ mỗi giờ một lần (vào phút thứ 30 của mỗi giờ):

```bash
# Mở crontab: crontab -e
30 * * * * cd /opt/tramdungcamxuc && curl -s -X POST -H "Authorization: Bearer $(grep ^CRON_SECRET= .env | cut -d= -f2)" http://127.0.0.1:3400/api/cron/trial-reminders >> /var/log/tdcx-cron-trial.log 2>&1 && echo >> /var/log/tdcx-cron-trial.log
```

---

### Lịch Cron nhắc nhở gián đoạn chuỗi Habit Tracker (T2-06)

Endpoint `/api/cron/tracker-nudges` tự động quét các kế hoạch Habit Loop (`habitPlans`) của khách hàng đang trong chu kỳ 21 ngày (`day >= 3` và `day <= 21`). Khi phát hiện khách hàng đã bỏ lỡ 2 ngày liên tiếp gần nhất mà chưa từng được gửi nhắc nhở cho chuỗi gián đoạn này, hệ thống sẽ gửi email động viên ("Thương mình một nhịp, quay lại hôm nay") và đường dẫn tiếp tục hành trình.

Route này được bảo vệ nghiêm ngặt bằng header `Authorization: Bearer <CRON_SECRET>` (so khớp hằng thời gian `timingSafeEqual` với biến môi trường `CRON_SECRET` trong `.env`). Tính lũy đẳng (idempotency) được đảm bảo ở cấp CSDL thông qua trường `uniqueKey` dạng `${planId}:${missedStartDay}` trong collection ẩn `trackerNudges` – không gửi trùng email kể cả khi cron chạy lại hoặc chạy song song. Nếu quá trình gửi email phát sinh lỗi, bản ghi giữ chỗ sẽ tự động bị xóa để cho phép cron thử lại ở lần quét kế tiếp.

**Cấu hình crontab mẫu trên server Linux / Docker:**
Chạy kiểm tra định kỳ mỗi giờ một lần (vào phút thứ 45 của mỗi giờ):

```bash
# Mở crontab: crontab -e
45 * * * * cd /opt/tramdungcamxuc && curl -s -X POST -H "Authorization: Bearer $(grep ^CRON_SECRET= .env | cut -d= -f2)" http://127.0.0.1:3400/api/cron/tracker-nudges >> /var/log/tdcx-cron-nudges.log 2>&1 && echo >> /var/log/tdcx-cron-nudges.log
```

---

### Cấu hình Bunny Stream cho video trả phí (T2-05b)

Hệ thống tích hợp trực tiếp dịch vụ Bunny Stream (`https://bunny.net`) thông qua cơ chế Token Authentication và nhúng iframe trình phát chuẩn Player.js. Video trả phí được bảo vệ bằng URL có chữ ký hết hạn sau mỗi phiên truy cập.

#### Hướng dẫn anh IT cấu hình trên Server & Bunny Dashboard

1. **Tạo Video Library trên Bunny.net:**
   - Đăng nhập vào dashboard Bunny.net -> Chọn mục **Stream** trong menu bên trái.
   - Bấm **Add Video Library** và đặt tên thư viện (ví dụ: `tramdungcamxuc-production`).
   - Sau khi tạo, ghi lại **Video Library ID** (dãy số nguyên dương, ví dụ `123456`).

2. **Bật Token Authentication & Lấy Security Key:**
   - Trong chi tiết Video Library vừa tạo, chọn tab **Security**.
   - Bật tính năng **Enable Token Authentication**.
   - Sao chép giá trị tại mục **URL Token Authentication Key** (chuỗi ký tự bí mật dài).

3. **Cấu hình Allowed Domains / Referrers:**
   - Trong mục **Allowed Referrers** / **Allowed Domains**, thêm các domain được phép nhúng iframe:
     - `tramdungcamxuc.com`
     - `*.tramdungcamxuc.com`
     - `localhost:3000` (để kiểm thử môi trường dev nếu cần).
   - Lưu cài đặt bảo mật.

4. **Cấu hình biến môi trường trên Server:**
   - Thêm các biến sau vào file `.env` trên máy chủ:
     ```env
     VIDEO_PROVIDER=bunny
     BUNNY_STREAM_LIBRARY_ID=123456
     BUNNY_STREAM_TOKEN_KEY=your_token_security_key_here
     ```

5. **Khởi động lại Server:**
   - Khởi động lại container dịch vụ:
     ```bash
     docker compose up -d
     # Hoặc với cấu hình production:
     docker compose -p tdcx-demo -f docker-compose.prod.yml up -d
     ```

6. **Kiểm tra nghiệm thu trên hệ thống:**
   - Đăng nhập tài khoản học viên có quyền truy cập khóa học.
   - Vào 1 bài học bất kỳ có video Bunny Stream (GUID).
   - Kiểm tra iframe hiển thị mượt mà, video chạy bình thường.
   - Sau 15 giây xem video, thanh tiến độ bài học được ghi nhận tự động qua Player.js postMessage API.

---

### Cấu hình Video Provider và Sandbox (Môi trường dev / test)

- Biến môi trường: `VIDEO_PROVIDER` (mặc định là `sandbox` nếu không khai báo).
- Môi trường thử nghiệm / phát triển: để trống hoặc đặt `VIDEO_PROVIDER=sandbox`. Trình phát video hiển thị khung giả lập sandbox nội bộ, không lộ ID video. Nút "Giả lập xem hết" chỉ hiển thị trong môi trường phát triển (`NODE_ENV !== 'production'`) hoặc khi bật cờ test e2e (`E2E_TEST_HOOKS=1`).
- Môi trường Production: Khi dùng `VIDEO_PROVIDER=bunny`, cờ `allowSimulate` luôn là `false` và nút giả lập hoàn toàn bị ẩn để đảm bảo tính trung thực của tiến độ học tập.

---

### Cấu hình Tự động hóa thanh toán qua SePay Webhook (T2-09)

Hệ thống hỗ trợ 2 chế độ xử lý thanh toán, chuyển đổi linh hoạt qua biến môi trường `PAYMENT_PROVIDER`:

- `manual` (mặc định): Miễn phí, VietQR hiển thị thông tin chuyển khoản; Hana bấm nút "Xác nhận thanh toán" thủ công trong trang quản trị CMS.
- `sepay`: Tự động 100%, SePay gọi webhook khi có tiền về tài khoản ngân hàng -> hệ thống tự đổi đơn sang `paid`, cấp quyền truy cập, gửi email xác nhận. Nút xác nhận thủ công trong admin vẫn được giữ lại để dự phòng.

#### Hướng dẫn anh IT bật chế độ tự động SePay trên Production

1. **Đăng ký tài khoản SePay:**
   - Truy cập `https://sepay.vn` và đăng ký tài khoản (tài khoản cá nhân theo Q8).
2. **Liên kết tài khoản ngân hàng:**
   - Trong bảng điều khiển SePay, thêm tài khoản ngân hàng nhận tiền của Hana (khớp với số tài khoản và ngân hàng đã cấu hình trong CMS `siteSettings`).
3. **Tạo Webhook trên SePay Dashboard:**
   - Vào mục **Tích hợp Webhook** -> Bấm **Thêm Webhook**.
   - **URL Webhook**: Nhập đường dẫn chính thức:
     `https://tramdungcamxuc.com/api/payments/sepay/webhook`
   - **Phương thức xác thực**: Chọn **API Key**.
   - Tạo hoặc sao chép **API Key** bí mật được cấp (chuỗi ngẫu nhiên dài, ví dụ: `sepay_live_xxxx...`).
   - Chọn sự kiện kích hoạt: Giao dịch tiền vào (`transferType: in`).
4. **Cấu hình biến môi trường trên Server:**
   - Mở file `.env` trên máy chủ và cập nhật 2 biến:
     ```env
     PAYMENT_PROVIDER=sepay
     SEPAY_WEBHOOK_API_KEY=sepay_live_xxxx...
     ```
   - _Lưu ý_: Tuyệt đối không commit giá trị khóa thật vào Git, log hay gửi qua kênh chat công khai.
5. **Khởi động lại ứng dụng:**
   - Chạy lệnh cập nhật container trên máy chủ (Lưu ý: lệnh `restart` không nhận các biến môi trường mới khai báo trong `.env`, bắt buộc dùng lệnh `up -d`):
     ```bash
     docker compose -p tdcx-demo -f docker-compose.prod.yml up -d < /dev/null
     ```
6. **Kiểm tra nghiệm thu:**
   - Tạo một đơn hàng thông thường trên web (vd. mua Habit Tracker) và chuyển **đúng tổng số tiền** của đơn đó, nội dung là mã chuyển khoản trên trang đơn. Không chuyển số tiền thử nhỏ hơn: hệ thống so số tiền chính xác nên sẽ ghi `amount_mismatch`. (Sản phẩm ẩn không đặt mua được, nên không dùng cách tạo sản phẩm thử giá thấp.)
   - Quét mã VietQR trên trang thanh toán đơn hàng.
   - Kiểm tra:
     - Trong vòng vài giây sau khi ngân hàng báo biến động số dư, SePay gọi webhook.
     - Trang đơn hàng của khách tự động phát hiện trạng thái đã chuyển sang "Đã thanh toán" (polling 5s).
     - Khách nhận được email kích hoạt.
     - Trong CMS Admin của đơn hàng, khung "Sự kiện thanh toán" hiển thị bản ghi SePay `paid`.

#### Quy trình chuyển về chế độ thủ công (`manual`) khi SePay trục trặc

Nếu SePay gặp sự cố bảo trì, gián đoạn mạng hoặc ngân hàng đổi kết nối:

1. Mở file `.env` trên server và đổi lại:
   ```env
   PAYMENT_PROVIDER=manual
   ```
2. Khởi động lại container bằng `up -d` để nhận biến mới:
   ```bash
   docker compose -p tdcx-demo -f docker-compose.prod.yml up -d < /dev/null
   ```
3. Hệ thống sẽ ngay lập tức quay về chế độ VietQR miễn phí:
   - Các đơn hàng đang chờ hoặc đơn mới tạo vẫn giữ nguyên mã VietQR hợp lệ.
   - Hana mở danh sách đơn hàng trong CMS Admin và bấm nút **"Xác nhận thanh toán"** thủ công như bình thường.
   - Khi SePay hoạt động ổn định trở lại, chỉ cần đổi lại `PAYMENT_PROVIDER=sepay` và chạy lại lệnh `up -d` mà không làm mất bất kỳ dữ liệu nào.
