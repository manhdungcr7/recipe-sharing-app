import React from 'react';
import './UserCard.css';

const UserCard = ({ user }) => {
  return (
    <div className="user-card">
      <img 
        src={user.picture || '/default-avatar.jpg'} 
        alt={user.name}
        className="user-avatar"
        onError={(e) => {e.target.src = '/default-avatar.jpg'}}
      />
      <div className="user-info">
        <h3>{user.name}</h3>
        <p>{user.recipe_count} công thức</p>
        {user.bio && <p className="user-bio">{user.bio}</p>}
      </div>
    </div>
  );
};

export default UserCard;