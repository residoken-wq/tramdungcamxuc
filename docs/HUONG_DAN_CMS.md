# Hướng dẫn sử dụng hệ thống quản trị Trạm Dừng Cảm Xúc

> **Dành cho Hana Lương** · Phiên bản 1 (Cổng Giai đoạn 1)
> Tài liệu hướng dẫn thao tác toàn diện trên hệ thống quản trị website: tạo và quản lý sản phẩm, thu thập lead, chăm sóc khách hàng, quản trị trang pháp lý, cài đặt thanh toán ngân hàng và tự tay dựng trang bằng công cụ kéo thả trực quan mà không cần biết lập trình.

---

## Mục lục

1. [Đăng nhập và Bảo mật tài khoản](#1-đăng-nhập-và-bảo-mật-tài-khoản)
   - [1.4. Khách hàng đăng nhập thế nào](#14-khách-hàng-đăng-nhập-thế-nào)
2. [Nhận biết và Làm việc với dữ liệu mẫu](#2-nhận-biết-và-làm-việc-với-dữ-liệu-mẫu)
3. [Quản lý Sản phẩm, Giá bán và Tài nguyên](#3-quản-lý-sản-phẩm-giá-bán-và-tài-nguyên)
   - [3.6. Xem trước khi sửa dịch vụ, chương trình và bài viết (Live Preview)](#36-xem-trước-khi-sửa-dịch-vụ-chương-trình-và-bài-viết-live-preview)
4. [Quản lý Lời chia sẻ của khách hàng (Testimonials)](#4-quản-lý-lời-chia-sẻ-của-khách-hàng-testimonials)
5. [Dựng trang trực quan bằng công cụ kéo thả (Puck Editor)](#5-dựng-trang-trực-quan-bằng-công-cụ-kéo-thả-puck-editor)
6. [Quản lý Trang pháp lý và Thông tin người bán](#6-quản-lý-trang-pháp-lý-và-thông-tin-người-bán)
7. [Cài đặt Website, Kênh liên hệ và Thanh toán](#7-cài-đặt-website-kênh-liên-hệ-và-thanh-toán)
8. [Quản lý Khách tiềm năng (Leads) và Xuất file CSV](#8-quản-lý-khách-tiềm-năng-leads-và-xuất-file-csv)
9. [Quản lý Câu hỏi Quiz chẩn đoán thói quen](#9-quản-lý-câu-hỏi-quiz-chẩn-đoán-thói-quen)
10. [Xử lý sự cố và Nhận biết thông báo lỗi thường gặp](#10-xử-lý-sự-cố-và-nhận-biết-thông-báo-lỗi-thường-gặp)
11. [Bài kiểm tra cổng Giai đoạn 1 (Checklist dành cho Hana)](#11-bài-kiểm-tra-cổng-giai-đoạn-1-checklist-dành-cho-hana)
12. [Danh sách việc cần Hana cung cấp (Nội dung & Tài sản)](#12-danh-sách-việc-cần-hana-cung-cấp-nội-dung--tài-sản)
13. [Danh sách ảnh chụp màn hình hướng dẫn](#13-danh-sách-ảnh-chụp-màn-hình-hướng-dẫn)

---

## 1. Đăng nhập và Bảo mật tài khoản

### 1.1. Đăng nhập vào trang quản trị

**Mục đích**: Truy cập vào hệ thống làm việc trung tâm để quản lý toàn bộ nội dung, khách hàng và sản phẩm của Trạm Dừng Cảm Xúc.

**Các bước thực hiện**:

1. Mở trình duyệt web (Google Chrome, Safari hoặc Microsoft Edge) trên máy tính.
2. Nhập địa chỉ: `<ĐỊA CHỈ DEMO>/admin` (ví dụ trên môi trường thật: `https://tramdungcamxuc.com/admin`).
3. Nhập **Email** và **Mật khẩu** của tài khoản quản trị.
4. Bấm nút **Đăng nhập**.

![Màn hình đăng nhập trang quản trị](images/huong-dan/01-dang-nhap.png)
<!-- ẢNH 01: trang <ĐỊA CHỈ DEMO>/admin/login, giao diện đăng nhập với ô Email, Mật khẩu và nút Đăng nhập -->

> **Nếu gặp lỗi**: Kiểm tra xem bàn phím có đang bật phím viết hoa (`Caps Lock`) hoặc bộ gõ tiếng Việt làm sai mật khẩu không. Nếu báo sai thông tin đăng nhập quá nhiều lần, hãy đợi 1 phút rồi thử lại.

---

### 1.2. Đổi mật khẩu cá nhân

**Mục đích**: Thiết lập mật khẩu riêng an toàn sau khi nhận tài khoản hoặc cập nhật mật khẩu định kỳ.

**Các bước thực hiện**:

1. Ở cột menu bên trái, tìm nhóm **Hệ thống**, bấm vào mục **Quản trị viên**.
2. Bấm vào dòng chứa tài khoản email của Hana trong danh sách để mở trang hồ sơ.
3. Cuộn xuống khu vực thông tin mật khẩu, bấm vào nút **Đổi mật khẩu**.
4. Lúc này màn hình sẽ mở ra 2 ô mới:
   - Ô **Mật khẩu mới**: Nhập mật khẩu bí mật bạn muốn đặt (nên gồm ít nhất 8 ký tự, có chữ và số).
   - Ô **Xác nhận mật khẩu**: Gõ lại chính xác mật khẩu mới vừa nhập ở ô trên.
5. Bấm nút **Lưu** ở góc trên bên phải hoặc thanh công cụ phía dưới để hệ thống cập nhật.

![Đổi mật khẩu trong trang quản trị](images/huong-dan/02-doi-mat-khau.png)
<!-- ẢNH 02: trang <ĐỊA CHỈ DEMO>/admin/collections/users/[id], giao diện hồ sơ quản trị viên sau khi bấm Đổi mật khẩu, khoanh ô Mật khẩu mới, Xác nhận mật khẩu và nút Lưu -->

> **Nếu gặp lỗi**: Nếu hai ô mật khẩu không khớp nhau, hệ thống sẽ hiện thông báo nhắc nhở màu đỏ. Bạn chỉ cần gõ lại cẩn thận hai ô giống hệt nhau rồi bấm **Lưu**.

---

### 1.3. Hai vai trò trong hệ thống

Hệ thống phân chia tài khoản quản trị thành hai vai trò rõ ràng để đảm bảo an toàn tuyệt đối cho doanh nghiệp của bạn:

- **Chủ sở hữu (`owner`) – Toàn quyền**: Đây là vai trò của riêng Hana. Bạn có quyền hạn tối cao: tạo và sửa mọi nội dung, quản lý giá bán, cài đặt tài khoản ngân hàng nhận tiền chuyển khoản VietQR, quản lý đơn hàng, xem toàn bộ thông tin khách hàng và phân quyền cho người khác.
- **Biên tập (`editor`) – Soạn thảo nội dung**: Dành cho các bạn trợ lý hoặc cộng sự hỗ trợ viết bài, chỉnh ảnh, soạn thảo lời chia sẻ. Người ở vai trò này **không thể xem hoặc thay đổi** tài khoản ngân hàng, không thể sửa cài đặt thanh toán, và không thể xóa bỏ đơn hàng của khách.

---

### 1.4. Khách hàng đăng nhập thế nào

**Mục đích**: Giúp Hana nắm rõ trải nghiệm của học viên và khách hàng khi truy cập vào hệ thống học tập hoặc tài khoản cá nhân (Hana không cần thao tác gì, hệ thống xử lý tự động 100%).

- **Đăng nhập không cần mật khẩu (Passwordless OTP)**: Khách hàng không cần nhớ mật khẩu. Khách chỉ cần vào trang `/tai-khoan/dang-nhap`, nhập địa chỉ email và đồng ý với Chính sách bảo mật.
- **Mã xác thực 6 chữ số qua Email**: Hệ thống tự động gửi một mã OTP gồm 6 chữ số tới hộp thư của khách, có hiệu lực trong 10 phút. Khách nhập mã này để vào tài khoản ngay lập tức.
- **Bảo mật và Tự động**: Mỗi mã chỉ dùng được 1 lần, nếu nhập sai quá 5 lần mã sẽ tự khóa để chống dò mã. Phiên đăng nhập được lưu an toàn trên trình duyệt của khách trong 30 ngày.
- **Hồ sơ khách hàng trong CMS**: Hệ thống tự động tạo hồ sơ khách hàng mới trong mục **Khách hàng** (`customers`) ngay lần đăng nhập đầu tiên và tự động gắn đúng các đơn hàng, quyền học của họ. Khách hàng hoàn toàn không thể truy cập vào trang quản trị `/admin` của Hana.

---

## 2. Nhận biết và Làm việc với dữ liệu mẫu

**Mục đích**: Nhận biết các bài viết, sản phẩm, trang web do đội ngũ kỹ thuật gieo sẵn (`seed`) để không bị nhầm lẫn với nội dung thật.

**Các bước thực hiện & Quy tắc**:

1. Ở mọi danh mục (Sản phẩm, Trang nội dung, Câu hỏi chẩn đoán...), các mục có tiền tố `[MẪU]` ở đầu (ví dụ: `[MẪU] Ebook và bộ công cụ EQ`, `[MẪU] Growth Mirror – gói CLEAR`, `[MẪU] Trang chủ`...) là dữ liệu mẫu.
2. Dữ liệu mẫu hoàn toàn độc lập và không ảnh hưởng gì tới các nội dung thật do Hana tự tạo.
3. Khi bạn nhập nội dung thật và xóa tiền tố `[MẪU]` đi, hệ thống sẽ tự động chuyển bản ghi đó thành **Dữ liệu thật** (`isSample = false`). Kể từ lúc này, hệ thống cam kết **không bao giờ ghi đè** hay làm mất nội dung thật của bạn khi kỹ thuật bảo trì website.

![Danh sách sản phẩm có nhãn dữ liệu mẫu](images/huong-dan/03-du-lieu-mau.png)
<!-- ẢNH 03: trang <ĐỊA CHỈ DEMO>/admin/collections/products, danh sách sản phẩm hiển thị tiền tố [MẪU] ở đầu tên -->

---

## 3. Quản lý Sản phẩm, Giá bán và Tài nguyên

Mọi khóa học, công cụ số, tài liệu miễn phí, dịch vụ coaching hay gói đồng hành đều nằm tại mục **Sản phẩm**.

### 3.1. Tạo và chỉnh sửa sản phẩm

**Mục đích**: Đưa một sản phẩm hoặc tài nguyên mới lên website để giới thiệu và bán tới độc giả.

**Các bước thực hiện**:

1. Ở cột menu bên trái, tìm nhóm **Bán hàng**, bấm chọn **Sản phẩm**.
2. Bấm nút **Tạo mới** ở góc trên bên phải màn hình (hoặc bấm vào tên sản phẩm có sẵn để sửa).
3. Điền các trường thông tin cơ bản:
   - **Tên sản phẩm**: Tên hiển thị công khai trên website (ví dụ: _Bộ thẻ EQ Buddy 26 thẻ_).
   - **Đường dẫn**: Viết chữ thường không dấu, nối bằng dấu gạch ngang (ví dụ: `bo-the-eq-buddy`).
   - **Khu vực**: Chọn **Trang chính** (`site`), **Thói quen** (`habit`) hoặc **EQ Buddy** (`eq`).
   - **Loại sản phẩm**: Chọn loại phù hợp trong danh mục (Sách điện tử, Bộ tài nguyên, Công cụ số, Sản phẩm trên Shopee, Workshop, Cộng đồng, Phiên trải nghiệm, Gói đồng hành, Doanh nghiệp).
4. Bấm **Lưu bản nháp** hoặc **Xuất bản**.

---

### 3.2. Sửa giá bán, giá ưu đãi và hạn ưu đãi

**Mục đích**: Thay đổi giá niêm yết hoặc thiết lập chương trình ưu đãi có thời hạn cho sản phẩm mà không cần can thiệp vào mã nguồn.

**Các bước thực hiện**:

1. Trong biểu mẫu sản phẩm, cuộn tới khu vực thông tin tài chính:
   - **Giá bán**: Nhập số tiền gốc bằng đồng Việt Nam (chỉ gõ số liền nhau, ví dụ `250000`).
   - **Giá ưu đãi**: Nếu có khuyến mại, nhập mức giá sau giảm vào ô này (ví dụ `178000`). Nếu không giảm giá, để trống ô này.
   - **Hạn ưu đãi**: Bấm vào biểu tượng lịch để chọn ngày giờ kết thúc khuyến mại (tùy chọn).
2. Bấm nút **Xuất bản** (hoặc **Lưu**) để áp dụng mức giá mới ngay lập tức. Mọi khối hiển thị sản phẩm trên website sẽ tự động cập nhật giá mới sau vài giây.

![Sửa giá bán và giá ưu đãi](images/huong-dan/04-sua-gia-va-uu-dai.png)
<!-- ẢNH 04: trang <ĐỊA CHỈ DEMO>/admin/collections/products/[id], khu vực các trường Giá bán, Giá ưu đãi và Hạn ưu đãi -->

> **Nếu gặp lỗi**: Hãy đảm bảo không nhập các ký tự đặc biệt như `đ`, `.` hay `,` vào ô giá tiền (chỉ nhập số).

---

### 3.3. Đổi 5 trạng thái bán và ảnh hưởng hiển thị trên website

**Mục đích**: Quyết định cách thức sản phẩm xuất hiện và hành động của nút bấm đối với độc giả.

Tại trường **Trạng thái bán** (`saleStatus`), Hana có thể chọn 1 trong 5 trạng thái:

| Trạng thái                     | Hiển thị ngoài website             | Nút hành động tương ứng                                           | Trường hợp sử dụng                                                 |
| :----------------------------- | :--------------------------------- | :---------------------------------------------------------------- | :----------------------------------------------------------------- |
| **Sắp ra mắt** (`coming_soon`) | Hiện thông tin, chưa cho mua       | Nút _"Nhận thông báo"_                                            | Sản phẩm đang trong giai đoạn chuẩn bị, mở đăng ký trước.          |
| **Đang bán** (`on_sale`)       | Hiện giá và mở đặt mua             | Nút _"Mua ngay"_ (hoặc _"Dùng thử 21 ngày"_ nếu có ngày dùng thử) | Sản phẩm hoặc công cụ số đã sẵn sàng mở bán chính thức.            |
| **Miễn phí** (`free`)          | Cho phép tải hoặc nhận quà         | Nút _"Nhận miễn phí"_                                             | Ebook, tài liệu quà tặng tải qua email, bài tập mẫu.               |
| **Cần tư vấn** (`consult`)     | Báo giá riêng, cần trao đổi        | Nút _"Đăng ký tư vấn"_ / _"Trao đổi"_                             | Các gói lớn Growth Mirror, chương trình đào tạo Doanh nghiệp.      |
| **Ẩn** (`hidden`)              | Không hiển thị trên danh mục chung | Không hiển thị thẻ                                                | Các cấu phần nội bộ đi kèm gói lớn hoặc sản phẩm tạm dừng phục vụ. |

![Đổi trạng thái bán của sản phẩm](images/huong-dan/05-doi-trang-thai-san-pham.png)
<!-- ẢNH 05: trang chỉnh sửa sản phẩm, danh sách thả xuống của trường Trạng thái bán với 5 lựa chọn -->

---

### 3.4. Cài đặt "Liên kết của nút" và trang Sắp ra mắt

Ô **Liên kết của nút (ngoài web hoặc trong web)** (`externalUrl`) cho phép bạn chỉ định nơi dẫn khách đến khi bấm nút trên thẻ sản phẩm:

- **Liên kết ngoài**: Dán đường link đầy đủ bắt đầu bằng `https://` (ví dụ: Shopee dán `https://shopee.vn/bo-the-eq-buddy` để mở gian hàng Shopee ở tab mới an toàn).
- **Công cụ trong web**: Gõ đường dẫn bắt đầu bằng một dấu `/` (ví dụ: công cụ trong web gõ `/habit/chan-doan` để dẫn thẳng vào bài test).
- **Sản phẩm "Sắp ra mắt"**: Khi chọn trạng thái _Sắp ra mắt_, website tự động chuyển hướng khách đến trang `/sap-ra-mat` để khách để lại email. Mọi thông tin khách đăng ký được lưu tại mục **Khách tiềm năng** với thẻ `sap-ra-mat:<slug>` (hoặc có thêm `dung-thu:<slug>` nếu có ngày dùng thử).

---

### 3.5. Điểm đặc biệt của Gói đồng hành (Growth Mirror)

**Mục đích**: Xây dựng gói đồng hành có nhiều thành phần đi kèm (phiên coaching, workshop, cộng đồng, công cụ số).

**Quy tắc vận hành an toàn**:

1. Khi mở gói sản phẩm loại **Gói đồng hành** (như gói CLEAR, BUILD, SHINE), tìm tới bảng **Cấu phần của gói**.
2. Hana bấm **Thêm cấu phần** để bổ sung các thành phần:
   - Nhập tên cấu phần, số lượng và đơn giá thành phần.
3. **Tổng giá trị** và **Ưu đãi (%)** được hệ thống **tự động tính toán 100%**:
   - Hệ thống tự cộng dồn giá trị các thành phần để ra dòng Tổng giá trị gạch ngang.
   - Hệ thống tự so sánh tổng giá trị với giá bán của gói để tính ra con số phần trăm ưu đãi (ví dụ: `30%`, `50%`, `60%`).
   - Hai ô này được khóa chế độ chỉ đọc để chống tính toán sai lệch. Bạn không cần và không thể nhập tay.

![Cấu phần gói Growth Mirror tự động tính giá trị](images/huong-dan/06-cau-phan-goi-growth-mirror.png)
<!-- ẢNH 06: trang chi tiết một gói Growth Mirror, bảng Cấu phần của gói và hai ô Tổng giá trị, Ưu đãi (%) bị làm mờ chỉ đọc -->

---

### 3.6. Tải tài liệu PDF vào "Tài liệu riêng tư" và gắn vào sản phẩm miễn phí

**Mục đích**: Đăng tải các tệp quà tặng (Ebook PDF, tài liệu hướng dẫn) được bảo vệ an toàn để giao tự động qua email khi khách đăng ký.

**Các bước thực hiện**:

1. Ở cột menu bên trái, tìm nhóm **Bán hàng**, bấm vào **Tài liệu riêng tư**.
2. Bấm nút **Tạo mới** ở góc trên bên phải.
3. Bấm nút tải tệp và chọn tệp PDF (hoặc ZIP, EPUB) từ máy tính của bạn.
4. Nhập tóm tắt vào ô **Mô tả tài liệu** (ví dụ: _Ebook và bộ công cụ EQ bản chính thức PDF_).
5. Bấm nút **Lưu** để hệ thống lưu tệp vào vùng bảo mật.
6. **Gắn tệp vào sản phẩm**:
   - Mở mục **Sản phẩm** -> bấm vào sản phẩm miễn phí bạn muốn tặng (ví dụ: `[MẪU] Ebook và bộ công cụ EQ`).
   - Cuộn tới khu vực **Tài liệu được giao**, bấm **Thêm mới**.
   - Tại ô chọn tài liệu, chọn tệp PDF bạn vừa tải lên ở Bước 5.
   - Bấm **Xuất bản** sản phẩm.

![Tải tài liệu riêng tư](images/huong-dan/07-tai-lieu-rieng-tu.png)
<!-- ẢNH 07: trang <ĐỊA CHỈ DEMO>/admin/collections/privateFiles, danh sách tệp riêng tư và form tải lên tệp PDF -->

> **Nếu gặp lỗi**: Đảm bảo tệp tải lên có định dạng hợp lệ (`.pdf`, `.zip`, `.epub`). Các định dạng tệp lạ sẽ bị hệ thống từ chối để ngăn chặn mã độc.

---

### 3.7. Xem trước khi sửa dịch vụ, chương trình và bài viết (Live Preview)

**Mục đích**: Nhìn thấy ngay trang hiển thị thực tế khi đang soạn thảo dịch vụ coaching, chương trình đào tạo doanh nghiệp hoặc bài viết trước khi xuất bản mà không cần chuyển qua lại giữa nhiều tab.

**Các bước thực hiện**:

1. Vào **Dịch vụ đồng hành**, **Chương trình doanh nghiệp** hoặc **Bài viết và video**, mở bản ghi muốn sửa.
2. Bấm nút **Xem trước** ở phía trên form. Nếu là bản ghi mới, nhập tên/tiêu đề và slug rồi lưu nháp lần đầu.
3. Sửa chữ trong form: khung bên cạnh cập nhật ngay cả khi chưa lưu. Có thể chọn **Điện thoại**, **Máy tính bảng** hoặc **Máy tính** để đổi kích thước kiểm tra độ co giãn.
4. Bấm **Lưu nháp** để giữ lại thay đổi; chỉ bấm **Xuất bản** khi muốn khách nhìn thấy nội dung mới. Khách ngoài website thật vẫn luôn thấy bản đã xuất bản ổn định trong lúc Hana đang sửa.

> **Lưu ý an toàn**: Khung xem trước chỉ hiển thị bản nháp khi Hana đã đăng nhập tài khoản quản trị. Gửi đường dẫn xem trước cho người chưa đăng nhập không cho họ quyền xem nháp. Với các trang dựng bằng Puck (như Trang chủ, Landing page), tiếp tục dùng **Chỉnh sửa trực quan** như trước (xem mục 5).

![Xem trước khi sửa dịch vụ, chương trình và bài viết](images/huong-dan/27-xem-truoc-dich-vu.png)
<!-- ẢNH 27: Form sửa dịch vụ với Xem trước đang mở, tiêu đề chưa lưu hiện trong iframe và bộ chọn ba kích thước. -->

---

## 4. Quản lý Lời chia sẻ của khách hàng (Testimonials)

### 4.1. Thêm một lời chia sẻ mới

**Mục đích**: Đăng tải cảm nhận, phản hồi tích cực của học viên và khách hàng lên website để xây dựng niềm tin.

**Các bước thực hiện**:

1. Ở cột menu bên trái, tìm nhóm **Nội dung**, bấm chọn **Lời chia sẻ**.
2. Bấm nút **Tạo mới** ở góc trên bên phải.
3. Điền các thông tin:
   - **Tên người chia sẻ**: Tên hoặc danh xưng của khách hàng (ví dụ: _Chị Minh Anh_).
   - **Vai trò**: Ngữ cảnh hoặc vị trí công việc (ví dụ: _Quản lý nhân sự, học viên Growth Mirror_).
   - **Lời chia sẻ**: Trích đoạn cảm nghĩ chân thực của khách hàng.
   - **Sản phẩm hoặc dịch vụ liên quan**: Chọn khóa học hoặc phiên coaching mà khách hàng đã trải nghiệm.
   - **Ảnh người chia sẻ**: Tải ảnh chân dung của khách hàng (tùy chọn).

---

### 4.2. Quy tắc bắt buộc: Đồng ý hiển thị (Consent)

**Mục đích**: Tuân thủ luật bảo vệ dữ liệu cá nhân (Nghị định 13/2023) và giữ trọn vẹn sự tôn trọng với khách hàng.

**Quy tắc hệ thống**:

- Trong form có ô tick: **Đã đồng ý cho phép hiển thị**.
- **Chỉ khi khách hàng đã chính thức đồng ý** cho phép chia sẻ câu chuyện lên truyền thông, Hana mới tick vào ô này.
- **Nếu chưa tick vào ô này mà bạn bấm Xuất bản**, hệ thống sẽ **chặn lại ngay lập tức** và hiện thông báo lỗi: _"Cần có sự đồng ý trước khi xuất bản lời chia sẻ."_
- Trên toàn bộ website công khai, các khối hiển thị lời chia sẻ chỉ quét những bản ghi đã có ô tick này.

![Thêm testimonial với ô tick đồng ý](images/huong-dan/08-them-testimonial-dong-y.png)
<!-- ẢNH 08: trang <ĐỊA CHỈ DEMO>/admin/collections/testimonials/create, form nhập cảm nhận và khoanh đỏ ô tick Đã đồng ý cho phép hiển thị -->

---

## 5. Dựng trang trực quan bằng công cụ kéo thả (Puck Editor)

Đây là công cụ mạnh mẽ nhất giúp Hana tự tay tạo ra các landing page chiến dịch, trang dịch vụ hay trang sự kiện một cách trực quan như xếp các khối hình ảnh mà không cần chạm vào code.

### 5.1. Tạo trang mới từ Mẫu trang có sẵn

**Mục đích**: Tạo một trang web hoàn chỉnh chỉ trong vài phút bằng cách kế thừa bố cục chuyên nghiệp đã được thiết kế sẵn.

**Các bước thực hiện**:

1. Ở cột menu bên trái, tìm nhóm **Nội dung**, bấm chọn **Trang nội dung**.
2. Bấm nút **Tạo mới** ở góc trên bên phải.
3. Nhập **Tên trang** (ví dụ: _Chiến dịch Chuyển mình Cuối năm_).
4. Nhập **Đường dẫn**: Viết chữ thường không dấu, ví dụ `chien-dich-cuoi-nam` (riêng Trang chủ là đúng một dấu `/`).
5. Tại ô **Mẫu trang**, bấm chọn 1 trong 4 mẫu có sẵn:
   - **Landing chiến dịch**: Bố cục phễu thu hút độc giả, gồm Hero, Câu chuyện, Lời chia sẻ và Form đăng ký.
   - **Trang dịch vụ**: Dành cho giới thiệu dịch vụ coaching 1:1 chuyên sâu.
   - **Trang workshop**: Dành cho sự kiện đào tạo hoặc workshop sắp diễn ra.
   - **Trang sự kiện**: Dành cho các hoạt động cộng đồng.
6. Bấm nút **Lưu** ở thanh công cụ dưới đáy màn hình. Hệ thống sẽ tự động khởi tạo trang với toàn bộ các khối chuẩn theo mẫu bạn chọn!

![Tạo trang từ mẫu](images/huong-dan/09-tao-trang-tu-mau.png)
<!-- ẢNH 09: trang <ĐỊA CHỈ DEMO>/admin/collections/pages/create, trường chọn Mẫu trang với danh sách Landing chiến dịch, Trang dịch vụ... -->

---

### 5.2. Mở trình chỉnh sửa trực quan

**Mục đích**: Chuyển từ màn hình nhập liệu sang màn hình kéo thả toàn cảnh.

**Các bước thực hiện**:

1. Sau khi trang đã được bấm Lưu, nhìn sang cột bên phải (sidebar).
2. Bấm vào nút màu xanh tím nổi bật: **🎨 Chỉnh sửa trực quan (Puck Editor)**.
3. Màn hình sẽ chuyển sang trình dựng kéo thả toàn màn hình.

![Nút Chỉnh sửa trực quan trên trang](images/huong-dan/10-nut-chinh-sua-truc-quan.png)
<!-- ẢNH 10: trang chi tiết Trang nội dung, khoanh nút Chỉnh sửa trực quan (Puck Editor) ở cột bên phải -->

---

### 5.3. Thao tác với các khối: Thêm, sửa chữ, đổi màu nền, nhân bản và xóa

**Mục đích**: Tùy biến toàn bộ nội dung trên trang theo ý thích của bạn.

Màn hình trình dựng gồm 3 khu vực:

- **Cột bên trái**: Thư viện khối chia theo nhóm (_Mở đầu_, _Nội dung_, _Bố cục_, _Bán hàng_, _Niềm tin_, _Chuyển đổi_).
- **Khu vực ở giữa**: Khung trang web đang hiển thị trực quan.
- **Cột bên phải**: Bảng thuộc tính của khối đang chọn.

**Các thao tác cơ bản**:

- **Thêm khối mới**: Giữ chuột trái vào khối mong muốn ở cột bên trái, kéo sang vị trí mong muốn ở giữa rồi thả tay ra.
- **Sửa câu chữ**: Bấm chuột vào khối cần sửa ở giữa. Nhìn sang cột bên phải và gõ lại tiêu đề, dòng cảm xúc, đoạn văn bản theo ý bạn.
- **Đổi màu nền**: Trong bảng thuộc tính bên phải, bấm vào ô **Màu nền** và chọn 1 trong các màu pastel nhẹ nhàng của Brand Book 2026 (_Ngà ấm_, _Hồng phấn_, _Tím sương_, _Bạc hà_, _Kem bơ_, _Xanh thẫm_).
- **Nhân bản khối**: Rê chuột lên góc trên khối ở giữa, bấm vào biểu tượng hai ô vuông (**Nhân bản**) để nhân đôi khối đó ngay bên dưới.
- **Xóa khối**: Rê chuột lên khối, bấm vào biểu tượng thùng rác (**Xóa**) để loại bỏ khối khỏi trang.

![Toàn cảnh giao diện trình dựng kéo thả Puck](images/huong-dan/11-toan-canh-puck-editor.png)
<!-- ẢNH 11: toàn cảnh màn hình Puck Editor gồm 3 cột: thư viện khối bên trái, canvas ở giữa và bảng thuộc tính bên phải -->

![Kéo khối và sửa chữ trong Puck Editor](images/huong-dan/12-keo-khoi-sua-chu.png)
<!-- ẢNH 12: thao tác chọn một khối trên canvas và sửa câu chữ, màu nền ở cột bên phải -->

---

### 5.4. Sửa tiêu đề Hero trang chủ & Quy tắc khóa khối (Hero 2 Lối vào)

**Mục đích**: Thay đổi lời chào đón đầu trang chủ mà vẫn giữ an toàn cho trải nghiệm điều hướng của độc giả.

**Cách sửa câu chữ Hero Trang chủ**:

1. Vào **Trang nội dung** -> chọn trang có đường dẫn `/` (Trang chủ) -> bấm **Chỉnh sửa trực quan**.
2. Bấm chuột vào khối trên cùng (**Hero 2 Lối vào**).
3. Nhìn sang cột bên phải để sửa:
   - Dòng tiêu đề 1 (Xanh thẫm): Mặc định là _"Hiểu mình rõ. Hành động bền bỉ."_
   - Dòng tiêu đề 2 (Hồng sen): Mặc định là _"Tỏa sáng bằng thế mạnh riêng."_
   - Dòng cảm xúc: Dòng chữ in nghiêng mang lại cảm giác bình yên.
   - Câu chữ trên 2 nút lối vào (_Cá nhân_ và _Doanh nghiệp_).

**Quy tắc khóa khối bảo vệ trang chủ**:

- Khối **Hero 2 Lối vào** trên Trang chủ đóng vai trò phân luồng sống còn giữa khách hàng cá nhân và doanh nghiệp.
- Vì vậy, hệ thống đã **khóa chức năng xóa** đối với khối này trên Trang chủ. Bạn sẽ thấy biểu tượng thùng rác bị ẩn hoặc vô hiệu hóa. Đây là cơ chế chủ đích giúp trang chủ không bao giờ bị mất đi lối vào chính yếu.

![Khối Hero được khóa bảo vệ trên trang chủ](images/huong-dan/13-khoa-khoi-hero-trang-chu.png)
<!-- ẢNH 13: khối Hero 2 Lối vào trên trang chủ không có nút xóa và được bảo vệ cấu trúc -->

---

### 5.5. Xem thử trên 3 kích thước màn hình (375px, 768px, 1440px)

**Mục đích**: Đảm bảo trang web hiển thị thoáng đãng, vừa vặn và không bao giờ bị tràn ngang trên điện thoại của độc giả.

**Cách thực hiện**:

- Trên thanh công cụ trên cùng của trình dựng Puck, bấm vào 3 biểu tượng kích thước:
  - **Điện thoại (375px)**: Kiểm tra xem giao diện di động có đẹp mắt và chữ có dễ đọc không.
  - **Máy tính bảng (768px)**: Xem thử trên màn hình iPad/tablet.
  - **Máy tính (1440px)**: Xem trên màn hình máy tính để bàn hoặc laptop.

![Xem thử 3 kích thước màn hình](images/huong-dan/14-xem-thu-3-man-hinh.png)
<!-- ẢNH 14: thanh trên cùng của Puck Editor khoanh 3 biểu tượng chuyển đổi kích thước màn hình -->

---

### 5.6. Lịch sử phiên bản và Khôi phục bản cũ

**Mục đích**: Tự tin thử nghiệm chỉnh sửa mà không sợ hỏng trang, có thể quay lại bản cũ bất cứ lúc nào.

**Cách thực hiện**:

1. Trên thanh công cụ trên cùng của trình dựng Puck, bấm vào nút **Lịch sử**.
2. Một bảng danh sách các phiên bản đã lưu trước đó sẽ hiện ra, hiển thị rõ ngày giờ lưu.
3. Chọn phiên bản bạn muốn quay lại, bấm nút **Khôi phục**.
4. Toàn bộ bố cục và câu chữ của phiên bản đó sẽ được khôi phục ngay lập tức về màn hình soạn thảo.

![Lịch sử phiên bản và khôi phục bản cũ](images/huong-dan/15-lich-su-khoi-phuc.png)
<!-- ẢNH 15: cửa sổ popup Lịch sử phiên bản hiển thị danh sách các bản lưu theo thời gian và nút Khôi phục -->

---

### 5.7. Nhân bản toàn bộ trang

**Mục đích**: Tạo một trang chiến dịch mới có bố cục tương tự trang hiện tại mà không phải kéo thả lại từ đầu.

**Cách thực hiện**:

1. Trong màn hình trình dựng của trang bạn muốn sao chép, bấm nút **Nhân bản trang** trên thanh công cụ trên cùng.
2. Hệ thống sẽ tự động tạo một trang mới với toàn bộ khối giống hệt và mở trang bản sao ra để bạn sửa đổi tên và câu chữ.

![Nút Nhân bản trang trong Puck Editor](images/huong-dan/16-nhan-ban-trang.png)
<!-- ẢNH 16: thanh trên cùng của Puck Editor, khoanh nút Nhân bản trang -->

---

### 5.8. Lưu nháp, Xuất bản và Xem trang công khai

**Mục đích**: Quản lý quy trình đưa nội dung lên mạng một cách an toàn.

- **Tự động lưu (Autosave)**: Cứ mỗi 30 giây, trình dựng sẽ tự động lưu nháp công việc của bạn.
- **Nút Lưu nháp**: Bấm khi bạn muốn chủ động lưu lại mà chưa muốn độc giả ngoài mạng nhìn thấy.
- **Nút Xuất bản**: Bấm khi trang đã hoàn thiện. Lúc này hệ thống sẽ đưa nội dung ra website thật và hiện thông báo xanh _"Đã xuất bản thành công"_.
- **Nút Xem trang**: Xuất hiện ngay cạnh nút Xuất bản. Bấm vào để mở một tab mới xem trang web thật ngoài đời!

![Lưu nháp, Xuất bản và Xem trang](images/huong-dan/17-luu-nhap-va-xuat-ban.png)
<!-- ẢNH 17: thanh trên cùng của Puck Editor với các nút Lưu nháp, Xuất bản và Xem trang -->

---

## 6. Quản lý Trang pháp lý và Thông tin người bán

### 6.1. Chỉnh sửa nội dung một trang pháp lý

**Mục đích**: Cập nhật văn bản điều khoản, chính sách bảo mật hoặc hướng dẫn giải quyết khiếu nại theo đúng quy định pháp luật.

**Các bước thực hiện**:

1. Ở cột menu bên trái, tìm nhóm **Hệ thống**, bấm chọn **Trang pháp lý**.
2. Bấm vào trang bạn muốn cập nhật nội dung (ví dụ: _Chính sách giá và thanh toán_).
3. Sử dụng khung soạn thảo **Nội dung** để chỉnh sửa văn bản (có thể in đậm, gạch đầu dòng, tạo tiêu đề nhỏ...).
4. Chọn **Ngày cập nhật nội dung** là ngày hiện tại.
5. Bấm **Xuất bản** để trang ngoài chân trang website tự cập nhật.

![Chỉnh sửa trang pháp lý](images/huong-dan/18-sua-trang-phap-ly.png)
<!-- ẢNH 18: trang <ĐỊA CHỈ DEMO>/admin/collections/legalPages/[id], khung soạn thảo nội dung của trang pháp lý -->

---

### 6.2. Nhập thông tin người bán (`sellerInfo`)

**Mục đích**: Công khai minh bạch thông tin đơn vị kinh doanh ở chân trang và trang thông tin pháp lý theo quy định thương mại điện tử.

**Các bước thực hiện**:

1. Ở cột menu bên trái, tìm nhóm **Hệ thống**, bấm vào **Cài đặt website**.
2. Bấm chọn tab **Người bán**.
3. Nhập đầy đủ thông tin:
   - **Tên người bán hoặc hộ kinh doanh**: Tên đăng ký kinh doanh chính thức.
   - **Mã số thuế**: Mã số thuế cá nhân hoặc hộ kinh doanh.
   - **Địa chỉ**: Địa chỉ liên hệ hoặc văn phòng làm việc.
   - **Điện thoại**: Số hotline liên hệ hỗ trợ.
   - **Email người bán**: Email chính thức tiếp nhận thông tin pháp lý.
4. Bấm nút **Lưu** để cập nhật lên chân trang của toàn bộ website.

![Nhập thông tin người bán trong Cài đặt website](images/huong-dan/19-thong-tin-nguoi-ban.png)
<!-- ẢNH 19: trang <ĐỊA CHỈ DEMO>/admin/globals/siteSettings, tab Người bán với các ô Tên, MST, Địa chỉ, SĐT, Email -->

---

## 7. Cài đặt Website, Kênh liên hệ và Thanh toán

### 7.1. Cài đặt tài khoản ngân hàng chuyển khoản (VietQR)

**Mục đích**: Cung cấp số tài khoản và thông tin hiển thị mã QR để khách thanh toán khóa học hoặc đặt phiên trải nghiệm.

**Cách thực hiện** _(Chỉ tài khoản Chủ sở hữu mới nhìn thấy tab này)_:

1. Vào nhóm **Hệ thống** -> **Cài đặt website** -> chọn tab **Thanh toán**.
2. Nhập các thông tin ngân hàng của bạn:
   - **Mã ngân hàng VietQR**: Mã ngân hàng liên minh Napas (ví dụ `970436` cho Vietcombank, `970415` cho VietinBank...).
   - **Tên ngân hàng**: Tên đầy đủ (ví dụ: _Vietcombank_).
   - **Số tài khoản**: Số tài khoản thụ hưởng của Hana.
   - **Tên chủ tài khoản**: Tên in hoa không dấu của chủ tài khoản.
   - **Đầu mã chuyển khoản**: Mặc định là `TDCX` (dùng để sinh mã nội dung chuyển khoản cho từng khách).
3. Bấm **Lưu**.

![Cài đặt ngân hàng VietQR](images/huong-dan/21-cai-dat-ngan-hang-vietqr.png)
<!-- ẢNH 21: trang Cài đặt website, tab Thanh toán với các trường cấu hình VietQR -->

---

### 7.2. Cài đặt liên kết Zalo và bật nút trò chuyện nổi (FloatingChat)

**Mục đích**: Cho phép độc giả bấm nút trò chuyện nổi ở góc màn hình để nhắn tin trực tiếp qua Zalo với Hana.

**Cách thực hiện**:

1. Vào **Cài đặt website** -> chọn tab **Liên hệ & Zalo**.
2. Dán đường dẫn Zalo của bạn vào ô **Liên kết trò chuyện Zalo** (ví dụ: `https://zalo.me/090xxxxxxx`).
3. Tick chọn vào ô **Hiện nút trò chuyện Zalo**.
4. Bấm **Lưu**. Nút trò chuyện màu xanh tím với cánh bướm ấm áp sẽ xuất hiện ở góc phải bên dưới website.

![Cài đặt Zalo và nút chat nổi](images/huong-dan/20-cai-dat-zalo-chat.png)
<!-- ẢNH 20: trang Cài đặt website, tab Liên hệ & Zalo với ô Liên kết trò chuyện Zalo và công tắc bật nút chat -->

---

### 7.3. Cài đặt liên kết đặt lịch coaching sau phiên trải nghiệm

**Mục đích**: Gắn đường dẫn lịch hẹn (Cal.com hoặc Google Calendar) để khách hàng chủ động chọn khung giờ 1:1.

**Cách thực hiện**:

1. Ở cột menu bên trái, tìm nhóm **Bán hàng**, bấm vào **Dịch vụ đồng hành**.
2. Bấm vào dịch vụ _Growth Mirror_ hoặc _Thinking Mirror_.
3. Dán link đặt lịch cá nhân của bạn vào ô **Liên kết đặt lịch** (`bookingUrl`).
4. Bấm **Lưu** hoặc **Xuất bản**.

![Cài đặt liên kết đặt lịch coaching](images/huong-dan/22-lien-ket-dat-lich-coaching.png)
<!-- ẢNH 22: trang chỉnh sửa Dịch vụ đồng hành, trường Liên kết đặt lịch -->

---

### 7.4. Cài đặt đo lường truy cập (Plausible / GA4)

**Mục đích**: Theo dõi lượng độc giả ghé thăm website và số lượt đăng ký nhận tài nguyên.

**Cách thực hiện**:

1. Vào **Cài đặt website** -> chọn tab **Chung**.
2. Tại khu vực **Đo lường truy cập**:
   - Chọn dịch vụ: Chọn **Plausible** (bảo mật, thân thiện quyền riêng tư) hoặc **Google Analytics 4**.
   - Nhập **Tên miền Plausible** (ví dụ: `tramdungcamxuc.com`) hoặc **Mã đo lường GA4**.
3. Bấm **Lưu**.

---

### 7.5. Xác nhận chuyển khoản đơn hàng

Mỗi khi khách hàng đăng ký phiên trải nghiệm Growth Mirror 149.000đ trên website, đơn hàng sẽ được tạo tự động ở trạng thái **Chờ thanh toán** kèm theo một **Mã chuyển khoản** duy nhất (ví dụ: `TDCX8F3K2`). Khách sẽ quét mã VietQR hoặc chuyển khoản vào tài khoản ngân hàng của Hana với nội dung này.

Dưới đây là quy trình đối chiếu và duyệt đơn chuẩn dành cho Hana:

#### Các bước đối chiếu sao kê và duyệt đơn

1. **Kiểm tra thông báo ngân hàng / sao kê:**
   - Mở ứng dụng ngân hàng trên điện thoại của bạn.
   - Tìm giao dịch mới nhận được, kiểm **số tiền** khớp với cột **Tổng thanh toán** của đơn.
   - Nhìn vào phần **Nội dung giao dịch**: tìm mã bắt đầu bằng `TDCX...` (ví dụ `TDCX8F3K2`).

2. **Tìm đơn hàng trong trang quản trị CMS:**
   - Đăng nhập vào trang quản trị `<ĐỊA CHỈ DEMO>/admin` bằng tài khoản Chủ sở hữu (Owner).
   - Ở cột menu bên trái, tìm nhóm **Bán hàng**, bấm vào mục **Đơn hàng**.
   - Tìm đơn hàng có cột **Mã chuyển khoản** khớp với mã trên thông báo ngân hàng.
   - Bấm vào dòng đơn hàng đó để mở trang chi tiết.

3. **Bấm nút duyệt thanh toán an toàn:**
   - Tại cột bên phải (Sidebar), Hana sẽ thấy khung **🛡️ Thao tác đơn hàng (Chủ sở hữu)**.
   - Bấm nút xanh tím **✓ Xác nhận thanh toán**.
   - Một hộp thoại xác nhận sẽ hiện lên: Hana đọc lại thông tin và bấm **Đồng ý xác nhận**.

4. **Hệ thống tự động xử lý tiếp theo:**
   - Đơn hàng chuyển sang trạng thái **Đã thanh toán**.
   - Thời điểm duyệt được lưu chính xác vào ô **Thanh toán lúc**.
   - Hệ thống tự động gửi email xác nhận cho khách hàng, trong đó đính kèm liên kết đặt lịch hẹn (Cal.com / Google Calendar) để khách chọn giờ gặp Hana.
   - Trạng thái giao đổi sang **Đã gửi email**.

#### Các lưu ý quan trọng về an toàn thanh toán

- **Trường thông tin được khóa an toàn (Chỉ đọc):** Các ô **Trạng thái thanh toán**, **Thanh toán lúc**, **Trạng thái giao** được thiết kế ở chế độ chỉ đọc. Hana không thể và không nên gõ tay sửa chữ ở đây; việc thay đổi trạng thái bắt buộc phải qua nút **Xác nhận thanh toán** để đảm bảo email đặt lịch và nhật ký kiểm toán không bị bỏ sót.
- **Tính năng chống bấm nhầm (Idempotent):** Nếu Hana vô tình bấm nút xác nhận hai lần liên tiếp cho cùng một đơn, hệ thống sẽ tự động nhận biết đơn đã được duyệt và không bao giờ gửi 2 email cho khách hàng.
- **Chính sách không hoàn tiền:** Theo chính sách của Trạm, các đơn hàng đã chuyển sang trạng thái "Đã thanh toán" sẽ không thể bấm hủy. Nút **Hủy đơn hàng** chỉ có hiệu lực với các đơn đang ở trạng thái chờ thanh toán mà khách thông báo không muốn tham gia nữa.
- **Tự động hết hạn sau 24 giờ:** Nếu sau 24 giờ kể từ khi tạo đơn mà khách không chuyển khoản, hệ thống sẽ tự động chuyển đơn sang trạng thái hết hạn; khách đã đồng ý nhận tin sẽ nhận email nhắc nhẹ. Đơn đã hết hạn không xác nhận được nữa (xem câu hỏi Q19).
- **Số tiền bị khóa:** Sau khi đơn được tạo, Biên tập viên không sửa được sản phẩm, số tiền hay khách hàng của đơn. Chủ sở hữu chỉ sửa được khi đơn còn chờ thanh toán.

#### Tạo link thanh toán gói Growth Mirror

**Mục đích**: Hana tạo đơn hàng thanh toán riêng cho khách sau khi đã tư vấn hoặc hoàn thành phiên trải nghiệm Growth Mirror 149.000đ. Khách nhận được link cá nhân hóa để xem tóm tắt cấu phần gói, đồng ý điều khoản và thanh toán chuyển khoản VietQR.

**Các bước Hana làm**:

1. Đăng nhập vào trang quản trị CMS bằng tài khoản Chủ sở hữu (Owner).
2. Ở cột menu bên trái, tìm nhóm **Bán hàng**, bấm vào **Đơn hàng** -> bấm nút **Tạo mới**.
3. Đánh dấu tick vào ô **Hana tạo link thanh toán** (`createdByAdmin`).
4. Tại ô **Khách hàng**: chọn khách hàng trong danh sách (hoặc tạo hồ sơ khách hàng mới nếu chưa có).
5. Tại mục **Sản phẩm trong đơn**: chọn đúng **một** gói đồng hành Growth Mirror đã xuất bản (`type = package`, ví dụ: _Gói CLEAR_, _Gói BUILD_, hoặc _Gói SHINE_).
6. **Không cần gõ giá:** Hệ thống máy chủ tự động tính toán giá chính xác theo giá bán/giá ưu đãi trong cơ sở dữ liệu (bỏ qua mọi số gõ tay).
   - Nếu công tắc **Trừ phí trải nghiệm** (`trialCreditApplies`) đang bật trong Cài đặt website và khách đã từng thanh toán phiên trải nghiệm 149.000đ, hệ thống sẽ tự động trừ đúng 149.000đ vào tổng thanh toán và ghi chú rõ ràng vào ô Ghi chú. Mỗi đơn trải nghiệm chỉ được dùng để giảm trừ đúng 1 lần duy nhất.
7. Bấm nút **Lưu** để tạo đơn.
8. Ở cột bên phải (Sidebar), mục **Link thanh toán cho khách**, bấm nút **Sao chép link** để gửi đường dẫn cho khách hàng qua Zalo hoặc Email.
9. **Trải nghiệm phía khách hàng:** Khách mở liên kết sẽ thấy tóm tắt gói (tên gói, danh sách cấu phần, giá trị thực tế gạch ngang, giá thanh toán, % ưu đãi). Khách bắt buộc phải tích chọn ô đồng ý Điều khoản sử dụng và Chính sách giá – thanh toán thì hệ thống mới hiển thị mã VietQR và nội dung chuyển khoản `paymentRef`.

![Tạo link thanh toán gói trong admin](images/huong-dan/26-link-thanh-toan-goi.png)
<!-- ẢNH 26: trang chi tiết đơn hàng do admin tạo, cột sidebar hiển thị link thanh toán /thanh-toan/don/[token] kèm nút Sao chép link -->

---

## 8. Quản lý Khách tiềm năng (Leads) và Xuất file CSV

### 8.1. Xem và lọc danh sách khách tiềm năng

**Mục đích**: Nắm bắt danh sách độc giả đã để lại thông tin nhận Ebook, đăng ký phiên trải nghiệm hoặc gửi brief doanh nghiệp.

**Cách thực hiện**:

1. Ở cột menu bên trái, tìm nhóm **Khách hàng**, bấm vào **Khách tiềm năng**.
2. Danh sách hiển thị đầy đủ Email, Họ tên, Nhu cầu (_Cá nhân_, _Doanh nghiệp_, _Tài nguyên_), và Thời điểm đăng ký.
3. Sử dụng các bộ lọc ở đầu danh sách để lọc theo:
   - **Tình trạng chăm sóc**: _Mới_, _Đã liên hệ_, _Đã chuyển đổi_, _Đóng_.
   - **Nhu cầu**: Lọc riêng nhóm doanh nghiệp hoặc nhóm nhận ebook.

---

### 8.2. Cập nhật tình trạng chăm sóc

**Mục đích**: Đánh dấu tiến độ liên hệ với từng khách để không bỏ sót ai.

**Cách thực hiện**:

1. Bấm vào email của khách hàng trong danh sách.
2. Tại trường **Tình trạng chăm sóc**, chuyển trạng thái từ **Mới** (`new`) sang **Đã liên hệ** (`contacted`) sau khi bạn đã gọi điện hoặc gửi email.
3. Khi khách đồng ý đồng hành, chuyển sang **Đã chuyển đổi** (`converted`).
4. Bấm **Lưu**.

---

### 8.3. Xuất file CSV mở đúng tiếng Việt bằng Microsoft Excel

**Mục đích**: Tải toàn bộ danh sách khách hàng về máy tính để phân tích hoặc nhập vào hệ thống gửi email bản tin.

**Cách thực hiện**:

1. Mở danh sách **Khách tiềm năng**.
2. Nhìn lên góc trên bên phải của bảng danh sách, bấm vào nút **Xuất CSV**.
3. Trình duyệt sẽ tự động tải về tệp có tên dạng `leads-YYYY-MM-DD.csv`.
4. Mở tệp trực tiếp bằng **Microsoft Excel**. Hệ thống đã được lập trình sẵn chuẩn mã hóa UTF-8 BOM, đảm bảo **toàn bộ chữ tiếng Việt có dấu hiển thị sắc nét, chuẩn xác 100%**, hoàn toàn không bị lỗi ký tự hay biến thành dấu hỏi `?`.

![Quản lý Khách tiềm năng và nút Xuất CSV](images/huong-dan/23-quan-ly-leads-xuat-csv.png)
<!-- ẢNH 23: trang <ĐỊA CHỈ DEMO>/admin/collections/leads, danh sách khách tiềm năng và khoanh nút Xuất CSV -->

---

## 9. Quản lý Câu hỏi Quiz chẩn đoán thói quen

**Mục đích**: Thay đổi 16 tình huống trì hoãn và các gợi ý cảm xúc cho bài chẩn đoán 5 phút ngoài website (`/habit/chan-doan`).

**Cách thực hiện**:

1. Ở cột menu bên trái, tìm nhóm **Khóa học**, bấm vào **Câu hỏi chẩn đoán**.
2. Bấm vào câu hỏi bạn muốn chỉnh sửa.
3. Bạn có thể sửa:
   - **Nội dung câu hỏi**: Tình huống độc giả tự chấm điểm (ví dụ: _Tôi thường trì hoãn khi không biết bắt đầu từ đâu_).
   - **Giai đoạn**: Gắn vào 1 trong 4 giai đoạn vòng lặp (_Cue - Gợi ý_, _Craving - Khao khát_, _Response - Phản hồi_, _Reward - Phần thưởng_).
   - **Gợi ý**: Đoạn văn bản gợi ý giải pháp ấm áp từ Hana hiển thị khi độc giả có điểm kẹt ở giai đoạn này.
4. Bấm **Lưu** hoặc **Xuất bản**. Bài test ngoài website sẽ tự động cập nhật câu hỏi mới.

![Chỉnh sửa câu hỏi chẩn đoán quiz](images/huong-dan/24-cau-hoi-quiz-chan-doan.png)
<!-- ẢNH 24: trang <ĐỊA CHỈ DEMO>/admin/collections/diagnosticQuestions/[id], form nhập nội dung câu hỏi và gợi ý rich text -->

---

## 10. Xử lý sự cố và Nhận biết thông báo lỗi thường gặp

Dưới đây là các tình huống bạn có thể gặp và cách giải quyết cực kỳ nhanh gọn:

### 10.1. Lỗi đường dẫn không hợp lệ hoặc bị trùng

- **Hiện tượng**: Báo lỗi đỏ ở ô **Đường dẫn** khi bấm Lưu.
- **Nguyên nhân**: Bạn gõ dấu tiếng Việt, dấu cách, chữ hoa, hoặc trùng với một bài đã có.
- **Cách sửa**: Chỉ gõ chữ thường không dấu, dùng dấu gạch ngang `-` (ví dụ: `bai-viet-moi`). Riêng Trang chủ gõ đúng một dấu `/`.

### 10.2. Lỗi thiếu mô tả ảnh khi tải lên

- **Hiện tượng**: Báo lỗi _"Vui lòng nhập mô tả ảnh hoặc tài liệu"_.
- **Nguyên nhân**: Khi tải ảnh lên **Thư viện ảnh và tài liệu**, bạn để trống ô mô tả ảnh (`alt`).
- **Cách sửa**: Nhập một câu ngắn mô tả ảnh (ví dụ: _Chân dung Hana Lương ấm áp_) rồi bấm Lưu. Đây là quy tắc chuẩn để website dễ tiếp cận và hiển thị đẹp trên Google.

### 10.3. Lỗi xuất bản lời chia sẻ chưa có sự đồng ý

- **Hiện tượng**: Góc phải dưới hiện khung đỏ _"Lỗi - Field sau không hợp lệ: consent"_ (`consent` là ô _Đã đồng ý cho phép hiển thị_).
- **Nguyên nhân**: Bạn bấm Xuất bản testimonial mà chưa tick vào ô _Đã đồng ý cho phép hiển thị_.
- **Cách sửa**: Tick vào ô đồng ý nếu khách hàng đã cho phép, hoặc lưu ở dạng _Bản nháp_ nếu đang chờ khách phản hồi.

### 10.4. Phiên đăng nhập hết hạn

- **Hiện tượng**: Bấm Lưu thì báo lỗi, hoặc màn hình tự quay về trang đăng nhập (câu chữ chính xác của thông báo: cần kiểm lại).
- **Nguyên nhân**: Bạn mở màn hình làm việc quá lâu mà không thao tác.
- **Cách sửa**: Mở một tab mới, vào lại `<ĐỊA CHỈ DEMO>/admin` đăng nhập lại, sau đó quay lại tab cũ bấm **Lưu nháp** hoặc **Xuất bản**.

![Thông báo lỗi thường gặp và cách xử lý](images/huong-dan/25-thong-bao-loi-thuong-gap.png)
<!-- ẢNH 25: minh họa hộp thông báo lỗi validation trên giao diện quản trị -->

---

## 11. Bài kiểm tra cổng Giai đoạn 1 (Checklist dành cho Hana)

> **Mục tiêu nghiệm thu**: Đây là danh sách các hành động trong thực tế mà Hana tự tay thực hiện độc lập từ đầu đến cuối mà không cần kỹ thuật hỗ trợ để nghiệm thu chính thức Cổng Giai đoạn 1 (theo `docs/tasks/GD1.md`):

- [ ] **1. Tự tạo 1 landing chiến dịch mới từ mẫu và xuất bản**:
  - Vào **Trang nội dung** -> bấm **Tạo mới** -> chọn Mẫu **Landing chiến dịch** -> lưu trang. _(Xem mục 5.1)_
  - Mở **Chỉnh sửa trực quan** -> sửa tiêu đề, đổi màu nền -> bấm **Xuất bản** và mở xem thử ngoài web thật. _(Xem mục 5.3 & 5.8)_
- [ ] **2. Tự sửa tiêu đề hero trên trang chủ**:
  - Mở trang `/` trong Puck Editor -> bấm vào khối Hero 2 Lối vào -> sửa dòng tiêu đề 1 & 2 -> bấm Xuất bản. _(Xem mục 5.4)_
- [ ] **3. Thêm 1 lời chia sẻ khách hàng (Testimonial)**:
  - Vào **Lời chia sẻ** -> bấm **Tạo mới** -> nhập cảm nhận của khách -> tick ô **Đã đồng ý cho phép hiển thị** -> bấm **Xuất bản**. _(Xem mục 4)_
- [ ] **4. Đổi trạng thái 1 sản phẩm**:
  - Vào **Sản phẩm** -> mở 1 sản phẩm -> chuyển Trạng thái bán (ví dụ từ _Sắp ra mắt_ sang _Đang bán_) -> lưu lại -> kiểm tra nút ngoài website đổi tương ứng. _(Xem mục 3.3)_
- [ ] **5. Sửa 1 trang pháp lý**:
  - Vào **Trang pháp lý** -> chọn trang _Chính sách giá và thanh toán_ -> bổ sung câu chữ -> bấm **Xuất bản**. _(Xem mục 6.1)_
- [ ] **6. Kiểm tra khách tiềm năng và xuất file CSV**:
  - Vào **Khách tiềm năng** -> xem danh sách -> bấm nút **Xuất CSV** -> mở file bằng Microsoft Excel kiểm tra tiếng Việt có dấu sắc nét. _(Xem mục 8.3)_
- [ ] **7. Xác nhận 1 đơn chuyển khoản 149.000đ**:
  - Kiểm tra thông báo ngân hàng / sao kê -> đối chiếu số tiền 149.000đ và mã chuyển khoản `TDCX...`. _(Xem mục 7.5)_
  - Vào **Đơn hàng** -> mở đơn có mã khớp -> bấm nút **✓ Xác nhận thanh toán** -> hệ thống tự chuyển trạng thái _Đã thanh toán_ và gửi email xác nhận kèm link đặt lịch cho khách. _(Xem mục 7.5)_
- [ ] **8. Tạo 1 link thanh toán gói và gửi cho khách**:
  - Vào **Đơn hàng** -> bấm **Tạo mới** -> tick ô **Hana tạo link thanh toán** -> chọn khách hàng và gói Growth Mirror (CLEAR / BUILD / SHINE) -> bấm **Lưu**. _(Xem mục 7.5, phần "Tạo link thanh toán gói Growth Mirror")_
  - Tại cột bên phải (Sidebar), mục _Link thanh toán cho khách_, bấm nút **Sao chép link** -> gửi link cho khách qua Zalo hoặc Email để khách xem tóm tắt gói và thanh toán VietQR. _(Xem mục 7.5, phần "Tạo link thanh toán gói Growth Mirror")_

---

## 12. Danh sách việc cần Hana cung cấp (Nội dung & Tài sản)

Để website hoàn thiện 100% trước khi ra mắt công chúng, dưới đây là bảng tổng hợp các nội dung và tài sản còn thiếu đang chờ Hana cung cấp:

|  STT   | Hạng mục                                           | Vị trí áp dụng                         | Nội dung cụ thể cần cung cấp                                                                                       | Trạng thái hiện tại |
| :----: | :------------------------------------------------- | :------------------------------------- | :----------------------------------------------------------------------------------------------------------------- | :-----------------: |
| **01** | **Câu cảm xúc Hero**                               | Trang chủ (`/`)                        | 1 câu cảm xúc in nghiêng đặt dưới tiêu đề 2 tầng màu của khối Hero.                                                |      _Chưa có_      |
| **02** | **Câu chuyện Hana**                                | Trang chủ (`/`) & Về Hana (`/ve-hana`) | Đoạn văn bản kể về hành trình cá nhân, triết lý đồng hành và câu trích dẫn tâm đắc.                                |      _Chưa có_      |
| **03** | **Ảnh chân dung gốc**                              | Toàn bộ website & Media                | Ảnh chân dung chất lượng cao, ấm áp của Hana (nền trong hoặc chụp ngoại cảnh).                                     |      _Chưa có_      |
| **04** | **Số liệu ấn tượng**                               | Trang chủ (`/`)                        | Các chỉ số thực tế để điền vào StatsBar (số năm kinh nghiệm, số giờ khai vấn, học viên).                           |      _Chưa có_      |
| **05** | **6 Trang pháp lý**                                | Chân trang website                     | Nội dung chính thức cho 6 trang: Thông tin người bán, Điều khoản, Bảo mật, Dịch vụ, Giá - thanh toán, Khiếu nại.   |      _Chưa có_      |
| **06** | **Thông tin người bán**                            | Cài đặt website                        | Tên đăng ký kinh doanh, Mã số thuế, Địa chỉ, Số điện thoại và Email chính thức.                                    |      _Chưa có_      |
| **07** | **Tài khoản VietQR**                               | Cài đặt website                        | Tên ngân hàng, Số tài khoản, Tên chủ tài khoản để tạo mã QR thanh toán.                                            |      _Chưa có_      |
| **08** | **Link Zalo & Đặt lịch**                           | Cài đặt website & Services             | Đường dẫn liên kết Zalo cá nhân (`https://zalo.me/...`) và link đặt lịch Cal.com/Google Calendar.                  |      _Chưa có_      |
| **09** | **Logo đối tác / Khách hàng**                      | Doanh nghiệp (`/doanh-nghiep`)         | Tệp logo các doanh nghiệp hoặc tổ chức đã đồng hành (đã có sự đồng ý hiển thị).                                    |      _Chưa có_      |
| **10** | **16 Câu hỏi Quiz chẩn đoán**                      | Thói quen (`/habit/chan-doan`)         | Rà soát và hoàn thiện câu chữ 16 tình huống trì hoãn cùng gợi ý giải pháp của từng giai đoạn.                      |      _Chưa có_      |
| **11** | **Chữ trang quiz**                                 | Thói quen (`/habit/chan-doan`)         | Lời mở đầu trang quiz, nhãn thang điểm 1–4 và lời dẫn trang kết quả (hiện là chữ tạm).                             |      _Chưa có_      |
| **12** | **Tài liệu PDF quà tặng**                          | Tài liệu riêng tư + sản phẩm miễn phí  | Tệp PDF tài nguyên miễn phí gửi qua email cho người để lại thông tin.                                              |      _Chưa có_      |
| **13** | **Nội dung Habit và 26 thẻ EQ**                    | Giai đoạn 2 và 3                       | Bài học, video, 11 kỹ thuật; thông điệp, câu chuyện, câu hỏi của 26 thẻ EQ Buddy.                                  |      _Chưa có_      |
| **14** | **Link gian hàng Shopee**                          | Thẻ vật lý EQ Buddy (`/eq-buddy`)      | Đường dẫn gian hàng Shopee chính thức của Hana để gắn nút mua bộ thẻ vật lý (không xây giỏ hàng trên web).         |      _Chưa có_      |
| **15** | **Quyết định trừ phí trải nghiệm 149.000đ**        | Cài đặt website (`siteSettings`)       | Chốt bật/tắt chính sách trừ 149k vào giá gói Growth Mirror khi khách nâng cấp (công tắc `trialCreditApplies`).     |      _Chưa có_      |
| **16** | **Hình thức kinh doanh (Cá nhân / Hộ kinh doanh)** | Cài đặt thanh toán (GĐ 2)              | Xác định mô hình kinh doanh để đăng ký tài khoản cổng thanh toán tự động (payOS / SePay) chuẩn bị cho Giai đoạn 2. |      _Chưa có_      |

Các mục trên (trừ mục 11 và 16) **đã có sẵn chỗ trống trong CMS**. Khi có nội dung, Hana chọn một trong hai cách: (1) tự nhập vào đúng ô theo hướng dẫn ở các mục trên, hoặc (2) gửi tệp (Word, Excel, ảnh, PDF) cho anh Nhân để nhập thẳng vào hệ thống. Riêng mục 11 hiện chưa có ô trong CMS: Hana gửi câu chữ cho anh Nhân để thay.

---

## 13. Danh sách ảnh chụp màn hình hướng dẫn

Dưới đây là bảng đối chiếu toàn bộ 27 ảnh màn hình được tích hợp trong tài liệu và kịch bản tự động chụp (`scripts/cms-screenshots.mjs`):

| Mã ảnh | Tệp hình ảnh                                         | Vị trí màn hình                               | Nội dung và điểm nhấn                                                    | Trạng thái tệp                     |
| :----: | :--------------------------------------------------- | :-------------------------------------------- | :----------------------------------------------------------------------- | :--------------------------------- |
| **01** | `images/huong-dan/01-dang-nhap.png`                  | `/admin/login`                                | Màn hình đăng nhập quản trị với Email, Mật khẩu                          | Đã có file                         |
| **02** | `images/huong-dan/02-doi-mat-khau.png`               | `/admin/account`                              | Hồ sơ cá nhân sau khi bấm nút Đổi mật khẩu                               | Đã có file                         |
| **03** | `images/huong-dan/03-du-lieu-mau.png`                | `/admin/collections/products`                 | Danh sách sản phẩm với tiền tố `[MẪU]` nhận diện                         | Đã có file                         |
| **04** | `images/huong-dan/04-sua-gia-va-uu-dai.png`          | `/admin/collections/products/[id]`            | Khu vực Giá bán, Giá ưu đãi và Hạn ưu đãi                                | Đã có file                         |
| **05** | `images/huong-dan/05-doi-trang-thai-san-pham.png`    | `/admin/collections/products/[id]`            | Danh sách thả xuống 5 trạng thái bán sản phẩm                            | Đã có file                         |
| **06** | `images/huong-dan/06-cau-phan-goi-growth-mirror.png` | `/admin/collections/products/[growth-mirror]` | Bảng cấu phần gói tự động tính Tổng giá trị & Ưu đãi (%)                 | Đã có file                         |
| **07** | `images/huong-dan/07-tai-lieu-rieng-tu.png`          | `/admin/collections/privateFiles`             | Danh sách và biểu mẫu tải lên Tài liệu riêng tư (PDF/ZIP)                | Đã có file                         |
| **08** | `images/huong-dan/08-them-testimonial-dong-y.png`    | `/admin/collections/testimonials/create`      | Biểu mẫu Lời chia sẻ với ô tick bắt buộc Đã đồng ý                       | Đã có file                         |
| **09** | `images/huong-dan/09-tao-trang-tu-mau.png`           | `/admin/collections/pages/create`             | Biểu mẫu tạo trang mới và chọn Mẫu trang có sẵn                          | Đã có file                         |
| **10** | `images/huong-dan/10-nut-chinh-sua-truc-quan.png`    | `/admin/collections/pages/[id]`               | Cột bên phải với nút màu tím Chỉnh sửa trực quan (Puck Editor)           | Đã có file                         |
| **11** | `images/huong-dan/11-toan-canh-puck-editor.png`      | `/builder/[id]`                               | Toàn cảnh 3 cột của trình dựng trực quan Puck                            | Đã có file                         |
| **12** | `images/huong-dan/12-keo-khoi-sua-chu.png`           | `/builder/[id]`                               | Chọn khối trên canvas và sửa thuộc tính ở cột bên phải                   | Đã có file                         |
| **13** | `images/huong-dan/13-khoa-khoi-hero-trang-chu.png`   | `/builder/[homeId]`                           | Khối Hero 2 Lối vào được bảo vệ, khóa xóa trên Trang chủ                 | Đã có file                         |
| **14** | `images/huong-dan/14-xem-thu-3-man-hinh.png`         | `/builder/[id]`                               | Thanh trên cùng chọn xem Điện thoại, Tablet, Máy tính                    | Đã có file                         |
| **15** | `images/huong-dan/15-lich-su-khoi-phuc.png`          | `/builder/[id]`                               | Cửa sổ Lịch sử phiên bản và nút Khôi phục bản trước                      | Đã có file                         |
| **16** | `images/huong-dan/16-nhan-ban-trang.png`             | `/builder/[id]`                               | Nút Nhân bản trang trên thanh công cụ trên cùng                          | Đã có file                         |
| **17** | `images/huong-dan/17-luu-nhap-va-xuat-ban.png`       | `/builder/[id]`                               | Các nút Lưu nháp, Xuất bản và nút Xem trang công khai                    | Đã có file                         |
| **18** | `images/huong-dan/18-sua-trang-phap-ly.png`          | `/admin/collections/legalPages/[id]`          | Trình soạn thảo văn bản của trang pháp lý                                | Đã có file                         |
| **19** | `images/huong-dan/19-thong-tin-nguoi-ban.png`        | `/admin/globals/siteSettings`                 | Tab Người bán với các trường thông tin hộ kinh doanh/MST                 | Đã có file                         |
| **20** | `images/huong-dan/20-cai-dat-zalo-chat.png`          | `/admin/globals/siteSettings`                 | Tab Liên hệ & Zalo với liên kết Zalo và nút chat nổi                     | Đã có file                         |
| **21** | `images/huong-dan/21-cai-dat-ngan-hang-vietqr.png`   | `/admin/globals/siteSettings`                 | Tab Thanh toán với thông tin số tài khoản VietQR                         | Đã có file                         |
| **22** | `images/huong-dan/22-lien-ket-dat-lich-coaching.png` | `/admin/collections/services/[id]`            | Trường Liên kết đặt lịch trong dịch vụ coaching                          | Đã có file                         |
| **23** | `images/huong-dan/23-quan-ly-leads-xuat-csv.png`     | `/admin/collections/leads`                    | Danh sách Khách tiềm năng, bộ lọc và nút Xuất CSV                        | Đã có file                         |
| **24** | `images/huong-dan/24-cau-hoi-quiz-chan-doan.png`     | `/admin/collections/diagnosticQuestions/[id]` | Biểu mẫu sửa câu hỏi chẩn đoán và gợi ý rich text                        | Đã có file                         |
| **25** | `images/huong-dan/25-thong-bao-loi-thuong-gap.png`   | `/admin/collections/testimonials/create`      | Thông báo lỗi khi xuất bản testimonial chưa có đồng ý                    | Đã có file                         |
| **26** | `images/huong-dan/26-link-thanh-toan-goi.png`        | `/admin/collections/orders/[id]`              | Sidebar đơn hàng hiển thị link thanh toán cho khách và nút Sao chép link | **Chưa có file** _(Planning chụp)_ |
| **27** | `images/huong-dan/27-xem-truoc-dich-vu.png`          | `/admin/collections/services/[id]`            | Form sửa dịch vụ với Xem trước đang mở, iframe và bộ chọn ba kích thước  | **Chưa có file** _(Planning chụp)_ |
