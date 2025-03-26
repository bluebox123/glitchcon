import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const [allPosts, setAllPosts] = useState([]); // Store all fetched posts
  const [filteredPosts, setFilteredPosts] = useState([]); // Store filtered posts
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
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
      setFilteredPosts(allPosts.map(post => ({ ...post, isContentMatch: false })));
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

    setFilteredPosts(filtered);
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
              username,
              isContentMatch: false
            };
          })
        );
        setAllPosts(postsWithUsernames);
        setFilteredPosts(postsWithUsernames);
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

      {/* Search bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative">
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
                      const button = e.currentTarget;
                      
                      const copyToClipboard = async (text) => {
                        try {
                          if (navigator.clipboard && window.isSecureContext) {
                            await navigator.clipboard.writeText(text);
                            return true;
                          }
                          
                          // Fallback for non-secure contexts
                          const textarea = document.createElement('textarea');
                          textarea.value = text;
                          textarea.style.position = 'fixed';
                          textarea.style.opacity = '0';
                          document.body.appendChild(textarea);
                          textarea.select();
                          
                          try {
                            document.execCommand('copy');
                            document.body.removeChild(textarea);
                            return true;
                          } catch (err) {
                            console.error('Fallback: Oops, unable to copy', err);
                            document.body.removeChild(textarea);
                            return false;
                          }
                        } catch (err) {
                          console.error('Copy failed', err);
                          return false;
                        }
                      };

                      try {
                        const success = await copyToClipboard(url);
                        if (success) {
                          button.classList.add('copied');
                          setTimeout(() => {
                            if (button && button.classList) {
                              button.classList.remove('copied');
                            }
                          }, 2000);
                        }
                      } catch (err) {
                        console.error('Copy operation failed:', err);
                      }
                    }}
                    className="group p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
                    aria-label="Share post"
                  >
                    <svg className="w-5 h-5 transition-all duration-200 group-[.copied]:opacity-0 group-[.copied]:scale-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    <svg 
                      className="w-5 h-5 text-green-500 absolute top-2 left-2 transition-all duration-200 scale-0 opacity-0 group-[.copied]:opacity-100 group-[.copied]:scale-100" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {post.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 line-clamp-3">
                  {post.isContentMatch && searchQuery
                    ? highlightText(createContentSnippet(post.content, searchQuery), searchQuery)
                    : post.content}
                </p>
                
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