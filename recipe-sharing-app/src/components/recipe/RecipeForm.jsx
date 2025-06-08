import React, { useState } from 'react';
import { useRecipe } from '../../hooks/useRecipe';

const RecipeForm = ({ existingRecipe }) => {
    const { createRecipe, updateRecipe } = useRecipe();
    const [title, setTitle] = useState(existingRecipe ? existingRecipe.title : '');
    const [ingredients, setIngredients] = useState(existingRecipe ? existingRecipe.ingredients : []);
    const [steps, setSteps] = useState(existingRecipe ? existingRecipe.steps : []);
    const [image, setImage] = useState(null);
    const [cookingTime, setCookingTime] = useState(existingRecipe ? existingRecipe.cookingTime : '');

    const handleIngredientChange = (index, value) => {
        const newIngredients = [...ingredients];
        newIngredients[index] = value;
        setIngredients(newIngredients);
    };

    const handleStepChange = (index, value) => {
        const newSteps = [...steps];
        newSteps[index] = value;
        setSteps(newSteps);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const recipeData = { title, ingredients, steps, image, cookingTime };
        if (existingRecipe) {
            updateRecipe(existingRecipe.id, recipeData);
        } else {
            createRecipe(recipeData);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>{existingRecipe ? 'Edit Recipe' : 'Create Recipe'}</h2>
            <div>
                <label>Recipe Title:</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
                <label>Ingredients:</label>
                {ingredients.map((ingredient, index) => (
                    <input
                        key={index}
                        type="text"
                        value={ingredient}
                        onChange={(e) => handleIngredientChange(index, e.target.value)}
                        required
                    />
                ))}
                <button type="button" onClick={() => setIngredients([...ingredients, ''])}>Add Ingredient</button>
            </div>
            <div>
                <label>Steps:</label>
                {steps.map((step, index) => (
                    <input
                        key={index}
                        type="text"
                        value={step}
                        onChange={(e) => handleStepChange(index, e.target.value)}
                        required
                    />
                ))}
                <button type="button" onClick={() => setSteps([...steps, ''])}>Add Step</button>
            </div>
            <div>
                <label>Cooking Time:</label>
                <input type="text" value={cookingTime} onChange={(e) => setCookingTime(e.target.value)} required />
            </div>
            <div>
                <label>Image:</label>
                <input type="file" onChange={(e) => setImage(e.target.files[0])} />
            </div>
            <button type="submit">{existingRecipe ? 'Update Recipe' : 'Create Recipe'}</button>
        </form>
    );
};

export default RecipeForm;