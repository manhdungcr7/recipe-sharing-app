import React, { useState, useEffect } from 'react';
import { fetchComments, postComment } from '../../../services/recipeService';

const RecipeComments = ({ recipeId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        const loadComments = async () => {
            const fetchedComments = await fetchComments(recipeId);
            setComments(fetchedComments);
        };

        loadComments();
    }, [recipeId]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (newComment.trim()) {
            const commentData = await postComment(recipeId, newComment);
            setComments([...comments, commentData]);
            setNewComment('');
        }
    };

    return (
        <div className="recipe-comments">
            <h3>Comments</h3>
            <ul>
                {comments.map((comment) => (
                    <li key={comment.id}>
                        <p>{comment.text}</p>
                    </li>
                ))}
            </ul>
            <form onSubmit={handleCommentSubmit}>
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                />
                <button type="submit">Submit</button>
            </form>
        </div>
    );
};

export default RecipeComments;