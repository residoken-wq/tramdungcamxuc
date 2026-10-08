# T1-12a – Review thứ hai cho Codex (chỉ đọc, không sửa code)

Đọc `docs/tasks/CODEX_BRIEF.md` (1 trang). **Không** đọc AGENTS.md / GAPS / DECISIONS. Một lượt = một biên bản review.

## 0. Lấy diff

```bash
GIT_TERMINAL_PROMPT=0 timeout 60 git fetch origin < /dev/null
git --no-pager diff origin/main...origin/task/T1-12a-payment-backend -- src/lib/payments src/lib/forms/actions.ts src/lib/forms/schemas.ts "src/app/(site)/api/cron" src/collections/Orders.ts src/globals/SiteSettings.ts | head -1500
```

## 1. Bối cảnh (đủ để review)

- Khách đặt "phiên trải nghiệm" (sản phẩm `type = coaching_trial`), chuyển khoản qua VietQR với nội dung = `paymentRef`. GĐ 1 **không có webhook**: chủ shop (role `owner`) bấm xác nhận thủ công.
- Luật bắt buộc: giá **chỉ** đọc từ DB; chỉ `owner` được xác nhận/hủy; xác nhận phải **idempotent** (không gửi email 2 lần); trang xem đơn công khai qua `payToken` không lộ email/SĐT/id nội bộ; không có hoàn tiền; route cron chỉ chạy với `Authorization: Bearer <CRON_SECRET>`.
- Planning đã kiểm: CRC16 đúng vector chuẩn, payload VietQR khớp từng ký tự mẫu tham chiếu, unit test + build + e2e xanh.

## 2. Tìm lỗi (ưu tiên theo thứ tự)

1. Đường nào cho phép client ảnh hưởng **số tiền** hoặc **sản phẩm** của đơn?
2. Đường nào cho người không phải `owner` (editor, khách, request không đăng nhập) đổi `paymentStatus` / `paidAt` / `deliveryStatus` – kể cả qua REST `PATCH /api/orders/:id` (xem access + field access trong `Orders.ts`)?
3. **Race**: 2 lần xác nhận đồng thời có thể gửi 2 email / ghi `paidAt` 2 lần không? (đọc rồi update không điều kiện)
4. `getPublicOrderView`: token rỗng / sai / đoán được? DTO có lộ trường nào ngoài số tiền, mã chuyển khoản, ngân hàng, trạng thái?
5. Nhiều sản phẩm `coaching_trial` đang xuất bản → đơn lấy sản phẩm nào? Có thể lấy nhầm giá không?
6. `expirePendingOrders`: có thể đóng nhầm đơn đã `paid` / đơn chưa đủ 24 h (múi giờ)?
7. Lỗi nội bộ có lộ ra trình duyệt qua server action không?

## 3. Trả lời

Một danh sách, mỗi dòng: **mức** (Nghiêm trọng / Vừa / Nhỏ) – `file:dòng` – lỗi – cách sửa đề xuất (1 câu). Không có lỗi ở mục nào thì ghi "Mục n: không thấy lỗi". **Không sửa code, không commit.** Tối đa ~40 dòng.
