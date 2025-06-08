import React, { useState } from 'react';

const LikeButton = ({ recipeId, initialLikes }) => {
    const [likes, setLikes] = useState(initialLikes);
    const [liked, setLiked] = useState(false);

    const handleLike = () => {
        if (liked) {
            setLikes(likes - 1);
        } else {
            setLikes(likes + 1);
        }
        setLiked(!liked);
        // Here you would typically also send a request to the server to update the like status
    };

    return (
        <button onClick={handleLike} className={`like-button ${liked ? 'liked' : ''}`}>
            {liked ? 'Unlike' : 'Like'} ({likes})
        </button>
    );
};

export default LikeButton;