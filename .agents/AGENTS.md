# Quy tắc phát triển dự án Quản lý vật tư khách sạn (Nova Sphere Hotel & Inventory)

Tài liệu này chứa các quy tắc thiết kế hệ thống, kiến trúc và quy chuẩn phát triển phần mềm được áp dụng nhất quán cho toàn bộ dự án.

---

## 1. Stack công nghệ & Kiến trúc
* **Database**: SQL Server.
* **Backend**: Node.js với Express.js.
* **Frontend**: React.js (Vite) + Tailwind CSS + Lucide-react.
* **Mô hình kiến trúc**: Tuân thủ Clean Architecture. Toàn bộ logic nghiệp vụ phức tạp, tính toán tồn kho, kiểm tra ràng buộc phải được xử lý ở lớp Database bằng các **Stored Procedures**. Backend chỉ đóng vai trò Proxy/Controller gọi Stored Procedure thông qua `.execute()`.

---

## 2. Quy chuẩn phát triển Database & API
* **Stored Procedures**: Toàn bộ thao tác CRUD và nghiệp vụ đều phải đóng gói vào Stored Procedure. Không viết câu lệnh SQL inline trực tiếp trong Router của Backend.
* **Bảo toàn dữ liệu**: Khi xóa vật tư hoặc danh mục đã có lịch sử giao dịch, không xóa vật lý (gây lỗi khóa ngoại) mà cập nhật cột trạng thái `IsActive = 0`.
* **SQL Script đồng bộ**: Mọi thay đổi về cấu trúc bảng, index hoặc Stored Procedure mới phải được cập nhật đầy đủ vào tệp tin SQL chính `HotelMaterial.sql` nằm ở thư mục gốc của dự án.

---

## 3. Phân quyền người dùng & Bảo mật
* **Phân quyền động theo Bitfield**: Sử dụng cột `Permissions` kiểu số nguyên (`INT`) trong bảng `Users` đại diện cho mặt nạ bit quyền hạn:
  * **Bit 1 (`0001`b / Value 1)**: Quyền xem danh sách, chi tiết (`VIEW`).
  * **Bit 2 (`0010`b / Value 2)**: Quyền tạo mới dữ liệu (`CREATE`).
  * **Bit 4 (`0100`b / Value 4)**: Quyền sửa đổi dữ liệu (`EDIT`).
  * **Bit 8 (`1000`b / Value 8)**: Quyền quản trị đặt lại mật khẩu tài khoản khác (`RESET_PASSWORD`).
* **Kiểm tra quyền ở Backend**: Sử dụng phép toán logic bitwise `&` trên thuộc tính `req.user.permissions` để xác thực quyền (ví dụ: `if (!(req.user.permissions & 8)) return 403`).
* **Bảo mật thông tin**: Tuyệt đối không ghi nhật ký (log) thông tin mật khẩu thô của người dùng ra console/terminal.

---

## 4. Quy chuẩn Giao diện (Frontend UI/UX)
* **Giao diện đồng bộ**: Sử dụng phong cách thẩm mỹ cao cấp, màu sắc chủ đạo là xanh dương/navy (`sky-600`, `teal-900`), bo góc tròn mượt mà, hỗ trợ phản hồi hover sinh động.
* **Phân trang & Lọc dữ liệu**: Thực hiện phân trang (Pagination), tìm kiếm và sắp xếp dữ liệu (A-Z, tồn kho từ thấp-cao, cao-thấp) bằng React component tại client để đạt tốc độ phản hồi tối ưu và nhẹ tải cho cơ sở dữ liệu.
* **Reset mật khẩu**: Thiết kế giao diện reset mật khẩu tự động tạo chuỗi ký tự ngẫu nhiên đạt độ phức tạp an toàn, tích hợp nút Sao chép (Copy) nhanh và nút Tạo lại (Regenerate) mật khẩu.
