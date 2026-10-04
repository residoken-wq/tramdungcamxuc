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
- [ ] **Database Read Replicas**: Dự phòng khi lượng truy cập tăng vọt trong các đợt chiến dịch.
