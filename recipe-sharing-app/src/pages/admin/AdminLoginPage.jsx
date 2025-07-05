import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { setAuthToken, setUser, clearAuth } from "../../utils/authHelper";

const AdminLoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, clearAuth } = useContext(AuthContext);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const res = await fetch("http://localhost:5000/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      
      if (res.ok && data.token && data.user) {
        console.log("Saving admin user data:", data.user);
        
        // Xóa dữ liệu cũ
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Lưu token và user đúng cách - ĐẢM BẢO USER LÀ OBJECT
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user)); // Quan trọng: JSON.stringify
        
        // Gọi hàm login với user là object
        login(data.user, data.token);
        
        // Chuyển hướng đến trang admin
        navigate("/admin/dashboard");
      } else {
        setError(data.message || "Đăng nhập thất bại");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Lỗi kết nối server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <h2>Đăng nhập Admin</h2>
        {error && <div className="error-message">{error}</div>}
        <input
          type="email"
          name="email"
          placeholder="Email admin"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Mật khẩu"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      {/* Thêm CSS inline nếu không có file AdminLoginPage.css */}
      <style jsx>{`
        .admin-login-page {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: #f8f9fa;
        }
        .admin-login-form {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          min-width: 320px;
        }
        .admin-login-form h2 {
          margin-bottom: 20px;
          text-align: center;
          color: #333;
        }
        .admin-login-form input {
          display: block;
          width: 100%;
          padding: 10px;
          margin-bottom: 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .admin-login-form button {
          width: 100%;
          padding: 10px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }
        .admin-login-form button:hover {
          background: #45a049;
        }
        .error-message {
          color: red;
          margin-bottom: 15px;
          font-size: 14px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default AdminLoginPage;