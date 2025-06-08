import React from 'react';
import PropTypes from 'prop-types';

const ProfileHeader = ({ user }) => {
    return (
        <div className="profile-header">
            <img src={user.avatar} alt={`${user.name}'s avatar`} className="profile-avatar" />
            <h1 className="profile-name">{user.name}</h1>
            <p className="profile-bio">{user.bio}</p>
            <div className="profile-stats">
                <span>{user.followersCount} Followers</span>
                <span>{user.followingCount} Following</span>
                <span>{user.postsCount} Posts</span>
            </div>
        </div>
    );
};

ProfileHeader.propTypes = {
    user: PropTypes.shape({
        avatar: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        bio: PropTypes.string,
        followersCount: PropTypes.number.isRequired,
        followingCount: PropTypes.number.isRequired,
        postsCount: PropTypes.number.isRequired,
    }).isRequired,
};

export default ProfileHeader;