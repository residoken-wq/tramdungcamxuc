# Quy tắc chung cho các task HB v2 (HB-12 → HB-22)

Mỗi prompt HB-xx dẫn tới file này. Đọc **hết** file này trước khi làm. Prompt riêng ghi điểm nào khác thì làm theo prompt riêng.

Spec chung: `docs/plan/HB_FLOW_V2.md` (bảng khác biệt, quyết định 31/10, danh sách task). Đọc thêm `docs/decisions/HB-16.md` (khung flow), `HB-11.md` (tracker), `HB-23.md` (màn 28 ngày) và AGENTS §2, §7, §8.2, §11, §14.

## Hai dây việc chạy song song

| Dây                              | Máy    | Thứ tự                                                                 |
| -------------------------------- | ------ | ---------------------------------------------------------------------- |
| **Wizard** `/habit/5-phut`       | Laptop | (HB-24 CMS – Planning) → HB-17 → HB-18 → HB-19 → HB-20 → HB-21 → HB-22 |
| **Màn 28 ngày** `/habit/tracker` | PC nhà | HB-23 → HB-13 → HB-12 → HB-14 → HB-15                                  |

- **Ranh giới file giữa hai dây.**
  - Dây Wizard: không sửa `src/components/ui/ProgressGrid.tsx`, `src/components/habit/{TrackerDashboard,CheckInModal,TrackerSummaryCard,StationReflectionModal}.tsx`, `src/app/(site)/(shell)/habit/tracker/**`, `src/lib/habit/tracker-*.ts`.
  - Dây Màn 28 ngày: không sửa `src/components/habit/flow/**`, `src/app/(site)/(shell)/habit/5-phut/**`.
- **🔒 Khoá migration – chỉ một task tạo migration tại một thời điểm.**
  - Thứ tự: **HB-24 (PR #228, đã merge) → HB-18 → HB-12**. Các task khác **không** tạo migration.
  - Task cần migration mà task trước trong thứ tự chưa merge thì **DỪNG** ở bước 0.
- **`vi.ts`.** Mỗi task thêm khối riêng `hbXX` ở **cuối file**. Không sắp xếp lại khối của người khác.

## Đo thời gian (bắt buộc)

- Chạy `node scripts/task-time.mjs start HB-xx` ngay sau khi tạo nhánh.
- Nối `; node scripts/task-time.mjs lap` vào cuối **mọi** lệnh.
- Cuối task chạy `node scripts/task-time.mjs report`. Dán **nguyên dòng** `THỜI GIAN THỰC …` vào báo cáo và mô tả PR.

## Bước 0 mẫu

```bash
GIT_TERMINAL_PROMPT=0 timeout 120 git fetch origin < /dev/null; echo "fetch exit: $?"
git status --short          # có thay đổi chưa commit → DỪNG, báo lại
# + lệnh kiểm phụ thuộc trong prompt riêng (rỗng → DỪNG)
git switch -c task/HB-xx-<slug> origin/main
node scripts/task-time.mjs start HB-xx
pnpm install < /dev/null 2>&1 | tail -1 ; node scripts/task-time.mjs lap
pnpm migrate < /dev/null 2>&1 | tail -1 ; node scripts/task-time.mjs lap
git commit --allow-empty -m "chore: start HB-xx" && git push -u origin task/HB-xx-<slug>
gh pr create --draft --base main --title "<tiêu đề trong prompt>" --body "<máy>. <Migration hay không>. E2E: Planning chạy." < /dev/null
```

- `git push` lỗi → dán nguyên lỗi rồi DỪNG.
- `gh pr create` lỗi → bỏ qua, ghi vào báo cáo, Planning mở PR.

## Lỗi đã mắc – không lặp lại

1. **Không bịa** nội dung, số liệu, câu trích, nguồn, testimonial.
   - Chữ của Hana nằm trong CMS. Dữ liệu mẫu ghi rõ `[MẪU]`.
   - Con số / câu trích thiếu nguồn thì không hiện.
   - Nhãn UI cố định vào `vi.ts`.
2. **Dữ liệu nhạy cảm** (lý do riêng, suy ngẫm, cảm xúc, ghi chú):
   - chỉ chính khách đọc được;
   - không gửi analytics / log / email;
   - không lên chứng nhận / Boarding Pass.
3. **Không tin client.**
   - Server tự lấy khách đăng nhập và kiểm dữ liệu thuộc khách.
   - Validate bằng Zod, lỗi trả về bằng tiếng Việt.
   - Chỗ chạm quyền / ghi dữ liệu khách đánh `// REVIEW-REQUIRED:`.
4. **Migration** (chỉ task giữ khoá):
   - tạo bằng `pnpm migrate:create <tên>`, đọc lại SQL sinh ra;
   - chạy `up` / `down` / `up` trên DB trống;
   - không sửa migration cũ, không xoá dữ liệu có sẵn.
5. **Code sạch.**
   - Không `as any` / `as never`.
   - Lint không thêm cảnh báo so với `main`.
   - Test tương phản `tests/unit/a11y-contrast-classes.test.ts` xanh.
   - Mọi việc UI dùng skill `tdcx-brand`, đẹp ở 375px và 1440px.
6. **Đổi chữ / luồng → sửa e2e cùng task.**
   - Grep `tests/e2e/`, sửa test trong cùng task.
   - Selector theo nhãn / placeholder **thật**, không `networkidle`.
   - E2E tự đủ trên DB trống (CMS rỗng vẫn đi qua được). **Viết, không chạy** (Planning chạy).
7. **Dữ liệu test và nháp.**
   - Test DB chỉ đụng dữ liệu do test tạo (`hbXX-…@example.test`) và dọn sạch.
   - Chạy `pnpm test` trên DB **trống** trước khi báo xanh.
   - Nháp v2 cũ (HB-16) vẫn đọc được: field mới trong nháp phải tùy chọn.
8. **Phạm vi file.**
   - Không sửa `docs/tasks/README.md`, `docs/tasks/reviews/**`, `docs/tasks/prompts/**`.
   - Sửa ngoài ranh giới file của prompt thì ghi rõ lý do trong báo cáo.

## Kiểm và nộp (chung)

1. Prettier trên file mình sửa. `pnpm lint && pnpm typecheck && pnpm test` xanh **trên DB trống**. `pnpm build` một lần, dán 15 dòng cuối.
2. Tự kiểm bằng `pnpm build && pnpm start` theo mục "Tự kiểm" của prompt.
   - Chụp 375px + 1440px vào `docs/screenshots/hbXX/`, chỉ dữ liệu `[MẪU]`.
   - **Xoá** customer / kế hoạch / dữ liệu thử sau khi kiểm.
3. `git status` sạch, push, `node scripts/task-time.mjs report`. Dán dòng `THỜI GIAN THỰC …` vào mô tả PR, rồi `gh pr ready`.
4. **KHÔNG** chạy e2e / `pnpm dev` lâu. **KHÔNG** `gh pr merge`.
   - CI chạy song song (~10 phút). Push mới huỷ lượt CI cũ của PR → gom commit, push **một lần** khi đã kiểm xong. Mỗi file e2e phải tự đủ trên DB trống (E2E chia 3 shard, mỗi shard một DB). CI ở PR chỉ chạy unit test liên quan, nên vẫn phải chạy `pnpm test` **đủ** ở máy trước khi nộp.
5. Báo cáo theo mẫu mục 13 AGENTS.md, gồm:
   - link PR;
   - dòng `THỜI GIAN THỰC …`;
   - mục "Cần người review kỹ thuật" nếu có `REVIEW-REQUIRED`;
   - câu cần Hana chốt.
6. Ghi `docs/decisions/HB-xx.md`. Cập nhật `docs/HUONG_DAN_CMS.md` nếu Hana có thao tác mới.
