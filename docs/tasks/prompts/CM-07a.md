# CM-07a – Đổi chữ "Wizard" trước buổi thử với Hana (giao: **Laptop**, sau khi CM-06 merge)

Kế hoạch: `docs/plan/CM-07.md` mục 5. Ước lượng: ~1 h. Không migration, không package, **không đổi logic**.

**Đo thời gian (bắt buộc)**: `node scripts/task-time.mjs start CM-07a`; nối `; node scripts/task-time.mjs lap` vào cuối **mọi** lệnh; cuối task `node scripts/task-time.mjs report` → dán **nguyên dòng** `THỜI GIAN THỰC …`.

## 0. Chuẩn bị

```bash
GIT_TERMINAL_PROMPT=0 timeout 60 git fetch origin < /dev/null
git status --short          # có thay đổi chưa commit → DỪNG, báo lại
git switch -c task/CM-07a-wizard-labels origin/main
node scripts/task-time.mjs start CM-07a
pnpm install < /dev/null 2>&1 | tail -1 ; node scripts/task-time.mjs lap
pnpm migrate < /dev/null 2>&1 | tail -1 ; node scripts/task-time.mjs lap
```

## 1. Làm

1. 3 nút trên đầu danh sách (`src/components/admin/product-wizard/CreateProductButton.tsx`, `src/components/admin/lesson-wizard/CreateLessonButton.tsx`, `src/components/admin/workshop-wizard/CreateWorkshopButton.tsx`) đang viết cứng chữ "… bằng Wizard" → đưa chữ vào `src/lib/i18n/vi.ts` (khối `cms.wizard`, khóa mới `listButtons.{product,lesson,workshop}`) với nội dung:
   - "+ Tạo sản phẩm (từng bước)"
   - "+ Thêm bài học (từng bước)"
   - "+ Lên lịch workshop (từng bước)"
2. Rà chữ "Wizard" / "wizard" **hiển thị cho người dùng** (`grep -rn "Wizard" src/lib/i18n/vi.ts src/components/admin`) → thay bằng "trình hướng dẫn" hoặc "từng bước". **Không** đổi tên biến, tên file, route, `data-testid`.
3. Sửa e2e dùng chữ cũ (`tests/e2e/cms-lesson-workshop-wizard.test.ts` đang tìm "Thêm bài học bằng Wizard", "Lên lịch bằng Wizard"; rà thêm `cms-product-wizard.test.ts`) – lấy chữ từ đúng `vi.ts`.
4. `docs/HUONG_DAN_CMS.md`: sửa tên nút cho khớp.

**Ranh giới file**: 3 component nút, `src/lib/i18n/vi.ts`, các file e2e / unit đang tìm chữ cũ, `docs/HUONG_DAN_CMS.md`.

## 2. Kiểm và nộp

1. Prettier trên file mình sửa.
2. `pnpm lint && pnpm typecheck`; `pnpm test` trên **DB trống** (tạo DB mới → `pnpm migrate` → `pnpm test`) – dán 5 dòng cuối.
3. Chạy e2e `cms-product-wizard` và `cms-lesson-workshop-wizard` – **dán dòng `N passed`** (không có `failed`). Không chạy được e2e → nói rõ, **không** ghi "xanh".
4. `git status` sạch, push. `node scripts/task-time.mjs report` → dán dòng `THỜI GIAN THỰC …`.

**KHÔNG** `gh pr merge`. Báo cáo theo mẫu mục 13 AGENTS.md.
