import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './ProfilePage.css';
import ProfileLayout from './ProfileLayout';

const ProfilePage = () => {
    const { currentUser } = useContext(AuthContext);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const loadUserData = async () => {
            try {
                if (currentUser) {
                    // Nếu đã có dữ liệu người dùng trong context, sử dụng nó
                    console.log("User data from context:", currentUser);
                    setUserData(currentUser);
                } else {
                    // Nếu không có dữ liệu, load từ API
                    const token = localStorage.getItem('token');
                    const response = await fetch('http://localhost:5000/api/auth/me', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log("User data from API:", data.data);
                        setUserData(data.data);
                    }
                }
            } catch (error) {
                console.error("Error loading user data:", error);
            } finally {
                setLoading(false);
            }
        };
        
        loadUserData();
    }, [currentUser]);
    
    const userId = userData ? userData.id : null;
    
    // Hàm xử lý chỉnh sửa hồ sơ
    const handleEditProfile = () => {
        // Logic để chỉnh sửa hồ sơ người dùng
        console.log("Edit profile clicked");
    };
    
    // UI hiển thị theo userData
    return (
        <div className="profile-page">
            {loading ? (
                <div>Loading...</div>
            ) : userData ? (
                <>
                    <ProfileLayout
                        user={currentUser}
                        isOwner={true}
                        onEditProfile={handleEditProfile}
                    />
                    
                    {/* Thêm nút báo cáo người dùng */}
                    {currentUser && currentUser.id !== userId && (
                        <Link to={`/report-user/${userId}`} className="report-user-button">
                            <i className="fas fa-flag"></i> Báo cáo người dùng
                        </Link>
                    )}
                </>
            ) : (
                <div>Không tìm thấy thông tin người dùng.</div>
            )}
        </div>
    );
};

export default ProfilePage;