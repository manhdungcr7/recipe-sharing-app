import React from 'react';

const RecipeIngredients = ({ ingredients }) => {
    return (
        <div className="recipe-ingredients">
            <h3>Ingredients</h3>
            <ul>
                {ingredients.map((ingredient, index) => (
                    <li key={index}>
                        {ingredient.name} - {ingredient.quantity}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default RecipeIngredients;