import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Comments.css';
import ReportButton from '../report/ReportButton';

// Thêm hàm này vào đây
function addReplyToComments(comments, parentId, reply) {
  return comments.map(comment => {
    // Dùng parent_id thay vì parent_comment_id
    if (comment.id === parentId) {
      // Đảm bảo reply có parent_comment_id đúng cho frontend
      const formattedReply = {
        ...reply,
        parent_comment_id: parentId
      };
      return {
        ...comment,
        replies: [...(comment.replies || []), formattedReply]
      };
    } else if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: addReplyToComments(comment.replies, parentId, reply)
      };
    } else {
      return comment;
    }
  });
}

const Comments = ({ recipeId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // Thêm hàm fetchComments ra khỏi useEffect để có thể tái sử dụng
  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/comments/recipe/${recipeId}`);
      
      if (!response.ok) {
        throw new Error('Không thể tải bình luận');
      }
      
      const data = await response.json();
      setComments(data.data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Không thể tải bình luận. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [recipeId]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (!newComment.trim()) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:5000/api/comments/recipe/${recipeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: newComment })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Thêm comment mới vào danh sách
        if (result.data) {
          setComments(prev => [result.data, ...prev]);
          setNewComment('');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể đăng bình luận');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleReply = (commentId) => {
    setReplyingTo(commentId);
    setReplyTexts(prev => ({ ...prev, [commentId]: '' }));
  };

  const handleChangeReplyText = (commentId, text) => {
    setReplyTexts(prev => ({ ...prev, [commentId]: text }));
  };

  const handleSubmitReply = async (commentId, localReplyText) => {
    if (!localReplyText?.trim()) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:5000/api/comments/${commentId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: localReplyText })
      });
      
      // Sau khi gửi reply thành công:
      if (response.ok) {
        const result = await response.json();
        setComments(prev => addReplyToComments(prev, commentId, result.data));
        setReplyingTo(null);
        
        // Bỏ dòng này vì đã cập nhật comments bằng addReplyToComments
        // fetchComments();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể trả lời bình luận');
      }
    } catch (err) {
      console.error('Error replying to comment:', err);
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  if (loading) {
    return <div className="comments-loading">Đang tải bình luận...</div>;
  }

  const CommentItem = ({ comment, handleReply, replyingTo, handleSubmitReply, handleCancelReply, currentUser }) => {
    // Mỗi component có state riêng
    const [localReplyText, setLocalReplyText] = useState('');
    
    // Khi component được chọn để reply
    const isReplying = replyingTo === comment.id;
    
    // Reset text khi reply form mới mở
    useEffect(() => {
      if (isReplying) setLocalReplyText('');
    }, [isReplying]);
    
    return (
      <div className="comment-item">
        <div className="comment-avatar">
          {comment.user_picture ? (
            <img 
              src={`http://localhost:5000${comment.user_picture}`} 
              alt={comment.user_name} 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user_name)}&background=random`;
              }}
            />
          ) : (
            <div className="avatar-placeholder">
              {comment.user_name ? comment.user_name[0].toUpperCase() : 'U'}
            </div>
          )}
        </div>
        <div className="comment-content">
          <div className="comment-header">
            <div className="comment-author">{comment.user_name}</div>
            <div className="comment-date">{formatDate(comment.created_at)}</div>
            
            {/* Thêm nút báo cáo chỉ hiển thị khi không phải comment của mình */}
            {currentUser && currentUser.id !== comment.user_id && (
              <ReportButton 
                type="comment" 
                id={comment.id} 
                title={`Comment by ${comment.user_name}`} 
              />
            )}
          </div>
          
          <div className="comment-text">
            {comment.text}
          </div>
          
          <div className="comment-actions">
            <button 
              className="reply-button" 
              onClick={() => handleReply(comment.id)}
            >
              Trả lời
            </button>
            
            {/* Thêm chức năng báo cáo comment nếu không phải người viết comment */}
            {currentUser && currentUser.id !== comment.user_id && (
              <ReportButton 
                  type="comment" 
                  id={comment.id} 
                  title={`Comment by ${comment.user_name}`} 
              />
            )}
          </div>
          
          {isReplying && (
            <div className="reply-form-container">
              <textarea
                placeholder="Viết trả lời của bạn..."
                value={localReplyText}
                onChange={(e) => setLocalReplyText(e.target.value)}
                rows={2}
                className="reply-textarea"
              />
              <div className="reply-actions">
                <button 
                  className="cancel-reply-btn"
                  onClick={handleCancelReply}
                >
                  Hủy
                </button>
                <button 
                  className="submit-reply-btn"
                  onClick={(e) => {
                    e.preventDefault(); // Thêm dòng này
                    handleSubmitReply(comment.id, localReplyText);
                  }}
                  disabled={!localReplyText.trim()}
                >
                  Trả lời
                </button>
              </div>
            </div>
          )}
          
          {/* Đệ quy render replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="replies-container">
              {comment.replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  handleReply={handleReply}
                  replyingTo={replyingTo}
                  handleSubmitReply={handleSubmitReply}
                  handleCancelReply={handleCancelReply}
                  currentUser={currentUser}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="comments-section">
      <h3>Bình luận ({comments.length})</h3>
      
      <div className="comment-form-container">
        <form onSubmit={handleSubmitComment} className="comment-form">
          <textarea
            placeholder="Chia sẻ cảm nghĩ của bạn..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            required
          />
          <button type="submit" className="submit-comment-btn" disabled={!newComment.trim()}>
            Gửi
          </button>
        </form>
      </div>
      
      {error && <p className="error-message">{error}</p>}
      
      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="no-comments-message">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
        ) : (
          comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              handleReply={handleReply}
              replyingTo={replyingTo}
              handleSubmitReply={handleSubmitReply}
              handleCancelReply={handleCancelReply}
              currentUser={currentUser}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;