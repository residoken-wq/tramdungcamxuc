# Cổng Giai đoạn 1 – Web 1 Landing + CMS

**Ngày**: 10/10/2026 · **Người lập**: Planning (Claude) · **Người xác nhận**: Hana (cổng), anh Nhân (kỹ thuật)

## Kết luận

**Phần kỹ thuật: ĐẠT.** 26/26 việc nhỏ của GĐ 1 (17 hạng mục báo giá) đã merge vào `main`, CI xanh, các chỗ `REVIEW-REQUIRED` đã được IT duyệt.

**Cổng chính thức: CHỜ HANA.** AGENTS.md mục 12: _"Chỉ bắt đầu giai đoạn sau khi cổng của giai đoạn trước đạt và Hana xác nhận."_ Còn 3 việc chỉ Hana làm được (mục B). Trong lúc chờ, GĐ 2 chỉ **chuẩn bị** (task card, việc không phụ thuộc quyết định) – xem `docs/tasks/GD2.md`.

## A. Hạng mục GĐ 1 (AGENTS.md mục 12)

| Hạng mục                                                                   | Trạng thái | Bằng chứng                                                                           |
| -------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------ |
| Đủ thư viện khối 5B, 4 mẫu trang, lịch sử phiên bản, khóa khối bắt buộc    | ✅         | T1-01 → T1-04; e2e `puck-*`                                                          |
| Trang chủ + trang con dựng bằng Puck từ mẫu; trang dữ liệu đọc 100% từ CMS | ✅         | T1-16 (5 trang seed), T1-10, T1-10b (xem trước)                                      |
| Form lead, coaching, brief B2B; email xác nhận; thông báo cho Hana         | ✅         | T1-06; email ghi log cho tới khi có `RESEND_API_KEY`                                 |
| Giao tài nguyên miễn phí qua email                                         | ✅         | T1-07; e2e `free-resource` (link ký có hạn)                                          |
| Growth Mirror 3 gói + thanh toán 149.000đ (thủ công) + link thanh toán gói | ✅         | T1-11, T1-12a/b/c, T1-13; IT duyệt; e2e `experience-booking`, `package-payment-link` |
| Menu có quiz, Thư viện 2 tab có bộ lọc, nút chat Zalo nổi                  | ✅         | T1-05, T1-09; e2e `site-shell`, `library`                                            |
| Quiz chẩn đoán `/habit/chan-doan`                                          | ✅ (\*)    | T1-14; 16 câu thật đã nhập. (\*) Cách chấm chờ Hana chốt H1/H2                       |
| 6 trang pháp lý, footer, ô đồng ý điều khoản ở checkout                    | ✅ khung   | T1-05, T1-12b, T1-13 – **nội dung do Hana soạn** (mục B)                             |
| Analytics, SEO, chính sách bảo mật, kết nối domain                         | ⚠️         | Plausible + SEO + CSP ✅ (T1-15a/b). **Domain chưa kết nối** – chờ D1/D2 (mục C)     |
| `HUONG_DAN_CMS.md` bản 1                                                   | ✅         | T1-17a/b; 27/27 ảnh; checklist cổng 8 bài                                            |

### Đo chất lượng (T1-17b, 10/10)

| Tiêu chí                             | Kết quả                                                                                                                           |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| E2E toàn bộ trên CI                  | ✅ xanh (`main`, sau PR #61, #62)                                                                                                 |
| axe – 18 trang × 375/1440 có dữ liệu | ✅ 0 lỗi serious/critical (sau khi sửa 2 nút)                                                                                     |
| Lighthouse mobile trang chủ ≥ 90     | ✅ có điều kiện: 94–96 ở lần đo sạch; A11y 100, SEO 100. **Xác nhận lại bằng PageSpeed Insights trên demo** (máy cloud gây nhiễu) |
| Lỗi chập chờn trang đơn              | ✅ tìm ra gốc (lỗi của test), đã sửa                                                                                              |

Chi tiết: `docs/tasks/reviews/T1-17b.md`.

## B. Bài kiểm tra cổng – Hana tự làm (chưa làm)

Theo `docs/HUONG_DAN_CMS.md` mục 11 (8 bài), trên bản demo:

- [ ] 1–6. Tạo landing chiến dịch từ mẫu và xuất bản · sửa tiêu đề hero · thêm 1 testimonial · đổi trạng thái 1 sản phẩm · sửa 1 trang pháp lý · xuất CSV khách tiềm năng – **không cần hỗ trợ**.
- [ ] 7–8. Xác nhận 1 đơn 149.000đ · tạo 1 link thanh toán gói.
- [ ] **6 trang pháp lý có nội dung thật** (Hana soạn – Planning không viết thay, AGENTS mục 14).
- [ ] **Lead thật về đủ và xuất được CSV.**

## C. Việc của anh Nhân trước khi Hana làm bài kiểm tra

1. Cập nhật demo lên `main` mới nhất (RUNBOOK "Deploy bản demo"): thêm `CRON_SECRET`, `PAYMENT_SANDBOX=true` vào `.env`, đặt crontab hết hạn đơn.
2. Chạy **PageSpeed Insights** (mobile) cho trang chủ demo, gửi điểm cho Planning.
3. D1 (ai đứng tên Vercel / Neon / Cloudflare / Resend) và D2 (Neon hay Supabase) – chặn việc kết nối domain `tramdungcamxuc.com` và gửi email thật.

## D. Còn tồn, không chặn cổng

- Q13 (màu nút hồng), H1/H2 (thang điểm, cách chấm quiz), Q19 (đơn quá 24 giờ) – đang chạy theo mặc định, sửa được trong CMS hoặc bằng task nhỏ.
- Unit test chập chờn khi chạy song song (`siteSettings`) → T2-00.
