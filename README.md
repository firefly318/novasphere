# WebApp Quản Lý Cơ Sở Vật Chất Khách Sạn

> Hệ thống quản lý vật tư, kiểm kê kho, nhập xuất hàng hóa và báo cáo thông minh dành cho khách sạn — **Nova Sphere Hotel & Inventory System**.

---

## 👤 Thông Tin Nhóm

| Họ và Tên | MSSV | Vai Trò |
|---|---|---|
| Hoàng Thị Thúy Diễm | 725000005 | Thiết kế & Lập trình toàn bộ hệ thống |

---

## 🛠️ Tech Stack

| Tầng | Công nghệ |
|---|---|
| **Frontend** | React.js (Vite) + Tailwind CSS + Lucide React |
| **Backend** | Node.js + Express.js |
| **Database** | Microsoft SQL Server |
| **AI/Analytics** | Groq API (Llama 3) |
| **Authentication** | JWT (JSON Web Token) + Bcrypt |
| **Architecture** | Clean Architecture — Stored Procedures |

---

## 📁 Cấu Trúc Thư Mục

```
├── frontend/          # Mã nguồn giao diện (React + Vite)
├── backend/           # Mã nguồn xử lý logic & API (Node.js + Express)
├── docs/              # Báo cáo đề tài và slide thuyết trình
├── HotelMaterial.sql  # Script khởi tạo cơ sở dữ liệu SQL Server
└── README.md
```

---

## ⚙️ Hướng Dẫn Triển Khai

### Yêu Cầu Môi Trường

- [Node.js](https://nodejs.org/) v18 trở lên
- [Microsoft SQL Server](https://www.microsoft.com/en-us/sql-server) 2014 trở lên
- [SQL Server Management Studio (SSMS)](https://aka.ms/ssmsfullsetup)

---

### Bước 1 — Khởi Tạo Cơ Sở Dữ Liệu

1. Mở **SQL Server Management Studio (SSMS)**
2. Kết nối vào SQL Server instance của bạn
3. Mở file `HotelMaterial.sql` và chạy toàn bộ script
4. Cơ sở dữ liệu `HotelMaterialDB` sẽ được tạo tự động

---

### Bước 2 — Cấu Hình Backend

```bash
cd backend
npm install
```

Tạo file `.env` trong thư mục `backend/` với nội dung:

```env
PORT=5000
DB_SERVER=localhost
DB_NAME=HotelMaterialDB
DB_USER=sa
DB_PASSWORD=your_sql_password
JWT_SECRET=your_jwt_secret_key
GROQ_API_KEY=your_groq_api_key   # Tùy chọn — dùng cho AI Analytics
```

Chạy backend:

```bash
npm start
```

> Backend sẽ chạy tại: `http://localhost:5000`

---

### Bước 3 — Cấu Hình Frontend

```bash
cd frontend
npm install
npm run dev
```

> Frontend sẽ chạy tại: `http://localhost:5173`

---

### Bước 4 — Đăng Nhập Hệ Thống

| Thông tin | Giá trị mặc định |
|---|---|
| Tài khoản | `admin` |
| Mật khẩu | *(xem trong bảng `Users` sau khi chạy SQL script)* |

---

## 🚀 Tính Năng Chính

- ✅ Quản lý danh mục & vật tư khách sạn
- ✅ Nhập kho (GRN) / Xuất kho (GDN)
- ✅ Kiểm kê kho định kỳ
- ✅ Quản lý nhà cung cấp
- ✅ Bảo trì thiết bị
- ✅ Phân quyền người dùng theo Bitfield
- ✅ Báo cáo & cảnh báo thông minh (AI Analytics - Groq)
- ✅ Dashboard tổng quan real-time

---

## 📄 Tài Liệu

Xem thư mục [`/docs`](./docs/) để tìm báo cáo đề tài và slide thuyết trình.
