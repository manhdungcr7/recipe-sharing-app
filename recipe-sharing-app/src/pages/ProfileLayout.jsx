import React, { useState } from 'react';
import Followers from '../components/profile/Followers';
import Following from '../components/profile/Following';
import UserPosts from '../components/profile/UserPosts';

const ProfileLayout = ({
  user,
  stats,
  setStats,
  isOwner,
  isFollowing,
  onFollowToggle,
  onEditProfile,
}) => {
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  return (
    <div className="profile-page">
      <div className="profile-header">
        <img
          className="profile-avatar"
          src={
            user.picture
              ? user.picture.startsWith('http')
                ? user.picture
                : `http://localhost:5000${user.picture.startsWith('/') ? user.picture : '/' + user.picture}`
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`
          }
          alt={user.name}
        />
        <div className="profile-info">
          <h1>{user.name}</h1>
          <p>{user.email}</p>
          {/* Nút theo dõi/chỉnh sửa */}
          <button className="follow-button" onClick={onFollowToggle}>
            {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
          </button>
          {isOwner && (
            <button className="edit-profile-btn" onClick={onEditProfile}>
              Chỉnh sửa
            </button>
          )}
        </div>
      </div>
      <div className="profile-stats">
        <span
          className="stat clickable"
          onClick={() => setShowFollowers(true)}
          style={{ cursor: 'pointer' }}
          title="Xem danh sách người theo dõi"
        >
          Người theo dõi: {stats.followerCount}
        </span>
        <span
          className="stat clickable"
          onClick={() => setShowFollowing(true)}
          style={{ cursor: 'pointer' }}
          title="Xem danh sách đang theo dõi"
        >
          Đang theo dõi: {user.followingCount || 0}
        </span>
        <span className="stat">
          Bài đăng: {user.recipeCount || 0}
        </span>
      </div>
      {/* Tabs */}
      <div className="profile-tabs">
        <button>Bài đăng đã đăng</button>
        {isOwner && <button>Bản nháp</button>}
        {isOwner && <button>Đã lưu</button>}
      </div>
      {/* Danh sách công thức */}
      <UserPosts userId={user.id} />

      {/* Modal danh sách người theo dõi */}
      {showFollowers && (
        <div className="modal-overlay" onClick={() => setShowFollowers(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowFollowers(false)}>×</button>
            <Followers userId={user.id} onClose={() => setShowFollowers(false)} />
          </div>
        </div>
      )}

      {/* Modal danh sách đang theo dõi */}
      {showFollowing && (
        <div className="modal-overlay" onClick={() => setShowFollowing(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowFollowing(false)}>×</button>
            <Following userId={user.id} onClose={() => setShowFollowing(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileLayout;