import React from 'react';

const UserStats = ({ user }) => {
    return (
        <div className="user-stats">
            <h2>Statistics</h2>
            <ul>
                <li><strong>Followers:</strong> {user.followersCount}</li>
                <li><strong>Following:</strong> {user.followingCount}</li>
                <li><strong>Posts:</strong> {user.postsCount}</li>
                <li><strong>Likes Received:</strong> {user.likesReceived}</li>
                <li><strong>Recipes Saved:</strong> {user.recipesSaved}</li>
            </ul>
        </div>
    );
};

export default UserStats;