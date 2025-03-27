import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { summarizeContent } from '../services/geminiService';
import { format } from 'date-fns';

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
  const [authorAvatarUrl, setAuthorAvatarUrl] = useState('');

  const getDefaultAvatar = (username) => {
    const avatars = [
      '/default-avatar.png',
      '/default-avatar-2.png',
      '/default-avatar-3.png',
      '/default-avatar-4.png',
      '/default-avatar-5.png'
    ];
    const index = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % avatars.length;
    return avatars[index];
  };

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

  const fetchAuthorAvatar = async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/${userId}/avatar`);
      setAuthorAvatarUrl(response.data.avatar_url);
    } catch (error) {
      console.error('Error fetching author avatar:', error);
      setAuthorAvatarUrl('');
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
          await Promise.all([
            fetchAuthorName(postResponse.data.user_id),
            fetchSubscriberCount(postResponse.data.user_id)
          ]);
          
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <article className="bg-white dark:bg-[#111111] rounded-lg shadow-lg overflow-hidden">
          {/* Post Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <img 
                  src={post?.users?.avatar_url || getDefaultAvatar(authorName)} 
                  alt={authorName}
                  className="w-10 h-10 rounded-full object-cover bg-gray-100 dark:bg-gray-800"
                />
                <div>
                  <h2 className="text-[15px] text-gray-900 dark:text-white font-medium">
                    {authorName}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {format(new Date(post.created_at), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
              {post.categories && post.categories[0] && (
                <span className="px-3 py-1 text-sm bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 rounded-full">
                  {post.categories[0]}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {post.title}
            </h1>

            <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-1 ${isLiked ? 'text-yellow-500' : ''}`}
                >
                  <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{likesCount}</span>
                </button>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{viewCount}</span>
              </div>
              <button
                onClick={handleBookmark}
                className={`flex items-center space-x-1 ${isBookmarked ? 'text-yellow-500' : ''}`}
              >
                <svg className="w-5 h-5" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
              <button
                onClick={copyToClipboard}
                className="flex items-center space-x-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5H6a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                {copied && <span className="text-sm text-yellow-500">Copied!</span>}
              </button>
            </div>
          </div>

          {/* Post Content */}
          <div className="p-6">
            <div className="prose max-w-none mb-4">
              {showSummary ? (
                <div className="space-y-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-100 mb-2">AI Summary</h3>
                    <p className="text-yellow-700 dark:text-yellow-200">{summary}</p>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                    <h3 className="text-lg font-semibold mb-2">Full Content</h3>
                    <p className="text-gray-700 dark:text-gray-300">{post.content}</p>
                  </div>
                  <button
                    onClick={() => setShowSummary(false)}
                    className="text-yellow-500 hover:text-yellow-600 text-sm font-medium"
                  >
                    Hide Summary
                  </button>
                </div>
              ) : (
                <p className="text-gray-700 dark:text-gray-300">{post.content}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4 mt-6">
              <button
                onClick={handleSummarize}
                disabled={isSummarizing}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm border bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-100 border-yellow-300 dark:border-yellow-800 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSummarizing ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
              {user && user.id === post.user_id && (
                <>
                  <button
                    onClick={handleEdit}
                    className="px-3 py-1.5 rounded-full text-sm border bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 py-1.5 rounded-full text-sm border bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-100 border-red-300 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <section className="mt-8 bg-white dark:bg-[#111111] rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Comments</h2>
          {user ? (
            <form onSubmit={handleCommentSubmit} className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full p-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                rows="3"
                required
              />
              <button
                type="submit"
                className="mt-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors"
              >
                Post Comment
              </button>
            </form>
          ) : (
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Please <button onClick={() => navigate('/login')} className="text-yellow-500 hover:text-yellow-600">login</button> to comment
            </p>
          )}

          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-200 dark:border-gray-800 pb-6">
                <div className="flex items-center space-x-3 mb-3">
                  <img
                    src={comment.users.avatar_url || getDefaultAvatar(comment.users.username)}
                    alt={comment.users.username}
                    className="w-8 h-8 rounded-full object-cover bg-gray-100 dark:bg-gray-800"
                  />
                  <div>
                    <span className="text-[15px] text-gray-900 dark:text-white font-medium">
                      {comment.users.username}
                    </span>
                    <p className="text-sm text-gray-500">
                      {format(new Date(comment.created_at), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#111111] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Delete Post</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleteLoading}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isDeleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetail; 