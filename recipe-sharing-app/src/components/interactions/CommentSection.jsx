import React, { useState, useEffect } from 'react';
import { fetchComments, addComment } from '../../services/commentService';

const CommentSection = ({ recipeId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        const loadComments = async () => {
            const fetchedComments = await fetchComments(recipeId);
            setComments(fetchedComments);
        };

        loadComments();
    }, [recipeId]);

    const handleCommentChange = (e) => {
        setNewComment(e.target.value);
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (newComment.trim()) {
            const commentData = await addComment(recipeId, newComment);
            setComments([...comments, commentData]);
            setNewComment('');
        }
    };

    return (
        <div className="comment-section">
            <h3>Comments</h3>
            <form onSubmit={handleCommentSubmit}>
                <textarea
                    value={newComment}
                    onChange={handleCommentChange}
                    placeholder="Add a comment..."
                    required
                />
                <button type="submit">Submit</button>
            </form>
            <ul>
                {comments.map((comment) => (
                    <li key={comment.id}>
                        <p>{comment.text}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CommentSection;