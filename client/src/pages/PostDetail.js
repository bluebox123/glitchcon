import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { summarizeContent } from '../services/geminiService';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [authorName, setAuthorName] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  const fetchLikesCount = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/posts/${id}/likes/count`);
      setLikesCount(response.data);
    } catch (error) {
      console.error('Error fetching likes count:', error);
    }
  };

  const fetchViewCount = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/posts/${id}/views`);
      setViewCount(response.data);
    } catch (error) {
      console.error('Error fetching view count:', error);
    }
  };

  const incrementViewCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = user ? user.id : null;
      
      const response = await axios.post(
        `${API_BASE_URL}/api/posts/${id}/view`, 
        { userId },
        {
          headers: token ? {
            Authorization: `Bearer ${token}`
          } : {}
        }
      );
      
      setViewCount(response.data.views);
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const fetchAuthorName = async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/${userId}`);
      setAuthorName(response.data.username);
      setAuthorId(userId);
    } catch (error) {
      console.error('Error fetching author name:', error);
      setAuthorName('Unknown User');
    }
  };

  const checkBookmarkStatus = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/bookmarks/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to check bookmark status');
      const data = await response.json();
      setIsBookmarked(data.isBookmarked);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };

  const checkSubscriptionStatus = async (creatorId) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/subscribers/${creatorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to check subscription status');
      const data = await response.json();
      setIsSubscribed(data.isSubscribed);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const fetchSubscriberCount = async (creatorId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/subscribers/${creatorId}/count`);
      setSubscriberCount(response.data);
    } catch (error) {
      console.error('Error fetching subscriber count:', error);
    }
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const [postResponse, commentsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/posts/${id}`),
          axios.get(`${API_BASE_URL}/api/comments/post/${id}`)
        ]);
        setPost(postResponse.data);
        setComments(commentsResponse.data);

        if (postResponse.data.user_id) {
          await fetchAuthorName(postResponse.data.user_id);
          await fetchSubscriberCount(postResponse.data.user_id);
          
          if (user) {
            await checkSubscriptionStatus(postResponse.data.user_id);
          }
        }

        if (user) {
          const token = localStorage.getItem('token');
          await Promise.all([
            checkBookmarkStatus(),
            axios.get(
              `${API_BASE_URL}/api/posts/${id}/likes`,
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            ).then(response => setIsLiked(response.data.includes(user.id)))
          ]);
        }

        await Promise.all([
          fetchLikesCount(),
          incrementViewCount()
        ]);
      } catch (error) {
        console.error('Fetch error:', error);
        setError(error.response?.data?.message || 'Failed to fetch post. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, user]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/comments`,
        { 
          post_id: id,
          content: newComment 
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setComments([...comments, response.data]);
      setNewComment('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      await axios.post(
        `${API_BASE_URL}/api/posts/${id}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setIsLiked(!isLiked);
      await fetchLikesCount();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update like');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/bookmarks/${id}`, {
        method: isBookmarked ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to update bookmark');
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Error updating bookmark:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.id === authorId) {
      setError("You can't subscribe to yourself");
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/subscribers/${authorId}`, {
        method: isSubscribed ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to update subscription');
      
      const data = await response.json();
      setIsSubscribed(data.isSubscribed);
      // Update subscriber count
      await fetchSubscriberCount(authorId);
    } catch (error) {
      console.error('Error updating subscription:', error);
      setError('Failed to update subscription');
      setTimeout(() => setError(''), 3000);
    }
  };

  const copyToClipboard = async () => {
    if (!post) return;
    try {
      const url = window.location.href;
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        // Fallback for browsers that don't support clipboard API
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Copy operation failed:', error);
    }
  };

  const handleEdit = () => {
    navigate(`/edit-post/${id}`);
  };

  const handleDelete = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setIsDeleteLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/posts/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setShowDeleteConfirm(false);
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete post');
      setIsDeleteLoading(false);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSummarize = async () => {
    if (!post || !post.content) return;
    
    try {
      setIsSummarizing(true);
      setError('');
      const summary = await summarizeContent(post.content);
      setSummary(summary);
      setShowSummary(true);
    } catch (error) {
      setError(error.message || 'Failed to generate summary. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsSummarizing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="text-center text-gray-600">Post not found</div>
      </div>
    );
  }

  if(post.length === 0) return <div>No Post Found</div>;

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <article className="bg-white shadow-lg rounded-lg p-6 mb-8">
        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <div className="flex items-center text-gray-600">
            <span>By {authorName}</span>
            <span className="mx-2">•</span>
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSummarize}
              disabled={isSummarizing}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm border bg-indigo-100 text-indigo-700 border-indigo-300 hover:bg-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSummarizing ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Summarizing...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Summarize</span>
                </>
              )}
            </button>
            {user && user.id === authorId && (
              <div className="flex space-x-2">
                <button
                  onClick={handleEdit}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm border bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 0L11.828 15.9a2.251 2.251 0 01-.354.243l-3.474 1.591a.5.5 0 01-.665-.665l1.591-3.474a2.251 2.251 0 01.243-.354l9.09-9.09z" />
                  </svg>
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm border bg-red-100 text-red-700 border-red-300 hover:bg-red-200 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete</span>
                </button>
              </div>
            )}
            {user && user.id !== authorId && (
              <button
                onClick={handleSubscribe}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  isSubscribed 
                    ? 'bg-indigo-100 text-indigo-600 border-indigo-300 hover:bg-indigo-200' 
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                }`}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  {isSubscribed ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  )}
                </svg>
                <span>{isSubscribed ? 'Subscribed' : 'Subscribe'}</span>
                <span className="ml-1 text-xs">({subscriberCount})</span>
              </button>
            )}
            <button
              onClick={copyToClipboard}
              className="flex items-center space-x-1 text-gray-600 hover:text-blue-500 transition-colors relative"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              <span className="text-sm">Share</span>
              {copied && (
                <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 py-1 px-2 bg-green-100 text-green-800 text-xs rounded-md whitespace-nowrap z-10">
                  Copied!
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="prose max-w-none mb-4">
          {showSummary ? (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-indigo-800 mb-2">AI Summary</h3>
                <p className="text-indigo-700">{summary}</p>
              </div>
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">Full Content</h3>
                <p>{post.content}</p>
              </div>
              <button
                onClick={() => setShowSummary(false)}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                Hide Summary
              </button>
            </div>
          ) : (
            <p>{post.content}</p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 ${
              isLiked 
                ? 'text-indigo-600' 
                : 'text-gray-600 hover:text-indigo-600'
            }`}
          >
            <svg
              className="w-5 h-5"
              fill={isLiked ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span>{likesCount}</span>
          </button>

          <div className="flex items-center space-x-1 text-gray-600">
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
              />
            </svg>
            <span>{viewCount}</span>
          </div>

          <button
            onClick={handleBookmark}
            className={`flex items-center space-x-1 ${
              isBookmarked 
                ? 'text-indigo-600' 
                : 'text-gray-600 hover:text-indigo-600'
            }`}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            <svg
              className="w-5 h-5"
              fill={isBookmarked ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </button>

          <div className="flex flex-wrap gap-2">
            {post.tags && post.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </article>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Delete Post</h3>
            <p className="mb-6">Are you sure you want to delete this post? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                disabled={isDeleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                disabled={isDeleteLoading}
              >
                {isDeleteLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Comments</h2>
        {user ? (
          <form onSubmit={handleCommentSubmit} className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full p-2 border rounded-md mb-2"
              rows="3"
              required
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Post Comment
            </button>
          </form>
        ) : (
          <p className="mb-6">
            Please <button onClick={() => navigate('/login')} className="text-indigo-600 hover:underline">login</button> to comment
          </p>
        )}

        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b pb-4">
              <div className="flex items-center text-gray-600 mb-2">
                <div className="flex items-center">
                  {comment.users.avatar_url ? (
                    <img
                      src={comment.users.avatar_url}
                      alt={comment.users.username}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 mr-2 flex items-center justify-center">
                      <span className="text-gray-600 text-sm">
                        {comment.users.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span>{comment.users.username}</span>
                </div>
                <span className="mx-2">•</span>
                <span>{new Date(comment.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-gray-800">{comment.content}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PostDetail; 