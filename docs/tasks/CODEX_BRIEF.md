# Codex brief (đọc thay cho AGENTS.md – 1 trang)

Dự án **Trạm Dừng Cảm Xúc**: một app Next.js 16 (App Router) + Payload CMS 3.90 + Postgres 18 + Tailwind 3.4 + Puck 0.23. Ba web `/`, `/habit`, `/eq-buddy` và CMS `/admin`. Chủ dự án Hana (không biết code); review kỹ thuật: anh Nhân.

Vai trò của bạn: **đặc nhiệm ngắn** – đúng một việc Planning giao (review thứ hai, e2e, gỡ lỗi). Antigravity là người code chính; Claude (Planning) nghiệm thu và merge.

## Luật bắt buộc
- Chỉ làm đúng việc được giao; ngoài phạm vi → ghi vào báo cáo, không tự sửa.
- Không bịa nội dung/giá; mọi nội dung từ CMS; nhãn UI cố định ở `src/lib/i18n/vi.ts`. Giao diện tiếng Việt có dấu; code + comment tiếng Anh.
- Chỗ auth / phân quyền / thanh toán / mở khóa nội dung có `// REVIEW-REQUIRED:`. Hàm access ở `src/lib/auth/access.ts` (owner / editor; customer từ GĐ 2).
- Đổi schema → `pnpm migrate:create <ten> < /dev/null` rồi `pnpm migrate`; không dùng push.
- Không `gh pr merge`, không commit lên `main`, không sửa `docs/tasks/README.md`.

## Máy Local (nơi duy nhất có Codex)
- Thư mục `~/Documents/Github/tramdungcamxuc-codex` (git worktree), DB `tramdungcamxuc_codex` tại `127.0.0.1:55432`, cổng app 3200. `.env` có sẵn – không sửa.
- **Không đụng** container `sop-os-mvp-*` (cổng 5432/3000/3001) và không xóa `tramdungcamxuc-postgres-dev`.
- Lệnh có thể hỏi y/N: thêm `< /dev/null`. `psql` luôn `-P pager=off`. Không `pnpm dev` ở foreground.

## Lệnh chuẩn (output luôn cắt ngắn)
```bash
GIT_TERMINAL_PROMPT=0 timeout 60 git fetch origin < /dev/null
git switch <branch>  # hoặc: git switch --detach origin/<branch> nếu branch đang mở ở thư mục khác
pnpm install < /dev/null 2>&1 | tail -1 && pnpm migrate < /dev/null 2>&1 | tail -1
pnpm exec vitest run <file> < /dev/null 2>&1 | tail -15
PORT=3200 pnpm exec playwright test <spec> --project=desktop-1440 --reporter=line < /dev/null 2>&1 | tail -20
git add -A && git commit -m "<type>(<scope>): … (<MÃ>)" && GIT_TERMINAL_PROMPT=0 timeout 60 git push < /dev/null
```

## Báo cáo (ngắn)
Đã làm · File thay đổi · Lệnh đã chạy + kết quả · Vấn đề còn lại / câu hỏi. Review: danh sách `file:dòng – mức độ (chặn / nên sửa) – lý do – gợi ý sửa`.
