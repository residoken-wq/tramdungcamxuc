# PK-28b – Sửa PK-28: dùng ĐÚNG chữ của Hana (giữ bố cục)

| Máy                  | Nhánh                                            | Ước lượng | Migration |
| -------------------- | ------------------------------------------------ | --------- | --------- |
| Antigravity (Laptop) | `task/PK-28-chuyen-minh-100` (tiếp tục nhánh cũ) | 3–4 h     | Không     |

`git pull origin main` vào nhánh trước (để có `scripts/qa/chuyen-minh-fidelity.mjs` và review). Đọc `docs/tasks/reviews/PK-28.md`.

## Vì sao

QA PK-28: **bố cục tốt, giữ nguyên**. Nhưng chữ trên gần như mọi trang bị **viết lại / bịa**, có cả số liệu (`1/3`, `2.5×` thay cho `39%`, `3X`). Độ khớp chữ chỉ 19% (mẫu cũ 65%). Prompt PK-28 mục 0.2 đã yêu cầu: chữ lấy **nguyên văn** từ `docs/design/chuyen-minh-noi-dung.md`.

## 1. Làm

1. **Không đổi bố cục, khối, màu**, trừ khi phải thêm ô để chứa đúng chữ PDF.
   - VD tr. 17 cần 4 dòng "Nhìn lại / Hiểu / Điều chỉnh / Tiếp nối", mỗi dòng 1 câu hỏi;
   - VD tr. 3 cần 2 số `39%` và `3X`, câu có đoạn in đậm.
2. **Thay toàn bộ chữ** trong `src/puck/templates/journey.ts` bằng chữ **đúng từng chữ, đúng dấu câu** của `docs/design/chuyen-minh-noi-dung.md`, mục §1 → §21:
   - nhãn, tiêu đề section, dòng nghiêng, chữ trong thẻ, nút vòng lặp, bảng 4 tuần, dải ghi chú, "Mang về";
   - **không** thêm câu, ý, số liệu nào không có trong file đó.
   - Ô mà file không có chữ → để trống, hoặc `[MẪU] …` nếu khối bắt buộc có chữ.
   - Số liệu tr. 3: **đúng** `39%` và `3X` cùng câu mô tả và dòng nguồn. Ngoại lệ test số liệu chỉ cho 2 số này (đã có trong `tests/unit/puck-templates.test.ts`).
3. **Hero (tr. 1):** phải có tiêu đề 2 dòng **"Chuyển mình" / "không chênh vênh"** (Anton, chữ thường, trắng) như PDF.
4. Chữ PDF in đậm một phần (tr. 3 "thay đổi đến năm 2030", "9,6% — gần gấp ba nam giới"): dùng cách in đậm khối đã hỗ trợ. Không hỗ trợ thì để chữ thường, ghi trong báo cáo.
5. Mô tả mẫu "Trang lộ trình" (`src/puck/templates/index.ts`): chỉ tóm tắt bằng ý có trong file nội dung.

## 2. Kiểm tra bắt buộc trước khi nộp

1. `node scripts/qa/chuyen-minh-fidelity.mjs --missing`:
   - tỉ lệ phải **≥ 65%** (mức mẫu PK-26);
   - mọi dòng còn trong danh sách `--missing` phải là **ghi chú cho người dựng** (màu, "Bỏ khi lên web", mô tả ảnh…), **không** phải chữ hiển thị.
   - Dán kết quả vào báo cáo.
2. Thêm test `tests/unit/pk28-content-fidelity.test.ts`: chạy cùng logic với script (import hoặc chép hàm), yêu cầu ≥ 65% và có các chuỗi:
   - `39%`, `3X`;
   - `Chuyển mình`, `không chênh vênh`;
   - `Bước tiếp cùng AI, mà vẫn là chính mình`;
   - `Hai phase: xây nền trước, định hướng sau`;
   - `Một vòng lặp cho mọi kỹ năng`;
   - `Reflection giữ thay đổi ở lại sau workshop`;
   - không chứa `1/3`, `2.5`.
3. Chạy lại `scripts/qa/pk28-compare.ts`, cập nhật 20 ảnh `compare/`. **Tự xem từng ảnh**: chữ bên phải phải giống chữ bên trái.
4. `pnpm check:fast` (+ file test liên quan), cuối cùng 1 lần `--affected`.

## Không làm

- Không tự viết nội dung, không "làm hay hơn" câu chữ của Hana.
- Không đổi file `docs/design/chuyen-minh-noi-dung.md`.
- Không merge, không chạy lệnh lên server thật.

## Nộp

Commit nhỏ, push cùng nhánh. Báo cáo theo mẫu mục 13 `AGENTS.md`, kèm:

- kết quả script độ khớp;
- danh sách ô đã thêm vào khối (nếu có);
- tóm tắt `pnpm check:fast`.
