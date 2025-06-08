// Thêm trong Header component
const [notificationCount, setNotificationCount] = useState(0);

// Thêm useEffect để fetch số lượng thông báo chưa đọc
useEffect(() => {
  const fetchNotificationCount = async () => {
    if (!isAuthenticated) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/notifications/unread-count', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotificationCount(data.count || 0);
      }
    } catch (err) {
      console.error('Error fetching notification count:', err);
    }
  };
  
  fetchNotificationCount();
  
  // Thiết lập interval để kiểm tra thông báo mới mỗi phút
  const interval = setInterval(fetchNotificationCount, 60000);
  return () => clearInterval(interval);
}, [isAuthenticated]);

// Cập nhật hàm fetchUnreadCount và fetchPopularKeywords

// Thêm biến để theo dõi lỗi
let notificationsErrorLogged = false;
let searchErrorLogged = false;

const fetchUnreadCount = async () => {
  if (!isAuthenticated) return;
  
  try {
    const response = await fetch('/api/notifications/unread-count', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      setUnreadCount(data.count || 0);
      notificationsErrorLogged = false; // Reset flag khi thành công
    } else if (!notificationsErrorLogged) {
      // Chỉ log lỗi một lần
      console.warn('Không thể lấy số thông báo chưa đọc. API chưa được triển khai.');
      notificationsErrorLogged = true;
    }
  } catch (error) {
    if (!notificationsErrorLogged) {
      console.error('Lỗi khi lấy số thông báo chưa đọc:', error);
      notificationsErrorLogged = true;
    }
  }
};

const fetchPopularKeywords = async () => {
  try {
    const response = await fetch('/api/search/popular');
    
    if (response.ok) {
      const data = await response.json();
      setPopularKeywords(data.popularKeywords || []);
      searchErrorLogged = false;
    } else if (!searchErrorLogged) {
      console.warn('Không thể lấy từ khóa phổ biến. API chưa được triển khai.');
      // Dùng dữ liệu mẫu để hiển thị
      setPopularKeywords(['Phở', 'Bún chả', 'Gà rán', 'Pizza', 'Sushi']);
      searchErrorLogged = true;
    }
  } catch (error) {
    if (!searchErrorLogged) {
      console.error('Lỗi khi lấy từ khóa phổ biến:', error);
      searchErrorLogged = true;
    }
  }
};

// Trong phần render của Header:
<div className="header-actions">
  {isAuthenticated && (
    <Link to="/notifications" className="notification-icon">
      <i className="fas fa-bell"></i>
      {notificationCount > 0 && (
        <span className="notification-counter">{notificationCount}</span>
      )}
    </Link>
  )}
  
  {/* Các thành phần khác của header */}
</div>