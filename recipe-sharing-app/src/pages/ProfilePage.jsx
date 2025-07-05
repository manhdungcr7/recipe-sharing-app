import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './ProfilePage.css';
import ProfileLayout from './ProfileLayout';
import ReportButton from '../components/report/ReportButton';
import { getAvatarUrl } from '../utils/imageUtils';

const ProfilePage = () => {
    const { currentUser, setCurrentUser } = useContext(AuthContext);
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
    
    // Hàm xử lý upload avatar (thêm vào)
    const handleAvatarUpload = async (file) => {
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            
            const token = localStorage.getItem('auth_token');
            const response = await fetch('http://localhost:5000/api/users/upload-avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // Cập nhật avatar trong context và localStorage
                const userData = JSON.parse(localStorage.getItem('user'));
                userData.picture = data.data.picture;
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Cập nhật state nếu cần
                if (setCurrentUser) {
                    setCurrentUser({...currentUser, picture: data.data.picture});
                }
            }
        } catch (error) {
            console.error("Error uploading avatar:", error);
        }
    };
    
    // UI hiển thị theo userData
    return (
        <div className="profile-page">
            {loading ? (
                <div>Loading...</div>
            ) : userData ? (
                <>
                    <ProfileLayout
                        user={userData}
                        isOwner={true}
                        onEditProfile={handleEditProfile}
                        onAvatarUpload={handleAvatarUpload}
                    />
                    
                    {/* Thêm nút báo cáo người dùng */}
                    {currentUser && currentUser.id !== userId && (
                        <ReportButton 
                            type="user"
                            targetId={userId}
                            targetName={userData?.name || `Người dùng #${userId}`}
                        />
                    )}
                </>
            ) : (
                <div>Không tìm thấy thông tin người dùng.</div>
            )}
        </div>
    );
};

export default ProfilePage;