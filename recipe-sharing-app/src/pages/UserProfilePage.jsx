import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProfileHeader from '../components/profile/ProfileHeader';
import UserPosts from '../components/profile/UserPosts';
import UserStats from '../components/profile/UserStats';
import Followers from '../components/profile/Followers';
import Following from '../components/profile/Following';
import useAuth from '../hooks/useAuth';
import ProfileLayout from './ProfileLayout';

const UserProfilePage = () => {
    const { currentUser, isAuthenticated } = useAuth();
    const { userId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState(null);
    const [error, setError] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [stats, setStats] = useState({
        followerCount: 0,
        followingCount: 0,
        postCount: 0
    });

    // Debug
    console.log("UserProfilePage render - currentUser:", currentUser);
    console.log("UserProfilePage render - userId from params:", userId);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setLoading(true);
                setError(null);
                // Sử dụng currentUser nếu không có userId và người dùng đã đăng nhập
                if (!userId && currentUser) {
                    console.log("Using currentUser data:", currentUser);
                    setProfileData(currentUser);
                    setStats({
                        followerCount: currentUser.followerCount || 0,
                        followingCount: currentUser.followingCount || 0,
                        postCount: currentUser.postCount || 0
                    });
                    setLoading(false);
                    return;
                }
                
                // Sử dụng userId từ URL nếu có
                if (userId) {
                    console.log("Fetching profile for userId:", userId);
                    const token = localStorage.getItem('token');
                    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                    
                    const response = await fetch(`http://localhost:5000/api/users/${userId}`, { headers });
                    
                    if (!response.ok) throw new Error('Không thể tải thông tin người dùng');
                    
                    const data = await response.json();
                    console.log("Profile data received:", data);
                    setProfileData(data.data);
                    setStats({
                        followerCount: data.data.followerCount || 0,
                        followingCount: data.data.followingCount || 0,
                        postCount: data.data.postCount || 0
                    });
                } else if (!currentUser) {
                    // Không có userId và không có currentUser
                    console.log("No userId or currentUser, redirecting to login");
                    navigate('/login');
                    return;
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
                setError('Không thể tải thông tin người dùng');
            } finally {
                setLoading(false);
            }
        };
        
        fetchProfileData();
    }, [userId, currentUser, navigate]);
    
    useEffect(() => {
        // Kiểm tra trạng thái theo dõi
        const fetchFollowStatus = async () => {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`http://localhost:5000/api/users/${userId}/follow-status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setIsFollowing(data.following);
            }
        };
        fetchFollowStatus();
    }, [userId]);

    const handleFollowToggle = async () => {
        const token = localStorage.getItem('auth_token');
        const endpoint = isFollowing ? 'unfollow' : 'follow';
        const res = await fetch(`http://localhost:5000/api/users/${userId}/${endpoint}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            setIsFollowing(!isFollowing);
            setStats(prev => ({
                ...prev,
                followerCount: isFollowing ? prev.followerCount - 1 : prev.followerCount + 1
            }));
        }
    };
    
    useEffect(() => {
        if (currentUser && String(currentUser.id) === String(userId)) {
            navigate('/dashboard', { replace: true });
        }
    }, [currentUser, userId, navigate]);

    if (loading) {
        return <div className="loading">Đang tải...</div>;
    }
    
    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!profileData) {
        return <div className="error">Không thể tải thông tin người dùng</div>;
    }

    return (
        <div className="user-profile-page">
            <ProfileLayout
                user={profileData}
                stats={stats}
                setStats={setStats}
                isOwner={false}
                isFollowing={isFollowing}
                onFollowToggle={handleFollowToggle}
            />
        </div>
    );
};

export default UserProfilePage;