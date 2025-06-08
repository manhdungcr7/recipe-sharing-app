import React, { createContext, useState, useEffect } from 'react';
import { fetchRecipes, addRecipe, updateRecipe, deleteRecipe } from '../services/recipeService';

// Thêm giá trị mặc định cho context
export const RecipeContext = createContext({
  recipes: [],
  loading: true,
  error: null,
  createRecipe: () => {},
  editRecipe: () => {},
  removeRecipe: () => {}
});

export const RecipeProvider = ({ children }) => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadRecipes = async () => {
            try {
                const data = await fetchRecipes();
                setRecipes(data);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        loadRecipes();
    }, []);

    const createRecipe = async (recipe) => {
        try {
            const newRecipe = await addRecipe(recipe);
            setRecipes((prevRecipes) => [...prevRecipes, newRecipe]);
            return newRecipe;
        } catch (err) {
            setError(err);
            throw err;
        }
    };

    const editRecipe = async (id, updatedRecipe) => {
        try {
            const recipe = await updateRecipe(id, updatedRecipe);
            setRecipes((prevRecipes) =>
                prevRecipes.map((r) => (r.id === id ? recipe : r))
            );
            return recipe;
        } catch (err) {
            setError(err);
            throw err;
        }
    };

    const removeRecipe = async (id) => {
        try {
            await deleteRecipe(id);
            setRecipes((prevRecipes) => prevRecipes.filter((r) => r.id !== id));
            return true;
        } catch (err) {
            setError(err);
            throw err;
        }
    };

    return (
        <RecipeContext.Provider value={{ recipes, loading, error, createRecipe, editRecipe, removeRecipe }}>
            {children}
        </RecipeContext.Provider>
    );
};