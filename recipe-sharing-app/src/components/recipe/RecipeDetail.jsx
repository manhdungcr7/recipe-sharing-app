import React from 'react';
import { useParams } from 'react-router-dom';
import { useRecipe } from '../../hooks/useRecipe';
import RecipeIngredients from './RecipeIngredients';
import RecipeSteps from './RecipeSteps';
import RecipeComments from './RecipeComments';
import RecipeActions from './RecipeActions';

const RecipeDetail = () => {
    const { recipeId } = useParams();
    const { recipe, loading, error } = useRecipe(recipeId);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error loading recipe: {error.message}</div>;

    return (
        <div className="recipe-detail">
            <h1>{recipe.title}</h1>
            <img src={recipe.image} alt={recipe.title} />
            <RecipeIngredients ingredients={recipe.ingredients} />
            <RecipeSteps steps={recipe.steps} />
            <RecipeActions recipeId={recipeId} />
            <RecipeComments recipeId={recipeId} />
        </div>
    );
};

export default RecipeDetail;