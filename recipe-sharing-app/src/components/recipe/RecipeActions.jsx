import React from 'react';
import { useRecipe } from '../../hooks/useRecipe';
import SaveButton from '../interactions/SaveButton';
import ShareOptions from '../interactions/ShareOptions';

const RecipeActions = ({ recipeId }) => {
    const { saveRecipe, shareRecipe } = useRecipe();

    const handleSave = () => {
        saveRecipe(recipeId);
    };

    const handleShare = () => {
        shareRecipe(recipeId);
    };

    return (
        <div className="recipe-actions">
            <SaveButton onClick={handleSave} />
            <ShareOptions onShare={handleShare} />
        </div>
    );
};

export default RecipeActions;