import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [featuredRecipes, setFeaturedRecipes] = useState([]);
    const [error, setError] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    // Fetch dữ liệu công thức nổi bật
    useEffect(() => {
        const fetchFeaturedRecipes = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:5000/api/search/popular?limit=3');
                const data = await response.json();

                if (data.success) {
                    setFeaturedRecipes(data.data || []);
                } else {
                    throw new Error(data.message || 'Không thể tải công thức nổi bật');
                }
            } catch (error) {
                console.error('Error fetching featured recipes:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFeaturedRecipes();
    }, []);

    // Hiệu ứng fade-in khi scroll
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 100) {
                setIsVisible(true);
            }
        };

        window.addEventListener('scroll', handleScroll);
        setIsVisible(true); // Mặc định hiển thị trên mobile
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Xử lý khi click vào nút "Bắt đầu ngay"
    const handleGetStarted = () => {
        // Điều hướng đến trang đăng nhập
        navigate('/login');
    };

    return (
        <div className="landing-page">
            {/* Hero Section - Cải tiến */}
            <header className="hero-section">
                <div className="hero-overlay"></div>
                <div className="hero-content container">
                    <div className="navbar">
                        <div className="logo">
                            <i className="fas fa-utensils"></i> Recipe Sharing
                        </div>
                        <div className="nav-buttons">
                            <Link to="/login" className="btn btn-outline">Đăng nhập</Link>
                        </div>
                    </div>
                    
                    <div className="hero-text">
                        <h1 className="animate-slide-up" style={{ color: 'rgb(221, 240, 168)' }}>Khám phá thế giới ẩm thực</h1>
                        <p className="animate-slide-up delay-1">Chia sẻ công thức yêu thích và khám phá những món ăn tuyệt vời từ các đầu bếp khắp nơi</p>
                        <div className="hero-buttons animate-slide-up delay-2">
                            <button onClick={handleGetStarted} className="btn btn-primary btn-large">
                                <span>Bắt đầu ngay</span>
                                <i className="fas fa-arrow-right"></i>
                            </button>
                            <a href="#featured" className="btn btn-secondary btn-large">
                                <span>Khám phá công thức</span>
                                <i className="fas fa-search"></i>
                            </a>
                        </div>
                    </div>
                    
                    <div className="hero-scroll-indicator animate-bounce">
                        <a href="#features">
                            <i className="fas fa-chevron-down"></i>
                        </a>
                    </div>
                </div>
            </header>

            {/* Features Section - Cải tiến */}
            <section id="features" className="features-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Tại sao chọn Recipe Sharing?</h2>
                        <p className="section-subtitle">Nền tảng chia sẻ công thức hàng đầu dành cho người yêu ẩm thực</p>
                    </div>
                    
                    <div className="feature-cards">
                        <div className="feature-card animate-fade-in">
                            <div className="feature-icon">
                                <i className="fas fa-book-open"></i>
                            </div>
                            <h3>Công thức đa dạng</h3>
                            <p>Khám phá hàng ngàn công thức từ các nền ẩm thực trên khắp thế giới</p>
                        </div>
                        
                        <div className="feature-card animate-fade-in delay-1">
                            <div className="feature-icon">
                                <i className="fas fa-share-alt"></i>
                            </div>
                            <h3>Chia sẻ dễ dàng</h3>
                            <p>Đăng tải công thức của bạn và nhận phản hồi từ cộng đồng yêu ẩm thực</p>
                        </div>
                        
                        <div className="feature-card animate-fade-in delay-2">
                            <div className="feature-icon">
                                <i className="fas fa-users"></i>
                            </div>
                            <h3>Cộng đồng đam mê</h3>
                            <p>Kết nối với những người đam mê ẩm thực và học hỏi từ họ</p>
                        </div>
                        
                        <div className="feature-card animate-fade-in delay-3">
                            <div className="feature-icon">
                                <i className="fas fa-mobile-alt"></i>
                            </div>
                            <h3>Truy cập mọi lúc</h3>
                            <p>Sử dụng trên mọi thiết bị, lưu công thức yêu thích và truy cập offline</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Recipes Section - Cải tiến */}
            <section id="featured" className="recipes-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Công thức nổi bật</h2>
                        <p className="section-subtitle">Những món ăn được yêu thích nhất trong cộng đồng</p>
                    </div>
                    
                    {loading ? (
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                            <p>Đang tải công thức...</p>
                        </div>
                    ) : featuredRecipes.length > 0 ? (
                        <div className="recipe-cards">
                            {featuredRecipes.map((recipe, index) => (
                                <div key={recipe.id} className={`recipe-card animate-fade-in delay-${index}`}>
                                    <div className="recipe-image">
                                        <img 
                                            src={recipe.image ? `http://localhost:5000${recipe.image}` : '/default-recipe.jpg'} 
                                            alt={recipe.title} 
                                        />
                                        <div className="recipe-badges">
                                            <span className="badge">
                                                <i className="fas fa-clock"></i> {recipe.cooking_time || '30 phút'}
                                            </span>
                                            <span className="badge">
                                                <i className="fas fa-heart"></i> {recipe.likes_count || 0}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="recipe-content">
                                        <h3>{recipe.title}</h3>
                                        <p className="recipe-author">
                                            <img 
                                                className="author-avatar" 
                                                src={recipe.user_picture ? `http://localhost:5000${recipe.user_picture}` : '/default-avatar.jpg'} 
                                                alt={recipe.user_name || 'User'} 
                                            />
                                            <span>{recipe.user_name || 'Người dùng'}</span>
                                        </p>
                                        <p className="recipe-excerpt">{recipe.description?.substring(0, 120) || 'Khám phá công thức tuyệt vời này...'}</p>
                                        <div className="recipe-actions">
                                            <Link to={`/recipe/${recipe.id}`} className="btn btn-outline">
                                                Xem chi tiết <i className="fas fa-arrow-right"></i>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-recipes">
                            <div className="no-data-icon"><i className="fas fa-utensils"></i></div>
                            <p>Chưa có công thức nổi bật. Hãy đăng nhập và trở thành người đầu tiên chia sẻ!</p>
                            <Link to="/login" className="btn btn-primary">Đăng nhập ngay</Link>
                        </div>
                    )}
                    
                    <div className="view-more">
                        <Link to="/recipes" className="btn btn-outline btn-large">
                            Xem tất cả công thức <i className="fas fa-arrow-right"></i>
                        </Link>
                    </div>
                </div>
            </section>

            {/* How It Works Section - Cải tiến */}
            <section className="how-it-works">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Cách thức hoạt động</h2>
                        <p className="section-subtitle">Ba bước đơn giản để bắt đầu với Recipe Sharing</p>
                    </div>
                    
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
                        <button onClick={handleGetStarted} className="btn btn-primary btn-large">
                            Bắt đầu ngay <i className="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </section>

            {/* Testimonials Section - Cải tiến */}
            <section className="testimonials">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Người dùng nói gì về chúng tôi</h2>
                        <p className="section-subtitle">Trải nghiệm từ cộng đồng yêu ẩm thực</p>
                    </div>
                    
                    <div className="testimonial-slider">
                        <div className="testimonial-card">
                            <div className="testimonial-content">
                                <div className="quote-icon"><i className="fas fa-quote-left"></i></div>
                                <p>"Recipe Sharing đã giúp tôi tìm thấy đam mê nấu nướng. Các công thức chi tiết và dễ làm theo giúp tôi nấu được những món ăn tuyệt vời cho gia đình."</p>
                            </div>
                            <div className="testimonial-author">
                                <div className="author-avatar"></div>
                                <div className="author-info">
                                    <h4>Nguyễn Văn A</h4>
                                    <p>Người dùng thường xuyên</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="testimonial-card">
                            <div className="testimonial-content">
                                <div className="quote-icon"><i className="fas fa-quote-left"></i></div>
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
                        
                        <div className="testimonial-card">
                            <div className="testimonial-content">
                                <div className="quote-icon"><i className="fas fa-quote-left"></i></div>
                                <p>"Đây là nền tảng tuyệt vời để chia sẻ công thức và học hỏi từ cộng đồng. Tôi đã học được rất nhiều kỹ thuật nấu ăn mới từ đây."</p>
                            </div>
                            <div className="testimonial-author">
                                <div className="author-avatar"></div>
                                <div className="author-info">
                                    <h4>Lê Văn C</h4>
                                    <p>Blogger ẩm thực</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Final CTA Section - Cải tiến */}
            <section className="cta-section">
                <div className="container">
                    <h2>Bắt đầu hành trình ẩm thực của bạn ngay hôm nay</h2>
                    <p>Đăng nhập miễn phí ngay hôm nay và bắt đầu khám phá, chia sẻ những công thức tuyệt vời</p>
                    <div className="cta-buttons">
                        <button onClick={handleGetStarted} className="btn btn-primary btn-large">
                            Bắt đầu ngay <i className="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer - Cải tiến */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-logo">
                            <h2 style={{ color: 'rgb(221, 240, 168)' }}><i className="fas fa-utensils"></i> Recipe Sharing</h2>
                            <p>Nơi chia sẻ đam mê ẩm thực</p>
                            <div className="social-links">
                                <a href="#" className="social-link"><i className="fab fa-facebook-f"></i></a>
                                <a href="#" className="social-link"><i className="fab fa-instagram"></i></a>
                                <a href="#" className="social-link"><i className="fab fa-twitter"></i></a>
                                <a href="#" className="social-link"><i className="fab fa-pinterest-p"></i></a>
                            </div>
                        </div>
                        
                        <div className="footer-links">
                            <div className="link-group">
                                <h3 style={{ color: 'rgb(221, 240, 168)' }}>Liên hệ</h3>
                                <ul>
                                    <li><a href="mailto:info@recipesharing.com"><i className="fas fa-envelope"></i> info@recipesharing.com</a></li>
                                    <li><a href="tel:+84123456789"><i className="fas fa-phone"></i> +84 123 456 789</a></li>
                                    <li><a href="#"><i className="fas fa-map-marker-alt"></i> Hà Nội, Việt Nam</a></li>
                                </ul>
                            </div>
                            
                            <div className="link-group">
                                <h3 style={{ color: 'rgb(221, 240, 168)' }}>Khám phá</h3>
                                <ul>
                                    <li><a href="#features">Tính năng</a></li>
                                    <li><a href="#featured">Công thức nổi bật</a></li>
                                    <li><a href="/recipes">Tất cả công thức</a></li>
                                    <li><a href="/login">Đăng nhập</a></li>
                                </ul>
                            </div>
                            
                            <div className="link-group">
                                <h3 style={{ color: 'rgb(221, 240, 168)' }}>Pháp lý</h3>
                                <ul>
                                    <li><a href="/terms">Điều khoản sử dụng</a></li>
                                    <li><a href="/privacy">Chính sách bảo mật</a></li>
                                    <li><a href="/faq">Câu hỏi thường gặp</a></li>
                                    <li><a href="/about">Về chúng tôi</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div className="footer-bottom">
                        <p>&copy; {new Date().getFullYear()} Recipe Sharing. Tất cả quyền được bảo lưu.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;