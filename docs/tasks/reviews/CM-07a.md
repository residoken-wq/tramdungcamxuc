# Review CM-07a – Đổi chữ "Wizard" trước buổi thử với Hana

**Kết luận: ĐẠT** (17/10). Không có chỗ REVIEW-REQUIRED (chỉ đổi chữ). PR #150 do Planning mở.

Kiểm trên máy QA (DB Postgres thật):

- typecheck sạch, lint 0 lỗi; unit **106 file / 1121 test trên DB trống**.
- **Bản build production**: `cms-product-wizard` + `cms-lesson-workshop-wizard` **4 passed** (1440 + 375); sau khi chạy DB không còn sản phẩm / bài học / workshop / admin.
- Không migration, không package, không đổi logic.

## Đã làm tốt

- Chữ 3 nút đưa vào `vi.cms.wizard.listButtons`, đúng chữ trong `docs/plan/CM-07.md` mục 5.
- Rà hết chữ "Wizard" hiển thị trong admin (chỉ còn tên biến / file / comment, đúng ranh giới).
- E2e lấy chữ từ `vi.ts`; thêm bước kiểm nút trên danh sách sản phẩm (trước đây chưa có).
- `HUONG_DAN_CMS.md` đổi tên mục và chữ nút, mục lục khớp anchor mới.

## Còn biết (không chặn)

- Tiêu đề / mô tả banner phía trên nút vẫn viết cứng trong 3 component (ngoài phạm vi CM-07a – prompt chỉ yêu cầu chữ nút). Gom vào `vi.ts` nếu buổi thử CM-07 cần đổi chữ.
- `HUONG_DAN_CMS.md` viết lẫn "trình hướng dẫn" / "Trình hướng dẫn" ở tiêu đề mục – sửa khi cập nhật hướng dẫn trước buổi thử (CM-07 điều kiện 7).
