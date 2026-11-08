# Review PK-28b – Trang "Chuyển mình": đúng chữ của Hana

**Kết luận: ĐẠT sau sửa nhỏ** (08/11). Planning QA trên `task/PK-28-chuyen-minh-100` @ `d745de90` (Antigravity). Không migration.

## Đã kiểm, đạt

- **Chữ:** `node scripts/qa/chuyen-minh-fidelity.mjs` → **65%**, bằng mẫu PK-26; bản PK-28 trước chỉ 19%.
  - Các cụm còn trong danh sách `--missing` đều là ghi chú cho người dựng, hoặc có trong mẫu nhưng bị script tách nhầm. Đã kiểm tay từng câu hiển thị.
  - Số liệu đúng `39%` / `3X`, không còn `1/3` / `2.5×`.
  - Hero có tiêu đề "Chuyển mình / không chênh vênh".
- **20 ảnh so sánh:** chữ và bố cục khớp PDF ở cả 20 trang.
- Unit `pk28-content-fidelity` + `pk28-chuyen-minh`, e2e `pk28` xanh.

## Planning sửa trong lúc QA

1. **Trang 17 (4 mốc reflection):** dòng nền pastel, chữ trắng căn phải. Không giống PDF và tương phản chỉ 2.1:1.
   - Đã sửa: trên nền deep-navy, dòng luôn tối như PDF; nhãn chữ hoa `soft-pink`; câu hỏi căn trái.
   - Ảnh: `docs/design/chuyen-minh/compare/p-17-qa-fix.png`.
2. **Tương phản WCAG AA** (axe):
   - nhãn `bright-magenta` cỡ nhỏ trên nền `lavender-mist` (4.4:1): `StoryLead`, `ContextProfile` "CÔ ẤY LÀ AI", dải "NỀN TẢNG CHUNG" → đổi sang `deep-navy`;
   - dòng cảm xúc `StoryLead` → tăng cỡ chữ để thành chữ lớn (đạt 3:1);
   - nhãn `accent-pink` trên thẻ navy (`ProgramWishes`) → `soft-pink`.
3. **Test cũ cần cập nhật:**
   - danh mục khối có thêm 10 khối mới;
   - `LoopDiagram` trong mẫu ghi `version: 2` mà khối là 1 (field mới đều có mặc định, không cần migration) → về 1;
   - snapshot `LoopDiagram` / `MatrixTable` / 4 khối mới;
   - e2e PK-26 kiểm mũi tên `IconCardGrid` (mẫu mới không dùng) → thêm 1 lưới thử vào trang test.

## Kết quả test ở máy QA

- `check:fast --affected`: 206 file xanh (sau khi cập nhật snapshot).
- E2E (bản build production): `pk28-chuyen-minh`, `pk26-chuyen-minh`, `pk25-hero-side` xanh.

## Lưu ý cho Hana

- Mẫu chỉ dùng cho trang mới hoặc khi bấm **"Dùng mẫu..." → "Trang lộ trình"** trong builder. Trang đang có không tự đổi.
- Còn phải làm khi áp mẫu:
  - CTA cuối trang (`[MẪU]`);
  - ảnh hero (vòm 3 vòng tròn là hình mẫu);
  - xác nhận nguồn số liệu trang 3.
- Lệch nhỏ còn lại (chấp nhận được):
  - đoạn văn hero đang nghiêng (PDF thẳng);
  - tiêu đề trang 8 căn giữa (PDF căn trái).
  - Cả hai sửa được bằng field của khối.
