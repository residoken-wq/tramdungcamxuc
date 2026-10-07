# Prompt giao việc

Mỗi task có một file `<MÃ>.md` trong thư mục này. Trên **máy bất kỳ**, mở agent ở **thư mục gốc repo của máy đó** và dán đúng một câu:

```
Chạy: GIT_TERMINAL_PROMPT=0 timeout 60 git fetch origin < /dev/null && git --no-pager show origin/main:docs/tasks/prompts/<MÃ>.md
rồi làm đúng theo nội dung file đó.
```

Vì sao làm vậy:

- Prompt luôn là bản mới nhất trên GitHub, không cần copy văn bản dài giữa các máy.
- Không phụ thuộc thư mục, DB, cổng của từng máy: agent dùng `.env` sẵn có ở máy đó (hồ sơ máy: `docs/tasks/WORKFLOW.md` mục 3).
- Đọc bằng `git show origin/main:…` nên chạy được kể cả khi thư mục đang đứng ở nhánh khác.

Lệnh trong các prompt là **bash**. Máy Windows: mở agent với terminal **Git Bash** (hoặc WSL); PowerShell không hiểu `< /dev/null` và `BIẾN=giá_trị lệnh`.

Chỉ ghế Planning tạo / sửa file prompt. Agent không sửa thư mục này.

## GĐ 1 – đợt 1 (06/10/2026)

| Máy | Mã | File |
| --- | --- | --- |
| Local | T1-01 | `docs/tasks/prompts/T1-01.md` |
| PC ở nhà | T1-06 | `docs/tasks/prompts/T1-06.md` |
| Laptop | T1-05 | `docs/tasks/prompts/T1-05.md` |
| Local | T1-08 (sau T1-01) | `docs/tasks/prompts/T1-08.md` |
| Local | T1-02a (sau T1-08) | `docs/tasks/prompts/T1-02a.md` |
| Laptop | T1-09 (sau T1-05) | `docs/tasks/prompts/T1-09.md` |
| PC ở nhà | T1-07 (sau T1-06) | `docs/tasks/prompts/T1-07.md` |
| Local | T1-02b (sau T1-02a) | `docs/tasks/prompts/T1-02b.md` |
| Laptop | T1-10 (sau T1-09) | `docs/tasks/prompts/T1-10.md` |
| Local | T1-03 (sau T1-02b) | `docs/tasks/prompts/T1-03.md` |
| Laptop | T1-15a (sau T1-10) | `docs/tasks/prompts/T1-15a.md` |
| PC ở nhà | T1-12a (sau T1-07) | `docs/tasks/prompts/T1-12a.md` |
