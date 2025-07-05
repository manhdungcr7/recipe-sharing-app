# 🍽️ Recipe Sharing Application - Ứng dụng Chia sẻ Công thức Nấu ăn

Một ứng dụng web cho phép người dùng đăng, tìm kiếm, lưu và chia sẻ công thức nấu ăn với cộng đồng.

---

## 📌 Mô tả dự án

**Recipe Sharing** là một nền tảng trực tuyến nơi người dùng có thể:

- 🔍 Tìm kiếm và khám phá công thức nấu ăn
- 📝 Đăng và chia sẻ công thức cá nhân
- ❤️ Lưu các công thức yêu thích
- 💬 Tương tác với cộng đồng qua bình luận và đánh giá
- 👤 Quản lý tài khoản và theo dõi người dùng khác

---

## 📁 Cấu trúc dự án

Dự án gồm 2 phần chính:

### 1. Frontend (`recipe-sharing-app`)
- Sử dụng **React.js**
- Cung cấp giao diện người dùng và quản trị viên
- Giao tiếp với backend qua RESTful API

### 2. Backend (`recipe-sharing-backend`)
- Sử dụng **Node.js / Express**
- Triển khai **RESTful API**
- Xử lý xác thực, upload và tương tác với cơ sở dữ liệu

---

## ✨ Tính năng chính

### 👥 Người dùng

- **Đăng ký / Đăng nhập**:
  - Tài khoản thông thường (email & mật khẩu)
  - Đăng nhập bằng Google OAuth
- **Quản lý hồ sơ**:
  - Cập nhật thông tin cá nhân
  - Thay đổi ảnh đại diện
- **Công thức**:
  - Đăng, chỉnh sửa, lưu nháp và xuất bản công thức
  - Xuất công thức dưới dạng PDF
- **Tương tác**:
  - Thích, lưu, chia sẻ và bình luận trên công thức
- **Tìm kiếm**:
  - Theo từ khóa hoặc danh mục
- **Theo dõi người dùng**:
  - Nhận thông báo khi người theo dõi đăng bài mới
- **Báo cáo vi phạm**:
  - Gửi báo cáo nội dung không phù hợp

### 🛠️ Quản trị viên

- **Dashboard**: Tổng quan hệ thống
- **Quản lý người dùng**:
  - Xem danh sách người dùng, khóa tài khoản, cập nhật thông tin
- **Quản lý công thức**:
  - Duyệt, từ chối, hoặc xóa bài viết
- **Quản lý báo cáo**:
  - Xử lý báo cáo vi phạm từ người dùng
- **Phản hồi người dùng**:
  - Gửi tin nhắn/nhắc nhở từ admin

---

## 🛠️ Công nghệ sử dụng

### Frontend

- [React.js](https://reactjs.org/)
- React Router
- CSS (tuỳ chỉnh)
- Fetch API

### Backend

- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [MySQL](https://www.mysql.com/)
- JWT (Xác thực người dùng)
- Multer (Upload ảnh)
- PDFKit (Xuất file PDF)

---

## ⚙️ Cài đặt và chạy dự án

### Yêu cầu hệ thống

- Node.js v14 trở lên
- MySQL v8 trở lên
- NPM hoặc Yarn

## ⚙️ Cài đặt và chạy dự án

### ✅ Yêu cầu hệ thống

- Node.js v14 trở lên  
- MySQL v8 trở lên  
- NPM hoặc Yarn

---

### 🧪 Các bước cài đặt

```bash
🔹 Bước 1: Cài đặt Backend
cd recipe-sharing-backend
npm install
🔹 Bước 2: Cấu hình Database
Tạo cơ sở dữ liệu MySQL:

sql
Sao chép
Chỉnh sửa
CREATE DATABASE recipe_sharing;
Import dữ liệu từ file db-init.sql:

bash
Sao chép
Chỉnh sửa
# Dùng MySQL CLI hoặc công cụ như phpMyAdmin
source path/to/db-init.sql
🔹 Bước 3: Cấu hình Environment Variables
Tạo file .env trong thư mục recipe-sharing-backend với nội dung sau:

env
Sao chép
Chỉnh sửa
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=recipe_sharing
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
🔐 Lưu ý: Không commit file .env lên Git để bảo mật thông tin nhạy cảm.

🔹 Bước 4: Cài đặt Frontend
bash
Sao chép
Chỉnh sửa
cd recipe-sharing-app
npm install
🔹 Bước 5: Chạy ứng dụng
▶️ Backend:
bash
Sao chép
Chỉnh sửa
cd recipe-sharing-backend
npm run dev
Server sẽ chạy tại http://localhost:5000

▶️ Frontend:
bash
Sao chép
Chỉnh sửa
cd recipe-sharing-app
npm start
Ứng dụng React sẽ khởi động tại http://localhost:3000



