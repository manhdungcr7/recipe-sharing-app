import React from 'react';

const ShareOptions = () => {
    const handleShare = (platform) => {
        // Logic to handle sharing on different platforms
        console.log(`Sharing on ${platform}`);
    };

    return (
        <div className="share-options">
            <h3>Share this recipe</h3>
            <button onClick={() => handleShare('Facebook')}>Share on Facebook</button>
            <button onClick={() => handleShare('Twitter')}>Share on Twitter</button>
            <button onClick={() => handleShare('Pinterest')}>Share on Pinterest</button>
            <button onClick={() => handleShare('Email')}>Share via Email</button>
        </div>
    );
};

export default ShareOptions;