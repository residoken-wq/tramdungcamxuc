# Chạy 2 agent song song trên máy dev

> **Từ 06/10:** luật chung cho cả 3 máy nằm ở [`WORKFLOW.md`](WORKFLOW.md). File này chỉ còn là hồ sơ riêng của **máy Local** (thư mục, DB, cổng của từng agent).

> Planning · 05/10/2026 · Áp dụng cho máy dev của anh Nhân (Linux), nơi Antigravity và Codex cùng code.
> Lý do: hai agent dùng chung một thư mục thì đè branch của nhau (commit `88a129e` từng rơi nhầm sang nhánh T0-05), và một agent từng lục DB của dự án khác (`sop-os-mvp`) rồi treo 20 phút.

## 1. Mỗi agent một chỗ làm riêng

|                    | Antigravity                                  | Codex                                              |
| ------------------ | -------------------------------------------- | -------------------------------------------------- |
| Thư mục            | `~/Documents/Github/tramdungcamxuc`          | `~/Documents/Github/tramdungcamxuc-codex` (git worktree) |
| Mảng việc          | Giao diện, component, Puck                   | CMS: collections, globals, migration, backend, Docker |
| Database           | `tramdungcamxuc`                             | `tramdungcamxuc_codex`                             |
| Cổng app dev       | `3100`                                       | `3200`                                             |
| Chạy e2e           | `PORT=3100 pnpm test:e2e`                    | `PORT=3200 pnpm test:e2e`                          |

Cả hai DB nằm chung container `tramdungcamxuc-postgres-dev` (Postgres 18, `127.0.0.1:55432`, user/pass `postgres`/`password`, volume `tramdungcamxuc_pgdata_dev`). Mỗi thư mục có `.env` riêng (đã gitignore), không chép `.env` của nhau.

Hai thư mục là **git worktree của cùng một repo**: chung lịch sử, branch, remote. Git không cho cùng một branch được checkout ở 2 worktree, nên hai agent không thể vô tình làm trên branch của nhau.

## 2. Luật bắt buộc cho cả hai agent

1. **Chỉ làm trong thư mục của mình.** Không `cd` sang thư mục kia, không sửa file ở đó, không `git checkout` / `git switch` sang branch agent kia đang dùng.
2. **Không đụng dự án khác trên máy**: container `sop-os-mvp-*` (cổng 5432, 3000, 3001). Không `psql`, không migrate, không `docker exec` vào đó.
3. **Không chạy `docker compose up`** bằng `docker-compose.yml` của repo (đang map cổng 5432, sẽ đụng sop-os). Không `docker compose down -v`, không xóa volume, không xóa container `tramdungcamxuc-postgres-dev`.
4. **Không lệnh nào chờ bàn phím**:
   - `psql` luôn có `-P pager=off`, không dùng `docker exec -it`;
   - `git` dùng `--no-pager` hoặc `GIT_PAGER=cat` khi xem log/diff;
   - không mở `pnpm dev` ở foreground; cần server thì để Playwright tự bật (`webServer`) hoặc chạy nền có timeout;
   - lệnh có hỏi xác nhận phải có cờ không tương tác (`--yes`, `-y`) hoặc không chạy.
5. **Migration chỉ một bên tạo trong một thời điểm.** Hiện tại chỉ Codex tạo migration (T0-06). Antigravity không chạy `pnpm migrate:create`. Khi branch của bên kia đã merge có migration mới: `git pull origin main` rồi `pnpm migrate` trên DB của mình.
6. **File chung dễ xung đột**: `docs/DECISIONS.md` (chỉ thêm mục `## <MÃ>` ở cuối file), `src/lib/i18n/vi.ts` (chỉ Antigravity sửa trong GĐ 0), `package.json` / `pnpm-lock.yaml` (chỉ thêm package khi task cho phép), `.env.example` (chỉ Codex sửa trong GĐ 0). Mỗi task có mục "Ranh giới file" – sửa ngoài ranh giới phải hỏi.
7. **Merge**: mỗi task một PR vào `main`, không tự merge. Bên merge sau `git pull origin main` vào branch của mình (merge, không rebase branch đã push), sửa xung đột, chạy lại test.
8. **Không để code ở `/tmp`**: thư mục này bị xóa khi khởi động lại máy.

## 3. Lệnh vận hành

Xem DB:

```bash
docker exec tramdungcamxuc-postgres-dev psql -U postgres -d tramdungcamxuc_codex -P pager=off -c '\dt'
```

Làm lại DB của Codex từ đầu (chỉ khi cần, mất hết dữ liệu DB đó):

```bash
docker exec tramdungcamxuc-postgres-dev psql -U postgres -P pager=off -c 'DROP DATABASE IF EXISTS tramdungcamxuc_codex' -c 'CREATE DATABASE tramdungcamxuc_codex'
cd ~/Documents/Github/tramdungcamxuc-codex && pnpm migrate
```

Container DB không chạy (sau khi khởi động lại máy):

```bash
docker start tramdungcamxuc-postgres-dev
```

Tạo worktree cho task mới của Codex (sau khi task cũ đã merge):

```bash
cd ~/Documents/Github/tramdungcamxuc-codex
git fetch origin && git switch -c task/<MÃ>-<slug> origin/main
pnpm install && pnpm migrate
```

Dựng lại toàn bộ trên máy khác: tạo container như trên (`docker run -d --name tramdungcamxuc-postgres-dev --restart unless-stopped -e POSTGRES_PASSWORD=password -e POSTGRES_DB=tramdungcamxuc -p 127.0.0.1:55432:5432 -v tramdungcamxuc_pgdata_dev:/var/lib/postgresql postgres:18`), `git worktree add ../tramdungcamxuc-codex <branch>`, tạo DB `tramdungcamxuc_codex`, viết `.env` theo bảng mục 1 (`PAYLOAD_SECRET` sinh bằng `openssl rand -hex 32`).

## 4. Việc kéo theo

`docker-compose.yml` cứng cổng 5432 → T0-10 (Codex) đổi thành `${POSTGRES_PORT:-5432}` và ghi vào RUNBOOK.
