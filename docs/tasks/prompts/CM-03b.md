# CM-03b – Sửa dữ liệu test cho luật "đang bán phải có giá + ảnh bìa" (giao: **PC nhà**)

Tiếp CM-03 (biên bản `reviews/CM-03.md`). Ước lượng: 2–3 h. Không migration, không package.

**Đo thời gian (bắt buộc)**: `node scripts/task-time.mjs start CM-03b`; nối `; node scripts/task-time.mjs lap` vào cuối **mọi** lệnh; cuối task `node scripts/task-time.mjs report` → dán **nguyên dòng** `THỜI GIAN THỰC …`.

## 0. Chuẩn bị

```bash
GIT_TERMINAL_PROMPT=0 timeout 60 git fetch origin < /dev/null
git status --short          # có thay đổi chưa commit → DỪNG, báo lại
git switch task/CM-03-product-form
git merge --ff-only origin/task/CM-03-product-form   # lấy commit 2f0dd12 của Planning
node scripts/task-time.mjs start CM-03b
pnpm install < /dev/null 2>&1 | tail -1 ; node scripts/task-time.mjs lap
pnpm migrate < /dev/null 2>&1 | tail -1 ; node scripts/task-time.mjs lap
```

## 1. Làm

**Giữ nguyên luật** trong `src/lib/cms/product-form.ts` (IT đã chốt). **Không** nới luật, **không** thêm cờ bỏ qua theo biến môi trường, **không** skip test.

1. **Unit** – sửa dữ liệu test (chỉ phần tạo sản phẩm) ở 13 file đang đỏ: `account-deletion`, `account-orders`, `cms-dashboard`, `digital-tool-order`, `downloads`, `entitlements`, `package-payment`, `payment-tx`, `payments`, `sepay`, `trial-actions`, `trial-reminders`, `workshop`. Sản phẩm `on_sale` + xuất bản trong test phải có `price` và `isSample: true` (dữ liệu test là dữ liệu MẪU → được miễn ảnh bìa đúng theo luật). Nếu một test cố ý kiểm luật thiếu giá thì giữ.
   - Gợi ý: một helper dùng chung `tests/unit/helpers/product-fixture.ts` (`sampleProductData(overrides)`) thay vì sửa tay từng chỗ.
2. **e2e** – 17 file tạo sản phẩm `on_sale` qua REST: `account-orders`, `buy-digital-tool`, `certificate`, `cms-dashboard`, `eq-draw`, `experience-booking`, `free-resource`, `growth-mirror`, `habit-loop`, `learning-dashboard`, `library`, `package-payment-link`, `puck-conversion`, `puck-sales`, `tracker`, `trial-flow`, `workshop-schedule`. Thêm `isSample: true` (và `price` nếu thiếu) vào dữ liệu tạo sản phẩm `on_sale`, kể cả các lệnh `PATCH` đổi sang `on_sale` (vd `free-resource` bước 5).
   - Kiểm trước: `isSample` có ghi được qua REST với tài khoản admin không (trường `admin.hidden`, không có `access` riêng). Nếu **không** ghi được → DỪNG, báo lại.
3. **Test luật** (bổ sung vào `tests/unit/cms-product-form.test.ts` nếu chưa có): sản phẩm thật (`isSample` false) `on_sale` + xuất bản thiếu ảnh bìa → bị chặn; thiếu giá → bị chặn; `physical_external` không cần giá; lưu **nháp** thiếu ảnh / giá → được.

**Ranh giới file**: `tests/unit/**`, `tests/e2e/**` (chỉ dữ liệu tạo / sửa sản phẩm), `tests/unit/helpers/**` (mới). **Không** sửa `src/**`.

## 2. Kiểm và nộp

1. Prettier trên file mình sửa.
2. `pnpm lint && pnpm typecheck && pnpm test` – **dán 5 dòng cuối của `pnpm test`** vào báo cáo (phải có `Tests  N passed`, không có `failed`).
3. `git status` sạch, push lên `task/CM-03-product-form`. `node scripts/task-time.mjs report` → dán dòng `THỜI GIAN THỰC …`.

**KHÔNG** chạy e2e / `pnpm dev` dài hạn (CI chạy e2e). **KHÔNG** `gh pr merge`.

Báo cáo theo mẫu mục 13 AGENTS.md.
