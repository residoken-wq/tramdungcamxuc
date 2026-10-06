# Quy trình làm việc trên 3 máy

> Planning · 06/10/2026 · Thay cho phần "luật chung" của `PARALLEL_AGENTS.md` (file đó giữ lại làm hồ sơ riêng của máy Local).
> Viết cho anh Nhân và **mọi agent** (Antigravity, Codex, Claude) trên cả 3 máy. Agent đọc file này trước mỗi task.

## 1. Năm luật vàng

1. **GitHub là nơi đồng bộ duy nhất.** Rời máy (tắt máy, đổi máy, hết quota, agent treo) ⇒ việc dở phải được **commit + push** trước, kể cả commit `wip(<MÃ>): …`. Không bao giờ để việc chỉ nằm trên ổ đĩa một máy.
2. **Một task = một nhánh = một máy tại một thời điểm.** Muốn chuyển máy: push WIP → máy kia `git fetch && git switch task/<MÃ>-…`. Hai máy không code cùng một nhánh cùng lúc.
3. **Chỉ "ghế Planning" được merge và sửa bảng trạng thái.** Ghế Planning = Claude ở máy anh đang ngồi; **chỉ một ghế hoạt động tại một thời điểm**. Agent code không merge (`gh pr merge` bị cấm), không commit thẳng lên `main`, không sửa `docs/tasks/README.md`.
4. **Mở PR nháp ngay lần push đầu tiên** (`gh pr create --draft`). Danh sách PR trên GitHub chính là bảng "ai đang làm gì" luôn đúng, kể cả khi bảng README chưa kịp cập nhật. Xong việc → chuyển PR sang "Ready for review".
5. **Mỗi lúc chỉ một task đổi schema DB** (migration Payload) và **một task thêm package** (`package.json` / lockfile). Planning đánh dấu khóa trên bảng (mục 5).

## 2. Ai làm gì – theo công cụ, không theo máy

| Công cụ | Vai trò | Được làm | Không làm |
| --- | --- | --- | --- |
| **Claude extension** (cả 3 máy) | Planning / QA (ghế Planning) – code khi cần gấp | Giao task, nghiệm thu, chạy e2e + Docker để kiểm, merge, sửa bảng, viết `docs/tasks/reviews/*` | Merge khi CI đỏ hoặc chưa có biên bản ĐẠT |
| **Codex** (chỉ máy Local, VS Code) | **Lane B – Backend/CMS/hạ tầng** | Collections, migration, access, API, email, thanh toán, Docker/CI, e2e (chạy được Playwright) | Giao diện lớn; hết quota thì push WIP trước |
| **Antigravity** (cả 3 máy) | **Lane A – Giao diện / Puck / tài liệu** | Component, khối Puck, trang, nội dung `vi.ts`, tài liệu, sửa sau review | Chạy e2e/Playwright, `pnpm dev` ở foreground (hay treo) – Planning chạy e2e thay |

Mỗi task trên bảng có cột **Lane** (A / B / Docs). Máy nào rảnh thì nhận task **Sẵn sàng** đúng lane của agent trên máy đó.

## 3. Hồ sơ từng máy

| | Máy Local (công ty) | PC ở nhà | Laptop |
| --- | --- | --- | --- |
| Agent | Antigravity + Claude + **Codex** | Antigravity + Claude | Antigravity + Claude |
| Lane mặc định | A (Antigravity), **B (Codex)**, Planning chính | A + Planning khi anh ở nhà | A (task nhỏ, sửa sau review, tài liệu) |
| Hệ điều hành / múi giờ | Linux · Asia/Ho_Chi_Minh (+07) | *(anh bổ sung)* · +07 | *(anh bổ sung)* |
| Docker | Có (29.x) | *(anh bổ sung)* | *(anh bổ sung)* |
| Postgres dev | container `tramdungcamxuc-postgres-dev` `127.0.0.1:55432` (5432/3000 là của sop-os-mvp) | *(cổng / tên DB)* | *(cổng / tên DB)* |
| Thư mục & cổng app | Antigravity `tramdungcamxuc` :3100 · Codex `tramdungcamxuc-codex` :3200 · Claude QA `tramdungcamxuc-planning` :3300/:3500 | *(thư mục, cổng)* | *(thư mục, cổng)* |

Mỗi máy có `.env` và DB **riêng** (không dùng chung DB qua mạng). Test luôn chạy theo UTC (T0-06c), nên múi giờ máy không còn ảnh hưởng kết quả.

Trên máy có 2 agent (Local): mỗi agent **một git worktree, một DB, một cổng** – chi tiết trong `PARALLEL_AGENTS.md`.

## 4. Vòng đời một task

```
Sẵn sàng ──(Planning giao: ghi Lane + Máy)──► Đang làm @Máy (PR nháp)
   ──(agent: Ready for review + báo cáo mục 13 AGENTS.md)──► Chờ QA (PR #)
   ──(Planning chạy QA)──► ĐẠT → Planning merge → Xong
                        └► CHƯA ĐẠT → thẻ <MÃ>b trên cùng nhánh, cùng máy → Chờ QA …
```

**Agent – bắt đầu task** (copy vào prompt):

```bash
GIT_TERMINAL_PROMPT=0 timeout 60 git fetch origin < /dev/null
git switch -c task/<MÃ>-<slug> origin/main          # tiếp tục task có sẵn: git switch task/<MÃ>-<slug> && git pull --ff-only
pnpm install < /dev/null && pnpm migrate < /dev/null
```

**Agent – mỗi khi xong một phần** (đừng dồn nhiều file chưa commit):

```bash
git add -A && git commit -m "<type>(<scope>): <mô tả> (<MÃ>)"
GIT_TERMINAL_PROMPT=0 timeout 60 git push -u origin HEAD < /dev/null
# lần push đầu: GIT_TERMINAL_PROMPT=0 timeout 60 gh pr create --draft --base main --fill < /dev/null
```

**Agent – kết thúc**: `pnpm lint && pnpm typecheck && pnpm test < /dev/null` xanh, `git status` sạch, push, `gh pr ready`, gửi báo cáo theo mẫu mục 13 AGENTS.md. Không merge.

**Đổi máy giữa chừng**: push WIP → ghi vào mô tả PR "chuyển sang máy X" → máy X `git fetch && git switch task/<MÃ>-…`.

## 5. Bảng trạng thái (`docs/tasks/README.md`)

- Chỉ ghế Planning sửa. Cột **Trạng thái** ghi: `Sẵn sàng` · `Đang làm – Antigravity@Laptop (PR #n)` · `Chờ QA (PR #n)` · `Sửa <MÃ>b` · `Xong (PR #n)`.
- Khóa dùng chung ghi ở đầu bảng GĐ đang chạy: `🔒 Migration: T1-xx` · `🔒 Package: T1-yy`. Task khác cần đổi schema/thêm package phải chờ.
- Khi bảng và GitHub lệch nhau, **danh sách PR trên GitHub là đúng**; Planning cập nhật bảng theo PR.

## 6. Chống xung đột file

| File | Luật |
| --- | --- |
| `docs/DECISIONS.md` | Từ GĐ 1: mỗi task ghi quyết định vào file riêng **`docs/decisions/<MÃ>.md`**; `DECISIONS.md` chỉ giữ phần chung (phiên bản, quy tắc màu) + mục lục do Planning cập nhật. Không chạy Prettier lên `DECISIONS.md` cũ. |
| `docs/tasks/README.md`, `GD*.md`, `reviews/*` | Chỉ ghế Planning. |
| `src/lib/i18n/vi.ts` | Chỉ thêm khóa trong khối của khu vực mình; không sắp xếp/định dạng lại cả file. |
| `src/migrations/*`, `src/payload-types.ts` | Chỉ task đang giữ khóa Migration. |
| `package.json`, `pnpm-lock.yaml` | Chỉ task đang giữ khóa Package; không chạy Prettier lên lockfile. |
| `.github/workflows/*` | Push cần token `gh` có scope `workflow` (máy Local đã có; máy khác chạy `gh auth refresh -h github.com -s workflow`). |

Chạy Prettier **chỉ trên file mình sửa** (`pnpm exec prettier --write <file>`), không chạy `pnpm format` toàn repo trong task.

## 7. Nhịp làm việc gợi ý

- **Đầu buổi (máy anh đang ngồi):** mở Claude → "Planning: đọc `docs/tasks/WORKFLOW.md`, `gh pr list`, nghiệm thu PR đang Chờ QA, giao task tiếp theo cho các agent trên máy này".
- **Trong buổi:** các agent trên máy đó làm task đúng lane; Planning QA và merge khi có PR sẵn sàng.
- **Cuối buổi:** mọi agent push WIP; Planning cập nhật bảng và push. Sang máy khác chỉ cần `git pull`.
