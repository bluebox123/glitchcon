import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { user } = useAuth();

  const categories = [
    { id: 'future', label: 'Future of work', color: 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-100' },
    { id: 'collab', label: 'Collaboration', color: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100' },
    { id: 'news', label: 'News', color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' },
    { id: 'knowledge', label: 'Knowledge Management', color: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-100' },
    { id: 'product', label: 'Product', color: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100' },
    { id: 'culture', label: 'Culture', color: 'bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-100' },
    { id: 'tools', label: 'Tool stack', color: 'bg-gray-800 dark:bg-gray-700 text-white' },
  ];

  const fetchUsername = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/users/${userId}`);
      return response.data.username;
    } catch (error) {
      console.error('Error fetching username:', error);
      return 'Unknown User';
    }
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/posts');
        const postsWithUsernames = await Promise.all(
          response.data.map(async (post) => {
            const username = await fetchUsername(post.user_id);
            return {
              ...post,
              username
            };
          })
        );
        setPosts(postsWithUsernames);
      } catch (err) {
        setError('Failed to fetch posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-100 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Blog</h1>
          </div>
        </div>
      </header>

      {/* Category filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                category.color
              } ${
                selectedCategory === category.id ? 'ring-2 ring-offset-2 ring-gray-500 dark:ring-gray-400' : ''
              } hover:opacity-90 transition-all`}
            >
              {category.label}
              <span className="ml-2">×</span>
            </button>
          ))}
        </div>
      </div>

      {/* Posts grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/post/${post.id}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Random gradient background for posts without images */}
              <div className="h-48 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
              
              <div className="p-6">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {new Date(post.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{post.title}</h2>
                <p className="text-gray-600 dark:text-gray-300 line-clamp-3">{post.content}</p>
                
                <div className="mt-4 flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{post.username}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Author</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags && post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div className="text-gray-500 dark:text-gray-400">© 2024 Your Blog. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home; 