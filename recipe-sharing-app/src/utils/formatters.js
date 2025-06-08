export const formatRecipeData = (recipe) => {
    return {
        id: recipe.id,
        title: recipe.title,
        ingredients: recipe.ingredients.map(ingredient => ({
            name: ingredient.name,
            quantity: ingredient.quantity,
        })),
        steps: recipe.steps.join(' '),
        cookingTime: `${recipe.cookingTime} minutes`,
        createdAt: new Date(recipe.createdAt).toLocaleDateString(),
    };
};

export const formatUserProfile = (user) => {
    return {
        id: user.id,
        name: user.name,
        avatar: user.avatar || 'default-avatar.png',
        followersCount: user.followers.length,
        followingCount: user.following.length,
        totalPosts: user.posts.length,
    };
};

export const formatCommentData = (comment) => {
    return {
        id: comment.id,
        userId: comment.userId,
        content: comment.content,
        createdAt: new Date(comment.createdAt).toLocaleString(),
    };
};