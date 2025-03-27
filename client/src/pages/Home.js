import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../config';
import { format } from 'date-fns';

const Home = () => {
  const { user } = useAuth();
  const [allPosts, setAllPosts] = useState([]); // Store all fetched posts
  const [filteredPosts, setFilteredPosts] = useState([]); // Store filtered posts
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortOption, setSortOption] = useState('newest'); // Default sort by newest
  const [showFilters, setShowFilters] = useState(false);
  const [copiedPostId, setCopiedPostId] = useState(null);

  const categories = [
    { id: 'future', label: 'Future of work', color: 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-100' },
    { id: 'collab', label: 'Collaboration', color: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100' },
    { id: 'news', label: 'News', color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' },
    { id: 'knowledge', label: 'Knowledge Management', color: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-100' },
    { id: 'product', label: 'Product', color: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100' },
    { id: 'culture', label: 'Culture', color: 'bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-100' },
    { id: 'tools', label: 'Tool stack', color: 'bg-gray-800 dark:bg-gray-700 text-white' },
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'most_likes', label: 'Most Likes' },
    { value: 'most_views', label: 'Most Views' }
  ];

  const fetchUsername = async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/${userId}`);
      return {
        username: response.data.username,
        avatar_url: response.data.avatar_url
      };
    } catch (error) {
      console.error('Error fetching username:', error);
      return {
        username: 'Unknown User',
        avatar_url: null
      };
    }
  };

  // Helper function to create a snippet around matched text
  const createContentSnippet = (content, searchTerm, snippetLength = 100) => {
    if (!content || !searchTerm) return content;
    
    const lowerContent = content.toLowerCase();
    const lowerSearchTerm = searchTerm.toLowerCase();
    const matchIndex = lowerContent.indexOf(lowerSearchTerm);
    
    if (matchIndex === -1) return content;

    const start = Math.max(0, matchIndex - snippetLength);
    const end = Math.min(content.length, matchIndex + searchTerm.length + snippetLength);
    
    let snippet = content.slice(start, end);
    
    // Add ellipsis if we're not at the start/end of the content
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    
    return snippet;
  };

  // Helper function to highlight matched text
  const highlightText = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === searchTerm.toLowerCase() ? 
        <span key={index} className="bg-yellow-200 dark:bg-yellow-600">{part}</span> : 
        part
    );
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setShowSuggestions(false);

    if (!query.trim()) {
      applyFiltersAndSort(allPosts);
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    const filtered = allPosts.filter(post => {
      // Search in tags
      const tagsMatch = post.tags && post.tags.some(tag => 
        tag.toLowerCase().includes(searchTerm)
      );
      
      // Search in categories
      const categoriesMatch = post.categories && post.categories.some(category => 
        category.toLowerCase().includes(searchTerm)
      );
      
      // Search in title and content
      const titleMatch = post.title.toLowerCase().includes(searchTerm);
      const contentMatch = post.content.toLowerCase().includes(searchTerm);

      // Search in author username
      const authorMatch = post.username && post.username.toLowerCase().includes(searchTerm);
      
      // Add isContentMatch flag to post
      post.isContentMatch = contentMatch;
      
      return tagsMatch || categoriesMatch || titleMatch || contentMatch || authorMatch;
    });

    applyFiltersAndSort(filtered);
  };

  // Apply sorting to the filtered posts
  const applyFiltersAndSort = (posts) => {
    // Apply search filter if search query exists
    const filteredBySearch = posts.filter(post => {
      if (!searchQuery) return true;
      
      const titleMatch = post.title?.toLowerCase().includes(searchQuery.toLowerCase());
      post.isContentMatch = post.content?.toLowerCase().includes(searchQuery.toLowerCase());
      const tagsMatch = post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const categoryMatch = post.categories?.some(category => category.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return titleMatch || post.isContentMatch || tagsMatch || categoryMatch;
    });

    // Sort the filtered posts
    const sortedPosts = [...filteredBySearch].sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'most_likes':
          return (b.likes_count || 0) - (a.likes_count || 0);
        case 'most_views':
          return (b.view_count || 0) - (a.view_count || 0);
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    setFilteredPosts(sortedPosts);
    return sortedPosts;
  };

  // Handle sort option change
  const handleSortChange = (option) => {
    setSortOption(option);
    // Apply the new sort to current filtered posts
    applyFiltersAndSort(filteredPosts);
    setShowFilters(false);
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data: posts } = await axios.get(`${API_BASE_URL}/api/posts`);
      
      // Fetch usernames and avatars for each post
      const postsWithUserData = await Promise.all(
        posts.map(async (post) => {
          let userData = { username: 'Unknown User', avatar_url: null };
          try {
            userData = await fetchUsername(post.user_id);
          } catch (error) {
            console.error(`Error fetching user data for post ${post.id}:`, error);
          }
          
          // Fetch likes count for each post
          let likesCount = 0;
          try {
            const likesResponse = await axios.get(`${API_BASE_URL}/api/posts/${post.id}/likes/count`);
            likesCount = likesResponse.data;
          } catch (error) {
            console.error(`Error fetching likes for post ${post.id}:`, error);
          }
          
          // Fetch view count for each post
          let viewCount = 0;
          try {
            const viewsResponse = await axios.get(`${API_BASE_URL}/api/posts/${post.id}/views`);
            viewCount = viewsResponse.data;
          } catch (error) {
            console.error(`Error fetching views for post ${post.id}:`, error);
          }
          
          return {
            ...post,
            username: userData.username,
            avatar_url: userData.avatar_url,
            likes_count: likesCount,
            view_count: viewCount
          };
        })
      );
      
      setAllPosts(postsWithUserData);
      const filtered = applyFiltersAndSort(postsWithUserData);
      setFilteredPosts(filtered);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (allPosts.length > 0) {
      applyFiltersAndSort(
        searchQuery ? filteredPosts : allPosts
      );
    }
  }, [sortOption]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDefaultAvatar = (username) => {
    const defaultAvatars = [
      '/woman.png',
      '/woman (1).png',
      '/man.png',
      '/man (1).png',
      '/man (2).png',
      '/human.png'
    ];
    
    // Use the username string to consistently pick the same avatar for the same user
    const index = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % defaultAvatars.length;
    return defaultAvatars[index];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Hero Section */}
      <div className="relative z-10 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Your Journey to Innovation
              </span>
              <br />
              Begins Here
            </h1>
            <p className="text-gray-400 text-xl mb-8 max-w-2xl">
              Welcome to Patrika, your gateway to a world where technology meets creativity. Share, learn, and connect with fellow innovators.
            </p>
            <div className="flex space-x-4">
              <Link
                to="/explore"
                className="px-8 py-4 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-md transition-colors"
              >
                Explore Posts
              </Link>
              {!user && (
                <Link
                  to="/signup"
                  className="px-8 py-4 border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black font-semibold rounded-md transition-colors"
                >
                  Join Community
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts
            .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
            .slice(0, 9)
            .map((post, index) => {
              // Calculate opacity class based on which row the post is in
              let opacityClass = '';
              if (index >= 6) {
                opacityClass = 'opacity-40';
              } else if (index >= 3) {
                opacityClass = 'opacity-70';
              }
              
              return (
                <Link
                  key={post.id}
                  to={`/post/${post.id}`}
                  className={`flex flex-col bg-white dark:bg-[#111111] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors duration-200 p-6 shadow-sm hover:shadow-md ${opacityClass}`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={post.avatar_url || getDefaultAvatar(post.username)} 
                        alt={post.username}
                        className="w-10 h-10 rounded-full object-cover bg-gray-100 dark:bg-gray-800"
                      />
                      <div className="flex flex-col">
                        <span className="text-[15px] text-gray-900 dark:text-white font-medium">{post.username || 'Anonymous'}</span>
                        <span className="text-sm text-gray-500">
                          {formatDate(post.created_at)}
                        </span>
                      </div>
                    </div>
                    {post.categories && post.categories[0] && (
                      <span className="px-3 py-1 text-sm bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 rounded-full">
                        {post.categories[0]}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="group">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                      {searchQuery ? highlightText(post.title, searchQuery) : post.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-[15px] leading-relaxed mb-6">
                      {post.isContentMatch && searchQuery
                        ? highlightText(createContentSnippet(post.content, searchQuery), searchQuery)
                        : post.content.substring(0, 120) + '...'}
                    </p>
                  </div>

                  <div className="flex items-center space-x-6 text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className="text-sm">{post.likes_count || 0}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="text-sm">{post.view_count || 0}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>
      </div>

      {/* Stats Section */}
      <div className="border-t border-gray-800 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-500 mb-2">300+</div>
              <div className="text-gray-400">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-500 mb-2">1000+</div>
              <div className="text-gray-400">Posts Created</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-500 mb-2">50+</div>
              <div className="text-gray-400">Categories</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 