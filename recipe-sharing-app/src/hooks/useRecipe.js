import { useState, useEffect } from 'react';
import { getRecipes, createRecipe, updateRecipe, deleteRecipe } from '../services/recipeService';

const useRecipe = () => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRecipes = async () => {
            try {
                const data = await getRecipes();
                setRecipes(data);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchRecipes();
    }, []);

    const addRecipe = async (recipe) => {
        try {
            const newRecipe = await createRecipe(recipe);
            setRecipes((prevRecipes) => [...prevRecipes, newRecipe]);
        } catch (err) {
            setError(err);
        }
    };

    const editRecipe = async (id, updatedRecipe) => {
        try {
            const recipe = await updateRecipe(id, updatedRecipe);
            setRecipes((prevRecipes) =>
                prevRecipes.map((r) => (r.id === id ? recipe : r))
            );
        } catch (err) {
            setError(err);
        }
    };

    const removeRecipe = async (id) => {
        try {
            await deleteRecipe(id);
            setRecipes((prevRecipes) => prevRecipes.filter((r) => r.id !== id));
        } catch (err) {
            setError(err);
        }
    };

    return {
        recipes,
        loading,
        error,
        addRecipe,
        editRecipe,
        removeRecipe,
    };
};

export default useRecipe;