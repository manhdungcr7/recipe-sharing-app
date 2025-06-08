import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const [featuredRecipes, setFeaturedRecipes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Tải các công thức tiêu biểu
    useEffect(() => {
        const fetchFeaturedRecipes = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:5000/api/recipes/featured');
                if (response.ok) {
                    const data = await response.json();
                    setFeaturedRecipes(data.data || []);
                }
            } catch (error) {
                console.error('Error fetching featured recipes', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFeaturedRecipes();
    }, []);

    // Xử lý nút "Bắt đầu ngay"
    const handleGetStarted = () => {
        // Điều hướng đến trang đăng ký thay vì đăng nhập
        navigate('/register');
    };

    return (
        <div className="landing-page">
            {/* Hero Section */}
            <header className="hero-section">
                <div className="hero-overlay"></div>
                <div className="hero-content container">
                    <div className="navbar">
                        <div className="logo">Recipe Sharing</div>
                        <div className="nav-buttons">
                            <Link to="/login" className="btn btn-primary">Đăng nhập với Google</Link>
                        </div>
                    </div>
                    
                    <div className="hero-text">
                        <h1>Khám phá thế giới ẩm thực</h1>
                        <p>Chia sẻ công thức yêu thích và khám phá những món ăn tuyệt vời từ các đầu bếp khắp nơi</p>
                        <button onClick={handleGetStarted} className="btn btn-cta">Bắt đầu ngay</button>
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section className="features-section">
                <div className="container">
                    <h2 className="section-title">Tại sao chọn Recipe Sharing?</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <i className="fas fa-utensils"></i>
                            </div>
                            <h3>Khám phá công thức mới</h3>
                            <p>Hàng nghìn công thức từ các nền ẩm thực khác nhau trên toàn thế giới</p>
                        </div>
                        
                        <div className="feature-card">
                            <div className="feature-icon">
                                <i className="fas fa-share-alt"></i>
                            </div>
                            <h3>Chia sẻ tài năng nấu ăn</h3>
                            <p>Đăng tải công thức của bạn và nhận phản hồi từ cộng đồng yêu ẩm thực</p>
                        </div>
                        
                        <div className="feature-card">
                            <div className="feature-icon">
                                <i className="fas fa-users"></i>
                            </div>
                            <h3>Cộng đồng đam mê</h3>
                            <p>Kết nối với những người đam mê ẩm thực và học hỏi từ họ</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Recipes Section */}
            <section className="recipes-section">
                <div className="container">
                    <h2 className="section-title">Công thức nổi bật</h2>
                    
                    {loading ? (
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                            <p>Đang tải công thức...</p>
                        </div>
                    ) : featuredRecipes.length > 0 ? (
                        <div className="recipes-grid">
                            {featuredRecipes.slice(0, 6).map(recipe => (
                                <div key={recipe.id} className="recipe-card">
                                    <div className="recipe-image-container">
                                        <img 
                                            src={recipe.image_url ? `http://localhost:5000${recipe.image_url}` : '/default-recipe.jpg'} 
                                            alt={recipe.title}
                                            className="recipe-image"
                                            onError={(e) => { e.target.src = '/default-recipe.jpg' }}
                                        />
                                        <div className="recipe-overlay">
                                            <Link to="/login" className="btn btn-small">Xem chi tiết</Link>
                                        </div>
                                    </div>
                                    <div className="recipe-info">
                                        <h3>{recipe.title}</h3>
                                        <div className="recipe-meta">
                                            <span><i className="far fa-clock"></i> {recipe.cooking_time} phút</span>
                                            <span><i className="far fa-user"></i> {recipe.author_name}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-recipes">
                            <p>Chưa có công thức nổi bật. Hãy đăng nhập và trở thành người đầu tiên chia sẻ!</p>
                            <Link to="/login" className="btn btn-primary">Đăng nhập ngay</Link>
                        </div>
                    )}
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works">
                <div className="container">
                    <h2 className="section-title">Cách thức hoạt động</h2>
                    <div className="steps">
                        <div className="step">
                            <div className="step-number">1</div>
                            <h3>Tạo tài khoản</h3>
                            <p>Đăng ký miễn phí để trở thành thành viên của cộng đồng Recipe Sharing</p>
                        </div>
                        
                        <div className="step">
                            <div className="step-number">2</div>
                            <h3>Khám phá & Chia sẻ</h3>
                            <p>Tìm kiếm công thức hoặc chia sẻ món ăn yêu thích của bạn</p>
                        </div>
                        
                        <div className="step">
                            <div className="step-number">3</div>
                            <h3>Kết nối</h3>
                            <p>Thích, bình luận và kết nối với cộng đồng đam mê ẩm thực</p>
                        </div>
                    </div>
                    
                    <div className="cta-container">
                        <button onClick={handleGetStarted} className="btn btn-cta">Bắt đầu ngay</button>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="testimonials">
                <div className="container">
                    <h2 className="section-title">Người dùng nói gì về chúng tôi</h2>
                    <div className="testimonials-slider">
                        <div className="testimonial">
                            <div className="testimonial-content">
                                <p>"Recipe Sharing đã giúp tôi cải thiện kỹ năng nấu ăn và khám phá nhiều món mới. Cộng đồng ở đây rất tuyệt vời và hỗ trợ!"</p>
                            </div>
                            <div className="testimonial-author">
                                <div className="author-avatar"></div>
                                <div className="author-info">
                                    <h4>Nguyễn Văn A</h4>
                                    <p>Thành viên từ 2024</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="testimonial">
                            <div className="testimonial-content">
                                <p>"Tôi đã tìm thấy rất nhiều công thức tuyệt vời và dễ thực hiện. Giao diện đẹp và dễ sử dụng, tôi rất hài lòng!"</p>
                            </div>
                            <div className="testimonial-author">
                                <div className="author-avatar"></div>
                                <div className="author-info">
                                    <h4>Trần Thị B</h4>
                                    <p>Đầu bếp nghiệp dư</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Final CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <h2>Bắt đầu hành trình ẩm thực của bạn ngay hôm nay</h2>
                    <p>Đăng nhập miễn phí ngay hôm nay và bắt đầu hành trình ẩm thực của bạn</p>
                    <div className="cta-buttons">
                        <Link to="/login" className="btn btn-primary">Đăng nhập với Google</Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-logo">
                            <h2>Recipe Sharing</h2>
                            <p>Nơi chia sẻ đam mê ẩm thực</p>
                        </div>
                        
                        <div className="footer-links">
                            <div className="link-group">
                                <h3>Liên hệ</h3>
                                <ul>
                                    <li><a href="mailto:info@recipesharing.com">info@recipesharing.com</a></li>
                                    <li><a href="tel:+84123456789">+84 123 456 789</a></li>
                                </ul>
                            </div>
                            
                            <div className="link-group">
                                <h3>Pháp lý</h3>
                                <ul>
                                    <li><a href="/terms">Điều khoản sử dụng</a></li>
                                    <li><a href="/privacy">Chính sách bảo mật</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div className="footer-bottom">
                        <p>&copy; {new Date().getFullYear()} Recipe Sharing. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;