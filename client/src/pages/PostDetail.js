import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

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
  const [authorName, setAuthorName] = useState('');

  const fetchLikesCount = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/posts/${id}/likes/count`);
      setLikesCount(response.data);
    } catch (error) {
      console.error('Error fetching likes count:', error);
    }
  };

  const fetchAuthorName = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/users/${userId}`);
      setAuthorName(response.data.username);
    } catch (error) {
      console.error('Error fetching author name:', error);
      setAuthorName('Unknown User');
    }
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const [postResponse, commentsResponse] = await Promise.all([
          axios.get(`http://localhost:5000/api/posts/${id}`),
          axios.get(`http://localhost:5000/api/comments/post/${id}`)
        ]);
        setPost(postResponse.data);
        setComments(commentsResponse.data);

        // Fetch author name using the user_id from the post
        if (postResponse.data.user_id) {
          await fetchAuthorName(postResponse.data.user_id);
        }

        // Check if user has liked the post
        if (user) {
          const token = localStorage.getItem('token');
          const likesResponse = await axios.get(
            `http://localhost:5000/api/posts/${id}/likes`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
          setIsLiked(likesResponse.data.includes(user.id));
        }

        // Fetch initial likes count
        await fetchLikesCount();
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to fetch post');
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
        `http://localhost:5000/api/comments`,
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
      
      // Use the same endpoint for both liking and unliking
      await axios.post(
        `http://localhost:5000/api/posts/${id}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Toggle the like state and update the count
      setIsLiked(!isLiked);
      // Fetch updated likes count
      await fetchLikesCount();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update like');
      setTimeout(() => setError(''), 3000);
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
        <div className="flex items-center text-gray-600 mb-4">
          <span>By {authorName}</span>
          <span className="mx-2">•</span>
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
        </div>
        <div className="prose max-w-none mb-4">{post.content}</div>
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