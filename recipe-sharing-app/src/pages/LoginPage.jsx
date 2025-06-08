import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import './LoginPage.css';

const LoginPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, login } = useContext(AuthContext);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        // Nếu đã đăng nhập, chuyển hướng đến dashboard
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    // Xử lý đăng nhập Google thành công
    const handleGoogleLoginSuccess = async (credentialResponse) => {
        try {
            setLoading(true);
            setError(null);
            
            console.log("Google OAuth response:", credentialResponse);
            const { credential } = credentialResponse;
            
            const response = await fetch('http://localhost:5000/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tokenId: credential })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Google login API error:", errorText);
                throw new Error(`Đăng nhập thất bại: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Lưu token và thông tin người dùng vào localStorage
                localStorage.setItem('token', data.token);
                
                // Kiểm tra dữ liệu người dùng
                if (data.user && typeof data.user === 'object') {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    console.log("Login successful with:", { 
                        token: data.token.substring(0, 15) + "...", 
                        user: data.user 
                    });
                    
                    // Cập nhật trạng thái đăng nhập
                    login(data.token, data.user);
                    
                    // Kiểm tra dữ liệu đã lưu
                    const savedToken = localStorage.getItem('token');
                    const savedUser = localStorage.getItem('user');
                    
                    console.log("Saved in localStorage:", { 
                        token: savedToken ? "Present" : "Missing", 
                        user: savedUser ? "Present" : "Missing" 
                    });
                    
                    // Chuyển hướng người dùng
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 500);
                } else {
                    console.error("Invalid user data received:", data.user);
                    throw new Error("Dữ liệu người dùng không hợp lệ");
                }
            } else {
                throw new Error(data.message || 'Đăng nhập thất bại');
            }
        } catch (error) {
            console.error("Google login error:", error);
            setError(error.message || 'Đăng nhập thất bại, vui lòng thử lại');
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
                <div className="login-header">
                    <h1>Đăng nhập</h1>
                    <p>Đăng nhập bằng tài khoản Google của bạn để tiếp tục</p>
                </div>
                
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
                            width="300px"
                        />
                    )}
                </div>
                
                <div className="login-info">
                    <div className="info-item">
                        <i className="fas fa-lock"></i>
                        <p>Đăng nhập an toàn với tài khoản Google</p>
                    </div>
                    <div className="info-item">
                        <i className="fas fa-shield-alt"></i>
                        <p>Chúng tôi không lưu mật khẩu của bạn</p>
                    </div>
                </div>
                
                <div className="login-footer">
                    <p>Bằng việc đăng nhập, bạn đồng ý với <Link to="/terms">Điều khoản sử dụng</Link> và <Link to="/privacy">Chính sách bảo mật</Link> của chúng tôi</p>
                    <Link to="/home" className="back-home">Quay lại trang chủ</Link>
                </div>
                
                {/* Debug tools - chỉ hiển thị trong development */}
                {process.env.NODE_ENV !== 'production' && (
                    <div className="debug-tools" style={{marginTop: "20px"}}>
                        <button 
                            type="button" 
                            onClick={() => {
                                const token = localStorage.getItem('token');
                                const user = localStorage.getItem('user');
                                alert(`Token: ${token ? token.substring(0, 15) + '...' : 'Không có'}\nUser: ${user || 'Không có'}`);
                            }}
                        >
                            Kiểm tra localStorage
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                localStorage.removeItem('token');
                                localStorage.removeItem('user');
                                localStorage.removeItem('auth_token');
                                alert('Đã xóa tất cả token và thông tin người dùng');
                                window.location.reload();
                            }}
                        >
                            Xóa tất cả token
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginPage;