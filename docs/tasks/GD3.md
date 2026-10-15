# GĐ 3 – Web 3 EQ Buddy: task card cho Antigravity

> **MỞ 15/10/2026** – anh Nhân xác nhận thay Hana (như cổng GĐ 1). Cổng GĐ 2: một đơn thật qua SePay đã thanh toán và mở khóa tự động (anh Nhân xác nhận 15/10: trang đơn tự đổi, email kích hoạt, sự kiện SePay `paid`); biên bản `GATE_GD2.md` do Planning làm trong T2-11.
> **Cổng GĐ 3** (AGENTS.md mục 12): người dùng thật rút thẻ và quét QR ổn định trên điện thoại.
> Tham chiếu: AGENTS.md mục 7 (`eqCards`, `savedCards`), 8.3, 9 (luồng "Mua bộ thẻ vật lý"), 11, 14; `docs/plan/ESTIMATES.md` E3-1 → E3-7; `docs/plan/HANA_PROTOTYPE.md` (mẫu giao diện, **không chép code**); `docs/plan/GAPS_AND_QUESTIONS.md` Q14, Q17, Q18.

## Quyết định áp dụng

| Mã  | Chốt                                                                                                                                                                                                                                      | Task             |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Q17 | **Chốt lại 15/10 theo bộ thẻ in của Hana**: mặt trước = thông điệp + 1 từ khóa tiếng Anh (A → Z); mặt sau = 3 câu hỏi nhãn cố định **Gợi nhớ / Gói ghém / Ghi nhận** (3 ô riêng). Câu chuyện, hành động nhỏ, từ khóa Việt: không bắt buộc | T3-01, T3-01b    |
| Q18 | **Đổi 15/10**: **bỏ chọn theo cảm xúc** – rút **ngẫu nhiên** + chọn thẻ theo **từ khóa A–Z**; ô viết tự do không lưu, không gửi đi đâu                                                                                                    | T3-02            |
| –   | Mã `TDCX-01` … `TDCX-26` theo A → Z; `qrSlug` = từ khóa viết thường (`abundance` … `zero`)                                                                                                                                                | T3-01b, T3-03    |
| –   | 26 thẻ thật: **không** commit (repo công khai, `DECISIONS.md` 10/10). Planning giữ file JSON ngoài repo, nhập bằng `EQ_CARDS_FILE=… pnpm import:eq`                                                                                       | T3-01b, Planning |
| –   | EQ Buddy số: dùng thử 21 ngày, cơ chế entitlement của GĐ 2 (sản phẩm `eq-buddy-so`)                                                                                                                                                       | T3-02            |

## Lịch máy

- **PC nhà** (🔒 Migration): T3-01 → T3-01b (chỉnh theo bộ thẻ thật + lệnh nhập) → T3-04.
- **Laptop**: T3-03 → T3-02.
- **Local**: T3-05.
- **Planning**: QA, import 26 thẻ, T3-06 (e2e + cổng GĐ 3).

Ranh giới để chạy song song: T3-03 và T3-05 chỉ đọc `code`, `message`, `story`, `qrSlug`, `relatedProduct`, ảnh chia sẻ của thẻ (T3-01 không đổi các trường này). T3-03 được thêm nút admin vào `EqCards.ts` (chỉ `admin.components`); Planning gộp khi merge. Route mới nằm dưới `src/app/(site)/(shell)/eq-buddy/` (như mọi trang thật; thư mục `src/app/(eq)/` chỉ có `.gitkeep`).

---

## T3-01 – Schema thẻ EQ theo Q17 + nền dữ liệu (PC nhà, 🔒 Migration) – prompt `prompts/T3-01.md`

`eqCards`: thêm `keywordEn`, `keywordVi`; `reflectionPrompts` (1–3 câu, thay `reflectionPrompt`, migration chuyển dữ liệu cũ); `emotionTags` → chọn nhiều trong 10 cảm xúc (migration ánh xạ nhãn cũ). Hằng `EQ_BUDDY_PRODUCT_SLUG`; seed thẻ MẪU không đè thẻ thật; ẩn chat nổi trong luồng EQ. Ước lượng 4–5 h.

## T3-03 – Trang thẻ QR + xuất QR in ấn (Laptop) – prompt `prompts/T3-03.md`

`/eq-buddy/the/[qrSlug]` luôn mở thông điệp + câu chuyện của đúng thẻ (không cần đăng nhập), sự kiện `qr_opened`; admin xuất CSV danh sách thẻ + tải PNG QR từng thẻ (owner / editor). Ước lượng 6 h (E3-2, E3-7).

## T3-05 – Ảnh chia sẻ thẻ 4:5 / 9:16 + offer liên quan + nút Shopee (Local) – prompt `prompts/T3-05.md`

Route ảnh `next/og` cho thẻ (dùng ảnh riêng nếu thẻ đã có), nút tải / chia sẻ (`card_shared`), khối "offer liên quan" (từ `relatedProduct`) và nút "Mua bộ thẻ trên Shopee" (sản phẩm `physical_external`, UTM, `external_clicked`) – component dùng lại được, xem trên `/styleguide`; T3-02 gắn vào luồng và trang thẻ QR. Ước lượng 8 h (E3-5, E3-6).

## T3-02 – Luồng rút thẻ 5 bước + giới hạn dùng thử (Laptop, sau T3-01 + T3-03) – prompt viết khi giao

`/eq-buddy`: giới thiệu (nội dung từ sản phẩm `eq-buddy-so`) → rút ngẫu nhiên / chọn theo từ khóa A–Z → lật thẻ, mặt trước thông điệp + từ khóa (tôn trọng `prefers-reduced-motion`) → mặt sau 3 câu hỏi Gợi nhớ / Gói ghém / Ghi nhận (câu chuyện, hành động nhỏ hiện thêm nếu có) → suy ngẫm (ô viết chỉ lưu khi đăng nhập ở T3-04) → đi tiếp. Thẻ đầu xem tự do; rút tiếp cần dùng thử 21 ngày / đã mua. `card_drawn`. Ước lượng 10 h + 6 h (E3-1, E3-3).

## T3-04 – Lưu thẻ + ghi suy ngẫm + "Thẻ đã lưu" trong tài khoản (PC nhà, sau T3-02) [REVIEW] – prompt viết khi giao

`savedCards` của chính khách, suy ngẫm là dữ liệu nhạy cảm (không analytics, editor không đọc), mục "Thẻ đã lưu" ở `/tai-khoan`, xóa tài khoản xóa luôn (đã có trong luồng T2-16). Ước lượng 6 h (E3-4).

## T3-06 – E2E luồng EQ + cổng GĐ 3 (Planning)

Playwright: QR → thẻ; rút thẻ → dùng thử → lưu thẻ → chia sẻ; Lighthouse, axe các trang mới; QR in thử quét trên điện thoại thật. Biên bản `GATE_GD3.md`.
