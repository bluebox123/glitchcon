import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const Home = () => {
  const [allPosts, setAllPosts] = useState([]); // Store all fetched posts
  const [filteredPosts, setFilteredPosts] = useState([]); // Store filtered posts
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortOption, setSortOption] = useState('newest'); // Default sort by newest
  const [showFilters, setShowFilters] = useState(false);
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

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'most_likes', label: 'Most Likes' },
  ];

  const fetchUsername = async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/${userId}`);
      return response.data.username;
    } catch (error) {
      console.error('Error fetching username:', error);
      return 'Unknown User';
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
    let sortedPosts = [...posts];
    
    switch(sortOption) {
      case 'newest':
        sortedPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        sortedPosts.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'most_likes':
        sortedPosts.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
        break;
      default:
        // Default to newest first
        sortedPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    setFilteredPosts(sortedPosts);
  };

  // Handle sort option change
  const handleSortChange = (option) => {
    setSortOption(option);
    // Apply the new sort to current filtered posts
    applyFiltersAndSort(filteredPosts);
    setShowFilters(false);
  };

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/posts`);
      
      // Fetch likes count for each post
      const postsWithLikes = await Promise.all(
        response.data.map(async (post) => {
          try {
            const likesResponse = await axios.get(`${API_BASE_URL}/api/posts/${post.id}/likes/count`);
            return {
              ...post,
              likes_count: likesResponse.data
            };
          } catch (error) {
            console.error(`Error fetching likes for post ${post.id}:`, error);
            return {
              ...post,
              likes_count: 0
            };
          }
        })
      );
      
      const postsWithUsernames = await Promise.all(
        postsWithLikes.map(async (post) => {
          const username = await fetchUsername(post.user_id);
          return {
            ...post,
            username,
            isContentMatch: false
          };
        })
      );
      
      setAllPosts(postsWithUsernames);
      applyFiltersAndSort(postsWithUsernames);
    } catch (err) {
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
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Blog</h1>
          </div>
        </div>
      </header>

      {/* Search and filter bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                // Small delay to allow clicking on suggestions
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              placeholder="Search by content, tags, categories, or author..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
            />
            {showSuggestions && (
              <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleSearch(category.label)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              <span>Filter & Sort</span>
              <span className="ml-1 text-xs">({sortOptions.find(option => option.value === sortOption)?.label})</span>
            </button>
            
            {showFilters && (
              <div className="absolute right-0 z-10 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="p-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort by</p>
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSortChange(option.value)}
                      className={`w-full text-left px-4 py-2 rounded-md mb-1 ${
                        sortOption === option.value
                          ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-100'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Filter Summary */}
        {sortOption !== 'newest' && (
          <div className="mt-4 text-sm flex items-center">
            <span className="text-gray-500 dark:text-gray-400">Sorted by: </span>
            <span className="ml-2 px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-100 rounded-full flex items-center">
              {sortOptions.find(option => option.value === sortOption)?.label}
              <button 
                onClick={() => handleSortChange('newest')}
                className="ml-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Posts grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <Link
              key={post.id}
              to={`/post/${post.id}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-black/40 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300"
            >
              {/* Random gradient background for posts without images */}
              <div className="h-48 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(post.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const url = `${window.location.origin}/post/${post.id}`;
                      
                      try {
                        if (navigator.clipboard && window.isSecureContext) {
                          await navigator.clipboard.writeText(url);
                          alert('Post link copied to clipboard!');
                        } else {
                          // Fallback for non-secure contexts
                          const textarea = document.createElement('textarea');
                          textarea.value = url;
                          textarea.style.position = 'fixed';
                          textarea.style.opacity = '0';
                          document.body.appendChild(textarea);
                          textarea.select();
                          document.execCommand('copy');
                          document.body.removeChild(textarea);
                          alert('Post link copied to clipboard!');
                        }
                      } catch (err) {
                        console.error('Copy failed', err);
                        alert('Failed to copy link');
                      }
                    }}
                    className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    aria-label="Share post"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </button>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {searchQuery ? highlightText(post.title, searchQuery) : post.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                  {post.isContentMatch && searchQuery
                    ? highlightText(createContentSnippet(post.content, searchQuery), searchQuery)
                    : post.content.substring(0, 150) + (post.content.length > 150 ? '...' : '')}
                </p>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex flex-wrap gap-2">
                    {post.tags && post.tags.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-100"
                      >
                        {searchQuery ? highlightText(tag, searchQuery) : tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-red-500 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      {post.likes_count || 0}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          
          {filteredPosts.length === 0 && (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-16">
              <p className="text-gray-600 dark:text-gray-400 text-lg">No posts found matching your criteria</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSortOption('newest');
                  applyFiltersAndSort(allPosts);
                }}
                className="mt-4 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home; 