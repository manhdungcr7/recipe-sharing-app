import { useState, useEffect } from 'react';
import { fetchRecipes } from '../services/recipeService';

const useSearch = (query) => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const searchRecipes = async () => {
            if (query) {
                setLoading(true);
                try {
                    const data = await fetchRecipes(query);
                    setResults(data);
                } catch (err) {
                    setError(err);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
            }
        };

        searchRecipes();
    }, [query]);

    return { results, loading, error };
};

export default useSearch;