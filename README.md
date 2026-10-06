# Trạm Dừng Cảm Xúc – Hệ sinh thái số

Một codebase duy nhất kết hợp Next.js App Router, Payload CMS 3, PostgreSQL, và Tailwind CSS phục vụ toàn bộ hệ sinh thái số Trạm Dừng Cảm Xúc:

- **Web 1**: Landing page (`/`)
- **Web 2**: Habit Formation (`/habit`)
- **Web 3**: EQ Buddy (`/eq-buddy`)
- **CMS Admin**: Quản trị nội dung & kéo thả trang (`/admin`)

---

## Cách chạy local trong 5 bước

### 1. Cài đặt các gói phụ thuộc

```bash
pnpm install
```

### 2. Thiết lập biến môi trường

Tạo file `.env` từ file mẫu:

```bash
cp .env.example .env
```

_(Trên Windows PowerShell: `Copy-Item .env.example .env`)_

### 3. Khởi động cơ sở dữ liệu PostgreSQL

Khởi chạy PostgreSQL qua Docker Compose:

```bash
docker compose up -d
```

_(Hoặc điền chuỗi kết nối PostgreSQL có sẵn / Neon vào biến `DATABASE_URI` trong file `.env`)_

### 4. Chạy migration cơ sở dữ liệu

```bash
pnpm migrate
```

### 5. Khởi chạy máy chủ phát triển

```bash
pnpm dev
```

### 6. Truy cập ứng dụng

- **Trang chủ**: [http://localhost:3000](http://localhost:3000)
- **Bảng quản trị CMS**: [http://localhost:3000/admin](http://localhost:3000/admin) _(tạo tài khoản quản trị đầu tiên)_

### 7. Chạy kiểm thử (Unit & E2E Tests)

```bash
pnpm test        # Unit tests (tự động cố định TZ=UTC và PGTZ=UTC)
pnpm test:e2e    # E2E Playwright tests (webServer chạy với TZ=UTC)
```

> **Lưu ý về múi giờ:** Toàn bộ test và máy chủ phát triển được cấu hình cố định múi giờ **UTC** (thông qua `TZ=UTC`, `PGTZ=UTC` và `options: '-c timezone=UTC'`) để đảm bảo kết quả kiểm thử trên máy trạm dev (kể cả máy cài múi giờ `Asia/Bangkok` UTC+7) luôn đồng nhất 100% với môi trường CI và Production (Vercel).

---

## Tài liệu tham khảo

- Hướng dẫn cho AI & quy ước chung: `AGENTS.md`
- Kế hoạch tổng thể: `docs/plan/MASTER_PLAN.md`
- Bảng giao việc & trạng thái task: `docs/tasks/README.md`
- Quyết định kiến trúc & phiên bản: `docs/DECISIONS.md`
- Hướng dẫn vận hành chi tiết: `docs/RUNBOOK.md`

Deploy demo, backup/restore và cấu hình cổng Postgres dev (`POSTGRES_PORT`, mặc định 5432): xem [RUNBOOK – Deploy bản demo trên server riêng](docs/RUNBOOK.md#deploy-bản-demo-trên-server-riêng).
