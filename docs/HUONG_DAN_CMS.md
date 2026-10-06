# Hướng dẫn sử dụng hệ thống quản trị Trạm Dừng Cảm Xúc

> **Dành cho Hana Lương** · Phiên bản 1 (Cổng Giai đoạn 0)
> Tài liệu hướng dẫn thao tác quản trị nội dung website, tạo sản phẩm và tự tay dựng trang bằng công cụ kéo thả trực quan mà không cần biết lập trình.

---

## 1. Trước khi bắt đầu

### 1.1. Địa chỉ trang quản trị và đăng nhập

Hệ thống quản trị (CMS) là nơi Hana quản lý toàn bộ bài viết, sản phẩm, hình ảnh và trang web của Trạm Dừng Cảm Xúc.

1. Mở trình duyệt web (Chrome, Safari, Edge...) trên máy tính.
2. Nhập địa chỉ: `<ĐỊA CHỈ DEMO>/admin`
3. Nhập **Email** và **Mật khẩu** do anh Nhân cung cấp.
4. Bấm nút **Đăng nhập**.

![Màn hình đăng nhập trang quản trị](images/huong-dan/01-dang-nhap.png)
<!-- ẢNH 01: trang <ĐỊA CHỈ DEMO>/admin, giao diện form đăng nhập với 2 ô Email và Mật khẩu, khoanh nút Đăng nhập -->

### 1.2. Đổi mật khẩu cá nhân

Sau khi đăng nhập lần đầu tiên bằng mật khẩu tạm thời do anh Nhân đưa trực tiếp, Hana nên đổi sang mật khẩu riêng của mình ngay:

1. Ở cột menu bên trái, tìm nhóm **Hệ thống**, bấm vào mục **Quản trị viên**.
2. Bấm vào tài khoản email của Hana trong danh sách.
3. Cuộn xuống ô **Mật khẩu mới** và nhập mật khẩu riêng của bạn.
4. Bấm nút **Lưu** (ở góc trên bên phải hoặc thanh công cụ phía dưới) để hoàn tất.

> **Lưu ý quan trọng về tính năng Quên mật khẩu:**
> Website hiện tại đang ở giai đoạn thử nghiệm cổng GĐ 0 và chưa kết nối hệ thống gửi email tự động (tính năng gửi email sẽ được kích hoạt ở Giai đoạn 1). Vì vậy, nếu quên mật khẩu, nút "Quên mật khẩu" sẽ chưa thể gửi email khôi phục. Khi cần đặt lại mật khẩu, Hana chỉ cần nhắn anh Nhân hỗ trợ đặt lại mật khẩu mới trực tiếp.

![Đổi mật khẩu trong trang quản trị](images/huong-dan/02-doi-mat-khau.png)
<!-- ẢNH 02: trang <ĐỊA CHỈ DEMO>/admin/collections/users/[id], giao diện chỉnh sửa tài khoản cá nhân, khoanh ô Mật khẩu mới và nút Lưu -->

### 1.3. Hai vai trò trong hệ thống

Hệ thống phân chia tài khoản quản trị thành hai vai trò rõ ràng:

- **Chủ sở hữu (toàn quyền)**: Đây là vai trò của Hana. Bạn có quyền hạn cao nhất trên toàn bộ hệ thống: tạo và chỉnh sửa mọi nội dung, quản lý danh mục sản phẩm, cấu hình thông tin tài khoản ngân hàng chuyển khoản, xem danh sách đơn hàng và quản lý tài khoản của các cộng sự.
- **Biên tập (sửa nội dung)**: Dành cho các bạn cộng sự hoặc trợ lý hỗ trợ Hana viết bài, đăng ảnh hoặc cập nhật nội dung trang. Người có vai trò này chỉ sửa được câu chữ và hình ảnh; họ **không thể xem hoặc thay đổi** thông tin tài khoản ngân hàng, cài đặt thanh toán hay xóa đơn hàng của khách.

---

## 2. Nhận biết dữ liệu mẫu

Khi đăng nhập vào hệ thống lần đầu, Hana sẽ thấy một số bài viết, sản phẩm và trang web đã có sẵn.

- **Dấu hiệu nhận biết**: Mọi mục do đội kỹ thuật tạo sẵn để chạy thử nghiệm đều bắt đầu bằng tiền tố `[MẪU]` (ví dụ: `[MẪU] Ebook và bộ công cụ EQ`, `[MẪU] Habit Tracker số`, `[MẪU] Growth Mirror – gói CLEAR`...).
- **Ý nghĩa**: Các bản ghi này giúp Hana hình dung cách hiển thị thực tế trên website và tham khảo cách điền các ô thông tin.
- **Cách xử lý**:
  - Dữ liệu mẫu hoàn toàn không làm ảnh hưởng tới dữ liệu thật của Hana.
  - Khi chuẩn bị nội dung chính thức, Hana có thể bấm vào sửa trực tiếp (xóa chữ `[MẪU]` và thay bằng câu chữ thật của mình), hoặc bấm **Tạo mới** các mục hoàn toàn riêng biệt.
  - Các lời chia sẻ khách hàng (testimonial) mẫu hiện đều được đặt ở trạng thái **Bản nháp** để đảm bảo chỉ khi có sự đồng ý thật từ khách hàng mới được xuất bản.

![Danh sách sản phẩm có nhãn dữ liệu mẫu](images/huong-dan/03-du-lieu-mau.png)
<!-- ẢNH 03: trang <ĐỊA CHỈ DEMO>/admin/collections/products, danh sách sản phẩm hiển thị tiền tố [MẪU] ở đầu tên -->

---

## 3. Tạo một sản phẩm mới

Mọi tài nguyên miễn phí, công cụ số, workshop, phiên coaching hay gói đồng hành đều được quản lý tại mục **Sản phẩm**.

### 3.1. Các bước tạo sản phẩm

1. Ở cột menu bên trái, tìm nhóm **Bán hàng**, bấm chọn **Sản phẩm**.
2. Bấm nút **Tạo mới** ở góc trên bên phải màn hình.
3. Điền các thông tin của sản phẩm:
   - **Tên sản phẩm**: Tên gọi sẽ hiển thị cho khách hàng (ví dụ: _Bộ thẻ EQ Buddy 26 thẻ_, _Habit Tracker 21 ngày_).
   - **Đường dẫn**: Phần chữ nằm sau địa chỉ website trên thanh trình duyệt (giúp khách mở trực tiếp sản phẩm). Viết chữ thường không dấu, các từ nối bằng dấu gạch ngang (ví dụ: `habit-tracker-21-ngay`).
   - **Khu vực**: Chọn nơi sản phẩm thuộc về:
     - **Trang chính** (dành cho các gói Growth Mirror, Ebook, chương trình chung).
     - **Thói quen** (dành cho Habit Tracker, Habit Loop).
     - **EQ Buddy** (dành cho thẻ cảm xúc).
   - **Loại sản phẩm**: Chọn loại hình phù hợp trong danh sách:
     - Sách điện tử (`ebook`)
     - Bộ tài nguyên (`toolkit`)
     - Công cụ số (`digital_tool`)
     - Sản phẩm trên Shopee (`physical_external` – sản phẩm vật lý bán qua sàn Shopee)
     - Workshop (`workshop`)
     - Cộng đồng (`community`)
     - Phiên trải nghiệm (`coaching_trial`)
     - Gói đồng hành (`package`)
     - Doanh nghiệp (`b2b`)
   - **Trạng thái bán**: Chọn 1 trong 5 trạng thái hiển thị (xem giải thích chi tiết ở mục 3.2).
   - **Giá bán** và **Giá ưu đãi**: Nhập số tiền bằng đồng (chỉ gõ số, không gõ dấu chấm hay phẩy, ví dụ `250000`). Nếu đang có mức giá khuyến mại, nhập giá giảm vào ô **Giá ưu đãi** (ví dụ `178000`).
   - **Ảnh bìa**: Bấm chọn ảnh đại diện cho sản phẩm từ Thư viện. _(Lưu ý: ảnh tải lên bắt buộc phải có dòng mô tả ảnh mới lưu được – xem chi tiết ở mục 4.3)._
   - **Giới thiệu ngắn**: Một đến hai câu tóm tắt giá trị cốt lõi để hiện trên thẻ sản phẩm.
   - **Giới thiệu chi tiết**: Soạn thảo nội dung giới thiệu đầy đủ, có thể định dạng in đậm, gạch đầu dòng...
   - **Nhãn nút** và **Hành động của nút**: Chọn chữ hiện trên nút bấm (ví dụ: _Mua ngay_, _Nhận miễn phí_, _Đặt lịch_) và cách nút hoạt động.
4. Bấm **Lưu bản nháp** nếu muốn bổ sung sau, hoặc bấm **Xuất bản** nếu muốn sản phẩm hiển thị trên website ngay lập tức.

![Nút Tạo mới trong danh sách Sản phẩm](images/huong-dan/04-tao-san-pham-moi.png)
<!-- ẢNH 04: trang <ĐỊA CHỈ DEMO>/admin/collections/products, khoanh nút Tạo mới ở góc trên bên phải -->

![Biểu mẫu thông tin chi tiết của sản phẩm](images/huong-dan/05-thong-tin-san-pham.png)
<!-- ẢNH 05: trang <ĐỊA CHỈ DEMO>/admin/collections/products/create, giao diện form nhập thông tin với các trường Tên sản phẩm, Đường dẫn, Trạng thái bán, Giá bán -->

### 3.2. Ý nghĩa 5 trạng thái bán

Trạng thái bán quyết định sản phẩm hiển thị ra sao với khách hàng:

| Trạng thái                     | Hiển thị trên web                         | Mục đích sử dụng                                                                                     |
| :----------------------------- | :---------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| **Sắp ra mắt** (`coming_soon`) | Hiện thông tin, nút chưa cho mua          | Dùng cho sản phẩm đang hoàn thiện, giúp giới thiệu trước để độc giả đón đợi.                         |
| **Đang bán** (`on_sale`)       | Hiện đầy đủ giá và nút đặt mua/thanh toán | Sản phẩm đã sẵn sàng cung cấp cho khách hàng.                                                        |
| **Miễn phí** (`free`)          | Nút nhận miễn phí / tải về                | Dành cho quà tặng, Ebook hoặc công cụ dùng thử miễn phí (khách điền email để nhận).                  |
| **Cần tư vấn** (`consult`)     | Nút liên hệ / đặt lịch tư vấn             | Dành cho các gói giá trị cao (Growth Mirror) hoặc chương trình Doanh nghiệp cần trao đổi trước.      |
| **Ẩn** (`hidden`)              | Không hiển thị trên danh mục chung        | Dành cho các cấu phần đi kèm trong gói lớn (như workshop, cộng đồng) hoặc sản phẩm tạm ngừng mở bán. |

### 3.3. Điểm đặc biệt của Gói đồng hành (Growth Mirror)

Khi tạo hoặc sửa một gói đồng hành lớn (như gói CLEAR, BUILD, SHINE):

- Ở mục **Cấu phần của gói**, Hana bấm **Thêm cấu phần** để liệt kê từng thành phần trong gói:
  - Tên cấu phần (ví dụ: _Coaching 1:1 "Vững vàng chuyển mình"_).
  - Số lượng (ví dụ: `3`).
  - Giá trị mỗi đơn vị (ví dụ: `1000000`).
- **Tổng giá trị** và **Ưu đãi (%)** được hệ thống **tự động tính toán 100%**:
  - Hệ thống tự nhân số lượng với đơn giá từng cấu phần để ra **Tổng giá trị**.
  - Hệ thống tự so sánh tổng giá trị với giá bán của gói để tính ra con số **Ưu đãi (%)**.
  - Hai ô này được khóa chế độ chỉ đọc, Hana **không cần và không thể nhập tay**. Điều này giúp các con số trên toàn bộ website luôn chính xác tuyệt đối và ăn khớp với bảng giá đã tính toán.

![Cấu phần gói tự động tính tổng giá trị và ưu đãi](images/huong-dan/06-cau-phan-goi-tu-dong-tinh.png)
<!-- ẢNH 06: trang chi tiết một gói sản phẩm, khu vực Cấu phần của gói với các dòng thành phần và hai ô Tổng giá trị, Ưu đãi (%) bị làm mờ chỉ đọc -->

---

## 4. Dựng một trang bằng công cụ kéo thả (Puck Editor)

Đây là công cụ giúp Hana tự tay tạo ra các trang giới thiệu, trang chia sẻ hay trang sự kiện một cách trực quan giống như đang xếp các khối hình ảnh và câu chữ.

### 4.1. Quy trình tạo trang từng bước

#### Bước 1: Tạo trang trong quản trị CMS

1. Ở cột menu bên trái, tìm nhóm **Nội dung**, bấm vào **Trang nội dung**.
2. Bấm nút **Tạo mới** (ở góc trên bên phải).
3. Điền **Tên trang** (ví dụ: _Về Hana_, _Hành trình thấu hiểu cảm xúc_).
4. Điền **Đường dẫn**:
   - Nếu là **Trang chủ chính**: Chỉ gõ đúng một dấu gạch chéo `/`
   - Nếu là các trang khác: Gõ chữ thường không dấu, nối bằng dấu gạch ngang (ví dụ: `ve-hana`, `gioi-thieu`, `cau-chuyen-cua-toi`).
5. Bấm nút **Lưu** (ở thanh công cụ bên dưới hoặc góc phải) để hệ thống tạo mã trang.

> **Mẹo nhỏ:** Nếu chưa bấm Lưu lần đầu, ở cột bên phải sẽ hiện thông báo _"Vui lòng lưu trang trước khi mở trình chỉnh sửa trực quan"_. Bấm Lưu xong là nút chỉnh sửa sẽ xuất hiện ngay!

![Mục Trang nội dung và nút Tạo mới](images/huong-dan/07-danh-sach-trang.png)
<!-- ẢNH 07: trang <ĐỊA CHỈ DEMO>/admin/collections/pages, danh sách các trang nội dung và khoanh nút Tạo mới -->

![Nút Chỉnh sửa trực quan xuất hiện sau khi lưu trang](images/huong-dan/08-nut-chinh-sua-truc-quan.png)
<!-- ẢNH 08: trang chi tiết Trang nội dung sau khi đã lưu, khoanh nút 'Chỉnh sửa trực quan (Puck Editor)' màu xanh tím ở cột bên phải -->

#### Bước 2: Mở trình chỉnh sửa trực quan

- Sau khi lưu, ở cột bên phải xuất hiện nút màu xanh tím đậm: **🎨 Chỉnh sửa trực quan (Puck Editor)**.
- Bấm vào nút này. Một tab mới sẽ mở ra trên màn hình với địa chỉ dạng `<ĐỊA CHỈ DEMO>/builder/<mã-trang>`.

#### Bước 3: Làm quen với màn hình kéo thả

Màn hình chỉnh sửa trực quan gồm 3 khu vực chính:

1. **Cột bên trái (Thư viện khối)**: Chứa danh sách các khối giao diện được chia theo 3 nhóm (**Mở đầu**, **Nội dung**, **Chuyển đổi**).
2. **Khu vực ở giữa (Khung trang web)**: Thể hiện giao diện trang web trông như thế nào khi hiển thị.
3. **Cột bên phải (Bảng thuộc tính)**: Khi bạn bấm chọn một khối bất kỳ ở giữa, cột bên phải sẽ hiện ra các ô để sửa câu chữ, chọn màu nền, căn lề và đổi kích thước.
4. **Thanh trên cùng**:
   - Nút **Quản trị CMS** (có mũi tên quay về trang quản trị).
   - Tên trang và nhãn trạng thái (**Bản nháp** hoặc **Đã xuất bản**).
   - 3 biểu tượng xem trước màn hình: **Điện thoại (375px)**, **Máy tính bảng (768px)**, **Máy tính (1440px)**.
   - Nút **Lưu nháp** và nút **Xuất bản**.
   - Nút **Xem trang** (xuất hiện sau khi xuất bản để mở trang công khai).

![Toàn cảnh giao diện trình dựng kéo thả Puck](images/huong-dan/09-giao-dien-puck-editor.png)
<!-- ẢNH 09: trang <ĐỊA CHỈ DEMO>/builder/[pageId], giao diện toàn màn hình gồm 3 cột: cột trái thư viện khối, giữa là canvas hiển thị, phải là bảng thuộc tính -->

#### Bước 4: Thao tác kéo thả và sửa chữ

1. Giữ chuột trái vào khối bạn muốn dùng ở cột bên trái, kéo sang khung ở giữa rồi thả tay ra.
2. Bấm chuột vào khối vừa thả để chọn khối đó (khối sẽ có đường viền màu bao quanh).
3. Nhìn sang cột bên phải để sửa đổi:
   - Gõ lại các dòng tiêu đề, nhãn và văn bản.
   - Chọn màu nền và khoảng cách đệm.
4. Muốn đổi vị trí các khối: Giữ chuột vào khối và kéo lên trên hoặc xuống dưới khối khác.

![Kéo thả một khối vào trang và sửa chữ](images/huong-dan/10-keo-khoi-va-sua-chu.png)
<!-- ẢNH 10: trang <ĐỊA CHỈ DEMO>/builder/[pageId], thao tác thả khối vào giữa và nhập nội dung ở các ô thuộc tính bên phải -->

#### Bước 5: Xem thử trên 3 kích cỡ màn hình

Độc giả của Trạm Dừng Cảm Xúc đọc bài trên nhiều thiết bị khác nhau, đặc biệt là điện thoại di động:

- Bấm vào biểu tượng **Điện thoại (375px)**: Xem thử chữ có bị tràn hay quá dài trên màn hình điện thoại không.
- Bấm vào biểu tượng **Máy tính bảng (768px)**: Xem trên màn hình iPad/tablet.
- Bấm vào biểu tượng **Máy tính (1440px)**: Xem trên màn hình máy tính thông thường.

![Chuyển đổi xem thử 3 kích thước màn hình](images/huong-dan/11-xem-thu-3-man-hinh.png)
<!-- ẢNH 11: thanh trên cùng của trình dựng Puck, khoanh 3 biểu tượng chọn kích thước: Điện thoại (375px), Máy tính bảng (768px), Máy tính (1440px) -->

#### Bước 6: Lưu và xem kết quả

- Bấm **Lưu nháp**: Khi muốn lưu lại công việc đang làm dở mà chưa muốn khách xem được.
- Bấm **Xuất bản**: Khi trang đã đẹp và hoàn chỉnh. Lúc này thanh thông báo màu xanh lá sẽ hiện _"Đã xuất bản thành công"_.
- Bấm **Xem trang**: Nút này sẽ xuất hiện ngay cạnh nút xuất bản, bấm vào để mở trang web thật trên một tab mới và chiêm ngưỡng thành quả!

### 4.2. Giới thiệu 5 khối giao diện có sẵn

Hệ thống đã chuẩn bị sẵn 5 khối cơ bản mang trọn vẹn phong cách nhận diện của Trạm Dừng Cảm Xúc (Brand Book 2026):

| Khối giao diện                         | Nhóm       | Dùng để làm gì?                                                                                                                                                                          | Nên đặt ở đâu?                                                                                |
| :------------------------------------- | :--------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------- |
| **Hero 2 Lối vào (Cá nhân & Tổ chức)** | Mở đầu     | Khối chào đón lớn nhất. Gồm nhãn series, tiêu đề 2 tầng màu, câu cảm xúc in nghiêng và 2 ô lựa chọn riêng biệt (Lối vào cho Cá nhân và Lối vào cho Doanh nghiệp).                        | Luôn đặt ở vị trí trên cùng của Trang chủ.                                                    |
| **Tiêu đề mục (Hai tầng màu)**         | Mở đầu     | Tạo tiêu đề cho một phân đoạn nội dung mới. Có dòng 1 màu Xanh thẫm vững chãi, dòng 2 màu Hồng sen ấm áp, đi cùng dòng cảm xúc nhẹ nhàng. Có thể chọn căn giữa hoặc căn trái.            | Đặt ở đầu mỗi phần nội dung lớn để phân tách chủ đề.                                          |
| **Đoạn văn bản (Rich Text phân đoạn)** | Nội dung   | Trình bày bài viết, tâm sự, chia sẻ chiêm nghiệm. Chỉ cần gõ văn bản và bấm Enter 2 lần để tự động tách thành từng đoạn văn thoáng đãng.                                                 | Đặt ở thân trang, xen giữa các tiêu đề và hình ảnh.                                           |
| **Ảnh & Chữ (Song hành)**              | Nội dung   | Kể câu chuyện kết hợp giữa một bức ảnh và đoạn văn bản đi kèm nút bấm. Cho phép chọn ảnh bên trái/chữ bên phải hoặc ngược lại.                                                           | Dùng để giới thiệu câu chuyện của Hana, góc nhìn chuyên môn hoặc lời mời tham gia hành trình. |
| **Nút Kêu gọi hành động (CTA Button)** | Chuyển đổi | Nút bấm lớn mời người đọc thực hiện bước tiếp theo quan trọng (như _Đặt phiên trải nghiệm_, _Nhận tài nguyên_). Có 3 kiểu dáng (Hồng nhấn chính, Xanh thẫm phụ, Viền mảnh) và 3 kích cỡ. | Đặt ở cuối mỗi phân đoạn chia sẻ hoặc chân trang.                                             |

### 4.3. Quy tắc chèn ảnh từ Thư viện

Khi dùng khối **Ảnh & Chữ (Song hành)**:

1. Bấm vào ô **Ảnh minh họa (Thư viện media)** ở cột bên phải.
2. Danh sách các hình ảnh trong hệ thống sẽ hiện ra kèm ảnh thu nhỏ và tên mô tả.
3. Bấm chọn bức ảnh Hana muốn hiển thị.

> **Lưu ý bắt buộc về Mô tả ảnh (alt):**
> Trong danh sách chọn ảnh, hệ thống **chỉ hiển thị những bức ảnh đã có Mô tả ảnh (alt)**.
> Khi Hana tải ảnh mới lên tại mục **Thư viện ảnh và tài liệu**, hãy luôn nhập một câu ngắn mô tả bức ảnh vào ô **Mô tả ảnh hoặc tài liệu** (ví dụ: _"Chân dung Hana Lương ấm áp"_). Nếu để trống ô này, hệ thống sẽ chặn không cho lưu và ảnh cũng không xuất hiện trong trình kéo thả. Đây là quy tắc chủ đích giúp website luôn dễ tiếp cận cho người dùng và tối ưu cho công cụ tìm kiếm.

### 4.4. Quy tắc chọn màu nền thương hiệu

Tại các khối có ô chọn **Màu nền**, Hana sẽ thấy danh sách thả xuống gồm 6 màu sắc được thiết kế chuẩn xác theo Brand Book 2026:

- **Ngà ấm (Warm Ivory)**: Nền chính êm dịu, sáng và ấm áp.
- **Hồng phấn (Soft Pink)**: Nền hồng pastel dịu ngọt, tạo cảm giác được vỗ về.
- **Tím sương (Lavender Mist)**: Nền tím nhạt thanh bình, sâu lắng.
- **Bạc hà (Mint Haze)**: Nền xanh dịu mát, biểu trưng cho sự hồi phục và hy vọng.
- **Kem bơ (Butter Cream)**: Nền vàng kem nhẹ nhàng, tạo sự chú ý tinh tế.
- **Xanh thẫm (Deep Navy)**: Nền xanh đậm đà, tạo chiều sâu vững chãi và nổi bật chữ màu sáng.

_Tại sao không có bảng chọn màu tự do?_
Hệ thống cố tình khóa các mã màu tự do bên ngoài để bảo vệ thẩm mỹ của Trạm Dừng Cảm Xúc. Mọi trang do Hana dựng ra, dù phối màu thế nào, cũng luôn giữ đúng tinh thần thương hiệu: ấm áp, tinh tế và chuyên nghiệp.

---

## 5. Bản nháp và Xuất bản: Cách hoạt động an toàn

Hệ thống quản trị hoạt động theo cơ chế tách biệt hoàn toàn giữa việc chỉnh sửa và việc hiển thị ra ngoài mạng:

1. **Bản nháp (Draft)**:
   - Khi Hana tạo trang mới hoặc sửa trang cũ rồi bấm **Lưu nháp**, toàn bộ thay đổi chỉ được lưu lại trong không gian làm việc của riêng Hana.
   - Khách truy cập bên ngoài hoàn toàn **không nhìn thấy** những sửa đổi này.
   - Nếu trang web đó đã từng xuất bản trước đây, khách bên ngoài vẫn nhìn thấy phiên bản cũ ổn định như bình thường.
2. **Xuất bản (Published)**:
   - Chỉ khi Hana bấm nút **Xuất bản**, hệ thống mới cập nhật những thay đổi mới nhất ra trang web công khai.
   - Ngay sau khi bấm Xuất bản, hệ thống sẽ tự động làm mới trang công khai để khách vào xem thấy ngay nội dung mới.
3. **Ý nghĩa**:
   - Hana có thể hoàn toàn yên tâm thử nghiệm, kéo thả các khối, đổi thử màu sắc hay viết nháp câu từ mà không sợ làm xáo trộn hay hỏng giao diện trang web đang chạy.

![Hai trạng thái Bản nháp và Đã xuất bản](images/huong-dan/12-luu-nhap-va-xuat-ban.png)
<!-- ẢNH 12: thanh trên cùng của trình dựng Puck, khoanh 2 nút Lưu nháp, Xuất bản và nhãn trạng thái Bản nháp / Đã xuất bản -->

---

## 6. Khi gặp lỗi: Nhận biết và cách xử lý

Dưới đây là các tình huống thường gặp và cách xử lý đơn giản:

### 6.1. Lỗi đường dẫn trùng hoặc không hợp lệ

- **Thông báo**: _"Đường dẫn chỉ dùng chữ thường không dấu, số và dấu được cho phép"_ hoặc _"Đường dẫn không được chứa hai dấu / liên tiếp"_ hoặc báo lỗi giá trị đã tồn tại.
- **Nguyên nhân**: Ô **Đường dẫn** có chứa dấu tiếng Việt, dấu cách, chữ hoa, hoặc trùng với một trang/sản phẩm đã tạo trước đó.
- **Cách xử lý**:
  - Sửa lại đường dẫn chỉ gồm chữ thường không dấu, dùng dấu gạch ngang `-` thay cho dấu cách (ví dụ: `ve-hana`, `thoi-quen-nho`).
  - Đối với Trang chủ, chỉ gõ đúng một ký tự `/`. Không gõ `//` hay `/ve-hana/`.
  - Nếu bị trùng tên, hãy thêm số hoặc đổi sang một cụm từ cụ thể hơn.

### 6.2. Thiếu mô tả khi tải ảnh lên

- **Thông báo**: _"Vui lòng nhập mô tả ảnh hoặc tài liệu."_
- **Nguyên nhân**: Khi tải ảnh lên mục **Thư viện ảnh và tài liệu**, ô **Mô tả ảnh hoặc tài liệu** bị bỏ trống.
- **Cách xử lý**: Nhập một câu ngắn mô tả nội dung bức ảnh (ví dụ: _"Logo Trạm Dừng Cảm Xúc"_ hoặc _"Ảnh Hana Lương trong workshop"_), sau đó bấm **Lưu**.

### 6.3. Phiên đăng nhập đã hết hạn

- **Thông báo**: _"Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."_
- **Nguyên nhân**: Hana đã mở màn hình quản trị trong một khoảng thời gian dài mà không thực hiện thao tác nào.
- **Cách xử lý**:
  1. Mở một tab mới trên trình duyệt.
  2. Truy cập lại `<ĐỊA CHỈ DEMO>/admin` và đăng nhập bằng email, mật khẩu.
  3. Quay lại tab đang soạn thảo dở và bấm nút **Lưu nháp** hoặc **Xuất bản** một lần nữa.

### 6.4. Chưa lưu trang đã bấm nút chỉnh sửa trực quan

- **Thông báo**: _"Vui lòng lưu trang trước khi mở trình chỉnh sửa trực quan."_
- **Nguyên nhân**: Trang mới tạo chưa được bấm nút **Lưu** lần đầu, hệ thống chưa có mã trang để mở trình kéo thả.
- **Cách xử lý**: Nhập Tên trang và Đường dẫn, bấm nút **Lưu** ở thanh công cụ phía dưới trước. Sau khi trang lưu xong, nút màu xanh tím **🎨 Chỉnh sửa trực quan (Puck Editor)** sẽ xuất hiện.

> **Khi cần hỗ trợ thêm:** Nếu gặp bất kỳ vấn đề nào khác nằm ngoài các trường hợp trên, Hana hãy chụp ảnh toàn màn hình và gửi cho anh Nhân để được hỗ trợ kiểm tra kỹ thuật.

![Thông báo lỗi thường gặp và cách khắc phục](images/huong-dan/13-thong-bao-loi.png)
<!-- ẢNH 13: trang quản trị admin, minh họa giao diện khi có thông báo lỗi đường dẫn hoặc lỗi thiếu mô tả ảnh -->

---

## 7. Bài thử nghiệm cổng Giai đoạn 0 (Checklist cho Hana)

Đây là bảng các bước Hana tự làm từ đầu đến cuối mà không cần ai trợ giúp kỹ thuật để nghiệm thu cổng Giai đoạn 0:

- [ ] **1. Đăng nhập hệ thống**: Mở trình duyệt vào `<ĐỊA CHỈ DEMO>/admin`, đăng nhập thành công bằng email và mật khẩu tạm do anh Nhân cấp.
- [ ] **2. Đổi mật khẩu**: Vào mục **Quản trị viên**, chọn tài khoản của mình, đổi sang mật khẩu riêng và bấm **Lưu**.
- [ ] **3. Nhận biết dữ liệu mẫu**: Mở mục **Sản phẩm** và **Trang nội dung**, nhìn thấy các mục mẫu có chữ `[MẪU]`.
- [ ] **4. Tạo một sản phẩm mới**:
  - Bấm **Tạo mới** trong mục **Sản phẩm**.
  - Nhập tên: _Sản phẩm thử nghiệm của Hana_.
  - Nhập đường dẫn: `san-pham-thu-nghiem-hana`.
  - Chọn khu vực: _Trang chính_, loại: _Sách điện tử_, trạng thái bán: _Đang bán_.
  - Nhập giá bán: `150000`.
  - Bấm **Xuất bản** và thấy thông báo lưu thành công.
- [ ] **5. Tải một hình ảnh lên**:
  - Vào nhóm **Hệ thống** -> **Thư viện ảnh và tài liệu** -> bấm **Tạo mới**.
  - Tải một bức ảnh từ máy tính lên.
  - Nhập vào ô mô tả: _Ảnh chân dung thử nghiệm của Hana_.
  - Bấm **Lưu**.
- [ ] **6. Dựng một trang mới bằng kéo thả**:
  - Vào nhóm **Nội dung** -> **Trang nội dung** -> bấm **Tạo mới**.
  - Đặt tên trang: _Trang thử nghiệm của Hana_, đường dẫn: `trang-thu-nghiem`.
  - Bấm **Lưu**, sau đó bấm nút tím **🎨 Chỉnh sửa trực quan (Puck Editor)** để mở tab mới.
- [ ] **7. Sử dụng đủ 5 khối giao diện**:
  - Kéo khối **Hero 2 Lối vào** vào đầu trang, sửa tiêu đề theo ý bạn.
  - Kéo khối **Tiêu đề mục**, gõ câu tiêu đề 2 tầng màu.
  - Kéo khối **Đoạn văn bản**, gõ vài dòng tâm sự và chọn màu nền _Hồng phấn_.
  - Kéo khối **Ảnh & Chữ**, chọn bức ảnh bạn vừa tải lên ở Bước 5.
  - Kéo khối **Nút Kêu gọi hành động**, đổi nhãn nút thành _Khám phá ngay_.
- [ ] **8. Xem thử trên điện thoại**: Bấm nút xem thử **Điện thoại (375px)** trên thanh trên cùng để kiểm tra giao diện di động.
- [ ] **9. Xuất bản trang**: Bấm nút **Xuất bản** ở góc trên bên phải màn hình kéo thả.
- [ ] **10. Xem trang ngoài thực tế**: Bấm nút **Xem trang** cạnh nút xuất bản, tab mới mở ra hiển thị đúng trang web với đầy đủ 5 khối bạn vừa tự tay tạo dựng!

![Trang thử nghiệm hiển thị hoàn chỉnh ngoài website](images/huong-dan/14-trang-hoan-thanh.png)
<!-- ẢNH 14: trang công khai <ĐỊA CHỈ DEMO>/trang-thu-nghiem, hiển thị trang hoàn thiện với đầy đủ 5 khối do Hana tự dựng và xuất bản -->

---

## Danh sách ảnh cần chụp (Dành cho bộ phận QA / Planning)

Dưới đây là danh sách tổng hợp 14 ảnh màn hình cần chụp bằng công cụ kiểm thử tự động để thay thế vào các vị trí đánh dấu phía trên:

|   Số   | Đường dẫn ảnh                                       | Trang & Trạng thái màn hình                                             | Khu vực cần khoanh hoặc làm nổi bật                                                                  |
| :----: | :-------------------------------------------------- | :---------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| **01** | `images/huong-dan/01-dang-nhap.png`                 | `<ĐỊA CHỈ DEMO>/admin` – Màn hình đăng nhập                             | Khung nhập Email, Mật khẩu và nút **Đăng nhập**                                                      |
| **02** | `images/huong-dan/02-doi-mat-khau.png`              | `<ĐỊA CHỈ DEMO>/admin/collections/users/[id]` – Hồ sơ cá nhân           | Ô nhập **Mật khẩu mới** và nút **Lưu**                                                               |
| **03** | `images/huong-dan/03-du-lieu-mau.png`               | `<ĐỊA CHỈ DEMO>/admin/collections/products` – Danh sách sản phẩm        | Cột tên sản phẩm có các tiền tố `[MẪU]`                                                              |
| **04** | `images/huong-dan/04-tao-san-pham-moi.png`          | `<ĐỊA CHỈ DEMO>/admin/collections/products` – Danh sách sản phẩm        | Nút **Tạo mới** ở góc trên bên phải                                                                  |
| **05** | `images/huong-dan/05-thong-tin-san-pham.png`        | `<ĐỊA CHỈ DEMO>/admin/collections/products/create` – Tạo sản phẩm       | Các trường **Tên sản phẩm**, **Đường dẫn**, **Trạng thái bán**, **Giá bán**                          |
| **06** | `images/huong-dan/06-cau-phan-goi-tu-dong-tinh.png` | `<ĐỊA CHỈ DEMO>/admin/collections/products/[growth-mirror-build]`       | Bảng **Cấu phần của gói**, ô **Tổng giá trị** và **Ưu đãi (%)** ở chế độ chỉ đọc                     |
| **07** | `images/huong-dan/07-danh-sach-trang.png`           | `<ĐỊA CHỈ DEMO>/admin/collections/pages` – Danh sách trang nội dung     | Cột tên trang và nút **Tạo mới** ở góc trên bên phải                                                 |
| **08** | `images/huong-dan/08-nut-chinh-sua-truc-quan.png`   | `<ĐỊA CHỈ DEMO>/admin/collections/pages/[id]` – Chi tiết trang đã lưu   | Cột bên phải, nút **🎨 Chỉnh sửa trực quan (Puck Editor)** màu xanh tím                              |
| **09** | `images/huong-dan/09-giao-dien-puck-editor.png`     | `<ĐỊA CHỈ DEMO>/builder/[id]` – Toàn cảnh trình dựng Puck               | Toàn màn hình 3 khu vực: sidebar trái (thư viện khối), canvas giữa, sidebar phải (bảng thuộc tính)   |
| **10** | `images/huong-dan/10-keo-khoi-va-sua-chu.png`       | `<ĐỊA CHỈ DEMO>/builder/[id]` – Đang sửa thuộc tính khối                | Khối đang được chọn trên canvas và các trường nhập nội dung ở bảng thuộc tính bên phải               |
| **11** | `images/huong-dan/11-xem-thu-3-man-hinh.png`        | `<ĐỊA CHỈ DEMO>/builder/[id]` – Thanh điều khiển phía trên              | 3 nút biểu tượng xem trước: **Điện thoại (375px)**, **Máy tính bảng (768px)**, **Máy tính (1440px)** |
| **12** | `images/huong-dan/12-luu-nhap-va-xuat-ban.png`      | `<ĐỊA CHỈ DEMO>/builder/[id]` – Thanh điều khiển phía trên              | Nhãn trạng thái (**Bản nháp** / **Đã xuất bản**), nút **Lưu nháp** và nút **Xuất bản**               |
| **13** | `images/huong-dan/13-thong-bao-loi.png`             | `<ĐỊA CHỈ DEMO>/admin/collections/pages/create` hoặc `/products/create` | Hộp thông báo lỗi đường dẫn không hợp lệ hoặc thiếu mô tả ảnh                                        |
| **14** | `images/huong-dan/14-trang-hoan-thanh.png`          | `<ĐỊA CHỈ DEMO>/trang-thu-nghiem` – Trang công khai trên web            | Toàn bộ trang web hiển thị đủ 5 khối giao diện đã dựng và xuất bản                                   |
