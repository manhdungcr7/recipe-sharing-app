import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import './LoginPage.css';

const LoginPage = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState(location.state?.error || '');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Kiểm tra xem có đến từ logout không
        const fromLogout = new URLSearchParams(window.location.search).get('from') === 'logout';
        
        // Nếu đến từ logout, đảm bảo localStorage đã được xóa
        if (fromLogout) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return;
        }
        
        const checkToken = async () => {
            const token = localStorage.getItem('auth_token');
            if (!token) return;
            
            try {
                // Thêm timeout để tránh treo
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                const response = await fetch('http://localhost:5000/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${token}` },
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                        // Token hợp lệ và có data, lưu vào context và chuyển hướng
                        localStorage.setItem('user', JSON.stringify(data.data));
                        login(data.data, token);
                        navigate('/dashboard');
                    } else {
                        // API trả về thành công nhưng không có data
                        clearAuth();
                    }
                } else {
                    // Token không hợp lệ, xóa localStorage
                    clearAuth();
                }
            } catch (err) {
                console.error("Auth check error:", err);
                clearAuth();
            }
        };
        
        // Hàm xóa tất cả dữ liệu xác thực
        const clearAuth = () => {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        };
        
        checkToken();
    }, [navigate, login]);

    // Xử lý đăng nhập Google thành công
    const handleGoogleLoginSuccess = async (response) => {
        setLoading(true);
        try {
            const result = await fetch('http://localhost:5000/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                // Thay đổi tên trường token thành tokenId để khớp với backend
                body: JSON.stringify({ tokenId: response.credential })
            });
            
            const data = await result.json();
            
            if (data.success) {
                // QUAN TRỌNG: Kiểm tra thông tin người dùng hiện tại trong localStorage
                const existingUserString = localStorage.getItem('user');
                if (existingUserString) {
                    try {
                        const existingUser = JSON.parse(existingUserString);
                        // Nếu cùng ID và tên khác nhau, giữ lại tên đã chỉnh sửa
                        if (existingUser.id === data.user.id && existingUser.name !== data.user.name) {
                            console.log("Preserving existing name:", existingUser.name);
                            data.user.name = existingUser.name;
                        }
                    } catch (error) {
                        console.error("Error parsing existing user:", error);
                    }
                }
                
                // Lưu token và thông tin đã cập nhật
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                login(data.user, data.token);
                navigate('/dashboard');
            } else {
                setError(data.message || 'Đăng nhập thất bại');
            }
        } catch (error) {
            console.error('Google login error:', error);
            setError('Có lỗi xảy ra khi đăng nhập');
        } finally {
            setLoading(false);
        }
    };

    // Xử lý lỗi đăng nhập Google
    const handleGoogleLoginError = () => {
        setError('Đăng nhập với Google thất bại, vui lòng thử lại');
        console.error("Google login failed");
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-left">
                    <div className="login-content">
                        <div className="logo-container">
                            <i className="fas fa-utensils"></i>
                            <h1>Recipe Sharing</h1>
                        </div>
                        
                        <h2>Đăng nhập</h2>
                        <p className="login-description">
                            Khám phá và chia sẻ công thức nấu ăn tuyệt vời với cộng đồng đam mê ẩm thực
                        </p>
                        
                        {error && (
                            <div className="error-message">
                                <i className="fas fa-exclamation-circle"></i>
                                {error}
                            </div>
                        )}
                        
                        <div className="google-login-wrapper">
                            {loading ? (
                                <div className="loading-spinner">
                                    <div className="spinner"></div>
                                    <p>Đang đăng nhập...</p>
                                </div>
                            ) : (
                                <GoogleLogin
                                    onSuccess={handleGoogleLoginSuccess}
                                    onError={handleGoogleLoginError}
                                    useOneTap
                                    theme="filled_blue"
                                    shape="rectangular"
                                    text="signin_with"
                                    locale="vi"
                                    width="100%"
                                />
                            )}
                        </div>
                        
                        <div className="login-info">
                            <div className="info-item">
                                <i className="fas fa-lock"></i>
                                <p>Đăng nhập an toàn với tài khoản Google</p>
                            </div>
                            <div className="info-item">
                                <i className="fas fa-users"></i>
                                <p>Tham gia cộng đồng ẩm thực đông đảo</p>
                            </div>
                        </div>
                        
                        <div className="login-footer">
                            <Link to="/" className="back-home">
                                <i className="fas fa-arrow-left"></i> Quay lại trang chủ
                            </Link>
                        </div>
                    </div>
                </div>
                
                <div className="login-right">
                    <div className="food-images">
                        <div className="background-overlay"></div>
                        <div className="login-quote">
                            <h2 style={{ color: 'rgb(221, 240, 168)' }}>"Ẩm thực là nghệ thuật duy nhất nuôi dưỡng mọi giác quan."</h2>
                            <p>Chia sẻ niềm đam mê ẩm thực của bạn với cộng đồng ngay hôm nay</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;