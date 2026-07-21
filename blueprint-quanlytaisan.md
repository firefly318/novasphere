# BLUEPRINT THIẾT KẾ HỆ THỐNG QUẢN LÝ CƠ SỞ VẬT CHẤT KHÁCH SẠN

Hệ thống quản lý tập trung tài sản, vật tư khách sạn theo thời gian thực, áp dụng kiến trúc Clean Architecture, sử dụng SQL Server và Stored Procedures làm nhân tố xử lý dữ liệu cốt lõi.

---

## 1. KIẾN TRÚC HỆ THỐNG & ĐỊNH HƯỚNG CÔNG NGHỆ

### 1.1 Sơ đồ kiến trúc (Clean Architecture)
Trong mô hình này, toàn bộ các thao tác Đọc/Ghi dữ liệu phức tạp, tính toán số lượng tồn kho, kiểm tra ràng buộc dữ liệu sẽ được đẩy xuống lớp **SQL Server Stored Procedures** để tối ưu hiệu năng. Lớp Infrastructure đóng vai trò như một "Proxy" gọi các Procedure này.

* **Domain Layer:** Định nghĩa các Entity (Vật tư, Phiếu nhập, Phiếu xuất) và các Interface Repository (`IMaterialRepository`, `IInventoryRepository`).
* **Application Layer:** Chứa các Use Cases điều phối luồng nghiệp vụ.
* **Infrastructure Layer:** Sử dụng thư viện kết nối (ví dụ: `mssql` trong Node.js hoặc `ADO.NET / Entity Framework Core` trong .NET) để thực thi các Stored Procedures từ SQL Server.
* **Presentation Layer:** REST API endpoints và kết nối WebSocket để đẩy dữ liệu thời gian thực lên giao diện Web (React/Next.js).
// tạo thư mục tên .agent trong thư mục gốc . Trong thư mục .agent tạo file agent.md chưa các quy tắc 
### 1.2 Stack công nghệ thực tế (Cập nhật)
* **Database:** SQL Server 2014 (Đảm bảo tính toàn vẹn dữ liệu bằng Transaction và Stored Procedures).
* **Backend Framework:** Node.js với Express.js (Sử dụng thư viện `mssql` để kết nối và gọi Stored Procedures).
* **Frontend Framework:** React.js (Vite) + Tailwind CSS + Recharts + Lucide-react.
* **Real-time Communication:** Chờ tích hợp WebSockets (định hướng áp dụng đẩy cảnh báo từ Database lên Dashboard).
    
# 3. CHI TIẾT CÁC MODULE VÀ MÔ TẢ HOẠT ĐỘNG CHỨC NĂNG

## MODULE 1: QUẢN LÝ HỆ THỐNG VÀ PHÂN QUYỀN (AUTH MODULE) 
// thêm chức năng phân quyền động (theo bitfield) 

### 1. Đăng nhập hệ thống
* **Mô tả hoạt động:** Người dùng nhập `Username` và `Password` trên giao diện Web. Hệ thống gọi API gửi thông tin về Backend. Backend thực thi Stored Procedure `sp_User_Login` để lấy thông tin tài khoản và chuỗi mật khẩu đã hash. Backend kiểm tra mật khẩu bằng thư viện (như `bcrypt`). Nếu khớp, hệ thống tạo mã mã hóa JWT Token (chứa thông tin ID và Quyền - Role) trả về cho Client để lưu vào `LocalStorage`/`Cookie`.
* **Cơ chế lưu trữ:** Bảng `Users`, `Roles`.

### 2. Đăng xuất
* **Mô tả hoạt động:** Client xóa JWT Token khỏi bộ nhớ trình duyệt và gửi yêu cầu đăng xuất lên hệ thống để đưa Token cũ vào danh sách đen (Blacklist) trong `Redis` (nếu có) nhằm ngăn chặn tái sử dụng.

### 3. Đổi mật khẩu
* **Mô tả hoạt động:** Người dùng nhập *Mật khẩu cũ*, *Mật khẩu mới* và *Xác nhận mật khẩu mới*. API tiếp nhận, xác thực Token của người dùng hiện tại, mã hóa mật khẩu mới và gọi Stored Procedure `sp_User_ChangePassword` để cập nhật vào cơ sở dữ liệu SQL Server.

### 4. Phân quyền người dùng
* **Mô tả hoạt động:** Quản trị viên (Admin) gán quyền (Quản trị viên, Nhân viên kho) cho các tài khoản thông qua giao diện quản lý. Hoạt động này gọi Stored Procedure `sp_User_UpdateRole`. Khi người dùng thực hiện bất kỳ hành động nào, một Middleware tại Backend sẽ giải mã JWT Token, kiểm tra quyền hạn trước khi cho phép gọi vào các Stored Procedure nghiệp vụ.
### 5.Phân quyền động theo bitfield (Admin reset mật khẩu cho user khi user quên mk cũ)
* **Mô tả hoạt động:** User và Quản Lý kho báo cho admin khi quên mật khẩu và admin sẽ reset lại mật khẩu

---

## MODULE 2: QUẢN LÝ LOẠI VẬT TƯ (CATEGORIES MODULE)
** Tìm kiếm, phân trang, sx và lọc dữ liệu bằng component

### 1. Thêm loại vật tư
* **Mô tả hoạt động:** Nhân viên nhập tên loại vật tư (Ví dụ: *Đồ tiêu hao*, *Thiết bị điện tử*, *Vải vóc*). Hệ thống gọi Stored Procedure `sp_Category_Insert`. Tự động kiểm tra trùng tên, nếu trùng sẽ trả về lỗi `5001 - Tên loại vật tư đã tồn tại`. Nếu hợp lệ, trả về ID loại vật tư mới tạo.

### 2. Cập nhật loại vật tư
* **Mô tả hoạt động:** Người dùng chọn loại vật tư cần sửa, thay đổi thông tin và nhấn Lưu. Hệ thống gọi Stored Procedure `sp_Category_Update`. Procedure thực hiện lệnh `UPDATE` dựa trên `CategoryId` được truyền vào.

### 3. Xóa loại vật tư
* **Mô tả hoạt động:** Người dùng nhấn Xóa. Hệ thống gọi Stored Procedure `sp_Category_Delete`.
* **Quy tắc kiểm tra nghiệp vụ:** Procedure sẽ kiểm tra xem loại vật tư này có đang chứa vật tư nào không:

    IF EXISTS (SELECT 1 FROM Materials WHERE CategoryId = @Id)

  Nếu có, chặn không cho xóa và trả về thông báo lỗi ràng buộc dữ liệu. Nếu không, tiến hành xóa hoặc chuyển trạng thái ẩn (`IsDeleted = 1`).

### 4. Tìm kiếm loại vật tư
* **Mô tả hoạt động:** Người dùng nhập từ khóa tìm kiếm trên giao diện. Hệ thống gọi Stored Procedure `sp_Category_Search` với tham số `@Keyword`. Thao tác dùng mệnh đề `LIKE N'%' + @Keyword + '%'` để lọc dữ liệu và trả về danh sách kết quả dạng JSON cho Frontend hiển thị.

---


## MODULE 3: QUẢN LÝ VẬT TƯ (MATERIALS MODULE)

### 1. Thêm vật tư mới
* **Mô tả hoạt động:** Người dùng nhập thông tin vật tư (*Tên*, *Mã vật tư*, *Đơn vị tính*, *Hạn mức tồn tối thiểu*, *ID Loại vật tư*). Hệ thống gọi Stored Procedure `sp_Material_Insert`. Số lượng tồn kho ban đầu mặc định gán bằng 0.

### 2. Cập nhật thông tin vật tư
* **Mô tả hoạt động:** Người dùng thay đổi thông tin chi tiết của vật tư (trừ số lượng tồn kho) và lưu lại. Hệ thống gọi Stored Procedure `sp_Material_Update` để đồng bộ dữ liệu vào bảng `Materials`.

### 3. Xóa vật tư
* **Mô tả hoạt động:** Thực thi Stored Procedure `sp_Material_Delete`. Procedure kiểm tra xem vật tư này đã từng có lịch sử nhập/xuất kho chưa. Nếu đã có, hệ thống không xóa vật lý (gây lỗi toàn vẹn dữ liệu) mà cập nhật trạng thái `IsActive = 0` (Ngừng kinh doanh/Sử dụng).

### 4. Tra cứu vật tư
* **Mô tả hoạt động:** Giao diện cho phép lọc vật tư theo Loại, Trạng thái, hoặc Tìm kiếm theo tên/mã. Hệ thống gọi Stored Procedure `sp_Material_GetList` hỗ trợ Phân trang (Pagination) trực tiếp từ SQL Server bằng cú pháp `OFFSET ... FETCH NEXT ...` để tối ưu hóa tốc độ tải dữ liệu khi danh mục vật tư lên đến hàng ngàn mã.

### 5. Theo dõi số lượng tồn kho
* **Mô tả hoạt động:** Chức năng xem nhanh (Read-only). Hệ thống gọi Stored Procedure `sp_Material_GetStockBalance` để lấy ra số lượng tồn kho hiện tại của một hoặc tất cả vật tư tại thời điểm truy vấn.
### 6. Phân trang cho các Danh sách loại vật tư 
### 7. Sắp xếp Danh sách các loại vật tư theo tùy chọn A-Z hoặc theo số lượng tồn kho tăng hoặc giảm

---
## MODULE 4: QUẢN LÝ NHÀ CUNG CẤP (SUPPLIERS MODULE)

### 1. Thêm nhà cung cấp mới
* **Mô tả hoạt động:** Người dùng nhập thông tin nhà cung cấp (Tên công ty, Người liên hệ, Điện thoại, Email, Địa chỉ). Hệ thống thực thi Stored Procedure `sp_Supplier_Insert` để lưu vào bảng `Suppliers`.

### 2. Cập nhật và Xóa nhà cung cấp
* **Mô tả hoạt động:** Quản lý thay đổi thông tin qua `sp_Supplier_Update`. Khi xóa (`sp_Supplier_Delete`), hệ thống kiểm tra nếu nhà cung cấp đã từng có giao dịch Nhập kho (ràng buộc với `GoodsReceiptNotes`) thì chỉ đổi trạng thái `IsActive = 0` (Ngừng hợp tác) để bảo toàn dữ liệu lịch sử.

### 3. Tra cứu lịch sử giao dịch
* **Mô tả hoạt động:** Tra cứu danh sách nhà cung cấp qua `sp_Supplier_GetList`. Hiển thị thêm các Phiếu nhập kho đã thực hiện với từng nhà cung cấp để nhân viên dễ dàng đối chiếu, liên hệ bảo hành hoặc đặt hàng lại.

------
------
## MODULE 5: QUẢN LÝ PHIẾU NHẬP KHO (INVENTORY-GRN MODULE)

### 1. Lập phiếu nhập kho
* **Mô tả hoạt động:** Nhân viên kho chọn nhà cung cấp, thêm danh sách các vật tư cần nhập cùng số lượng và đơn giá nhập tương ứng. Nhấn *"Hoàn tất nhập kho"*.
* **Quy trình xử lý Transaction tại SQL Server:** Hệ thống gọi Stored Procedure `sp_GRN_Create` kèm một cấu trúc dữ liệu bảng (Table-Valued Parameter - TVP) chứa danh sách vật tư chi tiết.
    * **Bước 1:** Khởi chạy `BEGIN TRANSACTION`.
    * **Bước 2:** Thêm 1 dòng vào bảng `GoodsReceiptNotes`, sinh ra `GRN_Code`.
    * **Bước 3:** Duyệt vòng lặp chèn danh sách vật tư vào bảng `GRN_Details`.
    * **Bước 4:** Tự động cập nhật: Cộng dồn số lượng nhập vào cột `StockQuantity` trong bảng `Materials` tương ứng với từng mã vật tư.
    * **Bước 5:** Nếu không có lỗi, thực thi `COMMIT TRANSACTION`. Nếu lỗi, `ROLLBACK TRANSACTION`.

### 2. Xem lịch sử nhập kho & In phiếu
* **Mô tả hoạt động:** Người dùng bấm xem chi tiết hoặc bấm In phiếu. Hệ thống gọi Stored Procedure `sp_GRN_GetDetail(@GRN_Id)`. Procedure sử dụng lệnh `INNER JOIN` giữa bảng phiếu nhập, bảng chi tiết phiếu nhập, nhà cung cấp và thông tin nhân viên lập để trả ra một bộ dữ liệu đầy đủ. Frontend tiếp nhận và định dạng thành file PDF để in ấn.

---

## MODULE 6: QUẢN LÝ PHIẾU XUẤT KHO (INVENTORY-GDN MODULE)

### 1. Lập phiếu xuất kho
* **Mô tả hoạt động:** Nhân viên kho chọn bộ phận nhận vật tư (ví dụ: *Bộ phận Buồng phòng*, *Bộ phận Nhà hàng*), chọn danh sách vật tư và số lượng cần xuất.
* **Quy trình xử lý Transaction tại SQL Server:** Hệ thống gọi Stored Procedure `sp_GDN_Create` kèm danh sách vật tư dạng TVP.
    * **Bước 1:** Khởi chạy `BEGIN TRANSACTION`.
    * **Bước 2:** Duyệt danh sách vật tư đầu vào, kiểm tra điều kiện tồn kho: 
    
        IF (Số lượng tồn hiện tại < Số lượng yêu cầu xuất)
    
      Nếu có bất kỳ vật tư nào không đủ hàng, lập tức hủy bỏ lệnh (`ROLLBACK`) và trả về mã lỗi cụ thể (Ví dụ: *Không đủ số lượng xuất cho vật tư X*).
    * **Bước 3:** Thêm dữ liệu vào bảng `GoodsDeliveryNotes` và `GDN_Details`.
    * **Bước 4:** Tự động cập nhật: Trừ bớt số lượng xuất vào cột `StockQuantity` trong bảng `Materials`.
    * **Bước 5:** Thực thi `COMMIT TRANSACTION`.

### 2. Theo dõi lịch sử xuất kho & In phiếu
* **Mô tả hoạt động:** Tương tự module nhập kho, hệ thống gọi Stored Procedure `sp_GDN_GetDetail` để lấy toàn bộ thông tin lịch sử xuất, thông tin người nhận, lý do xuất kho phục vụ công tác đối soát dữ liệu và in ấn chứng từ giấy.

---

## MODULE 7: QUẢN LÝ TỒN KHO VÀ KIỂM KÊ (STOCKTAKE MODULE) - Quy trình kiểm kê 

### 1. Theo dõi số lượng tồn kho hiện tại
* **Mô tả hoạt động:** Màn hình hiển thị danh sách toàn bộ vật tư kèm cột số lượng tồn thực tế. Dữ liệu được tải thông qua Stored Procedure `sp_Stock_GetInventoryReport` chạy trực tiếp từ bảng `Materials`.

### 2. Tạo phiếu kiểm kê vật tư
* **Mô tả hoạt động:** Định kỳ (hàng tháng/quý), nhân viên kho đi đếm số lượng thực tế. Trên hệ thống, tạo một Phiếu kiểm kê. Nhân viên nhập *"Số lượng thực tế đếm được"* đối chiếu với *"Số lượng hệ thống đang tính"*.
* **Xử lý tại SQL Server:** Gọi Stored Procedure `sp_Stocktake_Create`. Procedure tính toán khoản chênh lệch: `Chênh lệch = Số lượng thực tế - Số lượng hệ thống`.
    * Nếu có chênh lệch, hệ thống ghi nhận vào bảng `Stocktake_Details`. // k auto cập nhập, có note tên người chỉnh sửa 
    * Đồng thời, tự động cập nhật lại cột `StockQuantity` trong bảng `Materials` về đúng con số thực tế đếm được để đồng bộ lại hệ thống, kèm theo ghi chú lý do hao hụt/dư thừa.

---

## MODULE 8: QUẢN LÝ BẢO TRÌ TÀI SẢN (MAINTENANCE MODULE)

### 1. Tạo yêu cầu báo hỏng / Lịch bảo trì
* **Mô tả hoạt động:** Khi tài sản/thiết bị gặp sự cố hoặc tới hạn bảo trì định kỳ, nhân viên tạo phiếu Yêu cầu bảo trì (Dự kiến lưu bảng `Maintenance_Tickets`). Bao gồm thông tin: Thiết bị cần sửa, Mô tả lỗi, Mức độ khẩn cấp, Ngày báo.

### 2. Cập nhật tiến độ xử lý
* **Mô tả hoạt động:** Nhân viên kỹ thuật tiếp nhận phiếu, chuyển trạng thái sang *Đang xử lý*. Khi sửa xong, gọi Stored Procedure (như `sp_Maintenance_UpdateStatus`) để chuyển sang *Đã hoàn thành* và nhập chi tiết kết quả.
* **Tích hợp xuất kho:** Nếu quá trình sửa chữa cần thay thế linh kiện (vật tư trong kho), hệ thống cho phép lập Phiếu xuất kho (GDN) gắn liền với mã Phiếu bảo trì này, giúp theo dõi chính xác lượng vật tư tiêu hao cho mục đích sửa chữa.

### 3. Cảnh báo bảo trì định kỳ (Smart Alert)
* **Mô tả hoạt động:** Hệ thống định kỳ quét các tài sản có chu kỳ bảo trì (ví dụ: máy lạnh 6 tháng/lần). Khi sắp đến hạn, tự động đẩy cảnh báo nhắc nhở lên Dashboard (thông qua cơ chế Real-time/WebSocket như Module 7) để quản lý chủ động lên kế hoạch.

------

## MODULE 9: BÁO CÁO VÀ CẢNH BÁO THÔNG MINH (AI-ANALYTICS MODULE) - Groq

### 1. Thống kê nhập/xuất/tồn kho theo thời gian
* **Mô tả hoạt động:** Người dùng chọn khoảng thời gian (Từ ngày - Đến ngày). Hệ thống gọi Stored Procedure `sp_Report_GetTraffic` sử dụng hàm `SUM()` và mệnh đề `GROUP BY` theo ngày/tháng để trả về mảng dữ liệu chuỗi thời gian. Backend định dạng lại dữ liệu thành cấu trúc JSON dạng *Chart-ready* để các thư viện đồ họa ở Frontend (như `Chart.js` hoặc `Recharts`) vẽ biểu đồ đường hoặc biểu đồ cột trực quan.

### 2. Thống kê vật tư sử dụng nhiều nhất
* **Mô tả hoạt động:** Gọi Stored Procedure `sp_Report_GetTopMovingMaterials`. Sử dụng cú pháp `SELECT TOP 10 ... SUM(Quantity) ... GROUP BY ... ORDER BY SUM(Quantity) DESC` để tìm ra 10 mặt hàng có lượng tiêu thụ lớn nhất, giúp khách sạn lên kế hoạch mua sắm trước.

### 3. AI Tự động phát hiện và cảnh báo vật tư sắp hết (Real-time Dashboard)
* **Mô tả hoạt động:** Hệ thống chạy một Background Job (được cấu hình bằng `SQL Server Agent` hoặc `Cron-job` ở Backend) định kỳ kích hoạt Stored Procedure `sp_AI_DetectLowStock`.
    * Procedure so sánh `StockQuantity` với `MinRequiredQuantity` (Hạn mức tồn tối thiểu) của từng vật tư.
    * Nếu có vật tư chạm ngưỡng nguy hiểm, hệ thống sẽ chèn thông tin vào bảng `System_Alerts` và phát ra một Event.
    * Backend nhận Event này và thông qua `WebSocket` lập tức đẩy một thông báo pop-up nhấp nháy màu đỏ lên màn hình Dashboard của Nhân viên kho và Quản lý mà không cần họ phải tải lại trang.

### 4. AI Phát hiện vật tư ít được sử dụng (Hàng tồn kho tồn đọng)
* **Mô tả hoạt động:** Hệ thống gọi Stored Procedure `sp_AI_GetStagnantMaterials`. Thuật toán SQL kiểm tra trong bảng lịch sử `GDN_Details` (Xuất kho) trong vòng 90 ngày gần nhất. Nếu mã vật tư nào có số lượng xuất bằng 0 hoặc rất thấp so với lượng tồn kho hiện tại, nó sẽ phân loại vào nhóm *"Vật tư tồn đọng"*, hiển thị cảnh báo trên Dashboard nhằm giúp khách sạn ngừng nhập hàng, tránh giam vốn lưu động.

---



---

