# Báo cáo đối chiếu giao diện & xử lý khác biệt (DP-01 Mismatch Report)

> Nhiệm vụ: Tái hiện giao diện Habit Hack (Web 2) và EQ Buddy (Web 3) theo bản thiết kế duyệt trong `DIGITAL PRODUCT.zip`  
> Ngày thực hiện: 04/11/2026  
> Trạng thái: **Khớp 100% chức năng & cấu trúc; chuẩn hoá toàn diện theo Brand Book 2026**

---

## 1. Tổng quan khác biệt được xử lý có chủ đích

| Hạng mục | Bản trong ZIP (`DIGITAL PRODUCT.zip`) | Bản triển khai thực tế trên Web Next.js | Lý do / Quyết định kỹ thuật |
| :--- | :--- | :--- | :--- |
| **Hệ màu (Design Tokens)** | Sử dụng một số màu ngoài bảng (slate, zinc, xanh lá tuỳ biến) | Chuẩn hoá 100% về 8 màu Brand Book 2026 (`deep-navy`, `bright-magenta`, `accent-pink`, `soft-pink`, `lavender-mist`, `mint-haze`, `butter-cream`, `warm-ivory`) | Quy tắc bắt buộc: Brand Book 2026 và skill `tdcx-brand` luôn thắng |
| **Biểu đồ SVG minh hoạ** | Màu SVG tĩnh trên file HTML | Giữ nguyên các màu minh hoạ địa phương trong SVG (biểu đồ 1%, 4 góc phần tư vòng lặp Cue/Craving/Response/Reward, nhịp ngày) | Quy tắc C1: giữ tính trực quan và phân biệt các trạng thái kỹ thuật |
| **Nút ủng hộ / Donate cà phê** | Nút "Mời Hana ly cà phê" trong footer / FAB | **Đã loại bỏ hoàn toàn** | Quyết định H8: Không nhận ủng hộ cà phê trên sản phẩm số thương mại |
| **Lưu nháp trình duyệt** | Dùng các key localStorage phân mảnh | Dùng bộ chuyển đổi hai chiều `draft-adapter.ts` qua key chuẩn `tdcx_habit_loop_v1` | Quyết định H1: Đảm bảo khách hàng cũ không mất dữ liệu, đồng bộ hai chiều |
| **5 cảm xúc check-in thói quen** | 5 mức tự tin (😫, 😣, 😊, 🥰, 😍) | Bổ sung 5 giá trị enum vào DB qua migration `20261104_080000_dp01_confidence_emotions`, bảo lưu 10 cảm xúc EQ cũ | Quyết định H5: Cho phép thể hiện đúng mức độ tự tin xây dựng thói quen |
| **Công tắc quyền truy cập EQ (E3)** | File HTML tĩnh mở toàn bộ | Thêm công tắc `eqAccessMode` (`trial` vs `free`) trong CMS `eq-buddy-content`, kiểm soát bằng server-side access & redaction | Quyết định E3: Cho phép Hana mở miễn phí hoàn toàn hoặc chạy dùng thử có paywall |
| **Thẻ lật 3D (3D Flip Card)** | Hiệu ứng lật thẻ bằng CSS | Chuẩn hoá component `EQCardFlip.tsx` (kích thước 290×400 / 330×450), hỗ trợ phím Enter/Space, aria-label và mobile touch | Đạt chuẩn Web Content Accessibility Guidelines (WCAG 2.1 AA) |
| **Khối suy ngẫm thẻ EQ (E2)** | Dưới thẻ có ô viết, nút lưu và chia sẻ | Component `EQDrawApp.tsx` có khối E2 "Ghi nhận suy ngẫm · Lưu thẻ · Chia sẻ", kết nối server action `saveEqCardAction` | Đầy đủ chức năng tương tác và bảo mật tài khoản học viên |

---

## 2. Chi tiết cấu hình CMS cho Hana (CMS-TODO)

1. **Global `eq-buddy-content`**:
   - `eqAccessMode`: Chọn `trial` (giới hạn 1 thẻ cho khách, yêu cầu đăng ký dùng thử) hoặc `free` (mở tự do rút thẻ).
   - Nội dung giới thiệu 2 bước: `intro1Heading`, `card1Title`–`card4Title`, `step1Title`–`step4Title`.
   - `shopeeUrl`: Đường link gian hàng Shopee của Hana để bán bộ thẻ vật lý.
2. **Collection `eqCards`**:
   - `category`: Gán 1 trong 4 nhóm: "Tự thân", "Người khác", "Tình huống", "Hành động".
   - `gradientTheme`: Chọn 1 trong 10 bộ màu pastel chuẩn Brand Book 2026.
3. **Global `habit-journey-content`**:
   - Chỉnh sửa câu hỏi chẩn đoán nút thắt Bước 1, thẻ số liệu, 4 quy tắc vòng lặp Bước 5 và nội dung 4 trạm tuần.

---

## 3. Kết luận nghiệm thu

- Không có lỗi breaking change đối với hệ thống hiện tại.
- Toàn bộ route công khai `/habit/5-phut`, `/habit/tracker`, `/eq-buddy`, `/eq-buddy/rut-the`, `/eq-buddy/the/[qrSlug]` đã hoạt động trơn tru theo đúng trải nghiệm zip.
- Đã vượt qua toàn bộ 19 test unit và a11y contrast guard.
