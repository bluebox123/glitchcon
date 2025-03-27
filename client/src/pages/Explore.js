import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { format } from 'date-fns';

const Explore = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [sortOption, setSortOption] = useState('newest');

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'most_likes', label: 'Most Likes' },
    { value: 'most_views', label: 'Most Views' }
  ];

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
        <span key={index} className="bg-yellow-100 dark:bg-yellow-900/30">{part}</span> : 
        part
    );
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      applyFiltersAndSort(posts);
    } else {
      const filtered = posts.filter(post => {
        const titleMatch = post.title?.toLowerCase().includes(searchQuery.toLowerCase());
        const contentMatch = post.content?.toLowerCase().includes(searchQuery.toLowerCase());
        const tagsMatch = post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        const categoryMatch = post.categories?.some(category => category.toLowerCase().includes(searchQuery.toLowerCase()));
        const authorMatch = post.username?.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Add isContentMatch flag to post
        post.isContentMatch = contentMatch;
        
        return titleMatch || contentMatch || tagsMatch || categoryMatch || authorMatch;
      });
      applyFiltersAndSort(filtered);
    }
  }, [searchQuery, posts, sortOption]);

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

  const applyFiltersAndSort = (postsToSort) => {
    const sortedPosts = [...postsToSort].sort((a, b) => {
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
  };

  const handleSortChange = (option) => {
    setSortOption(option);
    applyFiltersAndSort(filteredPosts);
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
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
      
      setPosts(postsWithUserData);
      applyFiltersAndSort(postsWithUserData);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search and Sort Section */}
      <div className="mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts, categories, or tags..."
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <select
              value={sortOption}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Link
              key={post.id}
              to={`/post/${post.id}`}
              className="flex flex-col bg-white dark:bg-[#111111] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors duration-200 p-6 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center space-x-3">
                <img 
                  src={post.avatar_url || getDefaultAvatar(post.username)} 
                  alt={post.username}
                  className="w-10 h-10 rounded-full object-cover bg-gray-100 dark:bg-gray-800"
                />
                <div className="flex flex-col">
                  <span className="text-[15px] text-gray-900 dark:text-white font-medium">
                    {post.username || 'Anonymous'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {format(new Date(post.created_at), 'MMMM d, yyyy')}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                  {searchQuery ? highlightText(post.title, searchQuery) : post.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-[15px] leading-relaxed mb-6 line-clamp-2">
                  {post.isContentMatch && searchQuery
                    ? highlightText(createContentSnippet(post.content, searchQuery), searchQuery)
                    : post.content.substring(0, 120) + '...'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {post.categories?.map((category, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 text-sm rounded-full"
                  >
                    {category}
                  </span>
                ))}
              </div>

              <div className="flex items-center space-x-4 mt-auto text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{post.likes_count || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{post.view_count || 0}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore; 