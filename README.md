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



