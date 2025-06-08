import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Following = ({ userId, following: propFollowing, onClose = () => {} }) => {
    const [loading, setLoading] = useState(!propFollowing);
    const [following, setFollowing] = useState(propFollowing || []);

    useEffect(() => {
        if (propFollowing) {
            // Nếu có dữ liệu từ prop, dùng luôn
            setFollowing(propFollowing);
            setLoading(false);
            return;
        }
        
        if (!userId) {
            setLoading(false);
            return;
        }
        
        // Chỉ gọi API khi không có dữ liệu từ prop
        fetch(`http://localhost:5000/api/users/${userId}/following`)
            .then(res => res.json())
            .then(data => {
                setFollowing(data.data || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [userId, propFollowing]);

    if (!userId && !propFollowing) return <div className="no-data">Không có dữ liệu người dùng</div>;

    return (
        <div className="following-list">
            <h2>Đang theo dõi</h2>
            {loading ? (
                <p>Đang tải...</p>
            ) : following.length > 0 ? (
                <ul className="user-list">
                    {following.map(user => (
                        <li key={user.id} className="user-item">
                            <Link 
                                to={`/profile/${user.id}`}
                                className="user-link"
                                onClick={onClose}
                            >
                                <img 
                                    src={user.picture ? 
                                        (user.picture.startsWith('http') ? user.picture : `http://localhost:5000${user.picture}`) : 
                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`
                                    }
                                    alt={user.name} 
                                    className="user-avatar"
                                />
                                <span className="user-name">{user.name}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="empty-message">Chưa theo dõi ai.</p>
            )}
        </div>
    );
};

export default Following;