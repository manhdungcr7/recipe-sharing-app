Recipe Sharing Application - Ứng dụng Chia sẻ Công thức Nấu ăn\n
Ứng dụng web cho phép người dùng đăng, tìm kiếm, lưu và chia sẻ công thức nấu ăn với cộng đồng.

Mô tả dự án
Recipe Sharing là một nền tảng trực tuyến giúp người dùng:

Tìm kiếm và khám phá công thức nấu ăn
Đăng và chia sẻ công thức cá nhân
Lưu các công thức yêu thích
Tương tác với cộng đồng qua bình luận và đánh giá
Quản lý tài khoản và theo dõi người dùng khác
Cấu trúc dự án
Dự án gồm hai phần chính:

1. Frontend (recipe-sharing-app)
Xây dựng với React.js
Giao diện người dùng và quản trị viên
Tương tác với API từ backend
2. Backend (recipe-sharing-backend)
Xây dựng với Node.js/Express
RESTful API
Xử lý authentication, uploads và database
Tính năng chính
Người dùng
Đăng ký/Đăng nhập: Tài khoản thông thường và Google OAuth
Quản lý hồ sơ: Cập nhật thông tin, đổi avatar
Công thức: Đăng, chỉnh sửa, lưu nháp, xuất bản
Tương tác: Thích, lưu, bình luận, chia sẻ công thức
Tìm kiếm: Tìm kiếm công thức theo từ khóa, danh mục
Theo dõi: Theo dõi người dùng khác, nhận thông báo khi có bài đăng mới
Xuất PDF: Xuất công thức dưới dạng PDF
Báo cáo: Báo cáo nội dung không phù hợp
Quản trị viên
Dashboard: Tổng quan về hệ thống
Quản lý người dùng: Xem, chỉnh sửa, khóa tài khoản
Quản lý công thức: Duyệt, từ chối, xóa công thức
Quản lý báo cáo: Xử lý báo cáo từ người dùng
Phản hồi tin nhắn: Tương tác với người dùng
Công nghệ sử dụng
Frontend
React.js
React Router
CSS (custom styling)
Fetch API
Backend
Node.js
Express
MySQL
JWT Authentication
Multer (file uploads)
PDFKit (xuất file PDF)
Cài đặt và chạy dự án
Yêu cầu hệ thống
Node.js (v14+)
MySQL (v8+)
NPM hoặc Yarn
