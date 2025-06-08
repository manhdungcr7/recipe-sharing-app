import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Followers = ({
  followers: propFollowers,
  userId,
  followerCount,
  loading: propLoading,
  onClose = () => {},
}) => {
  const [followers, setFollowers] = useState(propFollowers || []);
  const [loading, setLoading] = useState(propLoading || false);

  useEffect(() => {
    // Nếu có prop followers thì không cần fetch
    if (propFollowers) {
      setFollowers(propFollowers);
      setLoading(false);
      return;
    }
    // Nếu có userId thì fetch followers
    if (userId) {
      setLoading(true);
      fetch(`http://localhost:5000/api/users/${userId}/followers`)
        .then(res => res.json())
        .then(data => {
          setFollowers(data.data || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [userId, propFollowers]);

  return (
    <div>
      <h3>Người theo dõi</h3>
      <ul className="user-list">
        {loading ? (
          <li>Đang tải...</li>
        ) : followers.length === 0 ? (
          <li>Chưa có người theo dõi nào</li>
        ) : (
          followers.map(user => (
            <li key={user.id}>
              <Link
                to={`/profile/${user.id}`}
                className="user-link"
                onClick={onClose}
              >
                <img
                  src={
                    user.picture
                      ? user.picture.startsWith('http')
                        ? user.picture
                        : `http://localhost:5000${user.picture}`
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.name
                        )}&background=random`
                  }
                  alt={user.name}
                  className="user-avatar"
                />
                <span className="user-name">{user.name}</span>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default Followers;