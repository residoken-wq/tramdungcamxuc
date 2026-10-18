# Hướng dẫn sử dụng hệ thống quản trị Trạm Dừng Cảm Xúc

> **Dành cho Hana Lương** · Phiên bản 1 (Cổng Giai đoạn 1)
> Tài liệu hướng dẫn thao tác toàn diện trên hệ thống quản trị website: tạo và quản lý sản phẩm, thu thập lead, chăm sóc khách hàng, quản trị trang pháp lý, cài đặt thanh toán ngân hàng và tự tay dựng trang bằng công cụ kéo thả trực quan mà không cần biết lập trình.

---

## Mục lục

1. [Đăng nhập và Bảo mật tài khoản](#1-đăng-nhập-và-bảo-mật-tài-khoản)
   - [1.3b. Trang chủ admin – Dashboard "Hôm nay"](#13b-trang-chủ-admin--dashboard-hôm-nay)
   - [1.4. Cấu trúc menu bên trái theo công việc của Hana](#14-cấu-trúc-menu-bên-trái-theo-công-việc-của-hana)
   - [1.5. Khách hàng đăng nhập thế nào](#15-khách-hàng-đăng-nhập-thế-nào)
   - [1.5b. Quyền tự quản lý nhận email nhắc của khách hàng (Nghị định 13/2023)](#15b-quyền-tự-quản-lý-nhận-email-nhắc-của-khách-hàng-nghị-định-132023)
   - [1.6. Khách hàng tự xem đơn hàng và link thanh toán tại /tai-khoan](#16-khách-hàng-tự-xem-đơn-hàng-và-link-thanh-toán-tại-tai-khoan)
   - [1.7. Khách hàng yêu cầu xóa tài khoản & Hana xóa dữ liệu khách](#17-khách-hàng-yêu-cầu-xóa-tài-khoản--hana-xóa-dữ-liệu-khách)
2. [Nhận biết và Làm việc với dữ liệu mẫu](#2-nhận-biết-và-làm-việc-với-dữ-liệu-mẫu)
3. [Quản lý Sản phẩm, Giá bán và Tài nguyên](#3-quản-lý-sản-phẩm-giá-bán-và-tài-nguyên)
   - [3.1. Tạo và chỉnh sửa sản phẩm: Giao diện 6 tab theo loại](#31-tạo-và-chỉnh-sửa-sản-phẩm-giao-diện-6-tab-theo-loại)
   - [3.1b. Tạo sản phẩm bằng trình hướng dẫn (5 bước)](#31b-tạo-sản-phẩm-bằng-trình-hướng-dẫn-5-bước)
   - [3.7. Xem trước trước khi xuất bản (Live Preview)](#37-xem-trước-trước-khi-xuất-bản-live-preview)
   - [3.8. Quản lý Lịch workshop và quyền tham gia (Workshops)](#38-quản-lý-lịch-workshop-và-quyền-tham-gia-workshops)
     - [3.8b. Lên lịch workshop bằng Trình hướng dẫn (3 bước)](#38b-lên-lịch-workshop-bằng-trình-hướng-dẫn-3-bước)
   - [3.9. Chương trình dùng thử 21 ngày cho công cụ số](#39-chương-trình-dùng-thử-21-ngày-cho-công-cụ-số)
   - [3.10. Quản lý Bài học và Video khóa học (Habit Hack)](#310-quản-lý-bài-học-và-video-khóa-học-habit-hack)
     - [3.10.1. Cách nhập video Bunny Stream cho bài học](#3101-cách-nhập-video-bunny-stream-cho-bài-học)
     - [3.10.2. Thêm bài học bằng Trình hướng dẫn (4 bước)](#3102-thêm-bài-học-bằng-trình-hướng-dẫn-4-bước)
   - [3.11. Theo dõi Kế hoạch Thói quen & Tracker 21 ngày](#311-theo-dõi-kế-hoạch-thói-quen--tracker-21-ngày)
   - [3.12. Quản lý và Thu hồi Chứng nhận 21 ngày (Certificates)](#312-quản-lý-và-thu-hồi-chứng-nhận-21-ngày-certificates)
   - [3.13. Quản lý 26 thẻ EQ Buddy](#313-quản-lý-26-thẻ-eq-buddy)
   - [3.14. In QR cho bộ thẻ EQ Buddy (EqCards)](#314-in-qr-cho-bộ-thẻ-eq-buddy-eqcards)
   - [3.15. Ảnh chia sẻ thẻ EQ Buddy và Liên kết Shopee bộ thẻ vật lý](#315-ảnh-chia-sẻ-thẻ-eq-buddy-và-liên-kết-shopee-bộ-thẻ-vật-lý)
   - [3.16. Trang giới thiệu bộ thẻ và Kích hoạt dùng thử EQ Buddy số](#316-trang-giới-thiệu-bộ-thẻ-và-kích-hoạt-dùng-thử-eq-buddy-số)
   - [3.17. Quản lý Thẻ đã lưu và Bảo mật suy ngẫm của khách hàng (SavedCards)](#317-quản-lý-thẻ-đã-lưu-và-bảo-mật-suy-ngẫm-của-khách-hàng-savedcards)
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

### 1.3b. Trang chủ admin – Dashboard "Hôm nay"

**Mục đích**: Ngay sau khi đăng nhập, Hana nhìn thấy ngay các công việc cần xử lý trong ngày, các phím tắt tạo nhanh và tài liệu hướng dẫn mà không cần phải tự đi tìm trong từng bảng dữ liệu.

![Trang chủ quản trị - Dashboard Hôm nay](images/huong-dan/02b-dashboard-hom-nay.png)
<!-- ẢNH 02b: trang <ĐỊA CHỈ DEMO>/admin, giao diện Dashboard Hôm nay với khu vực Việc cần làm, Tạo nhanh và Hướng dẫn sử dụng -->

#### 1. Khu vực "Việc cần làm hôm nay"

- **Ý nghĩa**: Tập hợp các đầu việc đang chờ bạn xử lý, hiển thị dạng các thẻ số to rõ ràng. Tuyệt đối không hiển thị thông tin cá nhân (như email, họ tên, số tiền) trên màn hình này để đảm bảo an toàn và bảo mật thông tin.
- **5 nhóm việc cần lưu tâm**:
  1. **Đơn chờ xác nhận**: Các đơn hàng khách đã đặt và đang chờ chuyển khoản hoặc chờ bạn duyệt thủ công. Bấm vào thẻ để mở danh sách các đơn đang ở trạng thái `pending`.
  2. **Giao dịch cần đối soát** _(chỉ tài khoản `owner` của Hana mới nhìn thấy)_: Cảnh báo khi có khách chuyển khoản sai số tiền hoặc chuyển tiền cho đơn đã bị hủy. Bấm vào thẻ để đối soát ngay nhật ký giao dịch SePay.
  3. **Khách tiềm năng mới**: Khách hàng để lại thông tin liên hệ từ trang chủ, form tư vấn hoặc đăng ký nhận tài nguyên. Bấm vào thẻ để mở danh sách lead mới cần chăm sóc.
  4. **Yêu cầu xóa tài khoản**: Khách hàng gửi yêu cầu xóa dữ liệu cá nhân theo quy định NĐ 13/2023. Bấm vào để vào hồ sơ khách và xử lý quy trình xóa an toàn.
  5. **Workshop trong 7 ngày tới**: Các buổi chia sẻ trực tuyến sắp diễn ra trong tuần, giúp bạn chuẩn bị tài liệu và phòng họp kịp thời.
- **Trạng thái "Không có việc nào – tuyệt!"**: Khi mọi đầu việc đã được giải quyết xong, hệ thống sẽ hiện thông báo chúc mừng nhẹ nhàng màu xanh mint dịu mát, giúp Hana yên tâm dành thời gian sáng tạo hoặc nghỉ ngơi.

#### 2. Khu vực "Tạo nhanh"

Các lối tắt màu hồng ấm áp giúp bạn thao tác ngay chỉ với 1 cú click:

- **Tạo sản phẩm**: Mở form tạo công cụ số, gói đồng hành hoặc tài nguyên mới.
- **Thiết kế trang**: Mở danh sách trang web và khởi chạy công cụ kéo thả trực quan Puck.
- **Thêm lời chia sẻ**: Lưu cảm nhận mới của học viên gửi về.
- **Lên lịch workshop**: Tạo buổi chia sẻ trực tuyến Zoom mới cho học viên.
- **Thêm bài học**: Bổ sung nội dung hoặc video bài học vào khóa học Habit Hack.

#### 3. Khu vực "Hướng dẫn sử dụng"

Các liên kết mở nhanh tới đúng tài liệu hướng dẫn chi tiết mà bạn đang xem:

- Hướng dẫn tạo và quản lý sản phẩm, gói đồng hành (Mục 3).
- Hướng dẫn dựng trang kéo thả trực quan Puck (Mục 5).
- Xử lý đơn hàng và đối soát thanh toán VietQR (Mục 1.6 & 7).
- Quản lý khách tiềm năng và xuất file CSV (Mục 8).
- Quy trình xóa tài khoản an toàn cho khách (Mục 1.7).

---

### 1.4. Cấu trúc menu bên trái theo công việc của Hana

**Mục đích**: Menu quản trị được thiết kế theo đúng luồng công việc tự nhiên hàng ngày của Hana, chia thành 6 nhóm mạch lạc, giúp Hana và cộng sự tìm kiếm thông tin nhanh chóng mà không bị rối mắt bởi các bảng dữ liệu kỹ thuật.

#### Bảng 6 nhóm menu chính

| Tên nhóm                | Mục đích công việc                                                                                             | Các mục hiển thị trong nhóm                                                                                                                                                                                                                                                                                                                                            | Ai nhìn thấy?      |
| :---------------------- | :------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------- |
| **Trang web**           | Quản lý các trang nội dung công khai, bài viết chia sẻ, cảm nhận của khách hàng, chân trang và cấu hình chung. | • **Trang** (`pages`): Dựng trang bằng Puck editor.<br>• **Bài viết** (`posts`): Blog và bài chia sẻ.<br>• **Lời chia sẻ** (`testimonials`): Đánh giá của học viên.<br>• **Trang pháp lý** (`legalPages`): Điều khoản, bảo mật.<br>• **Menu** (`navigation`): Menu đầu và chân trang.<br>• **Cài đặt website** (`siteSettings`): Ngân hàng VietQR, logo.               | `owner` + `editor` |
| **Sản phẩm & bán hàng** | Quản lý danh mục gói đồng hành, sách điện tử, dịch vụ coaching, đơn hàng và ưu đãi.                            | • **Sản phẩm** (`products`): Công cụ số, gói đồng hành, ebook.<br>• **Dịch vụ đồng hành** (`services`): Coaching 1:1, tư vấn.<br>• **Chương trình doanh nghiệp** (`programs`): Đào tạo B2B.<br>• **Đơn hàng** (`orders`): Theo dõi và xác nhận đơn chuyển khoản.<br>• **Mã giảm giá** (`discountCodes`): Ưu đãi cho chiến dịch.                                        | `owner` + `editor` |
| **Khóa Habit**          | Quản lý toàn bộ nội dung khóa học Habit Hack 1% Better và hoạt động tương tác.                                 | • **Nhóm bài học** (`courseModules`): 7 chặng học tập.<br>• **Bài học** (`lessons`): 20 bài học kèm video Bunny Stream.<br>• **Kỹ thuật** (`techniques`): 11 kỹ thuật can thiệp hành vi.<br>• **Câu hỏi quiz** (`diagnosticQuestions`): 16 tình huống trì hoãn.<br>• **Lịch workshop** (`workshops`): Lịch học Zoom và đường dẫn.                                      | `owner` + `editor` |
| **EQ Buddy**            | Quản lý bộ 26 thẻ nhận diện và điều hòa cảm xúc.                                                               | • **Thẻ EQ** (`eqCards`): 26 thẻ bài, thông điệp, câu chuyện, câu hỏi đào sâu và xuất mã QR in ấn.                                                                                                                                                                                                                                                                     | `owner` + `editor` |
| **Học viên & khách**    | Chăm sóc học viên, theo dõi quá trình rèn luyện và cấp chứng nhận hoàn thành.                                  | • **Khách hàng** (`customers`): Danh sách học viên và tài khoản.<br>• **Khách tiềm năng** (`leads`): Thu thập email từ form, xuất CSV.<br>• **Chứng nhận** (`certificates`): Chứng nhận 21 ngày hoàn thành.<br>• **Kế hoạch thói quen** (`habitPlans`): Kế hoạch Habit Loop 5 phút.                                                                                    | `owner` + `editor` |
| **Hệ thống**            | Khu vực kỹ thuật dành riêng cho Chủ dự án và IT: phân quyền, kiểm tra lỗi, đối soát thanh toán.                | • Quản trị viên, Quyền truy cập, Check-in, Tiến độ bài học, Kết quả quiz, Thẻ đã lưu, Sự kiện thanh toán, Nhật ký kiểm toán, Nhắc dùng thử, Nhắc workshop, Nhắc tracker, Mã OTP, Giới hạn tần suất, Lịch sử dùng thử (14 collections). _Thư viện ảnh và tài liệu_ nằm ở nhóm **Trang web**, _Tài liệu riêng tư_ ở nhóm **Sản phẩm & bán hàng** – editor vẫn dùng được. | **Chỉ `owner`**    |

#### Bảo vệ an toàn: Ẩn mục kỹ thuật với vai trò Biên tập (`editor`)

- Khi cộng sự hoặc trợ lý đăng nhập bằng tài khoản `editor`, nhóm **Hệ thống** sẽ **tự động ẩn hoàn toàn khỏi thanh menu bên trái**.
- **Lợi ích**:
  - Giao diện của cộng sự cực kỳ gọn gàng, chỉ tập trung vào việc viết bài, cập nhật bài học và chăm sóc học viên.
  - Ngăn ngừa tuyệt đối nguy cơ bấm nhầm làm thay đổi tài khoản ngân hàng, xóa dữ liệu nhật ký bảo mật hoặc can thiệp vào các tiến trình thanh toán tự động của hệ thống.
  - Hana (vai trò `owner`) vẫn xem được đầy đủ 6 nhóm để đối soát khi cần.

---

### 1.5. Khách hàng đăng nhập thế nào

**Mục đích**: Giúp Hana nắm rõ trải nghiệm của học viên và khách hàng khi truy cập vào hệ thống học tập hoặc tài khoản cá nhân (Hana không cần thao tác gì, hệ thống xử lý tự động 100%).

- **Đăng nhập không cần mật khẩu (Passwordless OTP)**: Khách hàng không cần nhớ mật khẩu. Khách chỉ cần vào trang `/tai-khoan/dang-nhap`, nhập địa chỉ email và đồng ý với Chính sách bảo mật.
- **Mã xác thực 6 chữ số qua Email**: Hệ thống tự động gửi một mã OTP gồm 6 chữ số tới hộp thư của khách, có hiệu lực trong 10 phút. Khách nhập mã này để vào tài khoản ngay lập tức.
- **Bảo mật và Tự động**: Mỗi mã chỉ dùng được 1 lần, nếu nhập sai quá 5 lần mã sẽ tự khóa để chống dò mã. Phiên đăng nhập được lưu an toàn trên trình duyệt của khách trong 30 ngày.
- **Thu hồi phiên khi đăng xuất hoặc đổi email**: Khi khách hàng bấm "Đăng xuất" tại `/tai-khoan`, hệ thống sẽ lập tức thu hồi phiên trên máy chủ và đăng xuất khách khỏi tất cả các thiết bị. Tương tự, nếu Hana chỉnh sửa lại địa chỉ email của khách hàng trong mục **Khách hàng** (`customers`), toàn bộ phiên đăng nhập gắn với email cũ trước đó sẽ tự động hết hạn ngay lập tức; khách hàng cần đăng nhập lại bằng địa chỉ email mới.
- **Không bị đè quyền giữa Quản trị và Khách hàng**: Hana và cộng sự có thể kiểm tra thử cả phiên tài khoản khách hàng (`/tai-khoan`) và đăng nhập trang quản trị (`/admin`) trên cùng một trình duyệt mà không bị đè quyền hay báo lỗi thiếu quyền khi vào `/admin`. Hệ thống luôn tự động ưu tiên nhận diện phiên quản trị viên khi truy cập trang admin.
- **Hồ sơ khách hàng trong CMS**: Hệ thống tự động tạo hồ sơ khách hàng mới trong mục **Khách hàng** (`customers`) ngay lần đăng nhập đầu tiên và tự động gắn đúng các đơn hàng, quyền học của họ. Khách hàng hoàn toàn không thể truy cập vào trang quản trị `/admin` của Hana.

---

### 1.5b. Quyền tự quản lý nhận email nhắc của khách hàng (Nghị định 13/2023)

**Mục đích**: Tôn trọng quyền rút lại sự đồng ý nhận thông báo nhắc nhở của khách hàng theo quy định bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP).

- **Khách hàng tự bật / tắt**:
  - **Qua link trong email**: Dưới chân các email nhắc lịch workshop 24 giờ và email nhắc lỡ nhịp thực hành 2 ngày đều có dòng chữ nhỏ _"Không nhận email nhắc nữa"_. Khách bấm vào sẽ mở trang xác nhận `/nhac-lich/huy?t=...` và bấm nút ngừng nhận mà không cần phải đăng nhập.
  - **Trong trang Tài khoản (`/tai-khoan`)**: Tại mục **Tùy chọn email thông báo**, khách có công tắc _"Nhận email nhắc lịch workshop và nhắc tập"_. Khách có thể chủ động bật hoặc tắt bất cứ lúc nào.
- **Trường "Không nhận email nhắc lịch / nhắc tập" (`reminderEmailsOptOut`) trong CMS**:
  - Khi xem chi tiết khách hàng trong mục **Khách hàng** (`customers`), Hana sẽ thấy ô kiểm này.
  - Nếu ô này được tích: hệ thống sẽ tự động bỏ qua, không gửi email nhắc workshop 24 giờ và email nhắc lỡ 2 ngày cho khách hàng này.
  - **Quy tắc quan trọng cho Hana**: **Hana tuyệt đối không tự ý bỏ tích để bật lại thay cho khách khi khách đã chủ động tắt**. Quyền nhận thông báo thuộc về sự đồng ý của khách hàng. Nếu khách muốn nhận lại, hãy hướng dẫn khách tự đăng nhập vào `/tai-khoan` để gạt công tắc bật lại.
  - **Email giao dịch không bị ảnh hưởng**: Khách tắt nhận email nhắc thì hệ thống vẫn gửi đầy đủ các email giao dịch bắt buộc như mã OTP đăng nhập, thư xác nhận thanh toán đơn hàng, link đặt lịch Coaching và tài liệu đã mua.

---

### 1.6. Khách hàng tự xem đơn hàng và link thanh toán tại `/tai-khoan`

**Mục đích**: Giúp khách hàng chủ động kiểm tra trạng thái đơn, tiếp tục thanh toán đơn chưa trả hoặc tải lại tài liệu mà Hana không cần phải tìm và gửi lại link thanh toán thủ công.

- **Khu vực "Đơn hàng của tôi" trên `/tai-khoan`**: Sau khi đăng nhập bằng email OTP, khách hàng chỉ cần vào trang cá nhân `/tai-khoan` để thấy ngay danh sách đơn hàng của mình (tối đa 20 đơn gần nhất).
- **Tự lấy link thanh toán**:
  - Với các đơn **Chờ thanh toán** (`pending`) hoặc **Quá hạn** (`failed`), hệ thống hiển thị nút **"Xem cách thanh toán"**.
  - Khách bấm vào sẽ được dẫn thẳng tới trang thanh toán `/thanh-toan/don/[payToken]` để quét mã VietQR.
  - **Hana không cần gửi lại link**: Khi khách nhắn hỏi lại link thanh toán, Hana chỉ cần hướng dẫn khách đăng nhập vào `/tai-khoan` là khách sẽ tự thấy link của mình.
- **Tải lại tài liệu đã mua**: Với đơn **Đã thanh toán** (`paid`) của sản phẩm có đính kèm file, khách có nút **"Tải lại"**.
  - Mỗi lần bấm, hệ thống tạo một link tải riêng cho đúng khách đó, **hết hạn sau 10 phút**. Hết hạn thì khách bấm "Tải lại" lần nữa để lấy link mới.
  - Link chỉ dùng được khi khách **đang đăng nhập đúng tài khoản đã mua**; người khác cầm link sẽ không tải được.
  - Khách báo không tải được: kiểm tra đơn ở trạng thái **Đã thanh toán** và sản phẩm vẫn còn file đính kèm trong mục **Tài liệu đính kèm**.
- **Bảo mật và an toàn**: Đơn đã hủy (`cancelled`) không lộ mã chuyển khoản hay thông tin nội bộ. Khách chỉ xem được đơn thuộc về chính tài khoản của mình.

---

### 1.7. Khách hàng yêu cầu xóa tài khoản & Hana xóa dữ liệu khách

**Mục đích**: Thực hiện quyền xóa dữ liệu cá nhân theo quy định bảo vệ dữ liệu (Nghị định 13/2023/NĐ-CP) khi khách hàng không còn nhu cầu sử dụng dịch vụ trên Trạm Dừng Cảm Xúc.

#### 1. Quy trình từ phía khách hàng

- Khách hàng đã đăng nhập có thể truy cập trang **Tài khoản của tôi** (`/tai-khoan`).
- Ở cuối trang có mục **Xóa tài khoản và dữ liệu cá nhân**. Khách bấm nút "Yêu cầu xóa tài khoản" và xác nhận.
- Khi gửi yêu cầu thành công, hệ thống ghi nhận thời điểm yêu cầu (`deletionRequestedAt`) và gửi email thông báo bảo mật tới địa chỉ quản trị của Hana với tiêu đề:
  `[TDCX] Yêu cầu xóa dữ liệu: Khách hàng #[ID] ([Thời điểm])`
  _(Tiêu đề email tuân thủ bảo mật, không để lộ email hay tên của khách ra ngoài)._

#### 2. Thao tác xóa dữ liệu của Hana trong CMS

1. Mở email thông báo hoặc vào mục **Khách hàng** (`customers`) trong CMS. Bạn sẽ thấy cột **Yêu cầu xóa lúc** hiển thị thời điểm khách gửi yêu cầu.
2. Bấm vào khách hàng cần xử lý để mở trang chi tiết (`/admin/collections/customers/[id]`).
3. Tại cột bên phải (Sidebar), tìm nút **Xóa dữ liệu khách** (chỉ hiển thị cho tài khoản Chủ sở hữu - `owner`).
4. **Lưu ý về đơn hàng chờ**:
   - Nếu khách hàng vẫn còn đơn hàng ở trạng thái **Chờ thanh toán** (`pending`), hệ thống sẽ hiện cảnh báo và **chặn thao tác xóa**. Hana cần vào mục Đơn hàng để hủy các đơn chờ này trước khi xóa dữ liệu khách.
   - Các đơn hàng ở trạng thái **Quá hạn** (`failed`) sẽ được hệ thống tự động chuyển sang **Đã hủy** (`cancelled`) và ghi nhận nhật ký trước khi ẩn danh.
5. Bấm nút và hệ thống sẽ mở ra hộp thoại xác nhận an toàn:
   - Hana cần **gõ lại chính xác địa chỉ email của khách hàng** vào ô xác nhận.
   - Nút **Xác nhận xóa vĩnh viễn** chỉ sáng lên khi email gõ vào trùng khớp 100% (giúp ngăn chặn hoàn toàn việc bấm nhầm).
6. Bấm **Xác nhận xóa vĩnh viễn**. Hệ thống sẽ thực hiện xóa toàn bộ dữ liệu trong một phiên giao dịch cơ sở dữ liệu duy nhất. Nếu có bất kỳ sự cố kỹ thuật nào xảy ra giữa chừng, toàn bộ thao tác sẽ được hoàn tác an toàn (rollback), không làm mất dữ liệu chắp vá.

#### 3. Quy định SLA thời hạn xử lý

- **Thời hạn xử lý kỹ thuật quy định**: Hana hoàn tất kiểm tra và bấm xác nhận xóa trong vòng **72 giờ** kể từ khi nhận được yêu cầu từ khách hàng.
- _(Lưu ý: Thời hạn này sẽ được Hana và luật sư/chuyên gia tư vấn xác nhận chính thức khi ban hành văn bản Chính sách bảo mật của Trạm)._

#### 4. Dữ liệu nào bị xóa và dữ liệu nào được giữ lại?

- **Dữ liệu bị xóa vĩnh viễn (0 bản ghi còn lại)**:
  - Tài khoản khách hàng (`customers`).
  - Toàn bộ kế hoạch và mục tiêu thói quen (`habitPlans`).
  - Toàn bộ lịch sử check-in cảm xúc hàng ngày (`habitCheckins`).
  - Toàn bộ thông báo nhắc nhở thói quen (`trackerNudges`).
  - Toàn bộ chứng nhận hoàn thành 21 ngày (`certificates`).
  - Toàn bộ quyền truy cập công cụ và khóa học (`entitlements`).
  - Toàn bộ lịch sử nhắc hạn dùng thử (`trialReminders`) và nhắc hẹn workshop (`workshopReminders`).
  - Toàn bộ tiến độ xem bài học (`lessonProgress`).
  - Toàn bộ thẻ suy ngẫm cảm xúc đã lưu (`savedCards`).
  - Toàn bộ mã xác thực OTP (`otpCodes`), kết quả trắc nghiệm (`diagnosticResults`), và thông tin khách tiềm năng (`leads`) có cùng email.
- **Dấu vết dùng thử ẩn danh (`trialUsage`)**:
  - Để ngăn chặn việc khách hàng xóa tài khoản rồi đăng ký lại để dùng thử công cụ số miễn phí lần thứ 2, hệ thống tự động lưu lại mã băm bảo mật (HMAC-SHA256) của email kèm sản phẩm đã dùng thử. Mã băm này là một chiều, không thể dịch ngược thành email thật, đảm bảo nguyên tắc bảo vệ quyền riêng tư.
- **Dữ liệu được giữ lại dưới dạng ẩn danh (Anonymized)**:
  - **Đơn hàng (`orders`)**: Để phục vụ đối soát tài chính, kiểm toán và quản lý doanh thu, các đơn hàng mua sản phẩm **không bị xóa mất**. Thay vào đó, hệ thống tự động **ẩn danh hóa**:
    - Ngắt liên kết với khách hàng (`customer = null`).
    - Ghi nhận thời điểm ẩn danh (`anonymizedAt`).
    - Xóa toàn bộ ghi chú riêng tư và nhu cầu cá nhân (`notes = null`, `customerNeed = null`).
    - Giữ nguyên số tiền, ngày thanh toán, mã đối soát ngân hàng (`paymentRef`) để phục vụ kiểm toán tài chính và đối soát doanh thu.
  - **Sự kiện thanh toán (`paymentEvents`)**: Giữ nguyên nguyên trạng vì đây là chứng từ giao dịch đối soát ngân hàng.
  - **Nhật ký hệ thống (`auditLogs`)**: Hệ thống tự động ghi lại một dòng nhật ký ẩn danh xác nhận Hana đã xóa dữ liệu khách hàng #[ID] kèm tổng số lượng bản ghi từng bảng đã xóa sạch, tuyệt đối không lưu lại tên hay email của khách.

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

### 3.1. Tạo và chỉnh sửa sản phẩm: Giao diện 6 tab theo loại

**Mục đích**: Giúp Hana dễ dàng tạo và quản lý toàn bộ rổ sản phẩm số, gói đồng hành, sách điện tử và dịch vụ với giao diện tab chuyên biệt, tự động ẩn đi các trường không liên quan theo từng loại sản phẩm.

#### 1. Cấu trúc 6 tab và Cột bên phải (Sidebar)

Biểu mẫu Sản phẩm được chia thành 6 thẻ (tabs) chuyên biệt cùng cột Sidebar cố định bên phải:

1. **Tab 1: Cơ bản**:
   - **Tên sản phẩm**: Tên hiển thị công khai trên website (tiêu đề trang chi tiết, thẻ sản phẩm).
   - **Đường dẫn (slug)**: Đường dẫn tĩnh trên URL website (chỉ dùng chữ thường không dấu, số và dấu gạch ngang, ví dụ: `habit-tracker-so`).
   - **Thứ tự**: Số nguyên xác định vị trí xuất hiện (số nhỏ hiển thị trước).
   - **Ảnh bìa**: Ảnh đại diện sản phẩm (tỉ lệ khuyến nghị 1:1 hoặc 4:3, hiển thị trên card, trang chi tiết và khi chia sẻ liên kết mạng xã hội).
   - **Chặng trải nghiệm**: Chọn chặng tương ứng trong hành trình cảm xúc (**Dừng lại** `pause`, **Cảm nhận** `feel`, **Gọi tên** `name`, **Lựa chọn** `choose`, **Rèn luyện** `practice`).
2. **Tab 2: Giá & bán**:
   - **Giá bán (VND)**: Giá niêm yết chuẩn của sản phẩm.
   - **Giá ưu đãi (VND)**: Mức giá khuyến mại thực tế khi áp dụng ưu đãi (ví dụ `178.000đ`).
   - **Hạn ưu đãi**: Ngày giờ kết thúc chương trình ưu đãi (nếu để trống, ưu đãi áp dụng cố định).
   - **Số ngày dùng thử**: Số ngày khách được trải nghiệm miễn phí trước khi quyết định mua (mặc định 21 ngày cho công cụ số).
   - **Thời hạn sử dụng (ngày)**: Số ngày khách được truy cập sau khi mua (để trống nghĩa là dùng trọn đời / vĩnh viễn).
3. **Tab 3: Nội dung trang**:
   - **Mô tả ngắn**: 1–2 câu tóm tắt nổi bật (hiển thị trên thẻ sản phẩm và bảng so sánh gói).
   - **Giới thiệu chi tiết**: Bài viết chi tiết, định dạng văn bản phong phú (tiêu đề, in đậm, danh sách) xuất hiện trên trang chi tiết sản phẩm.
   - **Khó khăn của khách**: Mô tả nỗi đau, điểm kẹt cảm xúc hoặc thói quen của khách hàng.
   - **Kết quả đạt được**: Giá trị chuyển hóa, kết quả tích cực mà khách nhận được sau khi sử dụng.
   - **Bao gồm những gì**: Danh sách các gạch đầu dòng những quyền lợi / thành phần đi kèm sản phẩm.
   - **Ảnh xem trước**: Ảnh chụp màn hình hoặc tài liệu xem trước cho khách tham khảo.
   - **Câu hỏi thường gặp (FAQ)**: Danh sách các câu hỏi và câu trả lời thắc mắc thường gặp.
   - **Sản phẩm liên quan**: Các sản phẩm khác gợi ý cho khách xem thêm ở chân trang chi tiết.
4. **Tab 4: Gói & quyền** _(chỉ hiển thị với loại Gói đồng hành)_:
   - **Cấu phần của gói**: Bảng danh sách các thành phần (Workshop, phiên Coaching 1:1, tư vấn hướng nghiệp, công cụ số, nhóm cộng đồng...). Mỗi cấu phần gồm tên, số lượng, đơn giá và sản phẩm cấp quyền tương ứng.
   - **Tổng giá trị (VND)**: Ô chỉ đọc, hệ thống **tự động tính** bằng tổng `Số lượng × Đơn giá` của tất cả các cấu phần.
   - **Ưu đãi (%)**: Ô chỉ đọc, hệ thống **tự động tính** theo công thức so sánh Tổng giá trị với Giá bán thực tế (ví dụ: `30%`, `50%`, `60%`).
5. **Tab 5: Tài liệu giao** _(chỉ hiển thị với Sách điện tử / Bộ tài nguyên)_:
   - **Tài liệu được giao**: Danh sách các tệp PDF/EPUB trong kho Tài liệu riêng tư. Hệ thống sẽ tự động tạo liên kết tải về an toàn và gửi qua email cho khách sau khi mua hoặc nhận quà.
6. **Tab 6: Liên kết ngoài** _(chỉ hiển thị khi dẫn sang sàn thương mại điện tử hoặc lịch hẹn)_:
   - **Liên kết của nút**: Địa chỉ web dẫn khách đến (ví dụ: link gian hàng Shopee `https://shopee.vn/...` hoặc link đặt lịch hẹn).
   - **Nhãn của nút**: Chữ hiển thị trên nút bấm (ví dụ: `Mua trên Shopee`, `Đặt lịch tư vấn`).
   - **Loại hành động của nút (CTA)**: Mua trực tiếp, Dẫn link ngoài, Đặt lịch hay Tải về.

_Cột Sidebar bên phải_:

- **Loại sản phẩm (`type`)**: Tiêu chí cốt lõi quyết định form sẽ bật/tắt các trường nào (xem bảng bên dưới).
- **Khu vực (`web`)**: Phân bổ hiển thị trên `site` (Trang chính), `habit` (Thói quen) hoặc `eq` (EQ Buddy).
- **Trạng thái bán (`saleStatus`)**: Chọn Đang bán (`on_sale`), Sắp ra mắt (`coming_soon`), Miễn phí (`free`), Cần tư vấn (`consult`), hoặc Ẩn (`hidden`).
- **Trạng thái xuất bản**: Lưu nháp (`draft`) hoặc Đã xuất bản (`published`).

---

#### 2. Bảng tra cứu: "Loại nào điền gì?"

Hệ thống đã tự động ẩn đi các ô không liên quan để Hana không bị rối mắt. Khi chọn **Loại sản phẩm** ở cột bên phải, các tab sẽ tự động thích ứng:

| Loại sản phẩm (`type`)                                                                                | Các tab & trường cần điền                                                                                                                                                                | Trường hệ thống tự động ẩn                                           |
| :---------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------- |
| **Công cụ số** (`digital_tool`)                                                                       | • Cơ bản (Tên, slug, ảnh bìa)<br>• Giá & bán (Giá niêm yết, giá ưu đãi, số ngày dùng thử 21 ngày, thời hạn sử dụng)<br>• Nội dung trang (Mô tả, Giới thiệu, Bao gồm, FAQ)                | Cấu phần gói đồng hành, Tài liệu tệp đính kèm, Liên kết Shopee ngoài |
| **Sách điện tử / Bộ tài nguyên** (`ebook`, `toolkit`)                                                 | • Cơ bản (Tên, slug, ảnh bìa)<br>• Giá & bán (Giá bán, hoặc 0đ nếu là quà tặng miễn phí)<br>• Tài liệu giao (chọn tệp PDF từ kho Tài liệu riêng tư)<br>• Nội dung trang (Mô tả, Bao gồm) | Số ngày dùng thử, Cấu phần gói, Liên kết Shopee ngoài                |
| **Gói đồng hành** (`package`)                                                                         | • Cơ bản (Tên, slug, ảnh bìa)<br>• Giá & bán (Giá bán của gói)<br>• Gói & quyền (Bảng cấu phần; xem Tổng giá trị và % ưu đãi tự tính)<br>• Nội dung trang (Giới thiệu, Bao gồm, FAQ)     | Số ngày dùng thử, Tài liệu giao đính kèm, Liên kết ngoài             |
| **Sản phẩm trên Shopee** (`physical_external`)                                                        | • Cơ bản (Tên, slug, ảnh bìa bộ thẻ)<br>• Liên kết ngoài (Dán link Shopee và nhập nhãn "Mua trên Shopee")                                                                                | Giá bán trên web, Số ngày dùng thử, Cấu phần gói, Tệp đính kèm       |
| **Phiên trải nghiệm / Workshop / Cộng đồng / B2B** (`coaching_trial`, `workshop`, `community`, `b2b`) | • Cơ bản (Tên, slug, ảnh bìa)<br>• Giá & bán (Giá vé/phí, hoặc để trống nếu tư vấn riêng)<br>• Nội dung trang & Liên kết đặt lịch hẹn nếu có                                             | Cấu phần gói đồng hành, Số ngày dùng thử                             |

---

#### 3. Quy tắc Lưu nháp và Kiểm tra an toàn khi Xuất bản

Để Hana an tâm soạn thảo mà không lo bị hệ thống chặn hay làm mất bài:

1. **Lưu nháp thoải mái (`draft`)**:
   - Khi đang ở chế độ Bản nháp, Hana có thể bấm **Lưu bản nháp** bất kỳ lúc nào, kể cả khi chưa kịp điền giá, chưa tải ảnh bìa hay chưa xong nội dung.
   - Bản nháp được lưu trữ an toàn trong hệ thống và hoàn toàn không hiển thị ra ngoài website cho khách.
2. **Kiểm tra an toàn khi bấm Xuất bản (`published`) + Đang bán (`on_sale`)**:
   - Khi bạn chọn Trạng thái bán là **Đang bán** và bấm **Xuất bản**, hệ thống sẽ kích hoạt bộ kiểm tra an toàn tự động để bảo vệ trải nghiệm khách hàng:
     - **Giá bán**: Bắt buộc phải nhập số tiền cụ thể (trừ sản phẩm Shopee mua ngoài sàn).
     - **Ảnh bìa**: Bắt buộc phải chọn ảnh đại diện để giao diện ngoài web không bị vỡ bố cục.
     - **Đường dẫn (slug)**: Bắt buộc phải có slug hợp lệ để khách có thể truy cập trang.
   - Nếu thiếu bất kỳ thông tin nào trong 3 mục trên, hệ thống sẽ **từ chối xuất bản** và hiển thị thông báo lỗi tiếng Việt rõ ràng, chỉ đích danh tab và trường cần bổ sung.
   - Với các trạng thái bán khác như _Sắp ra mắt_, _Miễn phí_, _Cần tư vấn_ hoặc _Ẩn_, hệ thống cho phép xuất bản linh hoạt theo tính chất sản phẩm.

---

### 3.1b. Tạo sản phẩm bằng trình hướng dẫn (5 bước)

**Mục đích**: Giúp Hana và cộng sự tạo sản phẩm mới nhanh chóng, trực quan và không bị quá tải. Thay vì phải đối mặt với hàng chục ô nhập liệu cùng lúc, trình hướng dẫn dẫn dắt bạn qua 5 bước tuần tự, tự động điền sẵn các thiết lập tối ưu theo từng loại sản phẩm và cho phép xem trước diện mạo thực tế trước khi lưu.

#### 1. Lối tắt vào Trình hướng dẫn Tạo sản phẩm

Hana có thể mở trình hướng dẫn bằng một trong hai cách:

- **Cách 1**: Từ trang chủ admin (Dashboard "Hôm nay"), tại mục _Tạo nhanh_, bấm vào thẻ màu hồng **Tạo sản phẩm**.
- **Cách 2**: Trong menu bên trái, vào **Sản phẩm & bán hàng** -> **Sản phẩm**, bấm vào nút **+ Tạo sản phẩm (từng bước)** đặt nổi bật phía trên danh sách sản phẩm.
- Địa chỉ truy cập trực tiếp: `<ĐỊA CHỈ DEMO>/admin/tao-san-pham`.

#### 2. Chi tiết 5 bước tạo sản phẩm

##### Bước 1: Chọn loại sản phẩm

- Hệ thống hiển thị 9 thẻ sản phẩm tương ứng với 9 mô hình bán hàng của Trạm Dừng Cảm Xúc:
  1. **Công cụ số** (`digital_tool`): Habit Tracker số, EQ Buddy số. Tự động gắn quyền dùng thử 21 ngày, thuộc phân hệ Habit/EQ.
  2. **Sách điện tử** (`ebook`): Ebook "Tập thương cảm xúc". Tự động thiết lập nút tải về và liên kết tệp PDF an toàn.
  3. **Bộ tài nguyên** (`toolkit`): Bộ biểu mẫu, bài tập rèn luyện cảm xúc tải về.
  4. **Gói đồng hành** (`package`): Gói CLEAR, BUILD, SHINE. Mở trình quản lý cấu phần và tự động tính tổng giá trị.
  5. **Thẻ vật lý Shopee** (`physical_external`): Bộ thẻ in ấn bán qua sàn Shopee.
  6. **Workshop** (`workshop`): Buổi học Zoom "Tập thương cảm xúc".
  7. **Coaching trải nghiệm** (`coaching_trial`): Phiên trải nghiệm Growth Mirror 149.000đ.
  8. **Nhóm cộng đồng** (`community`): Cộng đồng rèn luyện cảm xúc private.
  9. **Doanh nghiệp B2B** (`b2b`): Chương trình đào tạo và khai vấn doanh nghiệp.
- Bấm chọn loại sản phẩm bạn muốn tạo, thẻ được chọn sẽ sáng viền màu tím nhung (`deep-navy`) và hồng điểm nhấn. Bấm **Tiếp tục**.

##### Bước 2: Thông tin cơ bản

- **Tên sản phẩm**: Nhập tên tiếng Việt có dấu (ví dụ: `Habit Tracker 21 ngày`).
- **Đường dẫn (slug)**: Hệ thống **tự động sinh** từ tên sản phẩm theo chuẩn chữ thường không dấu (ví dụ: `habit-tracker-21-ngay`). Bạn có thể sửa thủ công hoặc bấm nút **Tạo lại slug** kế bên.
- **Khu vực web**: Chọn phân hệ hiển thị (`Trang chính`, `Habit Formation` hoặc `EQ Buddy`).
- **Chặng trải nghiệm**: Gắn sản phẩm với 1 trong 5 chặng hành trình: _Dừng lại_, _Cảm nhận_, _Gọi tên_, _Lựa chọn_, _Rèn luyện_.
- **Mô tả ngắn**: 1–2 câu tóm tắt điểm nổi bật của sản phẩm.
- **Ảnh bìa**: Bấm **Chọn ảnh từ thư viện** để chọn ảnh đã có hoặc tải ảnh mới lên. Bắt buộc nhập **Văn bản thay thế (alt)** để bảo đảm khả năng tiếp cận và chuẩn SEO.

##### Bước 3: Thiết lập giá và cách bán

- Giao diện bước 3 tự động biến đổi thông minh theo loại sản phẩm đã chọn ở Bước 1 (dựa trên helper điều kiện `showFor`):
  - **Với Công cụ số & Khóa học**: Hiển thị ô nhập Giá niêm yết, Giá ưu đãi (ví dụ `178.000đ`), Hạn ưu đãi, Số ngày dùng thử (mặc định 21 ngày), và Thời hạn sử dụng (để trống là vĩnh viễn).
  - **Với Gói đồng hành (Growth Mirror)**:
    - Nhập Giá bán của gói.
    - Bấm nút **+ Thêm cấu phần** để bổ sung các thành phần: nhập Tên cấu phần (ví dụ `Coaching 1:1`), Số lượng, Đơn giá, và chọn Sản phẩm cấp quyền tương ứng.
    - Hệ thống **tự động tính trực tiếp**:
      - **Tổng giá trị thực tế của gói**: Tổng thành tiền của tất cả cấu phần.
      - **Mức ưu đãi dành cho khách**: Tỷ lệ tiết kiệm (ví dụ: `30%`, `50%`, `60%`).
  - **Với Sản phẩm Shopee**: Ẩn ô giá web, chỉ hiển thị ô nhập Đường dẫn Shopee và Nhãn nút bấm.
  - **Với Ebook / Quà tặng miễn phí**: Giá bán mặc định 0đ và nút hành động chuyển sang "Tải về".

##### Bước 4: Nội dung giới thiệu

- **Bao gồm những gì**: Bấm **+ Thêm mục** để gạch đầu dòng các quyền lợi khách sẽ nhận được (ví dụ: `Bảng theo dõi 21 ngày kèm 10 cảm xúc`, `Hướng dẫn sử dụng chi tiết`).
- **Khó khăn của khách**: Mô tả ngắn gọn vấn đề hoặc điểm kẹt mà khách đang gặp phải.
- **Kết quả đạt được**: Mô tả giá trị chuyển hóa sau khi hoàn thành.
- **Câu hỏi thường gặp (FAQ)**: Bấm **+ Thêm câu hỏi** để bổ sung các cặp Câu hỏi & Câu trả lời giải đáp băn khoăn cho khách.

##### Bước 5: Xem trước và lưu sản phẩm

- **Bộ chọn kích thước xem trước**: Bấm vào các biểu tượng trên thanh công cụ để kiểm tra giao diện hiển thị:
  - **Điện thoại** (375px)
  - **Máy tính bảng** (768px)
  - **Máy tính** (1440px)
- Khung xem trước hiển thị trực tiếp trang chi tiết sản phẩm với đúng phong cách thương hiệu Trạm Dừng Cảm Xúc.
- **Lựa chọn lưu sản phẩm**:
  - **Lưu nháp (Khuyên dùng)**: Lưu sản phẩm ở trạng thái nháp an toàn (`draft`), chưa hiển thị ra ngoài website. Phù hợp khi bạn muốn xem lại sau hoặc tiếp tục bổ sung nội dung.
  - **Xuất bản**: Xuất bản sản phẩm trực tiếp lên website (`published`). Hệ thống sẽ tự động kiểm tra an toàn (bắt buộc có giá và ảnh bìa nếu đang mở bán).
- Sau khi bấm Lưu, hệ thống sẽ tự động chuyển hướng về form quản lý chuẩn của bản ghi tại `/admin/collections/products/[id]`, sẵn sàng cho các tinh chỉnh nâng cao nếu cần.

#### 3. Các tính năng bảo vệ an toàn cho Hana trong trình hướng dẫn

1. **Tự động lưu nháp vào trình duyệt (`localStorage`)**:
   - Khi bạn đang nhập dở mà vô tình tải lại trang (`F5`) hoặc máy tính mất điện, dữ liệu đã nhập ở các bước sẽ tự động khôi phục nguyên vẹn.
   - Khi đã lưu thành công lên hệ thống, bản nháp tạm này sẽ tự động được dọn sạch.
   - Bạn cũng có thể bấm nút **Xóa bản nháp trên máy này** ở góc dưới để bắt đầu nhập lại từ đầu.
2. **Cảnh báo rời trang khi chưa lưu**:
   - Nếu bạn bấm nút quay lại trình duyệt hoặc đóng tab khi đang nhập dở, trình duyệt sẽ hiện hộp thoại nhắc nhở để tránh mất công sức nhập liệu.
3. **Giữ nguyên dữ liệu khi lùi bước**:
   - Bạn có thể bấm nút **Quay lại** ở bất kỳ bước nào để chỉnh sửa thông tin ở bước trước mà không làm mất các dữ liệu đã nhập ở bước sau.

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

1. Ở cột menu bên trái, tìm nhóm **Sản phẩm & bán hàng**, bấm vào **Tài liệu riêng tư**.
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

### 3.7. Xem trước trước khi xuất bản (Live Preview)

**Mục đích**: Nhìn thấy ngay trang hiển thị thực tế khi đang soạn thảo nội dung (sản phẩm, bài học, thẻ EQ, lời chia sẻ, trang pháp lý, workshop, dịch vụ, chương trình, bài viết hoặc cài đặt website) trước khi xuất bản mà không cần chuyển qua lại giữa nhiều tab.

#### Bảng ánh xạ: Nội dung sửa trong CMS → Trang xem trước ngoài website

Hệ thống tự động nhận biết loại nội dung bạn đang mở và dẫn khung xem trước đến đúng trang tương ứng:

| Bảng nội dung (Collection)                 | Điều kiện phân loại                                     | Trang xem trước hiển thị      | Nội dung hiển thị trong khung xem trước                                                               |
| :----------------------------------------- | :------------------------------------------------------ | :---------------------------- | :---------------------------------------------------------------------------------------------------- |
| **Sản phẩm** (`products`)                  | Công cụ số Thói quen (`digital_tool` thuộc web `habit`) | `/habit/1-percent-better`     | Trang giới thiệu công cụ số 1% Better, bảng chẩn đoán và ưu đãi.                                      |
| **Sản phẩm** (`products`)                  | Sách điện tử hoặc Bộ tài nguyên (`ebook`, `toolkit`)    | `/tai-nguyen/[slug]`          | Trang chi tiết tài nguyên, ảnh bìa, tóm tắt và form nhận tài liệu.                                    |
| **Sản phẩm** (`products`)                  | Gói đồng hành (`package`)                               | `/coaching/growth-mirror`     | Trang 3 gói Growth Mirror, tự động hiển thị bảng giá và cấu phần.                                     |
| **Sản phẩm** (`products`)                  | Còn lại (Shopee, Workshop, Phiên trải nghiệm, B2B...)   | `/xem-truoc/san-pham/[id]`    | Tuyến xem trước riêng hiển thị thẻ sản phẩm (`ProductCard`) chuẩn nhận diện và bảng giá (`PriceTag`). |
| **Bài học** (`lessons`)                    | Tất cả bài học khóa Habit                               | `/habit/hoc/[id]`             | Trang học tập, video bài giảng, tóm tắt và tài liệu thực hành.                                        |
| **Thẻ EQ Buddy** (`eqCards`)               | Tất cả 26 thẻ EQ                                        | `/eq-buddy/the/[qrSlug]`      | Giao diện mở từ mã QR: từ khóa mặt trước, thông điệp, 3 câu hỏi suy ngẫm mặt sau.                     |
| **Lời chia sẻ** (`testimonials`)           | Cảm nhận khách hàng                                     | `/xem-truoc/loi-chia-se/[id]` | Tuyến xem trước riêng hiển thị thẻ cảm nhận (`TestimonialCard`) với avatar và vai trò.                |
| **Trang pháp lý** (`legalPages`)           | Điều khoản, bảo mật, quy chế...                         | `/[slug]`                     | Trang điều khoản hoặc chính sách hoàn chỉnh trên website.                                             |
| **Lịch workshop** (`workshops`)            | Buổi học trực tuyến                                     | `/xem-truoc/workshop/[id]`    | Tuyến xem trước riêng hiển thị thẻ workshop, thời gian bắt đầu/kết thúc và gói áp dụng.               |
| **Dịch vụ đồng hành** (`services`)         | Gói coaching 1:1                                        | `/coaching/[slug]`            | Trang chi tiết dịch vụ coaching và nút đặt lịch.                                                      |
| **Chương trình doanh nghiệp** (`programs`) | Đào tạo B2B                                             | `/doanh-nghiep/[slug]`        | Trang chi tiết chương trình đào tạo doanh nghiệp.                                                     |
| **Bài viết & Video** (`posts`)             | Blog, bài chia sẻ                                       | `/blog/[slug]`                | Trang bài viết blog chi tiết.                                                                         |
| **Cài đặt Website** (`siteSettings`)       | Cài đặt chung toàn trang                                | `/` (Trang chủ)               | Trang chủ website, xem trước thay đổi thông tin liên hệ, thương hiệu, mạng xã hội.                    |
| **Menu điều hướng** (`navigation`)         | Menu chính & Menu chân trang                            | `/` (Trang chủ)               | Trang chủ website, xem trước sự thay đổi của thanh menu trên cùng và footer dưới cùng.                |

#### Ba kích thước xem trước chuẩn Brand Book 2026

Ở thanh trên cùng của khung xem trước, bạn có thể chuyển đổi nhanh giữa 3 kích thước chuẩn:

- 📱 **Điện thoại di động (Mobile - 375px)**: Kiểm tra khả năng hiển thị trên màn hình nhỏ (iPhone / Android).
- 📱 **Máy tính bảng (Tablet - 768px)**: Kiểm tra bố cục trên iPad và máy tính bảng xoay dọc.
- 💻 **Máy tính để bàn (Desktop - 1440px)**: Màn hình rộng tiêu chuẩn trên laptop và máy tính bàn.

#### Các bước thực hiện:

1. Mở bất kỳ bản ghi nào trong các bảng nêu trên (ví dụ: mở một sản phẩm hoặc một thẻ EQ).
2. Bấm nút **Xem trước** ở góc trên form (hoặc biểu tượng mắt xem trước).
3. **Nếu là bản ghi mới tạo**: Nhập các thông tin cơ bản bắt buộc (như Tên và Đường dẫn slug) rồi bấm **Lưu nháp** một lần để hệ thống sinh đường dẫn xem trước. Nếu chưa lưu nháp lần đầu, hệ thống sẽ hiện thông báo nhẹ nhàng: _"Lưu nháp để xem trước"_.
4. **Sửa nội dung trực tiếp**: Khi bạn gõ từng ký tự vào ô tên, tiêu đề, từ khóa, mô tả... khung xem trước bên cạnh sẽ **cập nhật ngay lập tức theo thời gian thực** mà bạn chưa cần bấm Lưu.
5. Khi hoàn toàn ưng ý với giao diện:
   - Bấm **Lưu nháp** nếu muốn tiếp tục hoàn thiện sau.
   - Bấm **Xuất bản** khi muốn đưa nội dung mới ra website công khai cho độc giả.

> **Bảo mật và an toàn dữ liệu tuyệt đối (`// REVIEW-REQUIRED:`)**:
>
> - Khung xem trước chỉ hiển thị bản nháp khi bạn **đã đăng nhập tài khoản quản trị** (`owner` hoặc `editor`).
> - Khách vãng lai và học viên dù có bấm vào link xem trước hoặc thêm `?preview=1` thì hệ thống vẫn **chỉ hiển thị bản đã xuất bản**, tuyệt đối không xem được bản nháp.
> - Các tuyến xem trước riêng (`/xem-truoc/*`) sẽ tự động trả về lỗi **404 (Không tìm thấy trang)** đối với khách vãng lai và học viên, đảm bảo không rò rỉ thông tin sản phẩm hay lời chia sẻ nội bộ.
> - Khi quản trị viên xem trước bài học trả phí, hệ thống **không cấp quyền xem video cho khách** và **không ghi nhận tiến độ học tập**, giữ nguyên vẹn tính toàn vẹn của dữ liệu học viên.
> - Khi quản trị viên xem trước trang mở từ mã QR của thẻ EQ (`/eq-buddy/the/[qrSlug]`), hệ thống **tự động vô hiệu hóa bộ đếm lượt quét QR** để không làm sai lệch số liệu thống kê thực tế từ người dùng.

![Xem trước khi sửa dịch vụ, chương trình và bài viết](images/huong-dan/27-xem-truoc-dich-vu.png)
<!-- ẢNH 27: Form sửa dịch vụ với Xem trước đang mở, tiêu đề chưa lưu hiện trong iframe và bộ chọn ba kích thước. -->

---

### 3.8. Quản lý Lịch workshop và quyền tham gia (Workshops)

**Mục đích**: Lên lịch các buổi workshop tương tác trực tuyến (ví dụ: workshop "Tập thương cảm xúc" thuộc các gói Growth Mirror), chọn các sản phẩm/gói được tham gia, và nhập liên kết phòng học trực tuyến (Zoom, Google Meet...).

**Các bước thực hiện**:

1. Ở menu bên trái, tìm nhóm **Khóa Habit**, bấm chọn **Lịch workshop**.
2. Bấm nút **Tạo mới** (ở góc trên bên phải).
3. Điền các trường thông tin:
   - **Tên workshop**: Tiêu đề buổi workshop (ví dụ: _Workshop "Tập thương cảm xúc" – Buổi 1_).
   - **Sản phẩm workshop**: (Tùy chọn) Chọn sản phẩm tương ứng nếu workshop được bán lẻ.
   - **Bắt đầu**: Chọn ngày và giờ bắt đầu buổi học (theo giờ Việt Nam).
   - **Kết thúc**: Chọn ngày và giờ kết thúc buổi học.
   - **Liên kết tham gia**: Nhập đường link phòng họp trực tuyến (Zoom, Google Meet...).
   - **Sản phẩm được tham gia**: Chọn các gói đồng hành hoặc sản phẩm mà học viên đã mua sẽ được quyền tham gia (ví dụ: các gói Growth Mirror CLEAR, BUILD, SHINE).
4. Bấm **Xuất bản** để kích hoạt lịch workshop trên hệ thống.

**Quy tắc bảo vệ liên kết phòng học & nhắc lịch tự động**:

- **Ai được thấy lịch workshop**: Chỉ những khách hàng đã có đơn hàng thanh toán thành công (`Đã thanh toán`) chứa ít nhất một sản phẩm nằm trong danh sách `Sản phẩm được tham gia` mới nhìn thấy buổi workshop đó trong mục **"Lịch workshop của tôi"** tại trang `/tai-khoan`.
- **Khi nào link phòng học mở**: Để bảo mật phòng học, nút **"Vào phòng"** chứa liên kết tham gia **chỉ hiển thị trong khoảng 60 phút trước giờ bắt đầu đến hết giờ kết thúc**. Ngoài khoảng thời gian này, học viên chỉ thấy thông báo: _"Link sẽ mở 60 phút trước giờ học"_.
- **Email nhắc tự động trước 24 giờ**: Hệ thống tự động quét và gửi email nhắc lịch cho học viên đủ điều kiện trước 24 giờ. Email dẫn về trang tài khoản để lấy link phòng học chứ không gửi trực tiếp qua email để đảm bảo bảo mật.

---

### 3.8b. Lên lịch workshop bằng Trình hướng dẫn (3 bước)

**Mục đích**: Giúp Hana lên lịch các buổi workshop Zoom/Google Meet đồng hành cùng học viên một cách nhanh chóng và an toàn tuyệt đối: không lo nhầm lẫn múi giờ, chọn đúng gói học viên được tham gia, và xem trước giao diện email nhắc nhở 24 giờ mà không gửi email thật.

#### 1. Cách mở Trình hướng dẫn lên lịch workshop

Bạn có thể mở trình hướng dẫn bằng 3 cách rất thuận tiện:

- **Từ trang chủ Dashboard "Hôm nay"**: Tại ô phím tắt nhanh, bấm vào **"Lên lịch workshop"**.
- **Từ bảng danh sách Lịch workshop**: Vào menu **Khóa Habit** -> chọn **Lịch workshop**, bạn sẽ nhìn thấy banner màu tím nổi bật ở ngay đầu trang -> bấm nút **+ Lên lịch workshop (từng bước)**.
- **Nhập trực tiếp đường dẫn**: Truy cập thẳng vào `/admin/len-lich-workshop`.

#### 2. Các bước thiết lập chi tiết

##### Bước 1: Đối tượng tham gia

- **Tên buổi workshop**: Nhập tiêu đề buổi học (ví dụ: `Workshop "Tập thương cảm xúc" – Kỳ 1`).
- **Chọn sản phẩm được tham gia**: Tích chọn các gói đồng hành (CLEAR, BUILD, SHINE) hoặc sản phẩm workshop bán lẻ mà học viên đã mua sẽ được quyền vào phòng.
  - Có sẵn nút **Chọn tất cả** hoặc **Bỏ chọn** để thao tác nhanh chỉ với 1 cú nhấp chuột.
  - Thẻ sản phẩm hiển thị nhãn phân loại rõ ràng (`Gói đồng hành` hoặc `Workshop`).
- Bấm **Tiếp tục**.

##### Bước 2: Thời gian và địa điểm

- **Ngày và Giờ bắt đầu (theo giờ Việt Nam)**: Chọn ngày diễn ra và giờ bắt đầu bình thường theo múi giờ sinh hoạt tại Việt Nam (ICT, UTC+7).
- **Hệ thống tự động quy đổi múi giờ chuẩn quốc tế (UTC)**:
  - Ngay khi bạn chọn giờ, hệ thống sẽ tính toán và hiển thị chuỗi thời gian quốc tế tương đương.
  - **Xử lý thông minh rạng sáng 0h–7h**: Nếu bạn lên lịch vào khung giờ rạng sáng (ví dụ: 02:00 sáng ngày 25/10 tại Việt Nam), hệ thống sẽ tự động hiểu và lưu chính xác là 19:00 ngày 24/10 theo giờ quốc tế (UTC), tránh hoàn toàn lỗi lệch ngày khi gửi email nhắc nhở.
- **Liên kết tham gia**: Dán đường link phòng họp trực tuyến (Google Meet hoặc Zoom, ví dụ: `https://meet.google.com/abc-defg-hij`). Hệ thống sẽ kiểm tra định dạng đường link ngay khi bạn nhập.
- Bấm **Tiếp tục**.

##### Bước 3: Xem trước thông báo và lưu

- **Khung xem trước email nhắc nhở 24 giờ**:
  - Hệ thống sử dụng chính mẫu email thật của Trạm Dừng Cảm Xúc để hiển thị bản xem trước sinh động với tên workshop, ngày giờ Việt Nam chuẩn xác và nút truy cập tài khoản học viên.
  - Bạn có thể chuyển đổi giữa chế độ **Điện thoại** (375px) và **Máy tính** (100%) để kiểm tra độ hiển thị đẹp mắt.
  - **An toàn tuyệt đối**: Bước này chỉ nhằm mục đích giúp bạn duyệt trước nội dung, hệ thống **hoàn toàn KHÔNG gửi email thật** ra ngoài.
- **Lưu lịch workshop**:
  - **Lưu nháp (Mặc định)**: Lưu lịch ở trạng thái nháp an toàn (`draft`) để chuẩn bị trước.
  - **Xuất bản**: Mở lịch chính thức trên hệ thống (`published`) để học viên thấy trong trang tài khoản `/tai-khoan`.
- Sau khi bấm Lưu, hệ thống sẽ tự động chuyển hướng về form chuẩn tại `/admin/collections/workshops/[id]`.

#### 3. Tính năng an toàn cho Hana

- **Tự động lưu nháp vào máy**: Nếu bạn lỡ tay đóng tab hay mất điện, dữ liệu đang nhập sẽ tự động khôi phục khi bạn quay lại.
- **Cảnh báo rời trang**: Trình duyệt sẽ hỏi xác nhận nếu bạn rời đi khi chưa lưu.
- **Lùi bước linh hoạt**: Bạn có thể bấm **Quay lại** bất kỳ lúc nào để chỉnh sửa mà không bị mất dữ liệu ở các bước khác.

---

### 3.9. Chương trình dùng thử 21 ngày cho công cụ số

**Mục đích**: Cho phép độc giả trải nghiệm trọn vẹn công cụ số (Habit Tracker số và EQ Buddy số) trong 21 ngày miễn phí trước khi quyết định mua sở hữu trọn đời.

**Quy trình vận hành tự động của hệ thống**:

1. **Kích hoạt dùng thử trên thẻ sản phẩm**:
   - Khi sản phẩm có **Loại sản phẩm** là `Công cụ số`, **Trạng thái bán** là `Đang bán` (`on_sale`), và ô **Số ngày dùng thử** có giá trị `21`:
   - Website tự động hiển thị nút bấm **"Bắt đầu dùng thử 21 ngày"** dẫn khách hàng đến trang giới thiệu `/dung-thu?san-pham=<slug>`.
   - Khách hàng đăng nhập bằng mã OTP gửi qua email và bấm xác nhận kích hoạt dùng thử. Hệ thống tự động gửi email chào mừng và chuyển hướng ngay vào công cụ.
2. **Tự động đổi nút kêu gọi (CTA) tại kết quả Quiz chẩn đoán**:
   - Khi bài test chẩn đoán thói quen kết thúc, nếu sản phẩm Habit Tracker số đang mở chương trình dùng thử, nút kêu gọi hành động sẽ tự động dẫn thẳng đến trang dùng thử Habit Tracker số thay vì gói Growth Mirror.
3. **Banner đếm ngược trong công cụ**:
   - Khách hàng đang trong thời gian dùng thử khi truy cập trang thói quen sẽ nhìn thấy thanh thông báo nhẹ nhàng ở đầu trang: _"Còn {n} ngày dùng thử"_ kèm nút _"Mua để dùng tiếp"_.
   - Hết 21 ngày, thanh thông báo sẽ chuyển sang: _"Thời gian dùng thử đã kết thúc – dữ liệu của bạn vẫn được giữ"_.
4. **Email nhắc hạn tự động (Mốc ngày 18 và ngày 21)**:
   - Hệ thống quét tự động mỗi giờ:
     - **Ngày 18 (còn 3 ngày)**: Gửi email nhắc nhở kèm mức giá ưu đãi sở hữu trọn đời.
     - **Ngày 21 (ngày cuối cùng)**: Gửi email thông báo ngày trải nghiệm cuối và hướng dẫn nâng cấp.
   - **Mức giá ưu đãi trong email hoàn toàn tự động**: Hệ thống đọc trực tiếp từ ô **Giá bán** và **Giá ưu đãi** của sản phẩm trong CMS. Hana có thể đổi giá bất kỳ lúc nào mà không cần sửa code.
   - Nếu khách hàng đã thanh toán mua sản phẩm (`active`), hệ thống tự động ngừng gửi email nhắc.

**Cách Hana bật, tắt hoặc điều chỉnh**:

- **Tắt chương trình dùng thử**: Xóa ô **Số ngày dùng thử** (hoặc đặt về `0`). Toàn bộ nút dùng thử trên website và Quiz CTA sẽ tự động chuyển về luồng mua hàng thông thường.
- **Thay đổi giá bán ưu đãi**: Chỉnh sửa ô **Giá bán** (ví dụ `250000`) và **Giá ưu đãi** (ví dụ `178000`). Toàn bộ website và email nhắc sẽ tự động cập nhật ngay lập tức.

### 3.10. Quản lý Bài học và Video khóa học (Habit Hack)

**Mục đích**: Đăng tải và sắp xếp các bài học, lộ trình video thực hành thói quen trên trang Góc học tập `/habit/hoc`.

**Các bước thực hiện**:

1. **Quản lý Nhóm bài học (`courseModules`)**:
   - Ở cột menu bên trái, tìm nhóm **Khóa Habit**, bấm vào **Nhóm bài học**.
   - Bấm **Tạo mới** hoặc bấm vào nhóm có sẵn để sửa.
   - Nhập **Tên nhóm bài học** (ví dụ: _Giai đoạn 1: Hiểu mình & Điểm nghẽn_).
   - Chọn **Nhóm nội dung**: chọn 1 trong 3 nhóm chuẩn gồm _Hiểu mình_ (`insight`), _Nguyên tắc_ (`principle`), hoặc _Kỹ thuật_ (`technique`). Lộ trình trên website sẽ tự động gom các bài học theo thứ tự 3 nhóm này.
   - Nhập **Thứ tự** hiển thị (số nhỏ hơn đứng trước).
   - Bấm **Xuất bản**.

2. **Quản lý Bài học (`lessons`)**:
   - Trong nhóm **Khóa Habit**, bấm vào **Bài học**.
   - Bấm **Tạo mới** và điền các trường:
     - **Tiêu đề**: Tên bài học hiển thị cho học viên.
     - **Nhóm bài học**: Chọn nhóm bài học đã tạo ở bước 1.
     - **Tóm tắt**: Ghi chú ngắn gọn về nội dung hoặc câu hỏi gợi mở cho học viên.
     - **Thời lượng (giây)**: Tổng số giây của video (ví dụ: `300` tương đương 5 phút).
     - **Thứ tự**: Thứ tự xuất hiện trong nhóm (số nhỏ hơn đứng trước).
     - **Cho phép xem thử**: Tích chọn ô này nếu bạn muốn bài học mở tự do cho mọi người xem trước (kể cả khách chưa đăng nhập hoặc chưa mua gói). Nếu bỏ tích, bài học sẽ yêu cầu khách hàng đăng nhập và kích hoạt dùng thử 21 ngày hoặc mua sản phẩm Habit Tracker số mới xem được.
     - **Mã video**: Điền mã định danh video từ dịch vụ lưu trữ Bunny Stream. Ô này được bảo mật tuyệt đối, chỉ quản trị viên nhìn thấy trong admin. Khi hệ thống ở chế độ thử nghiệm nội bộ (sandbox), bài học sẽ hiển thị khung phát thử nghiệm; khi kết nối dịch vụ Bunny chính thức, video sẽ được phát an toàn chống tải lậu cho học viên.
   - Bấm **Xuất bản** để đưa bài học lên Góc học tập.

### 3.10.1. Cách nhập video Bunny Stream cho bài học

**Mục đích**: Nhập video bài giảng chất lượng cao từ kho lưu trữ Bunny Stream vào bài học trên website để học viên xem trực tiếp, được bảo vệ chống sao chép và tải lậu.

**Các bước thực hiện**:

1. **Tải video lên kho Bunny Stream**:
   - Truy cập trang quản trị Bunny Stream (`https://dash.bunny.net/stream`).
   - Vào thư viện video của Trạm Dừng Cảm Xúc.
   - Bấm **Upload Video** và chọn file video bài học từ máy tính để tải lên. Đợi video tải lên và hoàn tất xử lý (trạng thái chuyển sang _Finished_).

2. **Lấy Mã video (GUID)**:
   - Bấm vào video vừa tải lên để mở trang chi tiết.
   - Nhìn vào ô **Direct Play URL** hoặc dòng **Video ID** (hoặc chuỗi mã nằm trong đường dẫn URL trình duyệt), bạn sẽ thấy một chuỗi mã định danh chuẩn GUID có dạng 36 ký tự gồm các chữ cái và số ngăn cách bởi dấu gạch nối: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (ví dụ: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).
   - Bấm nút sao chép (Copy) chuỗi mã này.

3. **Dán vào bài học trong CMS**:
   - Quay lại trang quản trị CMS (`/admin`) -> Vào nhóm **Khóa Habit** -> chọn **Bài học**.
   - Bấm vào bài học bạn muốn gắn video.
   - Cuộn đến trường **Mã video (Bunny)** (`videoId`) và dán chính xác chuỗi mã GUID vừa sao chép vào.
   - Bấm nút **Lưu** hoặc **Xuất bản**.

4. **Kiểm tra hiển thị**:
   - Bấm nút mở bài học trên Góc học tập (`/habit/hoc/[id]`).
   - Video được phát qua trình phát bảo mật của hệ thống; tiến độ xem của học viên được tự động ghi nhận sau mỗi 15 giây.

---

### 3.10.2. Thêm bài học bằng Trình hướng dẫn (4 bước)

**Mục đích**: Hỗ trợ Hana đăng tải bài học mới vào lộ trình khóa học một cách nhanh gọn và trực quan nhất: vừa chọn chương vừa có thể tạo nhanh chương mới ngay tại chỗ, gắn bài học vào 4 chặng Habit Loop, tự động kiểm tra mã video Bunny và gõ thời lượng theo dạng phút:giây quen thuộc, kèm theo màn hình xem trước 3 kích thước trước khi lưu.

#### 1. Cách mở Trình hướng dẫn thêm bài học

Bạn có 3 cách rất dễ dàng:

- **Từ Dashboard "Hôm nay"**: Tại ô phím tắt nhanh, bấm vào **"Thêm bài học"**.
- **Từ bảng danh sách Bài học**: Vào menu **Khóa Habit** -> chọn **Bài học**, bạn sẽ nhìn thấy banner màu tím nổi bật ở ngay đầu trang -> bấm nút **+ Thêm bài học (từng bước)**.
- **Nhập trực tiếp đường dẫn**: Truy cập thẳng vào `/admin/them-bai-hoc`.

#### 2. Các bước thiết lập chi tiết

##### Bước 1: Chọn chương học

- **Danh sách nhóm bài học hiện có**: Hiển thị toàn bộ các chương đã có trên hệ thống, kèm theo nhãn phân loại (_Hiểu mình_, _Nguyên tắc_, hoặc _Kỹ thuật_) và số thứ tự chương. Bạn chỉ cần nhấp chuột vào thẻ chương mong muốn để chọn.
- **Tạo nhanh nhóm bài học mới ngay tại chỗ**: Nếu bài học thuộc một chương mới toanh chưa có trên website, bạn không cần phải quay ra ngoài menu khác:
  - Bấm nút **+ Tạo nhóm bài học mới**.
  - Nhập **Tên nhóm bài học** (ví dụ: `Chương 4: Tự tin duy trì thói quen`).
  - Chọn **Nhóm nội dung** (`Hiểu mình`, `Nguyên tắc`, hoặc `Kỹ thuật`).
  - Bấm **Tạo nhóm ngay**. Nhóm mới sẽ tự động được tạo và chọn ngay cho bạn.
- Bấm **Tiếp tục**.

##### Bước 2: Thông tin bài học

- **Tiêu đề bài học**: Nhập tên bài giảng hiển thị cho học viên (ví dụ: `Bài 1: Nhận diện tín hiệu kích hoạt`).
- **Tóm tắt bài học**: Viết ngắn gọn 1–2 câu giới thiệu nội dung hoặc câu hỏi gợi mở suy ngẫm.
- **Chặng thói quen (Habit Loop)**: Chọn 1 trong 5 nút lựa chọn:
  - _Gợi ý (Cue)_: Tín hiệu kích hoạt thói quen.
  - _Khao khát (Craving)_: Động lực và cảm xúc thúc đẩy.
  - _Phản hồi (Response)_: Hành động thực hiện thói quen.
  - _Phần thưởng (Reward)_: Lợi ích và cảm giác thỏa mãn nhận được.
  - _Không áp dụng_: Bài học nhập môn hoặc tổng kết chung không thuộc vòng lặp 4 bước.
- **Thứ tự hiển thị trong chương**: Hệ thống **tự động gợi ý** số thứ tự tiếp theo (bằng số thứ tự lớn nhất trong chương cộng 1). Bạn có thể sửa lại số này nếu muốn chèn bài vào vị trí khác.
- Bấm **Tiếp tục**.

##### Bước 3: Video bài học & Thời lượng

- **Mã video Bunny Stream (GUID)**:
  - Dán chuỗi mã định danh 36 ký tự từ Bunny Stream (ví dụ: `a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d`).
  - Hệ thống **kiểm tra định dạng thời gian thực**: nếu mã đúng chuẩn GUID, hệ thống sẽ hiện dấu tích xanh `✓ Định dạng GUID hợp lệ`. Nếu mã bị thiếu ký tự hoặc nhầm link web, hệ thống sẽ nhắc nhở ngay lập tức để bạn sửa.
- **Thời lượng video**:
  - Bạn có thể nhập theo dạng **phút:giây** quen thuộc (ví dụ gõ `12:30` hoặc `05:45`).
  - Hệ thống **tự động chuyển đổi** sang tổng số giây (`750` giây hoặc `345` giây) hiển thị ngay bên cạnh và lưu chuẩn xác vào cơ sở dữ liệu.
- **Cho phép xem thử**: Tích chọn ô này nếu bạn muốn bài học mở tự do cho mọi khách xem trước mà không cần đăng nhập hay mua khóa học.
- Bấm **Tiếp tục**.

##### Bước 4: Xem trước và lưu bài học

- **Khung xem trước trực quan**:
  - Hệ thống tự động tạo bản nháp tạm thời và tải trực tiếp giao diện phát video bài học thực tế bên trong khung xem trước.
  - Bạn có thể chuyển đổi giữa 3 kích thước:
    - **Điện thoại** (375px)
    - **Máy tính bảng** (768px)
    - **Máy tính** (1440px)
- **Lưu bài học**:
  - **Lưu nháp (Mặc định)**: Lưu bài học ở trạng thái nháp an toàn (`draft`).
  - **Xuất bản**: Mở bài học chính thức trên Góc học tập `/habit/hoc` (`published`).
- Sau khi bấm Lưu, hệ thống tự động chuyển hướng về trang bài học chuẩn tại `/admin/collections/lessons/[id]`.

#### 3. Tính năng an toàn cho Hana

- **Tự động lưu nháp vào máy**: Không lo mất nội dung khi mất điện hoặc vô tình đóng trình duyệt.
- **Cảnh báo rời trang**: Tránh việc bấm nhầm nút quay lại khi đang nhập dở.
- **Khôi phục dữ liệu**: Bạn có thể bấm nút **Quay lại** ở bất kỳ bước nào để chỉnh sửa thông tin mà không sợ mất các bước đã nhập.

---

### 3.11. Theo dõi Kế hoạch Thói quen & Tracker 21 ngày

**Mục đích**: Xem danh sách các kế hoạch thiết lập thói quen (`habitPlans`) và tiến độ check-in 21 ngày của khách hàng/học viên.

**Các bước xem trong trang quản trị**:

1. Ở cột menu bên trái, tìm nhóm **Khách hàng** (hoặc danh mục **Kế hoạch thói quen** – `habitPlans`).
2. Bấm vào một kế hoạch để xem chi tiết:
   - **Khách hàng sở hữu**: Tên và email của khách hàng gắn với kế hoạch.
   - **Bảng điểm thói quen (`scorecard`)**: Bảng đánh giá thói quen hiện tại (tốt, trung tính, chưa tốt).
   - **Câu định danh cam kết (`identityStatement`)**: Cam kết danh tính cho hành trình 21 ngày ("Tôi sẽ... để trở thành...").
   - **Kỹ thuật đã chọn (`chosenTechniques`)**: Danh sách các kỹ thuật rèn luyện thói quen học viên đã lựa chọn theo từng giai đoạn.
   - **Ngày bắt đầu (`startDate`)**: Thời điểm kích hoạt hành trình 21 ngày theo giờ Việt Nam.
   - **Danh sách ngày check-in (`habitCheckins`)**: Các ngày đã tick hoàn thành (`done = true`) cùng ngày ghi nhận tương ứng.

**Quy tắc bảo vệ quyền riêng tư người học (Quan trọng)**:

- **Cảm xúc và ghi chú riêng tư**: Khi khách hàng check-in mỗi ngày trên trang `/habit/tracker`, họ có thể chọn 1 trong 10 cảm xúc và viết suy nghĩ, tâm sự cá nhân (tối đa 500 ký tự).
- **Phân quyền bảo mật**:
  - Dữ liệu cảm xúc (`emotion`) và ghi chú tâm sự (`note`) là không gian an toàn riêng tư của từng người học.
  - Tài khoản chủ dự án (`owner`) có quyền xem cảm xúc và ghi chú để đồng hành, thấu hiểu học viên khi cần thiết.
  - Tài khoản biên tập viên (`editor`) **hoàn toàn không được phân quyền đọc hoặc can thiệp** vào các trường cảm xúc và ghi chú riêng tư này trong hệ thống.
  - Hệ thống tự động xử lý và chỉ hiển thị đầy đủ cho chính người học khi họ đăng nhập vào tài khoản cá nhân.

---

### 3.12. Quản lý và Thu hồi Chứng nhận 21 ngày (Certificates)

**Mục đích**: Theo dõi danh sách chứng nhận tốt nghiệp 21 ngày đã được cấp cho học viên, kiểm tra thông tin xác minh, hoặc thu hồi / tạm ẩn link công khai khi cần thiết.

**Các bước xem và quản lý trong trang quản trị**:

1. Ở cột menu bên trái, tìm nhóm **Học viên & khách**, bấm chọn **Chứng nhận 21 ngày** (`certificates`).
2. Màn hình danh sách hiển thị các cột:
   - **Mã xác minh (`code`)**: Chuỗi mã duy nhất được hệ thống sinh ngẫu nhiên tự động (ví dụ: `wF9d_a`).
   - **Khách hàng (`customer`)**: Tên học viên được trao chứng nhận.
   - **Ngày cấp (`issuedAt`)**: Thời điểm chứng nhận được tạo.
3. Bấm vào một dòng chứng nhận để xem chi tiết:
   - **Khách hàng (`customer`)**: Tên và tài khoản của học viên.
   - **Kế hoạch (`plan`)**: Kế hoạch thói quen 21 ngày tương ứng.
   - **Câu định danh (`identityStatement`)**: Cam kết danh tính của học viên lúc cấp chứng nhận.
   - **Số ngày hoàn thành (`daysCompleted`)**: Tổng số ngày học viên đã tick hoàn thành trong hành trình (tối đa 21 ngày).
   - **Mã xác minh (`code`)**: Mã tra cứu công khai (chế độ chỉ đọc, không sửa).
   - **Cho phép xem công khai (`isPublic`)**: Trạng thái hiển thị ra bên ngoài.

**Cách thu hồi hoặc tạm ẩn chứng nhận**:

- Khi học viên yêu cầu không công khai thông tin, hoặc bạn phát hiện hành vi gian lận cần tạm dừng xác minh:
  1. Mở chứng nhận đó trong CMS.
  2. **Bỏ dấu tick** ở ô **Cho phép xem công khai** (`isPublic`).
  3. Bấm nút **Lưu thay đổi**.
  4. Ngay lập tức:
     - Đường dẫn tra cứu công khai `https://tramdungcamxuc.com/chung-nhan/[mã]` sẽ trả về thông báo lỗi 404 (Không tìm thấy trang) với người ngoài.
     - Đường dẫn tải ảnh `.../anh/4x5` và `.../anh/9x16` sẽ có hiệu lực ngay lập tức với mọi lượt tải mới và trả về lỗi 404 (do ảnh được cấu hình kiểm tra lại tức thì `max-age=0, must-revalidate`; đối với file ảnh đã được người khác tải lưu về máy từ trước thì không thể thu hồi được).
     - Chỉ duy nhất học viên sở hữu (khi đã đăng nhập đúng tài khoản) mới có thể xem lại chứng nhận của mình kèm thông báo nhắc nhở: _"Link công khai đang tắt"_.
- Nếu cần xóa hoàn toàn: Chỉ tài khoản `owner` mới có nút xóa chứng nhận khỏi hệ thống.

**Sửa tên in sai trên chứng nhận**:

- Tên trên chứng nhận lấy từ trường **Họ tên** của khách. Khách nhập tên khi bấm "Nhận chứng nhận" (nếu chưa có tên). Sau khi đã có chứng nhận, khách **không** tự đổi tên được nữa.
- Khách báo tên in sai: vào **Khách hàng** → tìm theo email → sửa **Họ tên** → **Lưu**. Trang xác minh và ảnh chứng nhận cập nhật ngay ở lần tải sau.

**Cài đặt số ngày tối thiểu để nhận chứng nhận**:

- Theo mặc định, học viên phải đạt tối thiểu **15/21 ngày** check-in (và đã bước sang Ngày 21) mới đủ điều kiện nhận chứng nhận.
- Nếu Hana muốn điều chỉnh số ngày yêu cầu (ví dụ: nâng lên 18 ngày hoặc 21 ngày):
  1. Vào menu bên trái -> nhóm **Cài đặt** -> chọn **Cài đặt Website** (`siteSettings`).
  2. Tìm trường **Số ngày hoàn thành tối thiểu để nhận chứng nhận** (`certificateMinDays`).
  3. Nhập con số mong muốn (ví dụ: `18`) và bấm **Lưu thay đổi**.
  4. Hệ thống sẽ tự động áp dụng ngưỡng mới cho toàn bộ học viên mà không cần can thiệp kỹ thuật!

---

### 3.13. Quản lý 26 thẻ EQ Buddy

**Mục đích**: Quản lý kho nội dung 26 lá thẻ của công cụ số EQ Buddy (`/eq-buddy`) và trang chi tiết mở qua mã QR trên bộ thẻ vật lý 2.0 (`/eq-buddy/the/[qrSlug]`).

**Cấu trúc lá thẻ**: Được thiết kế chuẩn hóa theo đúng bộ thẻ in thực tế ngoài đời thực của Hana:

1. **Mặt trước**:
   - **Mã thẻ (`code`)**: Mã số quản lý duy nhất theo thứ tự từ `TDCX-01` đến `TDCX-26`.
   - **Từ khóa mặt trước (`keywordEn`)**: Bắt buộc khi xuất bản, tối đa 40 ký tự. Là từ khóa tiếng Anh tương ứng 26 chữ cái A → Z (ví dụ: _Abundance_, _Belonging_, _Clarity_...).
   - **Thông điệp mặt trước (`message`)**: Bắt buộc khi xuất bản. Câu thông điệp ấm áp, sâu sắc trên mặt trước lá thẻ.
2. **Mặt sau – 3 câu hỏi**:
   - Nằm trong nhóm **Mặt sau – 3 câu hỏi** với đúng 3 ô cố định theo cấu trúc in:
     - **Gợi nhớ (`promptRecall`)**: Câu hỏi kích hoạt suy ngẫm, kết nối lại trải nghiệm trong quá khứ (bắt buộc khi xuất bản).
     - **Gói ghém (`promptPack`)**: Câu hỏi giúp đúc kết bài học, chuyển hóa cảm xúc (bắt buộc khi xuất bản).
     - **Ghi nhận (`promptAcknowledge`)**: Câu hỏi ghi nhận nỗ lực và giá trị của bản thân (bắt buộc khi xuất bản).
   - _Lưu ý_: Khi lưu nháp (`Draft`), Hana có thể để trống; nhưng khi bấm **Xuất bản** (`Published`), hệ thống yêu cầu điền đủ cả 3 câu hỏi để đảm bảo trải nghiệm người dùng hoàn chỉnh.
3. **Các trường bổ sung (không bắt buộc – bộ thẻ in hiện không có, Hana có thể thêm sau)**:
   - **Từ khóa tiếng Việt (`keywordVi`)**: Tối đa 40 ký tự (ví dụ: _Thấu hiểu_, _Gắn kết_).
   - **Câu chuyện (`story`)**: Soạn thảo câu chuyện truyền cảm hứng hoặc bài học mở rộng cho thẻ.
   - **Hành động nhỏ (`smallAction`)**: Một việc làm cụ thể, nhẹ nhàng học viên có thể thực hành ngay trong ngày.
   - **Nhãn cảm xúc (`emotionTags`)**: Chọn một hoặc nhiều cảm xúc liên quan từ bộ 10 cảm xúc cố định của Brand Book 2026.
4. **Mã QR và thông tin xuất bản**:
   - **Mã đường dẫn QR (`qrSlug`)**: Bắt buộc. Viết thường không dấu của từ khóa tiếng Anh (ví dụ: `abundance`, `belonging`... `zero`).
     - Đường dẫn quét QR trên điện thoại sẽ là: `https://tramdungcamxuc.com/eq-buddy/the/[qrSlug]`.
   - **Ngày đã in (`printedAt`)**: Ngày gửi file đi in tại xưởng in.
   - **Ảnh thẻ (`image`)**, **Ảnh chia sẻ 4:5 (`shareImage45`)**, **Ảnh chia sẻ 9:16 (`shareImage916`)**: Tải lên các file thiết kế của thẻ. Nếu để trống ảnh chia sẻ, hệ thống sẽ tự động tạo ảnh thương hiệu khi người dùng bấm chia sẻ.

> **QUY TẮC BẢO VỆ BẮT BUỘC: KHÔNG ĐỔI MÃ QR SAU KHI IN**
>
> - Khi gửi bộ thẻ vật lý đi in tại xưởng, hãy nhập ngày in vào ô **Ngày đã in** (`printedAt`) và bấm **Xuất bản** (chỉ lưu nháp thì chưa khóa). Cách xuất file in: mục 3.14.
> - **Ngay sau khi xuất bản với ngày in**, hệ thống sẽ **TỰ ĐỘNG KHÓA VĨNH VIỄN** trường **Mã đường dẫn QR** và trường **Ngày đã in**. Ô nhập mã QR sẽ chuyển sang chế độ bảo vệ cố định, và bạn không thể thay đổi hay xóa ngày in.
> - Cơ chế này nhằm bảo vệ bạn tuyệt đối: tránh tình trạng vô tình sửa đổi mã đường dẫn trên web làm đứt gãy liên kết, khiến hàng nghìn lá thẻ vật lý đã in ngoài đời thực không quét được QR nữa!

### 3.14. In QR cho bộ thẻ EQ Buddy (EqCards)

**Mục đích**: Xuất danh sách liên kết mã QR và tải ảnh QR chất lượng cao (1200×1200 px) gửi cho nhà in để in trực tiếp lên bộ thẻ vật lý EQ Buddy.

**Các bước thực hiện**:

1. **Chuẩn bị và kiểm tra thẻ trong CMS**:
   - Ở cột menu bên trái, tìm nhóm **EQ Buddy** -> chọn **Thẻ EQ Buddy**.
   - Mỗi thẻ cần có **Mã thẻ** (`code`), **Thông điệp** (`message`) và **Mã đường dẫn QR** (`qrSlug`), và đã bấm **Xuất bản**. File in chỉ lấy bản đã xuất bản – sửa mà chưa xuất bản thì chưa vào file in.
   - Link trên QR luôn là `https://tramdungcamxuc.com/eq-buddy/the/<mã QR>` (kể cả khi tải từ trang quản trị demo), nên QR in ra dùng được lâu dài.
   - Đường dẫn quét mã của thẻ là cố định: `https://tramdungcamxuc.com/eq-buddy/the/[qrSlug]`. Trang này mở tự do cho khách mua bộ thẻ vật lý quét mã xem thông điệp, từ khóa và 3 câu hỏi mặt sau (cùng câu chuyện nếu có) mà không cần đăng nhập hay mua thêm gói.
   - Thẻ cần được bấm **Xuất bản** trước khi khách hàng quét thực tế.

2. **Xuất danh sách QR tổng hợp (CSV)**:
   - Trên màn hình danh sách Thẻ EQ Buddy, bấm nút **Xuất danh sách QR (CSV)** ở góc trên bên phải bảng.
   - Hệ thống tải về file `eq-qr-YYYY-MM-DD.csv` chuẩn UTF-8 (có BOM mở tốt trên Excel mà không lỗi font tiếng Việt).
   - Danh sách chứa đầy đủ các cột: `code`, `qrSlug`, `url`, `trạng thái` (Đã xuất bản / Bản nháp), `ngày in`, `link PNG`.
   - File này có thể gửi trực tiếp cho đơn vị thiết kế / in ấn để đối chiếu mã và đường dẫn.

3. **Tải file ảnh QR từng thẻ (PNG)**:
   - Bấm vào một thẻ EQ Buddy cụ thể để vào trang chỉnh sửa chi tiết.
   - Ở cột bên phải (sidebar), bấm nút **Tải ảnh QR (PNG)**.
   - Trình duyệt sẽ tải về file ảnh `qr-<code>.png` chất lượng cao kích thước 1200×1200 px, mức sửa lỗi 'Q' (25% phục hồi), màu nhận diện thương hiệu Deep Navy `#280A60` trên nền trắng có viền an toàn 4 ô (quiet zone) cho máy quét mã vạch / camera điện thoại.

4. **Đánh dấu ngày in sau khi gửi file in (RẤT QUAN TRỌNG)**:
   - Sau khi hoàn tất rà soát và gửi file cho nhà in ấn, Hana mở thẻ và điền thời điểm vào ô **Ngày đã in** (`printedAt`), sau đó bấm **Xuất bản** (chỉ lưu nháp thì mã QR **chưa** bị khóa).
   - **Cơ chế khóa bảo vệ**: Ngay sau khi lưu ngày in, hệ thống sẽ **khóa vĩnh viễn** trường `qrSlug` và `printedAt`. Không ai (kể cả quản trị viên) có thể thay đổi hoặc xóa mã QR của thẻ đã in. Điều này đảm bảo mã QR in trên bộ thẻ vật lý đã xuất xưởng không bao giờ bị sai lệch hay mất liên kết.

---

### 3.15. Ảnh chia sẻ thẻ EQ Buddy và Liên kết Shopee bộ thẻ vật lý

#### 3.15.1. Ảnh chia sẻ thẻ trên mạng xã hội (Tỷ lệ 4:5 và 9:16)

**Mục đích**: Học viên khi rút được thẻ có thể bấm nút tải ảnh về máy để đăng lên Facebook, Instagram (dạng bài đăng hoặc Story) hoặc chia sẻ qua Zalo/tin nhắn.

**Cơ chế hoạt động**:

1. **Hệ thống tự động sinh ảnh đẹp chuẩn nhận diện**:
   - Mặc định, mỗi khi khách bấm "Tải ảnh 4:5" hoặc "Tải ảnh 9:16", hệ thống sẽ tự động ghép **từ khóa** và thông điệp của thẻ trên nền gradient pastel thương hiệu Trạm Dừng Cảm Xúc, kèm huy hiệu mã thẻ, chữ ký thương hiệu Trạm Dừng Cảm Xúc và tên miền `tramdungcamxuc.com`.
   - Hana không cần làm gì thêm, mọi thẻ tạo mới đều có sẵn tính năng tải ảnh chia sẻ tự động.
2. **Nếu Hana muốn dùng ảnh thiết kế riêng (ví dụ ảnh xuất từ Canva hoặc Photoshop)**:
   - Mở chi tiết thẻ trong mục **EQ Buddy** -> **Thẻ EQ Buddy**.
   - Cuộn xuống tìm 2 ô tải ảnh:
     - **Ảnh chia sẻ 4:5** (`shareImage45`): Dùng cho bài đăng Facebook/Instagram feed. Kích thước chuẩn khuyến nghị: **1080 × 1350 px**.
     - **Ảnh chia sẻ 9:16** (`shareImage916`): Dùng cho tin/story 24h trên Facebook/Instagram/TikTok. Kích thước chuẩn khuyến nghị: **1080 × 1920 px**.
   - Sau khi tải ảnh lên, bấm **Xuất bản** (chỉ lưu nháp thì khách chưa thấy).
   - Trong vòng khoảng 10 phút, nút tải ảnh trên web sẽ trả về ảnh thiết kế riêng của Hana thay cho ảnh tự sinh (trình duyệt và máy chủ giữ ảnh cũ một lúc).

#### 3.15.2. Cấu hình liên kết gian hàng Shopee cho Bộ thẻ vật lý

**Mục đích**: Bán bộ 26 thẻ vật lý trên gian hàng Shopee của Hana. Trên website chỉ đặt nút "Mua bộ thẻ trên Shopee" dẫn khách sang Shopee đặt hàng, không xây giỏ hàng phức tạp và không xử lý giao vận trên website.

**Các bước thực hiện**:

1. Vào menu **Sản phẩm** -> **Sản phẩm**.
2. Mở sản phẩm bộ thẻ vật lý có sẵn (đường dẫn `bo-the-vat-ly-2-0`) – **không** tạo sản phẩm mới, website tìm đúng sản phẩm này:
   - **Website**: Chọn `eq` (EQ Buddy).
   - **Loại sản phẩm**: Chọn **Bộ thẻ vật lý (Shopee)** (`physical_external`).
   - **Đường dẫn ngoài (externalUrl)**: Dán liên kết sản phẩm trên gian hàng Shopee của Hana (bắt đầu bằng `https://`).
   - **Trạng thái mở bán**: Chọn **Đang mở bán** (`on_sale`).
3. Bấm **Xuất bản**.

> **Hana lưu ý**: Website sẽ **tự động gắn các mã đo lường chiến dịch (UTM)** như `utm_source=tramdungcamxuc&utm_medium=website` vào đường dẫn khi khách click nút mua. Hana chỉ cần dán link Shopee gốc bình thường, không cần tự thêm tham số UTM thủ công.

---

### 3.16. Trang giới thiệu bộ thẻ và Kích hoạt dùng thử EQ Buddy số

#### 3.16.1. Nội dung trang giới thiệu `/eq-buddy`

**Mục đích**: Trang `/eq-buddy` đóng vai trò là cửa ngõ trải nghiệm bộ thẻ EQ Buddy số trên website, hiển thị lời giới thiệu, cách sử dụng bộ thẻ và nút dẫn khách vào luồng rút thẻ (`/eq-buddy/rut-the`).

**Cách cập nhật nội dung**:

- Nội dung trang được liên kết trực tiếp với sản phẩm **EQ Buddy số** (đường dẫn cố định: `eq-buddy-so`).
- Vào menu **Sản phẩm** -> **Sản phẩm** -> mở sản phẩm `EQ Buddy số`:
  - **Tên sản phẩm**: Tiêu đề chính của trang (mặc định: _EQ Buddy số (26 thẻ)_).
  - **Mô tả ngắn**: Câu thông điệp cảm xúc hiển thị dưới tiêu đề chính.
  - **Giới thiệu chi tiết** (RichText): Hana dán toàn bộ nội dung "Giới thiệu bộ thẻ", triết lý thiết kế và "Cách sử dụng" vào ô này. Hỗ trợ định dạng văn bản phong phú (chữ đậm, chữ nghiêng, danh sách hoa thị, trích dẫn).
- Bấm **Xuất bản** để cập nhật ngay lập tức lên trang `/eq-buddy`.

#### 3.16.2. Kích hoạt tính năng dùng thử 21 ngày cho EQ Buddy số

**Mục đích**: Mở quyền cho học viên và khách hàng đăng ký dùng thử công cụ số EQ Buddy trong 21 ngày hoàn toàn miễn phí.

**Quy tắc hệ thống**:

- Trong cấu hình mặc định (seed), sản phẩm `EQ Buddy số` (`eq-buddy-so`) có trạng thái mở bán là **Sắp ra mắt** (`coming_soon`). Ở trạng thái này, trang `/dung-thu` sẽ từ chối để tránh việc mở dùng thử sớm ngoài kế hoạch.
- **Khi Hana sẵn sàng mở cho học viên dùng thử**:
  1. Vào menu **Sản phẩm** -> **Sản phẩm** -> chọn sản phẩm **EQ Buddy số** (`eq-buddy-so`).
  2. Tìm trường **Trạng thái mở bán** (`saleStatus`).
  3. Đổi giá trị từ _Sắp ra mắt_ (`coming_soon`) sang **Đang mở bán** (`on_sale`).
  4. Đảm bảo ô **Số ngày dùng thử** (`trialDays`) được đặt là `21`.
  5. Bấm **Xuất bản** (hoặc **Lưu thay đổi**).
- Sau khi bật bán:
  - Khách vãng lai (chưa đăng nhập) khi truy cập `/eq-buddy/rut-the` được rút **1 thẻ đầu tiên miễn phí**. Khi rút tiếp lá thứ 2, hệ thống sẽ tự động hiển thị màn hình hướng dẫn đăng nhập OTP để kích hoạt 21 ngày dùng thử.
  - Khách hàng đã đăng nhập và kích hoạt dùng thử 21 ngày (hoặc đã mua gói số) sẽ được rút thẻ không giới hạn.
  - _Lưu ý quan trọng_: Giới hạn dùng thử này chỉ áp dụng cho công cụ số trên website, **không ảnh hưởng** đến các trang xem thẻ quét từ mã QR (`/eq-buddy/the/[qrSlug]`) – các trang QR luôn mở tự do cho mọi người mua bộ thẻ in vật lý theo đúng thiết kế.

---

### 3.17. Quản lý Thẻ đã lưu và Bảo mật suy ngẫm của khách hàng (SavedCards)

**Mục đích**: Theo dõi danh sách các lá thẻ cảm xúc EQ Buddy mà học viên và khách hàng đã lưu vào tài khoản cá nhân, đồng thời đảm bảo an toàn và bảo mật tuyệt đối cho dữ liệu suy ngẫm nhạy cảm của người dùng.

**Cách xem trong trang quản trị**:

1. Ở cột menu bên trái, tìm nhóm **EQ Buddy** -> chọn **Thẻ đã lưu** (`savedCards`).
2. Bảng danh sách hiển thị các thông tin:
   - **Khách hàng (`customer`)**: Tên hoặc email của người đã lưu thẻ.
   - **Thẻ (`card`)**: Thẻ EQ Buddy tương ứng được lưu.
   - **Lưu lúc (`savedAt`)**: Thời điểm khách hàng lưu thẻ.

**Quy tắc phân quyền và Bảo mật dữ liệu nhạy cảm (CỰC KỲ QUAN TRỌNG)**:

- **Bảo vệ quyền riêng tư cảm xúc**: Nội dung suy ngẫm (`reflection`) là dữ liệu riêng tư nhạy cảm của học viên.
- **Tài khoản Biên tập (`editor`)**: Các bạn trợ lý hoặc cộng sự ở vai trò biên tập viên **hoàn toàn không thể đọc được nội dung suy ngẫm** của khách hàng (ô suy ngẫm sẽ bị ẩn đi khi mở xem chi tiết). Biên tập viên chỉ thấy thông tin khách hàng đã lưu thẻ nào vào lúc nào để hỗ trợ kỹ thuật khi cần.
- **Tài khoản Chủ sở hữu (`owner`)**: Chỉ riêng tài khoản của Hana mới có quyền xem nội dung suy ngẫm khi cần thiết để hỗ trợ khách hàng hoặc tham vấn chuyên môn.
- **Khách hàng xem tại `/tai-khoan`**: Khách hàng chỉ xem được danh sách thẻ và suy ngẫm của chính mình trong khối **"Thẻ đã lưu"**. Khách hàng có thể mở lại chi tiết thẻ hoặc chủ động bấm nút "Xóa" kèm hộp thoại xác nhận.
- **Khi khách hàng xóa tài khoản**: Theo đúng quy định bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP và tính năng T2-16), khi một khách hàng yêu cầu xóa tài khoản và được duyệt xóa, toàn bộ dữ liệu thẻ đã lưu cùng suy ngẫm của khách hàng đó sẽ **bị xóa vĩnh viễn** khỏi cơ sở dữ liệu một cách an toàn.

---

## 4. Quản lý Lời chia sẻ của khách hàng (Testimonials)

### 4.1. Thêm một lời chia sẻ mới

**Mục đích**: Đăng tải cảm nhận, phản hồi tích cực của học viên và khách hàng lên website để xây dựng niềm tin.

**Các bước thực hiện**:

1. Ở cột menu bên trái, tìm nhóm **Trang web**, bấm chọn **Lời chia sẻ**.
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

### 4.3. Câu chuyện "Trước / Sau" của khách hàng

Trong form **Lời chia sẻ** có thêm:

- **Tuổi** (không bắt buộc) và **Vai trò** – chức danh hiện trên thẻ (VD: _Project Manager_). Chỉ nhập khi khách đồng ý hiện các thông tin này.
- Nhóm **Câu chuyện**: _Trước / Vấn đề ban đầu_, _Quá trình nhận thức_ (không bắt buộc), _Sau / Kết quả_. Dùng cho các thẻ câu chuyện trên trang lộ trình và trang Coach 1:1.
- **Sản phẩm hoặc dịch vụ liên quan**: chọn gói (CLEAR / BUILD / SHINE…) để thẻ hiện nhãn "Gói đồng hành".

Quy tắc đồng ý ở mục 4.2 vẫn áp dụng: chưa tick đồng ý thì không xuất bản được.

### 4.4. Câu hỏi thường gặp (FAQ) dùng chung

Menu trái → nhóm **Trang web** → **Câu hỏi thường gặp**.

1. Bấm **Tạo mới**, nhập **Câu hỏi** và **Trả lời** (xuống dòng được giữ nguyên trên web).
2. Bên phải chọn **Nhóm** (Chung, Lộ trình, Coaching 1:1, Sản phẩm số, Doanh nghiệp, Thanh toán) và **Thứ tự** (số nhỏ đứng trước).
3. Bấm **Xuất bản**.

Mỗi câu chỉ cần nhập **một lần**: trang nào hiện FAQ theo nhóm đó sẽ tự cập nhật khi bạn sửa. Câu trả lời về thanh toán cần đúng chính sách: chuyển khoản QR, **không hoàn tiền**, phiên trải nghiệm 149.000đ để thử trước.

### 4.5. Đội ngũ chuyên gia

Menu trái → nhóm **Trang web** → **Đội ngũ**.

- Chỉ thêm **người thật** đã đồng ý cho Trạm hiện tên và ảnh trên web.
- Điền Họ tên, Vai trò, Chuyên môn, Giới thiệu ngắn (tối đa 400 ký tự), Ảnh chân dung (có mô tả ảnh).
- Bên phải tick **Người này đã đồng ý hiện tên, ảnh trên web** rồi mới bấm **Xuất bản** – chưa tick thì hệ thống chặn lại.
- Chưa có ai thì để trống: khối Đội ngũ trên trang Về Trạm sẽ tự ẩn.

---

## 5. Dựng trang trực quan bằng công cụ kéo thả (Puck Editor)

Đây là công cụ mạnh mẽ nhất giúp Hana tự tay tạo ra các landing page chiến dịch, trang dịch vụ hay trang sự kiện một cách trực quan như xếp các khối hình ảnh mà không cần chạm vào code.

### 5.1. Tạo trang mới từ Mẫu trang có sẵn

**Mục đích**: Tạo một trang web hoàn chỉnh chỉ trong vài phút bằng cách kế thừa bố cục chuyên nghiệp đã được thiết kế sẵn.

**Các bước thực hiện**:

1. Ở cột menu bên trái, tìm nhóm **Trang web**, bấm chọn **Trang nội dung**.
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

1. Ở cột menu bên trái, tìm nhóm **Sản phẩm & bán hàng**, bấm vào **Dịch vụ đồng hành**.
2. Bấm vào dịch vụ _Growth Mirror_ hoặc _Thinking Mirror_.
3. Dán link đặt lịch cá nhân của bạn vào ô **Liên kết đặt lịch** (`bookingUrl`).
4. Bấm **Lưu** hoặc **Xuất bản**.

![Cài đặt liên kết đặt lịch coaching](images/huong-dan/22-lien-ket-dat-lich-coaching.png)
<!-- ẢNH 22: trang chỉnh sửa Dịch vụ đồng hành, trường Liên kết đặt lịch -->

---

### 7.3b. Thông tin liên hệ, mạng xã hội và lựa chọn "Tình trạng hiện tại"

**Cài đặt website** → tab **Liên hệ & Zalo**:

- **Hotline / Zalo**: chỉ dùng số, khoảng trắng, dấu chấm và dấu + ở đầu (VD: `+84 930 000 000`).
- **Địa điểm văn phòng**: có thể chỉ ghi thành phố.
- **LinkedIn**, **Facebook / Fanpage**, **YouTube**: dán liên kết bắt đầu bằng `https://`. Ô để trống thì trang Liên hệ không hiện kênh đó.
- **Lựa chọn "Tình trạng hiện tại"**: các lựa chọn khách thấy trong form liên hệ (thay các mục `[MẪU]`), kéo để đổi thứ tự.

Tab **Chung** có thêm **Ảnh chữ ký nhà sáng lập** (PNG nền trong) cho khối "Lời chào từ nhà sáng lập".

### 7.3c. Nút sau kết quả quiz chẩn đoán

**Cài đặt website** → tab **Công cụ số** → **Nút sau kết quả quiz dẫn tới đâu**: nhập đường dẫn trong web (bắt đầu bằng `/`) hoặc liên kết `https://`. Để trống thì nút dẫn tới trang lộ trình. Khi Habit Tracker số đang mở dùng thử, nút luôn mời dùng thử.

### 7.3d. Menu con (menu "Sản phẩm", "Tài nguyên"…)

**Menu điều hướng** → **Menu chính** → mở một mục:

1. Kéo xuống phần **Menu con** → **Thêm** một nhóm. Đặt **Tên nhóm** (VD: _Dành cho Cá nhân_) nếu muốn.
2. Trong nhóm, **Thêm** mục con: Tên mục, **Mô tả ngắn** (tối đa 60 ký tự, VD: _Công cụ hỗ trợ cảm xúc_), chọn trang đích hoặc liên kết.
3. Mục cha không có trang riêng (như "Sản phẩm"): ở **Loại liên kết** chọn **Chỉ mở menu con**. Mục này cần ít nhất 1 mục con.
4. Bấm **Lưu**. Kéo các nhóm / mục con để đổi thứ tự.

Menu con hiện trên web từ đợt cập nhật menu (SM-02).

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
   - Ở cột menu bên trái, tìm nhóm **Sản phẩm & bán hàng**, bấm vào mục **Đơn hàng**.
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
- **Tự động hết hạn sau 24 giờ:** Nếu sau 24 giờ kể từ khi tạo đơn mà khách không chuyển khoản, hệ thống sẽ tự động chuyển đơn sang trạng thái hết hạn; khách đã đồng ý nhận tin sẽ nhận email nhắc nhẹ. Nếu khách chuyển khoản muộn sau 24 giờ, Chủ sở hữu (Owner) vẫn có thể xác nhận đơn quá hạn sau khi kiểm tra kỹ tiền đã về tài khoản (xem hướng dẫn chi tiết ngay bên dưới).
- **Số tiền bị khóa:** Sau khi đơn được tạo, Biên tập viên không sửa được sản phẩm, số tiền hay khách hàng của đơn. Chủ sở hữu chỉ sửa được khi đơn còn chờ thanh toán.

#### Khách chuyển khoản muộn (đơn đã hết hạn)

**Mục đích**: Xử lý trường hợp khách hàng chuyển khoản sau 24 giờ kể từ lúc đặt hàng (khi hệ thống đã tự động chuyển đơn sang trạng thái "Hết hạn thanh toán" / `failed`). Theo quyết định Q19, chỉ tài khoản Chủ sở hữu (Owner) mới có quyền duyệt thanh toán cho các đơn quá hạn này để khách vẫn nhận được quyền lợi và dịch vụ.

> ⚠️ **CẢNH BÁO QUAN TRỌNG**:  
> **"Đơn đã quá hạn – chỉ xác nhận khi đã thấy tiền về"**  
> Với các đơn đã hết hạn, Hana bắt buộc phải **kiểm tra kỹ thông báo biến động số dư hoặc sao kê ngân hàng** trước khi bấm xác nhận. Tuyệt đối không bấm duyệt nếu chưa thấy tiền thực tế về tài khoản.

**Các bước thực hiện**:

1. **Đối chiếu tiền về tài khoản ngân hàng:**
   - Mở ứng dụng ngân hàng và kiểm tra giao dịch chuyển khoản thực tế.
   - Xác định chính xác số tiền nhận được và mã chuyển khoản `TDCX...` trong nội dung giao dịch.

2. **Mở đơn hàng hết hạn trong CMS:**
   - Vào **Bán hàng** -> **Đơn hàng**, tìm đơn hàng tương ứng (trạng thái thanh toán hiển thị _Hết hạn thanh toán_ / `failed`).
   - Bấm vào đơn hàng để mở trang chi tiết.

3. **Kiểm tra cảnh báo và duyệt thanh toán an toàn:**
   - Tại cột bên phải, khung **🛡️ Thao tác đơn hàng (Chủ sở hữu)** sẽ hiển thị ô cảnh báo màu vàng nổi bật:  
     **⚠️ Đơn đã quá hạn – chỉ xác nhận khi đã thấy tiền về**.
   - Bấm nút **✓ Xác nhận thanh toán** (với đơn đã hết hạn, nút **Hủy đơn hàng** được hệ thống tự động ẩn để tránh bấm nhầm).
   - Hộp thoại xác nhận hiện lên và nhắc lại câu cảnh báo: đọc kỹ và bấm **Đồng ý xác nhận**.

4. **Kết quả xử lý tự động của hệ thống:**
   - Đơn hàng chuyển ngay sang trạng thái **Đã thanh toán**.
   - Hệ thống tự động ghi nhật ký kiểm toán hành động `confirm_expired_order`.
   - Khách hàng nhận được đúng 1 email xác nhận kèm liên kết đặt lịch coaching (đối với phiên trải nghiệm 149.000đ) hoặc được tự động cấp quyền công cụ số (đối với các gói Growth Mirror).
   - Nếu khách truy cập lại đường link đơn hàng của mình trên website, trang sẽ cập nhật thông báo "Đã thanh toán" thành công.

_(ảnh: Planning chụp)_

#### Tạo link thanh toán gói Growth Mirror

**Mục đích**: Hana tạo đơn hàng thanh toán riêng cho khách sau khi đã tư vấn hoặc hoàn thành phiên trải nghiệm Growth Mirror 149.000đ. Khách nhận được link cá nhân hóa để xem tóm tắt cấu phần gói, đồng ý điều khoản và thanh toán chuyển khoản VietQR.

**Các bước Hana làm**:

1. Đăng nhập vào trang quản trị CMS bằng tài khoản Chủ sở hữu (Owner).
2. Ở cột menu bên trái, tìm nhóm **Sản phẩm & bán hàng**, bấm vào **Đơn hàng** -> bấm nút **Tạo mới**.
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

> 💡 **Mẹo dành cho Hana**: Khách hàng đã đăng nhập có thể tự truy cập trang **Tài khoản** (`/tai-khoan`) để xem danh sách **"Đơn hàng của tôi"** và bấm nút **"Xem cách thanh toán"** cho bất kỳ đơn nào chưa thanh toán. Nếu khách hỏi lại link thanh toán, Hana chỉ cần hướng dẫn khách đăng nhập vào `/tai-khoan` mà không cần phải vào CMS tìm và sao chép link thủ công.

#### Xác nhận đơn công cụ số

**Mục đích**: Xử lý và kích hoạt quyền truy cập tự động cho khách hàng khi mua lẻ công cụ số (Habit Tracker số, EQ Buddy số) qua đường dẫn thanh toán trực tiếp `/thanh-toan?san-pham=<slug>`.

**Quy trình đối chiếu sao kê và duyệt đơn**:

1. **Khách đặt mua trên website**: Khách hàng đã đăng nhập tài khoản, tick chọn đồng ý Điều khoản & Chính sách giá – thanh toán, và quét mã VietQR để chuyển khoản với nội dung `TDCX...`.
2. **Hana đối chiếu tiền về tài khoản ngân hàng**:
   - Mở ứng dụng ngân hàng, kiểm tra thông báo biến động số dư và sao kê nhận tiền.
   - Đối chiếu số tiền (250.000đ hoặc 178.000đ ưu đãi) và mã chuyển khoản `TDCX...`.
3. **Bấm nút duyệt đơn an toàn trong CMS**:
   - Vào nhóm **Sản phẩm & bán hàng** -> **Đơn hàng**, bấm vào đơn hàng tương ứng.
   - Tại cột bên phải (Sidebar), bấm nút **✓ Xác nhận thanh toán** và chọn **Đồng ý xác nhận**.
4. **Hệ thống tự động kích hoạt quyền & gửi email**:
   - Đơn hàng chuyển sang trạng thái **Đã thanh toán** (`paid`), trạng thái giao đổi sang **Đã cấp quyền** (`access_granted`).
   - Quyền truy cập công cụ số (`active`) được tự động kích hoạt vĩnh viễn (hoặc theo thời hạn cấu hình) gắn liền với tài khoản của khách.
   - Hệ thống tự động gửi email kích hoạt tới khách hàng với tiêu đề _"Trạm Dừng Cảm Xúc – Kích hoạt công cụ số [Tên công cụ]"_, thông báo thời hạn và kèm nút mở công cụ ngay trên website.
   - Khi khách truy cập mục **Tài khoản của tôi** (`/tai-khoan`), trong phần "Khóa học của tôi", công cụ số sẽ hiển thị nhãn **Đang hiệu lực** kèm nút **"Vào học / Mở công cụ"**.

---

### 7.6. Tự động hóa thanh toán qua SePay & Xem Sự kiện thanh toán

Khi Trạm kích hoạt chế độ thanh toán tự động qua SePay (`PAYMENT_PROVIDER=sepay`), website sẽ tự động đối soát giao dịch và kích hoạt đơn hàng trong vài phút mà Hana không cần phải vào CMS bấm duyệt thủ công cho từng đơn.

#### 1. Hai chế độ vận hành thanh toán

| Chế độ                | Khi nào áp dụng           | Trải nghiệm của khách & Hana                                                                                                                                                                                                                                                                                                                 |
| :-------------------- | :------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tự động (SePay)**   | `PAYMENT_PROVIDER=sepay`  | Sau khi khách quét mã VietQR và chuyển khoản, ngân hàng báo về SePay, SePay gửi thông báo tự động (webhook) đến website. Đơn hàng tự động chuyển sang **Đã thanh toán**, quyền công cụ số lập tức được mở và email kích hoạt tự động gửi đi. Trang thanh toán của khách tự động cập nhật sau vài giây/phút mà khách không cần tải lại trang. |
| **Thủ công (Manual)** | `PAYMENT_PROVIDER=manual` | Dùng khi SePay bảo trì hoặc chưa cấu hình. Khách chuyển khoản bình thường, Hana mở app ngân hàng kiểm tra sao kê rồi vào CMS bấm **✓ Xác nhận thanh toán** như hướng dẫn ở mục 7.5.                                                                                                                                                          |

#### 2. Xem lịch sử Sự kiện thanh toán trong đơn hàng

Trong trang chi tiết của mỗi đơn hàng tại CMS, ở cột bên phải (Sidebar), Hana sẽ thấy mục **Sự kiện thanh toán (SePay)**:

- Hiển thị danh sách tất cả các thông báo giao dịch mà SePay đã gửi về cho đơn hàng này.
- Các thông tin hiển thị gồm:
  - Thời gian nhận giao dịch.
  - Mã giao dịch SePay (`ID: ...`).
  - Số tiền thực nhận trong tài khoản ngân hàng.
  - Kết quả xử lý: **Thành công (`paid`)**, **Trùng lặp (`duplicate`)**, **Đơn đã thanh toán trước đó (`already_paid`)**, hoặc các cảnh báo cần xử lý tay.

#### 3. Xử lý các tình huống đặc biệt (Hana xử lý thủ công)

Hệ thống được thiết kế an toàn tối đa: khi có bất thường về tiền bạc, hệ thống **không bao giờ tự ý duyệt đơn** mà sẽ dừng lại, gắn nhãn cảnh báo nổi bật (chữ hồng đậm trên nền hồng nhạt) trong mục **Sự kiện thanh toán** để Hana can thiệp:

1. **Lệch số tiền (`amount_mismatch`) – Cảnh báo nổi bật**:
   - **Hiện tượng**: Khách chuyển thiếu tiền (ví dụ: đơn 250.000đ nhưng khách chuyển nhầm 200.000đ) hoặc khách chuyển thừa tiền.
   - **Cách hệ thống xử lý**: Đơn hàng vẫn giữ nguyên trạng thái **Chờ thanh toán** (`pending`), chưa cấp quyền công cụ số. Một sự kiện `amount_mismatch` có cảnh báo được ghi lại trong sidebar đơn hàng.
   - **Việc Hana cần làm**:
     - Xem số tiền thực chuyển hiển thị trong khung Sự kiện thanh toán.
     - Liên hệ với khách hàng (qua Zalo/Email) để thông báo. Nếu khách chuyển thiếu, hướng dẫn khách chuyển nốt phần còn lại. Nếu khách chuyển thừa, liên hệ khách để xử lý.
     - Sau khi khách đã hoàn tất đủ tiền vào tài khoản ngân hàng, Hana bấm nút **✓ Xác nhận thanh toán** ở sidebar để kích hoạt đơn thủ công.

2. **Đơn hàng đã bị hủy mà khách vẫn chuyển tiền (`order_cancelled`) – Cảnh báo nổi bật**:
   - **Hiện tượng**: Khách đã yêu cầu hủy đơn (hoặc Hana bấm Hủy đơn), nhưng sau đó khách lại vào app ngân hàng quét mã chuyển tiền cũ.
   - **Cách hệ thống xử lý**: Đơn hàng giữ nguyên trạng thái **Đã hủy** (`cancelled`), tuyệt đối không tự động mở quyền. Một sự kiện `order_cancelled` có cảnh báo hiển thị trong sidebar.
   - **Việc Hana cần làm**:
     - Kiểm tra tiền đã vào tài khoản ngân hàng.
     - Liên hệ khách hàng: nếu khách vẫn muốn mua, Hana tạo một đơn hàng mới cho khách rồi bấm duyệt; nếu khách không muốn mua nữa, liên hệ khách để xử lý.

3. **Chưa đồng ý điều khoản (`terms_missing`) – Cảnh báo nổi bật**:
   - **Hiện tượng**: Đơn do Hana tạo (`createdByAdmin`), khách đã chuyển khoản nhưng trước đó chưa mở link để tick chọn đồng ý Điều khoản sử dụng và Chính sách giá – thanh toán.
   - **Cách hệ thống xử lý**: Đơn hàng giữ nguyên trạng thái **Chờ thanh toán**, hệ thống KHÔNG tự động duyệt để đảm bảo tuân thủ pháp lý. Một sự kiện `terms_missing` có cảnh báo được ghi lại trong sidebar.
   - **Việc Hana cần làm**:
     - Gửi lại link thanh toán cho khách để khách mở trang và tích chọn đồng ý điều khoản.
     - Hoặc nếu khách đã xác nhận đồng ý điều khoản qua tin nhắn/email, Hana có thể bấm nút **✓ Xác nhận thanh toán** thủ công ở sidebar.

4. **Khách chuyển tiền cho đơn đã quá hạn 24 giờ (`failed`)**:
   - Khác với đơn đã hủy, nếu đơn hàng chỉ bị quá hạn 24 giờ (`failed`) và khách chuyển **đúng số tiền + đúng mã chuyển khoản**, hệ thống SePay vẫn **tự động duyệt thanh toán và kích hoạt đơn bình thường**, giúp khách nhận ngay sản phẩm mà không phải chờ đợi.

5. **Khách chuyển tiền 2 lần cho cùng một đơn (`already_paid`) – Cảnh báo nổi bật**:
   - Giao dịch thứ hai được ghi `already_paid`, **không** cấp quyền hay gửi email lần 2.
   - Hana thấy cảnh báo "Khách chuyển tiền lần nữa…" trong khung Sự kiện thanh toán, rồi liên hệ khách để xử lý.
   - `duplicate` (SePay gửi lại cùng một giao dịch) là bình thường, không cần làm gì.

6. **Đang xử lý chưa xong (`processing`) – Cảnh báo nổi bật**:
   - Xảy ra khi máy chủ gặp lỗi giữa lúc ghi nhận thanh toán. SePay tự gửi lại sau ít phút và hệ thống xử lý tiếp (không cấp quyền 2 lần).
   - Quá 30 phút vẫn còn cảnh báo này: mở đơn xem trạng thái và đối chiếu sao kê ngân hàng. Đơn vẫn **Chờ thanh toán** mà tiền đã vào tài khoản → bấm **✓ Xác nhận thanh toán**; báo anh IT xem log máy chủ. Nếu đơn đã **Đã thanh toán** nhờ một giao dịch khác thì khách có thể đã chuyển 2 lần → liên hệ khách.

7. **Thành công sau khi xử lý lại (`paid_incomplete`) – Cảnh báo nổi bật**:
   - **Ý nghĩa**: Đơn hàng đã được ghi nhận thanh toán thành công và cấp quyền truy cập đầy đủ (nhờ cơ chế transaction "đã thanh toán ⇔ đã cấp quyền"). Tuy nhiên, tiến trình gửi email kích hoạt/đặt lịch ban đầu gặp trục trặc mạng hoặc timeout.
   - **Việc Hana cần làm**:
     - Mở chi tiết đơn hàng trong CMS Admin.
     - Khung **Thao tác đơn hàng (Chủ sở hữu)** ở bên phải sẽ xuất hiện nút màu hồng **✉️ Gửi lại email xác nhận**.
     - Hana bấm nút này và chọn **Đồng ý gửi lại email**. Hệ thống sẽ gửi lại email kích hoạt/đặt lịch cho khách hàng và tự động cập nhật trạng thái giao hàng thành **Đã gửi email** (nút sẽ tự ẩn đi). Không lo bị cấp quyền 2 lần.

8. **Đơn đã được xác nhận tay trước đó (`confirmed_manually_before`)**:
   - Hana đã bấm **✓ Xác nhận thanh toán** trước khi SePay báo về. Bình thường, không cần làm gì (nhưng nếu ngân hàng có 2 khoản tiền cho cùng mã đơn thì liên hệ khách).

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

1. Ở cột menu bên trái, tìm nhóm **Khóa Habit**, bấm vào **Câu hỏi chẩn đoán**.
2. Bấm vào câu hỏi bạn muốn chỉnh sửa.
3. Bạn có thể sửa:
   - **Nội dung câu hỏi**: Tình huống độc giả tự chấm điểm (ví dụ: _Tôi thường trì hoãn khi không biết bắt đầu từ đâu_).
   - **Giai đoạn**: Gắn vào 1 trong 4 giai đoạn vòng lặp (_Cue - Gợi ý_, _Craving - Khao khát_, _Response - Phản hồi_, _Reward - Phần thưởng_).
   - **Gợi ý**: Đoạn văn bản gợi ý giải pháp ấm áp từ Hana hiển thị khi độc giả có điểm kẹt ở giai đoạn này.
4. Bấm **Lưu** hoặc **Xuất bản**. Bài test ngoài website sẽ tự động cập nhật câu hỏi mới.

![Chỉnh sửa câu hỏi chẩn đoán quiz](images/huong-dan/24-cau-hoi-quiz-chan-doan.png)
<!-- ẢNH 24: trang <ĐỊA CHỈ DEMO>/admin/collections/diagnosticQuestions/[id], form nhập nội dung câu hỏi và gợi ý rich text -->

---

### 9.2. Habit Loop 5 phút và trang Habit Tracker (Giai đoạn 2)

**Mục đích**: Quản lý nội dung cho công cụ thiết kế thói quen `/habit/5-phut` và trang giới thiệu khóa học Habit Tracker số `/habit/1-percent-better`.

**Cách thực hiện**:

1. **Quản lý danh sách kỹ thuật thực chiến (`techniques`)**:
   - Ở cột menu bên trái, tìm nhóm **Khóa Habit**, bấm vào **Kỹ thuật thực hành**.
   - Hana có thể thêm mới hoặc sửa tên, cách thực hiện, ví dụ và gán vào 1 trong 4 giai đoạn (_Cue - Gợi ý_, _Craving - Khao khát_, _Response - Phản hồi_, _Reward - Phần thưởng_). Các kỹ thuật đã xuất bản sẽ tự động hiển thị trong Bước 3 của công cụ Habit Loop 5 phút.

2. **Cập nhật giá và câu hỏi thường gặp (FAQ) cho Habit Tracker số**:
   - Vào **Bán hàng** -> **Sản phẩm**, tìm sản phẩm có tên **Habit Tracker số (Habit Hack 1% Better)** (slug cố định là `habit-tracker-so` – xin lưu ý **không thay đổi ô slug** này vì mã nguồn dùng để nhận diện).
   - Hana có thể tự do điều chỉnh: **Giá bán**, **Giá ưu đãi**, **Số ngày dùng thử** (mặc định 21 ngày), danh sách **Bao gồm** (`includes`) và các câu hỏi thường gặp (**FAQ**). Trang ngoài website `/habit/1-percent-better` sẽ tự động cập nhật ngay lập tức. Số lượng video và số kỹ thuật hiển thị trên trang được hệ thống đếm tự động theo các bài giảng và kỹ thuật đã xuất bản.

3. **Xem kết quả độc giả gửi về**:
   - **Kế hoạch thói quen**: Vào **Khóa học** -> **Kế hoạch thói quen** (`habitPlans`) để xem bảng điểm thói quen, câu định danh và các kỹ thuật mà độc giả đã tự thiết kế.
   - **Khách tiềm năng**: Với những độc giả để lại email để nhận link Zalo đồng hành, hệ thống sẽ tự động lưu vào **Khách hàng** -> **Khách tiềm năng** (`leads`) với thẻ gắn nhãn `habit-loop` để Hana tiện theo dõi và chăm sóc.

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
