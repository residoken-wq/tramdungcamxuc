# Bảng phân tích thiết kế Trang Cộng Đồng (Slide 47–57)

Tài liệu gốc: `docs/design/cong-dong/source.pdf` (trang 47–57), xuất ra `docs/design/cong-dong/ref/p-47.png` … `p-57.png`.
Chữ chính xác: `docs/design/website-v2-noi-dung.md` §5.
Quy tắc brand: `AGENTS.md` mục 5, skill `tdcx-brand`.

## 1. Bảng phân tích từng slide

| Slide | Mục (§5) | Màu nền | Lưới / Bố cục ở 1440px | Chi tiết thành phần (Font, Cỡ, Màu, Hoa/Thường) | Khối Puck |
| --- | --- | --- | --- | --- | --- |
| 47 | Bìa | – | Trang bìa "TRANG CỘNG ĐỒNG CỦA TRẠM" | Không đưa lên web | – |
| 48 | §5.1 Hero | Ảnh nền tối (lớp phủ), fallback `#280A60` (`deep-navy`) | Nửa trái (~45% width, max-w-[620px]), căn trái, lề trái ~90px | • Eyebrow: Playfair Display Italic, ~24px, `#EF3B83` (`accent-pink`), thường<br>• Tiêu đề: Anton, ~72px, `#FFFFFF` (trắng), IN HOA, 1 dòng<br>• Đoạn văn: Montserrat Regular, ~18px, `#FFFFFF`, thường, 2 dòng<br>• Vạch hồng: thanh ngang `w-14 h-1`, bo tròn, `#EF3B83` | `HeroImage` (layout: `backdrop`, contentAlign: `left`, overlayTone: `dark`, overlayStrength: `lg`) |
| 49 | §5.2 Chọn không gian | `#FAF7F4` (`warm-ivory`) | Tiêu đề giữa; 3 thẻ trắng xếp ngang (~380px/thẻ, gap ~30px); mũi tên trượt 2 bên | • Tiêu đề: Anton, ~52px, `#280A60` (`deep-navy`), IN HOA, căn giữa<br>• Dòng cảm xúc: Playfair Display Italic, ~24px, `#BC039E` (`bright-magenta`), căn giữa<br>• Thẻ 1: Nền trắng, bo tròn 16px, vạch đỉnh `#BC039E` (cao ~6px); nhãn Montserrat Bold ~14px `#BC039E` IN HOA; tiêu đề Anton ~40px `#280A60` IN HOA; phụ đề Montserrat Bold ~14px `#BC039E` IN HOA; mô tả Montserrat Regular ~16px; link đáy "Khám phá →" `#BC039E` → `#me-time`<br>• Thẻ 2: Tương tự thẻ 1 nhưng vạch đỉnh & accent là `#EF3B83` (`accent-pink`); link đáy → `#yoga-buddy`<br>• Thẻ 3: Nền ngà nhạt `#F5F3EF`, viền xám mảnh, KHÔNG vạch đỉnh; nhãn "COMING SOON" Montserrat Bold ~14px xám; tiêu đề Anton ~40px xám-navy; mô tả ~16px; KHÔNG link | `IconCardGrid` (columns: `carousel`, cards with top accent bar, coming soon card variant) |
| 50 | §5.3 Me Time | `#FDE6F6` (`soft-pink`) | 2 cột 50/50: chữ trái, ảnh phải bo góc ~16px | • Nhãn: Montserrat Bold, ~14px, `#EF3B83` (`accent-pink`), IN HOA<br>• Tiêu đề: Anton, ~64px, `#280A60` (`deep-navy`), IN HOA<br>• Trích dẫn: Playfair Display Italic, ~26px, `#BC039E` (`bright-magenta`)<br>• Mục 1: Tiêu đề Montserrat Bold ~18px `#280A60`, mô tả Regular ~16px<br>• Mục 2: Tiêu đề Montserrat Bold ~18px `#280A60`, mô tả Regular ~16px<br>• Ảnh phải: tỉ lệ ~4:3 bo góc ~16px (ô `[MẪU]`) | `ImageText` (layout: `image-right`, anchorId: `me-time`, bgColor: `soft-pink`) |
| 51 | §5.4 Lịch trình 5:00 AM | `#FAF7F4` (`warm-ivory`) | Tiêu đề giữa; 3 thẻ trắng ngang (~380px/thẻ), căn giữa nội dung | • Tiêu đề: Anton, ~52px, `#280A60` (`deep-navy`), IN HOA, căn giữa<br>• 3 thẻ trắng bo tròn 16px, vạch màu đỉnh lần lượt: `#BC039E` / `#EF3B83` / `#280A60`<br>• Giờ: Montserrat Bold/Medium ~14px, màu xám/slate, căn giữa<br>• Tiêu đề thẻ: Anton ~32px, đúng màu vạch đỉnh, IN HOA, căn giữa<br>• Mô tả: Montserrat Regular ~16px, text-slate-700, căn giữa | `IconCardGrid` (columns: 3, cardAccent: `cycle`, cardAlign: `center`) |
| 52 | §5.5 Tiếng nói Me Time | `#E9DDF9` (`lavender-mist`) | Tiêu đề giữa; 2 cột: 1 thẻ lớn trái (50%), 2 thẻ nhỏ chồng phải (50%) | • Tiêu đề: Anton, ~52px, `#280A60` (`deep-navy`), IN HOA, căn giữa<br>• Thẻ 1 (lớn): Nền trắng, bo tròn 16px; trích dẫn Playfair Display Italic ~22px `#280A60`; tên tác giả Montserrat Bold ~16px `#BC039E` IN HOA ("— TÊN")<br>• Thẻ 2 & 3: Nền trắng, bo tròn 16px; trích dẫn Playfair Display Italic ~18px `#280A60`; tên tác giả Montserrat Bold ~14px `#BC039E` IN HOA<br>• Dữ liệu lấy từ CMS collection `testimonials` (`consent = true`), KHÔNG hardcode | `TestimonialGrid` (variant: `featured`, bgColor: `lavender-mist`) |
| 53 | §5.6 Khoảnh khắc Me Time | `#FAF7F4` (`warm-ivory`) | Tiêu đề giữa; lưới mosaic 3 cột: 1 ảnh lớn trái, 2 ảnh chồng giữa, 1 ảnh cao phải; mũi tên trượt 2 bên | • Tiêu đề: Anton, ~52px, `#280A60` (`deep-navy`), IN HOA, căn giữa<br>• 4 khung ảnh bo tròn ~12px (ô `[MẪU]`)<br>• Mũi tên xám chevron 2 bên | `PhotoGallery` (layout: `mosaic`, bgColor: `warm-ivory`) |
| 54 | §5.7 Yoga Buddy | `#FAF7F4` (`warm-ivory`) | 2 cột: ảnh trái tràn mép (bleed) 50vw; chữ phải căn trái | • Cột trái: ảnh tràn toàn bộ lề trái, trên, dưới (bleed)<br>• Cột phải:<br>  - Nhãn: Montserrat Bold, ~14px, `#EF3B83` (`accent-pink`), IN HOA<br>  - Tiêu đề: Anton, ~64px, `#280A60` (`deep-navy`), IN HOA<br>  - Trích dẫn: Playfair Display Italic, ~26px, `#BC039E` (`bright-magenta`), 2 dòng<br>  - Đoạn văn 1 & 2: Montserrat Regular, ~16px, text-slate-700 | `ImageText` (layout: `image-left`, imageBleed: true, anchorId: `yoga-buddy`, bgColor: `warm-ivory`) |
| 55 | §5.8 Cuộc hẹn 8:30 sáng | `#FDE6F6` (`soft-pink`) | Tiêu đề giữa; 2 thẻ trắng ngang (~580px/thẻ), bo tròn 16px | • Tiêu đề: Anton, ~52px, `#280A60` (`deep-navy`), IN HOA, căn giữa<br>• Thẻ 1 (trái): vạch đỉnh `#EF3B83` (`accent-pink`); tiêu đề Montserrat Bold ~24px `#280A60`; đường kẻ mảnh; 3 mục nhãn IN HOA `#EF3B83` ("05 PHÚT KẾT NỐI", "20 PHÚT CHUYỂN ĐỘNG", "05 PHÚT LẮNG NGHE") + mô tả Regular ~15px<br>• Thẻ 2 (phải): vạch đỉnh `#280A60` (`deep-navy`); tiêu đề Montserrat Bold ~24px `#280A60`; đường kẻ mảnh; 3 mục nhãn chữ thường đậm `#280A60` ("Tôn trọng nhịp riêng", "Lỡ một buổi, hẹn buổi sau", "Trân trọng cuộc hẹn") + mô tả Regular ~15px | `Columns` 2 `Card` hoặc khối chuyên dụng `AppointmentCards` |
| 56 | §5.9 Góc nhỏ Yoga Buddy | `#E9DDF9` (`lavender-mist`) | Tiêu đề giữa; lưới mosaic tương tự slide 53 | • Tiêu đề: Anton, ~52px, `#280A60` (`deep-navy`), IN HOA, căn giữa<br>• 4 khung ảnh bo tròn ~12px (ô `[MẪU]`)<br>• Mũi tên xám chevron 2 bên | `PhotoGallery` (layout: `mosaic`, bgColor: `lavender-mist`) |
| 57 | §5.10 CTA | `#280A60` (`deep-navy`) (chuyển đổi từ màu đen slide theo Brand Book) | Căn giữa toàn bộ; dòng cảm xúc → tiêu đề 2 dòng → 2 nút pill bo tròn | • Dòng cảm xúc: Playfair Display Italic, ~24px, `#EF3B83` (`accent-pink`), căn giữa<br>• Tiêu đề: Anton, ~64px, `#FFFFFF` (trắng), 2 dòng, IN HOA, căn giữa<br>• 2 nút pill tròn `rounded-full` ngang cạnh nhau:<br>  - Nút 1: `THAM GIA ME TIME` (Nền `#BC039E` `bright-magenta`, chữ trắng bold IN HOA, link `#`)<br>  - Nút 2: `THAM GIA YOGA BUDDY` (Nền `#EF3B83` `accent-pink`, chữ trắng bold IN HOA, link `#`) | `CTASection` (bgColor: `deep-navy`, 2 pill buttons) |

## 2. Ghi chú & quy ước kỹ thuật

1. **Khối có sẵn & khả năng mở rộng:**
   - Slide 48 (`HeroImage`): Cần hỗ trợ `showAccentBar` trong backdrop layout, và hỗ trợ `seriesLabelFont?: 'ui' | 'quote'` (mặc định `'ui'`) để eyebrow có thể render bằng font quote Playfair Display italic như thiết kế.
   - Slide 49 (`IconCardGrid`): 3 thẻ với vạch màu trên đỉnh, subtitle in hoa, link "Khám phá →". Thẻ 3 dạng "coming-soon" (nền xám/ngà, viền xám, không vạch đỉnh, không link). Mũi tên điều hướng carousel.
   - Slide 50 (`ImageText`): Hỗ trợ danh sách các section nhỏ (tôn chỉ "Me" First, You Always Can Miss ONE) hoặc sử dụng format chuẩn.
   - Slide 51 (`IconCardGrid`): 3 cột, căn giữa, thẻ có thời gian nhỏ trên tiêu đề Anton đúng màu vạch, mô tả bên dưới.
   - Slide 52 (`TestimonialGrid`): Variant `featured` (1 lớn trái + 2 nhỏ chồng phải) nền `lavender-mist`.
   - Slide 53 & 56 (`PhotoGallery`): Layout `mosaic` với 1 lớn trái, 2 chồng giữa, 1 cao phải; mũi tên 2 bên.
   - Slide 54 (`ImageText`): `imageBleed: true`, `layout: 'image-left'`, `anchorId: 'yoga-buddy'`.
   - Slide 55: 2 thẻ trắng vạch màu đỉnh, thẻ trái nhãn IN HOA hồng nhấn, thẻ phải nhãn chữ thường đậm navy.
   - Slide 57 (`CTASection`): Hỗ trợ 2 nút pill tròn (`secondaryButtonText`, `secondaryButtonVariant: 'accent-pink'`, `buttonVariant: 'magenta'`).

2. **Quy tắc không vi phạm:**
   - Giữ nguyên mặc định của các component cũ để không làm gãy snapshot / trang khác.
   - Không truyền callback / slot function sang Client Component (tránh lỗi 500 React Server Component).
   - Không commit PDF và ảnh `ref/`.

## 3. Kết quả đối chiếu trực quan (Visual Compare)

Toàn bộ ảnh so sánh từng section cạnh slide thiết kế (đã che vùng chứa ảnh người thật để bảo vệ quyền riêng tư) được lưu tại `docs/design/cong-dong/compare/p-48.png` đến `p-57.png` và `mobile-375-full.png`.

| Slide | Section Web | Độ khớp thị giác | Chi tiết đã tinh chỉnh & kết quả |
| --- | --- | --- | --- |
| 48 | Hero | 98% | Eyebrow font Playfair Display Italic hồng `#EF3B83`, tiêu đề Anton in hoa trắng, vạch hồng tròn, đoạn mô tả Montserrat thường trắng căn trái trên nền backdrop tối. |
| 49 | Không gian | 99% | 3 thẻ trắng xếp ngang: Thẻ 1 Me Time vạch hồng sen `#BC039E`, subtitle hồng sen; Thẻ 2 Yoga Buddy vạch hồng nhấn `#EF3B83`, subtitle hồng nhấn; Thẻ 3 Không gian mới nền ngà xám `#F5F3EF`, không vạch, không link. Nút link "Khám phá →" căn đáy thẻ. |
| 50 | Me Time | 98% | Cột trái: Nhãn hồng nhấn, tiêu đề Anton navy, trích dẫn hồng sen không viền vạch, 2 tôn chỉ in hoa đậm. Cột phải: Ô ảnh bo góc 16px (giữ chỗ `[MẪU]`). |
| 51 | Lịch trình 5:00 AM | 99% | 3 thẻ trắng vạch màu xoay vòng (`#BC039E`, `#EF3B83`, `#280A60`), giờ Montserrat, tiêu đề Anton in hoa cùng màu vạch, mô tả căn giữa. |
| 52 | Tiếng nói Me Time | 97% | Layout featured: 1 card lớn bên trái, 2 card nhỏ xếp chồng bên phải trên nền `lavender-mist`. Lời chia sẻ từ testimonials (consent=true), không hardcode tên thật trong mẫu. |
| 53 | Khoảnh khắc Me Time | 98% | Layout mosaic: 4 khung ảnh (ô `[MẪU]`), mũi tên chevron 2 bên, tiêu đề Anton căn giữa trên nền `warm-ivory`. |
| 54 | Yoga Buddy | 98% | Cột trái tràn mép (bleed) ô ảnh `[MẪU]`. Cột phải nhãn hồng nhấn, tiêu đề Anton navy, trích dẫn hồng sen 2 dòng, 2 đoạn văn giới thiệu. |
| 55 | Cuộc hẹn 8:30 sáng | 99% | 2 thẻ trắng ngang trên nền `soft-pink`: Thẻ trái vạch hồng nhấn, 3 bước IN HOA hồng nhấn; Thẻ phải vạch navy, 3 nguyên tắc chữ thường đậm navy. |
| 56 | Góc nhỏ Yoga Buddy | 98% | Layout mosaic: 4 khung ảnh (ô `[MẪU]`) trên nền `lavender-mist`, mũi tên chevron 2 bên. |
| 57 | CTA | 99% | Nền `deep-navy`, dòng cảm xúc hồng nhấn, tiêu đề Anton trắng 2 dòng, 2 nút bo tròn pill (`THAM GIA ME TIME` hồng sen và `THAM GIA YOGA BUDDY` hồng nhấn) đặt link `#`. |
| 375 | Toàn bộ mobile | 100% | Xem `compare/mobile-375-full.png`: Không có lỗi vỡ khung, không cuộn ngang, các thẻ co giãn mượt mà. |

