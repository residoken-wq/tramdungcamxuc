# Backlog – Ý tưởng & Tính năng ngoài phạm vi hiện tại

> Nơi ghi lại các ý tưởng phát sinh, cải tiến kỹ thuật hoặc yêu cầu ngoài phạm vi task hiện tại.
> Nguyên tắc: Không tự ý làm tính năng ngoài task. Mọi ý tưởng đều ghi vào đây để Planning Manager và Hana xem xét.

---

## 1. Tính năng sản phẩm & nghiệp vụ

- [ ] **B2B Tracker cho đội ngũ**: Phiên bản mở rộng của Habit Tracker cho doanh nghiệp (dự kiến GĐ 4).
- [ ] **Đa ngôn ngữ (Song ngữ Anh - Việt)**: Tùy chọn mở rộng cho khách hàng nước ngoài.
- [ ] **Mobile App PWA / Native**: Nghiên cứu sau khi bản web đạt traction ổn định.
- [ ] **Tự động đối soát ngân hàng**: Kết nối API ngân hàng sâu hơn khi khối lượng giao dịch lớn.

---

## 2. Kỹ thuật & Hạ tầng

- [ ] **Favicon chính thức**: Hiện thiếu `favicon.ico` (404 trên browser console). Chờ file logo chính thức từ Hana để tạo trọn bộ icon/favicon chuẩn.
- [ ] **Tối ưu build cache trên CI**: Tăng tốc độ pipeline GitHub Actions với Turborepo / pnpm cache.
- [ ] **Automated Performance Testing**: Tự động test điểm Lighthouse trên mỗi PR preview.
- [ ] **CI build image → GHCR, server chỉ pull** (đề xuất 05/10, → task **T0-10c** trong `docs/tasks/GD0.md`): GitHub Actions build image sau khi CI xanh trên `main`, đẩy lên `ghcr.io/residoken-wq/tramdungcamxuc` (tag `latest` + `sha-<commit>`, kèm image `tools-*` cho seed). Server demo bỏ bước build, chỉ `docker compose pull && up -d`; rollback bằng `APP_TAG`. Lợi ích: server không cần RAM để build, cập nhật nhanh, chạy đúng image CI đã test.
- [ ] **Database Read Replicas**: Dự phòng khi lượng truy cập tăng vọt trong các đợt chiến dịch.

- [ ] **T0-07 / giao tài liệu trả phí**: `media` hiện là thư viện công khai của T0-06. Trước khi đưa tài liệu trả phí thật lên, cần kiểm soát cả API media và URL file trực tiếp, lưu trữ riêng tư và link ký có hạn; chỉ ẩn `products.files` không đủ bảo vệ file gốc.
- [ ] **Admin Payload tiếng Việt**: bật i18n `vi` cho giao diện admin để lỗi mặc định (vd. "Value must be unique") hiện tiếng Việt cho Hana.
- [ ] **Khối RichText định dạng giới hạn** (đậm, nghiêng, link, danh sách – Puck `richtext` đã tắt heading/màu/căn lề): đánh giá ở T1-01 khi có nội dung thật. GĐ 0 dùng `textarea` (quyết định spike T0-09).
