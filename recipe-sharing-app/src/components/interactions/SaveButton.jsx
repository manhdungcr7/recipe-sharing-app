import React from 'react';

const SaveButton = ({ onSave }) => {
    return (
        <button className="save-button" onClick={onSave}>
            Save Recipe
        </button>
    );
};

export default SaveButton;