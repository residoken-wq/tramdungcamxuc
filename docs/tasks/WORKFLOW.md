# Quy trình làm việc trên 3 máy

> Planning · 06/10/2026 · Thay cho phần "luật chung" của `PARALLEL_AGENTS.md` (file đó giữ lại làm hồ sơ riêng của máy Local).
> Viết cho anh Nhân và **mọi agent** (Antigravity, Codex, Claude) trên cả 3 máy. Agent đọc file này trước mỗi task.

## 1. Năm luật vàng

1. **GitHub là nơi đồng bộ duy nhất.** Rời máy (tắt máy, đổi máy, hết quota, agent treo) ⇒ việc dở phải được **commit + push** trước, kể cả commit `wip(<MÃ>): …`. Không bao giờ để việc chỉ nằm trên ổ đĩa một máy.
2. **Một task = một nhánh = một máy tại một thời điểm.** Muốn chuyển máy: push WIP → máy kia `git fetch && git switch task/<MÃ>-…`. Hai máy không code cùng một nhánh cùng lúc.
3. **Chỉ "ghế Planning" được merge và sửa bảng trạng thái.** Ghế Planning = Claude ở máy anh đang ngồi; **chỉ một ghế hoạt động tại một thời điểm**. Agent code không merge (`gh pr merge` bị cấm), không commit thẳng lên `main`, không sửa `docs/tasks/README.md`.
4. **Mở PR nháp ngay lần push đầu tiên** (`gh pr create --draft`). Danh sách PR trên GitHub chính là bảng "ai đang làm gì" luôn đúng, kể cả khi bảng README chưa kịp cập nhật. Xong việc → chuyển PR sang "Ready for review".
5. **Mỗi lúc chỉ một task đổi schema DB** (migration Payload) và **một task thêm package** (`package.json` / lockfile). Planning đánh dấu khóa trên bảng (mục 5).

## 2. Ai làm gì

**Antigravity là lực lượng code chính (cả lane UI lẫn backend). Codex là "đặc nhiệm" dùng tiết kiệm. Claude giữ ghế Planning và lo mọi việc nặng về chạy kiểm tra.**

| Công cụ | Vai trò | Làm | Không làm |
| --- | --- | --- | --- |
| **Antigravity** (cả 3 máy) | **Code chính** – mọi task GĐ 1 trở đi (UI, Puck, collections, form, email, thanh toán…) | Code + unit test (`pnpm test` chạy được), **viết** e2e nhưng không chạy; commit sau mỗi phần nhỏ | Chạy Playwright / `pnpm dev` foreground / Docker build (hay treo) |
| **Claude** (ghế Planning, máy anh đang ngồi) | Planning + QA + "người chạy máy" | Giao task, chạy e2e / build / Docker để nghiệm thu, **sửa e2e hỏng nhỏ**, merge; code gấp khi cần | Merge khi CI đỏ hoặc chưa có biên bản ĐẠT |
| **Codex** (chỉ máy Local) | **Đặc nhiệm ngắn** – 1 việc / 1 lượt quota | (1) review thứ hai cho code `[REVIEW]` (auth, thanh toán, webhook, mở khóa nội dung); (2) viết/sửa e2e khó; (3) gỡ lỗi khó mà Antigravity bí sau 2 vòng | Task dài, nhiều file; đọc cả bộ tài liệu dự án |

Vì sao: Antigravity có ở cả 3 máy và ít bị giới hạn quota; Codex hết token rất nhanh (mỗi lần đọc AGENTS.md + GAPS + DECISIONS ≈ 100KB ≈ 30k token trước khi code). Claude đã chạy QA ổn định (e2e, Docker, build) nên gánh phần chạy kiểm tra thay Antigravity.

## 3. Hồ sơ từng máy và vùng code mặc định

Ba máy chạy Antigravity song song được nếu mỗi máy giữ **một vùng code** riêng – ít đụng file của nhau (`vi.ts`, collections, migration).

| | Máy Local (công ty) | PC ở nhà | Laptop |
| --- | --- | --- | --- |
| Agent | Antigravity + Claude + Codex | Antigravity + Claude | Antigravity + Claude |
| **Tài khoản Antigravity** | **Chung** với Laptop (1 quota) | **Riêng, nhiều token nhất** | **Chung** với Local (1 quota) |
| **Vùng code mặc định (GĐ 1)** | **Puck & trang** (đường găng): T1-01, T1-08, T1-02a → T1-04, T1-16 | **Form, email, thanh toán, quiz**: T1-06, T1-07, T1-12a/b, T1-13 (`[REVIEW]` → Codex review thứ hai), T1-14 | **Khung site & dữ liệu** (việc nhẹ): T1-05, T1-09 → T1-11, T1-15 |
| Ghế Planning | Chính (có Docker để QA image) | Khi anh ở nhà | Khi anh đi ngoài |
| Hệ điều hành / múi giờ | Linux · Asia/Ho_Chi_Minh (+07) | *(anh bổ sung)* · +07 | *(anh bổ sung)* |
| Docker | Có (29.x) | *(anh bổ sung)* | *(anh bổ sung)* |
| Postgres dev | `tramdungcamxuc-postgres-dev` `127.0.0.1:55432` (5432/3000 là của sop-os-mvp) | *(cổng / tên DB)* | *(cổng / tên DB)* |
| Thư mục & cổng app | Antigravity `tramdungcamxuc` :3100 · Codex `tramdungcamxuc-codex` :3200 · Claude QA `tramdungcamxuc-planning` :3300/:3500 | *(thư mục, cổng)* | *(thư mục, cổng)* |

**Quota Antigravity (anh Nhân chốt 06/10/2026)** – thực chất có 2 nguồn token, không phải 3:

- **PC ở nhà** (tài khoản riêng) gánh chuỗi dài và nặng nhất; khi rảnh nhận thêm task của máy khác.
- **Local + Laptop** dùng chung một quota. Khi quota sắp cạn: task **đường găng trên Local** được ưu tiên, Laptop tạm dừng (push WIP). Không giao cho Laptop task XL.
- **Codex** chỉ có ở Local, quota riêng nhưng ít → chỉ review `[REVIEW]` của PC ở nhà và e2e khó (mục 8).
- Hết quota giữa task: push WIP, ghi vào mô tả PR "hết quota – chờ reset HH:MM", báo Planning để chuyển task sang PC ở nhà nếu gấp.

Vùng code là mặc định: Planning có thể đổi theo ước lượng T0-11a. Task chạm vùng của máy khác (vd. form trong khối Puck) → làm sau khi task vùng kia merge, hoặc Planning tách task.

Mỗi máy có `.env` và DB **riêng**. Test luôn chạy theo UTC (T0-06c), nên múi giờ máy không ảnh hưởng kết quả. Máy Local có nhiều agent: mỗi agent một git worktree, một DB, một cổng (`PARALLEL_AGENTS.md`).

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

**Prompt giao việc** nằm trong repo: `docs/tasks/prompts/<MÃ>.md`. Trên máy bất kỳ chỉ dán câu ngắn trong [`prompts/README.md`](prompts/README.md).

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

## 8. Dùng Codex tiết kiệm token

- Prompt Codex **không** bảo đọc AGENTS.md / GAPS / DECISIONS. Chỉ đọc [`CODEX_BRIEF.md`](CODEX_BRIEF.md) (1 trang) + đúng file liên quan Planning liệt kê trong prompt.
- Một lượt = **một việc có đầu ra rõ** (một biên bản review, một file e2e, một bản sửa lỗi), ≤ ~5 file.
- Mọi lệnh in output đều cắt ngắn: `… 2>&1 | tail -20`. Không đọc lại log dài, không chạy lại cả bộ test nếu chỉ sửa một file – chạy đúng file đó.
- Build production, Docker, e2e toàn bộ: **để Claude chạy** khi nghiệm thu, Codex chỉ chạy đúng spec mình viết (`pnpm exec playwright test <file> --project=desktop-1440`).
- Commit + push sau mỗi bước (quota hết giữa chừng thì việc vẫn còn trên GitHub).
- Review `[REVIEW]`: Codex chỉ đọc diff (`git --no-pager diff origin/main...origin/<branch> -- <files>`), trả lời bằng danh sách lỗi có file:dòng + mức độ; **không sửa code** trong lượt review.


## 9. Đo thời gian thực của agent (từ 08/10/2026)

Mọi task code phải đo thời gian để tính chi phí (dashboard "Bảng giá dự án"). Script: `scripts/task-time.mjs`.

1. **Bước đầu tiên** của task (trước mọi lệnh khác): `node scripts/task-time.mjs start <MÃ>`
2. **Nối vào cuối mọi lệnh** chạy trong terminal: `<lệnh> ; node scripts/task-time.mjs lap`
3. **Cuối task**: `node scripts/task-time.mjs report` → dán nguyên dòng `THỜI GIAN THỰC …` vào báo cáo (mục "Đã làm") **và** mô tả PR (`gh pr edit --body …` hoặc thêm khi tạo PR).

Quy tắc tính: thời gian trong lệnh tính đủ; khoảng trống giữa hai lệnh ≤ 60 giây tính đủ (agent suy nghĩ/viết code); khoảng trống > 60 giây coi là **chờ approve hoặc kẹt → chỉ tính 5 giây/lần**. Log nằm ở `.task-time/` (không commit). Đổi máy giữa task: chạy `report` trên máy cũ, dán vào PR, máy mới chạy lại `start <MÃ>`; Planning cộng hai phần.

Planning ghi con số vào cột "giờ thực tế" của task trên dashboard khi nghiệm thu. Task không có dòng `THỜI GIAN THỰC` → ghi "không đo" (không đoán).
